const test = require('node:test');
const assert = require('node:assert/strict');
const policy = require('../src/render-policy.js');

test('adaptive render policy bounds widths and lowers system density', () => {
  assert.equal(policy.boundedWidth(Number.NaN), 900);
  assert.equal(policy.boundedWidth(100), 560);
  assert.equal(policy.boundedWidth(4000), 1600);
  assert.deepEqual([560, 699, 700, 999, 1000].map(policy.measuresPerSystem), [2, 2, 3, 3, 4]);
  assert.deepEqual(policy.options(850), { width: 850, measuresPerSystem: 3, staffSize: 10, interactive: true });
  assert.equal(policy.normalizeDensity('4'), '4');
  assert.equal(policy.normalizeDensity('invalid'), 'adaptive');
  assert.equal(policy.options(850, '2').measuresPerSystem, 2);
  assert.equal(policy.options(850, '4').measuresPerSystem, 4);
});

test('adaptive render policy recognizes only width-allocation failures', () => {
  assert.equal(policy.isRecoverableWidthError(new Error('minimum measure widths exceed the available system width')), true);
  assert.equal(policy.isRecoverableWidthError('content-aware margins and notation header leave no usable measure width'), true);
  assert.equal(policy.isRecoverableWidthError(new Error('invalid score')), false);
});

test('measure hit areas cover every measure in 1, 4, and 100 measure scores', () => {
  const bounds = { x: 100, y: 40, width: 800, height: 64 };
  for (const count of [1, 4, 100]) {
    const areas = Array.from({ length: count }, (_, index) => policy.measureHitArea(index, count, 4, bounds));
    assert.equal(areas.every(Boolean), true);
    assert.equal(areas.every((area) => area.width > 0 && area.height === 80), true);
    assert.equal(areas.every((area) => area.x >= bounds.x && area.x + area.width <= bounds.x + bounds.width + Number.EPSILON), true);
  }
  assert.deepEqual(policy.measureHitArea(3, 4, 4, bounds), { x: 700, y: 32, width: 200, height: 80 });
  assert.deepEqual(policy.measureHitArea(99, 100, 4, bounds), { x: 700, y: 32, width: 200, height: 80 });
});

test('measure hit areas reject invalid addresses and geometry', () => {
  assert.equal(policy.measureHitArea(-1, 4, 4, { x: 0, y: 0, width: 800, height: 60 }), null);
  assert.equal(policy.measureHitArea(4, 4, 4, { x: 0, y: 0, width: 800, height: 60 }), null);
  assert.equal(policy.measureHitArea(0, 4, 0, { x: 0, y: 0, width: 800, height: 60 }), null);
  assert.equal(policy.measureHitArea(0, 4, 4, { x: 0, y: 0, width: 0, height: 60 }), null);
});
