const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const configPath = path.resolve(process.argv[2] || 'qa/performance-benchmark.json');
const outputPath = path.resolve(process.argv[3] || 'qa/performance-benchmark-results.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const profiles = [];

for (const profile of config.profiles) {
  const result = spawnSync(process.execPath, [path.resolve(__dirname, 'benchmark-engine.cjs'), profile.fixturePath, String(profile.minIterations)], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  if (result.status !== 0) throw new Error(`benchmark failed: ${profile.id}`);
  const lines = result.stdout.trim().split('\n').filter(Boolean);
  const measured = JSON.parse(lines.at(-1));
  profiles.push({ id: profile.id, fixturePath: profile.fixturePath, iterations: measured.iterations, engine_identity: measured.engine_identity, parse_ms: measured.parse_ms, load_ms: measured.load_ms, render_ms: measured.render_ms, serialize_ms: measured.serialize_ms, harness_memory: measured.harness_memory, harness_cpu: measured.harness_cpu });
}

const engineIdentity = profiles[0]?.engine_identity || null;
if (!engineIdentity || profiles.some((profile) => JSON.stringify(profile.engine_identity) !== JSON.stringify(engineIdentity))) throw new Error('benchmark profiles used different engine identities');
const report = { schemaVersion: 2, engine: config.engine, engine_identity: engineIdentity, environment: { platform: process.platform, arch: process.arch, os_release: os.release(), node: process.version }, profiles };
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({ outputPath, profileCount: profiles.length })}\n`);
