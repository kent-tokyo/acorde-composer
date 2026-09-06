const fs = require('node:fs');
const path = require('node:path');
const { validateNotationCoverageMatrix } = require('../electron/notation-coverage.cjs');

function option(args, name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

function validateNotationCoverageFile(inputPath = path.resolve('qa/notation-coverage-matrix.json'), rootDir = process.cwd()) {
  const matrix = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const structural = validateNotationCoverageMatrix(matrix);
  const errors = [...structural.errors];
  for (const element of Array.isArray(matrix.elements) ? matrix.elements : []) {
    if (!element || typeof element.fixturePath !== 'string') continue;
    const relative = element.fixturePath.replaceAll('\\', '/');
    const fixturePath = path.resolve(rootDir, relative);
    if (path.relative(rootDir, fixturePath).startsWith('..')) {
      errors.push(`fixturePath escapes repository: ${element.id || 'unknown'}`);
      continue;
    }
    if (!fs.existsSync(fixturePath)) {
      errors.push(`fixture is missing: ${element.id || 'unknown'}`);
      continue;
    }
    const fixture = fs.readFileSync(fixturePath, 'utf8');
    if (!/<score-partwise\b/.test(fixture)) errors.push(`fixture is not score-partwise: ${element.id || 'unknown'}`);
    for (const marker of Array.isArray(element.fixtureMarkers) ? element.fixtureMarkers : []) {
      if (!fixture.includes(marker)) errors.push(`fixture marker is missing: ${element.id || 'unknown'}:${marker}`);
    }
  }
  return { valid: errors.length === 0, matrixPath: path.relative(rootDir, inputPath), elementCount: Array.isArray(matrix.elements) ? matrix.elements.length : 0, errors };
}

if (require.main === module) {
  try {
    const result = validateNotationCoverageFile(path.resolve(option(process.argv.slice(2), '--input', 'qa/notation-coverage-matrix.json')));
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    if (!result.valid) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`notation coverage validation failed: ${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = { validateNotationCoverageFile };
