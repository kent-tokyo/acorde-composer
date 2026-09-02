const test = require('node:test');
const assert = require('node:assert/strict');
const { MAX_SAMPLE_FRAMES, normalizeDecodedSample } = require('./sample-contract.cjs');

test('decoded sample contract normalizes PCM, loop, root note, and digest', () => {
  const result = normalizeDecodedSample({ sampleRate: 44100, channels: 2, pcm: new Float32Array([0, 0.1, 0.2, 0.3]), loopStart: 1, loopEnd: 2, rootMidi: 60, cacheKey: 'piano-c4' });
  assert.equal(result.usable, true);
  assert.deepEqual({ sampleRate: result.sample.sampleRate, channels: result.sample.channels, frames: result.sample.frames, loopStart: result.sample.loopStart, loopEnd: result.sample.loopEnd, rootMidi: result.sample.rootMidi, cacheKey: result.sample.cacheKey }, { sampleRate: 44100, channels: 2, frames: 2, loopStart: 1, loopEnd: 2, rootMidi: 60, cacheKey: 'piano-c4' });
  assert.equal(result.sample.pcmDigest.length, 64);
});

test('decoded sample contract rejects unsafe format, loop, root note, and size', () => {
  assert.ok(normalizeDecodedSample({ sampleRate: 44100, channels: 3, pcm: [0] }).diagnostics.includes('sample-channels-invalid'));
  assert.ok(normalizeDecodedSample({ sampleRate: 44100, channels: 1, pcm: [0, 1], loopStart: 2, loopEnd: 1, rootMidi: 200 }).diagnostics.includes('sample-loop-invalid'));
  assert.ok(normalizeDecodedSample({ sampleRate: 44100, channels: 1, pcm: new Float32Array(MAX_SAMPLE_FRAMES + 1) }).diagnostics.includes('sample-pcm-invalid-or-too-large'));
});
