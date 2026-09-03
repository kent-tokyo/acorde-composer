const test = require('node:test');
const assert = require('node:assert/strict');
const { MAX_PLUGIN_STATE_BYTES, PLUGIN_API_VERSION, authorizePluginCapability, normalizePluginManifest, isPluginPath, normalizePluginState, pluginFailure, pluginRecord, scanPluginPaths } = require('./plugin-host.cjs');
const { createPluginRuntime, pluginEditorDescriptor, sandboxPolicy } = require('./plugin-runtime.cjs');

test('plugin manifest accepts only versioned, capability-scoped contracts', () => {
  assert.deepEqual(normalizePluginManifest({
    id: 'notation.helper', name: 'Notation Helper', version: '1.2.0', apiVersion: PLUGIN_API_VERSION,
    capabilities: ['score.read', 'command.propose', 'score.read'],
  }), {
    id: 'notation.helper', name: 'Notation Helper', version: '1.2.0', apiVersion: 1,
    capabilities: ['score.read', 'command.propose'], unsupported: [], valid: true, reason: null,
  });
});

test('plugin manifest rejects direct host capabilities and API mismatches', () => {
  assert.equal(normalizePluginManifest({ id: 'unsafe', name: 'Unsafe', version: '1', apiVersion: 1, capabilities: ['filesystem', 'network'] }).reason, 'unsupported-capability');
  assert.equal(normalizePluginManifest({ id: 'old', name: 'Old', version: '1', apiVersion: 0 }).reason, 'api-version-mismatch');
  assert.equal(normalizePluginManifest({ id: 'Bad ID', name: 'Bad', version: '1', apiVersion: 1 }).reason, 'invalid-id');
});

test('plugin capability authorization enforces manifest grants', () => {
  const manifest = normalizePluginManifest({ id: 'helper', name: 'Helper', version: '1', apiVersion: 1, capabilities: ['score.read'] });
  assert.deepEqual(authorizePluginCapability(manifest, 'score.read'), { allowed: true, reason: null });
  assert.deepEqual(authorizePluginCapability(manifest, 'command.propose'), { allowed: false, reason: 'capability-not-granted' });
  assert.deepEqual(authorizePluginCapability(manifest, 'filesystem'), { allowed: false, reason: 'unsupported-capability' });
});

test('plugin scan recognizes platform plugin bundle and binary extensions', () => {
  assert.equal(isPluginPath('/Library/Audio/Plug-Ins/VST3/Piano.vst3'), true);
  assert.equal(isPluginPath('/Library/Audio/Plug-Ins/Components/Piano.component'), true);
  assert.equal(isPluginPath('/tmp/Piano.dll'), true);
  assert.equal(isPluginPath('/tmp/Piano.musicxml'), false);
});

test('plugin scan discovers nested plugin candidates without loading them', async () => {
  const tree = {
    '/plugins': { directory: true, entries: ['VST3', 'notes.musicxml'] },
    '/plugins/VST3': { directory: true, entries: ['Piano.vst3'] },
    '/plugins/VST3/Piano.vst3': { directory: true },
    '/plugins/notes.musicxml': { directory: false },
  };
  const fsFixture = {
    async stat(candidate) { const item = tree[candidate]; if (!item) throw new Error('missing'); return { isDirectory: () => item.directory }; },
    async readdir(candidate) { return tree[candidate].entries || []; },
  };
  const records = await scanPluginPaths(['/plugins'], 0, fsFixture);
  assert.equal(records.length, 1);
  assert.equal(records[0].extension, '.vst3');
  assert.equal(records[0].loadStatus, 'discovered');
});

test('plugin state normalizes preset and bounded opaque state', () => {
  assert.deepEqual(normalizePluginState({ enabled: 1, preset: 'Warm Piano', state: { gain: 0.8 } }), {
    enabled: true, preset: 'Warm Piano', state: { gain: 0.8 }, reason: null,
  });
  assert.equal(normalizePluginState({ state: { blob: 'x'.repeat(MAX_PLUGIN_STATE_BYTES) } }).reason, 'state-too-large');
});

test('failed plugin records are disabled without changing core playback policy', () => {
  const record = pluginRecord('/tmp/Strings.vst3', { isDirectory: true });
  const failed = pluginFailure(record, 'host-crashed');
  assert.equal(record.runtime, 'out-of-process-required');
  assert.equal(record.gui, 'isolated-editor-required');
  assert.equal(failed.loadStatus, 'disabled');
  assert.equal(failed.state.enabled, false);
  assert.equal(failed.state.reason, 'host-crashed');
});

function fakeChild() {
  const { EventEmitter } = require('node:events');
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stdin = { writes: [], write(value) { this.writes.push(value); } };
  child.kill = () => child.emit('exit', 0, null);
  return child;
}

test('runtime host enforces IPC capabilities and returns isolated editor descriptor', async () => {
  const child = fakeChild();
  const runtime = createPluginRuntime({
    pluginPath: '/tmp/Strings.vst3', hostCommand: '/tmp/acorde-plugin-host',
    manifest: { id: 'strings', name: 'Strings', version: '1', apiVersion: 1, capabilities: ['score.read'] },
    spawnImpl() { return child; },
  });
  assert.equal(runtime.start().status, 'running');
  const response = runtime.request('score.read', { address: '0:0:0:0:0' });
  const request = JSON.parse(child.stdin.writes[0]);
  child.stdout.emit('data', `${JSON.stringify({ id: request.id, ok: true, result: { accepted: true } })}\n`);
  assert.deepEqual(await response, { accepted: true });
  await assert.rejects(runtime.request('network', {}), /unsupported-capability/);
  assert.deepEqual(runtime.editor({ id: 'strings', path: '/tmp/Strings.vst3' }, { width: 100, height: 9999 }), {
    mode: 'isolated-window', pluginId: 'strings', title: 'Strings.vst3', bounds: { width: 320, height: 1600 },
    transport: 'host-ipc', canAccessScore: false, canAccessFilesystem: false, canAccessNetwork: false, canAccessAudioContext: false,
  });
  runtime.stop();
});

test('runtime host cleans up a request when plugin stdin rejects a write', async () => {
  const child = fakeChild();
  child.stdin.write = () => { throw new Error('closed pipe'); };
  const runtime = createPluginRuntime({
    pluginPath: '/tmp/Piano.vst3', hostCommand: '/tmp/acorde-plugin-host',
    manifest: { id: 'piano', name: 'Piano', version: '1', apiVersion: 1, capabilities: ['score.read'] },
    spawnImpl() { return child; },
  });
  runtime.start();
  await assert.rejects(runtime.request('score.read', {}), /host-input-failed/);
  runtime.stop();
});

test('runtime host rejects a circular payload without throwing synchronously', async () => {
  const child = fakeChild();
  const runtime = createPluginRuntime({
    pluginPath: '/tmp/Piano.vst3', hostCommand: '/tmp/acorde-plugin-host',
    manifest: { id: 'piano', name: 'Piano', version: '1', apiVersion: 1, capabilities: ['score.read'] },
    spawnImpl() { return child; },
  });
  runtime.start();
  const payload = {}; payload.self = payload;
  await assert.rejects(runtime.request('score.read', payload), /request-invalid/);
  assert.equal(child.stdin.writes.length, 0);
  runtime.stop();
});

test('runtime host recovers once after crash then disables after repeated crash', () => {
  const children = [];
  const runtime = createPluginRuntime({
    pluginPath: '/tmp/Piano.vst3', hostCommand: '/tmp/acorde-plugin-host',
    manifest: { id: 'piano', name: 'Piano', version: '1', apiVersion: 1, capabilities: [] },
    spawnImpl() { const child = fakeChild(); children.push(child); return child; },
  });
  runtime.start();
  children[0].emit('exit', 1, null);
  assert.equal(runtime.getStatus(), 'running');
  children[1].emit('exit', 1, null);
  assert.equal(runtime.getStatus(), 'disabled');
  assert.equal(runtime.getRestartCount(), 1);
});

test('runtime host ignores delayed events from a replaced child process', () => {
  const children = [];
  const runtime = createPluginRuntime({
    pluginPath: '/tmp/Piano.vst3', hostCommand: '/tmp/acorde-plugin-host',
    manifest: { id: 'piano', name: 'Piano', version: '1', apiVersion: 1, capabilities: [] },
    spawnImpl() { const child = fakeChild(); children.push(child); return child; },
  });
  runtime.start();
  children[0].emit('exit', 1, null);
  assert.equal(runtime.getStatus(), 'running');
  children[0].emit('error', new Error('late old-child error'));
  assert.equal(runtime.getStatus(), 'running');
  runtime.stop();
});

test('sandbox policy and editor descriptor deny direct host access', () => {
  assert.deepEqual(sandboxPolicy('/tmp/Piano.vst3'), { mode: 'external-process-policy', cwd: '/tmp', environment: ['PATH', 'LANG'], network: 'denied-by-host-contract', filesystem: 'plugin-path-only-by-host-contract', rendererAccess: 'denied' });
  assert.equal(pluginEditorDescriptor(null).canAccessScore, false);
});
