const crypto = require('node:crypto');
const { assessDistributionQa } = require('./distribution-readiness.cjs');

function createReleaseQaReport({ version, commit, matrix = [], results = [], releaseMetadataDigest = null } = {}) {
  const qa = assessDistributionQa(matrix, results);
  const report = {
    product: 'Acorde Composer', version: typeof version === 'string' ? version : null,
    commit: typeof commit === 'string' ? commit : null,
    releaseMetadataDigest: typeof releaseMetadataDigest === 'string' ? releaseMetadataDigest : null,
    qa,
  };
  return { ...report, reportDigest: crypto.createHash('sha256').update(JSON.stringify(report)).digest('hex') };
}

function verifyReleaseQaReport(value) {
  const source = value && typeof value === 'object' ? value : {};
  const { reportDigest, ...report } = source;
  const digest = crypto.createHash('sha256').update(JSON.stringify(report)).digest('hex');
  const valid = report.product === 'Acorde Composer' && typeof report.version === 'string' && typeof report.commit === 'string' && report.qa?.ready === true && reportDigest === digest;
  return { valid, diagnostics: valid ? [] : ['release-qa-invalid-or-tampered'] };
}

module.exports = { createReleaseQaReport, verifyReleaseQaReport };
