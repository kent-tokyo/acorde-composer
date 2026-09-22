const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const readline = require('node:readline');

const root = path.resolve(__dirname, '..');
const fixturePath = path.join(root, 'qa/fixtures/multivoice-ui.musicxml');

function startEngine() {
  const child = spawn('cargo', ['run', '--quiet', '--manifest-path', path.join(root, 'engine/Cargo.toml')], { cwd: root, stdio: ['pipe', 'pipe', 'pipe'] });
  const pending = [];
  const rejectPending = (error) => { while (pending.length) pending.shift().reject(error); };
  readline.createInterface({ input: child.stdout }).on('line', (line) => {
    const pendingRequest = pending.shift(); if (!pendingRequest) return;
    try { const response = JSON.parse(line); response.ok ? pendingRequest.resolve(response.result) : pendingRequest.reject(new Error(response.error || 'engine request failed')); } catch (error) { pendingRequest.reject(error); }
  });
  child.on('error', rejectPending);
  child.on('exit', () => rejectPending(new Error('multi-voice workflow engine exited')));
  return {
    call: (request) => new Promise((resolve, reject) => { pending.push({ resolve, reject }); child.stdin.write(`${JSON.stringify(request)}\n`); }),
    close: () => { child.stdin.end(); },
  };
}

test('multi-voice editor workflow preserves voice identity through edit, undo/redo, save, reload, SVG, and playback', async () => {
  const engine = startEngine();
  try {
    const original = await engine.call({ op: 'parse_musicxml_report', xml: fs.readFileSync(fixturePath, 'utf8') });
    await engine.call({ op: 'load_score', score: original.score });
    const initialSvg = await engine.call({ op: 'render_current', width: 900, interactive: true });
    assert.match(initialSvg, /data-acorde-kind="note"/);
    assert.match(initialSvg, /data-voice="1"/);

    const voiceTwoNote = { type: 'add_note', part_index: 0, staff_index: 0, measure_index: 0, voice: 1, position: 1, pitch: { step: 'D', octave: 3, alter: 0 }, duration: 'Quarter', dot_count: 0, is_rest: false, tuplet: null };
    const afterEdit = await engine.call({ op: 'apply_command', command: voiceTwoNote, label: 'AddNote' });
    assert.equal(afterEdit.parts[0].staves[0].measures[0].voices[1].length, 3);
    await engine.call({ op: 'undo' });
    const afterRedo = await engine.call({ op: 'redo' });
    assert.equal(afterRedo.parts[0].staves[0].measures[0].voices[1].length, 3);

    const savedXml = await engine.call({ op: 'serialize_current' });
    assert.match(savedXml, /<backup>/);
    assert.match(savedXml, /<voice>1<\/voice>/);
    assert.match(savedXml, /<voice>2<\/voice>/);
    const reopened = await engine.call({ op: 'parse_musicxml_report', xml: savedXml });
    const reopenedMeasure = reopened.score.parts[0].staves[0].measures[0];
    assert.deepEqual(reopenedMeasure.source_voice_numbers.slice(0, 2), [1, 2]);
    assert.equal(reopenedMeasure.voices[1].length, 3);

    await engine.call({ op: 'load_score', score: reopened.score });
    const reopenedSvg = await engine.call({ op: 'render_current', width: 900, interactive: true });
    assert.match(reopenedSvg, /data-voice="1"/);
    assert.match(reopenedSvg, /data-note-addr="0:0:0:1:/);
    const events = await engine.call({ op: 'playback_events', score: reopened.score, bpm: 120 });
    const secondaryVoiceEvents = events.filter((event) => event.source_voice_number === 2);
    assert.equal(secondaryVoiceEvents.length, 2);
    assert.ok(secondaryVoiceEvents.every((event) => /^0:0:0:1:\d+$/.test(event.address)));
  } finally { engine.close(); }
});
