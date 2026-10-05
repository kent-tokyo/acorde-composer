const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const defaultEntitlementsPath = path.join(root, 'packaging', 'entitlements.mac.plist');

function runCommand(command, args, { cwd = root, env = process.env, stdio = 'inherit' } = {}) {
  const result = spawnSync(command, args, { cwd, env, stdio });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} exited with status ${result.status ?? 'unknown'}`);
  }
  return result;
}

function requireMacos(platform) {
  if (platform !== 'darwin') throw new Error('macOS code signing requires a macOS host.');
}

function requirePath(targetPath, label, fsImpl) {
  if (!fsImpl.existsSync(targetPath)) throw new Error(`${label} was not found: ${targetPath}`);
}

function verifyMacAppBundle(
  appPath,
  { platform = process.platform, run = runCommand, fsImpl = fs } = {},
) {
  requireMacos(platform);
  requirePath(appPath, 'macOS application bundle', fsImpl);
  run('codesign', ['--verify', '--deep', '--strict', '--verbose=4', appPath]);
}

function signAdHocMacApp(
  appPath,
  {
    platform = process.platform,
    run = runCommand,
    fsImpl = fs,
    entitlementsPath = defaultEntitlementsPath,
  } = {},
) {
  requireMacos(platform);
  requirePath(appPath, 'macOS application bundle', fsImpl);
  requirePath(entitlementsPath, 'macOS entitlements file', fsImpl);
  run('codesign', [
    '--force',
    '--deep',
    '--sign',
    '-',
    '--options',
    'runtime',
    '--timestamp=none',
    '--entitlements',
    entitlementsPath,
    appPath,
  ]);
  verifyMacAppBundle(appPath, { platform, run, fsImpl });
}

function verifyMacDmg(
  dmgPath,
  productName,
  {
    platform = process.platform,
    run = runCommand,
    fsImpl = fs,
    osImpl = os,
  } = {},
) {
  requireMacos(platform);
  requirePath(dmgPath, 'macOS disk image', fsImpl);
  const tempRoot = fsImpl.mkdtempSync(path.join(osImpl.tmpdir(), 'acorde-dmg-verify-'));
  const mountPoint = path.join(tempRoot, 'mount');
  fsImpl.mkdirSync(mountPoint);
  let attached = false;

  try {
    run('hdiutil', ['verify', dmgPath]);
    run('hdiutil', ['attach', '-readonly', '-nobrowse', '-mountpoint', mountPoint, dmgPath]);
    attached = true;
    verifyMacAppBundle(path.join(mountPoint, `${productName}.app`), {
      platform,
      run,
      fsImpl,
    });
  } finally {
    if (attached) run('hdiutil', ['detach', mountPoint]);
    fsImpl.rmSync(tempRoot, { recursive: true, force: true });
  }
}

module.exports = {
  defaultEntitlementsPath,
  runCommand,
  signAdHocMacApp,
  verifyMacAppBundle,
  verifyMacDmg,
};
