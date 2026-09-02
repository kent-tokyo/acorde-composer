const test = require('node:test');
const assert = require('node:assert/strict');
const { buildAiRequest, createAiRateLimiter, executeAiProvider, normalizeAiResponse } = require('./ai-provider-boundary.cjs');

const PROVIDER = { id: 'local-assistant', version: '1', licenseStatus: 'accepted', networkPolicy: 'user-approved' };
const COMMAND = { type: 'batch', label: 'AI proposal', commands: [{ type: 'add_measure', count: 1 }] };

test('AI request applies provider license, network, size, and redaction gates', () => {
  const result = buildAiRequest({ provider: PROVIDER, prompt: 'Add a cadence', scoreContext: { title: 'Draft', token: 'do-not-send' } });
  assert.equal(result.usable, true);
  assert.equal(result.request.scoreContext.token, undefined);
  assert.equal(result.request.scoreContext.title, 'Draft');
  assert.equal(result.request.contextFingerprint.length, 64);
});

test('AI request rejects unapproved or unlicensed providers', () => {
  assert.deepEqual(buildAiRequest({ provider: { ...PROVIDER, networkPolicy: 'disabled' }, prompt: 'x' }).diagnostics, ['network-not-approved']);
  assert.deepEqual(buildAiRequest({ provider: { ...PROVIDER, licenseStatus: 'unreviewed' }, prompt: 'x' }).diagnostics, ['provider-license-unreviewed']);
});

test('AI response becomes a validated command proposal and never a Score', () => {
  assert.deepEqual(normalizeAiResponse({ status: 'success', body: COMMAND }), { usable: true, proposal: COMMAND, diagnostics: [] });
  assert.deepEqual(normalizeAiResponse({ status: 'success', body: { type: 'load_score' } }).diagnostics, ['proposal-invalid']);
  assert.deepEqual(normalizeAiResponse({ status: 'timeout' }).diagnostics, ['provider-timeout']);
  assert.deepEqual(normalizeAiResponse({ status: 'success', body: COMMAND, contextFingerprint: 'stale' }, { expectedContextFingerprint: 'current' }).diagnostics, ['context-stale']);
});

test('AI provider execution is bounded and normalizes failure without throwing', async () => {
  assert.equal((await executeAiProvider(async (request) => ({ status: 'success', body: request }), COMMAND, 100)).usable, true);
  assert.deepEqual(await executeAiProvider(() => new Promise(() => {}), COMMAND, 5), { usable: false, proposal: null, diagnostics: ['provider-timeout'] });
  assert.deepEqual(await executeAiProvider(() => { throw new Error('crashed'); }, COMMAND), { usable: false, proposal: null, diagnostics: ['provider-failed'] });
});

test('AI rate limiter bounds calls and returns deterministic retry timing', () => {
  let current = 1000;
  const limiter = createAiRateLimiter({ maxRequests: 2, windowMs: 1000, now: () => current });
  assert.deepEqual(limiter.check(), { allowed: true, retryAfterMs: 0 });
  assert.deepEqual(limiter.check(), { allowed: true, retryAfterMs: 0 });
  assert.deepEqual(limiter.check(), { allowed: false, retryAfterMs: 1000 });
  current += 1000;
  assert.deepEqual(limiter.check(), { allowed: true, retryAfterMs: 0 });
});
