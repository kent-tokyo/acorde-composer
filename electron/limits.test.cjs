const test = require('node:test');
const assert = require('node:assert/strict');
const { MAX_SCORE_BYTES, MAX_ENGINE_REQUEST_BYTES, assertScoreSize, assertEngineRequestSize } = require('./limits.cjs');

test('accepts score file at the exact byte limit', () => assert.doesNotThrow(() => assertScoreSize(MAX_SCORE_BYTES)));
test('rejects score file above the byte limit', () => assert.throws(() => assertScoreSize(MAX_SCORE_BYTES + 1), /score file exceeds/));
test('accepts engine request at the exact byte limit', () => assert.doesNotThrow(() => assertEngineRequestSize(MAX_ENGINE_REQUEST_BYTES)));
test('rejects invalid and oversized engine request sizes', () => {
  assert.throws(() => assertEngineRequestSize(-1), /size is invalid/);
  assert.throws(() => assertEngineRequestSize(MAX_ENGINE_REQUEST_BYTES + 1), /engine request exceeds/);
});
