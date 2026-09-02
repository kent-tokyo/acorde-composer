const crypto = require('node:crypto');

const MAX_SAMPLE_FRAMES = 10 * 1024 * 1024;
const SAMPLE_CHANNELS = new Set([1, 2]);

function normalizeDecodedSample(value) {
  const source = value && typeof value === 'object' ? value : {};
  const channels = Number.isSafeInteger(source.channels) && SAMPLE_CHANNELS.has(source.channels) ? source.channels : null;
  const sampleRate = Number.isFinite(source.sampleRate) && source.sampleRate >= 8000 && source.sampleRate <= 192000 ? Math.round(source.sampleRate) : null;
  const pcm = Array.isArray(source.pcm) || ArrayBuffer.isView(source.pcm) ? source.pcm : null;
  const frames = pcm && channels ? pcm.length / channels : 0;
  const diagnostics = [];
  if (!channels) diagnostics.push('sample-channels-invalid');
  if (!sampleRate) diagnostics.push('sample-rate-invalid');
  if (!pcm || !Number.isInteger(frames) || frames < 1 || frames > MAX_SAMPLE_FRAMES) diagnostics.push('sample-pcm-invalid-or-too-large');
  const loopStart = Number.isSafeInteger(source.loopStart) ? source.loopStart : null;
  const loopEnd = Number.isSafeInteger(source.loopEnd) ? source.loopEnd : null;
  if ((loopStart !== null || loopEnd !== null) && (!Number.isInteger(frames) || loopStart === null || loopEnd === null || loopStart < 0 || loopEnd <= loopStart || loopEnd > frames)) diagnostics.push('sample-loop-invalid');
  const rootMidi = Number.isFinite(source.rootMidi) && source.rootMidi >= 0 && source.rootMidi <= 127 ? Math.round(source.rootMidi) : null;
  if (source.rootMidi !== undefined && rootMidi === null) diagnostics.push('sample-root-midi-invalid');
  const normalized = { sampleRate, channels, frames: Number.isInteger(frames) ? frames : 0, pcm, loopStart, loopEnd, rootMidi, cacheKey: typeof source.cacheKey === 'string' && source.cacheKey.length <= 256 ? source.cacheKey : null };
  if (diagnostics.length === 0) normalized.pcmDigest = crypto.createHash('sha256').update(Buffer.from(new Float32Array(pcm).buffer)).digest('hex');
  return { sample: normalized, usable: diagnostics.length === 0, diagnostics };
}

module.exports = { MAX_SAMPLE_FRAMES, normalizeDecodedSample };
