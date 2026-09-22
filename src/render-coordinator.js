(function initRenderCoordinator(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AcordeRenderCoordinator = api;
})(typeof globalThis === 'object' ? globalThis : this, function renderCoordinatorFactory() {
  'use strict';

  class RenderCoordinator {
    constructor() { this.revision = 0; }

    async render(render, apply) {
      const revision = ++this.revision;
      const value = await render();
      if (revision !== this.revision) return { applied: false, value: null };
      apply(value);
      return { applied: true, value };
    }

    commit(value, apply) {
      ++this.revision;
      apply(value);
      return value;
    }

    invalidate() { return ++this.revision; }
  }

  return { RenderCoordinator };
});
