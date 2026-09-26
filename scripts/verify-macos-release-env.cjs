const { notarizationCredentials, missingCredentialsMessage } = require('./notarize-mac.cjs');

function assessMacosReleaseEnvironment({ platform = process.platform, env = process.env } = {}) {
  const diagnostics = [];
  if (platform !== 'darwin') diagnostics.push('macos-host-required');
  if (!env.CSC_NAME && !env.CSC_LINK) diagnostics.push('mac-signing-identity-missing');
  if (!notarizationCredentials(env)) diagnostics.push('mac-notarization-credentials-missing');
  return { ready: diagnostics.length === 0, diagnostics };
}

if (require.main === module) {
  const result = assessMacosReleaseEnvironment();
  if (!result.ready) {
    process.stderr.write(`Cannot create a distributable macOS DMG: ${result.diagnostics.join(', ')}. ${missingCredentialsMessage()}\n`);
    process.exitCode = 1;
  }
}

module.exports = { assessMacosReleaseEnvironment };
