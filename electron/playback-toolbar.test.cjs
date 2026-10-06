const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const toolbar = require('../src/playback-toolbar.js');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8');
const style = fs.readFileSync(path.join(root, 'src', 'style.css'), 'utf8');

test('controls follow the MuseScore Studio playback toolbar order', () => {
  assert.deepEqual(toolbar.CONTROLS.map((control) => control.id), ['rewind-button', 'play-button', 'loop-button', 'metronome-button', 'playback-settings-button']);
  assert.match(app, /playback\.append\(rewind, play, loop, metronome, settings, counters, \.\.\.\(speed \? \[speed\] : \[\]\)\)/, 'counters and speed follow the buttons');
  assert.match(index, /<script src="\.\/playback-toolbar\.js"><\/script>[\s\S]*<script src="\.\/app\.js"><\/script>/);
});

test('time counter uses H:MM:SS.t and never goes negative', () => {
  assert.equal(toolbar.formatTime(0), '0:00:00.0');
  assert.equal(toolbar.formatTime(6.84), '0:00:06.8');
  assert.equal(toolbar.formatTime(59.99), '0:00:59.9');
  assert.equal(toolbar.formatTime(3725.06), '1:02:05.0');
  assert.equal(toolbar.formatTime(-4), '0:00:00.0');
  assert.equal(toolbar.formatTime(Number.NaN), '0:00:00.0');
});

test('measure.beat counter converts Acorde zero-based measures and fractional beats', () => {
  assert.equal(toolbar.formatMeasureBeat({ measure_index: 0, beat: 1 }), '1.1');
  assert.equal(toolbar.formatMeasureBeat({ measure_index: 2, beat: 4.7 }), '3.4');
  assert.equal(toolbar.formatMeasureBeat({ measure_index: 9, beat: 0.2 }), '10.1');
  assert.equal(toolbar.formatMeasureBeat(null), '1.1');
  assert.equal(toolbar.formatMeasureBeat({ measure_index: -1, beat: 2 }), '1.1');
});

test('speed labels and every control label are localized', () => {
  assert.equal(toolbar.tempoLabel(96), '♩ = 96');
  assert.equal(toolbar.tempoLabel('120'), '♩ = 120');
  assert.equal(toolbar.tempoLabel(0), '♩ = score');
  const keys = [...toolbar.CONTROLS.map((control) => control.label), 'Stop', 'Playback position', 'Elapsed time', 'Measure and beat', 'Playback speed', 'Score tempo', 'Playback range', 'Play selected measures', 'Seek', 'Select a measure range first'];
  for (const language of ['ja', 'zh']) for (const key of keys) assert.ok(toolbar.TRANSLATIONS[language][key], `${language} missing ${key}`);
  assert.equal(toolbar.label('Metronome', 'ja'), 'メトロノーム');
  assert.equal(toolbar.label('Unknown', 'ja'), 'Unknown');
});

test('icons are inline SVG without external references', () => {
  for (const name of ['rewind', 'play', 'stop', 'loop', 'metronome', 'settings']) {
    const svg = toolbar.icon(name);
    assert.match(svg, /^<svg class="pb-icon" viewBox="0 0 20 20"[^>]*aria-hidden="true"/);
    assert.doesNotMatch(svg, /href|url\(|<script|on[a-z]+=/i);
  }
  assert.equal(toolbar.icon('missing'), '');
});

test('renderer wires counters, metronome, rewind, and settings to existing playback state', () => {
  assert.match(app, /setPlaybackMeasureBeat\(position\)/, 'measure.beat follows Acorde playback_position');
  assert.match(app, /setPlaybackTime\(elapsed \+ playbackOffset\)/, 'time counter includes the seek offset');
  assert.match(app, /mixerState\.metronome = \$\('metronome-toggle'\)\.checked; syncMetronomeButton\(\);/, 'Mixer and toolbar metronome stay in sync');
  assert.match(app, /async function rewindPlayback\(\) \{ if \(playbackIsRunning\(\)\) await restartPlaybackAt\(0\); else resetPlaybackCounters\(\); \}/);
  assert.match(app, /if \(playbackIsRunning\(\)\) await restartPlaybackAt\(currentPlaybackElapsed\(\)\);/, 'metronome changes apply while playing');
  assert.match(app, /settings\.setAttribute\('aria-haspopup', 'dialog'\)/);
  assert.match(app, /\['transport-track', 'timecode'\]\.forEach\(\(id\) => \{ const element = \$\(id\); if \(element\) seekRow\.append\(element\); \}\)/, 'seek moves into Playback settings');
  assert.match(style, /\.topbar \.musescore-playback #bpm-select\.playback-speed \{ display:inline-block !important;/, 'speed stays visible at narrow widths');
});
