function assessDistribution({ packageJson, platform, arch, env = {}, artifacts = [] } = {}) {
  const diagnostics = [];
  const targets = Array.isArray(packageJson?.build?.[platform]?.target) ? packageJson.build[platform].target : [packageJson?.build?.[platform]?.target].filter(Boolean);
  if (!packageJson?.build?.productName || packageJson.build.productName !== 'Acorde Composer') diagnostics.push('product-name-missing');
  if (!packageJson?.version) diagnostics.push('version-missing');
  if (!targets.length) diagnostics.push('target-missing');
  const signingDiagnostics = [];
  if (platform === 'mac' && !env.CSC_NAME && !env.CSC_LINK) signingDiagnostics.push('mac-signing-identity-missing');
  if (platform === 'win' && (!env.WIN_CSC_LINK || !env.WIN_CSC_KEY_PASSWORD)) signingDiagnostics.push('windows-signing-credentials-missing');
  diagnostics.push(...signingDiagnostics);
  if (!Array.isArray(artifacts) || artifacts.length === 0) diagnostics.push('artifacts-not-tested');
  return { platform, arch: arch || null, targets, signed: signingDiagnostics.length === 0, ready: diagnostics.length === 0, diagnostics };
}

function assessArtifactEvidence(artifacts = []) {
  if (!Array.isArray(artifacts) || artifacts.length === 0) return { ready: false, total: 0, valid: 0, diagnostics: ['artifacts-missing'] };
  const diagnostics = [];
  artifacts.forEach((artifact, index) => {
    const label = artifact && typeof artifact.name === 'string' ? artifact.name : `artifact-${index + 1}`;
    if (!artifact || typeof artifact !== 'object' || !artifact.name) diagnostics.push(`${label}:name-missing`);
    if (typeof artifact?.sha256 !== 'string' || !/^[a-f0-9]{64}$/i.test(artifact.sha256)) diagnostics.push(`${label}:sha256-invalid`);
    for (const field of ['sbom', 'notice', 'provenance']) if (artifact?.[field] !== true) diagnostics.push(`${label}:${field}-missing`);
  });
  return { ready: diagnostics.length === 0, total: artifacts.length, valid: artifacts.length - new Set(diagnostics.map((item) => item.split(':')[0])).size, diagnostics };
}

const QA_SCENARIOS = Object.freeze([
  'install-launch', 'new-open-edit', 'multiple-voice-roundtrip', 'playback-mixer', 'musicxml-midi-export',
  'soundfont-absent-fallback', 'providers-disabled', 'read-only-directory', 'missing-sidecar-recovery', 'uninstall-upgrade',
]);

function createDistributionQaMatrix({ platforms = ['mac', 'win'], architectures = { mac: ['arm64', 'x64'], win: ['x64'] } } = {}) {
  return platforms.flatMap((platform) => (architectures[platform] || ['unknown']).map((arch) => ({ platform, arch, scenarios: QA_SCENARIOS.map((id) => ({ id, status: 'not-run', diagnostics: [] })) })));
}

function assessDistributionQa(matrix, results = []) {
  const expected = new Set(matrix.flatMap((target) => target.scenarios.map((scenario) => `${target.platform}/${target.arch}/${scenario.id}`)));
  const invalid = []; const duplicates = []; const observed = new Map();
  results.forEach((result) => {
    const key = result && `${result.platform}/${result.arch}/${result.scenario}`;
    if (!result || !expected.has(key) || !['passed', 'failed', 'not-run'].includes(result.status)) { invalid.push(key || 'result-invalid'); return; }
    if (observed.has(key)) duplicates.push(key);
    observed.set(key, result);
  });
  const missing = [...expected].filter((key) => !observed.has(key));
  const failed = [...observed.values()].filter((result) => result.status !== 'passed').map((result) => `${result.platform}/${result.arch}/${result.scenario}`);
  return { ready: missing.length === 0 && failed.length === 0 && invalid.length === 0 && duplicates.length === 0, total: expected.size, passed: [...observed.values()].filter((result) => result.status === 'passed').length, missing, failed, invalid, duplicates };
}

module.exports = { QA_SCENARIOS, assessArtifactEvidence, assessDistribution, assessDistributionQa, createDistributionQaMatrix };
