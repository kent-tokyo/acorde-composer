const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const readline = require('node:readline');
const { performance } = require('node:perf_hooks');

const root = path.resolve(__dirname, '..');
const inputPath = path.resolve(process.argv[2] || path.join(root, 'qa/fixtures/multivoice-ui.musicxml'));
const requestedIterations = Number(process.argv[3] || 20);
if (!Number.isInteger(requestedIterations) || requestedIterations < 3 || requestedIterations > 1000) throw new Error('iterations must be an integer from 3 to 1000');
const iterations = requestedIterations;
const xml = fs.readFileSync(inputPath, 'utf8');
const packagedEngine = path.join(root, 'build', 'engine', `acorde-composer-engine${process.platform === 'win32' ? '.exe' : ''}`);
const command = fs.existsSync(packagedEngine) ? packagedEngine : 'cargo';
const args = fs.existsSync(packagedEngine) ? [] : ['run', '--quiet', '--manifest-path', path.join(root, 'engine', 'Cargo.toml')];
const child = spawn(command, args, { cwd: root, stdio: ['pipe', 'pipe', 'inherit'] });
const pending = [];
const failPending = (message) => { while (pending.length) pending.shift().reject(new Error(message)); };
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
child.on('error', (error) => failPending(`engine failed to start: ${error.message}`));
child.on('exit', () => failPending('engine exited before completing the benchmark'));
const percentile = (values, fraction) => values[Math.min(values.length - 1, Math.floor(values.length * fraction))];
const elapsed = (start) => performance.now() - start;
const summarize = (values) => { const sorted = values.slice().sort((left, right) => left - right); return { p50: Number(percentile(sorted, 0.5).toFixed(3)), p95: Number(percentile(sorted, 0.95).toFixed(3)), max: Number(sorted.at(-1).toFixed(3)) }; };

(async () => {
  const samples = { parse: [], load: [], render: [] };
  for (let index = 0; index < iterations; index += 1) {
    let start = performance.now();
    const parsed = await call({ op: 'parse_musicxml_report', xml });
    samples.parse.push(elapsed(start));
    start = performance.now();
    await call({ op: 'load_score', score: parsed.score });
    samples.load.push(elapsed(start));
    start = performance.now();
    await call({ op: 'render_current', width: 900 });
    samples.render.push(elapsed(start));
  }
  process.stdout.write(JSON.stringify({ input: path.relative(root, inputPath), iterations, parse_ms: summarize(samples.parse), load_ms: summarize(samples.load), render_ms: summarize(samples.render) }) + '\n');
  child.stdin.end();
})().catch((error) => { process.stderr.write(`benchmark failed: ${error.message}\n`); child.kill(); process.exitCode = 1; });
