const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const main = fs.readFileSync(path.join(root, 'electron/main.cjs'), 'utf8');
const preload = fs.readFileSync(path.join(root, 'electron/preload.cjs'), 'utf8');

test('external AI execution is exposed through the validated provider boundary', () => {
  assert.match(main, /ai:runExternalProvider/);
  assert.match(main, /runExternalAiProvider\(\{ \.\.\.payload, limiter: aiRateLimiter \}\)/);
  assert.match(preload, /runExternalAiProvider: \(payload\) => ipcRenderer\.invoke\('ai:runExternalProvider'/);
  assert.match(main, /const aiRateLimiter = createAiRateLimiter\(\)/);
});
