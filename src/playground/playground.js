import init, * as acorde from './acorde-wasm/acorde_wasm.js';

const SAMPLE_ABC = `X:1\nT:Playground sketch\nM:4/4\nL:1/4\nK:C\nC D E F | G A B c |`;
const $ = (id) => document.getElementById(id);
let engine = null;
let scoreJson = '';

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
  $('download-button').disabled = false;
  $('add-note-button').disabled = false;
  $('add-rest-button').disabled = false;
  refreshHistoryButtons();
}

function addNote(isRest) {
  try {
    engine.apply(JSON.stringify({
      type: 'add_note', part_index: 0, staff_index: 0, measure_index: 0, voice: 0,
      position: 0, pitch: { step: 'C', octave: 4, alter: 0 }, duration: 'quarter', dot_count: 0, is_rest: isRest,
    }));
    refreshScore();
    setStatus(isRest ? 'Added a quarter rest.' : 'Added a C4 quarter note.');
  } catch (error) { setStatus(`Could not edit the score: ${error}`, true); }
}

async function loadAbc() {
  try {
    const source = $('abc-input').value.trim();
    if (!source) throw new Error('Enter ABC notation first.');
    engine.replace_score(acorde.parse_abc(source));
    refreshScore();
    setStatus('ABC parsed by acorde and loaded into the editor.');
  } catch (error) { setStatus(`Could not parse ABC: ${error}`, true); }
}

async function downloadMusicxml() {
  try {
    const xml = acorde.serialize_musicxml(scoreJson);
    const url = URL.createObjectURL(new Blob([xml], { type: 'application/vnd.recordare.musicxml+xml' }));
    const link = document.createElement('a'); link.href = url; link.download = 'acorde-playground.musicxml'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0); setStatus('MusicXML exported locally.');
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
    setStatus('Ready. Try an edit or load your own ABC notation.');
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
$('abc-input').value = SAMPLE_ABC;
boot();
