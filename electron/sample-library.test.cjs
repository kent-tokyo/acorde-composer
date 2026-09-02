const test = require('node:test');
const assert = require('node:assert/strict');
const { assessSampleLibrary, canActivateSampleLibrary, manifestWithinLimit, normalizeSampleLibrary, normalizeSampleLibraryRecord, transitionSampleLibrary } = require('./sample-library.cjs');

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

test('sample library lifecycle activates and updates only validated external manifests', () => {
  const installed = transitionSampleLibrary(null, 'install', VALID_LIBRARY);
  assert.equal(installed.status, 'installed');
  const active = transitionSampleLibrary(installed, 'activate');
  assert.equal(active.active, true);
  const updated = transitionSampleLibrary(active, 'update', { ...VALID_LIBRARY, version: '2026.2' });
  assert.equal(updated.status, 'inactive');
  assert.equal(updated.version, '2026.2');
  assert.equal(transitionSampleLibrary(updated, 'activate').active, true);
  assert.equal(transitionSampleLibrary(updated, 'remove').status, 'removed');
});

test('sample library lifecycle rejects identity changes and unreviewed activation', () => {
  const mismatch = transitionSampleLibrary(VALID_LIBRARY, 'update', { ...VALID_LIBRARY, id: 'other' });
  assert.deepEqual(mismatch.diagnostics, ['library-id-mismatch']);
  const unreviewed = normalizeSampleLibraryRecord({ ...VALID_LIBRARY, licenseStatus: 'unreviewed' });
  assert.equal(transitionSampleLibrary(unreviewed, 'activate').active, false);
});
