const test = require('node:test');
const assert = require('node:assert/strict');
const { runCandidateChecks, steps, validateCandidateGateReport } = require('../scripts/check-release-candidate.cjs');

test('release-candidate gate keeps the local verification order explicit', () => {
  assert.deepEqual(steps.map((step) => step.label), [
    'Node tests',
    'static and fixture checks',
    'Playground syntax check',
    'Rust tests',
    'Rust clippy',
    'Git whitespace check',
  ]);
  assert.deepEqual(steps[3].args, ['test', '--manifest-path', 'engine/Cargo.toml', '--locked']);
  assert.deepEqual(steps[4].args, ['clippy', '--manifest-path', 'engine/Cargo.toml', '--all-targets', '--all-features', '--locked']);
});

test('release-candidate gate can emit a machine-readable step report', () => {
  const result = runCandidateChecks({
    json: true,
    runner: ({ label }) => ({ label, status: label === 'Rust tests' ? 1 : 0 }),
  });
  assert.equal(result.valid, false);
  assert.equal(result.releaseReady, false);
  assert.equal(result.failedStep, 'Rust tests');
  assert.equal(result.steps.length, steps.length);
  assert.deepEqual(result.steps[0], { label: 'Node tests', passed: true });
  assert.deepEqual(result.steps[3], { label: 'Rust tests', passed: false });
  assert.deepEqual(validateCandidateGateReport(result), { valid: true, diagnostics: [] });
});

test('strict candidate gate blocks an unready Acorde dependency provenance', () => {
  const result = runCandidateChecks({
    json: true,
    strictDependency: true,
    runner: ({ label }) => ({ label, status: 0 }),
    dependencyInspector: () => ({
      declaredVersion: '1.1.7',
      declaredCrates: ['acorde-core', 'acorde-io', 'acorde-layout', 'acorde-render-svg', 'acorde-soundfont'],
      lockVersions: {
        'acorde-core': '1.1.7',
        'acorde-io': '1.1.7',
        'acorde-layout': '1.1.7',
        'acorde-render-svg': '1.1.7',
        'acorde-soundfont': '1.1.7',
      },
      checkoutVersion: '1.1.6',
      exactTag: 'v1.1.6',
      clean: false,
      ready: false,
      diagnostics: ['acorde-checkout-dirty'],
    }),
  });
  assert.equal(result.valid, true);
  assert.equal(result.releaseReady, false);
  assert.equal(result.exitCode, 1);
  assert.equal(validateCandidateGateReport(result).valid, true);
});

test('release-candidate JSON report preserves bounded failure diagnostics', () => {
  const result = runCandidateChecks({
    json: true,
    runner: ({ label }) => label === 'Rust tests' ? { label, status: 101, detail: 'acorde dependency compile failure' } : { label, status: 0 },
  });
  assert.equal(validateCandidateGateReport(result).valid, true);
  assert.equal(result.steps[3].detail, 'acorde dependency compile failure');
  assert.equal(validateCandidateGateReport({ ...result, steps: result.steps.map((step) => ({ ...step, detail: 'x'.repeat(601) })) }).valid, false);
});

test('release-candidate JSON report rejects schema drift and reordered steps', () => {
  const result = runCandidateChecks({ json: true, runner: ({ label }) => ({ label, status: 0 }) });
  assert.equal(validateCandidateGateReport({ ...result, schemaVersion: 2 }).valid, false);
  assert.equal(validateCandidateGateReport({ ...result, steps: [...result.steps].reverse() }).valid, false);
  assert.equal(validateCandidateGateReport({ ...result, steps: result.steps.map((step) => ({ ...step, passed: 'true' })) }).valid, false);
});

test('release-candidate JSON report rejects malformed dependency provenance', () => {
  const result = runCandidateChecks({ json: true, runner: ({ label }) => ({ label, status: 0 }) });
  assert.equal(validateCandidateGateReport({ ...result, dependency: { ...result.dependency, lockVersions: [] } }).valid, false);
  assert.equal(validateCandidateGateReport({ ...result, dependency: { ...result.dependency, ready: 'false' } }).valid, false);
});
