import init, * as acorde from './acorde-wasm/acorde_wasm.js';

const SAMPLE_ABC = `X:1\nT:Playground sketch\nM:4/4\nL:1/4\nK:C\nC D E F | G A B c |`;
const $ = (id) => document.getElementById(id);
let engine = null;
let scoreJson = '';
const LANGUAGE_KEY = 'acorde-composer.language.v1';
const COPY = {
  en: { label: 'Language', hero: 'Edit a score in your browser', description: 'Try the same Acorde score engine used by Composer. Import ABC, make a small edit, undo it, and export MusicXML locally.', live: 'LIVE SCORE', undo: 'Undo', redo: 'Redo', download: 'Download MusicXML', quick: 'Quick edit', quickDescription: "These edits are applied through Acorde's ScoreEngine.", addNote: '＋ Add C4 quarter note', addRest: '＋ Add quarter rest', import: 'Import ABC', abc: 'ABC notation', load: 'Load ABC into Acorde', local: 'Local-first demo', localDescription: 'No score data is uploaded. The browser calls the bundled acorde-wasm module directly.', ready: 'Ready. Try an edit or load your own ABC notation.', addedNote: 'Added a C4 quarter note.', addedRest: 'Added a quarter rest.', loaded: 'ABC parsed by acorde and loaded into the editor.', exported: 'MusicXML exported locally.', selected: 'Selected {address}. Use Quick edit to change the score.' },
  ja: { label: '言語', hero: 'ブラウザで楽譜を編集', description: 'Composerと同じAcorde楽譜エンジンを試せます。ABCを読み込み、編集、取り消し、MusicXML出力までローカルで行います。', live: 'ライブ譜面', undo: '元に戻す', redo: 'やり直す', download: 'MusicXMLをダウンロード', quick: 'クイック編集', quickDescription: '編集はAcordeのScoreEngineを通じて適用されます。', addNote: '＋ C4の4分音符を追加', addRest: '＋ 4分休符を追加', import: 'ABCを読み込む', abc: 'ABC記譜', load: 'AcordeにABCを読み込む', local: 'ローカル完結デモ', localDescription: '譜面データは送信されません。ブラウザから同梱のacorde-wasmを直接呼び出します。', ready: '準備完了。編集するか、ABC記譜を読み込んでください。', addedNote: 'C4の4分音符を追加しました。', addedRest: '4分休符を追加しました。', loaded: 'AcordeでABCを解析してエディタに読み込みました。', exported: 'MusicXMLをローカルに書き出しました。', selected: '{address}を選択しました。クイック編集を使えます。' },
  zh: { label: '语言', hero: '在浏览器中编辑乐谱', description: '体验与Composer相同的Acorde乐谱引擎。导入ABC、编辑、撤销并在本地导出MusicXML。', live: '实时乐谱', undo: '撤销', redo: '重做', download: '下载MusicXML', quick: '快速编辑', quickDescription: '编辑通过Acorde的ScoreEngine应用。', addNote: '＋ 添加C4四分音符', addRest: '＋ 添加四分休止符', import: '导入ABC', abc: 'ABC记谱', load: '将ABC加载到Acorde', local: '本地优先演示', localDescription: '乐谱数据不会上传。浏览器直接调用内置的acorde-wasm模块。', ready: '准备就绪。请尝试编辑或加载ABC记谱。', addedNote: '已添加C4四分音符。', addedRest: '已添加四分休止符。', loaded: '已由Acorde解析ABC并加载到编辑器。', exported: 'MusicXML已在本地导出。', selected: '已选择{address}。请使用快速编辑。' },
};
let language = 'en';
try { language = COPY[localStorage.getItem(LANGUAGE_KEY)] ? localStorage.getItem(LANGUAGE_KEY) : 'en'; } catch { language = 'en'; }
function applyLanguage(next = language) {
  language = COPY[next] ? next : 'en'; const copy = COPY[language]; document.documentElement.lang = language;
  const text = (id, value) => { const element = $(id); if (element) element.textContent = value; };
  [['language-label', copy.label], ['hero-title', copy.hero], ['hero-description', copy.description], ['live-score-label', copy.live], ['undo-button', copy.undo], ['redo-button', copy.redo], ['download-button', copy.download], ['quick-edit-title', copy.quick], ['quick-edit-description', copy.quickDescription], ['add-note-button', copy.addNote], ['add-rest-button', copy.addRest], ['import-title', copy.import], ['abc-label', copy.abc], ['load-abc-button', copy.load], ['local-demo-title', copy.local], ['local-demo-description', copy.localDescription]].forEach(([id, value]) => text(id, value));
  const select = $('language-select'); if (select) select.value = language;
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
    engine.apply(JSON.stringify({
      type: 'add_note', part_index: 0, staff_index: 0, measure_index: 0, voice: 0,
      position: 0, pitch: { step: 'C', octave: 4, alter: 0 }, duration: 'Quarter', dot_count: 0, is_rest: isRest,
    }));
    refreshScore();
    setStatus(isRest ? COPY[language].addedRest : COPY[language].addedNote);
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
$('load-abc-button').addEventListener('click', loadAbc);
$('download-button').addEventListener('click', downloadMusicxml);
$('undo-button').addEventListener('click', () => { engine.undo(); refreshScore(); setStatus('Undid the last edit.'); });
$('redo-button').addEventListener('click', () => { engine.redo(); refreshScore(); setStatus('Redid the last edit.'); });
$('language-select').addEventListener('change', (event) => { language = COPY[event.target.value] ? event.target.value : 'en'; localStorage.setItem(LANGUAGE_KEY, language); applyLanguage(language); });
$('abc-input').value = SAMPLE_ABC;
boot();
