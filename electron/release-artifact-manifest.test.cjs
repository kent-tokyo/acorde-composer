const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createReleaseArtifactManifest } = require('../scripts/create-release-artifact-manifest.cjs');
const { verifyArtifactManifest } = require('./distribution-readiness.cjs');

test('pack manifest generation records deterministic artifact evidence', () => {
  const distDir = fs.mkdtempSync(path.join(os.tmpdir(), 'acorde-composer-dist-'));
  try {
    const appRoot = path.join(distDir, 'mac-arm64-unpacked', 'resources', 'app');
    fs.mkdirSync(appRoot, { recursive: true });
    fs.writeFileSync(path.join(appRoot, 'NOTICE.md'), 'Acorde Composer\n');
    fs.writeFileSync(path.join(appRoot, 'package.json'), '{}\n');
    const manifest = createReleaseArtifactManifest({ distDir, version: '0.1.6', commit: 'be680d5' });
    assert.equal(manifest.artifacts.length, 1);
    assert.equal(manifest.artifacts[0].notice, true);
    assert.equal(verifyArtifactManifest(manifest).valid, true);
    assert.ok(fs.existsSync(path.join(distDir, 'release-artifact-manifest.json')));
  } finally {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
});
