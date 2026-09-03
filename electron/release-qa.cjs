const crypto = require('node:crypto');
const { assessArtifactEvidence, assessDistributionQa, verifyArtifactManifest } = require('./distribution-readiness.cjs');
const RELEASE_QA_SCHEMA_VERSION = 1;
const LEGACY_RELEASE_QA_SCHEMA_VERSION = 0;
const FUTURE_RELEASE_QA_SCHEMA_VERSION = 2;

function withReportDigest(report) {
  return { ...report, reportDigest: crypto.createHash('sha256').update(JSON.stringify(report)).digest('hex') };
}

function validateReleaseQaReportSchema(value) {
  const report = value && typeof value === 'object' && !Array.isArray(value) ? value : null;
  const qa = report?.qa;
  const arrays = ['missing', 'failed', 'notRun', 'invalid', 'duplicates'];
  const validQa = qa && typeof qa === 'object' && typeof qa.ready === 'boolean' && Number.isInteger(qa.total) && Number.isInteger(qa.passed) && arrays.every((key) => Array.isArray(qa[key]));
  const schemaVersion = report?.schemaVersion ?? LEGACY_RELEASE_QA_SCHEMA_VERSION;
  const migrationValid = schemaVersion !== FUTURE_RELEASE_QA_SCHEMA_VERSION || (report?.migration?.sourceSchemaVersion === RELEASE_QA_SCHEMA_VERSION);
  const valid = (schemaVersion === LEGACY_RELEASE_QA_SCHEMA_VERSION || schemaVersion === RELEASE_QA_SCHEMA_VERSION || schemaVersion === FUTURE_RELEASE_QA_SCHEMA_VERSION) && migrationValid && report?.product === 'Acorde Composer' && typeof report?.version === 'string' && typeof report?.commit === 'string' && (report?.releaseMetadataDigest === null || report?.releaseMetadataDigest === undefined || typeof report?.releaseMetadataDigest === 'string') && (report?.artifactManifest === null || report?.artifactManifest === undefined || typeof report?.artifactManifest === 'object') && (report?.artifactQa === null || report?.artifactQa === undefined || typeof report?.artifactQa === 'object') && (report?.artifactCommitMatches === null || report?.artifactCommitMatches === undefined || typeof report?.artifactCommitMatches === 'boolean') && validQa && typeof report?.reportDigest === 'string' && /^[a-f0-9]{64}$/i.test(report.reportDigest);
  return { valid, diagnostics: valid ? [] : ['release-qa-schema-invalid'] };
}

function migrateReleaseQaReport(value, targetVersion = RELEASE_QA_SCHEMA_VERSION) {
  if (targetVersion !== RELEASE_QA_SCHEMA_VERSION && targetVersion !== FUTURE_RELEASE_QA_SCHEMA_VERSION) throw new Error('unsupported-release-qa-target-version');
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : null;
  const sourceVersion = source?.schemaVersion ?? LEGACY_RELEASE_QA_SCHEMA_VERSION;
  if (sourceVersion === targetVersion) return source;
  if (sourceVersion !== LEGACY_RELEASE_QA_SCHEMA_VERSION && sourceVersion !== RELEASE_QA_SCHEMA_VERSION) throw new Error('unsupported-release-qa-source-version');
  const { reportDigest, ...body } = source;
  const sourceDigest = crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
  if (reportDigest !== sourceDigest) throw new Error('release-qa-source-digest-invalid');
  const migrated = targetVersion === FUTURE_RELEASE_QA_SCHEMA_VERSION
    ? { ...body, schemaVersion: FUTURE_RELEASE_QA_SCHEMA_VERSION, migration: { sourceSchemaVersion: sourceVersion } }
    : { ...body, schemaVersion: RELEASE_QA_SCHEMA_VERSION };
  return withReportDigest(migrated);
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
  return withReportDigest(report);
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

module.exports = { FUTURE_RELEASE_QA_SCHEMA_VERSION, LEGACY_RELEASE_QA_SCHEMA_VERSION, RELEASE_QA_SCHEMA_VERSION, createReleaseQaReport, migrateReleaseQaReport, validateReleaseQaReportSchema, verifyReleaseQaReport };
