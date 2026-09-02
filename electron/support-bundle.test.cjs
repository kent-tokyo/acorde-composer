const test = require('node:test');
const assert = require('node:assert/strict');
const { MAX_SUPPORT_BUNDLE_BYTES, createSupportBundle, serializeSupportBundle } = require('./support-bundle.cjs');
const { createDistributionQaMatrix } = require('./distribution-readiness.cjs');
const { createReleaseQaReport } = require('./release-qa.cjs');

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

test('support bundle preserves a release QA report while redacting nested evidence', () => {
  const matrix = createDistributionQaMatrix({ platforms: ['mac'], architectures: { mac: ['arm64'] } });
  const results = matrix.flatMap((target) => target.scenarios.map((scenario) => ({ platform: target.platform, arch: target.arch, scenario: scenario.id, status: 'passed' })));
  const report = createReleaseQaReport({ version: '0.1.6', commit: 'be680d5', matrix, results, releaseMetadataDigest: 'metadata-digest', requireEvidence: false });
  report.qa.provider = { id: 'local', token: 'must-not-leak' };
  const bundle = JSON.parse(serializeSupportBundle({ version: '0.1.6', releaseQa: report, diagnostics: [{ code: 'qa-export', credential: 'must-not-leak' }] }));
  assert.equal(bundle.schemaVersion, 1);
  assert.equal(bundle.releaseQa.version, '0.1.6');
  assert.equal(bundle.releaseQa.qa.provider.token, '[REDACTED]');
  assert.equal(bundle.diagnostics[0].credential, '[REDACTED]');
  assert.equal(bundle.releaseQa.reportDigest, report.reportDigest);
});
