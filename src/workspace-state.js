(function initWorkspaceState(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AcordeWorkspaceState = api;
})(typeof globalThis === 'object' ? globalThis : this, function workspaceStateFactory() {
  'use strict';

  const VERSION = 4;
  const TOOLBAR_ITEMS = Object.freeze(['select', 'note', 'rest', 'duration', 'dot', 'tie', 'accidental', 'tuplet', 'voice', 'articulation', 'undo-redo']);
  const DEFAULT_TOOLBAR = Object.freeze(Object.fromEntries(TOOLBAR_ITEMS.map((item) => [item, true])));
  const DEFAULT = Object.freeze({
    version: VERSION,
    leftRailVisible: true,
    rightPanelVisible: false,
    palettesVisible: true,
    propertiesVisible: false,
    mixerVisible: false,
    historyVisible: false,
    playbackControlsVisible: true,
    noteInputVisible: true,
    statusBarVisible: true,
    navigatorVisible: true,
    timelineVisible: false,
    pianoVisible: false,
    activeSidebar: 'palettes',
    activeRightPanel: 'ai',
    activeMode: 'score',
    activeWorkspace: 'default',
    mixerDock: 'right',
    utilityDock: Object.freeze({ navigator: 'bottom', timeline: 'bottom', piano: 'bottom' }),
    theme: 'light',
    toolbar: DEFAULT_TOOLBAR,
  });
  const PRESETS = Object.freeze({
    default: DEFAULT,
    minimal: Object.freeze({ ...DEFAULT, activeWorkspace: 'minimal', leftRailVisible: false, navigatorVisible: false }),
    playback: Object.freeze({ ...DEFAULT, activeWorkspace: 'playback', leftRailVisible: false, mixerVisible: true, navigatorVisible: false }),
    review: Object.freeze({ ...DEFAULT, activeWorkspace: 'review', activeSidebar: 'properties', palettesVisible: false, propertiesVisible: true, timelineVisible: true }),
  });
  const SIDEBARS = new Set(['palettes', 'instruments', 'properties']);
  const RIGHT_PANELS = new Set(['ai', 'omr']);
  const MODES = new Set(['home', 'score', 'publish']);
  const WORKSPACES = new Set(Object.keys(PRESETS));
  const MIXER_DOCKS = new Set(['right', 'floating']);
  const UTILITY_DOCKS = new Set(['bottom', 'floating']);
  const THEMES = new Set(['light', 'dark', 'high-contrast']);

  function normalizeToolbar(value) {
    const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    return Object.fromEntries(TOOLBAR_ITEMS.map((item) => [item, source[item] !== false]));
  }

  function normalizeUtilityDock(value) {
    const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    return Object.fromEntries(['navigator', 'timeline', 'piano'].map((name) => [name, UTILITY_DOCKS.has(source[name]) ? source[name] : DEFAULT.utilityDock[name]]));
  }

  function normalize(value) {
    const candidate = value && typeof value === 'object' && !Array.isArray(value) ? value : null;
    const sourceVersion = Number(candidate?.version);
    const input = sourceVersion === VERSION || sourceVersion === 3 || sourceVersion === 2 || sourceVersion === 1 ? candidate : {};
    const legacyProperties = sourceVersion === 1 && input.activeRightPanel === 'properties' && input.propertiesVisible !== false;
    const activeSidebar = SIDEBARS.has(input.activeSidebar)
      ? input.activeSidebar
      : legacyProperties ? 'properties' : DEFAULT.activeSidebar;
    const activeRightPanel = RIGHT_PANELS.has(input.activeRightPanel) ? input.activeRightPanel : DEFAULT.activeRightPanel;
    return {
      version: VERSION,
      leftRailVisible: input.leftRailVisible !== false,
      rightPanelVisible: sourceVersion === 1 && input.activeRightPanel === 'properties' ? false : input.rightPanelVisible === true,
      palettesVisible: input.leftRailVisible !== false && activeSidebar === 'palettes',
      propertiesVisible: input.leftRailVisible !== false && activeSidebar === 'properties',
      mixerVisible: input.mixerVisible === true,
      historyVisible: input.historyVisible === true,
      playbackControlsVisible: input.playbackControlsVisible !== false,
      noteInputVisible: input.noteInputVisible !== false,
      statusBarVisible: input.statusBarVisible !== false,
      navigatorVisible: input.navigatorVisible !== false,
      timelineVisible: input.timelineVisible === true,
      pianoVisible: input.pianoVisible === true,
      activeSidebar,
      activeRightPanel,
      activeMode: MODES.has(input.activeMode) ? input.activeMode : DEFAULT.activeMode,
      activeWorkspace: WORKSPACES.has(input.activeWorkspace) || (typeof input.activeWorkspace === 'string' && /^custom:[^\u0000-\u001f]{1,48}$/.test(input.activeWorkspace)) ? input.activeWorkspace : DEFAULT.activeWorkspace,
      mixerDock: MIXER_DOCKS.has(input.mixerDock) ? input.mixerDock : DEFAULT.mixerDock,
      utilityDock: normalizeUtilityDock(input.utilityDock),
      theme: THEMES.has(input.theme) ? input.theme : DEFAULT.theme,
      toolbar: normalizeToolbar(input.toolbar),
    };
  }

  function load(storage, key) {
    try { return normalize(JSON.parse(storage.getItem(key) || 'null')); } catch { return { ...DEFAULT }; }
  }

  function save(storage, key, value) {
    const normalized = normalize(value);
    storage.setItem(key, JSON.stringify(normalized));
    return normalized;
  }

  function reset(storage, key) {
    storage.removeItem(key);
    return { ...DEFAULT };
  }

  function preset(name) { return { ...(PRESETS[WORKSPACES.has(name) ? name : 'default']), toolbar: { ...DEFAULT_TOOLBAR } }; }

  return { VERSION, DEFAULT, PRESETS, TOOLBAR_ITEMS, DEFAULT_TOOLBAR, normalizeToolbar, normalizeUtilityDock, normalize, preset, load, save, reset };
});
