const MAX_SCORE_BYTES = 20 * 1024 * 1024;
const MAX_ENGINE_REQUEST_BYTES = 25 * 1024 * 1024;

function assertByteLimit(byteLength, limit, label) {
  if (!Number.isSafeInteger(byteLength) || byteLength < 0) throw new Error(`${label} size is invalid`);
  if (byteLength > limit) throw new Error(`${label} exceeds ${limit} bytes`);
}

function assertScoreSize(byteLength) { assertByteLimit(byteLength, MAX_SCORE_BYTES, 'score file'); }
function assertEngineRequestSize(byteLength) { assertByteLimit(byteLength, MAX_ENGINE_REQUEST_BYTES, 'engine request'); }

module.exports = { MAX_SCORE_BYTES, MAX_ENGINE_REQUEST_BYTES, assertScoreSize, assertEngineRequestSize };
