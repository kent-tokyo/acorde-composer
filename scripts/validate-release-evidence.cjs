const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { validateCandidateGateReport } = require('./check-release-candidate.cjs');
const { verifyArtifactManifest } = require('../electron/distribution-readiness.cjs');
const { validateReleaseQaReportSchema, verifyReleaseQaReport } = require('../electron/release-qa.cjs');

const RELEASE_EVIDENCE_SCHEMA_VERSION = 1;
function digest(value) { return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex'); }
function verifyReportDigest(report) {
  const { reportDigest, ...body } = report && typeof report === 'object' ? report : {};
  return typeof reportDigest === 'string' && reportDigest === digest(body);
}
function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }

function validateReleaseEvidence({ manifestPath, candidateGatePath, reportPath, currentCommit = null, currentVersion = null } = {}) {
  const diagnostics = [];
  const manifest = readJson(manifestPath);
  const candidate = readJson(candidateGatePath);
  const report = readJson(reportPath);
  const commit = currentCommit || execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  const version = currentVersion || readJson(path.resolve('package.json')).version;
  if (!verifyArtifactManifest(manifest).valid) diagnostics.push('artifact-manifest-invalid');
  if (!validateCandidateGateReport(candidate).valid) diagnostics.push('candidate-gate-invalid');
  if (!validateReleaseQaReportSchema(report).valid || !verifyReportDigest(report)) diagnostics.push('release-qa-report-invalid');
  if (manifest.commit !== commit) diagnostics.push('artifact-manifest-stale-commit');
  if (candidate.commit !== commit) diagnostics.push('candidate-gate-stale-commit');
  if (report.commit !== commit) diagnostics.push('release-qa-report-stale-commit');
  if (manifest.version !== version) diagnostics.push('artifact-manifest-stale-version');
  if (candidate.version !== version) diagnostics.push('candidate-gate-stale-version');
  if (report.version !== version) diagnostics.push('release-qa-report-stale-version');
  if (report.artifactManifest?.digest !== manifest.digest) diagnostics.push('release-qa-manifest-mismatch');
  if (report.candidateGate?.commit !== candidate.commit || report.candidateGate?.version !== candidate.version) diagnostics.push('release-qa-candidate-mismatch');
  const releaseReadiness = verifyReleaseQaReport(report);
  return { schemaVersion: RELEASE_EVIDENCE_SCHEMA_VERSION, valid: diagnostics.length === 0, ready: releaseReadiness.valid, version, commit, manifestDigest: manifest.digest, candidateDigest: digest(candidate), reportDigest: digest(report), diagnostics };
}

if (require.main === module) {
  try {
    const args = process.argv.slice(2);
    const option = (name, fallback) => { const index = args.indexOf(name); return index >= 0 && args[index + 1] ? args[index + 1] : fallback; };
    const result = validateReleaseEvidence({ manifestPath: option('--manifest', path.resolve('dist/release-artifact-manifest.json')), candidateGatePath: option('--candidate-gate', path.resolve('dist/candidate-gate.json')), reportPath: option('--report', path.resolve('dist/release-qa-report.json')) });
    process.stdout.write(`${JSON.stringify(result)}\n`);
    if (!result.valid) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`release evidence validation failed: ${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = { RELEASE_EVIDENCE_SCHEMA_VERSION, validateReleaseEvidence };
