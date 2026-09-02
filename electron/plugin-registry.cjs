const { normalizePluginManifest, normalizePluginState } = require('./plugin-host.cjs');

const MAX_INSTALLED_PLUGINS = 128;
const PLUGIN_STATUSES = new Set(['installed', 'enabled', 'disabled', 'uninstalled']);

function normalizePluginInstallation(value) {
  const source = value && typeof value === 'object' ? value : {};
  const manifest = normalizePluginManifest(source.manifest);
  const state = normalizePluginState(source.state);
  const status = PLUGIN_STATUSES.has(source.status) ? source.status : 'installed';
  const path = typeof source.path === 'string' && source.path.length > 0 ? source.path : null;
  const failureCount = Number.isInteger(source.failureCount) ? Math.max(0, Math.min(3, source.failureCount)) : 0;
  const valid = manifest.valid && (status === 'uninstalled' || path !== null) && state.reason === null;
  return {
    id: manifest.id,
    path,
    manifest,
    status: valid ? status : 'disabled',
    enabled: valid && status === 'enabled' && state.enabled,
    state,
    failureCount,
    updatedAt: typeof source.updatedAt === 'string' ? source.updatedAt : null,
    valid,
    reason: !manifest.valid ? manifest.reason : state.reason || (path === null && status !== 'uninstalled' ? 'plugin-path-missing' : null),
  };
}

function transitionPlugin(value, action, updateManifest) {
  const current = normalizePluginInstallation(value);
  if (action === 'uninstall') return { ...current, status: 'uninstalled', enabled: false, valid: true, reason: null };
  if (action === 'disable') return { ...current, status: 'disabled', enabled: false };
  if (action === 'enable') {
    if (!current.valid || current.status === 'uninstalled') return { ...current, status: 'disabled', enabled: false, reason: current.reason || 'plugin-not-installable' };
    return { ...current, status: 'enabled', enabled: true };
  }
  if (action === 'update') {
    const manifest = normalizePluginManifest(updateManifest);
    if (!manifest.valid || manifest.id !== current.id) return { ...current, status: 'disabled', enabled: false, reason: manifest.valid ? 'plugin-id-mismatch' : manifest.reason };
    return { ...current, manifest, status: 'disabled', enabled: false, reason: null, failureCount: 0 };
  }
  if (action === 'install') return normalizePluginInstallation({ path: value?.path, manifest: updateManifest, state: { enabled: false }, status: 'installed' });
  return { ...current, status: 'disabled', enabled: false, reason: 'unknown-lifecycle-action' };
}

module.exports = { MAX_INSTALLED_PLUGINS, PLUGIN_STATUSES, normalizePluginInstallation, transitionPlugin };
