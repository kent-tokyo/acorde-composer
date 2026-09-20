const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { validatePerformanceBenchmark } = require('../scripts/validate-performance-benchmark.cjs');
const { validatePerformanceResults, validEngineIdentity, validEnvironment } = require('../scripts/validate-performance-results.cjs');
const { comparePerformanceResults } = require('../scripts/compare-performance-benchmark.cjs');
const { validateColdStartResults } = require('../scripts/validate-cold-start-results.cjs');
const { validatePlaybackResults } = require('../scripts/validate-playback-results.cjs');
const { validateRenderResults } = require('../scripts/validate-render-results.cjs');

test('performance benchmark profile is reproducible and points to the checked-in fixture', () => {
  assert.deepEqual(
    validatePerformanceBenchmark(path.resolve(__dirname, '../qa/performance-benchmark.json'), path.resolve(__dirname, '..')),
    { valid: true, profileCount: 4, errors: [] },
  );
});

test('version 2 measurements require a verified engine identity and environment', () => {
  const identity = { product: 'Acorde Composer', commit: 'be680d5', clean: true, binary: 'build/engine/acorde-composer-engine', sha256: 'a'.repeat(64) };
  const environment = { platform: 'darwin', arch: 'arm64', os_release: '25.5.0', node: 'v24.5.0' };
  assert.equal(validEngineIdentity(identity), true);
  assert.equal(validEngineIdentity({ ...identity, clean: false }), false);
  assert.equal(validEnvironment(environment), true);
  assert.equal(validEnvironment({ ...environment, node: '' }), false);
});

test('cold start result schema is valid and keeps a bounded timing summary', () => {
  assert.deepEqual(validateColdStartResults(path.resolve(__dirname, '../qa/performance-cold-start-results.json')), { valid: true, errors: [] });
});

test('playback result schema keeps event count and harness memory evidence', () => {
  assert.deepEqual(validatePlaybackResults(path.resolve(__dirname, '../qa/performance-playback-results.json')), { valid: true, errors: [] });
});

test('render result schema keeps layout and repeat-render evidence', () => {
  assert.deepEqual(validateRenderResults(path.resolve(__dirname, '../qa/performance-render-results.json')), { valid: true, errors: [] });
});

test('performance results schema validates and detects p95 regressions', () => {
  const resultsPath = path.resolve(__dirname, '../qa/performance-benchmark-results.json');
  assert.deepEqual(validatePerformanceResults(resultsPath), { valid: true, profileCount: 4, errors: [] });
  assert.equal(comparePerformanceResults(resultsPath, resultsPath, 0).valid, true);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'acorde-composer-performance-'));
  const candidatePath = path.join(tempDir, 'candidate.json');
  const candidate = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
  candidate.profiles[0].parse_ms.p95 *= 2;
  fs.writeFileSync(candidatePath, JSON.stringify(candidate));
  const comparison = comparePerformanceResults(resultsPath, candidatePath, 20);
  assert.equal(comparison.valid, false);
  assert.equal(comparison.regressions[0].id, candidate.profiles[0].id);
});

test('performance result profiles retain bounded harness memory and CPU evidence', () => {
  const input = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../qa/performance-benchmark-results.json'), 'utf8'));
  for (const profile of input.profiles) {
    assert.ok(Number.isInteger(profile.harness_memory.rss_before_bytes));
    assert.ok(Number.isInteger(profile.harness_memory.rss_after_bytes));
    assert.ok(Number.isInteger(profile.harness_cpu.user_us));
    assert.ok(Number.isInteger(profile.harness_cpu.system_us));
  }
});

test('performance result profiles retain MusicXML serialization evidence', () => {
  const input = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../qa/performance-benchmark-results.json'), 'utf8'));
  for (const profile of input.profiles) {
    assert.ok(Number.isFinite(profile.serialize_ms.p50));
    assert.ok(Number.isFinite(profile.serialize_ms.p95));
    assert.ok(Number.isFinite(profile.serialize_ms.max));
  }
});
