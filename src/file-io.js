(function initFileIo(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AcordeFileIo = api;
})(typeof globalThis === 'object' ? globalThis : this, function fileIoFactory() {
  'use strict';

  // MuseScore Studio uses one File → Export… dialog (choose what to export, then "Export as"
  // a format) instead of one menu item per format. Every format below maps onto an existing
  // Composer export path; `parts` marks formats whose per-part export goes through Acorde's
  // extract_part boundary.
  const EXPORT_FORMATS = Object.freeze([
    Object.freeze({ id: 'pdf', label: 'PDF', description: 'Print-ready document', group: 'Graphics', pageOptions: true, parts: false }),
    Object.freeze({ id: 'svg', label: 'SVG', description: 'Scalable score image', group: 'Graphics', pageOptions: true, parts: false }),
    Object.freeze({ id: 'musicxml', label: 'MusicXML', description: 'Editable score exchange', group: 'Score', pageOptions: false, parts: true }),
    Object.freeze({ id: 'midi', label: 'MIDI', description: 'Playback and DAW exchange', group: 'Score', pageOptions: false, parts: true }),
    Object.freeze({ id: 'abc', label: 'ABC', description: 'Plain-text notation', group: 'Score', pageOptions: false, parts: false }),
  ]);

  function exportFormat(id) { return EXPORT_FORMATS.find((format) => format.id === id) || EXPORT_FORMATS[0]; }

  // "Main score" is index null; parts are zero-based part indexes.
  function exportTargets(score) {
    const parts = Array.isArray(score?.parts) ? score.parts : [];
    return [{ value: 'score', label: 'Main score', partIndex: null }, ...parts.map((part, index) => ({ value: `part:${index}`, label: String(part?.name || `Part ${index + 1}`), partIndex: index }))];
  }

  function parseExportTarget(value) {
    const match = /^part:(\d+)$/.exec(String(value || ''));
    return match ? Number(match[1]) : null;
  }

  function safeFileStem(value, fallback = 'score') {
    const stem = String(value || '').replace(/\.[^.]+$/, '').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
    return stem || fallback;
  }

  // Key signatures by fifths, as offered in MuseScore's New score → Additional score information.
  const KEY_SIGNATURES = Object.freeze([
    [-7, 'C♭ major / A♭ minor'], [-6, 'G♭ major / E♭ minor'], [-5, 'D♭ major / B♭ minor'], [-4, 'A♭ major / F minor'], [-3, 'E♭ major / C minor'], [-2, 'B♭ major / G minor'], [-1, 'F major / D minor'],
    [0, 'C major / A minor'], [1, 'G major / E minor'], [2, 'D major / B minor'], [3, 'A major / F♯ minor'], [4, 'E major / C♯ minor'], [5, 'B major / G♯ minor'], [6, 'F♯ major / D♯ minor'], [7, 'C♯ major / A♯ minor'],
  ].map(([fifths, label]) => Object.freeze({ fifths, label })));

  const TIME_SIGNATURES = Object.freeze(['2/2', '2/4', '3/4', '4/4', '5/4', '6/8', '9/8', '12/8']);

  // Acorde's batch command boundary accepts at most 64 operations.
  const MAX_BATCH_OPERATIONS = 64;
  function chunkCommands(commands, size = MAX_BATCH_OPERATIONS) { const chunks = []; for (let index = 0; index < commands.length; index += size) chunks.push(commands.slice(index, index + size)); return chunks; }

  const NEW_SCORE_DEFAULTS = Object.freeze({ title: '', composer: '', fifths: 0, time: '4/4', tempo: 120, measures: 32 });
  const MAX_MEASURES = 999;

  function normalizeNewScoreSetup(value = {}) {
    const fifths = Number(value.fifths);
    const tempo = Number(value.tempo);
    const measures = Number(value.measures);
    return {
      title: String(value.title || '').trim().slice(0, 120),
      composer: String(value.composer || '').trim().slice(0, 120),
      fifths: Number.isInteger(fifths) && fifths >= -7 && fifths <= 7 ? fifths : NEW_SCORE_DEFAULTS.fifths,
      time: TIME_SIGNATURES.includes(value.time) ? value.time : NEW_SCORE_DEFAULTS.time,
      tempo: Number.isInteger(tempo) && tempo >= 1 && tempo <= 400 ? tempo : NEW_SCORE_DEFAULTS.tempo,
      measures: Number.isInteger(measures) && measures >= 1 && measures <= MAX_MEASURES ? measures : NEW_SCORE_DEFAULTS.measures,
    };
  }

  // Commands applied right after a template is parsed. Templates start with one measure.
  function newScoreSetupCommands(value, existingMeasures = 1) {
    const setup = normalizeNewScoreSetup(value);
    const [numerator, denominator] = setup.time.split('/').map(Number);
    const commands = [
      ...(setup.title || setup.composer ? [{ type: 'set_metadata', title: setup.title || null, composer: setup.composer || null, lyricist: null, copyright: null, work_number: null, movement_title: null }] : []),
      { type: 'set_key_signature', fifths: setup.fifths },
      { type: 'set_time_signature', numerator, denominator },
      { type: 'set_tempo', bpm: setup.tempo },
    ];
    const start = Math.max(1, Number(existingMeasures) || 1);
    for (let index = start; index < setup.measures; index += 1) commands.push({ type: 'add_measure', after_index: index - 1 });
    return commands;
  }

  const TRANSLATIONS = Object.freeze({
    ja: Object.freeze({
      Export: 'エクスポート', 'What to export': 'エクスポート対象', 'Main score': 'フルスコア', 'Export as': '形式', 'Page settings': 'ページ設定', 'Export…': 'エクスポート…', 'Print…': '印刷…', Cancel: 'キャンセル',
      'Parts can be exported as MusicXML or MIDI.': 'パートはMusicXMLまたはMIDIで書き出せます。', Graphics: 'グラフィック', Score: '楽譜',
      'Print-ready document': '印刷用ドキュメント', 'Scalable score image': '拡大縮小できる楽譜画像', 'Editable score exchange': '編集可能な楽譜交換形式', 'Playback and DAW exchange': '再生・DAW用', 'Plain-text notation': 'テキスト形式の楽譜',
      'New score': '新しい楽譜', 'Choose a template': 'テンプレートを選択', 'Additional score information': '楽譜の追加情報', Title: 'タイトル', Composer: '作曲者', 'Key signature': '調号', 'Time signature': '拍子記号', Tempo: 'テンポ', 'Number of measures': '小節数', Create: '作成',
      'Piano Solo': 'ピアノソロ', 'Small Ensemble (Piano + Strings)': '小編成（ピアノ＋弦楽器）', 'Saved a copy to': 'コピーを保存しました:',
    }),
    zh: Object.freeze({
      Export: '导出', 'What to export': '导出内容', 'Main score': '总谱', 'Export as': '导出格式', 'Page settings': '页面设置', 'Export…': '导出…', 'Print…': '打印…', Cancel: '取消',
      'Parts can be exported as MusicXML or MIDI.': '分谱可导出为 MusicXML 或 MIDI。', Graphics: '图形', Score: '乐谱',
      'Print-ready document': '可打印文档', 'Scalable score image': '可缩放乐谱图像', 'Editable score exchange': '可编辑的乐谱交换格式', 'Playback and DAW exchange': '播放与 DAW 交换', 'Plain-text notation': '纯文本记谱',
      'New score': '新建乐谱', 'Choose a template': '选择模板', 'Additional score information': '其他乐谱信息', Title: '标题', Composer: '作曲', 'Key signature': '调号', 'Time signature': '拍号', Tempo: '速度', 'Number of measures': '小节数', Create: '创建',
      'Piano Solo': '钢琴独奏', 'Small Ensemble (Piano + Strings)': '小型合奏（钢琴＋弦乐）', 'Saved a copy to': '已保存副本：',
    }),
  });

  function label(text, language = 'en') { return TRANSLATIONS[language]?.[text] || text; }

  return { EXPORT_FORMATS, exportFormat, exportTargets, parseExportTarget, safeFileStem, KEY_SIGNATURES, TIME_SIGNATURES, NEW_SCORE_DEFAULTS, MAX_MEASURES, MAX_BATCH_OPERATIONS, chunkCommands, normalizeNewScoreSetup, newScoreSetupCommands, TRANSLATIONS, label };
});
