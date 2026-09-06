const fs = require('node:fs');
const path = require('node:path');
const { assessDistributionQa } = require('../electron/distribution-readiness.cjs');

function option(args, name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

function validateReleaseQaFixtures({ matrixPath = path.resolve('qa/release-qa-matrix.json'), resultsPath = path.resolve('qa/release-qa-results.json') } = {}) {
  const matrix = JSON.parse(fs.readFileSync(matrixPath, 'utf8'));
  const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
  const qa = assessDistributionQa(matrix, results, { requireEvidence: true });
  const errors = [...qa.invalid, ...qa.duplicates, ...qa.missing];
  return {
    valid: errors.length === 0,
    ready: qa.ready,
    total: qa.total,
    passed: qa.passed,
    notRun: qa.notRun.length,
    failed: qa.failed.length,
    errors,
    matrixPath: path.relative(process.cwd(), matrixPath),
    resultsPath: path.relative(process.cwd(), resultsPath),
  };
}

if (require.main === module) {
  try {
    const args = process.argv.slice(2);
    const result = validateReleaseQaFixtures({
      matrixPath: path.resolve(option(args, '--matrix', 'qa/release-qa-matrix.json')),
      resultsPath: path.resolve(option(args, '--results', 'qa/release-qa-results.json')),
    });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    if (!result.valid) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`release QA fixture validation failed: ${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = { validateReleaseQaFixtures };
