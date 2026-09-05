const MAX_PROVIDER_ID_LENGTH = 128;
const MAX_PROVIDER_NAME_LENGTH = 256;
const MAX_PROVIDER_VERSION_LENGTH = 64;
const MAX_PROVIDER_ARGS = 32;

const LICENSE_STATUSES = new Set(['unreviewed', 'accepted', 'rejected']);
const NETWORK_POLICIES = new Set(['disabled', 'user-approved']);

function boundedString(value, max) {
  return typeof value === 'string' && value.length > 0 && value.length <= max ? value : null;
}

function normalizeProviderConfig(value, kind = 'omr') {
  const source = value && typeof value === 'object' ? value : {};
  const args = Array.isArray(source.args) ? source.args.slice(0, MAX_PROVIDER_ARGS).map(String) : [];
  const licenseStatus = LICENSE_STATUSES.has(source.licenseStatus) ? source.licenseStatus : 'unreviewed';
  const networkPolicy = NETWORK_POLICIES.has(source.networkPolicy) ? source.networkPolicy : 'disabled';
  const timeoutMs = Number.isFinite(source.timeoutMs) ? Math.max(1, Math.min(60000, Math.round(source.timeoutMs))) : 10000;
  return {
    kind: kind === 'ai' ? 'ai' : 'omr',
    id: boundedString(source.id, MAX_PROVIDER_ID_LENGTH),
    name: boundedString(source.name, MAX_PROVIDER_NAME_LENGTH),
    version: boundedString(source.version, MAX_PROVIDER_VERSION_LENGTH),
    executable: typeof source.executable === 'string' && source.executable.startsWith('/') && !source.executable.includes('\0') ? source.executable : null,
    args,
    licenseStatus,
    networkPolicy,
    timeoutMs,
  };
}

function assessProviderConfig(value, kind = 'omr') {
  const config = normalizeProviderConfig(value, kind);
  const diagnostics = [];
  if (!config.id || !config.name || !config.version) diagnostics.push('provider-incomplete');
  if (!config.executable) diagnostics.push('provider-executable-missing-or-unsafe');
  if (config.args.some((arg) => arg.includes('\0'))) diagnostics.push('provider-args-invalid');
  if (config.licenseStatus !== 'accepted') diagnostics.push(`provider-license-${config.licenseStatus}`);
  if (config.kind === 'ai' && config.networkPolicy !== 'user-approved') diagnostics.push('network-not-approved');
  return { config, usable: diagnostics.length === 0, diagnostics };
}

module.exports = { MAX_PROVIDER_ARGS, assessProviderConfig, normalizeProviderConfig };
