const test = require('node:test');
const assert = require('node:assert/strict');
const { steps } = require('../scripts/check-release-candidate.cjs');

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
