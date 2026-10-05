(function initMuseScoreShell(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AcordeMuseScoreShell = api;
})(typeof globalThis === 'object' ? globalThis : this, function museScoreShellFactory() {
  'use strict';

  const MODES = Object.freeze(['home', 'score', 'publish']);
  const FOCUS_REGIONS = Object.freeze(['mode-tabs', 'score-actions', 'playback-toolbar', 'note-input-toolbar', 'left-sidebar', 'score-view', 'right-dock', 'status-bar']);
  const TOOLBAR_TARGETS = Object.freeze({
    note: Object.freeze(['note-tool']),
    duration: Object.freeze(['duration-buttons']),
    dot: Object.freeze(['dot-button']),
    rest: Object.freeze(['rest-tool']),
    accidental: Object.freeze(['accidental-buttons']),
    tie: Object.freeze(['tie-tool']),
    slur: Object.freeze(['slur-tool']),
    articulation: Object.freeze(['articulation-buttons']),
    tuplet: Object.freeze(['tuplet-button']),
    flip: Object.freeze(['flip-button']),
    voice: Object.freeze(['voice-button-1', 'voice-button-2']),
    'extra-voices': Object.freeze(['voice-button-3', 'voice-button-4']),
  });

  function normalizeMode(value) { return MODES.includes(value) ? value : 'score'; }

  function navigatorPages(measureCount, selectedMeasure = 0, measuresPerPage = 8) {
    const total = Number.isInteger(measureCount) && measureCount > 0 ? measureCount : 0;
    const size = Number.isInteger(measuresPerPage) && measuresPerPage > 0 ? Math.min(32, measuresPerPage) : 8;
    if (!total) return [];
    const selected = Math.max(0, Math.min(total - 1, Number(selectedMeasure) || 0));
    return Array.from({ length: Math.ceil(total / size) }, (_, index) => {
      const start = index * size;
      const end = Math.min(total - 1, start + size - 1);
      return Object.freeze({ page: index + 1, start, end, active: selected >= start && selected <= end });
    });
  }

  function timelineRows(score) {
    const parts = Array.isArray(score?.parts) ? score.parts : [];
    return parts.map((part, partIndex) => {
      const staves = Array.isArray(part?.staves) ? part.staves : [];
      const measureCount = staves.reduce((maximum, staff) => Math.max(maximum, Array.isArray(staff?.measures) ? staff.measures.length : 0), 0);
      return Object.freeze({ partIndex, label: String(part?.name || `Part ${partIndex + 1}`), measureCount });
    });
  }

  function nextFocusRegion(current, available, backwards = false) {
    const enabled = FOCUS_REGIONS.filter((id) => available.includes(id));
    if (!enabled.length) return null;
    const index = enabled.indexOf(current);
    const offset = backwards ? -1 : 1;
    return enabled[(Math.max(0, index) + offset + enabled.length) % enabled.length];
  }

  function normalizeWorkspaceName(value) {
    const normalized = String(value || '').trim().replace(/\s+/g, ' ').slice(0, 48);
    return normalized && !/[\u0000-\u001f]/.test(normalized) ? normalized : null;
  }

  return { MODES, FOCUS_REGIONS, TOOLBAR_TARGETS, normalizeMode, navigatorPages, timelineRows, nextFocusRegion, normalizeWorkspaceName };
});
