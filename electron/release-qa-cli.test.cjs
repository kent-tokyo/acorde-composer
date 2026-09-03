const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { createArtifactManifest, createDistributionQaMatrix } = require('./distribution-readiness.cjs');
const { serializeSupportBundle } = require('./support-bundle.cjs');
const { runReleaseQa } = require('../scripts/run-release-qa.cjs');

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
