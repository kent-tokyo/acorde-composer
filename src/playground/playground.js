import init, * as acorde from './acorde-wasm/acorde_wasm.js';

const SAMPLE_ABC = `X:1\nT:Playground sketch\nM:4/4\nL:1/4\nK:C\nC D E F | G A B c |`;
const $ = (id) => document.getElementById(id);
let engine = null;
let scoreJson = '';
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
let language = 'en';
try { language = COPY[localStorage.getItem(LANGUAGE_KEY)] ? localStorage.getItem(LANGUAGE_KEY) : 'en'; } catch { language = 'en'; }
function applyLanguage(next = language) {
  language = COPY[next] ? next : 'en'; const copy = COPY[language]; document.documentElement.lang = language;
  const text = (id, value) => { const element = $(id); if (element) element.textContent = value; };
  [['language-label', copy.label], ['hero-title', copy.hero], ['hero-description', copy.description], ['live-score-label', copy.live], ['undo-label', copy.undo], ['redo-label', copy.redo], ['download-button', copy.download], ['import-title', copy.import], ['abc-label', copy.abc], ['load-abc-button', copy.load], ['local-demo-title', copy.local], ['local-demo-description', copy.localDescription]].forEach(([id, value]) => text(id, value));
  const select = $('language-select'); if (select) select.value = language;
  const editor = EDITOR_COPY[language];
  [['pitch-label', editor.pitch], ['duration-label', editor.duration], ['add-note-label', editor.addNote], ['add-rest-label', editor.addRest], ['add-measure-label', editor.addMeasure], ['tempo-label', editor.tempo], ['apply-tempo-label', editor.applyTempo], ['reset-score-label', editor.reset]].forEach(([id, value]) => text(id, value));
  [['Eighth', editor.eighth], ['Quarter', editor.quarter], ['Half', editor.half], ['Whole', editor.whole]].forEach(([value, label]) => { const option = $('duration-select')?.querySelector(`option[value="${value}"]`); if (option) option.textContent = label; });
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
  const score = JSON.parse(scoreJson);
  $('score-title').textContent = score.metadata?.title || 'Untitled score';
  $('score-view').innerHTML = acorde.render_score_svg(scoreJson, JSON.stringify({ width: 900, interactive: true }));
  const svg = $('score-view').querySelector('svg');
  svg?.querySelectorAll('[data-acorde-kind="note"]').forEach((note) => {
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
  $('tempo-input').value = String(score.settings?.tempo_bpm || 120);
  refreshHistoryButtons();
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
    engine.replace_score(acorde.parse_abc(SAMPLE_ABC));
    refreshScore();
    setStatus(EDITOR_COPY[language].resetDone);
  } catch (error) { setStatus(`Could not edit the score: ${error}`, true); }
}

async function loadAbc() {
  try {
    const source = $('abc-input').value.trim();
    if (!source) throw new Error('Enter ABC notation first.');
    engine.replace_score(acorde.parse_abc(source));
    refreshScore();
    setStatus(COPY[language].loaded);
  } catch (error) { setStatus(`Could not parse ABC: ${error}`, true); }
}

async function downloadMusicxml() {
  try {
    const xml = acorde.serialize_musicxml(scoreJson);
    const url = URL.createObjectURL(new Blob([xml], { type: 'application/vnd.recordare.musicxml+xml' }));
    const link = document.createElement('a'); link.href = url; link.download = 'acorde-playground.musicxml'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0); setStatus(COPY[language].exported);
  } catch (error) { setStatus(`Could not export MusicXML: ${error}`, true); }
}

async function boot() {
  try {
    await init();
    engine = new acorde.ScoreEngine();
    engine.replace_score(acorde.parse_abc(SAMPLE_ABC));
    refreshScore();
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
$('undo-button').addEventListener('click', () => { engine.undo(); refreshScore(); setStatus('Undid the last edit.'); });
$('redo-button').addEventListener('click', () => { engine.redo(); refreshScore(); setStatus('Redid the last edit.'); });
$('language-select').addEventListener('change', (event) => { language = COPY[event.target.value] ? event.target.value : 'en'; localStorage.setItem(LANGUAGE_KEY, language); applyLanguage(language); });
$('abc-input').value = SAMPLE_ABC;
boot();
