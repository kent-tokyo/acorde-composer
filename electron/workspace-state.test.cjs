const test = require('node:test');
const assert = require('node:assert/strict');
const { VERSION, DEFAULT, normalize, load, save, reset } = require('../src/workspace-state.js');

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
  assert.equal(VERSION, 4);
  assert.equal(DEFAULT.activeMode, 'score');
  assert.equal(DEFAULT.theme, 'light');
});

test('workspace state persists panel and toolbar visibility with active tabs', () => {
  const storage = memoryStorage();
  const saved = save(storage, 'workspace', {
    version: VERSION,
    leftRailVisible: true,
    rightPanelVisible: true,
    palettesVisible: false,
    propertiesVisible: true,
    mixerVisible: true,
    historyVisible: true,
    playbackControlsVisible: false,
    noteInputVisible: true,
    statusBarVisible: false,
    activeSidebar: 'properties',
    activeRightPanel: 'omr',
    activeMode: 'publish',
    activeWorkspace: 'review',
    mixerDock: 'floating',
    utilityDock: { navigator: 'floating', timeline: 'bottom', piano: 'floating' },
    theme: 'dark',
    timelineVisible: true,
    pianoVisible: true,
    toolbar: { articulation: false },
  });
  assert.deepEqual(load(storage, 'workspace'), saved);
  assert.equal(saved.activeSidebar, 'properties');
  assert.equal(saved.activeRightPanel, 'omr');
  assert.equal(saved.rightPanelVisible, true);
  assert.equal(saved.mixerVisible, true);
  assert.equal(saved.historyVisible, true);
  assert.equal(saved.activeMode, 'publish');
  assert.equal(saved.theme, 'dark');
  assert.equal(saved.timelineVisible, true);
  assert.deepEqual(saved.utilityDock, { navigator: 'floating', timeline: 'bottom', piano: 'floating' });
  assert.equal(saved.toolbar.articulation, false);
});

test('workspace reset removes persisted layout and restores defaults', () => {
  const storage = memoryStorage({ workspace: JSON.stringify({ version: VERSION, palettesVisible: false }) });
  assert.deepEqual(reset(storage, 'workspace'), DEFAULT);
  assert.equal(storage.value('workspace'), undefined);
});

test('workspace state rejects unknown tabs and malformed storage', () => {
  const malformed = memoryStorage({ workspace: '{' });
  assert.deepEqual(load(malformed, 'workspace'), DEFAULT);
  const normalized = normalize({ version: VERSION, activeSidebar: 'unknown', activeRightPanel: 'unknown' });
  assert.equal(normalized.activeSidebar, 'palettes');
  assert.equal(normalized.activeRightPanel, 'ai');
});

test('workspace state migrates v1 Properties from the right panel into the left sidebar', () => {
  const migrated = normalize({ version: 1, leftRailVisible: true, rightPanelVisible: true, propertiesVisible: true, activeSidebar: 'scores', activeRightPanel: 'properties' });
  assert.equal(migrated.version, VERSION);
  assert.equal(migrated.activeSidebar, 'properties');
  assert.equal(migrated.propertiesVisible, true);
  assert.equal(migrated.rightPanelVisible, false);
  assert.equal(migrated.activeRightPanel, 'ai');
});

test('workspace state migrates v2 defaults into the v4 shell', () => {
  const migrated = normalize({ version: 2, activeSidebar: 'instruments', mixerVisible: true });
  assert.equal(migrated.version, 4);
  assert.equal(migrated.activeSidebar, 'instruments');
  assert.equal(migrated.mixerVisible, true);
  assert.equal(migrated.activeMode, 'score');
  assert.equal(migrated.toolbar.duration, true);
});

test('workspace state migrates the removed Layout sidebar and v3 utility defaults', () => {
  const migrated = normalize({ version: 3, activeSidebar: 'layout', navigatorVisible: true });
  assert.equal(migrated.version, 4);
  assert.equal(migrated.activeSidebar, 'palettes');
  assert.deepEqual(migrated.utilityDock, { navigator: 'bottom', timeline: 'bottom', piano: 'bottom' });
});

test('workspace state preserves a bounded custom workspace identity', () => {
  assert.equal(normalize({ version: 3, activeWorkspace: 'custom:Orchestration' }).activeWorkspace, 'custom:Orchestration');
  assert.equal(normalize({ version: 3, activeWorkspace: 'custom:' }).activeWorkspace, 'default');
  assert.equal(normalize({ version: 3, activeWorkspace: `custom:${'x'.repeat(49)}` }).activeWorkspace, 'default');
});
