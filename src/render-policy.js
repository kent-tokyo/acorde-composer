(function initRenderPolicy(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AcordeRenderPolicy = api;
})(typeof globalThis === 'object' ? globalThis : this, function renderPolicyFactory() {
  'use strict';

  function boundedWidth(value) {
    const width = Number(value);
    if (!Number.isFinite(width)) return 900;
    return Math.max(560, Math.min(1600, Math.round(width)));
  }

  function measuresPerSystem(value) {
    const width = boundedWidth(value);
    if (width < 700) return 2;
    if (width < 1000) return 3;
    return 4;
  }

  function normalizeDensity(value) {
    const density = String(value || 'adaptive');
    return density === 'adaptive' || ['2', '3', '4'].includes(density) ? density : 'adaptive';
  }

  function options(value, density = 'adaptive') {
    const width = boundedWidth(value);
    const normalizedDensity = normalizeDensity(density);
    return { width, measuresPerSystem: normalizedDensity === 'adaptive' ? measuresPerSystem(width) : Number(normalizedDensity), staffSize: 10, interactive: true };
  }

  function isRecoverableWidthError(error) {
    const message = String(error?.message || error || '');
    return message.includes('minimum measure widths exceed the available system width')
      || message.includes('leave no usable measure width');
  }

  function measureHitArea(measureIndex, measureCount, density, bounds) {
    const index = Number(measureIndex);
    const count = Number(measureCount);
    const perSystem = Number(density);
    if (!Number.isInteger(index) || !Number.isInteger(count) || !Number.isInteger(perSystem)
      || index < 0 || index >= count || count < 1 || perSystem < 1
      || !bounds || !Number.isFinite(bounds.x) || !Number.isFinite(bounds.y)
      || !Number.isFinite(bounds.width) || !Number.isFinite(bounds.height)
      || bounds.width <= 0 || bounds.height <= 0) return null;
    const rowStart = Math.floor(index / perSystem) * perSystem;
    const measuresInRow = Math.min(perSystem, count - rowStart);
    const width = bounds.width / measuresInRow;
    return {
      x: bounds.x + (index - rowStart) * width,
      y: bounds.y - 8,
      width,
      height: bounds.height + 16,
    };
  }

  return { boundedWidth, measuresPerSystem, normalizeDensity, options, isRecoverableWidthError, measureHitArea };
});
