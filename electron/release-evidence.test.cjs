const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { validateReleaseEvidence } = require('../scripts/validate-release-evidence.cjs');

function write(file, value) { fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`); }

test('release evidence rejects reports that point at an older public commit', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'acorde-release-evidence-'));
  try {
    const manifest = { schemaVersion: 1, version: '0.1.13', commit: 'aaaaaaa', artifacts: [], digest: 'bad' };
    const candidate = { schemaVersion: 1, product: 'Acorde Composer', version: '0.1.13', commit: 'aaaaaaa', valid: true, releaseReady: true, strictDependency: true, failedStep: null, exitCode: 0, steps: [], dependency: {} };
    const report = { schemaVersion: 2, version: '0.1.13', commit: 'aaaaaaa' };
    const manifestPath = path.join(root, 'manifest.json'); const candidatePath = path.join(root, 'candidate.json'); const reportPath = path.join(root, 'report.json');
    write(manifestPath, manifest); write(candidatePath, candidate); write(reportPath, report);
    const result = validateReleaseEvidence({ manifestPath, candidateGatePath: candidatePath, reportPath, currentCommit: 'bbbbbbb', currentVersion: '0.1.13' });
    assert.equal(result.valid, false);
    assert.ok(result.diagnostics.includes('artifact-manifest-stale-commit'));
    assert.ok(result.diagnostics.includes('candidate-gate-stale-commit'));
    assert.ok(result.diagnostics.includes('release-qa-report-stale-commit'));
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
