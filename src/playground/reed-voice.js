// A tiny, self-generated loop. No third-party sample or SoundFont is bundled.
const SAMPLE_RATE = 22_050;
const ROOT_MIDI = 43;
const ROOT_FREQUENCY = 440 * 2 ** ((ROOT_MIDI - 69) / 12);
const FRAMES = Math.round(SAMPLE_RATE / ROOT_FREQUENCY);

function createLoop() {
  const pcm = new Float32Array(FRAMES);
  for (let frame = 0; frame < FRAMES; frame++) {
    const phase = 2 * Math.PI * frame / FRAMES;
    pcm[frame] = 0.56 * Math.sin(phase)
      + 0.24 * Math.sin(2 * phase)
      + 0.13 * Math.sin(3 * phase)
      + 0.07 * Math.sin(4 * phase);
  }
  return { pcm, channels: 1, sampleRate: SAMPLE_RATE, rootMidi: ROOT_MIDI,
    loopStart: 0, loopEnd: FRAMES, cacheKey: 'acorde-playground-reed-v1' };
}

const reedLoop = createLoop();

export function withReedVoice(events) {
  return events.map((event) => ({
    ...event,
    decoded_sample: reedLoop,
    sample_envelope: { attack: 0.025, sustain: 0.78, release: 0.1 },
    sample_gain: 0.7,
  }));
}
