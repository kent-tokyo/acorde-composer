const test = require('node:test');
const assert = require('node:assert/strict');
const { addComposerImportWarnings } = require('./import-diagnostics.cjs');

test('adds a visible warning when MusicXML contains a second voice', () => {
  const report = addComposerImportWarnings({ diagnostics: [] }, '<note><voice>2</voice></note>');
  assert.equal(report.diagnostics.length, 1);
  assert.equal(report.diagnostics[0].code, 'composer.musicxml-multiple-voices');
});

test('does not warn for single-voice MusicXML and preserves existing diagnostics', () => {
  const report = addComposerImportWarnings({ diagnostics: [{ code: 'existing' }] }, '<note><voice>1</voice></note>');
  assert.deepEqual(report.diagnostics, [{ code: 'existing' }]);
});

test('does not report the retired flattening warning when acorde preserves parsed voices', () => {
  const report = addComposerImportWarnings({ diagnostics: [], score: { parts: [{ staves: [{ measures: [{ voices: [[{ id: 'v1' }], [{ id: 'v2' }]] }] }] }] } }, '<note><voice>1</voice></note><note><voice>2</voice></note>');
  assert.deepEqual(report.diagnostics, []);
});
