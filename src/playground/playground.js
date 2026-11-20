import init, * as acorde from './acorde-wasm/acorde_wasm.js';
import initAnalysis, * as acordeAnalysis from './acorde-analysis-wasm/acorde_analysis_wasm.js';
import { ARRANGEMENT_SAMPLES, localizedPreset, makeSelection } from './arrangement-data.js';
import { withReedVoice } from './reed-voice.js';

const SAMPLE_ABC = `X:1\nT:Playground sketch\nM:4/4\nL:1/4\nK:C\nC D E F | G A B c |`;
const $ = (id) => document.getElementById(id);
let engine = null;
let scoreJson = '';
let sourceScoreJson = '';
let candidateScoreJson = '';
let selectedPreset = '';
let savedCandidates = [];
let adoptionCheckpoint = null;
let adoptionRedoCheckpoint = null;
let analysisScoreJson = '';
let analysisData = null;
let quartetData = [];
let verticalData = null;
let localKeysData = [];
let variantSeed = 0;
let audioBackend = null;
let playbackTimer = null;
let playbackFrame = null;
let playbackGeneration = 0;
let activePlayback = null;
let importedScoreJson = '';
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
  en: { sample: 'Melody', presets: 'Accompaniment', chords: 'Chords, one per measure', voice: 'Added melodic voice', arrange: 'Try this arrangement', restore: 'Return to original', original: 'Play original', arranged: 'Play arrangement', accompaniment: 'Accompaniment only', stop: 'Stop', loop: 'Loop', edit: 'Edit the score', own: 'Try your own score', file: 'Open MusicXML or ABC', melody: 'Melody part', hint: 'Add chords before arranging a score without harmony.', none: 'None', third: 'Third below', sixth: 'Sixth below', octave: 'Octave below', samples: ['Four-beat melody', 'Three-beat melody', 'Swing melody'], generated: 'Arrangement ready: {count} notes or chords added. Compare it with the original.', source: 'Original score restored. Your arrangement is saved below.', invalid: 'Use one chord per measure, for example C | Am | F | G.', playing: 'Playing {which}.', saved: 'Previous arrangements' },
  ja: { sample: '旋律', presets: '伴奏', chords: '各小節のコード', voice: '重ねる旋律', arrange: 'この編曲を試す', restore: '原譜に戻す', original: '原曲を再生', arranged: '編曲を再生', accompaniment: '伴奏だけ', stop: '停止', loop: '繰り返す', edit: '譜面を編集', own: '自分の譜面を試す', file: 'MusicXML または ABC を開く', melody: '旋律パート', hint: '和声のない譜面は、編曲前にコードを入力してください。', none: 'なし', third: '下に3度', sixth: '下に6度', octave: '下に8度', samples: ['4拍子の旋律', '3拍子の旋律', 'スイングの旋律'], generated: '編曲完了：音符・和音を{count}個追加しました。原曲と聴き比べてください。', source: '原譜に戻しました。編曲候補は下に保存されています。', invalid: '各小節にコードを1つ入力してください。例：C | Am | F | G', playing: '{which}を再生中。', saved: '以前の編曲候補' },
  zh: { sample: '旋律', presets: '伴奏', chords: '每小节和弦', voice: '附加旋律', arrange: '试听此编曲', restore: '返回原谱', original: '播放原曲', arranged: '播放编曲', accompaniment: '仅伴奏', stop: '停止', loop: '循环', edit: '编辑乐谱', own: '试用自己的乐谱', file: '打开 MusicXML 或 ABC', melody: '旋律声部', hint: '没有和声的乐谱请先填写和弦。', none: '无', third: '下方三度', sixth: '下方六度', octave: '下方八度', samples: ['四拍旋律', '三拍旋律', '摇摆旋律'], generated: '编曲完成：新增 {count} 个音符或和弦。请与原曲比较。', source: '已返回原谱。编曲候选保存在下方。', invalid: '请为每小节输入一个和弦，例如 C | Am | F | G。', playing: '正在播放{which}。', saved: '之前的编曲' },
};
const IMPORT_COPY = {
  en: { full: 'Full original score', part: 'Part', staff: 'staff', voice: 'voice', choose: 'Select one melody voice and review one chord per measure.', empty: 'No melodic notes were found in this score.', chosen: 'Melody selected. Review the chord progression before arranging.', restored: 'Original score restored. Select a melody to arrange.', loaded: '{file} loaded. Review the chords before arranging.' },
  ja: { full: '読み込んだ原譜全体', part: 'パート', staff: '段', voice: '声部', choose: '旋律の声部を1つ選び、各小節のコードを確認してください。', empty: '旋律の音符が見つかりませんでした。', chosen: '旋律を選びました。編曲前にコード進行を確認してください。', restored: '原譜全体に戻しました。編曲する旋律を選んでください。', loaded: '{file} を読み込みました。編曲前にコードを確認してください。' },
  zh: { full: '导入的完整原谱', part: '声部', staff: '谱表', voice: '声部', choose: '请选择一个旋律声部并检查每小节的和弦。', empty: '此乐谱中没有找到旋律音符。', chosen: '已选择旋律，请在编曲前检查和弦。', restored: '已返回完整原谱，请选择要编曲的旋律。', loaded: '已导入 {file}，请在编曲前检查和弦。' },
};
let language = 'en';
try { language = COPY[localStorage.getItem(LANGUAGE_KEY)] ? localStorage.getItem(LANGUAGE_KEY) : 'en'; } catch { language = 'en'; }
const requestedLanguage = new URLSearchParams(location.search).get('lang');
if (COPY[requestedLanguage]) language = requestedLanguage;
function applyLanguage(next = language) {
  language = COPY[next] ? next : 'en'; const copy = COPY[language]; document.documentElement.lang = language;
  const text = (id, value) => { const element = $(id); if (element) element.textContent = value; };
  [['language-label', copy.label], ['hero-title', copy.hero], ['hero-description', copy.description], ['live-score-label', copy.live], ['undo-label', copy.undo], ['redo-label', copy.redo], ['download-button', copy.download], ['import-title', copy.import], ['abc-label', copy.abc], ['load-abc-button', copy.load], ['local-demo-title', copy.local], ['local-demo-description', copy.localDescription]].forEach(([id, value]) => text(id, value));
  text('hero-title', { en: 'Hear what an arrangement changes', ja: '編曲すると、どう変わる？', zh: '听听编曲带来的变化' }[language]);
  text('hero-description', { en: 'Choose a melody, try an accompaniment, and compare it with the original.', ja: '旋律と伴奏を選び、原曲と聴き比べましょう。', zh: '选择旋律与伴奏，和原曲听一听差别。' }[language]);
  text('showcase-title', { en: 'Hear three ways to arrange a melody', ja: '3つの編曲を聴き比べる', zh: '试听三种编曲方式' }[language]);
  text('showcase-hint', { en: 'Choose an example to hear the original followed by the arrangement.', ja: '譜例を選ぶと、原曲に続けて編曲を再生します。', zh: '选择示例，先听原曲，再听编曲。' }[language]);
  text('compare-button', { en: 'Hear original, then arrangement', ja: '原曲と編曲を続けて聴く', zh: '先听原曲，再听编曲' }[language]);
  text('melody-volume-label', { en: 'Melody volume', ja: '旋律の音量', zh: '旋律音量' }[language]);
  text('accompaniment-volume-label', { en: 'Accompaniment volume', ja: '伴奏の音量', zh: '伴奏音量' }[language]);
  text('switch-hint', { en: 'Switch playback buttons to compare the same moment.', ja: '再生中に切り替えると、同じ位置から聴き比べられます。', zh: '播放时切换按钮，可从同一位置比较。' }[language]);
  const sectionCopy = {
    en: ['Arrange by section', 'Second section begins at measure', 'Second section accompaniment', 'Try section plan', 'Another variation', 'Keep first section', 'Keep second section'],
    ja: ['区間ごとに編曲', '第2区間を始める小節', '第2区間の伴奏', '区間別の編曲を試す', '別案を作る', '第1区間を固定', '第2区間を固定'],
    zh: ['按段落编曲', '第二段起始小节', '第二段伴奏', '试听分段编曲', '生成另一方案', '固定第一段', '固定第二段'],
  }[language];
  ['section-plan-summary', 'section-start-label', 'section-preset-label', 'section-arrange-button', 'section-variant-button', 'section-lock-first-label', 'section-lock-second-label'].forEach((id, index) => text(id, sectionCopy[index]));
  text('add-section-button', { en: 'Add section', ja: '区間を追加', zh: '添加段落' }[language]);
  $('section-strip').setAttribute('aria-label', { en: 'Measure sections', ja: '小節の区間', zh: '小节段落' }[language]);
  updateExtraSectionLabels();
  text('adopt-button', { en: 'Adopt arrangement', ja: 'この編曲を採用', zh: '采用此编曲' }[language]);
  text('save-project-button', { en: 'Save project', ja: 'プロジェクトを保存', zh: '保存项目' }[language]);
  text('project-file-label', { en: 'Open a saved project', ja: '保存したプロジェクトを開く', zh: '打开已保存的项目' }[language]);
  text('analysis-title', { en: 'Explore this score', ja: '譜面を分析', zh: '分析乐谱' }[language]);
  text('analysis-category-label', { en: 'Show', ja: '表示する結果', zh: '显示结果' }[language]);
  text('analyze-button', { en: 'Analyze visible score', ja: '表示中の譜面を分析', zh: '分析当前乐谱' }[language]);
  const analysisLabels = { en: ['Chords', 'Key candidates', 'Cadences', 'Voice leading', 'Simultaneous harmony', 'Arpeggiated bars', 'Inferred cadences', 'Local key candidates'], ja: ['和音', '調の候補', '終止', '声部進行', '同時に鳴る和音', '分散和音', '推定した終止', '小節ごとの調の候補'], zh: ['和弦', '调性候选', '终止式', '声部进行', '同时发声的和弦', '分解和弦', '推断的终止式', '局部调性候选'] }[language];
  [...$('analysis-category').options].forEach((option, index) => { option.textContent = analysisLabels[index]; });
  if (analysisData) renderAnalysisResults();
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
  $('undo-button').disabled = !engine?.get_undo_label() && !adoptionCheckpoint;
  $('redo-button').disabled = !engine?.get_redo_label() && !adoptionRedoCheckpoint;
}

function refreshScore({ clearCandidates = false, keepRedo = false } = {}) {
  scoreJson = engine.get_score();
  sourceScoreJson = scoreJson;
  candidateScoreJson = '';
  analysisScoreJson = ''; analysisData = null; quartetData = []; verticalData = null; localKeysData = [];
  $('analysis-results').replaceChildren();
  if (clearCandidates) { savedCandidates = []; adoptionCheckpoint = null; $('extra-sections').replaceChildren(); }
  if (!keepRedo) adoptionRedoCheckpoint = null;
  stopPlayback();
  $('restore-button').disabled = true;
  $('adopt-button').disabled = true;
  $('play-arranged-button').disabled = true;
  $('compare-button').disabled = false;
  $('play-accompaniment-button').disabled = true;
  $('arrange-button').disabled = false;
  $('play-source-button').disabled = false;
  const measureCount = JSON.parse(scoreJson).parts?.[0]?.staves?.[0]?.measures?.length || 0;
  $('section-start').max = String(measureCount);
  $('section-start').value = String(Math.max(2, Math.floor(measureCount / 2) + 1));
  renderSectionStrip();
  $('section-arrange-button').disabled = measureCount < 2;
  $('section-variant-button').disabled = measureCount < 2;
  $('add-section-button').disabled = measureCount < 3;
  renderCandidates();
  renderVisibleScore();
  $('tempo-input').value = String(JSON.parse(scoreJson).settings?.tempo_bpm || 120);
  refreshHistoryButtons();
  renderDeveloperExample();
}

function renderVisibleScore() {
  const visibleJson = candidateScoreJson || sourceScoreJson;
  if (!visibleJson) return;
  if (analysisScoreJson && analysisScoreJson !== visibleJson) {
    analysisScoreJson = ''; analysisData = null; quartetData = []; verticalData = null; localKeysData = [];
    $('analysis-results').replaceChildren();
  }
  const score = JSON.parse(visibleJson);
  $('score-title').textContent = score.metadata?.title || 'Untitled score';
  $('score-view').innerHTML = acorde.render_score_svg(visibleJson, JSON.stringify({ width: 900, interactive: true }));
  const svg = $('score-view').querySelector('svg');
  const candidate = savedCandidates.find((item) => item.scoreJson === candidateScoreJson);
  $('live-score-label').textContent = candidateScoreJson
    ? { en: 'PREVIEW', ja: '試聴中の候補', zh: '试听方案' }[language]
    : adoptionCheckpoint
      ? { en: 'ADOPTED SCORE', ja: '採用した譜面', zh: '已采用乐谱' }[language]
      : COPY[language].live;
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
  $('save-project-button').disabled = false;
  $('analyze-button').disabled = false;
  $('add-note-button').disabled = Boolean(candidateScoreJson);
  $('add-rest-button').disabled = Boolean(candidateScoreJson);
  $('add-measure-button').disabled = Boolean(candidateScoreJson);
  $('apply-tempo-button').disabled = Boolean(candidateScoreJson);
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
    refreshScore({ clearCandidates: true });
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
    setTimeout(() => URL.revokeObjectURL(url), 0); setStatus(COPY[language].exported);
  } catch (error) { setStatus(`Could not export MusicXML: ${error}`, true); }
}

function saveProject() {
  try {
    const project = {
      format: 'acorde-composer-playground-project-v1',
      engineVersion: JSON.parse(acorde.accordion_preset_capabilities()).engine_version,
      history: engine.export_history(),
      importedScoreJson,
      savedCandidates,
      adoptionCheckpoint,
      activeCandidateScoreJson: candidateScoreJson,
      settings: {
        sample: $('sample-select').value, preset: selectedPreset, chords: $('chord-input').value,
        voice: $('voice-select').value, sectionStart: $('section-start').value,
        secondPreset: $('section-preset').value, melody: $('melody-select').value,
        lockFirst: $('section-lock-first').checked, lockSecond: $('section-lock-second').checked,
        extraSections: extraSectionValues(),
      },
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(project)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'acorde-composer.acorde.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    setStatus({ en: 'Project saved with its score, candidates, and settings.', ja: '譜面・候補・設定をプロジェクトに保存しました。', zh: '已保存乐谱、方案和设置。' }[language]);
  } catch (error) { setStatus(`Could not save project: ${error}`, true); }
}

async function loadProject(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  let restored;
  try {
    if (file.size > 10_000_000) throw new Error('Choose a project under 10 MB.');
    const project = JSON.parse(await file.text());
    const version = JSON.parse(acorde.accordion_preset_capabilities()).engine_version;
    if (project.format !== 'acorde-composer-playground-project-v1' || project.engineVersion !== version) throw new Error('This project uses a different Acorde engine version.');
    if (typeof project.history !== 'string' || !Array.isArray(project.savedCandidates) || project.savedCandidates.length > 3 || !project.settings || typeof project.settings !== 'object') throw new Error('Invalid project structure.');
    restored = new acorde.ScoreEngine();
    restored.restore_history(project.history);
    for (const candidate of project.savedCandidates) {
      if (typeof candidate.scoreJson !== 'string' || typeof candidate.sourceScoreJson !== 'string' || !Array.isArray(candidate.generated)) throw new Error('Invalid arrangement candidate.');
      const check = new acorde.ScoreEngine();
      try { check.replace_score(candidate.scoreJson); check.replace_score(candidate.sourceScoreJson); }
      finally { check.free(); }
    }
    if (project.importedScoreJson) {
      if (typeof project.importedScoreJson !== 'string') throw new Error('Invalid imported score.');
      const check = new acorde.ScoreEngine();
      try { check.replace_score(project.importedScoreJson); }
      finally { check.free(); }
    }
    if (project.adoptionCheckpoint) {
      if (typeof project.adoptionCheckpoint.before !== 'string' || typeof project.adoptionCheckpoint.after !== 'string') throw new Error('Invalid adoption history.');
      const check = new acorde.ScoreEngine();
      try { check.restore_history(project.adoptionCheckpoint.before); check.restore_history(project.adoptionCheckpoint.after); }
      finally { check.free(); }
    }
    const settings = project.settings;
    if (settings.extraSections !== undefined && (!Array.isArray(settings.extraSections) || settings.extraSections.length > 62)) throw new Error('Invalid saved sections.');
    const candidates = project.savedCandidates;
    const active = candidates.find((candidate) => candidate.scoreJson === project.activeCandidateScoreJson && candidate.sourceScoreJson === restored.get_score());
    engine.free(); engine = restored; restored = null;
    importedScoreJson = typeof project.importedScoreJson === 'string' ? project.importedScoreJson : '';
    savedCandidates = candidates;
    adoptionCheckpoint = project.adoptionCheckpoint || null;
    adoptionRedoCheckpoint = null;
    if ([...$('sample-select').options].some((option) => option.value === settings.sample)) $('sample-select').value = settings.sample;
    selectedPreset = typeof settings.preset === 'string' ? settings.preset : '';
    refreshScore(); renderPresets();
    if (importedScoreJson) {
      populateMelodyPicker(JSON.parse(importedScoreJson));
      if ([...$('melody-select').options].some((option) => option.value === settings.melody)) $('melody-select').value = settings.melody;
      $('arrange-button').disabled = $('melody-select').value === 'full';
    } else resetMelodyPicker();
    $('chord-input').value = typeof settings.chords === 'string' ? settings.chords : '';
    if ([...$('voice-select').options].some((option) => option.value === settings.voice)) $('voice-select').value = settings.voice;
    if (Number.isInteger(Number(settings.sectionStart))) $('section-start').value = settings.sectionStart;
    if ([...$('section-preset').options].some((option) => option.value === settings.secondPreset)) $('section-preset').value = settings.secondPreset;
    $('section-lock-first').checked = Boolean(settings.lockFirst);
    $('section-lock-second').checked = Boolean(settings.lockSecond);
    $('extra-sections').replaceChildren();
    if (Array.isArray(settings.extraSections)) {
      settings.extraSections.forEach((section) => addExtraSection(section));
    }
    if (active) {
      candidateScoreJson = active.scoreJson;
      renderVisibleScore();
      $('adopt-button').disabled = false; $('restore-button').disabled = false;
      $('play-arranged-button').disabled = false;
      $('play-accompaniment-button').disabled = !accompanimentNotes(active).length;
    }
    setStatus({ en: 'Project opened. Continue arranging or editing.', ja: 'プロジェクトを開きました。編曲や編集を再開できます。', zh: '项目已打开，可以继续编曲或编辑。' }[language]);
  } catch (error) { restored?.free(); setStatus(`Could not open project: ${error}`, true); }
  finally { event.target.value = ''; }
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

function updateExtraSectionLabels() {
  [...$('extra-sections').children].forEach((row, index) => {
    const number = index + 3;
    row.querySelector('strong').textContent = { en: `Section ${number}`, ja: `第${number}区間`, zh: `第${number}段` }[language];
    row.querySelector('.extra-start-label').textContent = { en: 'Begins at measure', ja: '開始小節', zh: '起始小节' }[language];
    row.querySelector('.extra-preset-label').textContent = { en: 'Accompaniment', ja: '伴奏', zh: '伴奏' }[language];
    row.querySelector('.extra-voice-label').textContent = { en: 'Added voice', ja: '重ねる旋律', zh: '附加旋律' }[language];
    row.querySelector('.extra-lock-label').textContent = { en: 'Keep this section', ja: 'この区間を固定', zh: '固定此段' }[language];
    row.querySelector('.extra-remove').textContent = { en: 'Remove section', ja: '区間を削除', zh: '删除段落' }[language];
  });
}

function extraSectionValues() {
  return [...$('extra-sections').children].map((row) => ({
    start: Number(row.querySelector('.extra-start').value),
    preset: row.querySelector('.extra-preset').value,
    voice: row.querySelector('.extra-voice').value,
    locked: row.querySelector('.extra-lock').checked,
  }));
}

function addExtraSection(saved = null) {
  const count = JSON.parse(sourceScoreJson || '{}').parts?.[0]?.staves?.[0]?.measures?.length || 0;
  const existing = extraSectionValues();
  if (!saved && (existing.length >= 62 || count < 3)) return;
  const previous = existing.at(-1)?.start || Number($('section-start').value);
  const row = document.createElement('div'); row.className = 'extra-section';
  const heading = document.createElement('strong');
  const startLabel = document.createElement('label'); const startText = document.createElement('span'); startText.className = 'extra-start-label';
  const start = document.createElement('input'); start.className = 'extra-start'; start.type = 'number'; start.min = '3'; start.max = String(count); start.step = '1'; start.value = String(saved?.start || Math.min(count, previous + 1)); startLabel.append(startText, start);
  const presetLabel = document.createElement('label'); const presetText = document.createElement('span'); presetText.className = 'extra-preset-label';
  const preset = document.createElement('select'); preset.className = 'extra-preset'; preset.replaceChildren(...availablePresets().map((id) => new Option(localizedPreset(id, language), id))); preset.value = saved?.preset || preset.options[0]?.value || ''; presetLabel.append(presetText, preset);
  const voiceLabel = document.createElement('label'); const voiceText = document.createElement('span'); voiceText.className = 'extra-voice-label';
  const voice = document.createElement('select'); voice.className = 'extra-voice'; voice.replaceChildren(...[...$('voice-select').options].map((option) => new Option(option.textContent, option.value))); voice.value = saved?.voice || $('voice-select').value; voiceLabel.append(voiceText, voice);
  const lockLabel = document.createElement('label'); lockLabel.className = 'section-lock'; const lock = document.createElement('input'); lock.className = 'extra-lock'; lock.type = 'checkbox'; lock.checked = Boolean(saved?.locked); const lockText = document.createElement('span'); lockText.className = 'extra-lock-label'; lockLabel.append(lock, lockText);
  const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'extra-remove'; remove.addEventListener('click', () => { row.remove(); updateExtraSectionLabels(); renderSectionStrip(); });
  row.append(heading, startLabel, presetLabel, voiceLabel, lockLabel, remove);
  $('extra-sections').append(row); updateExtraSectionLabels(); renderSectionStrip();
}

function renderPresets() {
  const presets = availablePresets();
  if (!presets.includes(selectedPreset)) selectedPreset = presets[0];
  const second = $('section-preset');
  const previous = second.value;
  second.replaceChildren(...presets.map((id) => new Option(localizedPreset(id, language), id)));
  second.value = presets.includes(previous) ? previous : presets.find((id) => id !== selectedPreset) || selectedPreset;
  $('extra-sections').querySelectorAll('.extra-preset').forEach((select) => {
    const value = select.value;
    select.replaceChildren(...presets.map((id) => new Option(localizedPreset(id, language), id)));
    select.value = presets.includes(value) ? value : presets[0];
  });
  $('preset-options').replaceChildren(...presets.map((id) => {
    const button = document.createElement('button');
    button.type = 'button'; button.textContent = localizedPreset(id, language);
    button.dataset.preset = id; button.setAttribute('aria-pressed', String(selectedPreset === id));
    button.addEventListener('click', () => { selectedPreset = id; renderPresets(); });
    return button;
  }));
  renderDeveloperExample();
  renderSectionStrip();
}

function renderSectionStrip() {
  const strip = $('section-strip');
  const measureCount = sourceScoreJson ? JSON.parse(sourceScoreJson).parts?.[0]?.staves?.[0]?.measures?.length || 0 : 0;
  strip.replaceChildren();
  const starts = [1, Number($('section-start').value), ...extraSectionValues().map((section) => section.start)];
  const presets = [selectedPreset, $('section-preset').value, ...extraSectionValues().map((section) => section.preset)];
  if (!measureCount || starts.some((value, index) => !Number.isInteger(value) || value < 1 || value > measureCount || (index && value <= starts[index - 1]))) return;
  starts.forEach((start, index) => {
    const end = index + 1 < starts.length ? starts[index + 1] - 1 : measureCount;
    const segment = document.createElement('span');
    segment.style.flex = String(end - start + 1);
    segment.textContent = `${start}–${end} · ${localizedPreset(presets[index], language)}`;
    strip.append(segment);
  });
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
    button.textContent = `${index + 1}. ${localizedPreset(candidate.preset, language)}${candidate.secondPreset ? ` → ${localizedPreset(candidate.secondPreset, language)}` : ''}${candidate.voice === 'unchanged' ? '' : ` + ${candidate.voice}`}`;
    button.disabled = candidate.sourceScoreJson !== sourceScoreJson;
    if (button.disabled) button.title = { en: 'The score changed. Generate this arrangement again.', ja: '譜面が変わりました。編曲を作り直してください。', zh: '乐谱已更改。请重新生成编曲。' }[language];
    button.addEventListener('click', () => {
      stopPlayback(); candidateScoreJson = candidate.scoreJson; activePlayback = null;
      selectedPreset = candidate.preset; $('voice-select').value = candidate.voice;
      if (candidate.sectionStart) $('section-start').value = String(candidate.sectionStart);
      if (candidate.secondPreset) $('section-preset').value = candidate.secondPreset;
      if (candidate.extraSections) {
        $('extra-sections').replaceChildren();
        candidate.extraSections.forEach((section) => addExtraSection(section));
      }
      $('chord-input').value = candidate.chords.join(' | '); renderPresets();
      $('restore-button').disabled = false;
      $('adopt-button').disabled = false;
      $('play-arranged-button').disabled = false;
      $('play-accompaniment-button').disabled = !accompanimentNotes(candidate).length;
      renderVisibleScore();
      $('arrangement-summary').textContent = ARRANGE_COPY[language].generated.replace('{count}', String(candidate.generated.length));
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
  if (playbackFrame !== null) cancelAnimationFrame(playbackFrame);
  playbackFrame = null;
  activePlayback = null;
  $('playback-progress').value = 0;
  $('playback-time').textContent = '0:00';
  $('playback-position-label').textContent = { en: 'Ready to play', ja: '再生待ち', zh: '等待播放' }[language];
  audioBackend?.stopAll();
  $('stop-button').disabled = true;
  ['play-source-button', 'play-arranged-button', 'play-accompaniment-button'].forEach((id) => $(id).removeAttribute('aria-current'));
}

async function playScore(which, requestedOffset = 0) {
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
    const duration = Math.max(...events.map((event) => event.time_secs + event.duration_secs)) + 0.15;
    const offset = Math.min(Math.max(0, requestedOffset), Math.max(0, duration - 0.15));
    events = events.filter((event) => event.time_secs + event.duration_secs > offset).map((event) => ({
      ...event,
      time_secs: Math.max(0, event.time_secs - offset),
      duration_secs: event.duration_secs - Math.max(0, offset - event.time_secs),
    }));
    audioBackend ||= new window.AcordeAudioBackend();
    const context = await audioBackend.resume();
    if (generation !== playbackGeneration) return;
    let simplifiedAudio = false;
    const scheduleParts = (prepared, timbre) => {
      const groups = [prepared.filter((event) => event.address?.split(':')[1] === '0'), prepared.filter((event) => event.address?.split(':')[1] !== '0')];
      groups.forEach((group, index) => { if (group.length) audioBackend.schedule(group, context.currentTime + 0.05, { timbre, volume: Number($(index === 0 ? 'melody-volume' : 'accompaniment-volume').value) / 100 }, index === 0 ? 'melody' : 'accompaniment'); });
    };
    try { scheduleParts(withReedVoice(events)); }
    catch {
      audioBackend.stopAll();
      scheduleParts(events, 'triangle');
      simplifiedAudio = true;
    }
    $('stop-button').disabled = false;
    $(`play-${which === 'source' ? 'source' : which === 'arranged' ? 'arranged' : 'accompaniment'}-button`).setAttribute('aria-current', 'true');
    const startedAt = performance.now() - offset * 1000;
    activePlayback = { which, startedAt, duration };
    const label = { en: { source: 'Original', arranged: 'Arrangement', accompaniment: 'Accompaniment' }, ja: { source: '原曲', arranged: '編曲', accompaniment: '伴奏' }, zh: { source: '原曲', arranged: '编曲', accompaniment: '伴奏' } }[language][which];
    $('playback-position-label').textContent = label;
    const updatePosition = () => {
      if (generation !== playbackGeneration) return;
      const elapsed = Math.min(duration, (performance.now() - startedAt) / 1000);
      $('playback-progress').value = Math.round(100 * elapsed / duration);
      $('playback-time').textContent = `${Math.floor(elapsed / 60)}:${String(Math.floor(elapsed % 60)).padStart(2, '0')}`;
      if (elapsed < duration) playbackFrame = requestAnimationFrame(updatePosition);
    };
    playbackFrame = requestAnimationFrame(updatePosition);
    const playingCopy = ARRANGE_COPY[language].playing.replace('{which}', which === 'source' ? ARRANGE_COPY[language].original : which === 'arranged' ? ARRANGE_COPY[language].arranged : ARRANGE_COPY[language].accompaniment);
    setStatus(simplifiedAudio ? `${playingCopy} ${{ en: 'Using the simple sound.', ja: '簡易音源で再生しています。', zh: '正在使用简易音源。' }[language]}` : playingCopy);
    playbackTimer = setTimeout(() => { if (generation !== playbackGeneration) return; if ($('loop-toggle').checked) playScore(which); else stopPlayback(); }, (duration - offset) * 1000);
    return duration - offset;
  } catch (error) { stopPlayback(); setStatus(String(error), true); }
}

function switchPlayback(which) {
  const offset = activePlayback && activePlayback.which !== which ? Math.max(0, (performance.now() - activePlayback.startedAt) / 1000) : 0;
  playScore(which, offset);
}

function updatePlaybackVolume(channel) {
  audioBackend?.setChannelControls(channel, { volume: Number($(channel === 'melody' ? 'melody-volume' : 'accompaniment-volume').value) / 100 });
}

async function compareScore() {
  if (!candidateScoreJson) arrangeScore();
  if (!candidateScoreJson) return;
  const duration = await playScore('source');
  if (!duration) return;
  const generation = playbackGeneration;
  clearTimeout(playbackTimer);
  playbackTimer = setTimeout(() => { if (generation === playbackGeneration) playScore('arranged'); }, duration * 1000);
}

function arrangementChords() {
  const chords = $('chord-input').value.split('|').map((item) => item.trim());
  const measures = JSON.parse(sourceScoreJson).parts?.[0]?.staves?.[0]?.measures?.length || 0;
  if (chords.length !== measures || chords.some((chord) => !/^[A-G](?:#|b)?m?$/.test(chord))) throw new Error(ARRANGE_COPY[language].invalid);
  return chords;
}

function renderDeveloperExample() {
  const copy = {
    en: ['Use this arrangement in your app', 'Download the original score and run the same Acorde WASM arrangement with these settings.', 'Download original MusicXML', 'Enter one supported chord per measure to generate the code.'],
    ja: ['この編曲をアプリで使う', '原譜を保存し、選択中の設定を Acorde WASM で再現できます。', '原譜の MusicXML を保存', 'コードを表示するには、各小節のコードを入力してください。'],
    zh: ['在应用中使用此编曲', '下载原谱，并用当前设置在 Acorde WASM 中重现编曲。', '下载原谱 MusicXML', '请先为每小节输入支持的和弦。'],
  }[language];
  $('developer-example-title').textContent = copy[0];
  $('developer-example-description').textContent = copy[1];
  $('download-source-button').textContent = copy[2];
  $('download-source-button').disabled = !sourceScoreJson;
  $('download-source-json-button').textContent = { en: 'Download exact Acorde JSON', ja: '元譜の Acorde JSON を保存', zh: '下载原谱 Acorde JSON' }[language];
  $('download-source-json-button').disabled = !sourceScoreJson;
  if (!sourceScoreJson || !selectedPreset) { $('developer-code').textContent = ''; return; }
  const selectedCandidate = savedCandidates.find((candidate) => candidate.scoreJson === candidateScoreJson);
  if (selectedCandidate?.sectionStart && selectedCandidate.config) {
    $('developer-example-description').textContent = { en: 'Save the exact source Acorde JSON to replay this section plan. MusicXML import creates a different score identity.', ja: '区間プランの再現には元譜の Acorde JSON を保存してください。MusicXML を読み直すと譜面の識別子が変わります。', zh: '重放此分段方案须保存原谱的 Acorde JSON。重新导入 MusicXML 会改变乐谱标识。' }[language];
    $('developer-code').textContent = `import init, * as acorde from './acorde-wasm/acorde_wasm.js';\nawait init();\nconst sourceScoreJson = await (await fetch('./original.acorde.json')).text();\nconst resolvedPlan = ${JSON.stringify(selectedCandidate.config, null, 2)};\nconst result = JSON.parse(acorde.arrange_from_resolved_plan(sourceScoreJson, JSON.stringify(resolvedPlan)));\nif (!result.score) throw new Error(JSON.stringify(result.diagnostics));\nconst arrangedMusicXML = acorde.serialize_musicxml(JSON.stringify(result.score));`;
    return;
  }
  let chords;
  try { chords = arrangementChords(); }
  catch { $('developer-code').textContent = copy[3]; return; }
  const preset = JSON.parse(acorde.accordion_preset_capabilities()).presets.find((item) => item.id === selectedPreset);
  if (!preset) return;
  const voice = $('voice-select').value;
  const bassMode = preset.requires_free_bass ? 'free-bass' : 'standard-bass';
  const call = voice === 'unchanged'
    ? `acorde.arrange_accordion_preset(sourceScoreJson, JSON.stringify(selection), ${JSON.stringify(selectedPreset)})`
    : `acorde.arrange_accordion_layers(sourceScoreJson, JSON.stringify({ ...selection, accompaniment: ${JSON.stringify(preset.accompaniment)}, melodic_voice: ${JSON.stringify(voice)}, swing: ${JSON.stringify(preset.swing)} }))`;
  $('developer-code').textContent = `import init, * as acorde from './acorde-wasm/acorde_wasm.js';\nawait init();\nconst xml = await (await fetch('./original.musicxml')).text();\nconst sourceScoreJson = acorde.parse_musicxml(xml);\nconst chords = ${JSON.stringify(chords)};\nconst selection = {\n  chords: chords.map((chord, measure_index) => ({\n    measure_index, offset_beats: 0,\n    chord: { root: chord.replace(/m$/, ''), kind: chord.endsWith('m') ? 'minor' : 'major', bass: null, degrees: [] }\n  })),\n  alternative_chords: null, inversion: null, bass_mode: ${JSON.stringify(bassMode)}\n};\nconst result = JSON.parse(${call});\nif (!result.score) throw new Error(JSON.stringify(result.diagnostics));\nconst arrangedMusicXML = acorde.serialize_musicxml(JSON.stringify(result.score));`;
}

function downloadOriginalMusicxml() {
  if (!sourceScoreJson) return;
  const url = URL.createObjectURL(new Blob([acorde.serialize_musicxml(sourceScoreJson)], { type: 'application/vnd.recordare.musicxml+xml' }));
  const link = document.createElement('a');
  link.href = url; link.download = 'original.musicxml'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadOriginalJson() {
  if (!sourceScoreJson) return;
  const url = URL.createObjectURL(new Blob([sourceScoreJson], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url; link.download = 'original.acorde.json'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function arrangementFailure(diagnostics) {
  const first = diagnostics?.[0];
  if (!first) return 'This score cannot be arranged.';
  const searchMessages = {
    'no-candidate': { en: 'No arrangement meets these choices. Change a section or accompaniment.', ja: '条件に合う編曲がありません。区間か伴奏を変更してください。', zh: '没有符合条件的编曲。请更改分段或伴奏。' },
    'search-limit': { en: 'The search limit was reached. Narrow the choices or try again.', ja: '探索の上限に達しました。条件を絞るか別案を再生成してください。', zh: '已达到搜索上限。请缩小范围或再次生成。' },
  };
  if (searchMessages[first.code]) return searchMessages[first.code][language];
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
    const candidate = { scoreJson: candidateScoreJson, sourceScoreJson, generated: result.generated_notes || [], preset: selectedPreset, voice, chords: arrangementChords(), config: result.resolved_config };
    savedCandidates.unshift(candidate);
    savedCandidates = savedCandidates.slice(0, 3);
    renderVisibleScore(); renderCandidates(); renderDeveloperExample();
    $('restore-button').disabled = false;
    $('adopt-button').disabled = false;
    $('play-arranged-button').disabled = false;
    $('play-accompaniment-button').disabled = !accompanimentNotes(candidate).length;
    const message = ARRANGE_COPY[language].generated.replace('{count}', String(candidate.generated.length));
    $('arrangement-summary').textContent = `${message} ${{ en: 'Amber notes were added by Acorde.', ja: '琥珀色の音符が Acorde による追加分です。', zh: '琥珀色音符由 Acorde 添加。' }[language]}`; setStatus(message);
  } catch (error) { const message = error.message || String(error); setStatus(message, true); $('arrangement-summary').textContent = message; }
}

function planPattern(preset) {
  return preset.id === 'swing-pulse' ? 'swing-accompaniment' : preset.accompaniment;
}

function arrangeSections(shuffle = false) {
  try {
    if (!sourceScoreJson || $('arrange-button').disabled) return;
    const measureCount = JSON.parse(sourceScoreJson).parts?.[0]?.staves?.[0]?.measures?.length || 0;
    const start = Number($('section-start').value);
    if (!Number.isInteger(start) || start < 2 || start > measureCount) throw new Error('Choose a second-section start within the score.');
    const capabilities = JSON.parse(acorde.accordion_preset_capabilities());
    const first = capabilities.presets.find((entry) => entry.id === selectedPreset);
    const second = capabilities.presets.find((entry) => entry.id === $('section-preset').value);
    if (!first || !second) throw new Error('Choose an available accompaniment for each section.');
    const extras = extraSectionValues();
    const starts = [1, start, ...extras.map((section) => section.start)];
    if (starts.some((value, index) => !Number.isInteger(value) || value < 1 || value > measureCount || (index > 0 && value <= starts[index - 1]))) throw new Error('Section starts must increase and remain within the score.');
    if (shuffle && starts.length > 8) throw new Error('Variation search supports up to eight sections. Use the explicit plan for more sections.');
    const presets = [first, second, ...extras.map((section) => capabilities.presets.find((entry) => entry.id === section.preset))];
    if (presets.some((preset) => !preset)) throw new Error('Choose an available accompaniment for each section.');
    const selection = makeSelection(arrangementChords(), presets.some((preset) => preset.requires_free_bass) ? 'free-bass' : 'standard-bass');
    const voice = $('voice-select').value;
    const sections = starts.map((value, index) => ({
      start_measure: value - 1,
      end_measure: index + 1 < starts.length ? starts[index + 1] - 1 : measureCount,
      accompaniment: planPattern(presets[index]),
      melodic_voice: extras[index - 2]?.voice || voice,
    }));
    const locked = [$('section-lock-first').checked, $('section-lock-second').checked, ...extras.map((section) => section.locked)];
    const request = shuffle ? {
      chords: selection.chords, bass_mode: selection.bass_mode,
      sections: sections.map((section, index) => ({
        start_measure: section.start_measure, end_measure: section.end_measure,
        allowed_accompaniments: [...new Set([section.accompaniment, ...(locked[index] ? [] : [planPattern(presets.find((preset) => preset.id !== presets[index].id && (selection.bass_mode === 'free-bass' || !preset.requires_free_bass)) || presets[index])])])],
        allowed_melodic_voices: [section.melodic_voice],
      })),
      seed: (BigInt(Date.now()) + BigInt(++variantSeed)).toString(), max_attempts: 16,
    } : { chords: selection.chords, bass_mode: selection.bass_mode, sections };
    let result;
    for (let attempt = 0; attempt < (shuffle ? 4 : 1); attempt++) {
      if (shuffle && attempt) request.seed = (BigInt(request.seed) + 1n).toString();
      result = JSON.parse(shuffle
        ? acorde.shuffle_accordion_plan(sourceScoreJson, JSON.stringify(request))
        : acorde.arrange_accordion_plan(sourceScoreJson, JSON.stringify(request)));
      if (!result.score || !savedCandidates.some((candidate) => candidate.scoreJson === JSON.stringify(result.score))) break;
    }
    if (!result.score) throw new Error(arrangementFailure(result.diagnostics));
    const nextScore = JSON.stringify(result.score);
    if (shuffle && savedCandidates.some((candidate) => candidate.scoreJson === nextScore)) throw new Error('No different variation was found within the search limit.');
    stopPlayback();
    candidateScoreJson = nextScore;
    const candidate = {
      scoreJson: nextScore, sourceScoreJson, generated: result.generated_notes.map((note) => note.address),
      provenance: result.generated_notes, config: result.resolved_config,
      preset: selectedPreset, secondPreset: second.id, sectionStart: start, extraSections: extras,
      voice, chords: arrangementChords(),
    };
    savedCandidates = savedCandidates.filter((saved) => saved.scoreJson !== nextScore);
    savedCandidates.unshift(candidate);
    savedCandidates = savedCandidates.slice(0, 3);
    renderVisibleScore(); renderCandidates(); renderDeveloperExample();
    $('restore-button').disabled = false;
    $('adopt-button').disabled = false;
    $('play-arranged-button').disabled = false;
    $('play-accompaniment-button').disabled = !accompanimentNotes(candidate).length;
    const message = ARRANGE_COPY[language].generated.replace('{count}', String(candidate.generated.length));
    $('arrangement-summary').textContent = message;
    setStatus(message);
  } catch (error) { const message = error.message || String(error); setStatus(message, true); $('arrangement-summary').textContent = message; }
}

function restoreOriginal() {
  stopPlayback(); candidateScoreJson = ''; renderVisibleScore();
  $('restore-button').disabled = true; $('adopt-button').disabled = true; $('play-arranged-button').disabled = true; $('play-accompaniment-button').disabled = true;
  $('arrangement-summary').textContent = ARRANGE_COPY[language].source;
}

function renderAnalysisResults() {
  const list = $('analysis-results');
  list.replaceChildren();
  if (!analysisData) return;
  const category = $('analysis-category').value;
  const findings = category === 'chords' ? analysisData.chords
    : category === 'keys' ? analysisData.key_estimates
      : category === 'cadences' ? analysisData.cadence_candidates
        : category === 'voice-leading' ? quartetData
          : category === 'sonorities' ? verticalData?.sonorities?.sonorities
            : category === 'arpeggiated' ? verticalData?.arpeggiated?.sonorities
              : category === 'vertical-cadences' ? verticalData?.cadences?.cadence_candidates : localKeysData;
  const issues = category === 'sonorities' ? verticalData?.sonorities?.timeline_issues
    : category === 'arpeggiated' ? verticalData?.arpeggiated?.timeline_issues
      : category === 'vertical-cadences' ? verticalData?.cadences?.timeline_issues : [];
  for (const issue of issues || []) {
    const message = document.createElement('p'); message.className = 'analysis-issue';
    message.textContent = `${issue.kind} · ${issue.measure + 1} · part ${issue.part + 1}`;
    list.append(message);
  }
  if (!findings?.length && !issues?.length) {
    const message = document.createElement('p');
    message.textContent = { en: 'No result in this category. Check the score and voice selection.', ja: 'この項目の結果はありません。譜面と声部の選択を確認してください。', zh: '此类别暂无结果。请检查乐谱和声部选择。' }[language];
    list.append(message);
    return;
  }
  (findings || []).slice(0, 40).forEach((item, index) => {
    const finding = item.label || item;
    const button = document.createElement('button'); button.type = 'button';
    const measure = item.measure ?? finding.address?.measure ?? finding.evidence?.[0]?.measure ?? finding.from?.measure;
    const location = Number.isInteger(measure) ? `${measure + 1}. ` : '';
    const label = finding.name || finding.kind
      || (finding.key ? `${finding.key.mode} · ${finding.key.fifths} fifths` : null)
      || (finding.parallel_fifth ? 'Parallel fifth' : finding.parallel_octave ? 'Parallel octave' : finding.rule_id || 'Finding');
    button.textContent = `${index + 1}. ${location}${label}`;
    button.title = finding.rule_id || '';
    button.addEventListener('click', () => {
      $('score-view').querySelectorAll('.analysis-evidence,.analysis-measure').forEach((note) => note.classList.remove('analysis-evidence', 'analysis-measure'));
      const evidence = finding.evidence || [];
      for (const address of evidence) {
        const key = `${address.part}:${address.staff}:${address.measure}:${address.voice}:${address.note}`;
        $('score-view').querySelectorAll('[data-acorde-kind="note"]').forEach((note) => {
          if (note.dataset.noteAddr === key) note.classList.add('analysis-evidence');
        });
      }
      if (!evidence.length && Number.isInteger(measure)) $('score-view').querySelector(`[data-acorde-kind="measure"][data-measure="${measure}"]`)?.classList.add('analysis-measure');
      $('score-view').querySelector('.analysis-evidence,.analysis-measure')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      setStatus(`${button.textContent} · ${finding.rule_id || ''}`);
    });
    list.append(button);
  });
}

function analyzeVisibleScore() {
  try {
    const visible = candidateScoreJson || sourceScoreJson;
    if (!visible) return;
    analysisData = JSON.parse(acorde.analyze_score(visible));
    quartetData = JSON.parse(acorde.analyze_voice_leading_quartets(visible)).quartets;
    verticalData = JSON.parse(acordeAnalysis.analyze_vertical(visible));
    localKeysData = JSON.parse(acordeAnalysis.analyze_local_keys(visible, 2));
    analysisScoreJson = visible;
    renderAnalysisResults();
  } catch (error) { setStatus(`Could not analyze score: ${error}`, true); }
}

function adoptCandidate() {
  try {
    const candidate = savedCandidates.find((item) => item.scoreJson === candidateScoreJson);
    if (!candidate || candidate.sourceScoreJson !== engine.get_score()) throw new Error('The score changed. Generate the arrangement again.');
    const before = engine.export_history();
    engine.replace_score(candidate.scoreJson);
    adoptionCheckpoint = { before, after: engine.export_history(), sourceScoreJson: candidate.sourceScoreJson };
    refreshScore();
    setStatus({ en: 'Arrangement adopted. You can edit it or undo the adoption.', ja: '編曲を採用しました。編集するか、元に戻せます。', zh: '已采用编曲。可以编辑或撤销采用。' }[language]);
  } catch (error) { setStatus(String(error), true); }
}

function undoEdit() {
  try {
    if (engine.get_undo_label()) engine.undo();
    else if (adoptionCheckpoint) {
      const checkpoint = adoptionCheckpoint;
      engine.restore_history(checkpoint.before);
      adoptionRedoCheckpoint = checkpoint;
      adoptionCheckpoint = null;
    } else return;
    refreshScore({ keepRedo: Boolean(adoptionRedoCheckpoint) });
    setStatus({ en: 'Undid the last edit.', ja: '直前の操作を元に戻しました。', zh: '已撤销上一步操作。' }[language]);
  } catch (error) { setStatus(String(error), true); }
}

function redoEdit() {
  try {
    if (adoptionRedoCheckpoint) {
      const checkpoint = adoptionRedoCheckpoint;
      engine.restore_history(checkpoint.after);
      adoptionCheckpoint = checkpoint;
      adoptionRedoCheckpoint = null;
    } else if (engine.get_redo_label()) engine.redo();
    else return;
    refreshScore();
    setStatus({ en: 'Redid the last edit.', ja: '操作をやり直しました。', zh: '已重做上一步操作。' }[language]);
  } catch (error) { setStatus(String(error), true); }
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
    renderPresets(); refreshScore({ clearCandidates: true });
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
    refreshScore({ clearCandidates: true });
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
    refreshScore({ clearCandidates: true });
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
    await initAnalysis();
    engine = new acorde.ScoreEngine();
    const query = new URLSearchParams(location.search);
    const sample = query.get('sample');
    if (ARRANGEMENT_SAMPLES.some((item) => item.id === sample)) $('sample-select').value = sample;
    loadSample();
    const preset = query.get('preset');
    if (preset && availablePresets().includes(preset)) { selectedPreset = preset; renderPresets(); }
    const voice = query.get('voice');
    if ([...$('voice-select').options].some((option) => option.value === voice)) $('voice-select').value = voice;
    renderDeveloperExample();
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
$('download-source-button').addEventListener('click', downloadOriginalMusicxml);
$('download-source-json-button').addEventListener('click', downloadOriginalJson);
$('chord-input').addEventListener('input', renderDeveloperExample);
$('voice-select').addEventListener('change', renderDeveloperExample);
$('save-project-button').addEventListener('click', saveProject);
$('project-file').addEventListener('change', loadProject);
$('sample-select').addEventListener('change', loadSample);
$('arrange-button').addEventListener('click', arrangeScore);
$('adopt-button').addEventListener('click', adoptCandidate);
$('analyze-button').addEventListener('click', analyzeVisibleScore);
$('analysis-category').addEventListener('change', renderAnalysisResults);
$('section-arrange-button').addEventListener('click', () => arrangeSections(false));
$('section-variant-button').addEventListener('click', () => arrangeSections(true));
$('add-section-button').addEventListener('click', () => addExtraSection());
$('section-start').addEventListener('input', renderSectionStrip);
$('section-preset').addEventListener('change', renderSectionStrip);
$('extra-sections').addEventListener('input', renderSectionStrip);
$('extra-sections').addEventListener('change', renderSectionStrip);
$('restore-button').addEventListener('click', restoreOriginal);
$('play-source-button').addEventListener('click', () => switchPlayback('source'));
$('compare-button').addEventListener('click', compareScore);
document.querySelectorAll('.showcase-card').forEach((card) => card.addEventListener('click', async () => {
  $('sample-select').value = card.dataset.showcase;
  loadSample();
  if (card.dataset.showcase === 'harmony') $('voice-select').value = 'third-below';
  arrangeScore();
  if (candidateScoreJson) await compareScore();
}));
$('play-arranged-button').addEventListener('click', () => switchPlayback('arranged'));
$('play-accompaniment-button').addEventListener('click', () => switchPlayback('accompaniment'));
$('melody-volume').addEventListener('input', () => updatePlaybackVolume('melody'));
$('accompaniment-volume').addEventListener('input', () => updatePlaybackVolume('accompaniment'));
$('stop-button').addEventListener('click', stopPlayback);
$('score-file').addEventListener('change', loadFile);
$('melody-select').addEventListener('change', selectMelody);
window.addEventListener('pagehide', () => { stopPlayback(); audioBackend?.dispose(); });
$('undo-button').addEventListener('click', undoEdit);
$('redo-button').addEventListener('click', redoEdit);
$('language-select').addEventListener('change', (event) => { language = COPY[event.target.value] ? event.target.value : 'en'; localStorage.setItem(LANGUAGE_KEY, language); applyLanguage(language); });
$('abc-input').value = SAMPLE_ABC;
boot();
