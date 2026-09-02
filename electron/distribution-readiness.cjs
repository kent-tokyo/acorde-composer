function assessDistribution({ packageJson, platform, arch, env = {}, artifacts = [] } = {}) {
  const diagnostics = [];
  const targets = Array.isArray(packageJson?.build?.[platform]?.target) ? packageJson.build[platform].target : [packageJson?.build?.[platform]?.target].filter(Boolean);
  if (!packageJson?.build?.productName || packageJson.build.productName !== 'Acorde Composer') diagnostics.push('product-name-missing');
  if (!packageJson?.version) diagnostics.push('version-missing');
  if (!targets.length) diagnostics.push('target-missing');
  if (platform === 'mac' && !env.CSC_NAME && !env.CSC_LINK) diagnostics.push('mac-signing-identity-missing');
  if (platform === 'win' && !env.WIN_CSC_LINK && !env.WIN_CSC_KEY_PASSWORD) diagnostics.push('windows-signing-credentials-missing');
  if (!Array.isArray(artifacts) || artifacts.length === 0) diagnostics.push('artifacts-not-tested');
  return { platform, arch: arch || null, targets, signed: diagnostics.every((item) => !item.includes('signing')), ready: diagnostics.length === 0, diagnostics };
}

module.exports = { assessDistribution };
