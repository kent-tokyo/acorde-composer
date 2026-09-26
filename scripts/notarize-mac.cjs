const fs = require('node:fs');
const path = require('node:path');
const { notarize } = require('@electron/notarize');

function notarizationCredentials(env = process.env) {
  if (env.ACORDE_NOTARY_KEYCHAIN_PROFILE) return { keychainProfile: env.ACORDE_NOTARY_KEYCHAIN_PROFILE };
  if (env.APPLE_API_KEY && env.APPLE_API_KEY_ID && env.APPLE_API_ISSUER) {
    return { appleApiKey: env.APPLE_API_KEY, appleApiKeyId: env.APPLE_API_KEY_ID, appleApiIssuer: env.APPLE_API_ISSUER };
  }
  if (env.APPLE_ID && env.APPLE_APP_SPECIFIC_PASSWORD && env.APPLE_TEAM_ID) {
    return { appleId: env.APPLE_ID, appleIdPassword: env.APPLE_APP_SPECIFIC_PASSWORD, teamId: env.APPLE_TEAM_ID };
  }
  return null;
}

function missingCredentialsMessage() {
  return 'macOS notarization credentials are required: set ACORDE_NOTARY_KEYCHAIN_PROFILE, or APPLE_API_KEY + APPLE_API_KEY_ID + APPLE_API_ISSUER, or APPLE_ID + APPLE_APP_SPECIFIC_PASSWORD + APPLE_TEAM_ID.';
}

async function notarizeMac(context) {
  if (context.electronPlatformName !== 'darwin') return;
  const credentials = notarizationCredentials();
  if (!credentials) {
    if (process.env.ACORDE_REQUIRE_NOTARIZATION === '1') throw new Error(missingCredentialsMessage());
    process.stdout.write(`Skipping macOS notarization: ${missingCredentialsMessage()}\n`);
    return;
  }
  const appPath = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`);
  if (!fs.existsSync(appPath)) throw new Error(`Packaged macOS application was not found: ${appPath}`);
  await notarize({ appPath, ...credentials });
}

module.exports = notarizeMac;
module.exports.default = notarizeMac;
module.exports.notarizationCredentials = notarizationCredentials;
module.exports.missingCredentialsMessage = missingCredentialsMessage;
