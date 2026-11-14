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
  throw new Error(`${message}; expected ${expected}; received ${JSON.stringify(await locator.textContent().catch(() => ''))}`);
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
    assert.equal(await playground.locator('.playground-editor-toolbar').getAttribute('role'), 'toolbar');
    assert.equal(await playground.locator('.playground-editor-toolbar #add-note-button').count(), 1);
    assert.equal(await playground.locator('.toolbar-history #undo-button').count(), 1);
    assert.equal(await playground.locator('#add-note-button').isEnabled(), true);
    assert.equal(await playground.locator('#add-measure-button').isEnabled(), true);
    assert.equal(await playground.locator('#apply-tempo-button').isEnabled(), true);
    assert.equal(await playground.locator('#download-button').isEnabled(), true);

    let lastArrangedXml = '';
    for (const sample of ['four-four', 'waltz', 'swing']) {
      await playground.locator('#sample-select').selectOption(sample);
      assert.equal(await playground.locator('#preset-options button[aria-pressed="true"]').getAttribute('data-preset'), sample === 'swing' ? 'swing-pulse' : sample === 'waltz' ? 'waltz-bass' : 'bass-pulse');
      await playground.locator('#arrange-button').click();
      await waitForText(playground.locator('#arrangement-summary'), /^Arrangement ready: \d+ added notes\./, `${sample} arrangement failed`);
      assert.equal(await playground.locator('#play-arranged-button').isEnabled(), true);
      assert.equal(await playground.locator('#play-accompaniment-button').isEnabled(), true);
      const arrangedDownload = page.waitForEvent('download');
      await playground.locator('#download-button').click();
      const arranged = await arrangedDownload;
      assert.equal(arranged.suggestedFilename(), 'acorde-arrangement.musicxml');
      const arrangedXml = await readStream(await arranged.createReadStream());
      assert.match(arrangedXml, /<score-partwise/);
      lastArrangedXml = arrangedXml;
      await playground.locator('#play-source-button').click();
      await waitForText(playground.locator('#status'), /^Playing Play original\.$/, 'Original playback did not start');
      await playground.locator('#stop-button').click();
      await playground.locator('#play-accompaniment-button').click();
      await waitForText(playground.locator('#status'), /^Playing Accompaniment only\.$/, 'Accompaniment playback did not start');
      await playground.locator('#stop-button').click();
      await playground.locator('#restore-button').click();
      assert.equal(await playground.locator('#play-arranged-button').isEnabled(), false);
    }
    await playground.locator('#sample-select').selectOption('harmony');
    await playground.locator('#voice-select').selectOption('third-below');
    await playground.locator('#arrange-button').click();
    await waitForText(playground.locator('#arrangement-summary'), /^Arrangement ready: \d+ added notes\./, 'Third-below layer failed');
    await playground.locator('#voice-select').selectOption('sixth-below');
    await playground.locator('#arrange-button').click();
    await waitForText(playground.locator('#arrangement-summary'), /^Arrangement ready: \d+ added notes\./, 'Sixth-below layer failed');
    assert.ok(await playground.locator('#saved-candidates button').count() >= 2);
    await playground.locator('body').evaluate(() => {
      const original = window.AcordeAudioBackend.prototype.schedule;
      window.AcordeAudioBackend.prototype.schedule = function (events, ...args) {
        window.accompanimentTestEvents = events;
        return original.call(this, events, ...args);
      };
    });
    await playground.locator('#play-accompaniment-button').click();
    const accompanimentStaffs = await playground.locator('body').evaluate(() => [...new Set(window.accompanimentTestEvents.map((event) => event.address?.split(':')[1]))]);
    assert.deepEqual(accompanimentStaffs, ['1'], 'Accompaniment-only playback included the added melodic voice');
    await playground.locator('#stop-button').click();
    await playground.locator('#score-file').setInputFiles({ name: 'arrangement.musicxml', mimeType: 'application/vnd.recordare.musicxml+xml', buffer: Buffer.from(lastArrangedXml) });
    await waitForText(playground.locator('#status'), /arrangement\.musicxml loaded\./, 'MusicXML import failed');
    assert.equal(await playground.locator('#melody-select').isEnabled(), true);
    await playground.locator('#melody-select').selectOption('0:0:0');
    assert.equal(await playground.locator('#arrange-button').isEnabled(), true, await playground.locator('#status').textContent());
    await playground.locator('#arrange-button').click();
    await waitForText(playground.locator('#arrangement-summary'), /^Arrangement ready: \d+ added notes\./, 'Imported melody arrangement failed');
    const waltzAbc = 'X:1\nT:Own waltz\nM:3/4\nL:1/4\nK:C\nC E G | A G E | F A c | G E C |';
    await playground.locator('#score-file').setInputFiles({ name: 'own-waltz.abc', mimeType: 'text/plain', buffer: Buffer.from(waltzAbc) });
    await waitForText(playground.locator('#status'), /own-waltz\.abc loaded\./, 'ABC file import failed');
    assert.equal(await playground.locator('#preset-options button[aria-pressed="true"]').getAttribute('data-preset'), 'waltz-bass');
    await playground.locator('#arrange-button').click();
    await waitForText(playground.locator('#arrangement-summary'), /^Arrangement ready: \d+ added notes\./, 'Imported waltz arrangement failed');
    await playground.locator('#restore-button').click();
    await playground.locator('#saved-candidates button').first().focus();
    await page.keyboard.press('Enter');
    assert.equal(await playground.locator('#play-arranged-button').isEnabled(), true);
    await playground.locator('#language-select').selectOption('ja');
    assert.match(await playground.locator('#hero-title').textContent(), /編曲/);
    await playground.locator('#sample-select').selectOption('four-four');
    await playground.locator('#voice-select').selectOption('third-below');
    await playground.locator('#arrange-button').click();
    await waitForText(playground.locator('#arrangement-summary'), /追加旋律に合うコード音がありません。.*第\d+小節/, 'Localized harmony guidance was not shown');
    await playground.locator('#language-select').selectOption('zh');
    assert.match(await playground.locator('#hero-title').textContent(), /编曲/);
    await playground.locator('#language-select').selectOption('en');
    await playground.locator('#sample-select').selectOption('four-four');
    await playground.locator('.editing-details summary').click();

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
    for (const width of [390, 374, 320]) {
      await page.setViewportSize({ width, height: 844 });
      const mobileLayout = await playground.locator('body').evaluate((body) => ({
        overflow: body.scrollWidth - window.innerWidth,
        viewport: window.innerWidth,
        offenders: [...body.querySelectorAll('*')].map((element) => ({ tag: element.tagName.toLowerCase(), id: element.id, className: typeof element.className === 'string' ? element.className : '', right: Math.round(element.getBoundingClientRect().right), scrollWidth: element.scrollWidth })).filter((item) => item.right > window.innerWidth + 1).slice(0, 12),
      }));
      assert.ok(mobileLayout.overflow <= 1, `Playground mobile overflow at ${width}px: ${JSON.stringify(mobileLayout)}`);
    }
    console.log('Playground E2E passed: WASM arrangement, A/B playback, added voices, MusicXML round trip, editing, localization, and mobile layout.');
  } finally {
    await browser?.close();
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
