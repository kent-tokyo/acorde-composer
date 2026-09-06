const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const readline = require('node:readline');
const { performance } = require('node:perf_hooks');

const root = path.resolve(__dirname, '..');
const inputPath = path.resolve(process.argv[2] || 'qa/fixtures/performance/1000-measures.musicxml');
const iterations = Number(process.argv[3] || 3);
const outputPath = path.resolve(process.argv[4] || 'qa/performance-render-results.json');
if (!Number.isInteger(iterations) || iterations < 3 || iterations > 100) throw new Error('iterations must be an integer from 3 to 100');
const xml = fs.readFileSync(inputPath, 'utf8');
const packagedEngine = path.join(root, 'build', 'engine', `acorde-composer-engine${process.platform === 'win32' ? '.exe' : ''}`);
const command = fs.existsSync(packagedEngine) ? packagedEngine : 'cargo';
const args = fs.existsSync(packagedEngine) ? [] : ['run', '--quiet', '--manifest-path', path.join(root, 'engine', 'Cargo.toml')];
const child = spawn(command, args, { cwd: root, stdio: ['pipe', 'pipe', 'inherit'] });
const pending = [];
const output = readline.createInterface({ input: child.stdout });
output.on('line', (line) => {
  const item = pending.shift();
  if (!item) return;
  try {
    const response = JSON.parse(line);
    response.ok ? item.resolve(response.result) : item.reject(new Error(response.error || 'engine request failed'));
  } catch (error) { item.reject(error); }
});
const call = (request) => new Promise((resolve, reject) => { pending.push({ resolve, reject }); child.stdin.write(`${JSON.stringify(request)}\n`); });
const failPending = (message) => { while (pending.length) pending.shift().reject(new Error(message)); };
child.on('error', (error) => failPending(`engine failed to start: ${error.message}`));
child.on('exit', () => failPending('engine exited before completing the benchmark'));
const elapsed = (start) => performance.now() - start;
const summarize = (values) => { const sorted = values.slice().sort((left, right) => left - right); const percentile = (fraction) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))]; return { p50: Number(percentile(0.5).toFixed(3)), p95: Number(percentile(0.95).toFixed(3)), max: Number(sorted.at(-1).toFixed(3)) }; };

(async () => {
  const metrics = { layout_ms: [], svg_ms: [], svg_metadata_ms: [], repeat_render_ms: [] };
  let score;
  for (let index = 0; index < iterations; index += 1) {
    score = score || await call({ op: 'parse_musicxml_report', xml }).then((result) => result.score);
    let start = performance.now();
    await call({ op: 'layout', score, measures_per_row: 4 });
    metrics.layout_ms.push(elapsed(start));
    start = performance.now();
    await call({ op: 'render_svg', score, width: 900, measures_per_system: 4, interactive: true });
    metrics.svg_ms.push(elapsed(start));
    start = performance.now();
    await call({ op: 'render_svg_metadata', score, width: 900, measures_per_system: 4, interactive: true });
    metrics.svg_metadata_ms.push(elapsed(start));
    start = performance.now();
    await call({ op: 'render_svg', score, width: 900, measures_per_system: 4, interactive: true });
    metrics.repeat_render_ms.push(elapsed(start));
  }
  const report = { schemaVersion: 1, engine: 'acorde@1.1.2', fixturePath: path.relative(root, inputPath), iterations, layout_ms: summarize(metrics.layout_ms), svg_ms: summarize(metrics.svg_ms), svg_metadata_ms: summarize(metrics.svg_metadata_ms), repeat_render_ms: summarize(metrics.repeat_render_ms) };
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({ outputPath, iterations, layout_ms: report.layout_ms, svg_ms: report.svg_ms, svg_metadata_ms: report.svg_metadata_ms, repeat_render_ms: report.repeat_render_ms })}\n`);
  child.stdin.end();
})().catch((error) => { process.stderr.write(`render pipeline benchmark failed: ${error.message}\n`); child.kill(); process.exitCode = 1; });
