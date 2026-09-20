const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ENGINE_IDENTITY_SCHEMA_VERSION = 1;
function sha256File(file) { return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'); }
function enginePaths(root = path.resolve(__dirname, '..')) {
  const binary = path.join(root, 'build', 'engine', `acorde-composer-engine${process.platform === 'win32' ? '.exe' : ''}`);
  return { binary, manifest: `${binary}.identity.json` };
}
function isClean(root) { return execFileSync('git', ['-C', root, 'status', '--porcelain'], { encoding: 'utf8' }).trim().length === 0; }
function createEngineIdentity({ root = path.resolve(__dirname, '..'), binary = enginePaths(root).binary, commit = null, clean = null } = {}) {
  return { schemaVersion: ENGINE_IDENTITY_SCHEMA_VERSION, product: 'Acorde Composer', commit: commit || execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), clean: clean ?? isClean(root), binary: path.relative(root, binary).split(path.sep).join('/'), sha256: sha256File(binary) };
}
function verifyEngineIdentity({ root = path.resolve(__dirname, '..'), binary = enginePaths(root).binary, manifest = enginePaths(root).manifest, commit = null, currentClean = null } = {}) {
  const diagnostics = [];
  if (!fs.existsSync(binary)) diagnostics.push('engine-binary-missing');
  if (!fs.existsSync(manifest)) diagnostics.push('engine-identity-missing');
  if (diagnostics.length) return { valid: false, diagnostics };
  const value = JSON.parse(fs.readFileSync(manifest, 'utf8'));
  const expectedCommit = commit || execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  if (value.schemaVersion !== ENGINE_IDENTITY_SCHEMA_VERSION) diagnostics.push('engine-identity-schema-invalid');
  if (value.product !== 'Acorde Composer') diagnostics.push('engine-identity-product-invalid');
  if (value.commit !== expectedCommit) diagnostics.push('engine-identity-stale-commit');
  if (value.clean !== true || !(currentClean ?? isClean(root))) diagnostics.push('engine-identity-source-dirty');
  if (value.binary !== path.relative(root, binary).split(path.sep).join('/')) diagnostics.push('engine-identity-binary-path-invalid');
  if (value.sha256 !== sha256File(binary)) diagnostics.push('engine-identity-binary-digest-mismatch');
  return { valid: diagnostics.length === 0, diagnostics, identity: value };
}
function verifiedEngineBinary(options = {}) {
  const paths = enginePaths(options.root);
  const verification = verifyEngineIdentity({ ...options, ...paths });
  if (!verification.valid) throw new Error(`verified packaged engine required: ${verification.diagnostics.join(',')}`);
  return { binary: paths.binary, identity: verification.identity };
}
module.exports = { ENGINE_IDENTITY_SCHEMA_VERSION, createEngineIdentity, enginePaths, isClean, verifiedEngineBinary, verifyEngineIdentity };
