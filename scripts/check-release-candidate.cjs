const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const cargoCommand = process.platform === 'win32' ? 'cargo.exe' : 'cargo';

const steps = [
  { label: 'Node tests', command: npmCommand, args: ['test'] },
  { label: 'static and fixture checks', command: npmCommand, args: ['run', 'check'] },
  { label: 'Playground syntax check', command: npmCommand, args: ['run', 'check:playground'] },
  { label: 'Rust tests', command: cargoCommand, args: ['test', '--manifest-path', 'engine/Cargo.toml', '--locked'] },
  { label: 'Rust clippy', command: cargoCommand, args: ['clippy', '--manifest-path', 'engine/Cargo.toml', '--all-targets', '--all-features', '--locked'] },
  { label: 'Git whitespace check', command: 'git', args: ['diff', '--check'] },
];

const CANDIDATE_REPORT_SCHEMA_VERSION = 1;
const MAX_FAILURE_DETAIL = 600;
const ACCORDE_CRATES = ['acorde-core', 'acorde-io', 'acorde-layout', 'acorde-render-svg', 'acorde-soundfont'];

function runStep({ label, command, args }, { capture = false } = {}) {
  if (!capture) process.stdout.write(`\n[candidate] ${label}\n`);
  const result = spawnSync(command, args, { stdio: capture ? 'pipe' : 'inherit', encoding: 'utf8', shell: false });
  if (result.error) {
    if (!capture) process.stderr.write(`[candidate] ${label} could not start: ${result.error.message}\n`);
    return { label, status: result.error.code || 1, error: result.error.message };
  }
  if (result.status !== 0) {
    if (!capture) process.stderr.write(`[candidate] ${label} failed with exit code ${result.status}\n`);
    const detail = capture ? `${result.stderr || ''}${result.stdout || ''}`.trim().slice(0, MAX_FAILURE_DETAIL) : null;
    return { label, status: result.status || 1, ...(detail ? { detail } : {}) };
  }
  return { label, status: 0 };
}

function runCandidateChecks({ json = false, strictDependency = false, runner = runStep, dependencyInspector = inspectAcordeDependency } = {}) {
  if (json) {
    const results = steps.map((step) => runner(step, { capture: true }));
    const failed = results.find((result) => result.status !== 0);
    const report = {
      schemaVersion: CANDIDATE_REPORT_SCHEMA_VERSION,
      strictDependency,
      valid: !failed,
      failedStep: failed?.label || null,
      exitCode: failed?.status || 0,
      steps: results.map(({ label, status, error, detail }) => ({ label, passed: status === 0, ...(error ? { error } : {}), ...(detail ? { detail } : {}) })),
      dependency: dependencyInspector(),
    };
    report.releaseReady = report.valid && (!strictDependency || report.dependency.ready === true);
    if (strictDependency && !report.dependency.ready) report.exitCode = report.exitCode || 1;
    return report;
  }
  for (const step of steps) {
    const result = runStep(step);
    if (result.status !== 0) return { valid: false, failedStep: step.label, exitCode: result.status };
  }
  process.stdout.write('\n[candidate] all local release-candidate gates passed\n');
  return { valid: true, failedStep: null, exitCode: 0 };
}

function inspectAcordeDependency({ root = process.cwd() } = {}) {
  const cargoPath = path.join(root, 'engine', 'Cargo.toml');
  const acordeRoot = path.resolve(root, '..', 'acorde');
  const result = { declaredVersion: null, declaredCrates: [], lockVersions: {}, checkoutVersion: null, exactTag: null, clean: null, ready: false, diagnostics: [] };
  try {
    const cargo = fs.readFileSync(cargoPath, 'utf8');
    const declarations = [...cargo.matchAll(/(acorde-[a-z-]+)\s*=\s*\{\s*version\s*=\s*"([^"]+)"/g)];
    result.declaredCrates = declarations.map((match) => match[1]);
    const versions = declarations.map((match) => match[2]);
    result.declaredVersion = versions.length && versions.every((version) => version === versions[0]) ? versions[0] : null;
    if (!result.declaredVersion) result.diagnostics.push('declared-versions-inconsistent');
    if (ACCORDE_CRATES.some((crate) => !result.declaredCrates.includes(crate))) result.diagnostics.push('declared-crates-incomplete');
  } catch {
    result.diagnostics.push('composer-cargo-missing');
  }
  try {
    const lock = fs.readFileSync(path.join(root, 'engine', 'Cargo.lock'), 'utf8');
    for (const match of lock.matchAll(/name = "(acorde-(?:core|io|layout|render-svg|soundfont))"\nversion = "([^"]+)"/g)) result.lockVersions[match[1]] = match[2];
    const lockValues = Object.values(result.lockVersions);
    if (!lockValues.length) result.diagnostics.push('acorde-lock-entries-missing');
    if (ACCORDE_CRATES.some((crate) => !Object.hasOwn(result.lockVersions, crate))) result.diagnostics.push('acorde-lock-entries-incomplete');
    if (result.declaredVersion && lockValues.some((version) => version !== result.declaredVersion)) result.diagnostics.push('acorde-lock-version-mismatch');
  } catch {
    result.diagnostics.push('composer-cargo-lock-missing');
  }
  try {
    const workspace = fs.readFileSync(path.join(acordeRoot, 'Cargo.toml'), 'utf8');
    result.checkoutVersion = workspace.match(/^version\s*=\s*"([^"]+)"/m)?.[1] || null;
    const tag = spawnSync('git', ['-C', acordeRoot, 'describe', '--tags', '--exact-match'], { encoding: 'utf8', shell: false });
    result.exactTag = tag.status === 0 ? tag.stdout.trim() : null;
    const status = spawnSync('git', ['-C', acordeRoot, 'status', '--porcelain'], { encoding: 'utf8', shell: false });
    result.clean = status.status === 0 && status.stdout.trim().length === 0;
    if (!result.checkoutVersion) result.diagnostics.push('acorde-version-missing');
    if (!result.exactTag) result.diagnostics.push('acorde-exact-tag-missing');
    if (result.clean !== true) result.diagnostics.push('acorde-checkout-dirty');
    if (result.declaredVersion && result.checkoutVersion && result.checkoutVersion !== result.declaredVersion) result.diagnostics.push('acorde-version-mismatch');
    if (result.declaredVersion && result.exactTag && result.exactTag !== `v${result.declaredVersion}`) result.diagnostics.push('acorde-tag-mismatch');
  } catch {
    result.diagnostics.push('acorde-checkout-missing');
  }
  result.ready = result.declaredVersion !== null
    && ACCORDE_CRATES.every((crate) => result.declaredCrates.includes(crate) && Object.hasOwn(result.lockVersions, crate))
    && Object.values(result.lockVersions).every((version) => version === result.declaredVersion)
    && result.checkoutVersion === result.declaredVersion
    && result.exactTag === `v${result.declaredVersion}`
    && result.clean === true;
  return result;
}

if (require.main === module) {
  const json = process.argv.includes('--json');
  const strictDependency = process.argv.includes('--strict-dependency');
  const result = runCandidateChecks({ json, strictDependency });
  if (json) {
    const validation = validateCandidateGateReport(result);
    process.stdout.write(`${JSON.stringify(result)}\n`);
    process.exitCode = validation.valid ? result.exitCode : 1;
  } else {
    process.exitCode = result.exitCode || (strictDependency && !inspectAcordeDependency().ready ? 1 : 0);
  }
}

function validateCandidateGateReport(report) {
  const diagnostics = [];
  if (!report || report.schemaVersion !== CANDIDATE_REPORT_SCHEMA_VERSION) diagnostics.push('schema-version-invalid');
  if (typeof report?.valid !== 'boolean') diagnostics.push('valid-invalid');
  if (report?.releaseReady !== undefined && typeof report.releaseReady !== 'boolean') diagnostics.push('release-ready-invalid');
  if (report?.strictDependency !== undefined && typeof report.strictDependency !== 'boolean') diagnostics.push('strict-dependency-invalid');
  if (!(report?.failedStep === null || typeof report?.failedStep === 'string')) diagnostics.push('failed-step-invalid');
  if (!Number.isInteger(report?.exitCode) || report.exitCode < 0) diagnostics.push('exit-code-invalid');
  const dependency = report?.dependency;
  if (!dependency || typeof dependency !== 'object' || Array.isArray(dependency)) {
    diagnostics.push('dependency-invalid');
  } else {
    if (dependency.declaredVersion !== null && typeof dependency.declaredVersion !== 'string') diagnostics.push('dependency-declared-version-invalid');
    if (!Array.isArray(dependency.declaredCrates) || dependency.declaredCrates.some((crate) => typeof crate !== 'string')) diagnostics.push('dependency-declared-crates-invalid');
    if (!dependency.lockVersions || typeof dependency.lockVersions !== 'object' || Array.isArray(dependency.lockVersions) || Object.values(dependency.lockVersions).some((version) => typeof version !== 'string')) diagnostics.push('dependency-lock-versions-invalid');
    if (dependency.checkoutVersion !== null && typeof dependency.checkoutVersion !== 'string') diagnostics.push('dependency-checkout-version-invalid');
    if (dependency.exactTag !== null && typeof dependency.exactTag !== 'string') diagnostics.push('dependency-exact-tag-invalid');
    if (dependency.clean !== null && typeof dependency.clean !== 'boolean') diagnostics.push('dependency-clean-invalid');
    if (typeof dependency.ready !== 'boolean') diagnostics.push('dependency-ready-invalid');
    if (!Array.isArray(dependency.diagnostics) || dependency.diagnostics.some((diagnostic) => typeof diagnostic !== 'string')) diagnostics.push('dependency-diagnostics-invalid');
  }
  if (!Array.isArray(report?.steps) || report.steps.length !== steps.length) {
    diagnostics.push('steps-invalid');
  } else {
    report.steps.forEach((step, index) => {
      if (step?.label !== steps[index].label) diagnostics.push(`step-${index}-label-invalid`);
      if (typeof step?.passed !== 'boolean') diagnostics.push(`step-${index}-status-invalid`);
      if (step?.error !== undefined && typeof step.error !== 'string') diagnostics.push(`step-${index}-error-invalid`);
      if (step?.detail !== undefined && (typeof step.detail !== 'string' || step.detail.length > MAX_FAILURE_DETAIL)) diagnostics.push(`step-${index}-detail-invalid`);
    });
  }
  return { valid: diagnostics.length === 0, diagnostics };
}

module.exports = { CANDIDATE_REPORT_SCHEMA_VERSION, inspectAcordeDependency, runCandidateChecks, steps, validateCandidateGateReport };
