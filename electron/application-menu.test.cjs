const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { MUSESCORE_MENU_ORDER, buildApplicationMenuTemplate } = require('./application-menu.cjs');

test('application menu follows the MuseScore top-level order on Windows and Linux', () => {
  const template = buildApplicationMenuTemplate({ send() {}, platform: 'win32' });
  assert.deepEqual(template.map((item) => item.label.replace('&', '')), MUSESCORE_MENU_ORDER);
  assert.ok(template.every((item) => item.label.startsWith('&')), 'Windows/Linux menus expose Alt-key mnemonics');
});

test('macOS keeps its application menu before the MuseScore-compatible order', () => {
  const template = buildApplicationMenuTemplate({ send() {}, platform: 'darwin' });
  assert.equal(template[0].label, 'Acorde Composer');
  assert.deepEqual(template.slice(1).map((item) => item.label), MUSESCORE_MENU_ORDER);
});

test('menu items dispatch stable renderer commands', () => {
  const commands = [];
  const template = buildApplicationMenuTemplate({ send: (command) => commands.push(command), platform: 'linux' });
  template.find((item) => item.label === '&File').submenu[0].click();
  template.find((item) => item.label === '&Edit').submenu[0].click();
  template.find((item) => item.label === '&View').submenu[0].submenu.find((item) => item.label === 'Mixer').click();
  assert.deepEqual(commands, ['file:new', 'edit:undo', 'view:mixer']);
});

test('familiar MuseScore destinations retain their menu ownership', () => {
  const template = buildApplicationMenuTemplate({ send() {}, platform: 'linux' });
  const menu = (label) => template.find((item) => item.label === `&${label}`).submenu;
  assert.ok(menu('File').some((item) => item.label === 'Parts…'));
  assert.ok(menu('Edit').some((item) => item.label === 'Cut'));
  assert.deepEqual(menu('View').slice(0, 2).map((item) => item.label), ['Panels', 'Toolbars']);
  assert.deepEqual(menu('View')[0].submenu.slice(0, 4).map((item) => item.label), ['Palettes', 'Properties', 'Instruments', 'Mixer']);
  assert.ok(menu('Add').some((item) => item.label === 'Measures'));
  assert.ok(menu('Format').some((item) => item.label === 'Score Properties…'));
  assert.ok(menu('Tools').some((item) => item.label === 'Transpose Up a Semitone'));
  assert.equal(menu('Plugins')[0].label, 'Manage Plugins…');
  assert.equal(menu('Help')[0].label, 'Online Handbook');
});

test('main, preload, and renderer keep the application-menu bridge connected', () => {
  const read = (relativePath) => fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
  assert.match(read('electron/main.cjs'), /Menu\.setApplicationMenu\(Menu\.buildFromTemplate\(template\)\)/);
  assert.match(read('electron/preload.cjs'), /onMenuCommand:[\s\S]*ipcRenderer\.on\('menu:command'/);
  assert.match(read('src/app.js'), /window\.acorde\.onMenuCommand\?\.\(dispatchApplicationMenuCommand\)/);
  assert.match(read('src/app.js'), /command === 'file:parts' \|\| command === 'view:instruments'/);
  assert.match(read('src/app.js'), /command === 'view:note-input-toolbar'/);
});

test('MuseScore-compatible tool accelerators do not reuse S for selection', () => {
  const app = fs.readFileSync(path.join(__dirname, '..', 'src/app.js'), 'utf8');
  assert.match(app, /event\.key === 'Escape'[\s\S]*selectTool\('select'\)/);
  assert.match(app, /s: 'slur', l: 'slur'/);
  assert.doesNotMatch(app, /s: 'select'/);
});
