const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

function run(command, args, { runner = spawnSync } = {}) {
  const result = runner(command, args, { stdio: 'inherit', shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed with exit code ${result.status}`);
}

function refreshReleaseEvidence({ root = path.resolve(__dirname, '..'), runner = spawnSync, status = null } = {}) {
  const porcelain = status ?? execFileSync('git', ['-C', root, 'status', '--porcelain'], { encoding: 'utf8' });
  if (porcelain.trim()) throw new Error('refusing to generate release evidence from a dirty worktree');
  const dist = path.join(root, 'dist');
  run('npm', ['run', 'pack'], { runner });
  run(process.execPath, [path.join(root, 'scripts/check-release-candidate.cjs'), '--json', '--strict-dependency', '--output', path.join(dist, 'candidate-gate.json')], { runner });
  run(process.execPath, [path.join(root, 'scripts/run-release-qa.cjs'), '--matrix', path.join(root, 'qa/release-qa-matrix.json'), '--results', path.join(root, 'qa/release-qa-results.json'), '--candidate-gate', path.join(dist, 'candidate-gate.json')], { runner });
  run(process.execPath, [path.join(root, 'scripts/validate-release-evidence.cjs')], { runner });
  return { manifest: path.join(dist, 'release-artifact-manifest.json'), candidateGate: path.join(dist, 'candidate-gate.json'), report: path.join(dist, 'release-qa-report.json') };
}

if (require.main === module) {
  try { process.stdout.write(`${JSON.stringify(refreshReleaseEvidence())}\n`); }
  catch (error) { process.stderr.write(`release evidence refresh failed: ${error.message}\n`); process.exitCode = 1; }
}

module.exports = { refreshReleaseEvidence };
