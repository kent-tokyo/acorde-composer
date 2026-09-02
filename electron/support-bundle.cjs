const MAX_SUPPORT_BUNDLE_BYTES = 512 * 1024;
const SENSITIVE_KEYS = new Set(['apiKey', 'authorization', 'password', 'secret', 'token', 'privateKey', 'credential']);

function redact(value, depth = 0) {
  if (depth > 8 || value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.slice(0, 4096).map((item) => redact(item, depth + 1));
  return Object.fromEntries(Object.entries(value).slice(0, 4096).map(([key, item]) => [key, SENSITIVE_KEYS.has(key) ? '[REDACTED]' : redact(item, depth + 1)]));
}

function createSupportBundle({ version, platform = null, releaseQa = null, diagnostics = [] } = {}) {
  const bundle = { schemaVersion: 1, product: 'Acorde Composer', version: typeof version === 'string' ? version : null, platform: typeof platform === 'string' ? platform : null, releaseQa: redact(releaseQa), diagnostics: redact(Array.isArray(diagnostics) ? diagnostics : []), sensitiveFieldsRemoved: true };
  return bundle;
}

function serializeSupportBundle(bundle) {
  const output = JSON.stringify(createSupportBundle(bundle));
  if (Buffer.byteLength(output, 'utf8') > MAX_SUPPORT_BUNDLE_BYTES) throw new Error('support-bundle-too-large');
  return output;
}

module.exports = { MAX_SUPPORT_BUNDLE_BYTES, createSupportBundle, redact, serializeSupportBundle };
