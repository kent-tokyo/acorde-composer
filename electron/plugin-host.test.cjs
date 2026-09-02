const test = require('node:test');
const assert = require('node:assert/strict');
const { MAX_PLUGIN_STATE_BYTES, isPluginPath, normalizePluginState, pluginFailure, pluginRecord, scanPluginPaths } = require('./plugin-host.cjs');

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
