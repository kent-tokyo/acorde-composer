const test = require('node:test');
const assert = require('node:assert/strict');
const { MAX_SUPPORT_BUNDLE_BYTES, createSupportBundle, serializeSupportBundle } = require('./support-bundle.cjs');

test('support bundle redacts sensitive diagnostics and remains deterministic', () => {
  const input = { version: '0.1.6', platform: 'darwin-arm64', releaseQa: { reportDigest: 'abc', token: 'secret' }, diagnostics: [{ code: 'engine-failed', password: 'secret' }] };
  const first = serializeSupportBundle(input);
  const second = serializeSupportBundle(input);
  assert.equal(first, second);
  assert.match(first, /\[REDACTED\]/);
  assert.doesNotMatch(first, /secret/);
  assert.equal(createSupportBundle(input).sensitiveFieldsRemoved, true);
});

test('support bundle enforces the bounded output size', () => {
  assert.throws(() => serializeSupportBundle({ version: '0.1.6', diagnostics: ['x'.repeat(MAX_SUPPORT_BUNDLE_BYTES)] }), /support-bundle-too-large/);
});
