const test = require('node:test');
const assert = require('node:assert/strict');
const { RenderCoordinator } = require('../src/render-coordinator.js');

test('render coordinator only applies the newest asynchronous render', async () => {
  const coordinator = new RenderCoordinator();
  let releaseFirst;
  const first = coordinator.render(() => new Promise((resolve) => { releaseFirst = resolve; }), () => { throw new Error('stale result must not apply'); });
  const second = coordinator.render(async () => 'newest', (value) => assert.equal(value, 'newest'));
  assert.deepEqual(await second, { applied: true, value: 'newest' });
  releaseFirst('old');
  assert.deepEqual(await first, { applied: false, value: null });
});

test('a direct score load invalidates pending rendering before committing its SVG', async () => {
  const coordinator = new RenderCoordinator();
  let release;
  const pending = coordinator.render(() => new Promise((resolve) => { release = resolve; }), () => { throw new Error('stale render must not overwrite loaded score'); });
  const committed = [];
  coordinator.commit('<svg id="loaded"/>', (value) => committed.push(value));
  release('<svg id="stale"/>');
  assert.deepEqual(await pending, { applied: false, value: null });
  assert.deepEqual(committed, ['<svg id="loaded"/>']);
});
