const test = require('node:test');
const assert = require('node:assert/strict');
const { createReleaseMetadata, isReleaseMetadataValid, verifyReleaseMetadata } = require('./release-metadata.cjs');

const RELEASE = { version: '0.1.6', commit: 'abc123', target: 'darwin-arm64', engineVersion: '1.0.8', buildType: 'release', signed: true, checksums: { app: 'a'.repeat(64) } };

test('release metadata is deterministic for the same release inputs', () => {
  const first = createReleaseMetadata(RELEASE);
  const second = createReleaseMetadata(RELEASE);
  assert.equal(first.product, 'Acorde Composer');
  assert.equal(first.inputDigest, second.inputDigest);
  assert.equal(isReleaseMetadataValid(first), true);
});

test('debug, unsigned, or incomplete metadata cannot pass release validation', () => {
  assert.equal(isReleaseMetadataValid({ ...RELEASE, buildType: 'debug' }), false);
  assert.equal(isReleaseMetadataValid({ ...RELEASE, signed: false }), false);
  assert.equal(isReleaseMetadataValid({ ...RELEASE, checksums: {} }), false);
});

test('release metadata verification detects input tampering', () => {
  const metadata = createReleaseMetadata(RELEASE);
  assert.deepEqual(verifyReleaseMetadata(metadata), { valid: true, diagnostics: [] });
  assert.deepEqual(verifyReleaseMetadata({ ...metadata, target: 'win32-x64' }), { valid: false, diagnostics: ['release-metadata-invalid-or-tampered'] });
});
