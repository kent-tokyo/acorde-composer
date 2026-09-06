const fs = require('node:fs');
const path = require('node:path');

const METRICS = ['layout_ms', 'svg_ms', 'svg_metadata_ms', 'repeat_render_ms'];
function validateRenderResults(inputPath = path.resolve('qa/performance-render-results.json')) {
  const input = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const errors = [];
  if (input?.schemaVersion !== 1) errors.push('schemaVersion must be 1');
  if (input?.engine !== 'acorde@1.1.2') errors.push('engine must be pinned to acorde@1.1.2');
  if (typeof input?.fixturePath !== 'string' || path.isAbsolute(input.fixturePath)) errors.push('fixturePath must be relative');
  if (!Number.isInteger(input?.iterations) || input.iterations < 3) errors.push('iterations must be at least 3');
  for (const metric of METRICS) {
    const summary = input?.[metric];
    if (!summary || !['p50', 'p95', 'max'].every((key) => Number.isFinite(summary[key]) && summary[key] >= 0)) errors.push(`${metric} summary is invalid`);
  }
  return { valid: errors.length === 0, errors };
}

if (require.main === module) {
  try {
    const result = validateRenderResults(path.resolve(process.argv[2] || 'qa/performance-render-results.json'));
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    if (!result.valid) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`render results validation failed: ${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = { validateRenderResults };
