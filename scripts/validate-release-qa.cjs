const fs = require('node:fs');
const path = require('node:path');
const { migrateReleaseQaReport, validateReleaseQaReportSchema } = require('../electron/release-qa.cjs');

const CLI_SCHEMA_VERSION = 1;
function option(args, name) { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : null; }
function validateReleaseQaValidationOutput(value) {
  const output = value && typeof value === 'object' && !Array.isArray(value) ? value : null;
  const valid = output?.schemaVersion === CLI_SCHEMA_VERSION && typeof output?.valid === 'boolean' && typeof output?.migrated === 'boolean' && Number.isInteger(output?.targetVersion) && typeof output?.input === 'string' && Array.isArray(output?.diagnostics) && output.diagnostics.every((item) => typeof item === 'string');
  return { valid, diagnostics: valid ? [] : ['release-qa-validation-cli-schema-invalid'] };
}
function resolveInputPath(inputPath, pathModule = path) {
  if (typeof inputPath !== 'string' || !inputPath.trim()) throw new Error('missing input path');
  return pathModule.resolve(inputPath);
}

function validateReleaseQaFile({ inputPath, migrate = false, targetVersion = 1 } = {}) {
  const source = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const report = migrate ? migrateReleaseQaReport(source, targetVersion) : source;
  const validation = validateReleaseQaReportSchema(report);
  return { inputPath, migrated: migrate && source.schemaVersion !== report.schemaVersion, report, validation };
}

function writeValidationOutput(outputPath, output) {
  if (!outputPath) return;
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(output)}\n`, 'utf8');
}

if (require.main === module) {
  try {
    const args = process.argv.slice(2);
    const inputPath = option(args, '--input');
    const outputPath = option(args, '--output');
    const targetVersion = option(args, '--target-version');
    if (!inputPath) throw new Error('missing --input');
    const result = validateReleaseQaFile({ inputPath: resolveInputPath(inputPath), migrate: args.includes('--migrate'), targetVersion: targetVersion ? Number(targetVersion) : 1 });
    const output = { schemaVersion: CLI_SCHEMA_VERSION, valid: result.validation.valid, migrated: result.migrated, targetVersion: result.report.schemaVersion, input: result.inputPath, diagnostics: result.validation.diagnostics };
    writeValidationOutput(outputPath ? path.resolve(outputPath) : null, output);
    process.stdout.write(`${JSON.stringify(output)}\n`);
    if (!result.validation.valid) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`release QA validation failed: ${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = { CLI_SCHEMA_VERSION, resolveInputPath, validateReleaseQaFile, validateReleaseQaValidationOutput, writeValidationOutput };
