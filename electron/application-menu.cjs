const registry = require('../src/command-registry.js');
const MUSESCORE_MENU_ORDER = Object.freeze(['File', 'Edit', 'View', 'Add', 'Format', 'Tools', 'Plugins', 'Help']);
const MUSESCORE_MENU_MNEMONICS = Object.freeze(['F', 'E', 'V', 'A', 'O', 'T', 'P', 'H']);

const MENU_LABELS = Object.freeze({
  ja: {
    'Acorde Composer': 'Acorde Composer', File: 'ファイル', Edit: '編集', View: '表示', Add: '追加', Format: 'フォーマット', Tools: 'ツール', Plugins: 'プラグイン', Help: 'ヘルプ',
    'New Score…': '新規…', 'Open…': '開く…', 'Open Recent': '最近開いたファイル', 'No Recent Scores': '最近開いた楽譜はありません', 'Clear Recent Files': '最近開いたファイル一覧をクリア', Close: '閉じる', Save: '保存', 'Save As…': '名前を付けて保存…', 'Import / OMR…': 'インポート / OMR…', 'Score Properties…': 'プロジェクトのプロパティ…', 'Parts…': 'パート…', 'Export…': 'エクスポート…', 'Print…': '印刷…',
    Undo: '元に戻す', Redo: 'やり直す', History: '履歴', Cut: '切り取り', Copy: 'コピー', Paste: '貼り付け', Delete: '削除', 'Select All': 'すべて選択', 'Find / Go to…': '小節に移動…', 'Preferences…': '環境設定…',
    Palettes: 'パレット', Layout: 'レイアウト', Properties: 'プロパティ', Mixer: 'ミキサー', Workspace: 'ワークスペース', Default: 'デフォルト', 'Acorde Panels': 'Acordeパネル', 'AI Studio': 'AIスタジオ', 'Import / OMR': 'インポート / OMR', Toolbars: 'ツールバー', Notes: '音符', 'Note Input': '音符入力', 'Playback Controls': '再生コントロール', 'Status Bar': 'ステータスバー', 'Reset to Default Layout': 'デフォルトのレイアウトを復元', 'Zoom In': '拡大', 'Zoom Out': '縮小',
    'Rest Input': '休符入力', Tuplets: '連符', Duplet: '2連符', Triplet: '3連符', Quadruplet: '4連符', Quintuplet: '5連符', Sextuplet: '6連符', Septuplet: '7連符', Octuplet: '8連符', Nonuplet: '9連符', Measures: '小節', 'Append One Measure at End of Score': 'スコアの終わりに小節を1つ挿入', Text: 'テキスト', 'Staff Text…': '譜表テキスト…', 'Dynamics…': '強弱記号…', 'Technique Text…': '奏法テキスト…', 'Fingering…': '運指…', 'Lyrics…': '歌詞…', 'Chord Symbol…': 'コード記号…', 'Rehearsal Mark…': '練習番号…', 'Tempo…': 'テンポ記号…', 'Expression…': '発想標語テキスト…', Lines: '線', Slur: 'スラー', Crescendo: 'クレッシェンド', Diminuendo: 'ディミヌエンド', 'Ottava Alta': 'オッターヴァ・アルタ', 'Ottava Bassa': 'オッターヴァ・バッサ', Pedal: 'ペダル', Glissando: 'グリッサンド', 'Trill Line': 'トリル線', 'Chords and Fretboard Diagrams': 'コードとフレットボードダイアグラム',
    'Page Settings…': 'ページ設定…', 'Style…': 'スタイル…', 'Page Break': '改ページ', 'System Break': '改行', 'Multi-measure Rest…': '複数小節休符…',
    'Transpose…': '移調…', 'MIDI Input': 'MIDI入力', 'Manage Plugins…': 'プラグインを管理…', 'No plugins installed': 'インストール済みプラグインなし',
    'Acorde Composer Documentation': 'Acorde Composerドキュメント', 'MuseScore UI Reference': 'MuseScore UIリファレンス', 'Keyboard Shortcuts…': 'キーボードショートカット…',
  },
  zh: {
    'Acorde Composer': 'Acorde Composer', File: '文件', Edit: '编辑', View: '视图', Add: '添加', Format: '格式', Tools: '工具', Plugins: '插件', Help: '帮助',
    'New Score…': '新建…', 'Open…': '打开…', 'Open Recent': '最近打开的文件', 'No Recent Scores': '没有最近打开的乐谱', 'Clear Recent Files': '清除最近打开的文件列表', Close: '关闭', Save: '保存', 'Save As…': '另存为…', 'Import / OMR…': '导入 / OMR…', 'Score Properties…': '项目属性…', 'Parts…': '分谱…', 'Export…': '导出…', 'Print…': '打印…',
    Undo: '撤销', Redo: '重做', History: '历史', Cut: '剪切', Copy: '复制', Paste: '粘贴', Delete: '删除', 'Select All': '全选', 'Find / Go to…': '查找 / 跳转…', 'Preferences…': '偏好设置…',
    Palettes: '符号面板', Layout: '布局', Properties: '属性', Mixer: '混音器', Workspace: '工作区', Default: '默认', 'Acorde Panels': 'Acorde 面板', 'AI Studio': 'AI 工作室', 'Import / OMR': '导入 / OMR', Toolbars: '工具栏', Notes: '音符', 'Note Input': '音符输入', 'Playback Controls': '播放控制', 'Status Bar': '状态栏', 'Reset to Default Layout': '恢复默认布局', 'Zoom In': '放大', 'Zoom Out': '缩小',
    'Rest Input': '休止符输入', Tuplets: '连音', Duplet: '二连音', Triplet: '三连音', Quadruplet: '四连音', Quintuplet: '五连音', Sextuplet: '六连音', Septuplet: '七连音', Octuplet: '八连音', Nonuplet: '九连音', Measures: '小节', 'Append One Measure at End of Score': '在乐谱末尾追加一个小节', Text: '文本', 'Staff Text…': '五线谱文本…', 'Dynamics…': '力度标记…', 'Technique Text…': '演奏法文本…', 'Fingering…': '指法…', 'Lyrics…': '歌词…', 'Chord Symbol…': '和弦符号…', 'Rehearsal Mark…': '排练标记…', 'Tempo…': '速度标记…', 'Expression…': '表情文本…', Lines: '线', Slur: '圆滑线', Crescendo: '渐强', Diminuendo: '渐弱', 'Ottava Alta': '高八度线', 'Ottava Bassa': '低八度线', Pedal: '踏板', Glissando: '滑音', 'Trill Line': '颤音线', 'Chords and Fretboard Diagrams': '和弦与指板图',
    'Page Settings…': '页面设置…', 'Style…': '样式…', 'Page Break': '分页符', 'System Break': '换行符', 'Multi-measure Rest…': '多小节休止…',
    'Transpose…': '移调…', 'MIDI Input': 'MIDI 输入', 'Manage Plugins…': '管理插件…', 'No plugins installed': '未安装插件',
    'Acorde Composer Documentation': 'Acorde Composer 文档', 'MuseScore UI Reference': 'MuseScore UI 参考', 'Keyboard Shortcuts…': '键盘快捷键…',
  },
});

function normalizeMenuLanguage(language) {
  return Object.hasOwn(MENU_LABELS, language) ? language : 'en';
}

function menuTranslator(language) {
  const labels = MENU_LABELS[normalizeMenuLanguage(language)] || {};
  return (label) => labels[label] || label;
}

function commandItem(label, command, send, extra = {}) {
  return { id: command, label, click: () => send(command), ...extra };
}

function safeRecentFileLabel(value, index) {
  const label = String(value || '').replace(/[\r\n\t]/g, ' ').trim().slice(0, 120);
  return label || `Score ${index + 1}`;
}

function buildRegistryApplicationMenuTemplate({ send, platform = process.platform, language = 'en', recentFiles = [], menuState = {}, openDocumentation = () => {}, openMuseScoreReference = () => {} } = {}) {
  if (typeof send !== 'function') throw new TypeError('menu command sender is required');
  const resolvedLanguage = registry.normalizeMenuLanguage(language);
  const state = registry.normalizeMenuState(menuState);
  const commandItem = (id) => {
    const definition = registry.resolveCommand(id);
    if (!definition) throw new Error(`unknown menu command: ${id}`);
    const checked = registry.commandChecked(definition, state);
    const accelerator = registry.commandAccelerator(definition, platform, state.shortcutOverrides);
    return {
      id,
      label: registry.translate(definition.label, resolvedLanguage),
      enabled: registry.commandEnabled(definition, state),
      ...(definition.menuType !== 'normal' ? { type: definition.menuType } : {}),
      ...(checked === undefined ? {} : { checked }),
      ...(accelerator ? { accelerator } : {}),
      click: () => send(id),
    };
  };
  const recentItems = recentFiles.slice(0, 8).map((recent, index) => {
    const id = `file:recent:${index}`;
    return { id, label: safeRecentFileLabel(recent?.name, index), click: () => send(id) };
  });
  if (!recentItems.length) recentItems.push({ label: registry.translate('No Recent Scores', resolvedLanguage), enabled: false });
  else recentItems.push({ type: 'separator' }, commandItem('file:clear-recent'));
  const buildNode = (node) => {
    if (node.type === 'separator') return { type: 'separator' };
    if (node.type === 'command') return commandItem(node.id);
    if (node.type === 'recent') return { label: registry.translate('Open Recent', resolvedLanguage), submenu: recentItems };
    if (node.type === 'info') {
      const label = registry.translate(node.label, resolvedLanguage);
      if (node.label === 'Acorde Composer Documentation') return { label, click: openDocumentation };
      if (node.label === 'MuseScore UI Reference') return { label, click: openMuseScoreReference };
      return { label, enabled: false };
    }
    if (node.type === 'submenu') return { label: registry.translate(node.label, resolvedLanguage), submenu: node.children.map(buildNode) };
    throw new Error(`unknown menu node: ${node.type}`);
  };
  const ordered = registry.MENU_TREE.map(buildNode);
  if (platform === 'darwin') {
    return [{ label: registry.translate('Acorde Composer', resolvedLanguage), submenu: [
      { role: 'about' }, commandItem('app:preferences'), { type: 'separator' }, { role: 'services' }, { type: 'separator' },
      { role: 'hide' }, { role: 'hideOthers' }, { role: 'unhide' }, { type: 'separator' }, { role: 'quit' },
    ] }, ...ordered];
  }
  ordered[0].submenu.push({ type: 'separator' }, { role: 'quit' });
  ordered[1].submenu.push({ type: 'separator' }, commandItem('app:preferences'));
  ordered[7].submenu.push({ type: 'separator' }, { role: 'about' });
  ordered.forEach((menu, index) => {
    const mnemonic = registry.MUSESCORE_MENU_MNEMONICS[index];
    menu.label = resolvedLanguage === 'en' ? `&${menu.label}` : `${menu.label}(&${mnemonic})`;
  });
  return ordered;
}

function buildLegacyApplicationMenuTemplate({ send, platform = process.platform, language = 'en', recentFiles = [], menuState = {}, openDocumentation = () => {}, openMuseScoreReference = () => {} } = {}) {
  if (typeof send !== 'function') throw new TypeError('menu command sender is required');
  const resolvedLanguage = normalizeMenuLanguage(language);
  const t = menuTranslator(resolvedLanguage);
  const item = (label, command, extra = {}) => commandItem(t(label), command, send, extra);
  const state = {
    hasScore: menuState.hasScore !== false,
    hasSelection: menuState.hasSelection !== false,
    canUndo: menuState.canUndo !== false,
    canRedo: menuState.canRedo !== false,
    palettesVisible: menuState.palettesVisible !== false,
    propertiesVisible: menuState.propertiesVisible !== false,
    historyVisible: menuState.historyVisible === true,
    mixerVisible: menuState.mixerVisible === true,
    playbackControlsVisible: menuState.playbackControlsVisible !== false,
    noteInputVisible: menuState.noteInputVisible !== false,
    statusBarVisible: menuState.statusBarVisible !== false,
  };
  const scoreItem = (label, command, extra = {}) => item(label, command, { enabled: state.hasScore, ...extra });
  const selectionItem = (label, command, extra = {}) => item(label, command, { enabled: state.hasScore && state.hasSelection, ...extra });
  const recentItems = recentFiles.slice(0, 8).map((recent, index) => commandItem(safeRecentFileLabel(recent?.name, index), `file:recent:${index}`, send));
  if (!recentItems.length) recentItems.push({ label: t('No Recent Scores'), enabled: false });
  else recentItems.push({ type: 'separator' }, item('Clear Recent Files', 'file:clear-recent'));
  const file = {
    label: t('File'),
    submenu: [
      item('New Score…', 'file:new', { accelerator: 'CmdOrCtrl+N' }),
      item('Open…', 'file:open', { accelerator: 'CmdOrCtrl+O' }),
      { label: t('Open Recent'), submenu: recentItems },
      { type: 'separator' },
      scoreItem('Close', 'file:close', { accelerator: 'CmdOrCtrl+W' }),
      scoreItem('Save', 'file:save', { accelerator: 'CmdOrCtrl+S' }),
      scoreItem('Save As…', 'file:save-as', { accelerator: 'CmdOrCtrl+Shift+S' }),
      { type: 'separator' },
      item('Import / OMR…', 'file:import-omr'),
      scoreItem('Export…', 'file:export'),
      scoreItem('Score Properties…', 'file:score-properties'),
      scoreItem('Parts…', 'file:parts'),
      scoreItem('Print…', 'file:print', { accelerator: 'CmdOrCtrl+P' }),
      ...(platform === 'darwin' ? [] : [{ type: 'separator' }, { role: 'quit' }]),
    ],
  };
  const edit = {
    label: t('Edit'),
    submenu: [
      item('Undo', 'edit:undo', { accelerator: 'CmdOrCtrl+Z', enabled: state.hasScore && state.canUndo }),
      item('Redo', 'edit:redo', { accelerator: platform === 'darwin' ? 'Cmd+Shift+Z' : 'Ctrl+Y', enabled: state.hasScore && state.canRedo }),
      item('History', 'edit:history'),
      { type: 'separator' },
      selectionItem('Cut', 'edit:cut', { accelerator: 'CmdOrCtrl+X' }),
      selectionItem('Copy', 'edit:copy', { accelerator: 'CmdOrCtrl+C' }),
      scoreItem('Paste', 'edit:paste', { accelerator: 'CmdOrCtrl+V' }),
      selectionItem('Delete', 'edit:delete', { accelerator: 'Delete' }),
      scoreItem('Select All', 'edit:select-all', { accelerator: 'CmdOrCtrl+A' }),
      { type: 'separator' },
      scoreItem('Find / Go to…', 'edit:find-go-to', { accelerator: 'CmdOrCtrl+F' }),
      ...(platform === 'darwin' ? [] : [{ type: 'separator' }, item('Preferences…', 'app:preferences')]),
    ],
  };
  const view = {
    label: t('View'),
    submenu: [
      item('Palettes', 'view:palettes', { type: 'checkbox', checked: state.palettesVisible }),
      scoreItem('Layout', 'view:layout'),
      item('Properties', 'view:properties', { accelerator: 'F8', type: 'checkbox', checked: state.propertiesVisible }),
      item('History', 'view:history', { type: 'checkbox', checked: state.historyVisible }),
      item('Mixer', 'view:mixer', { accelerator: 'F10', type: 'checkbox', checked: state.mixerVisible }),
      { type: 'separator' },
      { label: t('Workspace'), submenu: [
        item('Default', 'view:workspace-default', { type: 'radio', checked: true }),
      ] },
      { label: t('Toolbars'), submenu: [
        item('Playback Controls', 'view:playback-toolbar', { type: 'checkbox', checked: state.playbackControlsVisible }),
        item('Note Input', 'view:note-input-toolbar', { type: 'checkbox', checked: state.noteInputVisible }),
        item('Status Bar', 'view:status-bar', { type: 'checkbox', checked: state.statusBarVisible }),
      ] },
      { type: 'separator' },
      item('Reset to Default Layout', 'view:reset-layout'),
      { type: 'separator' },
      { label: t('Acorde Panels'), submenu: [
        item('AI Studio', 'view:ai'),
        item('Import / OMR', 'view:omr'),
      ] },
    ],
  };
  const add = {
    label: t('Add'),
    submenu: [
      { label: t('Notes'), submenu: [
        scoreItem('Note Input', 'add:note', { accelerator: 'N' }),
        scoreItem('Rest Input', 'add:rest', { accelerator: 'R' }),
      ] },
      { label: t('Tuplets'), submenu: [
        selectionItem('Duplet', 'add:tuplet:2'),
        selectionItem('Triplet', 'add:tuplet:3'),
        selectionItem('Quadruplet', 'add:tuplet:4'),
        selectionItem('Quintuplet', 'add:tuplet:5'),
        selectionItem('Sextuplet', 'add:tuplet:6'),
        selectionItem('Septuplet', 'add:tuplet:7'),
        selectionItem('Octuplet', 'add:tuplet:8'),
        selectionItem('Nonuplet', 'add:tuplet:9'),
      ] },
      { label: t('Measures'), submenu: [
        scoreItem('Append One Measure at End of Score', 'add:measure', { accelerator: 'Insert' }),
      ] },
      { label: t('Text'), submenu: [
        selectionItem('Staff Text…', 'add:staff-text'),
        selectionItem('Dynamics…', 'add:dynamics'),
        selectionItem('Expression…', 'add:expression'),
        selectionItem('Rehearsal Mark…', 'add:rehearsal'),
        selectionItem('Fingering…', 'add:fingering'),
        selectionItem('Chord Symbol…', 'add:chord'),
        selectionItem('Lyrics…', 'add:lyrics'),
        selectionItem('Tempo…', 'add:tempo'),
        { type: 'separator' },
        selectionItem('Technique Text…', 'add:technique-text'),
      ] },
      { label: t('Lines'), submenu: [
        selectionItem('Slur', 'add:slur', { accelerator: 'S' }),
        selectionItem('Crescendo', 'add:crescendo', { accelerator: 'H' }),
        selectionItem('Diminuendo', 'add:diminuendo'),
        selectionItem('Ottava Alta', 'add:ottava-alta'),
        selectionItem('Ottava Bassa', 'add:ottava-bassa'),
        selectionItem('Pedal', 'add:pedal'),
        selectionItem('Glissando', 'add:glissando'),
        selectionItem('Trill Line', 'add:trill'),
      ] },
      { label: t('Chords and Fretboard Diagrams'), submenu: [
        selectionItem('Chord Symbol…', 'add:chord'),
      ] },
    ],
  };
  const format = {
    label: t('Format'),
    submenu: [
      selectionItem('Style…', 'format:text-style'),
      scoreItem('Page Settings…', 'format:page-settings'),
    ],
  };
  const tools = {
    label: t('Tools'),
    submenu: [
      selectionItem('Transpose…', 'tools:transpose'),
    ],
  };
  const plugins = { label: t('Plugins'), submenu: [
    { label: t('Manage Plugins…'), enabled: false },
    { type: 'separator' },
    { label: t('No plugins installed'), enabled: false },
  ] };
  const help = {
    label: t('Help'),
    submenu: [
      { label: t('Acorde Composer Documentation'), click: openDocumentation },
      { label: t('MuseScore UI Reference'), click: openMuseScoreReference },
      item('Keyboard Shortcuts…', 'help:shortcuts', { accelerator: 'Shift+/' }),
      ...(platform === 'darwin' ? [] : [{ type: 'separator' }, { role: 'about' }]),
    ],
  };
  const ordered = [file, edit, view, add, format, tools, plugins, help];
  if (platform !== 'darwin') {
    ordered.forEach((menu, index) => {
      const mnemonic = MUSESCORE_MENU_MNEMONICS[index];
      menu.label = resolvedLanguage === 'en' ? `&${menu.label}` : `${menu.label}(&${mnemonic})`;
    });
    return ordered;
  }
  return [{ label: t('Acorde Composer'), submenu: [
    { role: 'about' },
    item('Preferences…', 'app:preferences'),
    { type: 'separator' },
    { role: 'services' },
    { type: 'separator' },
    { role: 'hide' }, { role: 'hideOthers' }, { role: 'unhide' },
    { type: 'separator' },
    { role: 'quit' },
  ] }, ...ordered];
}

module.exports = { MUSESCORE_MENU_ORDER: registry.MUSESCORE_MENU_ORDER, MUSESCORE_MENU_MNEMONICS: registry.MUSESCORE_MENU_MNEMONICS, MENU_LABELS: registry.MENU_LABELS, normalizeMenuLanguage: registry.normalizeMenuLanguage, safeRecentFileLabel, buildApplicationMenuTemplate: buildRegistryApplicationMenuTemplate };
