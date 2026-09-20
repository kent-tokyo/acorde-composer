const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const readline = require('node:readline');

const root = path.resolve(__dirname, '..');
const matrix = JSON.parse(fs.readFileSync(path.join(root, 'qa/notation-coverage-matrix.json'), 'utf8'));

function startEngine() {
  const child = spawn('cargo', ['run', '--quiet', '--manifest-path', path.join(root, 'engine/Cargo.toml')], { cwd: root, stdio: ['pipe', 'pipe', 'pipe'] });
  const pending = [];
  const fail = (error) => { while (pending.length) pending.shift().reject(error); };
  readline.createInterface({ input: child.stdout }).on('line', (line) => {
    const request = pending.shift();
    if (!request) return;
    try { const response = JSON.parse(line); response.ok ? request.resolve(response.result) : request.reject(new Error(response.error || 'engine request failed')); }
    catch (error) { request.reject(error); }
  });
  child.on('error', fail); child.on('exit', () => fail(new Error('notation verification engine exited')));
  return { call: (request) => new Promise((resolve, reject) => { pending.push({ resolve, reject }); child.stdin.write(`${JSON.stringify(request)}\n`); }), close: () => child.stdin.end() };
}

(async () => {
  const engine = startEngine();
  const results = [];
  try {
    for (const element of matrix.elements) {
      try {
        const fixturePath = path.resolve(root, element.fixturePath);
        const xml = fs.readFileSync(fixturePath, 'utf8');
        const first = await engine.call({ op: 'parse_musicxml_report', xml });
        const serialized = await engine.call({ op: 'serialize_musicxml_report', score: first.score });
        const second = await engine.call({ op: 'parse_musicxml_report', xml: serialized.output });
        const svg = await engine.call({ op: 'render_svg', score: second.score, width: 1200, interactive: true });
        if (!svg.includes('<svg')) throw new Error('SVG root is missing');
        results.push({ id: element.id, fixturePath: element.fixturePath, parseDiagnostics: first.diagnostics.length, serializeDiagnostics: serialized.diagnostics.length, reparseDiagnostics: second.diagnostics.length, interactiveNoteGeometry: svg.includes('data-acorde-kind="note"'), svgBytes: Buffer.byteLength(svg) });
      } catch (error) { throw new Error(`${element.id}: ${error.message}`); }
    }
    process.stdout.write(`${JSON.stringify({ schemaVersion: 1, valid: true, elementCount: results.length, results })}\n`);
  } finally { engine.close(); }
})().catch((error) => { process.stderr.write(`notation round-trip verification failed: ${error.message}\n`); process.exitCode = 1; });
