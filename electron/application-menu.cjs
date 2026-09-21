const MUSESCORE_MENU_ORDER = Object.freeze(['File', 'Edit', 'View', 'Add', 'Format', 'Tools', 'Plugins', 'Help']);

function commandItem(label, command, send, extra = {}) {
  return { label, click: () => send(command), ...extra };
}

function buildApplicationMenuTemplate({ send, platform = process.platform, openHandbook = () => {} } = {}) {
  if (typeof send !== 'function') throw new TypeError('menu command sender is required');
  const file = {
    label: 'File',
    submenu: [
      commandItem('New Score…', 'file:new', send, { accelerator: 'CmdOrCtrl+N' }),
      commandItem('Open…', 'file:open', send, { accelerator: 'CmdOrCtrl+O' }),
      commandItem('Open Recent', 'file:recent', send),
      { type: 'separator' },
      commandItem('Save As…', 'file:save', send, { accelerator: 'CmdOrCtrl+S' }),
      { label: 'Export', submenu: [
        commandItem('MusicXML…', 'file:save', send),
        commandItem('MIDI…', 'file:export-midi', send),
        commandItem('ABC…', 'file:export-abc', send),
        commandItem('SVG…', 'file:export-svg', send),
        commandItem('PDF…', 'file:export-pdf', send),
      ] },
      commandItem('Parts…', 'file:parts', send),
      commandItem('Print…', 'file:print', send, { accelerator: 'CmdOrCtrl+P' }),
      ...(platform === 'darwin' ? [] : [{ type: 'separator' }, { role: 'quit' }]),
    ],
  };
  const edit = {
    label: 'Edit',
    submenu: [
      commandItem('Undo', 'edit:undo', send, { accelerator: 'CmdOrCtrl+Z' }),
      commandItem('Redo', 'edit:redo', send, { accelerator: platform === 'darwin' ? 'Cmd+Shift+Z' : 'Ctrl+Y' }),
      { type: 'separator' },
      commandItem('Cut', 'edit:cut', send, { accelerator: 'CmdOrCtrl+X' }),
      commandItem('Copy', 'edit:copy', send, { accelerator: 'CmdOrCtrl+C' }),
      commandItem('Paste', 'edit:paste', send, { accelerator: 'CmdOrCtrl+V' }),
      commandItem('Delete', 'edit:delete', send, { accelerator: 'Delete' }),
      { type: 'separator' },
      commandItem('Edit History…', 'edit:history', send),
      ...(platform === 'darwin' ? [] : [commandItem('Preferences…', 'app:preferences', send)]),
    ],
  };
  const view = {
    label: 'View',
    submenu: [
      { label: 'Panels', submenu: [
        commandItem('Palettes', 'view:palettes', send),
        commandItem('Properties', 'view:properties', send, { accelerator: 'F8' }),
        commandItem('Instruments', 'view:instruments', send),
        commandItem('Mixer', 'view:mixer', send, { accelerator: 'F10' }),
        commandItem('AI Studio', 'view:ai', send),
        commandItem('Import / OMR', 'view:omr', send),
      ] },
      { label: 'Toolbars', submenu: [
        commandItem('Note Input', 'view:note-input-toolbar', send),
        commandItem('Playback', 'view:playback-toolbar', send),
      ] },
      { type: 'separator' },
      commandItem('Zoom In', 'view:zoom-in', send, { accelerator: 'CmdOrCtrl+=' }),
      commandItem('Zoom Out', 'view:zoom-out', send, { accelerator: 'CmdOrCtrl+-' }),
    ],
  };
  const add = {
    label: 'Add',
    submenu: [
      commandItem('Note Input', 'add:note', send, { accelerator: 'N' }),
      commandItem('Rest Input', 'add:rest', send, { accelerator: 'R' }),
      { label: 'Measures', submenu: [
        commandItem('Add Measure', 'add:measure', send, { accelerator: 'Insert' }),
        commandItem('Delete Measure', 'add:delete-measure', send),
      ] },
      { label: 'Text', submenu: [
        commandItem('Lyrics…', 'add:lyrics', send),
        commandItem('Chord Symbol…', 'add:chord', send),
        commandItem('Rehearsal Mark…', 'add:rehearsal', send),
        commandItem('Tempo…', 'add:tempo', send),
        commandItem('Expression…', 'add:expression', send),
      ] },
      { label: 'Lines', submenu: [
        commandItem('Slur', 'add:slur', send, { accelerator: 'S' }),
        commandItem('Tie', 'add:tie', send, { accelerator: 'T' }),
        commandItem('Hairpin', 'add:hairpin', send, { accelerator: 'H' }),
        commandItem('Pedal', 'add:pedal', send),
        commandItem('Ottava', 'add:ottava', send),
        commandItem('Glissando', 'add:glissando', send),
        commandItem('Trill Line', 'add:trill', send),
      ] },
    ],
  };
  const format = {
    label: 'Format',
    submenu: [
      commandItem('Score Properties…', 'format:score-properties', send),
      commandItem('Text Style…', 'format:text-style', send),
      { type: 'separator' },
      commandItem('Page Break', 'format:page-break', send),
      commandItem('System Break', 'format:system-break', send),
      commandItem('Multi-measure Rest…', 'format:multi-rest', send),
    ],
  };
  const tools = {
    label: 'Tools',
    submenu: [
      commandItem('Transpose Up a Semitone', 'tools:transpose-up', send),
      commandItem('Transpose Down a Semitone', 'tools:transpose-down', send),
      { type: 'separator' },
      commandItem('MIDI Input', 'tools:midi-input', send),
      commandItem('Playback', 'tools:playback', send, { accelerator: 'Space' }),
    ],
  };
  const plugins = { label: 'Plugins', submenu: [
    { label: 'Manage Plugins…', enabled: false },
    { type: 'separator' },
    { label: 'No plugins installed', enabled: false },
  ] };
  const help = {
    label: 'Help',
    submenu: [
      { label: 'Online Handbook', click: openHandbook },
      commandItem('Keyboard Shortcuts…', 'help:shortcuts', send, { accelerator: 'Shift+/' }),
      ...(platform === 'darwin' ? [] : [{ type: 'separator' }, { role: 'about' }]),
    ],
  };
  const ordered = [file, edit, view, add, format, tools, plugins, help];
  if (platform !== 'darwin') {
    ordered.forEach((item) => { item.label = `&${item.label}`; });
    return ordered;
  }
  return [{ label: 'Acorde Composer', submenu: [
    { role: 'about' },
    commandItem('Preferences…', 'app:preferences', send),
    { type: 'separator' },
    { role: 'services' },
    { type: 'separator' },
    { role: 'hide' }, { role: 'hideOthers' }, { role: 'unhide' },
    { type: 'separator' },
    { role: 'quit' },
  ] }, ...ordered];
}

module.exports = { MUSESCORE_MENU_ORDER, buildApplicationMenuTemplate };
