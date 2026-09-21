const fs = require('node:fs');
const path = require('node:path');

function validSummary(value) { return value && ['p50', 'p95', 'max'].every((key) => Number.isFinite(value[key]) && value[key] >= 0); }
function validatePlaybackResults(inputPath = path.resolve('qa/performance-playback-results.json')) {
  const input = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const errors = [];
  if (input?.schemaVersion !== 1) errors.push('schemaVersion must be 1');
  if (input?.engine !== 'acorde@1.2.0') errors.push('engine must be pinned to acorde@1.2.0');
  if (typeof input?.fixturePath !== 'string' || path.isAbsolute(input.fixturePath)) errors.push('fixturePath must be relative');
  if (!Number.isInteger(input?.iterations) || input.iterations < 3) errors.push('iterations must be at least 3');
  if (!Number.isInteger(input?.eventCount) || input.eventCount < 0) errors.push('eventCount must be non-negative');
  if (!validSummary(input?.parse_ms)) errors.push('parse_ms summary is invalid');
  if (!validSummary(input?.playback_ms)) errors.push('playback_ms summary is invalid');
  const memory = input?.harness_memory;
  if (!memory || !['rss_before_bytes', 'rss_after_bytes', 'rss_delta_bytes'].every((key) => Number.isInteger(memory[key]))) errors.push('harness_memory is invalid');
  return { valid: errors.length === 0, errors };
}

if (require.main === module) {
  try {
    const result = validatePlaybackResults(path.resolve(process.argv[2] || 'qa/performance-playback-results.json'));
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    if (!result.valid) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`playback results validation failed: ${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = { validatePlaybackResults };
