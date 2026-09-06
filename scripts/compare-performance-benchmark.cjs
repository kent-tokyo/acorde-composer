const fs = require('node:fs');
const path = require('node:path');
const { validatePerformanceResults, METRICS } = require('./validate-performance-results.cjs');

function readReport(inputPath) {
  return JSON.parse(fs.readFileSync(inputPath, 'utf8'));
}

function comparePerformanceResults(baselinePath, candidatePath, maxRegressionPercent = 20) {
  const baseline = readReport(baselinePath);
  const candidate = readReport(candidatePath);
  const errors = [
    ...validatePerformanceResults(baselinePath).errors.map((error) => `baseline: ${error}`),
    ...validatePerformanceResults(candidatePath).errors.map((error) => `candidate: ${error}`),
  ];
  if (!Number.isFinite(maxRegressionPercent) || maxRegressionPercent < 0) errors.push('maxRegressionPercent must be non-negative');
  const candidateById = new Map((candidate.profiles || []).map((profile) => [profile.id, profile]));
  const regressions = [];
  for (const before of baseline.profiles || []) {
    const after = candidateById.get(before.id);
    if (!after) { errors.push(`candidate profile is missing: ${before.id}`); continue; }
    for (const metric of METRICS) {
      const baselineValue = before[metric].p95;
      const candidateValue = after[metric].p95;
      const regressionPercent = baselineValue === 0 ? (candidateValue === 0 ? 0 : Infinity) : ((candidateValue - baselineValue) / baselineValue) * 100;
      if (regressionPercent > maxRegressionPercent) regressions.push({ id: before.id, metric, baselineP95: baselineValue, candidateP95: candidateValue, regressionPercent: Number(regressionPercent.toFixed(3)) });
    }
  }
  return { valid: errors.length === 0 && regressions.length === 0, maxRegressionPercent, errors, regressions };
}

if (require.main === module) {
  try {
    const baselinePath = path.resolve(process.argv[2] || 'qa/performance-benchmark-results.json');
    const candidatePath = path.resolve(process.argv[3] || 'qa/performance-benchmark-results.json');
    const threshold = Number(process.argv[4] || 20);
    const result = comparePerformanceResults(baselinePath, candidatePath, threshold);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    if (!result.valid) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`performance comparison failed: ${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = { comparePerformanceResults };
