const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { performance } = require('node:perf_hooks');

const root = path.resolve(__dirname, '..');
const inputPath = path.resolve(process.argv[2] || 'qa/fixtures/performance/100-measures.musicxml');
const iterations = Number(process.argv[3] || 3);
const outputPath = path.resolve(process.argv[4] || 'qa/performance-cold-start-results.json');
if (!Number.isInteger(iterations) || iterations < 3 || iterations > 100) throw new Error('iterations must be an integer from 3 to 100');
const xml = fs.readFileSync(inputPath, 'utf8');
const packagedEngine = path.join(root, 'build', 'engine', `acorde-composer-engine${process.platform === 'win32' ? '.exe' : ''}`);
const command = fs.existsSync(packagedEngine) ? packagedEngine : 'cargo';
const args = fs.existsSync(packagedEngine) ? [] : ['run', '--quiet', '--manifest-path', path.join(root, 'engine', 'Cargo.toml')];
const samples = [];
for (let index = 0; index < iterations; index += 1) {
  const start = performance.now();
  const result = spawnSync(command, args, { cwd: root, input: `${JSON.stringify({ op: 'parse_musicxml_report', xml })}\n`, encoding: 'utf8', timeout: 120000 });
  if (result.status !== 0) throw new Error(`cold start failed on iteration ${index + 1}: ${result.stderr || result.error?.message || result.status}`);
  const response = JSON.parse(result.stdout.trim().split('\n').at(-1));
  if (!response.ok) throw new Error(`cold start engine request failed: ${response.error || 'unknown error'}`);
  samples.push(performance.now() - start);
}
const sorted = samples.slice().sort((left, right) => left - right);
const percentile = (fraction) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))];
const summary = { p50: Number(percentile(0.5).toFixed(3)), p95: Number(percentile(0.95).toFixed(3)), max: Number(sorted.at(-1).toFixed(3)) };
const report = { schemaVersion: 1, engine: 'acorde@1.1.7', fixturePath: path.relative(root, inputPath), iterations, cold_start_ms: summary };
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({ outputPath, iterations, cold_start_ms: summary })}\n`);
