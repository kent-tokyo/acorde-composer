const fs = require('node:fs');
const path = require('node:path');
const { migrateReleaseQaReport, validateReleaseQaReportSchema } = require('../electron/release-qa.cjs');

const CLI_SCHEMA_VERSION = 1;
function option(args, name) { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : null; }

function validateReleaseQaFile({ inputPath, migrate = false } = {}) {
  const source = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const report = migrate ? migrateReleaseQaReport(source) : source;
  const validation = validateReleaseQaReportSchema(report);
  return { inputPath, migrated: migrate && source.schemaVersion !== report.schemaVersion, report, validation };
}

if (require.main === module) {
  try {
    const args = process.argv.slice(2);
    const inputPath = option(args, '--input');
    if (!inputPath) throw new Error('missing --input');
    const result = validateReleaseQaFile({ inputPath: path.resolve(inputPath), migrate: args.includes('--migrate') });
    const output = { schemaVersion: CLI_SCHEMA_VERSION, valid: result.validation.valid, migrated: result.migrated, input: result.inputPath, diagnostics: result.validation.diagnostics };
    process.stdout.write(`${JSON.stringify(output)}\n`);
    if (!result.validation.valid) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`release QA validation failed: ${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = { CLI_SCHEMA_VERSION, validateReleaseQaFile };
