const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const gitignore = fs.readFileSync(path.join(root, '.gitignore'), 'utf8').split(/\r?\n/);

test('release metadata identifies the Acorde Composer v0.1.1 candidate', () => {
  assert.equal(packageJson.name, 'acorde-composer');
  assert.equal(packageJson.version, '0.1.1');
  assert.equal(packageJson.build.productName, 'Acorde Composer');
  assert.ok(packageJson.build.files.includes('electron/**/*'));
  assert.ok(packageJson.build.files.includes('src/**/*'));
});

test('internal roadmap and generated artifacts stay out of the repository', () => {
  assert.ok(gitignore.includes('ROADMAP.md'));
  assert.ok(gitignore.includes('engine/target/'));
  assert.ok(gitignore.includes('node_modules/'));
  assert.ok(fs.existsSync(path.join(root, 'package-lock.json')));
});
