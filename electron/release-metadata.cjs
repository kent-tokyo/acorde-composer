const crypto = require('node:crypto');

const BUILD_TYPES = new Set(['debug', 'release']);

function normalizeReleaseMetadata(value) {
  const source = value && typeof value === 'object' ? value : {};
  const buildType = BUILD_TYPES.has(source.buildType) ? source.buildType : 'debug';
  const checksums = source.checksums && typeof source.checksums === 'object' && !Array.isArray(source.checksums)
    ? Object.fromEntries(Object.entries(source.checksums).filter(([key, checksum]) => typeof key === 'string' && typeof checksum === 'string' && /^[a-f0-9]{64}$/i.test(checksum)))
    : {};
  return {
    product: 'Acorde Composer', version: typeof source.version === 'string' ? source.version : null,
    commit: typeof source.commit === 'string' ? source.commit : null,
    target: typeof source.target === 'string' ? source.target : null,
    engineVersion: typeof source.engineVersion === 'string' ? source.engineVersion : null,
    buildType, signed: source.signed === true, checksums,
  };
}

function createReleaseMetadata(value) {
  const metadata = normalizeReleaseMetadata(value);
  const input = JSON.stringify(metadata);
  return { ...metadata, inputDigest: crypto.createHash('sha256').update(input).digest('hex') };
}

function isReleaseMetadataValid(value) {
  const metadata = normalizeReleaseMetadata(value);
  return Boolean(metadata.version && metadata.commit && metadata.target && metadata.engineVersion && metadata.buildType === 'release' && metadata.signed && Object.keys(metadata.checksums).length > 0);
}

function verifyReleaseMetadata(value) {
  const source = value && typeof value === 'object' ? value : {};
  const expectedDigest = createReleaseMetadata(source).inputDigest;
  const valid = isReleaseMetadataValid(source) && typeof source.inputDigest === 'string' && source.inputDigest === expectedDigest;
  return { valid, diagnostics: valid ? [] : ['release-metadata-invalid-or-tampered'] };
}

module.exports = { BUILD_TYPES, createReleaseMetadata, isReleaseMetadataValid, normalizeReleaseMetadata, verifyReleaseMetadata };
