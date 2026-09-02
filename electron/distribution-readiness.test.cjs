const test = require('node:test');
const assert = require('node:assert/strict');
const { assessDistribution } = require('./distribution-readiness.cjs');

const packageJson = { version: '0.1.4', build: { productName: 'Acorde Composer', mac: { target: ['dmg', 'zip'] }, win: { target: ['nsis'] } } };

test('distribution readiness reports missing signing and artifact evidence', () => {
  const result = assessDistribution({ packageJson, platform: 'mac', arch: 'arm64' });
  assert.equal(result.ready, false);
  assert.deepEqual(result.diagnostics, ['mac-signing-identity-missing', 'artifacts-not-tested']);
});

test('distribution readiness passes a target with signing and artifact evidence', () => {
  const result = assessDistribution({ packageJson, platform: 'win', arch: 'x64', env: { WIN_CSC_LINK: 'secret-ref', WIN_CSC_KEY_PASSWORD: 'secret-ref' }, artifacts: ['Acorde Composer Setup.exe'] });
  assert.equal(result.ready, true);
  assert.deepEqual(result.targets, ['nsis']);
});
