const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createArtifactManifest, createDistributionQaMatrix } = require('./distribution-readiness.cjs');
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
    assert.equal(result.report.qa.ready, false);
    assert.deepEqual(result.report.qa.missing.length, createDistributionQaMatrix().flatMap((target) => target.scenarios).length);
    assert.ok(fs.existsSync(outputPath));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
