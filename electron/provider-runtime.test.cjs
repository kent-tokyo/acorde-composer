const test = require('node:test');
const assert = require('node:assert/strict');
const { runJsonProvider } = require('./provider-runtime.cjs');

function fakeChild({ output = '{}', code = 0 } = {}) {
  const listeners = {};
  return {
    stdout: { on: (event, fn) => { if (event === 'data') process.nextTick(() => fn(Buffer.from(output))); } },
    stdin: { end: () => {} },
    on: (event, fn) => { listeners[event] = fn; if (event === 'close') process.nextTick(() => fn(code)); },
    kill: () => {},
  };
}

test('JSON provider runtime exchanges bounded stdin/stdout without a shell', async () => {
  const result = await runJsonProvider({ executable: '/provider', request: { kind: 'probe' }, spawnImpl: (file, args, options) => { assert.equal(file, '/provider'); assert.deepEqual(args, []); assert.equal(options.shell, false); return fakeChild({ output: '{"status":"ok"}' }); } });
  assert.deepEqual(result, { status: 'success', body: { status: 'ok' } });
});

test('JSON provider runtime normalizes invalid JSON, nonzero exit, and timeout', async () => {
  assert.deepEqual(await runJsonProvider({ executable: '/provider', request: {}, spawnImpl: () => fakeChild({ output: 'nope' }) }), { status: 'failed', error: 'provider-invalid-json' });
  assert.deepEqual(await runJsonProvider({ executable: '/provider', request: {}, spawnImpl: () => fakeChild({ code: 2 }) }), { status: 'failed', error: 'provider-failed' });
  const hanging = { stdout: { on() {} }, stdin: { end() {} }, on() {}, kill() {} };
  assert.deepEqual(await runJsonProvider({ executable: '/provider', request: {}, timeoutMs: 1, spawnImpl: () => hanging }), { status: 'timeout', error: 'provider-timeout' });
});

test('JSON provider runtime rejects oversized input before spawning a provider', async () => {
  let spawned = false;
  const result = await runJsonProvider({ executable: '/provider', request: { payload: 'x'.repeat(600 * 1024) }, spawnImpl: () => { spawned = true; return fakeChild(); } });
  assert.deepEqual(result, { status: 'failed', error: 'provider-input-too-large' });
  assert.equal(spawned, false);
});

test('JSON provider runtime rejects unsafe executable paths and arguments before spawning', async () => {
  let spawned = false;
  const spawnImpl = () => { spawned = true; return fakeChild(); };
  assert.deepEqual(await runJsonProvider({ executable: 'provider', request: {}, spawnImpl }), { status: 'failed', error: 'provider-command-invalid' });
  assert.deepEqual(await runJsonProvider({ executable: '/provider', args: ['x\0y'], request: {}, spawnImpl }), { status: 'failed', error: 'provider-command-invalid' });
  assert.equal(spawned, false);
});
