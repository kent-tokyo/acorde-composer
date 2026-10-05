const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { notarizationCredentials, notarizationIsDisabled } = require('../scripts/notarize-mac.cjs');
const { assessMacosReleaseEnvironment } = require('../scripts/verify-macos-release-env.cjs');
const { signAdHocMacApp, verifyMacAppBundle, verifyMacDmg } = require('../scripts/macos-code-signing.cjs');

const root = path.resolve(__dirname, '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const releaseScript = fs.readFileSync(path.join(root, 'scripts', 'build-macos-release.cjs'), 'utf8');
const unsignedScript = fs.readFileSync(path.join(root, 'scripts', 'build-macos-unsigned.cjs'), 'utf8');
const unsignedDmgScript = fs.readFileSync(path.join(root, 'scripts', 'build-macos-unsigned-dmg.cjs'), 'utf8');

test('macOS distribution explicitly produces a hardened DMG and invokes notarization', () => {
  assert.deepEqual(packageJson.build.mac.target, ['dmg']);
  assert.equal(packageJson.build.afterSign, 'scripts/notarize-mac.cjs');
  assert.equal(packageJson.build.mac.hardenedRuntime, true);
  assert.equal(packageJson.build.mac.entitlements, 'packaging/entitlements.mac.plist');
  assert.equal(packageJson.scripts['dist:mac'], 'node scripts/build-macos-release.cjs');
  assert.match(releaseScript, /'--mac', 'dmg', '--arm64'/);
  assert.match(releaseScript, /create-release-artifact-manifest/);
});

test('free experimental ZIP seals the complete app bundle with an ad-hoc signature', () => {
  assert.equal(packageJson.scripts['dist:mac:unsigned'], 'node scripts/build-macos-unsigned.cjs');
  assert.match(unsignedScript, /-arm64-unsigned\.zip/);
  assert.match(unsignedScript, /'--mac', '--dir', '--arm64'/);
  assert.match(unsignedScript, /'ditto', \['-c', '-k', '--sequesterRsrc', '--keepParent'/);
  assert.match(unsignedScript, /Refusing to overwrite an existing archive/);
  assert.match(unsignedScript, /ACORDE_DISABLE_NOTARIZATION: '1'/);
  assert.match(unsignedScript, /CSC_IDENTITY_AUTO_DISCOVERY: 'false'/);
  assert.match(unsignedScript, /signAdHocMacApp\(appPath\)/);
});

test('free experimental DMG signs before packaging and verifies the mounted bundle', () => {
  assert.equal(packageJson.scripts['dist:mac:unsigned-dmg'], 'node scripts/build-macos-unsigned-dmg.cjs');
  assert.match(unsignedDmgScript, /-arm64-unsigned\.dmg/);
  assert.match(unsignedDmgScript, /'--mac',\n    '--dir',\n    '--arm64'/);
  assert.match(unsignedDmgScript, /signAdHocMacApp\(appPath\)/);
  assert.match(unsignedDmgScript, /'--prepackaged',\n    appPath/);
  assert.match(unsignedDmgScript, /verifyMacDmg\(artifactPath, productName\)/);
  assert.match(unsignedDmgScript, /--config\.mac\.artifactName=/);
  assert.match(unsignedDmgScript, /ACORDE_DISABLE_NOTARIZATION: '1'/);
  assert.match(unsignedDmgScript, /CSC_IDENTITY_AUTO_DISCOVERY: 'false'/);
  assert.match(unsignedDmgScript, /Refusing to overwrite an existing artifact/);
});

test('ad-hoc signing seals the bundle and immediately performs strict verification', () => {
  const calls = [];
  const run = (command, args) => calls.push([command, args]);
  const fsImpl = { existsSync: () => true };

  signAdHocMacApp('/tmp/Acorde Composer.app', {
    platform: 'darwin',
    run,
    fsImpl,
    entitlementsPath: '/tmp/entitlements.plist',
  });

  assert.deepEqual(calls, [
    ['codesign', [
      '--force',
      '--deep',
      '--sign',
      '-',
      '--options',
      'runtime',
      '--timestamp=none',
      '--entitlements',
      '/tmp/entitlements.plist',
      '/tmp/Acorde Composer.app',
    ]],
    ['codesign', [
      '--verify',
      '--deep',
      '--strict',
      '--verbose=4',
      '/tmp/Acorde Composer.app',
    ]],
  ]);
});

test('strict bundle verification rejects non-macOS hosts before invoking codesign', () => {
  assert.throws(
    () => verifyMacAppBundle('/tmp/Acorde Composer.app', { platform: 'linux' }),
    /requires a macOS host/,
  );
});

test('DMG verification checks the image and the app copied into it', () => {
  const os = require('node:os');
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'acorde-dmg-signing-test-'));
  const dmgPath = path.join(tempRoot, 'Acorde.dmg');
  fs.writeFileSync(dmgPath, 'fixture');
  const calls = [];
  const run = (command, args) => {
    calls.push([command, args]);
    if (command === 'hdiutil' && args[0] === 'attach') {
      const mountPoint = args[args.indexOf('-mountpoint') + 1];
      fs.mkdirSync(path.join(mountPoint, 'Acorde Composer.app'));
    }
  };

  try {
    verifyMacDmg(dmgPath, 'Acorde Composer', { platform: 'darwin', run });
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }

  assert.deepEqual(calls[0], ['hdiutil', ['verify', dmgPath]]);
  assert.equal(calls[1][0], 'hdiutil');
  assert.equal(calls[1][1][0], 'attach');
  assert.equal(calls[2][0], 'codesign');
  assert.deepEqual(calls[2][1].slice(0, 4), ['--verify', '--deep', '--strict', '--verbose=4']);
  assert.equal(calls[3][0], 'hdiutil');
  assert.equal(calls[3][1][0], 'detach');
});

test('notarization supports a Keychain profile and both Apple credential strategies', () => {
  assert.deepEqual(notarizationCredentials({ ACORDE_NOTARY_KEYCHAIN_PROFILE: 'acorde-notary' }), { keychainProfile: 'acorde-notary' });
  assert.deepEqual(notarizationCredentials({ APPLE_API_KEY: '/secure/key.p8', APPLE_API_KEY_ID: 'ABC1234567', APPLE_API_ISSUER: 'issuer' }), { appleApiKey: '/secure/key.p8', appleApiKeyId: 'ABC1234567', appleApiIssuer: 'issuer' });
  assert.deepEqual(notarizationCredentials({ APPLE_ID: 'user@example.com', APPLE_APP_SPECIFIC_PASSWORD: 'app-password', APPLE_TEAM_ID: 'TEAMID' }), { appleId: 'user@example.com', appleIdPassword: 'app-password', teamId: 'TEAMID' });
  assert.equal(notarizationCredentials({}), null);
});

test('unsigned experimental builds disable notarization even when credentials exist', () => {
  assert.equal(notarizationIsDisabled({ ACORDE_DISABLE_NOTARIZATION: '1', ACORDE_NOTARY_KEYCHAIN_PROFILE: 'acorde-notary' }), true);
  assert.equal(notarizationIsDisabled({ ACORDE_NOTARY_KEYCHAIN_PROFILE: 'acorde-notary' }), false);
});

test('release DMG build refuses a missing macOS host, signing identity, or notarization credentials', () => {
  assert.deepEqual(assessMacosReleaseEnvironment({ platform: 'linux', env: {} }), { ready: false, diagnostics: ['macos-host-required', 'mac-signing-identity-missing', 'mac-notarization-credentials-missing'] });
  assert.deepEqual(assessMacosReleaseEnvironment({ platform: 'darwin', env: { CSC_NAME: 'Developer ID Application: Acorde', ACORDE_NOTARY_KEYCHAIN_PROFILE: 'acorde-notary' } }), { ready: true, diagnostics: [] });
});
