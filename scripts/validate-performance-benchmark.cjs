const fs = require('node:fs');
const path = require('node:path');

const REQUIRED_METRICS = new Set(['parse', 'load', 'render', 'serialize']);

function validatePerformanceBenchmark(inputPath = path.resolve('qa/performance-benchmark.json'), rootDir = process.cwd()) {
  const input = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const errors = [];
  if (input?.schemaVersion !== 1) errors.push('schemaVersion must be 1');
  if (input?.engine !== 'acorde@1.2.0') errors.push('engine must be pinned to acorde@1.2.0');
  if (!Array.isArray(input?.profiles) || input.profiles.length === 0) errors.push('profiles must be non-empty');
  for (const profile of Array.isArray(input?.profiles) ? input.profiles : []) {
    if (!profile || typeof profile !== 'object' || !profile.id) { errors.push('profile id is required'); continue; }
    if (!Number.isInteger(profile.expectedMeasures) || profile.expectedMeasures < 1) errors.push(`expectedMeasures is invalid: ${profile.id}`);
    if (!Number.isInteger(profile.minIterations) || profile.minIterations < 3) errors.push(`minIterations is invalid: ${profile.id}`);
    if (!Number.isInteger(profile.maxIterations) || profile.maxIterations < profile.minIterations || profile.maxIterations > 1000) errors.push(`maxIterations is invalid: ${profile.id}`);
    if (!Array.isArray(profile.metrics) || profile.metrics.length !== REQUIRED_METRICS.size || !profile.metrics.every((metric) => REQUIRED_METRICS.has(metric))) errors.push(`metrics must include parse/load/render/serialize: ${profile.id}`);
    if (typeof profile.fixturePath !== 'string' || path.isAbsolute(profile.fixturePath)) { errors.push(`fixturePath must be relative: ${profile.id}`); continue; }
    const fixturePath = path.resolve(rootDir, profile.fixturePath);
    if (path.relative(rootDir, fixturePath).startsWith('..')) { errors.push(`fixturePath escapes repository: ${profile.id}`); continue; }
    if (!fs.existsSync(fixturePath)) { errors.push(`fixture is missing: ${profile.id}`); continue; }
    const fixture = fs.readFileSync(fixturePath, 'utf8');
    if (!/<score-partwise\b/.test(fixture)) errors.push(`fixture is not score-partwise: ${profile.id}`);
    const measures = (fixture.match(/<measure\b/g) || []).length;
    if (measures !== profile.expectedMeasures) errors.push(`fixture measure count mismatch: ${profile.id}`);
  }
  return { valid: errors.length === 0, profileCount: Array.isArray(input?.profiles) ? input.profiles.length : 0, errors };
}

if (require.main === module) {
  try {
    const result = validatePerformanceBenchmark(path.resolve(process.argv[2] || 'qa/performance-benchmark.json'));
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    if (!result.valid) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`performance benchmark validation failed: ${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = { validatePerformanceBenchmark };
