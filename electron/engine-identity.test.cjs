const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createEngineIdentity, enginePaths, verifyEngineIdentity } = require('../scripts/engine-identity.cjs');

test('engine identity binds a measured binary to one Composer commit', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'acorde-engine-identity-'));
  try {
    const { binary, manifest } = enginePaths(root);
    fs.mkdirSync(path.dirname(binary), { recursive: true });
    fs.writeFileSync(binary, 'engine-v1');
    fs.writeFileSync(manifest, `${JSON.stringify(createEngineIdentity({ root, binary, commit: 'be680d5', clean: true }))}\n`);
    assert.deepEqual(verifyEngineIdentity({ root, binary, manifest, commit: 'be680d5', currentClean: true }).diagnostics, []);
    assert.ok(verifyEngineIdentity({ root, binary, manifest, commit: 'abcdef0', currentClean: true }).diagnostics.includes('engine-identity-stale-commit'));
    fs.writeFileSync(binary, 'engine-v2');
    assert.ok(verifyEngineIdentity({ root, binary, manifest, commit: 'be680d5', currentClean: true }).diagnostics.includes('engine-identity-binary-digest-mismatch'));
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
