(function initScoreEditing(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AcordeScoreEditing = api;
})(typeof globalThis === 'object' ? globalThis : this, function scoreEditingFactory() {
  'use strict';

  // MuseScore Studio's Edit / Add / Format / Tools measure operations, expressed as Acorde
  // commands. Measure ranges are inclusive, zero-based physical measure indexes. Every builder
  // returns null when the operation cannot be expressed, so the renderer can explain why
  // instead of sending a command the engine would reject.
  const MAX_MEASURE_COUNT = 999;

  function parseCount(value, max = MAX_MEASURE_COUNT) {
    if (value === null || value === undefined || String(value).trim() === '') return null;
    const count = Number(value);
    return Number.isInteger(count) && count >= 1 && count <= max ? count : null;
  }

  function normalizeRange(range) {
    if (!Array.isArray(range) || range.length !== 2 || !range.every((value) => Number.isInteger(value) && value >= 0)) return null;
    return [Math.min(...range), Math.max(...range)];
  }

  // add_measure inserts after an index, so nothing can be inserted before the first measure.
  function insertMeasureCommands(beforeIndex, count) {
    if (!Number.isInteger(beforeIndex) || beforeIndex < 1 || !parseCount(count)) return null;
    return Array.from({ length: count }, (_, index) => ({ type: 'add_measure', after_index: beforeIndex - 1 + index }));
  }

  function appendMeasureCommands(measureCount, count) {
    if (!Number.isInteger(measureCount) || measureCount < 1 || !parseCount(count)) return null;
    return Array.from({ length: count }, (_, index) => ({ type: 'add_measure', after_index: measureCount - 1 + index }));
  }

  // Joining n measures is n-1 joins at the first index.
  function joinMeasureCommands(range) {
    const bounds = normalizeRange(range);
    if (!bounds || bounds[1] === bounds[0]) return null;
    return Array.from({ length: bounds[1] - bounds[0] }, () => ({ type: 'join_measures', measure_index: bounds[0] }));
  }

  // Deletes from the end so earlier indexes stay valid; a score always keeps one measure.
  function removeRangeCommands(range, measureCount) {
    const bounds = normalizeRange(range);
    if (!bounds || bounds[1] >= measureCount || bounds[1] - bounds[0] + 1 >= measureCount) return null;
    return Array.from({ length: bounds[1] - bounds[0] + 1 }, (_, index) => ({ type: 'delete_measure', measure_index: bounds[1] - index }));
  }

  // set_system_break_interval takes an exclusive end_measure; no range re-breaks the whole score.
  function systemBreakCommand(interval, range = null) {
    const value = Number(interval);
    if (!Number.isInteger(value) || value < 0 || value > MAX_MEASURE_COUNT) return null;
    const bounds = range ? normalizeRange(range) : null;
    return { type: 'set_system_break_interval', interval: value, ...(bounds ? { start_measure: bounds[0], end_measure: bounds[1] + 1 } : {}) };
  }

  // Menu voices are one-based; Acorde voices are zero-based.
  function exchangeVoicesCommand({ part = 0, staff = 0 } = {}, range, voices) {
    const bounds = normalizeRange(range);
    if (!bounds || !Array.isArray(voices) || voices.length !== 2) return null;
    const [first, second] = voices;
    if (![first, second].every((voice) => Number.isInteger(voice) && voice >= 0 && voice <= 3) || first === second) return null;
    return { type: 'exchange_voices', part_index: part, staff_index: staff, start_measure: bounds[0], end_measure: bounds[1], first_voice: first, second_voice: second };
  }

  // Quarter-note beats of one note, matching Acorde's Note::beats (grace and cue notes take none).
  const WHOLE_FRACTIONS = Object.freeze({ Breve: 2, Whole: 1, Half: 1 / 2, Quarter: 1 / 4, Eighth: 1 / 8, Sixteenth: 1 / 16, ThirtySecond: 1 / 32, SixtyFourth: 1 / 64, HundredTwentyEighth: 1 / 128 });
  function noteBeats(note) {
    if (!note || note.is_grace || note.is_cue) return 0;
    const fraction = WHOLE_FRACTIONS[note.duration];
    if (!fraction) return 0;
    let total = 4 * fraction;
    let dot = total / 2;
    for (let index = 0; index < Number(note.dot_count || 0); index += 1) { total += dot; dot /= 2; }
    const tuplet = note.tuplet;
    return tuplet && tuplet.actual_notes > 0 ? total * tuplet.normal_notes / tuplet.actual_notes : total;
  }

  // MuseScore "Split measure before selected note/rest": the split point is the selected note's
  // onset in its voice. Acorde then requires every other voice to have a note boundary there.
  function splitMeasureCommand(measure, address) {
    const notes = measure?.voices?.[address?.voice];
    if (!Array.isArray(notes) || !Number.isInteger(address?.note) || address.note < 1 || address.note >= notes.length) return null;
    const beats = notes.slice(0, address.note).reduce((sum, note) => sum + noteBeats(note), 0);
    if (!(beats > 0)) return null;
    return { type: 'split_measure', measure_index: address.measure, split_at_beats: Math.round(beats * 1e6) / 1e6 };
  }

  const TEXT = Object.freeze({
    en: Object.freeze({
      selectMeasures: 'Select measures (or a note) first.', selectTwo: 'Select at least two measures to join.', keepOne: 'A score must keep at least one measure.',
      firstMeasure: 'Measures cannot be inserted before the first measure yet (Acorde inserts measures after a given index).',
      count: 'Number of measures (1–999)', interval: 'Break systems every how many measures? (0 removes system breaks)', failed: 'Could not apply this operation',
      selectNote: 'Select the note or rest to split before (not the first one in the measure).',
      joinFit: 'Acorde joins measures only when their combined notes fit the first measure’s time signature (for example, measures that were split). Irregular measures are not supported yet.',
      splitAlign: 'The split point must fall on a note boundary in every voice and staff.',
    }),
    ja: Object.freeze({
      selectMeasures: '先に小節（または音符）を選択してください。', selectTwo: '結合するには2小節以上を選択してください。', keepOne: '楽譜には少なくとも1小節が必要です。',
      firstMeasure: '最初の小節の前にはまだ挿入できません（Acordeの小節追加は指定位置の後ろにのみ挿入します）。',
      count: '小節数（1〜999）', interval: '何小節ごとに段を区切りますか（0で段区切りを削除）', failed: '操作を適用できませんでした',
      selectNote: '分割位置となる音符または休符を選択してください（小節の最初の音符以外）。',
      joinFit: 'Acordeでは、結合後の音符が最初の小節の拍子に収まる場合（分割した小節など）にのみ結合できます。不規則な小節にはまだ対応していません。',
      splitAlign: '分割位置は、すべての声部・譜表で音符の区切りに一致している必要があります。',
    }),
    zh: Object.freeze({
      selectMeasures: '请先选择小节（或音符）。', selectTwo: '请至少选择两个小节以进行合并。', keepOne: '乐谱至少需要保留一个小节。',
      firstMeasure: '暂时无法在第一小节之前插入（Acorde 的添加小节只能插入到指定位置之后）。',
      count: '小节数（1–999）', interval: '每隔几个小节换行（输入 0 删除换行符）', failed: '无法应用此操作',
      selectNote: '请选择要在其前拆分的音符或休止符（不能是小节中的第一个）。',
      joinFit: 'Acorde 仅在合并后的音符能放入第一个小节的拍号时才能合并（例如拆分过的小节）。暂不支持不规则小节。',
      splitAlign: '拆分位置必须在每个声部和谱表的音符边界上。',
    }),
  });

  function text(key, language = 'en') { return TEXT[language]?.[key] || TEXT.en[key] || key; }

  return { MAX_MEASURE_COUNT, parseCount, normalizeRange, insertMeasureCommands, appendMeasureCommands, joinMeasureCommands, removeRangeCommands, systemBreakCommand, exchangeVoicesCommand, noteBeats, splitMeasureCommand, TEXT, text };
});
