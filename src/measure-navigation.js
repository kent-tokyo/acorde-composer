(function exposeMeasureNavigation(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AcordeMeasureNavigation = api;
}(typeof globalThis === 'object' ? globalThis : this, () => {
  function parseMeasureRange(value, measureCount) {
    const count = Number(measureCount);
    if (!Number.isInteger(count) || count < 1) return null;
    const match = String(value ?? '').trim().match(/^(\d+)(?:\s*[-–—:]\s*(\d+))?$/);
    if (!match) return null;
    const start = Number(match[1]) - 1;
    const end = Number(match[2] || match[1]) - 1;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || end < start || end >= count) return null;
    return [start, end];
  }

  return Object.freeze({ parseMeasureRange });
}));
