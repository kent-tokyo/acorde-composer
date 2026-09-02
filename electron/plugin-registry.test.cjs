const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizePluginInstallation, transitionPlugin } = require('./plugin-registry.cjs');

const manifest = { id: 'piano', name: 'Piano', version: '1.0.0', apiVersion: 1, capabilities: ['playback.hook'] };

test('plugin registry normalizes installation and keeps score state separate', () => {
  const record = normalizePluginInstallation({ path: '/tmp/Piano.vst3', manifest, status: 'enabled', state: { enabled: true, preset: 'Warm' } });
  assert.equal(record.valid, true);
  assert.equal(record.status, 'enabled');
  assert.equal(record.enabled, true);
  assert.equal(record.state.preset, 'Warm');
});

test('plugin lifecycle enables, disables, updates, and uninstalls without deleting files', () => {
  const installed = transitionPlugin({ path: '/tmp/Piano.vst3', manifest }, 'install', manifest);
  const enabled = transitionPlugin(installed, 'enable');
  assert.equal(enabled.enabled, true);
  assert.equal(transitionPlugin(enabled, 'disable').status, 'disabled');
  const updated = transitionPlugin(enabled, 'update', { ...manifest, version: '1.1.0' });
  assert.equal(updated.manifest.version, '1.1.0');
  assert.equal(updated.enabled, false);
  const removed = transitionPlugin(updated, 'uninstall');
  assert.equal(removed.status, 'uninstalled');
  assert.equal(removed.path, '/tmp/Piano.vst3');
});

test('invalid or mismatched lifecycle transitions stay disabled', () => {
  const invalid = normalizePluginInstallation({ path: '/tmp/Piano.vst3', manifest: { ...manifest, apiVersion: 0 } });
  assert.equal(invalid.status, 'disabled');
  assert.equal(transitionPlugin(invalid, 'enable').enabled, false);
  const mismatch = transitionPlugin({ path: '/tmp/Piano.vst3', manifest }, 'update', { ...manifest, id: 'organ' });
  assert.equal(mismatch.reason, 'plugin-id-mismatch');
  assert.equal(mismatch.status, 'disabled');
});
