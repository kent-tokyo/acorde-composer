const fs = require('node:fs');
const path = require('node:path');

const METRICS = ['parse_ms', 'load_ms', 'render_ms', 'serialize_ms'];

function validatePerformanceResults(inputPath = path.resolve('qa/performance-benchmark-results.json')) {
  const input = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const errors = [];
  if (input?.schemaVersion !== 1) errors.push('schemaVersion must be 1');
  if (input?.engine !== 'acorde@1.1.7') errors.push('engine must be pinned to acorde@1.1.7');
  if (!Array.isArray(input?.profiles) || input.profiles.length === 0) errors.push('profiles must be non-empty');
  const ids = new Set();
  for (const profile of Array.isArray(input?.profiles) ? input.profiles : []) {
    if (!profile || typeof profile !== 'object' || typeof profile.id !== 'string' || profile.id.length === 0) {
      errors.push('profile id is required');
      continue;
    }
    if (ids.has(profile.id)) errors.push(`duplicate profile id: ${profile.id}`);
    ids.add(profile.id);
    if (typeof profile.fixturePath !== 'string' || path.isAbsolute(profile.fixturePath)) errors.push(`fixturePath must be relative: ${profile.id}`);
    if (!Number.isInteger(profile.iterations) || profile.iterations < 3) errors.push(`iterations is invalid: ${profile.id}`);
    for (const metric of METRICS) {
      const values = profile[metric];
      if (!values || typeof values !== 'object' || !['p50', 'p95', 'max'].every((key) => Number.isFinite(values[key]) && values[key] >= 0)) {
        errors.push(`${metric} summary is invalid: ${profile.id}`);
      }
    }
    if (!profile.harness_memory || !Number.isInteger(profile.harness_memory.rss_before_bytes) || !Number.isInteger(profile.harness_memory.rss_after_bytes) || !Number.isInteger(profile.harness_memory.rss_delta_bytes)) errors.push(`harness memory evidence is invalid: ${profile.id}`);
    if (!profile.harness_cpu || !Number.isInteger(profile.harness_cpu.user_us) || !Number.isInteger(profile.harness_cpu.system_us) || profile.harness_cpu.user_us < 0 || profile.harness_cpu.system_us < 0) errors.push(`harness CPU evidence is invalid: ${profile.id}`);
  }
  return { valid: errors.length === 0, profileCount: Array.isArray(input?.profiles) ? input.profiles.length : 0, errors };
}

if (require.main === module) {
  try {
    const result = validatePerformanceResults(path.resolve(process.argv[2] || 'qa/performance-benchmark-results.json'));
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    if (!result.valid) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`performance results validation failed: ${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = { validatePerformanceResults, METRICS };
