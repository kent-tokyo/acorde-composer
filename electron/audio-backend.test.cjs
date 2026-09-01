const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

class FakeNode {
  constructor() { this.disconnected = 0; this.stopped = 0; this.listeners = {}; this.gain = { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} }; this.pan = { value: 0 }; this.frequency = { value: 0 }; }
  connect(node) { this.destination = node; return node; }
  disconnect() { this.disconnected += 1; }
  addEventListener(name, callback) { this.listeners[name] = callback; }
  start() {}
  stop() { this.stopped += 1; this.listeners.ended?.(); }
}

class FakeAudioContext {
  constructor() { this.currentTime = 0; this.state = 'suspended'; this.closed = false; }
  createGain() { return new FakeNode(); }
  createStereoPanner() { return new FakeNode(); }
  createOscillator() { return new FakeNode(); }
  async resume() { this.state = 'running'; }
  async close() { this.state = 'closed'; this.closed = true; }
}

function createBackend() {
  const source = fs.readFileSync(require.resolve('../src/audio-backend.js'), 'utf8');
  const context = vm.createContext({ window: {}, AudioContext: FakeAudioContext });
  vm.runInContext(source, context);
  return new context.window.AcordeAudioBackend();
}

test('audio backend schedules and stops oscillator nodes', async () => {
  const backend = createBackend();
  const audioContext = await backend.resume();
  backend.schedule([{ pitch_midi: 60, velocity: 100, time_secs: 0, duration_secs: 0.25 }], audioContext.currentTime, { volume: 0.8, pan: -0.2 });
  assert.equal(backend.nodes.size, 1);
  backend.stopAll();
  assert.equal(backend.nodes.size, 0);
  assert.equal(backend.channels.size, 0);
});

test('audio backend dispose closes the AudioContext and is idempotent', async () => {
  const backend = createBackend();
  await backend.resume();
  const context = backend.context;
  await backend.dispose();
  assert.equal(context.closed, true);
  assert.equal(backend.context, null);
  await backend.dispose();
  assert.equal(backend.context, null);
});
