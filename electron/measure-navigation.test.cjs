const test = require('node:test');
const assert = require('node:assert/strict');
const { parseMeasureRange } = require('../src/measure-navigation.js');

test('MuseScore-style Find / Go to accepts one-based measures and ranges', () => {
  assert.deepEqual(parseMeasureRange('1', 8), [0, 0]);
  assert.deepEqual(parseMeasureRange('2-5', 8), [1, 4]);
  assert.deepEqual(parseMeasureRange('2–5', 8), [1, 4]);
  assert.deepEqual(parseMeasureRange(' 2 : 5 ', 8), [1, 4]);
});

test('Find / Go to rejects malformed, reversed, and out-of-score ranges', () => {
  for (const value of ['', '0', '-1', '3-2', '1-9', 'p2', 'one']) {
    assert.equal(parseMeasureRange(value, 8), null, value);
  }
  assert.equal(parseMeasureRange('1', 0), null);
  assert.equal(parseMeasureRange('1', Number.NaN), null);
});
