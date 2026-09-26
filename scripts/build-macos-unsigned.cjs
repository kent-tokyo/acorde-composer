const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const productName = packageJson.build.productName;
const archiveName = `${productName}-${packageJson.version}-arm64-unsigned.zip`;
const appPath = path.join(root, 'dist', 'mac-arm64', `${productName}.app`);
const archivePath = path.join(root, 'dist', archiveName);

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}

function buildUnsignedMacArchive({ platform = process.platform } = {}) {
  if (platform !== 'darwin') throw new Error('An unsigned macOS ZIP must be built on a macOS host.');
  if (fs.existsSync(archivePath)) throw new Error(`Refusing to overwrite an existing archive: ${archivePath}`);
  run(process.execPath, ['scripts/build-engine.cjs']);
  run(path.join(root, 'node_modules', '.bin', 'electron-builder'), ['--mac', '--dir', '--arm64']);
  if (!fs.existsSync(appPath)) throw new Error(`Packaged macOS application was not found: ${appPath}`);
  run('ditto', ['-c', '-k', '--sequesterRsrc', '--keepParent', appPath, archivePath]);
  run(process.execPath, ['scripts/create-release-artifact-manifest.cjs']);
  process.stdout.write(`Created unsigned experimental archive: ${archivePath}\n`);
  return archivePath;
}

if (require.main === module) buildUnsignedMacArchive();

module.exports = { appPath, archiveName, archivePath, buildUnsignedMacArchive };
