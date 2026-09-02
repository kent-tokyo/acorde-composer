const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function loadOutput() {
  const source = fs.readFileSync(require.resolve('../src/audio-output.js'), 'utf8');
  const context = vm.createContext({ window: {} });
  vm.runInContext(source, context);
  return context.window.AcordeAudioOutput;
}

test('audio output resolution ignores malformed and non-output devices', () => {
  const output = loadOutput();
  const devices = output.normalizeDevices([
    { kind: 'audioinput', deviceId: 'mic-1' },
    { kind: 'audiooutput', deviceId: 'speaker-1' },
    { kind: 'audiooutput', deviceId: 42 },
    null,
  ]);
  assert.deepEqual(devices.map((device) => device.deviceId), ['speaker-1']);
  assert.equal(output.resolveOutputDeviceId('speaker-1', devices), 'speaker-1');
  assert.equal(output.resolveOutputDeviceId('removed-speaker', devices), null);
  assert.equal(output.resolveOutputDeviceId({ device: 'speaker-1' }, devices), null);
});
