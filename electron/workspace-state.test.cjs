const test = require('node:test');
const assert = require('node:assert/strict');
const { DEFAULT, normalize, load, save, reset } = require('../src/workspace-state.js');

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    value: (key) => values.get(key),
  };
}

test('workspace state keeps a versioned default MuseScore layout', () => {
  assert.deepEqual(normalize(null), DEFAULT);
  assert.deepEqual(normalize({ version: 99, palettesVisible: false }), DEFAULT);
});

test('workspace state persists panel and toolbar visibility with active tabs', () => {
  const storage = memoryStorage();
  const saved = save(storage, 'workspace', {
    version: 1,
    leftRailVisible: true,
    rightPanelVisible: false,
    palettesVisible: false,
    propertiesVisible: false,
    mixerVisible: true,
    historyVisible: true,
    playbackControlsVisible: false,
    noteInputVisible: true,
    statusBarVisible: false,
    activeSidebar: 'scores',
    activeRightPanel: 'omr',
  });
  assert.deepEqual(load(storage, 'workspace'), saved);
  assert.equal(saved.activeSidebar, 'scores');
  assert.equal(saved.activeRightPanel, 'omr');
  assert.equal(saved.rightPanelVisible, false);
  assert.equal(saved.mixerVisible, true);
  assert.equal(saved.historyVisible, true);
});

test('workspace reset removes persisted layout and restores defaults', () => {
  const storage = memoryStorage({ workspace: JSON.stringify({ version: 1, palettesVisible: false }) });
  assert.deepEqual(reset(storage, 'workspace'), DEFAULT);
  assert.equal(storage.value('workspace'), undefined);
});

test('workspace state rejects unknown tabs and malformed storage', () => {
  const malformed = memoryStorage({ workspace: '{' });
  assert.deepEqual(load(malformed, 'workspace'), DEFAULT);
  const normalized = normalize({ version: 1, activeSidebar: 'unknown', activeRightPanel: 'unknown' });
  assert.equal(normalized.activeSidebar, 'palettes');
  assert.equal(normalized.activeRightPanel, 'properties');
});
