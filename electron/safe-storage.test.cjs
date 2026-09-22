const test = require('node:test');
const assert = require('node:assert/strict');
const storage = require('../src/safe-storage.js');

function memoryStorage(values = {}) {
  const data = new Map(Object.entries(values));
  return { data, getItem: (key) => data.has(key) ? data.get(key) : null, setItem: (key, value) => data.set(key, String(value)), removeItem: (key) => data.delete(key) };
}

test('safe storage handles unavailable browser storage without interrupting the caller', () => {
  const unavailable = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); }, removeItem() { throw new Error('blocked'); } };
  assert.equal(storage.read(unavailable, 'key', 'fallback'), 'fallback');
  assert.equal(storage.write(unavailable, 'key', 'value'), false);
  assert.equal(storage.remove(unavailable, 'key'), false);
});

test('safe storage discards malformed JSON and returns the supplied fallback', () => {
  const values = memoryStorage({ broken: '{not json' });
  assert.deepEqual(storage.readJson(values, 'broken', { valid: true }), { valid: true });
  assert.equal(values.data.has('broken'), false);
});

test('safe storage round-trips structured values', () => {
  const values = memoryStorage();
  assert.equal(storage.writeJson(values, 'settings', { density: 'compact' }), true);
  assert.deepEqual(storage.readJson(values, 'settings'), { density: 'compact' });
});
