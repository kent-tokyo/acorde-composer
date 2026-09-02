const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function loadNormalize() {
  const source = fs.readFileSync(require.resolve('../src/mixer-state.js'), 'utf8');
  const context = vm.createContext({ window: {} });
  vm.runInContext(source, context);
  return context.window.AcordeMixerState.normalize;
}

test('mixer state normalizes persisted values and removes deleted part channels', () => {
  const normalize = loadNormalize();
  const state = normalize({ master: { volume: 4, pan: -3 }, channels: { 0: { volume: 'bad', pan: 2, solo: 1 }, 2: { volume: 0.4 } } }, 1);
  assert.deepEqual({ ...state.master }, { volume: 1, pan: -1, mute: false });
  assert.deepEqual({ ...state.channels[0] }, { volume: 1, pan: 1, mute: false, solo: true });
  assert.equal(Object.hasOwn(state.channels, '2'), false);
});

test('mixer state preserves channels while the score size is not known yet', () => {
  const normalize = loadNormalize();
  const state = normalize({ channels: { 1: { volume: 0.4, solo: true } } });
  assert.deepEqual({ ...state.channels[1] }, { volume: 0.4, pan: 0, mute: false, solo: true });
});

test('mixer state rejects malformed persisted output device ids', () => {
  const normalize = loadNormalize();
  assert.equal(normalize({ outputDeviceId: { device: 'unexpected' } }).outputDeviceId, null);
  assert.equal(normalize({ outputDeviceId: 'speaker-1' }).outputDeviceId, 'speaker-1');
});
