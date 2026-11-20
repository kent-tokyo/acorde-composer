const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const site = path.resolve(__dirname, '..', '_site');
const output = path.resolve(process.argv[2] || '');
if (!process.argv[2]) throw new Error('Pass an output directory for the exported examples.');
if (!fs.existsSync(path.join(site, 'playground/index.html'))) throw new Error('Run npm run assemble:playground first.');

function wav(events) {
  const rate = 22050;
  const duration = Math.max(...events.map((event) => event.time_secs + event.duration_secs), 0) + 0.3;
  const samples = new Float32Array(Math.ceil(duration * rate));
  for (const event of events) {
    if (!Number.isFinite(event.pitch_midi) || !Number.isFinite(event.time_secs) || !Number.isFinite(event.duration_secs)) continue;
    const start = Math.max(0, Math.floor(event.time_secs * rate));
    const length = Math.max(1, Math.floor(event.duration_secs * rate));
    const frequency = 440 * 2 ** ((event.pitch_midi - 69) / 12);
    const level = Math.min(0.14, Math.max(0.02, (event.velocity || 80) / 900));
    for (let offset = 0; offset < length && start + offset < samples.length; offset++) {
      const phase = 2 * Math.PI * frequency * offset / rate;
      const triangle = 2 / Math.PI * Math.asin(Math.sin(phase));
      const envelope = Math.min(1, offset / (rate * 0.015)) * Math.min(1, (length - offset) / (rate * 0.055));
      samples[start + offset] += triangle * level * envelope;
    }
  }
  let peak = 0;
  for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
  const scale = peak > 0.88 ? 0.88 / peak : 1;
  const buffer = Buffer.alloc(44 + samples.length * 2);
  buffer.write('RIFF', 0); buffer.writeUInt32LE(buffer.length - 8, 4); buffer.write('WAVEfmt ', 8);
  buffer.writeUInt32LE(16, 16); buffer.writeUInt16LE(1, 20); buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(rate, 24); buffer.writeUInt32LE(rate * 2, 28); buffer.writeUInt16LE(2, 32); buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36); buffer.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++) buffer.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i] * scale)) * 32767), 44 + i * 2);
  return buffer;
}

const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.wasm': 'application/wasm' };
const server = http.createServer((request, response) => {
  const relative = decodeURIComponent(new URL(request.url, 'http://localhost').pathname).replace(/^\/+/, '');
  let file = path.resolve(site, relative);
  if (!file.startsWith(site + path.sep)) { response.writeHead(403).end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) { response.writeHead(404).end(); return; }
  response.writeHead(200, { 'content-type': mime[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(response);
});

async function downloaded(page, frame) {
  const pending = page.waitForEvent('download');
  await frame.locator('#download-button').click();
  const item = await pending;
  const chunks = [];
  for await (const chunk of await item.createReadStream()) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function events(frame, button) {
  await frame.locator(button).click();
  await frame.locator('#status').getByText(/^Playing /).waitFor();
  const result = await frame.locator('body').evaluate(() => window.exportEvents || []);
  await frame.locator('#stop-button').click();
  if (!result.length) throw new Error(`No playback events from ${button}`);
  return result;
}

async function main() {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true });
  try {
    fs.mkdirSync(output, { recursive: true });
    const manifest = [];
    for (const sample of ['four-four', 'waltz', 'harmony']) {
      const page = await browser.newPage({ acceptDownloads: true });
      await page.goto(`http://127.0.0.1:${server.address().port}/playground/?sample=${sample}`, { waitUntil: 'networkidle' });
      const frame = page.frameLocator('iframe[title="Acorde Composer browser playground"]');
      await frame.locator('#engine-status').getByText('acorde engine ready').waitFor();
      await frame.locator('body').evaluate(() => {
        const original = window.AcordeAudioBackend.prototype.schedule;
        window.AcordeAudioBackend.prototype.schedule = function (played, ...args) {
          window.exportEvents = played;
          return original.call(this, played, ...args);
        };
      });
      fs.writeFileSync(path.join(output, `${sample}-original.svg`), await frame.locator('#score-view svg').evaluate((element) => element.outerHTML));
      fs.writeFileSync(path.join(output, `${sample}-original.musicxml`), await downloaded(page, frame));
      const sourceEvents = await events(frame, '#play-source-button');
      if (sample === 'harmony') await frame.locator('#voice-select').selectOption('third-below');
      await frame.locator('#arrange-button').click();
      const summary = await frame.locator('#arrangement-summary').textContent();
      if (!/^Arrangement ready: \d+ added notes\./.test(summary || '')) throw new Error(`${sample}: ${summary}`);
      fs.writeFileSync(path.join(output, `${sample}-arranged.svg`), await frame.locator('#score-view svg').evaluate((element) => element.outerHTML));
      fs.writeFileSync(path.join(output, `${sample}-arranged.musicxml`), await downloaded(page, frame));
      const arrangedEvents = await events(frame, '#play-arranged-button');
      fs.writeFileSync(path.join(output, `${sample}-original.wav`), wav(sourceEvents));
      fs.writeFileSync(path.join(output, `${sample}-arranged.wav`), wav(arrangedEvents));
      manifest.push({ sample, summary, sourceEvents: sourceEvents.length, arrangedEvents: arrangedEvents.length });
      await page.close();
    }
    fs.writeFileSync(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
    console.log(JSON.stringify(manifest));
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; server.close(); });
