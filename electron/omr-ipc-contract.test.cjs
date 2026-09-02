const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const main = fs.readFileSync(path.join(root, 'electron/main.cjs'), 'utf8');
const preload = fs.readFileSync(path.join(root, 'electron/preload.cjs'), 'utf8');

test('external OMR execution is exposed only through the bounded provider boundary', () => {
  assert.match(main, /omr:runExternalProvider/);
  assert.match(main, /runExternalOmrProvider\(\{ executable, args, request, timeoutMs \}\)/);
  assert.match(preload, /runExternalOmrProvider: \(payload\) => ipcRenderer\.invoke\('omr:runExternalProvider'/);
  assert.match(main, /runExternalOmrProvider/);
});
