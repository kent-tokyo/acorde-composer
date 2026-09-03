const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { createArtifactManifest, createDistributionQaMatrix } = require('./distribution-readiness.cjs');
const { serializeSupportBundle } = require('./support-bundle.cjs');
const { validateReleaseQaReportSchema } = require('./release-qa.cjs');
const { runReleaseQa, validateReleaseQaCliOutput } = require('../scripts/run-release-qa.cjs');
const { validateReleaseQaFile } = require('../scripts/validate-release-qa.cjs');

test('release QA CLI binds pack manifest and reports incomplete executable QA', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'acorde-composer-qa-'));
  try {
    const manifestPath = path.join(root, 'manifest.json');
    const outputPath = path.join(root, 'qa.json');
    const manifest = createArtifactManifest({ version: '0.1.6', commit: 'be680d5', artifacts: [{ name: 'app', sha256: 'a'.repeat(64), sbom: true, notice: true, provenance: true }] });
    fs.writeFileSync(manifestPath, JSON.stringify(manifest));
    const result = runReleaseQa({ manifestPath, outputPath, matrixPath: null, resultsPath: null });
    assert.equal(result.verification.valid, false);
    assert.equal(result.report.artifactQa.ready, true);
    assert.equal(result.report.artifactCommitMatches, false);
    assert.equal(result.report.qa.ready, false);
    assert.deepEqual(result.report.qa.missing.length, createDistributionQaMatrix().flatMap((target) => target.scenarios).length);
    assert.ok(fs.existsSync(outputPath));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('release QA CLI output crosses the support bundle boundary with redaction intact', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'acorde-composer-qa-bundle-'));
  try {
    const manifestPath = path.join(root, 'manifest.json');
    const outputPath = path.join(root, 'qa.json');
    const bundlePath = path.join(root, 'support-bundle.json');
    const manifest = createArtifactManifest({ version: '0.1.6', commit: 'be680d5', artifacts: [{ name: 'app', sha256: 'a'.repeat(64), sbom: true, notice: true, provenance: true }] });
    fs.writeFileSync(manifestPath, JSON.stringify(manifest));
    const cli = spawnSync(process.execPath, [path.join(__dirname, '../scripts/run-release-qa.cjs'), '--manifest', manifestPath, '--output', outputPath], { encoding: 'utf8', env: { ...process.env, GIT_CONFIG_NOSYSTEM: '1' } });
    assert.equal(cli.status, 1);
    const summary = JSON.parse(cli.stdout);
    assert.deepEqual(validateReleaseQaCliOutput(summary), { valid: true, diagnostics: [] });
    const report = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    fs.writeFileSync(bundlePath, serializeSupportBundle({ version: report.version, releaseQa: report, diagnostics: [{ code: 'cli-export', token: 'must-not-leak' }] }));
    const bundle = JSON.parse(fs.readFileSync(bundlePath, 'utf8'));
    assert.equal(summary.ready, false);
    assert.equal(bundle.releaseQa.reportDigest, report.reportDigest);
    assert.equal(bundle.diagnostics[0].token, '[REDACTED]');
    assert.equal(bundle.sensitiveFieldsRemoved, true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('release QA CLI output schema rejects malformed summaries', () => {
  assert.deepEqual(validateReleaseQaCliOutput({ schemaVersion: 1, valid: false, ready: false, artifactReady: true, output: '/tmp/qa.json' }), { valid: true, diagnostics: [] });
  assert.equal(validateReleaseQaCliOutput({ schemaVersion: 2, valid: false, ready: false, artifactReady: true, output: '/tmp/qa.json' }).valid, false);
  assert.equal(validateReleaseQaCliOutput({ schemaVersion: 1, valid: 'false', ready: false, artifactReady: true, output: '/tmp/qa.json' }).valid, false);
  assert.equal(validateReleaseQaCliOutput(null).valid, false);
});

test('standalone schema CLI migrates a legacy v0 fixture to v1', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'acorde-composer-qa-schema-'));
  try {
    const matrix = createDistributionQaMatrix({ platforms: ['mac'], architectures: { mac: ['arm64'] } });
    const current = require('./release-qa.cjs').createReleaseQaReport({ version: '0.1.6', commit: 'be680d5', matrix, results: [] });
    const { schemaVersion, reportDigest, ...legacyBody } = current;
    const legacy = { ...legacyBody, reportDigest: require('node:crypto').createHash('sha256').update(JSON.stringify(legacyBody)).digest('hex') };
    const inputPath = path.join(root, 'legacy-v0.json');
    fs.writeFileSync(inputPath, JSON.stringify(legacy));
    const migrated = validateReleaseQaFile({ inputPath, migrate: true });
    assert.equal(migrated.migrated, true);
    assert.equal(migrated.report.schemaVersion, 1);
    assert.equal(migrated.validation.valid, true);
    const outputPath = path.join(root, 'validated', 'summary.json');
    const cli = spawnSync(process.execPath, [path.resolve(__dirname, '../scripts/validate-release-qa.cjs'), '--input', inputPath, '--output', outputPath, '--migrate'], { encoding: 'utf8' });
    assert.equal(cli.status, 0);
    const output = JSON.parse(cli.stdout);
    assert.deepEqual(output, { schemaVersion: 1, valid: true, migrated: true, input: path.resolve(inputPath), diagnostics: [] });
    assert.deepEqual(JSON.parse(fs.readFileSync(outputPath, 'utf8')), output);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('standalone schema CLI rejects malformed JSON and missing input files', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'acorde-composer-qa-schema-errors-'));
  try {
    const malformedPath = path.join(root, 'malformed.json');
    fs.writeFileSync(malformedPath, '{"schemaVersion":');
    const malformed = spawnSync(process.execPath, [path.resolve(__dirname, '../scripts/validate-release-qa.cjs'), '--input', malformedPath], { encoding: 'utf8' });
    assert.equal(malformed.status, 1);
    assert.match(malformed.stderr, /release QA validation failed/);
    const missing = spawnSync(process.execPath, [path.resolve(__dirname, '../scripts/validate-release-qa.cjs'), '--input', path.join(root, 'missing.json')], { encoding: 'utf8' });
    assert.equal(missing.status, 1);
    assert.match(missing.stderr, /release QA validation failed/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('v1 to future-version migration fixture keeps the unimplemented v2 policy explicit', () => {
  const fixtures = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../qa/release-qa-schema-migration-fixtures.json'), 'utf8'));
  assert.deepEqual(fixtures.map(({ name, action }) => ({ name, action })), [
    { name: 'legacy-v0', action: 'migrate' },
    { name: 'current-v1', action: 'preserve' },
    { name: 'future-v2', action: 'reject-until-migration-defined' },
  ]);
  assert.throws(() => require('./release-qa.cjs').migrateReleaseQaReport({ schemaVersion: 2 }, 1), /unsupported-release-qa-source-version/);
});

test('release QA CLI consumes the checked-in twenty-scenario fixtures', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'acorde-composer-qa-fixture-'));
  try {
    const manifestPath = path.join(root, 'manifest.json');
    const outputPath = path.join(root, 'qa.json');
    const matrixPath = path.resolve(__dirname, '../qa/release-qa-matrix.json');
    const resultsPath = path.resolve(__dirname, '../qa/release-qa-results.json');
    const matrix = JSON.parse(fs.readFileSync(matrixPath, 'utf8'));
    const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    const manifest = createArtifactManifest({ version: '0.1.6', commit: 'be680d5', artifacts: [{ name: 'app', sha256: 'a'.repeat(64), sbom: true, notice: true, provenance: true }] });
    fs.writeFileSync(manifestPath, JSON.stringify(manifest));
    const result = require('../scripts/run-release-qa.cjs').runReleaseQa({ manifestPath, outputPath, matrixPath, resultsPath, currentCommit: 'be680d5' });
    assert.equal(matrix.flatMap((target) => target.scenarios).length, 20);
    assert.equal(results.length, 20);
    assert.equal(result.report.qa.total, 20);
    assert.equal(result.report.qa.notRun.length, 20);
    assert.equal(result.report.qa.missing.length, 0);
    assert.equal(result.report.qa.failed.length, 0);
    assert.equal(result.report.qa.ready, false);
    assert.deepEqual(validateReleaseQaReportSchema(result.report), { valid: true, diagnostics: [] });
    const cliSummary = JSON.parse(spawnSync(process.execPath, [path.join(__dirname, '../scripts/run-release-qa.cjs'), '--manifest', manifestPath, '--matrix', matrixPath, '--results', resultsPath, '--output', outputPath], { encoding: 'utf8', env: { ...process.env, GIT_CONFIG_NOSYSTEM: '1' } }).stdout);
    assert.deepEqual(validateReleaseQaCliOutput(cliSummary), { valid: true, diagnostics: [] });
    assert.ok(fs.existsSync(outputPath));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('release QA CLI rejects duplicate, unknown, and evidence-missing fixture records', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'acorde-composer-qa-invalid-fixture-'));
  try {
    const matrixPath = path.resolve(__dirname, '../qa/release-qa-matrix.json');
    const sourceResults = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../qa/release-qa-results.json'), 'utf8'));
    const matrix = JSON.parse(fs.readFileSync(matrixPath, 'utf8'));
    const manifestPath = path.join(root, 'manifest.json');
    const manifest = createArtifactManifest({ version: '0.1.6', commit: 'be680d5', artifacts: [{ name: 'app', sha256: 'a'.repeat(64), sbom: true, notice: true, provenance: true }] });
    fs.writeFileSync(manifestPath, JSON.stringify(manifest));
    const run = (name, results) => {
      const resultsPath = path.join(root, `${name}-results.json`);
      const outputPath = path.join(root, `${name}-report.json`);
      fs.writeFileSync(resultsPath, JSON.stringify(results));
      return require('../scripts/run-release-qa.cjs').runReleaseQa({ manifestPath, outputPath, matrixPath, resultsPath, currentCommit: 'be680d5' }).report.qa;
    };
    const duplicate = run('duplicate', [...sourceResults, sourceResults[0]]);
    const unknown = run('unknown', [{ ...sourceResults[0], scenario: 'unknown-scenario' }, ...sourceResults.slice(1)]);
    const evidenceMissing = run('evidence-missing', [{ ...sourceResults[0], evidence: undefined }, ...sourceResults.slice(1)]);
    assert.deepEqual(duplicate.duplicates, ['mac/arm64/install-launch']);
    assert.equal(unknown.invalid[0], 'mac/arm64/unknown-scenario');
    assert.equal(evidenceMissing.invalid[0], 'mac/arm64/install-launch:evidence-invalid');
    assert.equal(duplicate.ready, false);
    assert.equal(unknown.ready, false);
    assert.equal(evidenceMissing.ready, false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
