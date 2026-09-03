const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createDistributionQaMatrix } = require('../electron/distribution-readiness.cjs');
const { createReleaseQaReport, verifyReleaseQaReport } = require('../electron/release-qa.cjs');
const RELEASE_QA_CLI_SCHEMA_VERSION = 1;

function validateReleaseQaCliOutput(value) {
  const output = value && typeof value === 'object' && !Array.isArray(value) ? value : null;
  const valid = output?.schemaVersion === RELEASE_QA_CLI_SCHEMA_VERSION && typeof output?.valid === 'boolean' && typeof output?.ready === 'boolean' && typeof output?.artifactReady === 'boolean' && typeof output?.output === 'string' && output.output.length > 0;
  return { valid, diagnostics: valid ? [] : ['release-qa-cli-schema-invalid'] };
}

function option(args, name, fallback) { const index = args.indexOf(name); return index >= 0 && args[index + 1] ? args[index + 1] : fallback; }
function runReleaseQa({ manifestPath = path.resolve('dist/release-artifact-manifest.json'), resultsPath = null, matrixPath = null, outputPath = path.resolve('dist/release-qa-report.json'), currentCommit = null } = {}) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const results = resultsPath ? JSON.parse(fs.readFileSync(resultsPath, 'utf8')) : [];
  const matrix = matrixPath ? JSON.parse(fs.readFileSync(matrixPath, 'utf8')) : createDistributionQaMatrix();
  const resolvedCommit = currentCommit || execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  const report = createReleaseQaReport({ version: manifest.version, commit: manifest.commit, matrix, results, artifactManifest: manifest, artifactCommitMatches: manifest.commit === resolvedCommit, requireEvidence: true });
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2) + '\n');
  return { outputPath, report, verification: verifyReleaseQaReport(report) };
}

if (require.main === module) {
  try {
    const args = process.argv.slice(2);
    const result = runReleaseQa({ manifestPath: option(args, '--manifest', path.resolve('dist/release-artifact-manifest.json')), resultsPath: option(args, '--results', null), matrixPath: option(args, '--matrix', null), outputPath: option(args, '--output', path.resolve('dist/release-qa-report.json')) });
    const summary = { schemaVersion: RELEASE_QA_CLI_SCHEMA_VERSION, valid: result.verification.valid, ready: result.report.qa.ready, artifactReady: result.report.artifactQa?.ready === true, output: result.outputPath };
    process.stdout.write(`${JSON.stringify(summary)}\n`);
    if (!result.verification.valid) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`release QA failed: ${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = { RELEASE_QA_CLI_SCHEMA_VERSION, runReleaseQa, validateReleaseQaCliOutput };
