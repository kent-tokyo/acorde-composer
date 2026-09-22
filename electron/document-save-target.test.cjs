const test = require('node:test');
const assert = require('node:assert/strict');
const { DocumentSaveTargets, ensureMusicXmlPath, isMusicXmlPath } = require('./document-save-target.cjs');

test('only MusicXML documents become in-place save targets', () => {
  const targets = new DocumentSaveTargets();
  targets.trackOpened(1, '/scores/source.mid');
  assert.equal(targets.get(1), null);
  targets.trackOpened(1, '/scores/source.musicxml');
  assert.equal(targets.get(1), '/scores/source.musicxml');
  targets.trackOpened(1, '/scores/import.abc');
  assert.equal(targets.get(1), null);
});

test('save-as targets are normalized and isolated per window', () => {
  const targets = new DocumentSaveTargets();
  assert.equal(targets.set(1, '/scores/untitled'), '/scores/untitled.musicxml');
  targets.set(2, 'C:\\scores\\other.xml');
  assert.equal(targets.get(1), '/scores/untitled.musicxml');
  assert.equal(targets.get(2), 'C:\\scores\\other.xml');
  targets.clear(1);
  assert.equal(targets.get(1), null);
});

test('MusicXML path helpers reject empty paths without rewriting valid extensions', () => {
  assert.equal(isMusicXmlPath('/scores/score.XML'), true);
  assert.equal(isMusicXmlPath('/scores/score.mxl'), false);
  assert.equal(ensureMusicXmlPath('/scores/score.musicxml'), '/scores/score.musicxml');
  assert.throws(() => ensureMusicXmlPath(''), /required/);
});
