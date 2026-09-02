const { spawn } = require('node:child_process');

const MAX_PROVIDER_OUTPUT_BYTES = 4 * 1024 * 1024;
const MAX_PROVIDER_INPUT_BYTES = 512 * 1024;
const MAX_PROVIDER_TIMEOUT_MS = 60 * 1000;

function runJsonProvider({ executable, args = [], request, timeoutMs = 10 * 1000, maxOutputBytes = MAX_PROVIDER_OUTPUT_BYTES, spawnImpl = spawn } = {}) {
  if (typeof executable !== 'string' || executable.length === 0) return Promise.resolve({ status: 'failed', error: 'provider-missing' });
  let serializedRequest;
  try { serializedRequest = JSON.stringify(request ?? {}); } catch { return Promise.resolve({ status: 'failed', error: 'provider-input-invalid' }); }
  if (Buffer.byteLength(serializedRequest, 'utf8') > MAX_PROVIDER_INPUT_BYTES) return Promise.resolve({ status: 'failed', error: 'provider-input-too-large' });
  const safeTimeout = Number.isFinite(timeoutMs) ? Math.max(1, Math.min(MAX_PROVIDER_TIMEOUT_MS, Math.round(timeoutMs))) : 10 * 1000;
  const safeLimit = Number.isSafeInteger(maxOutputBytes) ? Math.max(1024, Math.min(MAX_PROVIDER_OUTPUT_BYTES, maxOutputBytes)) : MAX_PROVIDER_OUTPUT_BYTES;
  return new Promise((resolve) => {
    let child;
    try { child = spawnImpl(executable, Array.isArray(args) ? args.slice(0, 32).map(String) : [], { stdio: ['pipe', 'pipe', 'pipe'], shell: false }); } catch { resolve({ status: 'failed', error: 'provider-spawn-failed' }); return; }
    let output = ''; let bytes = 0; let settled = false; let timer;
    const finish = (result) => { if (settled) return; settled = true; clearTimeout(timer); try { child.kill(); } catch {} resolve(result); };
    child.stdout?.on('data', (chunk) => {
      bytes += Buffer.byteLength(chunk);
      if (bytes > safeLimit) finish({ status: 'failed', error: 'provider-output-too-large' });
      else output += chunk.toString('utf8');
    });
    child.on('error', () => finish({ status: 'failed', error: 'provider-failed' }));
    child.on('close', (code) => {
      if (settled) return;
      if (code !== 0) { finish({ status: 'failed', error: 'provider-failed' }); return; }
      try { finish({ status: 'success', body: JSON.parse(output) }); } catch { finish({ status: 'failed', error: 'provider-invalid-json' }); }
    });
    timer = setTimeout(() => finish({ status: 'timeout', error: 'provider-timeout' }), safeTimeout);
    try { child.stdin.end(serializedRequest); } catch { finish({ status: 'failed', error: 'provider-input-failed' }); }
  });
}

module.exports = { MAX_PROVIDER_INPUT_BYTES, MAX_PROVIDER_OUTPUT_BYTES, MAX_PROVIDER_TIMEOUT_MS, runJsonProvider };
