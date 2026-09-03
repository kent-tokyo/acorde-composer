const path = require('node:path');
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const output = path.resolve(root, 'src/playground/acorde-wasm');
const result = spawnSync('wasm-pack', [
  'build', path.resolve(root, '../acorde/crates/wasm'), '--target', 'web',
  '--out-dir', output, '--release', '--no-typescript',
], { cwd: root, stdio: 'inherit' });
if (result.error) throw result.error;
if (result.status === 0) fs.rmSync(path.join(output, '.gitignore'), { force: true });
process.exit(result.status ?? 1);
