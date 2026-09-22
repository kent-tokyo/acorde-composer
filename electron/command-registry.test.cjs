const test = require('node:test');
const assert = require('node:assert/strict');
const registry = require('../src/command-registry.js');

function walkMenu(nodes) {
  return nodes.flatMap((node) => [node, ...(node.type === 'submenu' ? walkMenu(node.children) : [])]);
}

test('every native and score-context command resolves through the shared registry', () => {
  const menuCommands = walkMenu(registry.MENU_TREE).filter((node) => node.type === 'command').map((node) => node.id);
  for (const id of [...menuCommands, ...registry.CONTEXT_MENU_COMMANDS]) assert.ok(registry.resolveCommand(id), `missing definition for ${id}`);
  assert.deepEqual(registry.MUSESCORE_MENU_ORDER, ['File', 'Edit', 'View', 'Add', 'Format', 'Tools', 'Plugins', 'Help']);
});

test('registry owns menu state, context state, dynamic commands, and platform shortcuts', () => {
  for (const definition of registry.COMMANDS) assert.ok(definition.buttonTarget || definition.handler !== 'button', `command needs a renderer route: ${definition.id}`);
  assert.equal(registry.commandEnabled('file:save', { hasScore: false }), false);
  assert.equal(registry.commandEnabled('add:slur', { hasScore: true, hasSelection: false }), false);
  assert.equal(registry.commandChecked('view:mixer', { mixerVisible: true }), true);
  assert.equal(registry.commandChecked('view:mixer', { mixerVisible: false }), false);
  assert.equal(registry.commandChecked('view:navigator', { navigatorVisible: false }), false);
  assert.equal(registry.commandEnabled('edit:select-section', { hasScore: true, sectionSelectionAvailable: false }), false);
  assert.equal(registry.commandEnabled('edit:select-section', { hasScore: true, sectionSelectionAvailable: true }), true);
  assert.equal(registry.resolveCommand('add:tuplet:5').label, 'Quintuplet');
  assert.equal(registry.resolveCommand('file:recent:7').recentIndex, 7);
  assert.equal(registry.contextCommandEnabled('edit:cut', { hasScore: true, kind: 'measure' }), false);
  assert.equal(registry.contextCommandEnabled('edit:paste', { hasScore: true, kind: 'unknown' }), true);
  assert.equal(registry.commandForKeyboardEvent({ key: 'z', metaKey: true }, 'darwin'), 'edit:undo');
  assert.equal(registry.commandForKeyboardEvent({ key: 'z', metaKey: true, shiftKey: true }, 'darwin'), 'edit:redo');
  assert.equal(registry.commandForKeyboardEvent({ key: 'y', ctrlKey: true }, 'default'), 'edit:redo');
  assert.equal(registry.commandForKeyboardEvent({ key: ' ', code: 'Space' }, 'default'), 'playback:toggle');
});

test('format-specific exports and Format actions keep one explicit renderer route', () => {
  assert.deepEqual(
    ['musicxml', 'midi', 'abc', 'svg', 'pdf'].map((format) => registry.resolveCommand(`file:export-${format}`).buttonTarget),
    ['save-button', 'midi-save-button', 'abc-save-button', 'svg-save-button', 'pdf-save-button'],
  );
  assert.deepEqual(
    ['format:page-settings', 'format:layout-density'].map((id) => registry.resolveCommand(id).handler),
    ['page-settings', 'layout-density'],
  );
});

test('customizable shortcuts are normalized, collision-safe, and override browser plus native bindings', () => {
  const overrides = registry.normalizeShortcutOverrides({ 'add:note': { key: 'q' }, 'playback:toggle': { key: ' ', code: 'Space', modifier: true }, 'file:save': { key: 'x' } });
  assert.deepEqual(overrides, { 'add:note': { key: 'q' }, 'playback:toggle': { key: 'Space', code: 'Space', modifier: true } });
  assert.equal(registry.commandForKeyboardEvent({ key: 'q' }, 'default', overrides), 'add:note');
  assert.equal(registry.commandForKeyboardEvent({ key: 'n' }, 'default', overrides), null);
  assert.equal(registry.commandAccelerator('playback:toggle', 'darwin', overrides), 'CmdOrCtrl+SPACE');
  assert.equal(registry.findShortcutConflict('add:note', { key: 'x', modifier: true }, overrides), 'edit:cut');
  assert.equal(registry.shortcutLabel({ key: 'q', modifier: true }, 'darwin'), '⌘Q');
});
