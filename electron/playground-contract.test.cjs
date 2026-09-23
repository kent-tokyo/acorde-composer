const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const page = fs.readFileSync(path.join(root, 'src/playground/index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'src/playground/playground.js'), 'utf8');
const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');

test('browser playground is a local-first Acorde WASM demo', () => {
  assert.match(page, /meta name="description"/);
  assert.match(page, /id="add-note-button"/);
  assert.match(page, /id="load-abc-button"/);
  assert.match(page, /id="download-button"/);
  assert.match(page, /id="language-select"/);
  assert.match(page, /value="en">English/);
  assert.match(page, /value="ja">日本語/);
  assert.match(page, /value="zh">简体中文/);
  assert.match(script, /from '\.\/acorde-wasm\/acorde_wasm\.js'/);
  assert.match(script, /parse_abc/);
  assert.match(script, /render_score_svg/);
  assert.match(script, /serialize_musicxml/);
  assert.match(script, /new acorde\.ScoreEngine/);
  assert.match(script, /duration: 'Quarter'/);
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
