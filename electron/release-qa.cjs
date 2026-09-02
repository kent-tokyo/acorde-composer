const crypto = require('node:crypto');
const { assessArtifactEvidence, assessDistributionQa, verifyArtifactManifest } = require('./distribution-readiness.cjs');

function createReleaseQaReport({ version, commit, matrix = [], results = [], releaseMetadataDigest = null, artifactManifest = null, artifactCommitMatches = null, requireEvidence = false } = {}) {
  const qa = assessDistributionQa(matrix, results, { requireEvidence });
  const artifactQa = artifactManifest ? { ...assessArtifactEvidence(artifactManifest.artifacts), manifestValid: verifyArtifactManifest(artifactManifest).valid } : null;
  const report = {
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
  const digest = crypto.createHash('sha256').update(JSON.stringify(report)).digest('hex');
  const artifactValid = report.artifactManifest === null || (report.artifactQa?.ready === true && report.artifactQa?.manifestValid === true && report.artifactCommitMatches !== false && verifyArtifactManifest(report.artifactManifest).valid);
  const valid = report.product === 'Acorde Composer' && typeof report.version === 'string' && typeof report.commit === 'string' && report.qa?.ready === true && artifactValid && reportDigest === digest;
  return { valid, diagnostics: valid ? [] : ['release-qa-invalid-or-tampered'] };
}

module.exports = { createReleaseQaReport, verifyReleaseQaReport };
