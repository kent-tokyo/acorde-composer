import init, * as acorde from './acorde-wasm/acorde_wasm.js';
import { ARRANGEMENT_SAMPLES, localizedPreset, makeSelection } from './arrangement-data.js';

const SAMPLE_ABC = `X:1\nT:Playground sketch\nM:4/4\nL:1/4\nK:C\nC D E F | G A B c |`;
const $ = (id) => document.getElementById(id);
let engine = null;
let scoreJson = '';
let sourceScoreJson = '';
let candidateScoreJson = '';
let selectedPreset = '';
let savedCandidates = [];
let audioBackend = null;
let playbackTimer = null;
let playbackGeneration = 0;
let activePlayback = null;
let importedScoreJson = '';
let firstPlayTracked = false;
const completedPlayback = new Set();
const openedAt = performance.now();
function trackUsage(event, seconds = 0) {
  const sample = importedScoreJson ? 'custom' : currentSample().id;
  fetch('https://acorde.dev/api/event', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ event, sample, locale: language, surface: 'playground', seconds: Math.min(120, Math.max(0, Math.round(seconds * 10) / 10)) }), keepalive: true }).catch(() => {});
}
function recordCompleted(which) {
  if (which !== 'source' && which !== 'arranged') return;
  completedPlayback.add(which);
  if (completedPlayback.size === 2) { trackUsage('both_completed'); completedPlayback.clear(); }
}
const LANGUAGE_KEY = 'acorde-composer.language.v1';
const COPY = {
  en: { label: 'Language', hero: 'Edit a score in your browser', description: 'Try the same Acorde score engine used by Composer. Import ABC, make a small edit, undo it, and export MusicXML locally.', live: 'LIVE SCORE', undo: 'Undo', redo: 'Redo', download: 'Download MusicXML', import: 'Import ABC', abc: 'ABC notation', load: 'Load ABC into Acorde', local: 'Local-first demo', localDescription: 'No score data is uploaded. The browser calls the bundled acorde-wasm module directly.', ready: 'Ready. Try an edit or load your own ABC notation.', loaded: 'ABC parsed by acorde and loaded into the editor.', exported: 'MusicXML exported locally.', selected: 'Selected {address}. Use the note-input toolbar to edit the score.' },
  ja: { label: '言語', hero: 'ブラウザで楽譜を編集', description: 'Composerと同じAcorde楽譜エンジンを試せます。ABCを読み込み、編集、取り消し、MusicXML出力までローカルで行います。', live: 'ライブ譜面', undo: '元に戻す', redo: 'やり直す', download: 'MusicXMLをダウンロード', import: 'ABCを読み込む', abc: 'ABC記譜', load: 'AcordeにABCを読み込む', local: 'ローカル完結デモ', localDescription: '譜面データは送信されません。ブラウザから同梱のacorde-wasmを直接呼び出します。', ready: '準備完了。編集するか、ABC記譜を読み込んでください。', loaded: 'AcordeでABCを解析してエディタに読み込みました。', exported: 'MusicXMLをローカルに書き出しました。', selected: '{address}を選択しました。上部の音符入力ツールバーで編集できます。' },
  zh: { label: '语言', hero: '在浏览器中编辑乐谱', description: '体验与Composer相同的Acorde乐谱引擎。导入ABC、编辑、撤销并在本地导出MusicXML。', live: '实时乐谱', undo: '撤销', redo: '重做', download: '下载MusicXML', import: '导入ABC', abc: 'ABC记谱', load: '将ABC加载到Acorde', local: '本地优先演示', localDescription: '乐谱数据不会上传。浏览器直接调用内置的acorde-wasm模块。', ready: '准备就绪。请尝试编辑或加载ABC记谱。', loaded: '已由Acorde解析ABC并加载到编辑器。', exported: 'MusicXML已在本地导出。', selected: '已选择{address}。请使用上方音符输入工具栏编辑乐谱。' },
};
const EDITOR_COPY = {
  en: { entry: 'Note entry', entryDescription: 'Choose a pitch and duration, then append it to the last measure.', pitch: 'Pitch', duration: 'Duration', addNote: 'Add note', addRest: 'Add rest', addMeasure: 'Add measure', score: 'Score settings', tempo: 'Tempo (BPM)', applyTempo: 'Apply tempo', reset: 'Reset sample score', addedNote: 'Added a {pitch} {duration} note.', addedRest: 'Added a {duration} rest.', addedMeasure: 'Added a measure.', tempoChanged: 'Tempo set to {tempo} BPM.', resetDone: 'Reset the sample score.', eighth: 'Eighth', quarter: 'Quarter', half: 'Half', whole: 'Whole' },
  ja: { entry: '音符入力', entryDescription: '音高と音価を選び、最後の小節へ追加します。', pitch: '音高', duration: '音価', addNote: '音符を追加', addRest: '休符を追加', addMeasure: '小節を追加', score: '譜面設定', tempo: 'テンポ（BPM）', applyTempo: 'テンポを適用', reset: 'サンプル譜面に戻す', addedNote: '{pitch}の{duration}音符を追加しました。', addedRest: '{duration}休符を追加しました。', addedMeasure: '小節を追加しました。', tempoChanged: 'テンポを{tempo} BPMに設定しました。', resetDone: 'サンプル譜面に戻しました。', eighth: '8分', quarter: '4分', half: '2分', whole: '全' },
  zh: { entry: '音符输入', entryDescription: '选择音高和时值，然后追加到最后一个小节。', pitch: '音高', duration: '时值', addNote: '添加音符', addRest: '添加休止符', addMeasure: '添加小节', score: '乐谱设置', tempo: '速度（BPM）', applyTempo: '应用速度', reset: '重置示例乐谱', addedNote: '已添加{pitch}{duration}音符。', addedRest: '已添加{duration}休止符。', addedMeasure: '已添加小节。', tempoChanged: '速度已设为{tempo} BPM。', resetDone: '已重置示例乐谱。', eighth: '八分', quarter: '四分', half: '二分', whole: '全' },
};
const ARRANGE_COPY = {
  en: { sample: 'Melody', presets: 'Accompaniment', chords: 'Chords, one per measure', voice: 'Added melodic voice', arrange: 'Try this arrangement', restore: 'Return to original', original: 'Play original', arranged: 'Play arrangement', accompaniment: 'Accompaniment only', stop: 'Stop', loop: 'Loop', edit: 'Edit the score', own: 'Try your own score', file: 'Open MusicXML or ABC', melody: 'Melody part', hint: 'Add chords before arranging a score without harmony.', none: 'None', third: 'Third below', sixth: 'Sixth below', octave: 'Octave below', samples: ['Four-beat melody', 'Three-beat melody', 'Swing melody'], generated: 'Arrangement ready: {count} added notes. Compare it with the original.', source: 'Original score restored. Your arrangement is saved below.', invalid: 'Use one chord per measure, for example C | Am | F | G.', playing: 'Playing {which}.', saved: 'Previous arrangements' },
  ja: { sample: '旋律', presets: '伴奏', chords: '各小節のコード', voice: '重ねる旋律', arrange: 'この編曲を試す', restore: '原譜に戻す', original: '原曲を再生', arranged: '編曲を再生', accompaniment: '伴奏だけ', stop: '停止', loop: '繰り返す', edit: '譜面を編集', own: '自分の譜面を試す', file: 'MusicXML または ABC を開く', melody: '旋律パート', hint: '和声のない譜面は、編曲前にコードを入力してください。', none: 'なし', third: '下に3度', sixth: '下に6度', octave: '下に8度', samples: ['4拍子の旋律', '3拍子の旋律', 'スイングの旋律'], generated: '編曲完了：{count}音を追加しました。原曲と聴き比べてください。', source: '原譜に戻しました。編曲候補は下に保存されています。', invalid: '各小節にコードを1つ入力してください。例：C | Am | F | G', playing: '{which}を再生中。', saved: '以前の編曲候補' },
  zh: { sample: '旋律', presets: '伴奏', chords: '每小节和弦', voice: '附加旋律', arrange: '试听此编曲', restore: '返回原谱', original: '播放原曲', arranged: '播放编曲', accompaniment: '仅伴奏', stop: '停止', loop: '循环', edit: '编辑乐谱', own: '试用自己的乐谱', file: '打开 MusicXML 或 ABC', melody: '旋律声部', hint: '没有和声的乐谱请先填写和弦。', none: '无', third: '下方三度', sixth: '下方六度', octave: '下方八度', samples: ['四拍旋律', '三拍旋律', '摇摆旋律'], generated: '编曲完成：新增 {count} 个音符。请与原曲比较。', source: '已返回原谱。编曲候选保存在下方。', invalid: '请为每小节输入一个和弦，例如 C | Am | F | G。', playing: '正在播放{which}。', saved: '之前的编曲' },
};
const IMPORT_COPY = {
  en: { full: 'Full original score', part: 'Part', staff: 'staff', voice: 'voice', choose: 'Select one melody voice and review one chord per measure.', empty: 'No melodic notes were found in this score.', chosen: 'Melody selected. Review the chord progression before arranging.', restored: 'Original score restored. Select a melody to arrange.', loaded: '{file} loaded. Review the chords before arranging.' },
  ja: { full: '読み込んだ原譜全体', part: 'パート', staff: '段', voice: '声部', choose: '旋律の声部を1つ選び、各小節のコードを確認してください。', empty: '旋律の音符が見つかりませんでした。', chosen: '旋律を選びました。編曲前にコード進行を確認してください。', restored: '原譜全体に戻しました。編曲する旋律を選んでください。', loaded: '{file} を読み込みました。編曲前にコードを確認してください。' },
  zh: { full: '导入的完整原谱', part: '声部', staff: '谱表', voice: '声部', choose: '请选择一个旋律声部并检查每小节的和弦。', empty: '此乐谱中没有找到旋律音符。', chosen: '已选择旋律，请在编曲前检查和弦。', restored: '已返回完整原谱，请选择要编曲的旋律。', loaded: '已导入 {file}，请在编曲前检查和弦。' },
};
let language = 'en';
try { language = COPY[localStorage.getItem(LANGUAGE_KEY)] ? localStorage.getItem(LANGUAGE_KEY) : 'en'; } catch { language = 'en'; }
function applyLanguage(next = language) {
  language = COPY[next] ? next : 'en'; const copy = COPY[language]; document.documentElement.lang = language;
  const text = (id, value) => { const element = $(id); if (element) element.textContent = value; };
  [['language-label', copy.label], ['hero-title', copy.hero], ['hero-description', copy.description], ['live-score-label', copy.live], ['undo-label', copy.undo], ['redo-label', copy.redo], ['download-button', copy.download], ['import-title', copy.import], ['abc-label', copy.abc], ['load-abc-button', copy.load], ['local-demo-title', copy.local], ['local-demo-description', copy.localDescription]].forEach(([id, value]) => text(id, value));
  text('hero-title', { en: 'Hear what an arrangement changes', ja: '編曲すると、どう変わる？', zh: '听听编曲带来的变化' }[language]);
  text('hero-description', { en: 'Choose a melody, try an accompaniment, and compare it with the original.', ja: '旋律と伴奏を選び、原曲と聴き比べましょう。', zh: '选择旋律与伴奏，和原曲听一听差别。' }[language]);
  text('showcase-title', { en: 'Hear three ways to arrange a melody', ja: '3つの編曲を聴き比べる', zh: '试听三种编曲方式' }[language]);
  text('showcase-hint', { en: 'Choose an example to hear the original followed by the arrangement.', ja: '譜例を選ぶと、原曲に続けて編曲を再生します。', zh: '选择示例，先听原曲，再听编曲。' }[language]);
  text('compare-button', { en: 'Hear original, then arrangement', ja: '原曲と編曲を続けて聴く', zh: '先听原曲，再听编曲' }[language]);
  text('legend-source-label', { en: 'Original notes', ja: '原曲の音符', zh: '原曲音符' }[language]);
  text('legend-added-label', { en: 'Notes added by Acorde', ja: 'Acordeが追加した音符', zh: 'Acorde添加的音符' }[language]);
  const showcase = {
    en: [['Bass and chords', 'A steady pulse under the same melody'], ['Waltz accompaniment', 'Bass on beat one, chords after it'], ['Harmony layer', 'One more melodic line']],
    ja: [['ベースと和音', '同じ旋律に拍のある伴奏を付ける'], ['ワルツ伴奏', '1拍目にベース、後の拍に和音'], ['ハーモニーを重ねる', '旋律をもう1声部加える']],
    zh: [['低音与和弦', '为同一旋律加入稳定节拍'], ['华尔兹伴奏', '第一拍低音，随后是和弦'], ['叠加和声', '再加入一条旋律线']],
  }[language];
  document.querySelectorAll('.showcase-card').forEach((card, index) => { card.querySelector('strong').textContent = showcase[index][0]; card.querySelector('span').textContent = showcase[index][1]; });
  const select = $('language-select'); if (select) select.value = language;
  const editor = EDITOR_COPY[language];
  [['pitch-label', editor.pitch], ['duration-label', editor.duration], ['add-note-label', editor.addNote], ['add-rest-label', editor.addRest], ['add-measure-label', editor.addMeasure], ['tempo-label', editor.tempo], ['apply-tempo-label', editor.applyTempo], ['reset-score-label', editor.reset]].forEach(([id, value]) => text(id, value));
  [['Eighth', editor.eighth], ['Quarter', editor.quarter], ['Half', editor.half], ['Whole', editor.whole]].forEach(([value, label]) => { const option = $('duration-select')?.querySelector(`option[value="${value}"]`); if (option) option.textContent = label; });
  const arrangement = ARRANGE_COPY[language];
  [['sample-label', arrangement.sample], ['preset-label', arrangement.presets], ['chord-label', arrangement.chords], ['voice-label', arrangement.voice], ['arrange-button', arrangement.arrange], ['restore-button', arrangement.restore], ['play-source-button', arrangement.original], ['play-arranged-button', arrangement.arranged], ['play-accompaniment-button', arrangement.accompaniment], ['stop-button', arrangement.stop], ['loop-label', arrangement.loop], ['editing-summary', arrangement.edit], ['own-score-title', arrangement.own], ['score-file-label', arrangement.file], ['melody-label', arrangement.melody], ['own-score-hint', arrangement.hint]].forEach(([id, value]) => text(id, value));
  ['none', 'third', 'sixth', 'octave'].forEach((key, index) => { $('voice-select').options[index].textContent = arrangement[key]; });
  ARRANGEMENT_SAMPLES.forEach((sample, index) => { $('sample-select').options[index].textContent = arrangement.samples[index] || { en: 'Harmony layers', ja: '重ねる旋律', zh: '旋律叠加' }[language]; });
  renderPresets();
  renderCandidates();
  refreshMelodyLabels();
}
applyLanguage();

function setStatus(message, isError = false) {
  $('status').textContent = message;
  $('status').classList.toggle('error', isError);
}

function refreshHistoryButtons() {
  $('undo-button').disabled = !engine?.get_undo_label();
  $('redo-button').disabled = !engine?.get_redo_label();
}

function refreshScore() {
  scoreJson = engine.get_score();
  sourceScoreJson = scoreJson;
  candidateScoreJson = '';
  savedCandidates = [];
  stopPlayback();
  $('restore-button').disabled = true;
  $('play-arranged-button').disabled = true;
  $('compare-button').disabled = false;
  $('play-accompaniment-button').disabled = true;
  $('arrange-button').disabled = false;
  $('play-source-button').disabled = false;
  renderCandidates();
  renderVisibleScore();
  $('tempo-input').value = String(JSON.parse(scoreJson).settings?.tempo_bpm || 120);
  refreshHistoryButtons();
}

function renderVisibleScore() {
  const visibleJson = candidateScoreJson || sourceScoreJson;
  if (!visibleJson) return;
  const score = JSON.parse(visibleJson);
  $('score-title').textContent = score.metadata?.title || 'Untitled score';
  $('score-view').innerHTML = acorde.render_score_svg(visibleJson, JSON.stringify({ width: 900, interactive: true }));
  const svg = $('score-view').querySelector('svg');
  const candidate = savedCandidates.find((item) => item.scoreJson === candidateScoreJson);
  const generated = new Set((candidate?.generated || []).map((addr) => `${addr.part}:${addr.staff}:${addr.measure}:${addr.voice}:${addr.note}`));
  svg?.querySelectorAll('[data-acorde-kind="note"]').forEach((note) => {
    if (generated.has(note.dataset.noteAddr)) note.classList.add('generated-note');
    const box = note.getBBox();
    const hit = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    hit.setAttribute('x', String(box.x - 8)); hit.setAttribute('y', String(box.y - 8));
    hit.setAttribute('width', String(box.width + 16)); hit.setAttribute('height', String(box.height + 16));
    hit.setAttribute('fill', 'transparent'); hit.dataset.acordeNoteHit = note.dataset.noteAddr || '';
    hit.classList.add('note-hit'); svg.append(hit);
  });
  $('download-button').disabled = false;
  $('add-note-button').disabled = false;
  $('add-rest-button').disabled = false;
  $('add-measure-button').disabled = false;
  $('apply-tempo-button').disabled = false;
  $('reset-score-button').disabled = false;
}

$('score-view').addEventListener('click', (event) => {
  const note = event.target.closest?.('[data-acorde-kind="note"], [data-acorde-note-hit]');
  if (!note) return;
  $('score-view').querySelectorAll('.selected-note').forEach((item) => item.classList.remove('selected-note'));
  const address = note.dataset.noteAddr || note.dataset.acordeNoteHit || 'note';
  $('score-view').querySelector(`[data-note-addr="${address}"]`)?.classList.add('selected-note');
    setStatus(COPY[language].selected.replace('{address}', address));
});

function addNote(isRest) {
  try {
    const score = JSON.parse(scoreJson);
    const measures = score.parts?.[0]?.staves?.[0]?.measures || [];
    const measureIndex = Math.max(0, measures.length - 1);
    const voice = measures[measureIndex]?.voices?.[0] || [];
    const pitchValue = $('pitch-select').value;
    const duration = $('duration-select').value;
    const match = pitchValue.match(/^([A-G])(\d)$/);
    if (!match) throw new Error('Choose a supported pitch.');
    engine.apply(JSON.stringify({
      type: 'add_note', part_index: 0, staff_index: 0, measure_index: measureIndex, voice: 0,
      position: voice.length, pitch: isRest ? null : { step: match[1], octave: Number(match[2]), alter: 0 }, duration, dot_count: 0, is_rest: isRest,
    }));
    refreshScore();
    const editor = EDITOR_COPY[language];
    const durationLabel = editor[duration.toLowerCase()] || duration;
    setStatus((isRest ? editor.addedRest : editor.addedNote).replace('{pitch}', pitchValue).replace('{duration}', durationLabel));
  } catch (error) { setStatus(`Could not edit the score: ${error}`, true); }
}

function addMeasure() {
  try {
    const measures = JSON.parse(scoreJson).parts?.[0]?.staves?.[0]?.measures || [];
    engine.apply(JSON.stringify({ type: 'add_measure', after_index: Math.max(0, measures.length - 1) }));
    refreshScore();
    setStatus(EDITOR_COPY[language].addedMeasure);
  } catch (error) { setStatus(`Could not edit the score: ${error}`, true); }
}

function setTempo() {
  try {
    const bpm = Number($('tempo-input').value);
    if (!Number.isInteger(bpm) || bpm < 20 || bpm > 300) throw new Error('Tempo must be an integer from 20 to 300 BPM.');
    engine.apply(JSON.stringify({ type: 'set_tempo', bpm }));
    refreshScore();
    setStatus(EDITOR_COPY[language].tempoChanged.replace('{tempo}', bpm));
  } catch (error) { setStatus(`Could not edit the score: ${error}`, true); }
}

function resetScore() {
  try {
    loadSample();
    setStatus(EDITOR_COPY[language].resetDone);
  } catch (error) { setStatus(`Could not edit the score: ${error}`, true); }
}

async function loadAbc() {
  try {
    const source = $('abc-input').value.trim();
    if (!source) throw new Error('Enter ABC notation first.');
    engine.replace_score(acorde.parse_abc(source));
    importedScoreJson = '';
    resetMelodyPicker();
    refreshScore();
    renderPresets();
    const measures = JSON.parse(sourceScoreJson).parts?.[0]?.staves?.[0]?.measures?.length || 0;
    $('chord-input').value = Array(measures).fill('C').join(' | ');
    $('own-score-hint').textContent = ARRANGE_COPY[language].hint;
    setStatus(COPY[language].loaded);
  } catch (error) { setStatus(`Could not parse ABC: ${error}`, true); }
}

async function downloadMusicxml() {
  try {
    const xml = acorde.serialize_musicxml(candidateScoreJson || sourceScoreJson);
    const url = URL.createObjectURL(new Blob([xml], { type: 'application/vnd.recordare.musicxml+xml' }));
    const link = document.createElement('a'); link.href = url; link.download = candidateScoreJson ? 'acorde-arrangement.musicxml' : 'acorde-playground.musicxml'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0); setStatus(COPY[language].exported); trackUsage('musicxml_download');
  } catch (error) { setStatus(`Could not export MusicXML: ${error}`, true); }
}

function currentSample() {
  return ARRANGEMENT_SAMPLES.find((item) => item.id === $('sample-select').value) || ARRANGEMENT_SAMPLES[0];
}

function availablePresets() {
  if (!importedScoreJson || !sourceScoreJson) return currentSample().presets;
  const score = JSON.parse(sourceScoreJson);
  const meter = score.parts?.[0]?.staves?.[0]?.measures?.[0]?.time_sig || score.settings?.time_signature;
  if (meter?.numerator === 3 && meter?.denominator === 4) return ['waltz-bass', 'held-chord', 'alternating-bass'];
  if (meter?.numerator === 4 && meter?.denominator === 4) return ['bass-pulse', 'alternating-bass', 'offbeat-chords', 'swing-pulse'];
  return ['held-chord', 'bass-pulse'];
}

function renderPresets() {
  const presets = availablePresets();
  if (!presets.includes(selectedPreset)) selectedPreset = presets[0];
  $('preset-options').replaceChildren(...presets.map((id) => {
    const button = document.createElement('button');
    button.type = 'button'; button.textContent = localizedPreset(id, language);
    button.dataset.preset = id; button.setAttribute('aria-pressed', String(selectedPreset === id));
    button.addEventListener('click', () => { selectedPreset = id; renderPresets(); });
    return button;
  }));
}

function renderCandidates() {
  const container = $('saved-candidates');
  if (!container) return;
  container.replaceChildren();
  if (!savedCandidates.length) return;
  const label = document.createElement('strong'); label.textContent = ARRANGE_COPY[language].saved;
  container.append(label);
  for (const [index, candidate] of savedCandidates.entries()) {
    const button = document.createElement('button'); button.type = 'button';
    const voiceKey = { 'third-below': 'third', 'sixth-below': 'sixth', 'octave-below': 'octave' }[candidate.voice];
    button.textContent = `${index + 1}. ${localizedPreset(candidate.preset, language)}${voiceKey ? ` + ${ARRANGE_COPY[language][voiceKey]}` : ''}`;
    button.setAttribute('aria-pressed', String(candidate.scoreJson === candidateScoreJson));
    button.addEventListener('click', () => {
      stopPlayback(); candidateScoreJson = candidate.scoreJson; activePlayback = null;
      selectedPreset = candidate.preset; $('voice-select').value = candidate.voice;
      $('chord-input').value = candidate.chords.join(' | '); renderPresets();
      $('restore-button').disabled = false;
      $('play-arranged-button').disabled = false;
      $('play-accompaniment-button').disabled = !accompanimentNotes(candidate).length;
      renderVisibleScore();
      $('arrangement-summary').textContent = ARRANGE_COPY[language].generated.replace('{count}', String(candidate.generated.length));
      renderCandidates();
    });
    container.append(button);
  }
}

function accompanimentNotes(candidate) {
  return candidate.generated.filter((address) => address.staff === 1);
}

function stopPlayback() {
  playbackGeneration += 1;
  if (playbackTimer) clearTimeout(playbackTimer);
  playbackTimer = null;
  audioBackend?.stopAll();
  $('stop-button').disabled = true;
  ['play-source-button', 'play-arranged-button', 'play-accompaniment-button'].forEach((id) => $(id).removeAttribute('aria-current'));
}

async function playScore(which) {
  try {
    stopPlayback();
    const generation = playbackGeneration;
    const candidate = savedCandidates.find((item) => item.scoreJson === candidateScoreJson);
    if (which !== 'source' && !candidate) return;
    const target = which === 'source' ? sourceScoreJson : candidateScoreJson;
    let events = JSON.parse(acorde.to_playback_events_ex(target, '{}'));
    if (which === 'accompaniment') {
      const generated = new Set(accompanimentNotes(candidate).map((addr) => `${addr.part}:${addr.staff}:${addr.measure}:${addr.voice}:${addr.note}`));
      events = events.filter((event) => generated.has(event.address));
    }
    if (!events.length) throw new Error('No playable notes in this selection.');
    audioBackend ||= new window.AcordeAudioBackend();
    const context = await audioBackend.resume();
    if (generation !== playbackGeneration) return;
    audioBackend.schedule(events, context.currentTime + 0.05, { timbre: 'triangle', volume: 0.8 });
    if (!firstPlayTracked) { firstPlayTracked = true; trackUsage('first_play', (performance.now() - openedAt) / 1000); }
    $('stop-button').disabled = false;
    $(`play-${which === 'source' ? 'source' : which === 'arranged' ? 'arranged' : 'accompaniment'}-button`).setAttribute('aria-current', 'true');
    const duration = Math.max(...events.map((event) => event.time_secs + event.duration_secs)) + 0.15;
    setStatus(ARRANGE_COPY[language].playing.replace('{which}', which === 'source' ? ARRANGE_COPY[language].original : which === 'arranged' ? ARRANGE_COPY[language].arranged : ARRANGE_COPY[language].accompaniment));
    playbackTimer = setTimeout(() => { if (generation !== playbackGeneration) return; recordCompleted(which); if ($('loop-toggle').checked) playScore(which); else stopPlayback(); }, duration * 1000);
    return duration;
  } catch (error) { stopPlayback(); setStatus(String(error), true); }
}

async function compareScore() {
  if (!candidateScoreJson) arrangeScore();
  if (!candidateScoreJson) return;
  const duration = await playScore('source');
  if (!duration) return;
  const generation = playbackGeneration;
  clearTimeout(playbackTimer);
  playbackTimer = setTimeout(() => { if (generation === playbackGeneration) { recordCompleted('source'); playScore('arranged'); } }, duration * 1000);
}

function arrangementChords() {
  const chords = $('chord-input').value.split('|').map((item) => item.trim());
  const measures = JSON.parse(sourceScoreJson).parts?.[0]?.staves?.[0]?.measures?.length || 0;
  if (chords.length !== measures || chords.some((chord) => !/^[A-G](?:#|b)?m?$/.test(chord))) throw new Error(ARRANGE_COPY[language].invalid);
  return chords;
}

function arrangementFailure(diagnostics) {
  const first = diagnostics?.[0];
  if (!first) return 'This score cannot be arranged.';
  const messages = {
    en: { 'unsupported-source': 'Choose one monophonic melody voice before arranging.', 'missing-chords': 'Add one chord for each measure before arranging.', 'unsupported-chord': 'This chord is unavailable on the selected bass layout. Try a major or minor chord.', 'unsupported-meter': 'Choose an accompaniment that matches this time signature.', 'unsupported-rhythm': 'This rhythm does not fit the selected accompaniment. Try another pattern.', 'incompatible-harmony': 'The added voice cannot use these chord tones. Change the chord or choose no added voice.', 'out-of-range': 'The added voice would fall outside the accordion range.' },
    ja: { 'unsupported-source': '単旋律の声部を1つ選んでから編曲してください。', 'missing-chords': '各小節のコードを入力してください。', 'unsupported-chord': 'このコードは選択中のベース配置では使えません。長調または短調のコードを試してください。', 'unsupported-meter': 'この拍子に合う伴奏を選んでください。', 'unsupported-rhythm': 'このリズムは選択中の伴奏に合いません。別のパターンを試してください。', 'incompatible-harmony': '追加旋律に合うコード音がありません。コードを変えるか、追加旋律を「なし」にしてください。', 'out-of-range': '追加旋律がアコーディオンの音域を超えます。' },
    zh: { 'unsupported-source': '请先选择一个单旋律声部。', 'missing-chords': '请为每小节填写和弦。', 'unsupported-chord': '所选低音布局不支持此和弦，请尝试大三或小三和弦。', 'unsupported-meter': '请选择适合当前拍号的伴奏。', 'unsupported-rhythm': '此节奏与所选伴奏不兼容，请尝试其他节奏型。', 'incompatible-harmony': '附加旋律与和弦音不匹配，请修改和弦或取消附加旋律。', 'out-of-range': '附加旋律超出手风琴音域。' },
  };
  const message = messages[language][first.code] || first.message || first.code;
  const measure = Number.isInteger(first.measure_index) ? ` (${language === 'ja' ? `第${first.measure_index + 1}小節` : language === 'zh' ? `第${first.measure_index + 1}小节` : `measure ${first.measure_index + 1}`})` : '';
  return message + measure;
}

function arrangeScore() {
  try {
    if (!sourceScoreJson) return;
    stopPlayback();
    completedPlayback.clear();
    const selection = makeSelection(arrangementChords());
    const voice = $('voice-select').value;
    const capabilities = JSON.parse(acorde.accordion_preset_capabilities());
    const preset = capabilities.presets.find((entry) => entry.id === selectedPreset);
    if (!preset) throw new Error(`Unknown preset: ${selectedPreset}`);
    if (preset.requires_free_bass) selection.bass_mode = 'free-bass';
    const result = voice === 'unchanged'
      ? JSON.parse(acorde.arrange_accordion_preset(sourceScoreJson, JSON.stringify(selection), selectedPreset))
      : JSON.parse(acorde.arrange_accordion_layers(sourceScoreJson, JSON.stringify({ ...selection, accompaniment: preset.accompaniment, melodic_voice: voice, swing: preset.swing })));
    if (!result.score) throw new Error(arrangementFailure(result.diagnostics));
    candidateScoreJson = JSON.stringify(result.score);
    const candidate = { scoreJson: candidateScoreJson, generated: result.generated_notes || [], preset: selectedPreset, voice, chords: arrangementChords(), config: result.resolved_config };
    savedCandidates = savedCandidates.filter((item) => item.scoreJson !== candidateScoreJson);
    savedCandidates.unshift(candidate);
    savedCandidates = savedCandidates.slice(0, 6);
    renderVisibleScore(); renderCandidates();
    $('restore-button').disabled = false;
    $('play-arranged-button').disabled = false;
    $('play-accompaniment-button').disabled = !accompanimentNotes(candidate).length;
    const message = ARRANGE_COPY[language].generated.replace('{count}', String(candidate.generated.length));
    $('arrangement-summary').textContent = `${message} ${{ en: 'Amber notes were added by Acorde.', ja: '琥珀色の音符が Acorde による追加分です。', zh: '琥珀色音符由 Acorde 添加。' }[language]}`; setStatus(message); trackUsage('arrangement_generated');
  } catch (error) { const message = error.message || String(error); setStatus(message, true); $('arrangement-summary').textContent = message; }
}

function restoreOriginal() {
  stopPlayback(); candidateScoreJson = ''; renderVisibleScore();
  renderCandidates();
  $('restore-button').disabled = true; $('play-arranged-button').disabled = true; $('play-accompaniment-button').disabled = true;
  $('arrangement-summary').textContent = ARRANGE_COPY[language].source;
}

function loadSample() {
  try {
    const sample = currentSample();
    selectedPreset = sample.presets[0];
    engine.replace_score(acorde.parse_abc(sample.abc));
    importedScoreJson = '';
    resetMelodyPicker();
    $('own-score-hint').textContent = ARRANGE_COPY[language].hint;
    $('chord-input').value = sample.chords.join(' | ');
    $('abc-input').value = sample.abc;
    $('voice-select').value = 'unchanged';
    renderPresets(); refreshScore();
    $('arrangement-summary').textContent = '';
    setStatus(COPY[language].ready);
  } catch (error) { setStatus(String(error), true); }
}

function resetMelodyPicker() {
  const picker = $('melody-select');
  picker.replaceChildren(new Option(IMPORT_COPY[language].full, 'full'));
  picker.disabled = true;
}

function refreshMelodyLabels() {
  const picker = $('melody-select');
  if (!picker) return;
  if (!importedScoreJson) { if (picker.options[0]) picker.options[0].textContent = IMPORT_COPY[language].full; return; }
  const original = JSON.parse(importedScoreJson);
  const copy = IMPORT_COPY[language];
  [...picker.options].forEach((option) => {
    if (option.value === 'full') { option.textContent = copy.full; return; }
    const [partIndex, staffIndex, voiceIndex] = option.value.split(':').map(Number);
    option.textContent = `${original.parts[partIndex]?.name || `${copy.part} ${partIndex + 1}`} · ${copy.staff} ${staffIndex + 1} · ${copy.voice} ${voiceIndex + 1}`;
  });
  if (picker.value === 'full' && !picker.disabled) $('own-score-hint').textContent = copy.choose;
}

function populateMelodyPicker(score) {
  const picker = $('melody-select');
  const choices = [];
  score.parts.forEach((part, partIndex) => part.staves.forEach((staff, staffIndex) => {
    const voiceCount = Math.max(0, ...staff.measures.map((measure) => measure.voices?.length || 0));
    for (let voiceIndex = 0; voiceIndex < voiceCount; voiceIndex++) {
      if (!staff.measures.some((measure) => measure.voices?.[voiceIndex]?.some((note) => !note.is_rest))) continue;
      choices.push(new Option('', `${partIndex}:${staffIndex}:${voiceIndex}`));
    }
  }));
  const needsChoice = choices.length > 1 || score.parts.length > 1 || score.parts[0]?.staves?.length > 1;
  picker.replaceChildren(...(needsChoice ? [new Option('', 'full')] : []), ...choices);
  picker.disabled = !needsChoice;
  refreshMelodyLabels();
  if (needsChoice) {
    picker.value = 'full';
    $('arrange-button').disabled = true;
    $('own-score-hint').textContent = IMPORT_COPY[language].choose;
  } else if (choices.length) {
    picker.value = choices[0].value;
    $('arrange-button').disabled = false;
    $('own-score-hint').textContent = ARRANGE_COPY[language].hint;
  } else {
    $('arrange-button').disabled = true;
    $('own-score-hint').textContent = IMPORT_COPY[language].empty;
  }
}

function selectMelody() {
  try {
    if (!importedScoreJson) return;
    const value = $('melody-select').value;
    let score = JSON.parse(importedScoreJson);
    if (value !== 'full') {
      const [partIndex, staffIndex, voiceIndex] = value.split(':').map(Number);
      const part = score.parts[partIndex];
      const staff = part.staves[staffIndex];
      staff.measures = staff.measures.map((measure) => ({ ...measure, voices: [measure.voices?.[voiceIndex] || [], [], [], []] }));
      part.staves = [staff]; part.staff_groups = [];
      score.parts = [part]; score.part_groups = []; score.spanners = []; score.views = [];
      score.object_style_overrides = [];
    }
    engine.replace_score(JSON.stringify(score));
    refreshScore();
    renderPresets();
    $('arrange-button').disabled = value === 'full';
    const measures = score.parts[0]?.staves[0]?.measures?.length || 0;
    $('chord-input').value = Array(measures).fill('C').join(' | ');
    setStatus(value === 'full' ? IMPORT_COPY[language].restored : IMPORT_COPY[language].chosen);
  } catch (error) { setStatus(`Could not select melody: ${error}`, true); }
}

async function loadFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    if (file.size > 2_000_000) throw new Error('Choose a score under 2 MB.');
    const content = await file.text();
    const parsed = /\.abc$/i.test(file.name) ? acorde.parse_abc(content) : acorde.parse_musicxml(content);
    engine.replace_score(parsed);
    importedScoreJson = engine.get_score();
    refreshScore();
    const score = JSON.parse(sourceScoreJson);
    populateMelodyPicker(score);
    $('voice-select').value = 'unchanged';
    $('sample-select').value = ARRANGEMENT_SAMPLES[0].id;
    renderPresets();
    const measures = score.parts?.[0]?.staves?.[0]?.measures?.length || 0;
    $('chord-input').value = Array(measures).fill('C').join(' | ');
    $('abc-input').value = /\.abc$/i.test(file.name) ? content : '';
    $('arrangement-summary').textContent = '';
    setStatus(IMPORT_COPY[language].loaded.replace('{file}', file.name));
  } catch (error) { setStatus(`Could not open score: ${error}`, true); }
  finally { event.target.value = ''; }
}

async function boot() {
  try {
    await init();
    engine = new acorde.ScoreEngine();
    const sample = new URLSearchParams(location.search).get('sample');
    if (ARRANGEMENT_SAMPLES.some((item) => item.id === sample)) $('sample-select').value = sample;
    loadSample();
    $('load-abc-button').disabled = false;
    $('engine-status').textContent = 'acorde engine ready';
    setStatus(COPY[language].ready);
  } catch (error) {
    $('engine-status').textContent = 'acorde engine unavailable';
    setStatus(`The bundled acorde-wasm module could not start: ${error}`, true);
  }
}

$('add-note-button').addEventListener('click', () => addNote(false));
$('add-rest-button').addEventListener('click', () => addNote(true));
$('add-measure-button').addEventListener('click', addMeasure);
$('apply-tempo-button').addEventListener('click', setTempo);
$('reset-score-button').addEventListener('click', resetScore);
$('load-abc-button').addEventListener('click', loadAbc);
$('download-button').addEventListener('click', downloadMusicxml);
$('sample-select').addEventListener('change', loadSample);
$('arrange-button').addEventListener('click', arrangeScore);
$('restore-button').addEventListener('click', restoreOriginal);
$('play-source-button').addEventListener('click', () => playScore('source'));
$('compare-button').addEventListener('click', compareScore);
document.querySelectorAll('.showcase-card').forEach((card) => card.addEventListener('click', async () => {
  $('sample-select').value = card.dataset.showcase;
  loadSample();
  if (card.dataset.showcase === 'harmony') $('voice-select').value = 'third-below';
  arrangeScore();
  if (candidateScoreJson) await compareScore();
}));
$('play-arranged-button').addEventListener('click', () => playScore('arranged'));
$('play-accompaniment-button').addEventListener('click', () => playScore('accompaniment'));
$('stop-button').addEventListener('click', stopPlayback);
$('score-file').addEventListener('change', loadFile);
$('melody-select').addEventListener('change', selectMelody);
window.addEventListener('pagehide', () => { stopPlayback(); audioBackend?.dispose(); });
$('undo-button').addEventListener('click', () => { engine.undo(); refreshScore(); setStatus('Undid the last edit.'); });
$('redo-button').addEventListener('click', () => { engine.redo(); refreshScore(); setStatus('Redid the last edit.'); });
$('language-select').addEventListener('change', (event) => { language = COPY[event.target.value] ? event.target.value : 'en'; localStorage.setItem(LANGUAGE_KEY, language); applyLanguage(language); });
$('abc-input').value = SAMPLE_ABC;
boot();
