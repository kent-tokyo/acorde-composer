const { spawnSync } = require('node:child_process');

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const cargoCommand = process.platform === 'win32' ? 'cargo.exe' : 'cargo';

const steps = [
  { label: 'Node tests', command: npmCommand, args: ['test'] },
  { label: 'static and fixture checks', command: npmCommand, args: ['run', 'check'] },
  { label: 'Playground syntax check', command: npmCommand, args: ['run', 'check:playground'] },
  { label: 'Rust tests', command: cargoCommand, args: ['test', '--manifest-path', 'engine/Cargo.toml', '--locked'] },
  { label: 'Rust clippy', command: cargoCommand, args: ['clippy', '--manifest-path', 'engine/Cargo.toml', '--all-targets', '--all-features', '--locked'] },
  { label: 'Git whitespace check', command: 'git', args: ['diff', '--check'] },
];

function runStep({ label, command, args }) {
  process.stdout.write(`\n[candidate] ${label}\n`);
  const result = spawnSync(command, args, { stdio: 'inherit', shell: false });
  if (result.error) {
    process.stderr.write(`[candidate] ${label} could not start: ${result.error.message}\n`);
    return result.error.code || 1;
  }
  if (result.status !== 0) {
    process.stderr.write(`[candidate] ${label} failed with exit code ${result.status}\n`);
    return result.status || 1;
  }
  return 0;
}

function runCandidateChecks() {
  for (const step of steps) {
    const status = runStep(step);
    if (status !== 0) return { valid: false, failedStep: step.label, exitCode: status };
  }
  process.stdout.write('\n[candidate] all local release-candidate gates passed\n');
  return { valid: true, failedStep: null, exitCode: 0 };
}

if (require.main === module) {
  process.exitCode = runCandidateChecks().exitCode;
}

module.exports = { runCandidateChecks, steps };
