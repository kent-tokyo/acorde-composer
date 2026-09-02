const path = require('node:path');
const { spawn } = require('node:child_process');
const { authorizePluginCapability, normalizePluginManifest, pluginFailure } = require('./plugin-host.cjs');

const MAX_PLUGIN_MESSAGE_BYTES = 256 * 1024;
const DEFAULT_PLUGIN_TIMEOUT_MS = 2000;
const DEFAULT_RESTART_LIMIT = 1;

function sandboxPolicy(pluginPath) {
  return {
    mode: 'external-process-policy',
    cwd: typeof pluginPath === 'string' ? path.dirname(pluginPath) : null,
    environment: ['PATH', 'LANG'],
    network: 'denied-by-host-contract',
    filesystem: 'plugin-path-only-by-host-contract',
    rendererAccess: 'denied',
  };
}

function normalizeEditorBounds(value) {
  const source = value && typeof value === 'object' ? value : {};
  const number = (key, fallback, min, max) => Number.isFinite(source[key]) ? Math.min(max, Math.max(min, Math.round(source[key]))) : fallback;
  return { width: number('width', 800, 320, 2400), height: number('height', 600, 240, 1600) };
}

function pluginEditorDescriptor(record, bounds) {
  return {
    mode: 'isolated-window',
    pluginId: typeof record?.id === 'string' ? record.id : null,
    title: typeof record?.path === 'string' ? path.basename(record.path) : 'Plugin editor',
    bounds: normalizeEditorBounds(bounds),
    transport: 'host-ipc',
    canAccessScore: false,
    canAccessFilesystem: false,
    canAccessNetwork: false,
    canAccessAudioContext: false,
  };
}

function createPluginRuntime({ pluginPath, manifest, hostCommand, hostArgs = [], timeoutMs = DEFAULT_PLUGIN_TIMEOUT_MS, restartLimit = DEFAULT_RESTART_LIMIT, spawnImpl = spawn } = {}) {
  const normalizedManifest = normalizePluginManifest(manifest);
  const state = { status: 'stopped', restartCount: 0, child: null, nextRequestId: 1, pending: new Map(), buffer: '' };
  const fail = (reason) => {
    state.status = 'disabled';
    for (const item of state.pending.values()) { clearTimeout(item.timer); item.reject(new Error(reason)); }
    state.pending.clear();
    return pluginFailure({ id: normalizedManifest.id, path: pluginPath, state: { enabled: false } }, reason);
  };
  const handleLine = (line) => {
    if (Buffer.byteLength(line, 'utf8') > MAX_PLUGIN_MESSAGE_BYTES) return fail('response-too-large');
    let response;
    try { response = JSON.parse(line); } catch { return fail('invalid-response'); }
    const item = state.pending.get(response?.id);
    if (!item) return;
    state.pending.delete(response.id);
    clearTimeout(item.timer);
    response.ok ? item.resolve(response.result) : item.reject(new Error(typeof response.error === 'string' ? response.error : 'plugin-request-failed'));
  };
  const attach = (child) => {
    child.stdout?.on('data', (data) => {
      state.buffer += data.toString();
      let newline;
      while ((newline = state.buffer.indexOf('\n')) >= 0) { const line = state.buffer.slice(0, newline).trim(); state.buffer = state.buffer.slice(newline + 1); if (line) handleLine(line); }
    });
    child.on('error', () => { if (state.status === 'running') fail('host-error'); });
    child.on('exit', () => {
      state.child = null;
      if (state.status !== 'running') return;
      if (state.restartCount < restartLimit) { state.restartCount += 1; state.status = 'stopped'; start(); }
      else fail('host-crashed');
    });
  };
  function start() {
    if (state.status === 'running') return { status: state.status, restarted: false };
    if (!normalizedManifest.valid) return fail(normalizedManifest.reason);
    if (typeof hostCommand !== 'string' || hostCommand.length === 0) return fail('host-command-missing');
    const env = {};
    for (const key of ['PATH', 'LANG']) if (typeof process.env[key] === 'string') env[key] = process.env[key];
    state.child = spawnImpl(hostCommand, [...hostArgs, '--plugin', pluginPath], { cwd: path.dirname(pluginPath || '.'), env, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
    state.status = 'running';
    attach(state.child);
    return { status: state.status, restarted: state.restartCount > 0, sandbox: sandboxPolicy(pluginPath) };
  }
  function request(capability, payload) {
    const authorization = authorizePluginCapability(normalizedManifest, capability);
    if (!authorization.allowed) return Promise.reject(new Error(authorization.reason));
    if (state.status !== 'running' || !state.child?.stdin?.write) return Promise.reject(new Error('host-not-running'));
    const id = state.nextRequestId++;
    const message = JSON.stringify({ id, capability, payload });
    if (Buffer.byteLength(message, 'utf8') > MAX_PLUGIN_MESSAGE_BYTES) return Promise.reject(new Error('request-too-large'));
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { state.pending.delete(id); fail('request-timeout'); }, timeoutMs);
      state.pending.set(id, { resolve, reject, timer });
      state.child.stdin.write(`${message}\n`);
    });
  }
  function stop() {
    state.status = 'stopped';
    for (const item of state.pending.values()) { clearTimeout(item.timer); item.reject(new Error('host-stopped')); }
    state.pending.clear();
    state.child?.kill?.();
    state.child = null;
    return { status: state.status };
  }
  return { start, request, stop, getStatus: () => state.status, getRestartCount: () => state.restartCount, editor: (record, bounds) => pluginEditorDescriptor(record, bounds) };
}

module.exports = { DEFAULT_PLUGIN_TIMEOUT_MS, DEFAULT_RESTART_LIMIT, MAX_PLUGIN_MESSAGE_BYTES, createPluginRuntime, normalizeEditorBounds, pluginEditorDescriptor, sandboxPolicy };
