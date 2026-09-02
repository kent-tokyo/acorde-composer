const test = require('node:test');
const assert = require('node:assert/strict');
const { assessSampleLibrary, canActivateSampleLibrary, manifestWithinLimit, normalizeSampleLibrary } = require('./sample-library.cjs');

const VALID_LIBRARY = {
  id: 'external-orchestra', name: 'External Orchestra', provider: 'licensed-provider', version: '2026.1',
  rootPath: '/opt/sounds/orchestra', checksum: 'A'.repeat(64), offline: true, redistributable: false,
  licenseStatus: 'accepted', instruments: ['piano', 'strings'],
};

test('sample library manifest normalizes identity, portability, and license fields', () => {
  assert.deepEqual(normalizeSampleLibrary(VALID_LIBRARY), { ...VALID_LIBRARY, checksum: 'a'.repeat(64) });
  assert.equal(canActivateSampleLibrary(VALID_LIBRARY), true);
  assert.equal(manifestWithinLimit(VALID_LIBRARY), true);
});

test('unreviewed or incomplete sample libraries cannot be activated', () => {
  assert.equal(canActivateSampleLibrary({ ...VALID_LIBRARY, licenseStatus: 'unreviewed' }), false);
  assert.equal(canActivateSampleLibrary({ ...VALID_LIBRARY, checksum: 'not-a-checksum' }), false);
  assert.equal(canActivateSampleLibrary({ ...VALID_LIBRARY, version: null }), false);
});

test('sample library assessment reports offline portability and license diagnostics', () => {
  assert.deepEqual(assessSampleLibrary(VALID_LIBRARY, { offlineRequired: true }).diagnostics, []);
  assert.equal(assessSampleLibrary(VALID_LIBRARY, { offlineRequired: true }).portable, true);
  const unavailable = assessSampleLibrary({ ...VALID_LIBRARY, offline: false }, { offlineRequired: true });
  assert.deepEqual(unavailable.diagnostics, ['offline-unavailable']);
  assert.equal(unavailable.usable, false);
  assert.deepEqual(assessSampleLibrary({ ...VALID_LIBRARY, licenseStatus: 'unreviewed' }).diagnostics, ['license-unreviewed']);
});
