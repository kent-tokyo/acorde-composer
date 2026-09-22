const registry = require('../src/command-registry.js');
const { CONTEXT_KINDS, normalizeContextMenuState } = registry;

function buildScoreContextMenuTemplate({ send, state = {}, language = 'en', platform = process.platform } = {}) {
  if (typeof send !== 'function') throw new TypeError('context menu command sender is required');
  const context = normalizeContextMenuState(state);
  const resolvedLanguage = registry.normalizeMenuLanguage(language);
  return registry.CONTEXT_MENU_COMMANDS.flatMap((id, index) => {
    const definition = registry.resolveCommand(id);
    const accelerator = registry.commandAccelerator(definition, platform, state.shortcutOverrides);
    const item = { id, label: registry.translate(definition.label, resolvedLanguage), enabled: registry.contextCommandEnabled(definition, context), ...(accelerator ? { accelerator } : {}), click: () => send(id) };
    return index === 4 ? [{ type: 'separator' }, item] : [item];
  });
}

module.exports = { CONTEXT_KINDS, normalizeContextMenuState, buildScoreContextMenuTemplate };
