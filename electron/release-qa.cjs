const crypto = require('node:crypto');
const { assessArtifactEvidence, assessDistributionQa, verifyArtifactManifest } = require('./distribution-readiness.cjs');
const RELEASE_QA_SCHEMA_VERSION = 1;

function validateReleaseQaReportSchema(value) {
  const report = value && typeof value === 'object' && !Array.isArray(value) ? value : null;
  const qa = report?.qa;
  const arrays = ['missing', 'failed', 'notRun', 'invalid', 'duplicates'];
  const validQa = qa && typeof qa === 'object' && typeof qa.ready === 'boolean' && Number.isInteger(qa.total) && Number.isInteger(qa.passed) && arrays.every((key) => Array.isArray(qa[key]));
  const valid = report?.schemaVersion === RELEASE_QA_SCHEMA_VERSION && report?.product === 'Acorde Composer' && typeof report?.version === 'string' && typeof report?.commit === 'string' && (report?.releaseMetadataDigest === null || typeof report?.releaseMetadataDigest === 'string') && (report?.artifactManifest === null || typeof report?.artifactManifest === 'object') && (report?.artifactQa === null || typeof report?.artifactQa === 'object') && (report?.artifactCommitMatches === null || typeof report?.artifactCommitMatches === 'boolean') && validQa && typeof report?.reportDigest === 'string' && /^[a-f0-9]{64}$/i.test(report.reportDigest);
  return { valid, diagnostics: valid ? [] : ['release-qa-schema-invalid'] };
}

function createReleaseQaReport({ version, commit, matrix = [], results = [], releaseMetadataDigest = null, artifactManifest = null, artifactCommitMatches = null, requireEvidence = false } = {}) {
  const qa = assessDistributionQa(matrix, results, { requireEvidence });
  const artifactQa = artifactManifest ? { ...assessArtifactEvidence(artifactManifest.artifacts), manifestValid: verifyArtifactManifest(artifactManifest).valid } : null;
  const report = {
    schemaVersion: RELEASE_QA_SCHEMA_VERSION,
    product: 'Acorde Composer', version: typeof version === 'string' ? version : null,
    commit: typeof commit === 'string' ? commit : null,
    releaseMetadataDigest: typeof releaseMetadataDigest === 'string' ? releaseMetadataDigest : null,
    artifactManifest: artifactManifest || null,
    artifactQa,
    artifactCommitMatches,
    qa,
  };
  return { ...report, reportDigest: crypto.createHash('sha256').update(JSON.stringify(report)).digest('hex') };
}

function verifyReleaseQaReport(value) {
  const source = value && typeof value === 'object' ? value : {};
  const { reportDigest, ...report } = source;
  const schema = validateReleaseQaReportSchema(source);
  const digest = crypto.createHash('sha256').update(JSON.stringify(report)).digest('hex');
  const artifactValid = report.artifactManifest === null || (report.artifactQa?.ready === true && report.artifactQa?.manifestValid === true && report.artifactCommitMatches !== false && verifyArtifactManifest(report.artifactManifest).valid);
  const valid = schema.valid && report.qa.ready === true && artifactValid && reportDigest === digest;
  return { valid, diagnostics: valid ? [] : [schema.valid ? 'release-qa-invalid-or-tampered' : 'release-qa-schema-invalid'] };
}

module.exports = { RELEASE_QA_SCHEMA_VERSION, createReleaseQaReport, validateReleaseQaReportSchema, verifyReleaseQaReport };
