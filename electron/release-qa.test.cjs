const test = require('node:test');
const assert = require('node:assert/strict');
const { createDistributionQaMatrix } = require('./distribution-readiness.cjs');
const { createReleaseQaReport, verifyReleaseQaReport } = require('./release-qa.cjs');

test('release QA report is deterministic and binds version and commit to all passing cases', () => {
  const matrix = createDistributionQaMatrix({ platforms: ['mac'], architectures: { mac: ['arm64'] } });
  const results = matrix.flatMap((target) => target.scenarios.map((scenario) => ({ platform: target.platform, arch: target.arch, scenario: scenario.id, status: 'passed' })));
  const report = createReleaseQaReport({ version: '0.1.4', commit: 'be680d5', matrix, results, releaseMetadataDigest: 'metadata-digest' });
  assert.equal(report.qa.ready, true);
  assert.equal(report.qa.passed, 10);
  assert.deepEqual(verifyReleaseQaReport(report), { valid: true, diagnostics: [] });
  assert.equal(report.reportDigest, createReleaseQaReport({ version: '0.1.4', commit: 'be680d5', matrix, results, releaseMetadataDigest: 'metadata-digest' }).reportDigest);
});

test('release QA report rejects missing evidence and tampering', () => {
  const matrix = createDistributionQaMatrix({ platforms: ['win'], architectures: { win: ['x64'] } });
  const report = createReleaseQaReport({ version: '0.1.4', commit: 'be680d5', matrix, results: [] });
  assert.equal(report.qa.ready, false);
  assert.deepEqual(verifyReleaseQaReport(report), { valid: false, diagnostics: ['release-qa-invalid-or-tampered'] });
  assert.deepEqual(verifyReleaseQaReport({ ...report, commit: 'changed' }), { valid: false, diagnostics: ['release-qa-invalid-or-tampered'] });
});
