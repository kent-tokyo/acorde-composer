const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const output = path.resolve(root, 'src/playground/acorde-wasm');
const acordeCheckout = path.join(root, 'acorde');
if (!fs.existsSync(path.join(acordeCheckout, 'crates/wasm/Cargo.toml'))) {
  throw new Error('Acorde v2.0.0 checkout is required at ./acorde (git clone --branch v2.0.0).');
}
const tag = spawnSync('git', ['rev-parse', 'v2.0.0^{commit}'], { cwd: acordeCheckout, encoding: 'utf8' });
const head = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: acordeCheckout, encoding: 'utf8' });
if (tag.status !== 0 || head.status !== 0 || tag.stdout.trim() !== head.stdout.trim()) {
  throw new Error('Acorde checkout at ./acorde must be at the v2.0.0 tag.');
}
for (const [source, destination, outName] of [
  [path.resolve(root, 'acorde/crates/wasm'), output, null],
  [path.resolve(root, 'browser-analysis-wasm'), path.resolve(root, 'src/playground/acorde-analysis-wasm'), 'acorde_analysis_wasm'],
]) {
  const args = [
    'build', source, '--target', 'web', '--out-dir', destination, '--release', '--no-typescript',
    ...(outName ? ['--out-name', outName] : []),
  ];
  const nativeWasmPack = path.join(os.homedir(), '.cargo/bin/wasm-pack');
  const executable = process.platform === 'darwin' && fs.existsSync(nativeWasmPack) ? nativeWasmPack : 'wasm-pack';
  let result = spawnSync(executable, args, { cwd: root, stdio: 'inherit' });
  if (process.platform === 'darwin' && result.error?.code === 'Unknown system error -86') {
    result = spawnSync('/bin/zsh', ['-lc', 'wasm-pack "$@"', 'wasm-pack', ...args], { cwd: root, stdio: 'inherit' });
  }
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`wasm-pack failed: ${source}`);
  fs.rmSync(path.join(destination, '.gitignore'), { force: true });
}
