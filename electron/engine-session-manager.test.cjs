const test = require('node:test');
const assert = require('node:assert/strict');
const { EngineSessionManager } = require('./engine-session-manager.cjs');

test('engine sessions isolate requests and release resources per window owner', async () => {
  const created = [];
  const manager = new EngineSessionManager((ownerId) => {
    const session = { ownerId, requests: [], closed: false, request: async (request) => { session.requests.push(request); return { ownerId, request }; }, close: () => { session.closed = true; } };
    created.push(session);
    return session;
  });
  assert.deepEqual(await manager.request(101, { op: 'load_score', score: 'one' }), { ownerId: 101, request: { op: 'load_score', score: 'one' } });
  assert.deepEqual(await manager.request(202, { op: 'load_score', score: 'two' }), { ownerId: 202, request: { op: 'load_score', score: 'two' } });
  assert.equal(created.length, 2);
  assert.deepEqual(created[0].requests, [{ op: 'load_score', score: 'one' }]);
  assert.deepEqual(created[1].requests, [{ op: 'load_score', score: 'two' }]);
  assert.equal(manager.release(101), true);
  assert.equal(created[0].closed, true);
  assert.equal(created[1].closed, false);
  assert.equal(manager.release(101), false);
  assert.equal(manager.size, 1);
});

test('engine sessions reject missing owner ids before creating a process', async () => {
  const manager = new EngineSessionManager(() => { throw new Error('must not start'); });
  await assert.rejects(manager.request(-1, { op: 'inspect_engine' }), /owner id/);
  assert.equal(manager.size, 0);
});
