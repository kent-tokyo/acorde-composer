const test = require('node:test');
const assert = require('node:assert/strict');
const { refreshReleaseEvidence } = require('../scripts/refresh-release-evidence.cjs');

test('release evidence refresh refuses dirty source and preserves public-commit semantics', () => {
  assert.throws(() => refreshReleaseEvidence({ status: ' M src/app.js\n' }), /dirty worktree/);
});

test('release evidence refresh runs pack, strict candidate gate, QA, and consistency validation in order', () => {
  const calls = [];
  const result = refreshReleaseEvidence({ root: '/repo', status: '', runner: (command, args) => { calls.push([command, args]); return { status: 0 }; } });
  assert.equal(calls.length, 4);
  assert.deepEqual(calls[0], ['npm', ['run', 'pack']]);
  assert.ok(calls[1][1].includes('--strict-dependency'));
  assert.ok(calls[2][1].includes('--matrix'));
  assert.ok(calls[2][1].includes('/repo/qa/release-qa-matrix.json'));
  assert.ok(calls[2][1].includes('--candidate-gate'));
  assert.match(calls[3][1][0], /validate-release-evidence\.cjs$/);
  assert.equal(result.report, '/repo/dist/release-qa-report.json');
});
