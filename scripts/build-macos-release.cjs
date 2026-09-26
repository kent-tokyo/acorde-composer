const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const environment = { ...process.env, ACORDE_REQUIRE_NOTARIZATION: '1' };

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, env: environment, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}

run(process.execPath, ['scripts/verify-macos-release-env.cjs']);
run(process.execPath, ['scripts/build-engine.cjs']);
run(path.join(root, 'node_modules', '.bin', 'electron-builder'), ['--mac', 'dmg', '--arm64']);
run(process.execPath, ['scripts/create-release-artifact-manifest.cjs']);
