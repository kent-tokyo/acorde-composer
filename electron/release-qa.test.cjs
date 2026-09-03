const test = require('node:test');
const assert = require('node:assert/strict');
const { createDistributionQaMatrix } = require('./distribution-readiness.cjs');
const { createReleaseQaReport, validateReleaseQaReportSchema, verifyReleaseQaReport } = require('./release-qa.cjs');
const { createArtifactManifest } = require('./distribution-readiness.cjs');

test('release QA report is deterministic and binds version and commit to all passing cases', () => {
  const matrix = createDistributionQaMatrix({ platforms: ['mac'], architectures: { mac: ['arm64'] } });
  const results = matrix.flatMap((target) => target.scenarios.map((scenario) => ({ platform: target.platform, arch: target.arch, scenario: scenario.id, status: 'passed' })));
  const report = createReleaseQaReport({ version: '0.1.6', commit: 'be680d5', matrix, results, releaseMetadataDigest: 'metadata-digest' });
  assert.equal(report.qa.ready, true);
  assert.equal(report.qa.passed, 10);
  assert.deepEqual(verifyReleaseQaReport(report), { valid: true, diagnostics: [] });
  assert.equal(report.reportDigest, createReleaseQaReport({ version: '0.1.6', commit: 'be680d5', matrix, results, releaseMetadataDigest: 'metadata-digest' }).reportDigest);
});

test('release QA report rejects missing evidence and tampering', () => {
  const matrix = createDistributionQaMatrix({ platforms: ['win'], architectures: { win: ['x64'] } });
  const report = createReleaseQaReport({ version: '0.1.6', commit: 'be680d5', matrix, results: [] });
  assert.equal(report.qa.ready, false);
  assert.deepEqual(verifyReleaseQaReport(report), { valid: false, diagnostics: ['release-qa-invalid-or-tampered'] });
  assert.deepEqual(verifyReleaseQaReport({ ...report, commit: 'changed' }), { valid: false, diagnostics: ['release-qa-invalid-or-tampered'] });
});

test('release QA report binds an artifact manifest and rejects manifest tampering', () => {
  const matrix = createDistributionQaMatrix({ platforms: ['mac'], architectures: { mac: ['arm64'] } });
  const results = matrix.flatMap((target) => target.scenarios.map((scenario) => ({ platform: target.platform, arch: target.arch, scenario: scenario.id, status: 'passed' })));
  const artifactManifest = createArtifactManifest({ version: '0.1.6', commit: 'be680d5', artifacts: [{ name: 'app', sha256: 'a'.repeat(64), sbom: true, notice: true, provenance: true }] });
  const report = createReleaseQaReport({ version: '0.1.6', commit: 'be680d5', matrix, results, artifactManifest });
  assert.equal(report.artifactQa.ready, true);
  assert.equal(verifyReleaseQaReport(report).valid, true);
  assert.equal(verifyReleaseQaReport({ ...report, artifactManifest: { ...artifactManifest, artifacts: [] } }).valid, false);
});

test('release QA report has a fixed schema and rejects malformed input', () => {
  const matrix = createDistributionQaMatrix({ platforms: ['mac'], architectures: { mac: ['arm64'] } });
  const report = createReleaseQaReport({ version: '0.1.6', commit: 'be680d5', matrix, results: [] });
  assert.equal(report.schemaVersion, 1);
  assert.deepEqual(validateReleaseQaReportSchema(report), { valid: true, diagnostics: [] });
  assert.equal(validateReleaseQaReportSchema({ ...report, schemaVersion: 2 }).valid, false);
  assert.equal(validateReleaseQaReportSchema({ ...report, qa: { ...report.qa, total: '20' } }).valid, false);
  assert.equal(validateReleaseQaReportSchema({ ...report, reportDigest: 'broken' }).valid, false);
  assert.deepEqual(verifyReleaseQaReport({ ...report, schemaVersion: 2 }), { valid: false, diagnostics: ['release-qa-schema-invalid'] });
  assert.throws(() => JSON.parse('{"schemaVersion":'), SyntaxError);
});

test('release QA report keeps schema-less legacy reports readable', () => {
  const matrix = createDistributionQaMatrix({ platforms: ['mac'], architectures: { mac: ['arm64'] } });
  const current = createReleaseQaReport({ version: '0.1.6', commit: 'be680d5', matrix, results: [] });
  const { schemaVersion, reportDigest, ...legacyBody } = current;
  const legacy = { ...legacyBody, reportDigest: require('node:crypto').createHash('sha256').update(JSON.stringify(legacyBody)).digest('hex') };
  assert.equal(schemaVersion, 1);
  assert.equal(validateReleaseQaReportSchema(legacy).valid, true);
  assert.equal(verifyReleaseQaReport(legacy).valid, false);
  assert.equal(verifyReleaseQaReport({ ...legacy, qa: { ...legacy.qa, ready: true, missing: [], notRun: [], passed: 10 } }).valid, false);
});
