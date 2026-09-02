const test = require('node:test');
const assert = require('node:assert/strict');
const { MAX_SOUNDFONT_BYTES, inspectSoundfontAsset } = require('./soundfont-asset.cjs');

test('SoundFont asset validation accepts bounded SF2/SF3 files', () => {
  assert.deepEqual(inspectSoundfontAsset('/assets/piano.sf2', { isFile: true, size: 1024 }), {
    exists: true, path: '/assets/piano.sf2', reason: null, sizeBytes: 1024, maxBytes: MAX_SOUNDFONT_BYTES,
  });
  assert.equal(inspectSoundfontAsset('/assets/piano.sf3', { isFile: true, size: 0 }).exists, true);
});

test('SoundFont asset validation rejects unsupported, non-file, and oversized assets', () => {
  assert.equal(inspectSoundfontAsset('/assets/piano.wav', { isFile: true, size: 1 }).reason, 'unsupported-extension');
  assert.equal(inspectSoundfontAsset('/assets/piano.sf2', { isFile: false, size: 1 }).reason, 'not-file');
  assert.equal(inspectSoundfontAsset('/assets/piano.sf2', { isFile: true, size: MAX_SOUNDFONT_BYTES + 1 }).reason, 'too-large');
  assert.equal(inspectSoundfontAsset('/assets/piano.sf2', null).reason, 'missing');
});
