const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { MUSESCORE_MENU_ORDER, normalizeMenuLanguage, safeRecentFileLabel, buildApplicationMenuTemplate } = require('./application-menu.cjs');
const registry = require('../src/command-registry.js');

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
  const file = template.find((item) => item.label === '&File').submenu;
  const edit = template.find((item) => item.label === '&Edit').submenu;
  file[0].click();
  file.find((item) => item.label === 'Close').click();
  file.find((item) => item.label === 'Export…').submenu.find((item) => item.label === 'Export SVG…').click();
  edit[0].click();
  edit.find((item) => item.label === 'Select').submenu.find((item) => item.label === 'Select All').click();
  edit.find((item) => item.label === 'Find / Go to…').click();
  template.find((item) => item.label === '&View').submenu.find((item) => item.label === 'Mixer').click();
  const add = template.find((item) => item.label === '&Add').submenu;
  add.find((item) => item.label === 'Tuplets').submenu.find((item) => item.label === 'Triplet').click();
  add.find((item) => item.label === 'Lines').submenu.find((item) => item.label === 'Diminuendo').click();
  assert.deepEqual(commands, ['file:new', 'file:close', 'file:export-svg', 'edit:undo', 'edit:select-all', 'edit:find-go-to', 'view:mixer', 'add:tuplet:3', 'add:diminuendo']);
});

test('Open Recent uses a bounded native submenu without trusting file labels', () => {
  const commands = [];
  const template = buildApplicationMenuTemplate({ send: (command) => commands.push(command), platform: 'linux', recentFiles: [{ name: 'one.musicxml' }, { name: 'two\nscore.musicxml' }] });
  const recent = template.find((item) => item.label === '&File').submenu.find((item) => item.label === 'Open Recent');
  assert.deepEqual(recent.submenu.slice(0, 2).map((item) => item.label), ['one.musicxml', 'two score.musicxml']);
  recent.submenu[1].click();
  assert.deepEqual(commands, ['file:recent:1']);
  recent.submenu.at(-1).click();
  assert.deepEqual(commands, ['file:recent:1', 'file:clear-recent']);
  assert.equal(recent.submenu.at(-1).label, 'Clear Recent Files');
  assert.equal(safeRecentFileLabel('\n\t', 2), 'Score 3');
  assert.equal(safeRecentFileLabel('x'.repeat(200), 0).length, 120);
});

test('familiar MuseScore destinations retain their menu ownership', () => {
  const template = buildApplicationMenuTemplate({ send() {}, platform: 'linux' });
  const menu = (label) => template.find((item) => item.label === `&${label}`).submenu;
  assert.deepEqual(menu('File').filter((item) => item.type !== 'separator' && item.role !== 'quit').map((item) => item.label), ['New Score…', 'Open…', 'Open Recent', 'Close', 'Save', 'Save As…', 'Import / OMR…', 'Export…', 'Score Properties…', 'Parts…', 'Print…']);
  assert.ok(menu('File').some((item) => item.label === 'Parts…'));
  assert.ok(menu('File').findIndex((item) => item.label === 'Export…') < menu('File').findIndex((item) => item.label === 'Score Properties…'));
  assert.deepEqual(menu('File').find((item) => item.label === 'Export…').submenu.map((item) => item.label), ['Export MusicXML…', 'Export MIDI…', 'Export ABC…', 'Export SVG…', 'Export PDF…']);
  assert.ok(menu('File').findIndex((item) => item.label === 'Score Properties…') < menu('File').findIndex((item) => item.label === 'Parts…'));
  assert.ok(menu('Edit').some((item) => item.label === 'Cut'));
  assert.deepEqual(menu('Edit').slice(0, 3).map((item) => item.label), ['Undo', 'Redo', 'History']);
  const selectMenu = menu('Edit').find((item) => item.label === 'Select');
  assert.ok(menu('Edit').findIndex((item) => item.label === 'Delete') < menu('Edit').findIndex((item) => item.label === 'Select'));
  assert.deepEqual(selectMenu.submenu.map((item) => item.label), ['Select All', 'Select Section']);
  assert.equal(menu('Edit').find((item) => item.label === 'Find / Go to…').accelerator, 'CmdOrCtrl+F');
  assert.deepEqual(menu('View').slice(0, 6).map((item) => item.label), ['Palettes', 'Layout', 'Properties', 'History', 'Navigator', 'Mixer']);
  const toolbars = menu('View').find((item) => item.label === 'Toolbars');
  assert.deepEqual(toolbars.submenu.map((item) => item.label), ['Playback Controls', 'Note Input', 'Status Bar']);
  assert.ok(toolbars.submenu.every((item) => item.type === 'checkbox' && item.checked));
  const workspace = menu('View').find((item) => item.label === 'Workspace');
  assert.deepEqual(workspace.submenu.map((item) => item.label), ['Default']);
  assert.equal(workspace.submenu[0].type, 'radio');
  assert.equal(workspace.submenu[0].checked, true);
  assert.ok(!menu('View').some((item) => item.label === 'Panels'));
  const resetIndex = menu('View').findIndex((item) => item.label === 'Reset to Default Layout');
  const acordePanelsIndex = menu('View').findIndex((item) => item.label === 'Acorde Panels');
  assert.deepEqual(menu('View')[acordePanelsIndex].submenu.map((item) => item.label), ['AI Studio', 'Import / OMR']);
  assert.ok(resetIndex < acordePanelsIndex, 'MuseScore workspace reset stays before Acorde-specific panels');
  assert.ok(!menu('View').some((item) => item.label === 'Zoom In' || item.label === 'Zoom Out'));
  assert.ok(menu('Add').some((item) => item.label === 'Notes'));
  assert.deepEqual(menu('Add').map((item) => item.label), ['Notes', 'Tuplets', 'Measures', 'Text', 'Lines', 'Chords and Fretboard Diagrams']);
  assert.ok(menu('Add').some((item) => item.label === 'Measures'));
  assert.deepEqual(menu('Add').find((item) => item.label === 'Tuplets').submenu.map((item) => item.label), ['Duplet', 'Triplet', 'Quadruplet', 'Quintuplet', 'Sextuplet', 'Septuplet', 'Octuplet', 'Nonuplet']);
  assert.deepEqual(menu('Add').find((item) => item.label === 'Measures').submenu.map((item) => item.label), ['Append One Measure at End of Score']);
  assert.deepEqual(menu('Add').find((item) => item.label === 'Text').submenu.map((item) => item.label).filter(Boolean), ['Staff Text…', 'Dynamics…', 'Expression…', 'Rehearsal Mark…', 'Fingering…', 'Chord Symbol…', 'Lyrics…', 'Tempo…', 'Technique Text…']);
  assert.deepEqual(menu('Add').find((item) => item.label === 'Lines').submenu.map((item) => item.label), ['Slur', 'Crescendo', 'Diminuendo', 'Ottava Alta', 'Ottava Bassa', 'Pedal', 'Glissando', 'Trill Line']);
  assert.deepEqual(menu('Add').find((item) => item.label === 'Chords and Fretboard Diagrams').submenu.map((item) => item.label), ['Chord Symbol…']);
  assert.deepEqual(menu('Format').map((item) => item.label), ['Style…', 'Page Settings…', 'Layout Density…']);
  assert.ok(!menu('Format').some((item) => item.label === 'Score Properties…'));
  assert.ok(menu('Format').some((item) => item.label === 'Page Settings…'));
  assert.ok(menu('Format').some((item) => item.label === 'Layout Density…'));
  assert.deepEqual(menu('Tools').map((item) => item.label), ['Transpose…']);
  assert.ok(!menu('Tools').some((item) => item.label === 'Playback'));
  assert.equal(menu('Plugins')[0].label, 'Manage Plugins…');
  assert.deepEqual(menu('Help').slice(0, 2).map((item) => item.label), ['Acorde Composer Documentation', 'MuseScore UI Reference']);
});

test('score and selection state enable only commands that can run', () => {
  const empty = buildApplicationMenuTemplate({ send() {}, platform: 'linux', menuState: { hasScore: false, hasSelection: false, canUndo: false, canRedo: false } });
  const menu = (template, label) => template.find((item) => item.label === `&${label}`).submenu;
  assert.equal(menu(empty, 'File').find((item) => item.label === 'Save').enabled, false);
  assert.equal(menu(empty, 'File').find((item) => item.label === 'Close').enabled, false);
  assert.equal(menu(empty, 'Edit').find((item) => item.label === 'Undo').enabled, false);
  assert.equal(menu(empty, 'Add').find((item) => item.label === 'Text').submenu[0].enabled, false);

  const scoreOnly = buildApplicationMenuTemplate({ send() {}, platform: 'linux', menuState: { hasScore: true, hasSelection: false, canUndo: false, canRedo: false } });
  assert.equal(menu(scoreOnly, 'Add').find((item) => item.label === 'Notes').submenu[0].enabled, true);
  assert.equal(menu(scoreOnly, 'Add').find((item) => item.label === 'Text').submenu[0].enabled, false);
  assert.equal(menu(scoreOnly, 'Edit').find((item) => item.label === 'Paste').enabled, true);

  const selected = buildApplicationMenuTemplate({ send() {}, platform: 'linux', menuState: { hasScore: true, hasSelection: true, canUndo: true, canRedo: false } });
  assert.equal(menu(selected, 'File').find((item) => item.label === 'Save').enabled, true);
  assert.equal(menu(selected, 'Edit').find((item) => item.label === 'Undo').enabled, true);
  assert.equal(menu(selected, 'Edit').find((item) => item.label === 'Redo').enabled, false);
  assert.ok(menu(selected, 'Add').find((item) => item.label === 'Text').submenu.filter((item) => item.type !== 'separator').every((item) => item.enabled));

  const hiddenPanels = buildApplicationMenuTemplate({ send() {}, platform: 'linux', menuState: { palettesVisible: false, propertiesVisible: false, playbackControlsVisible: false, noteInputVisible: false, statusBarVisible: false } });
  const hiddenView = menu(hiddenPanels, 'View');
  assert.equal(hiddenView.find((item) => item.label === 'Palettes').checked, false);
  assert.equal(hiddenView.find((item) => item.label === 'Properties').checked, false);
  assert.ok(hiddenView.find((item) => item.label === 'Toolbars').submenu.every((item) => !item.checked));
  const openUtilityPanels = buildApplicationMenuTemplate({ send() {}, platform: 'linux', menuState: { historyVisible: true, mixerVisible: true } });
  const openView = menu(openUtilityPanels, 'View');
  assert.equal(openView.find((item) => item.label === 'History').checked, true);
  assert.equal(openView.find((item) => item.label === 'Mixer').checked, true);
});

test('custom shortcut overrides refresh native menu accelerators', () => {
  const template = buildApplicationMenuTemplate({ send() {}, platform: 'darwin', menuState: { shortcutOverrides: { 'edit:find-go-to': { key: 'g', modifier: true } } } });
  const edit = template.find((item) => item.label === 'Edit').submenu;
  assert.equal(edit.find((item) => item.label === 'Find / Go to…').accelerator, 'CmdOrCtrl+G');
});

test('application menu follows the selected English, Japanese, or Chinese UI language', () => {
  assert.equal(normalizeMenuLanguage('unknown'), 'en');
  const japanese = buildApplicationMenuTemplate({ send() {}, platform: 'darwin', language: 'ja' });
  assert.deepEqual(japanese.slice(1).map((item) => item.label), ['ファイル', '編集', '表示', '追加', 'フォーマット', 'ツール', 'プラグイン', 'ヘルプ']);
  assert.equal(japanese[1].submenu[0].label, '新規…');
  assert.ok(japanese.find((item) => item.label === '編集').submenu.some((item) => item.label === '小節に移動…'));
  assert.deepEqual(japanese.find((item) => item.label === 'ファイル').submenu.find((item) => item.label === 'エクスポート…').submenu.map((item) => item.label), ['MusicXMLを書き出す…', 'MIDIを書き出す…', 'ABCを書き出す…', 'SVGを書き出す…', 'PDFを書き出す…']);
  const chinese = buildApplicationMenuTemplate({ send() {}, platform: 'win32', language: 'zh' });
  assert.deepEqual(chinese.map((item) => item.label), ['文件(&F)', '编辑(&E)', '视图(&V)', '添加(&A)', '格式(&O)', '工具(&T)', '插件(&P)', '帮助(&H)']);
  assert.equal(chinese[0].submenu.find((item) => item.label === '分谱…').label, '分谱…');
  assert.deepEqual(chinese[0].submenu.find((item) => item.label === '导出…').submenu.map((item) => item.label), ['导出 MusicXML…', '导出 MIDI…', '导出 ABC…', '导出 SVG…', '导出 PDF…']);
});

test('main, preload, and renderer keep the application-menu bridge connected', () => {
  const read = (relativePath) => fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
  assert.match(read('electron/main.cjs'), /Menu\.setApplicationMenu\(Menu\.buildFromTemplate\(template\)\)/);
  assert.match(read('electron/preload.cjs'), /onMenuCommand:[\s\S]*ipcRenderer\.on\('menu:command'/);
  assert.match(read('electron/preload.cjs'), /setApplicationLanguage:[\s\S]*app:setLanguage/);
  assert.match(read('electron/preload.cjs'), /setApplicationMenuState:[\s\S]*app:setMenuState/);
  assert.match(read('electron/preload.cjs'), /saveDocument:[\s\S]*file:saveDocument/);
  assert.match(read('electron/preload.cjs'), /closeWindow:[\s\S]*app:closeWindow/);
  assert.match(read('electron/preload.cjs'), /clearRecentFiles:[\s\S]*app:clearRecentFiles/);
  assert.match(read('electron/preload.cjs'), /showScoreContextMenu:[\s\S]*app:showScoreContextMenu/);
  assert.match(read('electron/main.cjs'), /ipcMain\.handle\('app:setLanguage'/);
  assert.match(read('electron/main.cjs'), /ipcMain\.handle\('app:setMenuState'/);
  assert.match(read('electron/main.cjs'), /ipcMain\.handle\('file:saveDocument'/);
  assert.match(read('electron/main.cjs'), /ipcMain\.handle\('app:closeWindow'/);
  assert.match(read('electron/main.cjs'), /ipcMain\.handle\('app:clearRecentFiles'/);
  assert.match(read('electron/main.cjs'), /ipcMain\.handle\('app:showScoreContextMenu'/);
  assert.match(read('electron/main.cjs'), /recentFiles,[\s\S]*Menu\.setApplicationMenu/);
  assert.match(read('src/app.js'), /window\.acorde\.onMenuCommand\?\.\(dispatchApplicationMenuCommand\)/);
  assert.match(read('src/app.js'), /setApplicationLanguage\?\.\(language\)/);
  assert.match(read('src/index.html'), /command-registry\.js/);
  assert.match(read('electron/application-menu.cjs'), /registry\.MENU_TREE/);
  assert.match(read('electron/score-context-menu.cjs'), /registry\.CONTEXT_MENU_COMMANDS/);
  assert.match(read('src/app.js'), /AcordeCommandRegistry\?\.resolveCommand/);
  assert.match(read('src/app.js'), /rendererCommandHandlers/);
  assert.match(read('src/app.js'), /commandForKeyboardEvent/);
  assert.doesNotMatch(read('src/app.js'), /const buttonTargets/);
  assert.doesNotMatch(read('src/app.js'), /view:instruments/);
  for (const command of ['file:score-properties', 'file:export-musicxml', 'file:export-midi', 'file:export-abc', 'file:export-svg', 'file:export-pdf', 'view:note-input-toolbar', 'view:layout', 'view:reset-layout', 'view:workspace-default', 'view:status-bar', 'format:page-settings', 'format:layout-density', 'file:recent:0', 'file:export', 'tools:transpose', 'add:staff-text', 'add:technique-text', 'add:tuplet:3', 'add:dynamics', 'add:crescendo', 'add:ottava-alta', 'view:history']) assert.ok(registry.resolveCommand(command), `registry resolves ${command}`);
  assert.match(read('src/app.js'), /setApplicationMenuState\?\.\(state\)/);
});

test('MuseScore-compatible tool accelerators do not reuse S for selection', () => {
  assert.equal(registry.commandForKeyboardEvent({ key: 'Escape' }), 'tool:select');
  assert.equal(registry.commandForKeyboardEvent({ key: 's' }), 'add:slur');
  assert.equal(registry.commandForKeyboardEvent({ key: 'l' }), 'add:slur');
  assert.equal(registry.commandForKeyboardEvent({ key: 's', metaKey: true }), 'file:save');
});

test('checked-in MuseScore menu contract covers three languages and desktop platforms', () => {
  const contract = JSON.parse(fs.readFileSync(path.join(__dirname, '../qa/musescore-menu-contract.json'), 'utf8'));
  const flatten = (items) => items.flatMap((item) => [item, ...(Array.isArray(item.submenu) ? flatten(item.submenu) : [])]);
  for (const platform of ['darwin', 'win32', 'linux']) {
    for (const language of ['en', 'ja', 'zh']) {
      const template = buildApplicationMenuTemplate({ send() {}, platform, language });
      const menus = platform === 'darwin' ? template.slice(1) : template;
      const expectedLabels = contract.topLevel[language].map((label, index) => platform === 'darwin' ? label : language === 'en' ? `&${label}` : `${label}(&${contract.mnemonics[index]})`);
      assert.deepEqual(menus.map((menu) => menu.label), expectedLabels, `${platform}/${language} top-level order`);
      assert.deepEqual(menus.map((menu) => menu.submenu.filter((item) => item.type === 'separator').length), contract.separatorCounts[platform], `${platform}/${language} separators`);
      const items = flatten(menus);
      for (const command of contract.requiredCommands) {
        const expectedCount = contract.allowedDuplicateCommands[command] || 1;
        assert.equal(items.filter((item) => item.id === command).length, expectedCount, `${platform}/${language} includes ${command} exactly ${expectedCount} time(s)`);
      }
      for (const [command, accelerator] of Object.entries(contract.accelerators)) assert.equal(items.find((item) => item.id === command)?.accelerator, accelerator, `${platform}/${language} accelerator ${command}`);
    }
  }
  for (const command of contract.requiredCommands) assert.ok(registry.resolveCommand(command), `registry resolves ${command}`);
});
