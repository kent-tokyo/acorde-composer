const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const page = fs.readFileSync(path.join(root, 'src/playground/index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'src/playground/playground.js'), 'utf8');

test('browser playground is a local-first Acorde WASM demo', () => {
  assert.match(page, /meta name="description"/);
  assert.match(page, /id="add-note-button"/);
  assert.match(page, /id="load-abc-button"/);
  assert.match(page, /id="download-button"/);
  assert.match(script, /from '\.\/acorde-wasm\/acorde_wasm\.js'/);
  assert.match(script, /parse_abc/);
  assert.match(script, /render_score_svg/);
  assert.match(script, /serialize_musicxml/);
  assert.match(script, /new acorde\.ScoreEngine/);
  assert.doesNotMatch(script, /tone|vexflow|music21/i);
});
