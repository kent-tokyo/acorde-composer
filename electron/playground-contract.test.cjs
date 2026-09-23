const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const page = fs.readFileSync(path.join(root, 'src/playground/index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'src/playground/playground.js'), 'utf8');
const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
const packageManifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const pagesWorkflow = fs.readFileSync(path.join(root, '.github/workflows/pages-playground.yml'), 'utf8');
const e2e = fs.readFileSync(path.join(root, 'scripts/test-playground-e2e.cjs'), 'utf8');

test('browser playground is a local-first Acorde WASM demo', () => {
  assert.match(page, /meta name="description"/);
  assert.match(page, /id="add-note-button"/);
  assert.match(page, /id="load-abc-button"/);
  assert.match(page, /id="download-button"/);
  assert.match(page, /id="pitch-select"/);
  assert.match(page, /id="duration-select"/);
  assert.match(page, /id="add-measure-button"/);
  assert.match(page, /id="tempo-input"/);
  assert.match(page, /class="playground-editor-toolbar" role="toolbar"/);
  assert.match(page, /id="add-note-button"[\s\S]*id="add-rest-button"[\s\S]*id="duration-select"[\s\S]*id="add-measure-button"/);
  assert.match(page, /class="toolbar-group toolbar-history"[\s\S]*id="undo-button"[\s\S]*id="redo-button"/);
  assert.equal((page.match(/id="add-note-button"/g) || []).length, 1);
  assert.equal((page.match(/id="undo-button"/g) || []).length, 1);
  assert.match(page, /id="language-select"/);
  assert.match(page, /value="en">English/);
  assert.match(page, /value="ja">日本語/);
  assert.match(page, /value="zh">简体中文/);
  assert.match(script, /from '\.\/acorde-wasm\/acorde_wasm\.js'/);
  assert.match(script, /parse_abc/);
  assert.match(script, /render_score_svg/);
  assert.match(script, /serialize_musicxml/);
  assert.match(script, /new acorde\.ScoreEngine/);
  assert.match(script, /const duration = \$\('duration-select'\)\.value/);
  assert.match(script, /position: voice\.length/);
  assert.match(script, /type: 'add_measure'/);
  assert.match(script, /type: 'set_tempo'/);
  assert.match(script, /data-acorde-kind="note"/);
  assert.match(script, /score-view.*addEventListener\('click'/s);
  assert.match(script, /acorde-composer\.language\.v1/);
  assert.match(script, /document\.documentElement\.lang = language/);
  assert.match(script, /applyLanguage/);
  assert.doesNotMatch(script, /tone|vexflow|music21/i);
});

test('repository documentation opens the deployed playground, not its source directory', () => {
  assert.match(readme, /https:\/\/kent-tokyo\.github\.io\/acorde-composer\/playground\//);
  assert.doesNotMatch(readme, /\[Browser playground\]\(src\/playground\/\)/);
  assert.match(page, /href="https:\/\/github\.com\/kent-tokyo\/acorde-composer"/);
  assert.equal((page.match(/id="load-abc-button"/g) || []).length, 1);
  assert.equal((page.match(/id="abc-input"/g) || []).length, 1);
});

test('Pages deployment retains the generated-site browser E2E gate', () => {
  assert.equal(packageManifest.scripts['test:playground'], 'node scripts/assemble-playground-site.cjs && node scripts/test-playground-e2e.cjs --site-dir _site');
  assert.match(pagesWorkflow, /npx playwright install --with-deps chromium/);
  assert.match(pagesWorkflow, /npm run test:playground/);
  assert.match(e2e, /application\/wasm/);
  assert.match(e2e, /Acorde WASM did not become ready/);
  assert.match(e2e, /Note edit did not complete/);
  assert.match(e2e, /ABC import did not complete/);
  assert.match(e2e, /acorde-playground\.musicxml/);
});
