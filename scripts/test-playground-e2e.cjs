const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const siteArgument = process.argv.indexOf('--site-dir');
const site = path.resolve(root, siteArgument >= 0 ? process.argv[siteArgument + 1] : '_site');
const MIME_TYPES = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'application/javascript; charset=utf-8'],
  ['.wasm', 'application/wasm'],
]);

function resolveFile(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl, 'http://localhost').pathname);
  const relativePath = path.posix.normalize(pathname).replace(/^\/+/, '');
  let target = path.resolve(site, relativePath);
  if (target !== site && !target.startsWith(`${site}${path.sep}`)) return null;
  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
  return fs.existsSync(target) && fs.statSync(target).isFile() ? target : null;
}

function startServer() {
  const server = http.createServer((request, response) => {
    const target = resolveFile(request.url || '/');
    if (!target) {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }
    response.writeHead(200, {
      'cache-control': 'no-store',
      'content-type': MIME_TYPES.get(path.extname(target)) || 'application/octet-stream',
    });
    fs.createReadStream(target).pipe(response);
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

async function waitForText(locator, expected, message) {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    const text = await locator.textContent().catch(() => '');
    if (expected.test(text || '')) return text;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`${message}; expected ${expected}`);
}

async function readStream(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

async function main() {
  assert.ok(fs.existsSync(site), `Playground site does not exist: ${site}`);
  const server = await startServer();
  const port = server.address().port;
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ acceptDownloads: true });
    await context.addInitScript(() => localStorage.setItem('acorde-composer.language.v1', 'en'));
    const page = await context.newPage();
    await page.goto(`http://127.0.0.1:${port}/playground/`, { waitUntil: 'networkidle' });

    assert.equal(await page.locator('iframe[title="Acorde Composer browser playground"]').count(), 1);
    const playground = page.frameLocator('iframe[title="Acorde Composer browser playground"]');
    await waitForText(playground.locator('#engine-status'), /^acorde engine ready$/, 'Acorde WASM did not become ready');
    assert.equal(await playground.locator('#abc-input').count(), 1);
    assert.equal(await playground.locator('#load-abc-button').count(), 1);
    assert.equal(await playground.locator('#add-note-button').isEnabled(), true);
    assert.equal(await playground.locator('#add-measure-button').isEnabled(), true);
    assert.equal(await playground.locator('#apply-tempo-button').isEnabled(), true);
    assert.equal(await playground.locator('#download-button').isEnabled(), true);

    await playground.locator('#pitch-select').selectOption('D4');
    await playground.locator('#duration-select').selectOption('Half');
    await playground.locator('#add-note-button').click();
    await waitForText(playground.locator('#status'), /^Added a D4 Half note\.$/, 'Note edit did not complete');
    await playground.locator('#add-rest-button').click();
    await waitForText(playground.locator('#status'), /^Added a Half rest\.$/, 'Rest edit did not complete');
    await playground.locator('#add-measure-button').click();
    await waitForText(playground.locator('#status'), /^Added a measure\.$/, 'Measure edit did not complete');
    await playground.locator('#tempo-input').fill('144');
    await playground.locator('#apply-tempo-button').click();
    await waitForText(playground.locator('#status'), /^Tempo set to 144 BPM\.$/, 'Tempo edit did not complete');

    await playground.locator('#abc-input').fill('X:1\nT:Playground E2E\nM:4/4\nL:1/4\nK:C\nC2 D2 |');
    await playground.locator('#load-abc-button').click();
    await waitForText(playground.locator('#status'), /^ABC parsed by acorde and loaded into the editor\.$/, 'ABC import did not complete');
    assert.equal(await playground.locator('#score-title').innerText(), 'Playground E2E');

    const downloadPromise = page.waitForEvent('download');
    await playground.locator('#download-button').click();
    const download = await downloadPromise;
    assert.equal(download.suggestedFilename(), 'acorde-playground.musicxml');
    const stream = await download.createReadStream();
    assert.ok(stream, 'MusicXML download stream is unavailable');
    assert.match(await readStream(stream), /<score-partwise/);
    console.log('Playground E2E passed: WASM boot, edit, ABC import, and MusicXML export.');
  } finally {
    await browser?.close();
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
