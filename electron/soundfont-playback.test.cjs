const test = require('node:test');
const assert = require('node:assert/strict');
const { attachResolvedSample, normalizeResolvedZone, selectResolvedZone } = require('./soundfont-playback.cjs');

const wide = { bank: 0, program: 0, sample_id: 2, key_min: 0, key_max: 127, velocity_min: 1, velocity_max: 127, sample_rate: 44100, start_frame: 0, end_frame: 100 };
const narrow = { ...wide, sample_id: 1, key_min: 60, key_max: 60, velocity_min: 80, velocity_max: 127, loop: { start: 10, end: 80 }, envelope: { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.2 } };

test('resolved zone normalization keeps playback parameters bounded', () => {
  const zone = normalizeResolvedZone(narrow);
  assert.equal(zone.valid, true);
  assert.equal(zone.sampleId, 1);
  assert.deepEqual(zone.loop, { start: 10, end: 80 });
  assert.equal(zone.envelope.sustain, 0.7);
});

test('zone selection prefers the narrowest key and velocity match deterministically', () => {
  assert.equal(selectResolvedZone([wide, narrow], { bank: 0, program: 0, pitchMidi: 60, velocity: 100 }).sampleId, 1);
  assert.equal(selectResolvedZone([wide, narrow], { bank: 0, program: 0, pitchMidi: 61, velocity: 100 }).sampleId, 2);
  assert.equal(selectResolvedZone([wide, narrow], { bank: 1, program: 0, pitchMidi: 60, velocity: 100 }), null);
});

test('sample attachment is lossless and reports missing materialization', () => {
  const events = [{ pitch_midi: 60, velocity: 100, time_secs: 0, duration_secs: 1 }, { is_metronome: true }];
  const attached = attachResolvedSample(events, [narrow], { 1: { cacheKey: 'sf2:1', channels: 1, sampleRate: 44100, pcm: [0, 1] } });
  assert.equal(attached.events[0].decoded_sample.cacheKey, 'sf2:1');
  assert.deepEqual(attached.diagnostics, []);
  const missing = attachResolvedSample(events, [narrow], {});
  assert.deepEqual(missing.diagnostics, ['sample-missing:1']);
  assert.equal(missing.events[0].decoded_sample, undefined);
});
