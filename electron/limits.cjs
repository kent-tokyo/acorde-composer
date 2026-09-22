const MAX_SCORE_BYTES = 20 * 1024 * 1024;
// SoundFont bytes are currently represented as an inline JSON byte array at the
// engine boundary.  A 9.5 MiB SF2 expands beyond 25 MiB when encoded this way,
// so retain a bounded limit that admits the checked-in real-asset fixture while
// the path/stream protocol tracked in Acorde #82 is implemented.
const MAX_ENGINE_REQUEST_BYTES = 64 * 1024 * 1024;

function assertByteLimit(byteLength, limit, label) {
  if (!Number.isSafeInteger(byteLength) || byteLength < 0) throw new Error(`${label} size is invalid`);
  if (byteLength > limit) throw new Error(`${label} exceeds ${limit} bytes`);
}

function assertScoreSize(byteLength) { assertByteLimit(byteLength, MAX_SCORE_BYTES, 'score file'); }
function assertEngineRequestSize(byteLength) { assertByteLimit(byteLength, MAX_ENGINE_REQUEST_BYTES, 'engine request'); }

module.exports = { MAX_SCORE_BYTES, MAX_ENGINE_REQUEST_BYTES, assertScoreSize, assertEngineRequestSize };
