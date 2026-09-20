const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { createEngineIdentity, enginePaths } = require('./engine-identity.cjs');

const root = path.resolve(__dirname, '..');
const releaseDir = path.join(root, 'engine', 'target', 'release');
const sourceName = `acorde-composer-engine${process.platform === 'win32' ? '.exe' : ''}`;
const outputDir = path.join(root, 'build', 'engine');
const outputName = sourceName;

const result = spawnSync('cargo', ['build', '--release', '--manifest-path', path.join(root, 'engine', 'Cargo.toml')], { stdio: 'inherit' });
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status || 1);

const source = path.join(releaseDir, sourceName);
const destination = path.join(outputDir, outputName);
if (!fs.existsSync(source)) throw new Error(`Release engine binary was not produced: ${source}`);
fs.mkdirSync(outputDir, { recursive: true });
fs.copyFileSync(source, destination);
if (process.platform !== 'win32') fs.chmodSync(destination, 0o755);
const { manifest } = enginePaths(root);
fs.writeFileSync(manifest, `${JSON.stringify(createEngineIdentity({ root, binary: destination }), null, 2)}\n`);
process.stdout.write(`Prepared packaged acorde engine: ${path.relative(root, destination)}\n`);
