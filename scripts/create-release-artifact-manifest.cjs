const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { assessArtifactEvidence, createArtifactManifest, verifyArtifactManifest } = require('../electron/distribution-readiness.cjs');
const asar = require('@electron/asar');

function sha256File(filePath) { return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex'); }
function filesUnder(root) {
  const result = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
    const absolute = path.join(root, entry.name);
    if (entry.isDirectory()) result.push(...filesUnder(absolute));
    else if (entry.isFile()) result.push({ path: path.relative(root, absolute).split(path.sep).join('/'), sha256: sha256File(absolute) });
  }
  return result;
}
function directoryDigest(root) { return crypto.createHash('sha256').update(JSON.stringify(filesUnder(root))).digest('hex'); }
function containsNotice(root) {
  const bundles = fs.readdirSync(root, { withFileTypes: true }).filter((entry) => entry.isDirectory() && entry.name.endsWith('.app')).map((entry) => path.join(root, entry.name, 'Contents', 'Resources', 'app.asar'));
  return bundles.some((bundle) => { try { return asar.listPackage(bundle).includes('/NOTICE.md'); } catch { return false; } }) || fs.existsSync(path.join(root, 'resources', 'app', 'NOTICE.md'));
}
function createReleaseArtifactManifest({ distDir = path.resolve('dist'), version, commit = null } = {}) {
  const resolvedVersion = version || JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf8')).version;
  const resolvedCommit = commit || execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  const outputEntries = fs.existsSync(distDir) ? fs.readdirSync(distDir, { withFileTypes: true }).filter((entry) => entry.isDirectory() && entry.name !== 'release-evidence') : [];
  const unpacked = outputEntries.filter((entry) => entry.name.endsWith('-unpacked'));
  const artifactRoots = (unpacked.length ? unpacked : outputEntries.filter((entry) => /^(mac|win|linux)-/.test(entry.name))).map((entry) => path.join(distDir, entry.name)).sort();
  const evidenceDir = path.join(distDir, 'release-evidence');
  fs.mkdirSync(evidenceDir, { recursive: true });
  fs.writeFileSync(path.join(evidenceDir, 'sbom.json'), JSON.stringify({ format: 'cyclonedx-lite', product: 'Acorde Composer', version: resolvedVersion, lockfileSha256: sha256File(path.resolve('package-lock.json')) }, null, 2) + '\n');
  fs.writeFileSync(path.join(evidenceDir, 'provenance.json'), JSON.stringify({ product: 'Acorde Composer', version: resolvedVersion, commit: resolvedCommit, generatedBy: 'create-release-artifact-manifest' }, null, 2) + '\n');
  const artifacts = artifactRoots.map((root) => ({ name: path.basename(root), sha256: directoryDigest(root), sbom: true, notice: containsNotice(root), provenance: true }));
  const manifest = createArtifactManifest({ version: resolvedVersion, commit: resolvedCommit, artifacts });
  fs.writeFileSync(path.join(distDir, 'release-artifact-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

if (require.main === module) {
  const manifest = createReleaseArtifactManifest();
  const evidence = assessArtifactEvidence(manifest.artifacts);
  const ready = manifest.artifacts.length > 0 && evidence.ready && verifyArtifactManifest(manifest).valid;
  process.stdout.write(`${JSON.stringify({ ready, digest: manifest.digest, artifacts: manifest.artifacts.length, diagnostics: evidence.diagnostics })}\n`);
  if (!ready) process.exitCode = 1;
}

module.exports = { createReleaseArtifactManifest, directoryDigest, filesUnder };
