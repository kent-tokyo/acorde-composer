const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const gitignore = fs.readFileSync(path.join(root, '.gitignore'), 'utf8').split(/\r?\n/);
const engineSource = fs.readFileSync(path.join(root, 'engine/src/main.rs'), 'utf8');

test('release metadata identifies the Acorde Composer v0.1.10 release', () => {
  assert.equal(packageJson.name, 'acorde-composer');
  assert.equal(packageJson.version, '0.1.10');
  assert.notEqual(packageJson.private, true);
  assert.equal(packageJson.build.productName, 'Acorde Composer');
  assert.ok(packageJson.build.files.includes('electron/**/*'));
  assert.ok(packageJson.build.files.includes('src/**/*'));
  assert.ok(packageJson.build.files.includes('NOTICE.md'));
  assert.ok(packageJson.build.files.includes('README_ja.md'));
  assert.ok(packageJson.build.files.includes('README_zh.md'));
  assert.ok(fs.existsSync(path.join(root, 'NOTICE.md')));
});

test('internal roadmap and generated artifacts stay out of the repository', () => {
  assert.ok(gitignore.includes('ROADMAP.md'));
  assert.ok(gitignore.includes('engine/target/'));
  assert.ok(gitignore.includes('node_modules/'));
  assert.ok(fs.existsSync(path.join(root, 'package-lock.json')));
  assert.ok(fs.existsSync(path.join(root, 'qa', 'notation-coverage-matrix.json')));
});

test('engine IPC rejects malformed output and isolates the broken child process', () => {
  const main = fs.readFileSync(path.join(root, 'electron/main.cjs'), 'utf8');
  assert.match(main, /acorde engine returned invalid JSON/);
  assert.match(main, /child\.kill\(\)/);
  assert.match(main, /stdin failed/);
  assert.match(main, /MAX_PENDING_ENGINE_REQUESTS = 64/);
  assert.match(main, /request queue is full/);
});

test('engine exits cleanly when the parent closes its stdout pipe', () => {
  assert.match(engineSource, /serde_json::to_writer\(&mut stdout, &response\)\.is_err\(\)/);
  assert.match(engineSource, /stdout\.write_all\(b"\\n"\)\.is_err\(\)/);
  assert.match(engineSource, /stdout\.flush\(\)\.is_err\(\)/);
  assert.match(engineSource, /\{\s*break;\s*\}/);
  assert.doesNotMatch(engineSource, /expect\("write response"\)/);
});

test('engine benchmark bounds iterations and rejects child termination', () => {
  const benchmark = fs.readFileSync(path.join(root, 'scripts/benchmark-engine.cjs'), 'utf8');
  assert.match(benchmark, /requestedIterations < 3 \|\| requestedIterations > 1000/);
  assert.match(benchmark, /engine exited before completing the benchmark/);
});

test('SoundFont playback stays behind an explicit resolved-zone IPC boundary', () => {
  const main = fs.readFileSync(path.join(root, 'electron/main.cjs'), 'utf8');
  const preload = fs.readFileSync(path.join(root, 'electron/preload.cjs'), 'utf8');
  assert.match(main, /soundfont:attachResolvedSample/);
  assert.match(preload, /attachResolvedSample/);
});

test('external provider configuration stays behind a normalized IPC boundary', () => {
  const main = fs.readFileSync(path.join(root, 'electron/main.cjs'), 'utf8');
  const preload = fs.readFileSync(path.join(root, 'electron/preload.cjs'), 'utf8');
  assert.match(main, /provider:assessConfig/);
  assert.match(preload, /assessProviderConfig/);
});
