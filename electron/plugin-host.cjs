const fs = require('node:fs/promises');
const path = require('node:path');

const MAX_PLUGIN_STATE_BYTES = 1024 * 1024;
const PLUGIN_EXTENSIONS = new Set(['.component', '.dll', '.dylib', '.so', '.vst', '.vst3']);
const PLUGIN_API_VERSION = 1;
const PLUGIN_CAPABILITIES = new Set(['score.read', 'command.propose', 'render.hook', 'playback.hook']);

function pluginExtension(filePath) { return path.extname(typeof filePath === 'string' ? filePath : '').toLowerCase(); }
function isPluginPath(filePath) { return PLUGIN_EXTENSIONS.has(pluginExtension(filePath)); }
function normalizePluginManifest(value) {
  const source = value && typeof value === 'object' ? value : {};
  const capabilities = Array.isArray(source.capabilities)
    ? [...new Set(source.capabilities.filter((item) => typeof item === 'string'))]
    : [];
  const unsupported = capabilities.filter((capability) => !PLUGIN_CAPABILITIES.has(capability));
  const apiVersion = Number.isInteger(source.apiVersion) ? source.apiVersion : null;
  const validId = typeof source.id === 'string' && /^[a-z0-9][a-z0-9._-]{0,63}$/.test(source.id);
  const validName = typeof source.name === 'string' && source.name.trim().length > 0 && source.name.length <= 128;
  const validVersion = typeof source.version === 'string' && source.version.length > 0 && source.version.length <= 64;
  const reason = !validId ? 'invalid-id'
    : !validName ? 'invalid-name'
      : !validVersion ? 'invalid-version'
        : apiVersion !== PLUGIN_API_VERSION ? 'api-version-mismatch'
          : unsupported.length > 0 ? 'unsupported-capability' : null;
  return {
    id: validId ? source.id : null,
    name: validName ? source.name.trim() : null,
    version: validVersion ? source.version : null,
    apiVersion,
    capabilities,
    unsupported,
    valid: reason === null,
    reason,
  };
}
function normalizePluginState(value) {
  const source = value && typeof value === 'object' ? value : {};
  const state = source.state && typeof source.state === 'object' ? source.state : null;
  let stateBytes = 0;
  try { stateBytes = state ? Buffer.byteLength(JSON.stringify(state), 'utf8') : 0; } catch { return { enabled: false, preset: null, state: null, reason: 'invalid-state' }; }
  if (stateBytes > MAX_PLUGIN_STATE_BYTES) return { enabled: false, preset: null, state: null, reason: 'state-too-large' };
  return {
    enabled: Boolean(source.enabled),
    preset: typeof source.preset === 'string' && source.preset.length > 0 ? source.preset : null,
    state,
    reason: null,
  };
}
function pluginRecord(filePath, stat) {
  const extension = pluginExtension(filePath);
  const isDirectory = typeof stat?.isDirectory === 'function' ? stat.isDirectory() : Boolean(stat?.isDirectory);
  return {
    id: `${extension}:${filePath}`,
    path: filePath,
    extension,
    format: extension === '.vst3' ? 'VST3' : 'VST2-compatible-path',
    isBundle: isDirectory,
    loadStatus: 'discovered',
    runtime: 'out-of-process-required',
    gui: 'isolated-editor-required',
    state: normalizePluginState(null),
  };
}
async function scanPluginPaths(paths, depth = 0, fsImpl = fs) {
  if (depth > 3) return [];
  const records = [];
  for (const candidate of Array.isArray(paths) ? paths : []) {
    if (typeof candidate !== 'string') continue;
    let stat;
    try { stat = await fsImpl.stat(candidate); } catch { continue; }
    if (isPluginPath(candidate)) { records.push(pluginRecord(candidate, stat)); continue; }
    if (!stat.isDirectory()) continue;
    let entries = [];
    try { entries = await fsImpl.readdir(candidate); } catch { continue; }
    records.push(...await scanPluginPaths(entries.map((entry) => path.join(candidate, entry)), depth + 1, fsImpl));
  }
  return records;
}
function pluginFailure(record, reason) {
  return { ...record, loadStatus: 'disabled', state: { ...normalizePluginState(record?.state), enabled: false, reason: typeof reason === 'string' ? reason : 'plugin-failed' } };
}

module.exports = { MAX_PLUGIN_STATE_BYTES, PLUGIN_API_VERSION, PLUGIN_CAPABILITIES, PLUGIN_EXTENSIONS, isPluginPath, normalizePluginManifest, normalizePluginState, pluginRecord, scanPluginPaths, pluginFailure };
