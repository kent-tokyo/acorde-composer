(function initCommandRegistry(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AcordeCommandRegistry = api;
})(typeof globalThis === 'object' ? globalThis : this, function commandRegistryFactory() {
  'use strict';

  const MUSESCORE_MENU_ORDER = Object.freeze(['File', 'Edit', 'View', 'Add', 'Format', 'Tools', 'Plugins', 'Help']);
  const MUSESCORE_MENU_MNEMONICS = Object.freeze(['F', 'E', 'V', 'A', 'O', 'T', 'P', 'H']);
  const MENU_LABELS = Object.freeze({
    ja: {
      'Acorde Composer': 'Acorde Composer', File: 'ファイル', Edit: '編集', View: '表示', Add: '追加', Format: 'フォーマット', Tools: 'ツール', Plugins: 'プラグイン', Help: 'ヘルプ',
      'New Score…': '新規…', 'Open…': '開く…', 'Open Recent': '最近開いたファイル', 'No Recent Scores': '最近開いた楽譜はありません', 'Clear Recent Files': '最近開いたファイル一覧をクリア', Close: '閉じる', Save: '保存', 'Save As…': '名前を付けて保存…', 'Import / OMR…': 'インポート / OMR…', 'Score Properties…': 'プロジェクトのプロパティ…', 'Parts…': 'パート…', 'Export…': 'エクスポート…', 'Export MusicXML…': 'MusicXMLを書き出す…', 'Export MIDI…': 'MIDIを書き出す…', 'Export ABC…': 'ABCを書き出す…', 'Export SVG…': 'SVGを書き出す…', 'Export PDF…': 'PDFを書き出す…', 'Print…': '印刷…',
      Undo: '元に戻す', Redo: 'やり直す', History: '履歴', Cut: '切り取り', Copy: 'コピー', Paste: '貼り付け', Delete: '削除', Select: '選択', 'Select All': 'すべて選択', 'Select Section': 'セクションを選択', 'Find / Go to…': '小節に移動…', 'Preferences…': '環境設定…',
      Palettes: 'パレット', Layout: 'レイアウト', Properties: 'プロパティ', Navigator: 'ナビゲーター', Mixer: 'ミキサー', Workspace: 'ワークスペース', Default: 'デフォルト', 'Acorde Panels': 'Acordeパネル', 'AI Studio': 'AIスタジオ', 'Import / OMR': 'インポート / OMR', Toolbars: 'ツールバー', Notes: '音符', 'Note Input': '音符入力', 'Playback Controls': '再生コントロール', 'Status Bar': 'ステータスバー', 'Reset to Default Layout': 'デフォルトのレイアウトを復元',
      'Rest Input': '休符入力', Tuplets: '連符', Duplet: '2連符', Triplet: '3連符', Quadruplet: '4連符', Quintuplet: '5連符', Sextuplet: '6連符', Septuplet: '7連符', Octuplet: '8連符', Nonuplet: '9連符', Measures: '小節', 'Append One Measure at End of Score': 'スコアの終わりに小節を1つ挿入', Text: 'テキスト', 'Staff Text…': '譜表テキスト…', 'Dynamics…': '強弱記号…', 'Technique Text…': '奏法テキスト…', 'Fingering…': '運指…', 'Lyrics…': '歌詞…', 'Chord Symbol…': 'コード記号…', 'Rehearsal Mark…': '練習番号…', 'Tempo…': 'テンポ記号…', 'Expression…': '発想標語テキスト…', Lines: '線', Slur: 'スラー', Crescendo: 'クレッシェンド', Diminuendo: 'ディミヌエンド', 'Ottava Alta': 'オッターヴァ・アルタ', 'Ottava Bassa': 'オッターヴァ・バッサ', Pedal: 'ペダル', Glissando: 'グリッサンド', 'Trill Line': 'トリル線', 'Chords and Fretboard Diagrams': 'コードとフレットボードダイアグラム',
      'Page Settings…': 'ページ設定…', 'Layout Density…': 'レイアウト密度…', 'Style…': 'スタイル…', 'Transpose…': '移調…', 'Manage Plugins…': 'プラグインを管理…', 'No plugins installed': 'インストール済みプラグインなし', 'Acorde Composer Documentation': 'Acorde Composerドキュメント', 'MuseScore UI Reference': 'MuseScore UIリファレンス', 'Keyboard Shortcuts…': 'キーボードショートカット…',
    },
    zh: {
      'Acorde Composer': 'Acorde Composer', File: '文件', Edit: '编辑', View: '视图', Add: '添加', Format: '格式', Tools: '工具', Plugins: '插件', Help: '帮助',
      'New Score…': '新建…', 'Open…': '打开…', 'Open Recent': '最近打开的文件', 'No Recent Scores': '没有最近打开的乐谱', 'Clear Recent Files': '清除最近打开的文件列表', Close: '关闭', Save: '保存', 'Save As…': '另存为…', 'Import / OMR…': '导入 / OMR…', 'Score Properties…': '项目属性…', 'Parts…': '分谱…', 'Export…': '导出…', 'Export MusicXML…': '导出 MusicXML…', 'Export MIDI…': '导出 MIDI…', 'Export ABC…': '导出 ABC…', 'Export SVG…': '导出 SVG…', 'Export PDF…': '导出 PDF…', 'Print…': '打印…',
      Undo: '撤销', Redo: '重做', History: '历史', Cut: '剪切', Copy: '复制', Paste: '粘贴', Delete: '删除', Select: '选择', 'Select All': '全选', 'Select Section': '选择段落', 'Find / Go to…': '查找 / 跳转…', 'Preferences…': '偏好设置…',
      Palettes: '符号面板', Layout: '布局', Properties: '属性', Navigator: '导航器', Mixer: '混音器', Workspace: '工作区', Default: '默认', 'Acorde Panels': 'Acorde 面板', 'AI Studio': 'AI 工作室', 'Import / OMR': '导入 / OMR', Toolbars: '工具栏', Notes: '音符', 'Note Input': '音符输入', 'Playback Controls': '播放控制', 'Status Bar': '状态栏', 'Reset to Default Layout': '恢复默认布局',
      'Rest Input': '休止符输入', Tuplets: '连音', Duplet: '二连音', Triplet: '三连音', Quadruplet: '四连音', Quintuplet: '五连音', Sextuplet: '六连音', Septuplet: '七连音', Octuplet: '八连音', Nonuplet: '九连音', Measures: '小节', 'Append One Measure at End of Score': '在乐谱末尾追加一个小节', Text: '文本', 'Staff Text…': '五线谱文本…', 'Dynamics…': '力度标记…', 'Technique Text…': '演奏法文本…', 'Fingering…': '指法…', 'Lyrics…': '歌词…', 'Chord Symbol…': '和弦符号…', 'Rehearsal Mark…': '排练标记…', 'Tempo…': '速度标记…', 'Expression…': '表情文本…', Lines: '线', Slur: '圆滑线', Crescendo: '渐强', Diminuendo: '渐弱', 'Ottava Alta': '高八度线', 'Ottava Bassa': '低八度线', Pedal: '踏板', Glissando: '滑音', 'Trill Line': '颤音线', 'Chords and Fretboard Diagrams': '和弦与指板图',
      'Page Settings…': '页面设置…', 'Layout Density…': '布局密度…', 'Style…': '样式…', 'Transpose…': '移调…', 'Manage Plugins…': '管理插件…', 'No plugins installed': '未安装插件', 'Acorde Composer Documentation': 'Acorde Composer 文档', 'MuseScore UI Reference': 'MuseScore UI 参考', 'Keyboard Shortcuts…': '键盘快捷键…',
    },
  });

  const command = (id, label, options = {}) => Object.freeze({ id, label, scope: 'always', menuType: 'normal', handler: 'button', context: null, shortcuts: [], ...options });
  const COMMANDS = Object.freeze([
    command('file:new', 'New Score…', { buttonTarget: 'template-button', shortcuts: [{ key: 'n', modifier: true }] }),
    command('file:open', 'Open…', { buttonTarget: 'open-button', shortcuts: [{ key: 'o', modifier: true }] }),
    command('file:close', 'Close', { scope: 'score', handler: 'close-window', shortcuts: [{ key: 'w', modifier: true }] }),
    command('file:save', 'Save', { scope: 'score', buttonTarget: 'save-button', shortcuts: [{ key: 's', modifier: true }] }),
    command('file:save-as', 'Save As…', { scope: 'score', handler: 'save-as', shortcuts: [{ key: 's', modifier: true, shift: true }] }),
    command('file:import-omr', 'Import / OMR…', { buttonTarget: 'omr-button' }),
    command('file:export', 'Export…', { scope: 'score', handler: 'open-export' }),
    command('file:export-musicxml', 'Export MusicXML…', { scope: 'score', buttonTarget: 'save-button' }),
    command('file:export-midi', 'Export MIDI…', { scope: 'score', buttonTarget: 'midi-save-button' }),
    command('file:export-abc', 'Export ABC…', { scope: 'score', buttonTarget: 'abc-save-button' }),
    command('file:export-svg', 'Export SVG…', { scope: 'score', buttonTarget: 'svg-save-button' }),
    command('file:export-pdf', 'Export PDF…', { scope: 'score', buttonTarget: 'pdf-save-button' }),
    command('file:score-properties', 'Score Properties…', { scope: 'score', buttonTarget: 'settings-button' }),
    command('file:parts', 'Parts…', { scope: 'score', handler: 'show-parts' }),
    command('file:print', 'Print…', { scope: 'score', buttonTarget: 'print-button', shortcuts: [{ key: 'p', modifier: true }] }),
    command('file:clear-recent', 'Clear Recent Files', { handler: 'clear-recent' }),
    command('edit:undo', 'Undo', { scope: 'undo', buttonTarget: 'undo-button', shortcuts: [{ key: 'z', modifier: true }] }),
    command('edit:redo', 'Redo', { scope: 'redo', buttonTarget: 'redo-button', shortcuts: [{ key: 'z', modifier: true, shift: true, platform: 'darwin' }, { key: 'y', modifier: true, platform: 'default' }] }),
    command('edit:history', 'History', { buttonTarget: 'history-button' }),
    command('edit:cut', 'Cut', { scope: 'selection', handler: 'cut', context: 'cut-copy', shortcuts: [{ key: 'x', modifier: true }] }),
    command('edit:copy', 'Copy', { scope: 'selection', handler: 'copy', context: 'cut-copy', shortcuts: [{ key: 'c', modifier: true }] }),
    command('edit:paste', 'Paste', { scope: 'score', handler: 'paste', context: 'paste', shortcuts: [{ key: 'v', modifier: true }] }),
    command('edit:delete', 'Delete', { scope: 'selection', handler: 'delete', context: 'delete', shortcuts: [{ key: 'Delete' }, { key: 'Backspace' }] }),
    command('edit:select-all', 'Select All', { scope: 'score', handler: 'select-all', shortcuts: [{ key: 'a', modifier: true }] }),
    command('edit:select-section', 'Select Section', { scope: 'section', handler: 'select-section' }),
    command('edit:find-go-to', 'Find / Go to…', { scope: 'score', handler: 'find-go-to', customizable: true, shortcuts: [{ key: 'f', modifier: true }] }),
    command('view:palettes', 'Palettes', { menuType: 'checkbox', checkedState: 'palettesVisible', handler: 'toggle-palettes' }),
    command('view:layout', 'Layout', { scope: 'score', handler: 'show-layout' }),
    command('view:properties', 'Properties', { menuType: 'checkbox', checkedState: 'propertiesVisible', handler: 'toggle-properties', context: 'properties', accelerator: 'F8' }),
    command('view:history', 'History', { menuType: 'checkbox', checkedState: 'historyVisible', buttonTarget: 'history-button' }),
    command('view:navigator', 'Navigator', { scope: 'score', menuType: 'checkbox', checkedState: 'navigatorVisible', handler: 'toggle-navigator' }),
    command('view:mixer', 'Mixer', { menuType: 'checkbox', checkedState: 'mixerVisible', buttonTarget: 'mixer-button', accelerator: 'F10' }),
    command('view:workspace-default', 'Default', { menuType: 'radio', checkedState: 'workspaceDefault', handler: 'restore-workspace' }),
    command('view:playback-toolbar', 'Playback Controls', { menuType: 'checkbox', checkedState: 'playbackControlsVisible', handler: 'toggle-playback-toolbar' }),
    command('view:note-input-toolbar', 'Note Input', { menuType: 'checkbox', checkedState: 'noteInputVisible', handler: 'toggle-note-input-toolbar' }),
    command('view:status-bar', 'Status Bar', { menuType: 'checkbox', checkedState: 'statusBarVisible', handler: 'toggle-status-bar' }),
    command('view:reset-layout', 'Reset to Default Layout', { handler: 'reset-layout' }),
    command('view:ai', 'AI Studio', { handler: 'show-ai' }),
    command('view:omr', 'Import / OMR', { handler: 'show-omr' }),
    command('add:note', 'Note Input', { scope: 'score', buttonTarget: 'note-tool', customizable: true, shortcuts: [{ key: 'n' }] }),
    command('add:rest', 'Rest Input', { scope: 'score', buttonTarget: 'rest-tool', customizable: true, shortcuts: [{ key: 'r' }] }),
    command('add:measure', 'Append One Measure at End of Score', { scope: 'score', buttonTarget: 'add-measure-button', accelerator: 'Insert' }),
    command('add:staff-text', 'Staff Text…', { scope: 'selection', handler: 'staff-text' }),
    command('add:dynamics', 'Dynamics…', { scope: 'selection', handler: 'dynamics' }),
    command('add:expression', 'Expression…', { scope: 'selection', buttonTarget: 'expression-button' }),
    command('add:rehearsal', 'Rehearsal Mark…', { scope: 'selection', buttonTarget: 'rehearsal-button' }),
    command('add:fingering', 'Fingering…', { scope: 'selection', buttonTarget: 'fingering-button' }),
    command('add:chord', 'Chord Symbol…', { scope: 'selection', buttonTarget: 'chord-button' }),
    command('add:lyrics', 'Lyrics…', { scope: 'selection', buttonTarget: 'lyric-button' }),
    command('add:tempo', 'Tempo…', { scope: 'selection', buttonTarget: 'measure-tempo-button' }),
    command('add:technique-text', 'Technique Text…', { scope: 'selection', handler: 'technique-text' }),
    command('add:slur', 'Slur', { scope: 'selection', buttonTarget: 'slur-tool', accelerator: 'S', customizable: true, shortcuts: [{ key: 's' }, { key: 'l' }] }),
    command('add:tie', 'Tie', { scope: 'selection', buttonTarget: 'tie-tool', customizable: true, shortcuts: [{ key: 't' }] }),
    command('add:crescendo', 'Crescendo', { scope: 'selection', handler: 'hairpin', customizable: true, shortcuts: [{ key: 'h' }] }),
    command('add:diminuendo', 'Diminuendo', { scope: 'selection', handler: 'hairpin' }),
    command('add:ottava-alta', 'Ottava Alta', { scope: 'selection', handler: 'ottava' }),
    command('add:ottava-bassa', 'Ottava Bassa', { scope: 'selection', handler: 'ottava' }),
    command('add:pedal', 'Pedal', { scope: 'selection', buttonTarget: 'pedal-button' }),
    command('add:glissando', 'Glissando', { scope: 'selection', buttonTarget: 'glissando-button' }),
    command('add:trill', 'Trill Line', { scope: 'selection', buttonTarget: 'trill-button' }),
    command('format:text-style', 'Style…', { scope: 'selection', buttonTarget: 'text-style-button' }),
    command('format:page-settings', 'Page Settings…', { scope: 'score', handler: 'page-settings' }),
    command('format:layout-density', 'Layout Density…', { scope: 'score', handler: 'layout-density' }),
    command('tools:transpose', 'Transpose…', { scope: 'selection', handler: 'transpose' }),
    command('app:preferences', 'Preferences…', { buttonTarget: 'preferences-button' }),
    command('help:shortcuts', 'Keyboard Shortcuts…', { buttonTarget: 'shortcuts-button', accelerator: 'Shift+/', shortcuts: [{ key: '?', shift: true }] }),
    command('tool:select', 'Select', { handler: 'select-tool', customizable: true, shortcuts: [{ key: 'Escape' }] }),
    command('voice:previous', 'Previous Voice', { handler: 'voice-step', customizable: true, shortcuts: [{ key: '[' }] }),
    command('voice:next', 'Next Voice', { handler: 'voice-step', customizable: true, shortcuts: [{ key: ']' }] }),
    command('playback:toggle', 'Play / Stop', { buttonTarget: 'play-button', customizable: true, shortcuts: [{ key: ' ', code: 'Space' }] }),
  ]);

  const COMMAND_BY_ID = new Map(COMMANDS.map((definition) => [definition.id, definition]));
  const TUPLET_COMMAND = Object.freeze(command('add:tuplet', 'Tuplet', { scope: 'selection', handler: 'tuplet' }));
  const RECENT_COMMAND = Object.freeze(command('file:recent', 'Recent Score', { handler: 'recent-score' }));
  const CONTEXT_KINDS = Object.freeze(new Set(['note', 'rest', 'measure', 'measure-text']));
  const CONTEXT_MENU_COMMANDS = Object.freeze(['edit:cut', 'edit:copy', 'edit:paste', 'edit:delete', 'view:properties']);

  const commandNode = (id) => Object.freeze({ type: 'command', id });
  const submenu = (label, children) => Object.freeze({ type: 'submenu', label, children: Object.freeze(children) });
  const separator = () => Object.freeze({ type: 'separator' });
  const recent = () => Object.freeze({ type: 'recent' });
  const info = (label) => Object.freeze({ type: 'info', label });
  const MENU_TREE = Object.freeze([
    submenu('File', [commandNode('file:new'), commandNode('file:open'), recent(), separator(), commandNode('file:close'), commandNode('file:save'), commandNode('file:save-as'), separator(), commandNode('file:import-omr'), submenu('Export…', [commandNode('file:export-musicxml'), commandNode('file:export-midi'), commandNode('file:export-abc'), commandNode('file:export-svg'), commandNode('file:export-pdf')]), commandNode('file:score-properties'), commandNode('file:parts'), commandNode('file:print')]),
    submenu('Edit', [commandNode('edit:undo'), commandNode('edit:redo'), commandNode('edit:history'), separator(), commandNode('edit:cut'), commandNode('edit:copy'), commandNode('edit:paste'), commandNode('edit:delete'), submenu('Select', [commandNode('edit:select-all'), commandNode('edit:select-section')]), separator(), commandNode('edit:find-go-to')]),
    submenu('View', [commandNode('view:palettes'), commandNode('view:layout'), commandNode('view:properties'), commandNode('view:history'), commandNode('view:navigator'), commandNode('view:mixer'), separator(), submenu('Workspace', [commandNode('view:workspace-default')]), submenu('Toolbars', [commandNode('view:playback-toolbar'), commandNode('view:note-input-toolbar'), commandNode('view:status-bar')]), separator(), commandNode('view:reset-layout'), separator(), submenu('Acorde Panels', [commandNode('view:ai'), commandNode('view:omr')])]),
    submenu('Add', [submenu('Notes', [commandNode('add:note'), commandNode('add:rest')]), submenu('Tuplets', [2, 3, 4, 5, 6, 7, 8, 9].map((value) => commandNode(`add:tuplet:${value}`))), submenu('Measures', [commandNode('add:measure')]), submenu('Text', [commandNode('add:staff-text'), commandNode('add:dynamics'), commandNode('add:expression'), commandNode('add:rehearsal'), commandNode('add:fingering'), commandNode('add:chord'), commandNode('add:lyrics'), commandNode('add:tempo'), separator(), commandNode('add:technique-text')]), submenu('Lines', [commandNode('add:slur'), commandNode('add:crescendo'), commandNode('add:diminuendo'), commandNode('add:ottava-alta'), commandNode('add:ottava-bassa'), commandNode('add:pedal'), commandNode('add:glissando'), commandNode('add:trill')]), submenu('Chords and Fretboard Diagrams', [commandNode('add:chord')])]),
    submenu('Format', [commandNode('format:text-style'), commandNode('format:page-settings'), commandNode('format:layout-density')]),
    submenu('Tools', [commandNode('tools:transpose')]),
    submenu('Plugins', [info('Manage Plugins…'), separator(), info('No plugins installed')]),
    submenu('Help', [info('Acorde Composer Documentation'), info('MuseScore UI Reference'), commandNode('help:shortcuts')]),
  ]);

  function normalizeMenuLanguage(language) { return Object.hasOwn(MENU_LABELS, language) ? language : 'en'; }
  function translate(label, language = 'en') { return MENU_LABELS[normalizeMenuLanguage(language)]?.[label] || label; }
  function resolveCommand(id) {
    if (COMMAND_BY_ID.has(id)) return COMMAND_BY_ID.get(id);
    if (/^add:tuplet:[2-9]$/.test(id)) {
      const tuplet = Number(id.slice(-1));
      return { ...TUPLET_COMMAND, id, tuplet, label: ['Duplet', 'Triplet', 'Quadruplet', 'Quintuplet', 'Sextuplet', 'Septuplet', 'Octuplet', 'Nonuplet'][tuplet - 2] };
    }
    if (/^file:recent:\d+$/.test(id)) return { ...RECENT_COMMAND, id, recentIndex: Number(id.slice('file:recent:'.length)) };
    return null;
  }
  function normalizeMenuState(value = {}) {
    return {
      hasScore: value.hasScore !== false,
      hasSelection: value.hasSelection !== false,
      canUndo: value.canUndo !== false,
      canRedo: value.canRedo !== false,
      palettesVisible: value.palettesVisible !== false,
      propertiesVisible: value.propertiesVisible !== false,
      historyVisible: value.historyVisible === true,
      mixerVisible: value.mixerVisible === true,
      playbackControlsVisible: value.playbackControlsVisible !== false,
      noteInputVisible: value.noteInputVisible !== false,
      statusBarVisible: value.statusBarVisible !== false,
      workspaceDefault: value.workspaceDefault !== false,
      navigatorVisible: value.navigatorVisible !== false,
      sectionSelectionAvailable: value.sectionSelectionAvailable === true,
      shortcutOverrides: normalizeShortcutOverrides(value.shortcutOverrides),
    };
  }
  function commandEnabled(id, state = {}) {
    const definition = typeof id === 'string' ? resolveCommand(id) : id;
    if (!definition) return false;
    const current = normalizeMenuState(state);
    if (definition.scope === 'score') return current.hasScore;
    if (definition.scope === 'selection') return current.hasScore && current.hasSelection;
    if (definition.scope === 'undo') return current.hasScore && current.canUndo;
    if (definition.scope === 'redo') return current.hasScore && current.canRedo;
    if (definition.scope === 'section') return current.hasScore && current.sectionSelectionAvailable;
    return true;
  }
  function commandChecked(id, state = {}) {
    const definition = typeof id === 'string' ? resolveCommand(id) : id;
    if (!definition?.checkedState) return undefined;
    return normalizeMenuState(state)[definition.checkedState] === true;
  }
  function normalizeShortcutBinding(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const sourceKey = typeof value.key === 'string' ? value.key : '';
    const key = sourceKey === ' ' ? 'Space' : sourceKey.trim();
    const valid = /^(?:[a-z0-9]|\[|\]|Escape|Enter|Space|Arrow(?:Left|Right|Up|Down))$/i.test(key);
    if (!valid || value.alt === true || value.altKey === true) return null;
    return Object.freeze({ key, ...(typeof value.code === 'string' && value.code.length <= 32 ? { code: value.code } : {}), ...(value.modifier === true ? { modifier: true } : {}), ...(value.shift === true ? { shift: true } : {}) });
  }
  function normalizeShortcutOverrides(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).flatMap(([id, binding]) => {
      const definition = resolveCommand(id);
      const normalized = definition?.customizable ? normalizeShortcutBinding(binding) : null;
      return normalized ? [[id, normalized]] : [];
    }));
  }
  function shortcutsForCommand(id, overrides = {}) {
    const definition = typeof id === 'string' ? resolveCommand(id) : id;
    if (!definition) return [];
    const override = normalizeShortcutOverrides(overrides)[definition.id];
    return override ? [override] : definition.shortcuts || [];
  }
  function shortcutMatchesEvent(shortcut, event, platform = 'default') {
    if (!shortcut || !event || event.altKey) return false;
    if (shortcut.platform && shortcut.platform !== platform && !(shortcut.platform === 'default' && platform !== 'darwin')) return false;
    if (Boolean(shortcut.modifier) !== Boolean(event.metaKey || event.ctrlKey)) return false;
    if (Boolean(shortcut.shift) !== Boolean(event.shiftKey)) return false;
    return shortcut.code ? event.code === shortcut.code : event.key === shortcut.key || event.key?.toLowerCase?.() === String(shortcut.key).toLowerCase();
  }
  function shortcutLabel(shortcut, platform = 'default') {
    const value = normalizeShortcutBinding(shortcut) || shortcut;
    if (!value) return '';
    const parts = [];
    if (value.modifier) parts.push(platform === 'darwin' ? '⌘' : 'Ctrl');
    if (value.shift) parts.push('Shift');
    const key = value.code === 'Space' || value.key === 'Space' ? 'Space' : value.key;
    parts.push(key === 'Escape' ? 'Esc' : /^[a-z]$/i.test(key) ? key.toUpperCase() : key);
    return parts.join(platform === 'darwin' ? '' : '+');
  }
  function findShortcutConflict(commandId, binding, overrides = {}) {
    const normalized = normalizeShortcutBinding(binding);
    if (!normalized) return null;
    return COMMANDS.find((definition) => definition.id !== commandId && shortcutsForCommand(definition, overrides).some((candidate) => candidate.key === normalized.key && candidate.code === normalized.code && Boolean(candidate.modifier) === Boolean(normalized.modifier) && Boolean(candidate.shift) === Boolean(normalized.shift)))?.id || null;
  }
  function commandAccelerator(id, platform = 'default', overrides = {}) {
    const definition = typeof id === 'string' ? resolveCommand(id) : id;
    if (!definition) return undefined;
    const override = normalizeShortcutOverrides(overrides)[definition.id];
    if (definition.accelerator && !override) return definition.accelerator;
    const shortcut = shortcutsForCommand(definition, overrides).find((item) => item.modifier && (!item.platform || item.platform === platform || (item.platform === 'default' && platform !== 'darwin')));
    if (!shortcut) return undefined;
    const primary = shortcut.platform === 'darwin' ? 'Cmd' : 'CmdOrCtrl';
    return `${primary}${shortcut.shift ? '+Shift' : ''}+${shortcut.key.toUpperCase()}`;
  }
  function normalizeContextMenuState(value = {}) {
    const kind = CONTEXT_KINDS.has(value.kind) ? value.kind : null;
    const hasScore = value.hasScore === true;
    const noteOrText = kind === 'note' || kind === 'rest' || kind === 'measure-text';
    const canPaste = hasScore;
    const canDelete = hasScore && Boolean(kind) && value.canDelete !== false;
    return { kind, hasScore, canCut: hasScore && noteOrText, canCopy: hasScore && noteOrText, canPaste, canDelete, canShowProperties: hasScore && Boolean(kind) };
  }
  function contextCommandEnabled(id, context = {}) {
    const definition = typeof id === 'string' ? resolveCommand(id) : id;
    const state = normalizeContextMenuState(context);
    if (!definition || !state.hasScore) return false;
    if (definition.context === 'paste') return state.canPaste;
    if (!state.kind) return false;
    if (definition.context === 'cut-copy') return state.kind === 'note' || state.kind === 'rest' || state.kind === 'measure-text';
    if (definition.context === 'properties') return true;
    if (definition.context === 'delete') return state.canDelete;
    return false;
  }
  function commandForKeyboardEvent(event, platform = 'default', overrides = {}) {
    if (!event || event.altKey) return null;
    for (const definition of COMMANDS) {
      if (shortcutsForCommand(definition, overrides).some((shortcut) => shortcutMatchesEvent(shortcut, event, platform))) return definition.id;
    }
    return null;
  }

  return { MUSESCORE_MENU_ORDER, MUSESCORE_MENU_MNEMONICS, MENU_LABELS, COMMANDS, MENU_TREE, CONTEXT_KINDS, CONTEXT_MENU_COMMANDS, normalizeMenuLanguage, translate, resolveCommand, normalizeMenuState, commandEnabled, commandChecked, normalizeShortcutBinding, normalizeShortcutOverrides, shortcutsForCommand, shortcutMatchesEvent, shortcutLabel, findShortcutConflict, commandAccelerator, normalizeContextMenuState, contextCommandEnabled, commandForKeyboardEvent };
});
