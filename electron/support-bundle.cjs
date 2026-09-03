const crypto = require('node:crypto');
const MAX_SUPPORT_BUNDLE_BYTES = 512 * 1024;
const SENSITIVE_KEYS = new Set(['apiKey', 'authorization', 'password', 'secret', 'token', 'privateKey', 'credential']);

function redact(value, depth = 0, seen = new WeakSet()) {
  if (depth > 8) return '[TRUNCATED]';
  if (value === null || typeof value !== 'object') return value;
  if (seen.has(value)) return '[CIRCULAR]';
  seen.add(value);
  const output = Array.isArray(value)
    ? value.slice(0, 4096).map((item) => redact(item, depth + 1, seen))
    : Object.fromEntries(Object.entries(value).slice(0, 4096).map(([key, item]) => [key, SENSITIVE_KEYS.has(key) ? '[REDACTED]' : redact(item, depth + 1, seen)]));
  seen.delete(value);
  return output;
}

function createSupportBundle(input = {}) {
  const { version, platform = null, releaseQa = null, diagnostics = [] } = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const bundle = { schemaVersion: 1, product: 'Acorde Composer', version: typeof version === 'string' ? version : null, platform: typeof platform === 'string' ? platform : null, releaseQa: redact(releaseQa), diagnostics: redact(Array.isArray(diagnostics) ? diagnostics : []), sensitiveFieldsRemoved: true };
  return bundle;
}

function serializeSupportBundle(bundle) {
  const output = JSON.stringify(createSupportBundle(bundle));
  if (Buffer.byteLength(output, 'utf8') > MAX_SUPPORT_BUNDLE_BYTES) throw new Error('support-bundle-too-large');
  return output;
}

function checksumSupportBundle(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function verifySupportBundleChecksum(content, expected) {
  return typeof expected === 'string' && /^[a-f0-9]{64}$/i.test(expected) && checksumSupportBundle(content) === expected.toLowerCase();
}

module.exports = { MAX_SUPPORT_BUNDLE_BYTES, checksumSupportBundle, createSupportBundle, redact, serializeSupportBundle, verifySupportBundleChecksum };
