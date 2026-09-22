(function initWorkspaceState(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AcordeWorkspaceState = api;
})(typeof globalThis === 'object' ? globalThis : this, function workspaceStateFactory() {
  'use strict';

  const VERSION = 1;
  const DEFAULT = Object.freeze({
    version: VERSION,
    leftRailVisible: true,
    rightPanelVisible: true,
    palettesVisible: true,
    propertiesVisible: true,
    mixerVisible: false,
    historyVisible: false,
    playbackControlsVisible: true,
    noteInputVisible: true,
    statusBarVisible: true,
    navigatorVisible: true,
    activeSidebar: 'palettes',
    activeRightPanel: 'properties',
  });
  const SIDEBARS = new Set(['palettes', 'scores']);
  const RIGHT_PANELS = new Set(['properties', 'ai', 'omr']);

  function normalize(value) {
    const input = value && typeof value === 'object' && Number(value.version) === VERSION ? value : {};
    return {
      version: VERSION,
      leftRailVisible: input.leftRailVisible !== false,
      rightPanelVisible: input.rightPanelVisible !== false,
      palettesVisible: input.palettesVisible !== false,
      propertiesVisible: input.propertiesVisible !== false,
      mixerVisible: input.mixerVisible === true,
      historyVisible: input.historyVisible === true,
      playbackControlsVisible: input.playbackControlsVisible !== false,
      noteInputVisible: input.noteInputVisible !== false,
      statusBarVisible: input.statusBarVisible !== false,
      navigatorVisible: input.navigatorVisible !== false,
      activeSidebar: SIDEBARS.has(input.activeSidebar) ? input.activeSidebar : DEFAULT.activeSidebar,
      activeRightPanel: RIGHT_PANELS.has(input.activeRightPanel) ? input.activeRightPanel : DEFAULT.activeRightPanel,
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
