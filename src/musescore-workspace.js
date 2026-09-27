(function initMuseScoreWorkspace(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AcordeMuseScoreWorkspace = api;
})(typeof globalThis === 'object' ? globalThis : this, function museScoreWorkspaceFactory() {
  'use strict';

  const PALETTE_GROUPS = Object.freeze([
    Object.freeze({ id: 'clefs', label: 'Clefs', items: Object.freeze([
      Object.freeze({ label: 'Treble clef', target: 'clef-select', value: 'Treble' }),
      Object.freeze({ label: 'Bass clef', target: 'clef-select', value: 'Bass' }),
    ]) }),
    Object.freeze({ id: 'key-signatures', label: 'Key signatures', items: Object.freeze([
      Object.freeze({ label: 'C major / A minor', target: 'key-select', value: '0' }),
      Object.freeze({ label: 'G major / E minor', target: 'key-select', value: '1' }),
      Object.freeze({ label: 'F major / D minor', target: 'key-select', value: '-1' }),
    ]) }),
    Object.freeze({ id: 'time-signatures', label: 'Time signatures', items: Object.freeze([
      Object.freeze({ label: '4/4', target: 'time-select', value: '4/4' }),
      Object.freeze({ label: '3/4', target: 'time-select', value: '3/4' }),
      Object.freeze({ label: '6/8', target: 'time-select', value: '6/8' }),
    ]) }),
    Object.freeze({ id: 'accidentals', label: 'Accidentals', items: Object.freeze([
      Object.freeze({ label: '♯ Sharp', target: 'accidental-select', value: '1' }),
      Object.freeze({ label: '♭ Flat', target: 'accidental-select', value: '-1' }),
      Object.freeze({ label: '♮ Natural', target: 'accidental-select', value: '0' }),
    ]) }),
    Object.freeze({ id: 'articulations', label: 'Articulations', items: Object.freeze([
      Object.freeze({ label: 'Staccato', target: 'articulation-select', value: 'Staccato' }),
      Object.freeze({ label: 'Accent', target: 'articulation-select', value: 'Accent' }),
      Object.freeze({ label: 'Tenuto', target: 'articulation-select', value: 'Tenuto' }),
      Object.freeze({ label: 'Fermata', target: 'articulation-select', value: 'Fermata' }),
    ]) }),
    Object.freeze({ id: 'dynamics', label: 'Dynamics', items: Object.freeze([
      Object.freeze({ label: 'p', target: 'dynamic-select', value: 'P' }),
      Object.freeze({ label: 'mp', target: 'dynamic-select', value: 'Mp' }),
      Object.freeze({ label: 'mf', target: 'dynamic-select', value: 'Mf' }),
      Object.freeze({ label: 'f', target: 'dynamic-select', value: 'F' }),
      Object.freeze({ label: 'sfz', target: 'dynamic-select', value: 'Sfz' }),
    ]) }),
    Object.freeze({ id: 'tempo', label: 'Tempo', items: Object.freeze([
      Object.freeze({ label: 'Tempo text', target: 'measure-tempo-button' }),
    ]) }),
    Object.freeze({ id: 'text', label: 'Text', items: Object.freeze([
      Object.freeze({ label: 'Staff text', command: 'add:staff-text' }),
      Object.freeze({ label: 'Expression', target: 'expression-button' }),
      Object.freeze({ label: 'Technique', command: 'add:technique-text' }),
      Object.freeze({ label: 'Lyrics', target: 'lyric-button' }),
      Object.freeze({ label: 'Chord symbol', target: 'chord-button' }),
    ]) }),
    Object.freeze({ id: 'lines', label: 'Lines', items: Object.freeze([
      Object.freeze({ label: 'Slur', target: 'slur-tool' }),
      Object.freeze({ label: 'Crescendo', command: 'add:crescendo' }),
      Object.freeze({ label: 'Diminuendo', command: 'add:diminuendo' }),
      Object.freeze({ label: '8va', command: 'add:ottava-alta' }),
      Object.freeze({ label: '8vb', command: 'add:ottava-bassa' }),
      Object.freeze({ label: 'Pedal', target: 'pedal-button' }),
      Object.freeze({ label: 'Glissando', target: 'glissando-button' }),
      Object.freeze({ label: 'Trill line', target: 'trill-button' }),
    ]) }),
    Object.freeze({ id: 'arpeggios', label: 'Arpeggios and glissandi', items: Object.freeze([
      Object.freeze({ label: 'Arpeggio', target: 'arpeggio-button' }),
      Object.freeze({ label: 'Glissando', target: 'glissando-button' }),
    ]) }),
    Object.freeze({ id: 'layout', label: 'Layout', items: Object.freeze([
      Object.freeze({ label: 'Page break', target: 'page-break-button' }),
      Object.freeze({ label: 'System break', target: 'system-break-button' }),
      Object.freeze({ label: 'Multi-measure rest', target: 'multi-rest-button' }),
    ]) }),
  ]);

  const DURATION_SHORTCUTS = Object.freeze({
    1: 'sixtyfourth',
    2: 'thirtysecond',
    3: 'sixteenth',
    4: 'eighth',
    5: 'quarter',
    6: 'half',
    7: 'whole',
  });

  const PALETTE_TRANSLATIONS = Object.freeze({
    ja: Object.freeze({
      'Clefs': '音部記号', 'Treble clef': 'ト音記号', 'Bass clef': 'ヘ音記号', 'Key signatures': '調号', 'C major / A minor': 'ハ長調 / イ短調', 'G major / E minor': 'ト長調 / ホ短調', 'F major / D minor': 'ヘ長調 / ニ短調', 'Time signatures': '拍子記号', 'Accidentals': '臨時記号', '♯ Sharp': '♯ シャープ', '♭ Flat': '♭ フラット', '♮ Natural': '♮ ナチュラル', 'Articulations': 'アーティキュレーション', 'Staccato': 'スタッカート', 'Accent': 'アクセント', 'Tenuto': 'テヌート', 'Fermata': 'フェルマータ', 'Dynamics': '強弱記号', 'Tempo': 'テンポ', 'Tempo text': 'テンポテキスト', 'Text': 'テキスト', 'Staff text': '譜表テキスト', 'Expression': '発想標語', 'Technique': '奏法', 'Lyrics': '歌詞', 'Chord symbol': 'コード記号', 'Lines': '線', 'Slur': 'スラー', 'Crescendo': 'クレッシェンド', 'Diminuendo': 'ディミヌエンド', 'Pedal': 'ペダル', 'Glissando': 'グリッサンド', 'Trill line': 'トリル線', 'Arpeggios and glissandi': 'アルペジオとグリッサンド', 'Arpeggio': 'アルペジオ', 'Layout': 'レイアウト', 'Page break': '改ページ', 'System break': '改段', 'Multi-measure rest': '複数小節休符',
    }),
    zh: Object.freeze({
      'Clefs': '谱号', 'Treble clef': '高音谱号', 'Bass clef': '低音谱号', 'Key signatures': '调号', 'C major / A minor': 'C 大调 / A 小调', 'G major / E minor': 'G 大调 / E 小调', 'F major / D minor': 'F 大调 / D 小调', 'Time signatures': '拍号', 'Accidentals': '变音记号', '♯ Sharp': '♯ 升号', '♭ Flat': '♭ 降号', '♮ Natural': '♮ 还原号', 'Articulations': '奏法记号', 'Staccato': '断奏', 'Accent': '重音', 'Tenuto': '保持音', 'Fermata': '延长记号', 'Dynamics': '力度', 'Tempo': '速度', 'Tempo text': '速度文本', 'Text': '文本', 'Staff text': '五线谱文本', 'Expression': '表情文本', 'Technique': '演奏法', 'Lyrics': '歌词', 'Chord symbol': '和弦符号', 'Lines': '线', 'Slur': '圆滑线', 'Crescendo': '渐强', 'Diminuendo': '渐弱', 'Pedal': '踏板', 'Glissando': '滑音', 'Trill line': '颤音线', 'Arpeggios and glissandi': '琶音与滑音', 'Arpeggio': '琶音', 'Layout': '布局', 'Page break': '分页符', 'System break': '换行符', 'Multi-measure rest': '多小节休止符',
    }),
  });

  function paletteLabel(label, language = 'en') { return PALETTE_TRANSLATIONS[language]?.[label] || label; }

  function noteAt(score, address) {
    if (!score || !address) return null;
    return score.parts?.[address.part]?.staves?.[address.staff]?.measures?.[address.measure]?.voices?.[address.voice]?.[address.note] || null;
  }

  function selectionSnapshot(score, address) {
    const note = noteAt(score, address);
    if (!note) return Object.freeze({ selected: false });
    const pitch = note.is_rest ? 'Rest' : (note.pitches?.[0] ? `${note.pitches[0].step}${note.pitches[0].alter === 1 ? '♯' : note.pitches[0].alter === -1 ? '♭' : ''}${note.pitches[0].octave}` : 'Note');
    return Object.freeze({
      selected: true,
      kind: note.is_rest ? 'rest' : 'note',
      label: `${pitch} · measure ${address.measure + 1} · voice ${address.voice + 1}`,
      duration: String(note.duration || 'quarter').toLowerCase(),
      dotted: Number(note.dot_count || 0) > 0,
      dynamic: note.dynamic || '',
      stem: note.stem_up === true ? 'up' : note.stem_up === false ? 'down' : 'auto',
      fingering: note.fingering == null ? '' : String(note.fingering),
      stringNumber: note.string_number == null ? '' : String(note.string_number),
    });
  }

  function addressFields(address, voiceKey = 'voice') {
    if (!address) return null;
    const fields = { part_index: address.part, staff_index: address.staff, measure_index: address.measure, note_index: address.note };
    fields[voiceKey] = address.voice;
    return fields;
  }

  function propertyCommand(property, value, address, snapshot = {}) {
    const regular = addressFields(address);
    if (!regular) return null;
    if (property === 'duration') return { type: 'set_duration', ...regular, duration: value, dot_count: snapshot.dotted ? 1 : 0 };
    if (property === 'dot') return { type: 'set_duration', ...regular, duration: snapshot.duration, dot_count: value ? 1 : 0 };
    if (property === 'dynamic') return { type: 'set_dynamic', ...regular, dynamic: value || null };
    if (property === 'fingering') return { type: 'set_fingering', ...regular, fingering: value === '' ? null : Number(value) };
    if (property === 'string-number') return { type: 'set_string_number', ...regular, string_number: value === '' ? null : Number(value) };
    if (property === 'stem') return { type: 'set_stem', ...addressFields(address, 'voice_index'), stem_up: value === 'auto' ? null : value === 'up' };
    return null;
  }

  return { PALETTE_GROUPS, DURATION_SHORTCUTS, PALETTE_TRANSLATIONS, paletteLabel, noteAt, selectionSnapshot, propertyCommand };
});
