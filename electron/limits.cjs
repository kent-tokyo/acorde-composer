const MAX_SCORE_BYTES = 20 * 1024 * 1024;
// Desktop SoundFont playback passes a validated file path to the engine, so
// asset bytes no longer cross this JSONL boundary.  The limit stays at 64 MiB
// for the remaining inline byte-array operations (MIDI/MXL import and small
// SoundFont fixtures).
const MAX_ENGINE_REQUEST_BYTES = 64 * 1024 * 1024;

function assertByteLimit(byteLength, limit, label) {
  if (!Number.isSafeInteger(byteLength) || byteLength < 0) throw new Error(`${label} size is invalid`);
  if (byteLength > limit) throw new Error(`${label} exceeds ${limit} bytes`);
}

function assertScoreSize(byteLength) { assertByteLimit(byteLength, MAX_SCORE_BYTES, 'score file'); }
function assertEngineRequestSize(byteLength) { assertByteLimit(byteLength, MAX_ENGINE_REQUEST_BYTES, 'engine request'); }

module.exports = { MAX_SCORE_BYTES, MAX_ENGINE_REQUEST_BYTES, assertScoreSize, assertEngineRequestSize };
