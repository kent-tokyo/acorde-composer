(function initWorkspaceState(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AcordeWorkspaceState = api;
})(typeof globalThis === 'object' ? globalThis : this, function workspaceStateFactory() {
  'use strict';

  const VERSION = 2;
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
    activeSidebar: 'palettes',
    activeRightPanel: 'ai',
  });
  const SIDEBARS = new Set(['palettes', 'instruments', 'properties']);
  const RIGHT_PANELS = new Set(['ai', 'omr']);

  function normalize(value) {
    const candidate = value && typeof value === 'object' && !Array.isArray(value) ? value : null;
    const sourceVersion = Number(candidate?.version);
    const input = sourceVersion === VERSION || sourceVersion === 1 ? candidate : {};
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
      activeSidebar,
      activeRightPanel,
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

  return { VERSION, DEFAULT, normalize, load, save, reset };
});
