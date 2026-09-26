const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const productName = packageJson.build.productName;
const artifactName = `${productName}-${packageJson.version}-arm64-unsigned.dmg`;
const artifactPath = path.join(root, 'dist', artifactName);
const unsignedEnvironment = {
  ...process.env,
  ACORDE_DISABLE_NOTARIZATION: '1',
  CSC_IDENTITY_AUTO_DISCOVERY: 'false',
};

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, env: unsignedEnvironment, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}

function buildUnsignedMacDmg({ platform = process.platform } = {}) {
  if (platform !== 'darwin') throw new Error('An unsigned macOS DMG must be built on a macOS host.');
  if (fs.existsSync(artifactPath)) throw new Error(`Refusing to overwrite an existing artifact: ${artifactPath}`);
  run(process.execPath, ['scripts/build-engine.cjs']);
  run(path.join(root, 'node_modules', '.bin', 'electron-builder'), [
    '--mac',
    'dmg',
    '--arm64',
    `--config.mac.artifactName=${productName}-${packageJson.version}-\${arch}-unsigned.\${ext}`,
  ]);
  if (!fs.existsSync(artifactPath)) throw new Error(`Unsigned macOS DMG was not found: ${artifactPath}`);
  run(process.execPath, ['scripts/create-release-artifact-manifest.cjs']);
  process.stdout.write(`Created unsigned experimental DMG: ${artifactPath}\n`);
  return artifactPath;
}

if (require.main === module) buildUnsignedMacDmg();

module.exports = { artifactName, artifactPath, buildUnsignedMacDmg };
