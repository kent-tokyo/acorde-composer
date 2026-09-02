const test = require('node:test');
const assert = require('node:assert/strict');
const { assessDistribution, assessDistributionQa, createDistributionQaMatrix } = require('./distribution-readiness.cjs');

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

test('distribution readiness requires both Windows certificate and password references', () => {
  const result = assessDistribution({ packageJson, platform: 'win', arch: 'x64', env: { WIN_CSC_LINK: 'secret-ref' }, artifacts: ['Acorde Composer Setup.exe'] });
  assert.equal(result.ready, false);
  assert.deepEqual(result.diagnostics, ['windows-signing-credentials-missing']);
});

test('distribution QA matrix is deterministic and reports missing or failed evidence', () => {
  const matrix = createDistributionQaMatrix({ platforms: ['mac', 'win'], architectures: { mac: ['arm64'], win: ['x64'] } });
  assert.equal(matrix.length, 2);
  assert.equal(matrix[0].scenarios[0].status, 'not-run');
  const partial = assessDistributionQa(matrix, [{ platform: 'mac', arch: 'arm64', scenario: 'install-launch', status: 'passed' }]);
  assert.equal(partial.ready, false);
  assert.equal(partial.passed, 1);
  assert.equal(partial.missing.length, 19);
  const all = matrix.flatMap((target) => target.scenarios.map((scenario) => ({ platform: target.platform, arch: target.arch, scenario: scenario.id, status: 'passed' })));
  assert.deepEqual(assessDistributionQa(matrix, all), { ready: true, total: 20, passed: 20, missing: [], failed: [] });
});
