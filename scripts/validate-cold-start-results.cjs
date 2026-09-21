const fs = require('node:fs');
const path = require('node:path');
const { validEngineIdentity, validEnvironment } = require('./validate-performance-results.cjs');

function validateColdStartResults(inputPath = path.resolve('qa/performance-cold-start-results.json')) {
  const input = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const errors = [];
  if (![1, 2].includes(input?.schemaVersion)) errors.push('schemaVersion must be 1 or 2');
  if (input?.engine !== 'acorde@1.2.0') errors.push('engine must be pinned to acorde@1.2.0');
  if (typeof input?.fixturePath !== 'string' || path.isAbsolute(input.fixturePath)) errors.push('fixturePath must be relative');
  if (!Number.isInteger(input?.iterations) || input.iterations < 3) errors.push('iterations must be at least 3');
  if (input?.schemaVersion === 2 && !validEngineIdentity(input.engine_identity)) errors.push('engine identity is invalid');
  if (input?.schemaVersion === 2 && !validEnvironment(input.environment)) errors.push('environment is invalid');
  const summary = input?.cold_start_ms;
  if (!summary || !['p50', 'p95', 'max'].every((key) => Number.isFinite(summary[key]) && summary[key] >= 0)) errors.push('cold_start_ms summary is invalid');
  return { valid: errors.length === 0, errors };
}

if (require.main === module) {
  try {
    const result = validateColdStartResults(path.resolve(process.argv[2] || 'qa/performance-cold-start-results.json'));
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    if (!result.valid) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`cold start results validation failed: ${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = { validateColdStartResults };
