const test = require('node:test');
const assert = require('node:assert/strict');
const { attachResolvedLayers, attachResolvedSample, attachResolvedSnapshot, normalizeResolvedZone, selectResolvedZone, selectResolvedZones } = require('./soundfont-playback.cjs');

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

test('layered preset attachment retains every matching Acorde-resolved zone', () => {
  const layers = selectResolvedZones([wide, narrow], { bank: 0, program: 0, pitchMidi: 60, velocity: 100 });
  assert.deepEqual(layers.map((zone) => zone.sampleId), [1, 2]);
  const attached = attachResolvedLayers([{ pitch_midi: 60, velocity: 100 }], [wide, narrow], {
    1: { cacheKey: 'sf2:1', channels: 1, sampleRate: 44100, pcm: [0, 1] },
    2: { cacheKey: 'sf2:2', channels: 1, sampleRate: 44100, pcm: [0, 1] },
  });
  assert.deepEqual(attached.events.map((event) => event.decoded_sample.cacheKey), ['sf2:1', 'sf2:2']);
  assert.deepEqual(attached.events.map((event) => event.soundfont_layer), [0, 1]);
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

test('materialized Acorde snapshot resolves its preset without reparsing SoundFont data', () => {
  const events = [{ pitch_midi: 60, velocity: 100, time_secs: 0, duration_secs: 1 }];
  const snapshot = { preset: { bank: 2, program: 10 }, zones: [{ ...narrow, bank: 2, program: 10 }] };
  const attached = attachResolvedSnapshot(events, snapshot, { 1: { cacheKey: 'sf2:1', channels: 1, sampleRate: 44100, pcm: [0, 1] } });
  assert.equal(attached.events[0].resolved_zone.bank, 2);
  assert.equal(attached.events[0].decoded_sample.cacheKey, 'sf2:1');
  assert.deepEqual(attachResolvedSnapshot(events, null, {}).diagnostics, ['snapshot-missing']);
});

test('zone adapter accepts Acorde resolved metadata field names without losing zero envelope values', () => {
  const zone = normalizeResolvedZone({ bank: 2, program: 10, sample_id: 1, key_min: 60, key_max: 60, velocity_min: 1, velocity_max: 127, sample_rate: 44100, start_frame: 0, end_frame: 100, root_key: 60, fine_tune_cents: -12, loop_points: { start_frame: 10, end_frame: 80 }, attack_secs: 0, decay_secs: 0, sustain_level: 0, release_secs: 0 });
  assert.equal(zone.valid, true);
  assert.equal(zone.tuningCents, -12);
  assert.deepEqual(zone.loop, { start: 10, end: 80 });
  assert.deepEqual(zone.envelope, { attack: 0, decay: 0, sustain: 0, release: 0 });
});

test('materialized zone playback metadata overrides sample defaults without mutating the cache entry', () => {
  const sample = { cacheKey: 'sf2:2', channels: 1, sampleRate: 44100, rootMidi: 60, loopStart: 4, loopEnd: 8, pcm: [0, 1] };
  const zone = { bank: 1, program: 4, sample_id: 2, key_min: 60, key_max: 60, velocity_min: 1, velocity_max: 127, sample_rate: 44100, start_frame: 0, end_frame: 2, root_key: 64, loop_points: { start: 0, end: 2 }, attack_secs: 0.1, decay_secs: 0.2, sustain_level: 0.5, release_secs: 0.3, fine_tune_cents: 12, gain: 0.75 };
  const attached = attachResolvedSample([{ pitch_midi: 60, velocity: 100 }], [zone], { 2: sample }, { bank: 1, program: 4 });
  assert.equal(attached.events[0].decoded_sample.rootMidi, 64);
  assert.deepEqual({ start: attached.events[0].decoded_sample.loopStart, end: attached.events[0].decoded_sample.loopEnd }, { start: 0, end: 2 });
  assert.deepEqual(attached.events[0].sample_envelope, { attack: 0.1, decay: 0.2, sustain: 0.5, release: 0.3 });
  assert.equal(attached.events[0].sample_tuning_cents, 12);
  assert.equal(sample.rootMidi, 60);
  assert.equal(sample.loopStart, 4);
});

test('sample attachment reports malformed provider zones while preserving playable zones', () => {
  const events = [{ pitch_midi: 60, velocity: 100, time_secs: 0, duration_secs: 1 }];
  const malformed = { ...narrow, end_frame: 0 };
  const attached = attachResolvedSample(events, [malformed, narrow], { 1: { cacheKey: 'sf2:1', channels: 1, sampleRate: 44100, pcm: [0, 1] } });
  assert.equal(attached.events[0].decoded_sample.cacheKey, 'sf2:1');
  assert.deepEqual(attached.diagnostics, ['invalid-resolved-zone']);
});

test('sample attachment reports bounded zone-list truncation', () => {
  const zones = Array.from({ length: 4097 }, (_, index) => ({ ...wide, sample_id: index + 1 }));
  const attached = attachResolvedSample([], zones, {});
  assert.deepEqual(attached.diagnostics, ['zone-list-truncated']);
});

test('materialized snapshot preserves provider diagnostics alongside attachment diagnostics', () => {
  const events = [{ pitch_midi: 60, velocity: 100, time_secs: 0, duration_secs: 1 }];
  const snapshot = { preset: { bank: 0, program: 0 }, zones: [narrow], diagnostics: ['unsupported-generator:releaseVolEnv', { MissingSample: { sample_id: 9 } }] };
  const attached = attachResolvedSnapshot(events, snapshot, {});
  assert.deepEqual(attached.diagnostics, ['unsupported-generator:releaseVolEnv', 'provider-zone-diagnostic', 'sample-missing:1']);
});

test('materialized snapshot does not guess bank zero for missing preset identity', () => {
  const events = [{ pitch_midi: 60, velocity: 100, time_secs: 0, duration_secs: 1 }];
  const snapshot = { zones: [narrow] };
  assert.deepEqual(attachResolvedSnapshot(events, snapshot, {}).diagnostics, ['snapshot-preset-missing']);
  const explicit = attachResolvedSnapshot(events, snapshot, { 1: { cacheKey: 'sf2:1', channels: 1, sampleRate: 44100, pcm: [0, 1] } }, { bank: 0, program: 0 });
  assert.equal(explicit.events[0].decoded_sample.cacheKey, 'sf2:1');
});
