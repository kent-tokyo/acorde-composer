const test = require('node:test');
const assert = require('node:assert/strict');
const navigation = require('../src/section-navigation.js');

test('section navigation selects only the score interval between canonical section breaks', () => {
  const measures = Array.from({ length: 8 }, () => ({}));
  const score = { section_breaks: [{ measure_index: 0 }, { measure: 3 }, 6] };
  assert.deepEqual(navigation.sectionBreakIndexes(score, measures), [0, 3, 6]);
  assert.deepEqual(navigation.rangeForMeasure(score, measures, 2), [0, 2]);
  assert.deepEqual(navigation.rangeForMeasure(score, measures, 4), [3, 5]);
  assert.deepEqual(navigation.rangeForMeasure(score, measures, 7), [6, 7]);
});

test('section navigation recognizes measure metadata but never substitutes page or system breaks', () => {
  const measures = [{ system_break: true }, { section_break: true }, { page_break: true }, {}];
  assert.equal(navigation.supportsSections({ parts: [] }, measures), true);
  assert.deepEqual(navigation.rangeForMeasure({}, measures, 2), [1, 3]);
  assert.equal(navigation.rangeForMeasure({ parts: [] }, [{ system_break: true }, { page_break: true }], 0), null);
});
