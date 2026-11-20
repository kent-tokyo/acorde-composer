const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const output = path.resolve(root, 'src/playground/acorde-wasm');
const acordeCheckout = path.join(root, 'acorde');
const siblingCheckout = path.resolve(root, '../acorde');
let temporaryLink = false;
if (!fs.existsSync(acordeCheckout) && fs.existsSync(siblingCheckout)) {
  fs.symlinkSync(siblingCheckout, acordeCheckout, 'dir');
  temporaryLink = true;
}
try {
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
} finally {
  if (temporaryLink) fs.unlinkSync(acordeCheckout);
}
