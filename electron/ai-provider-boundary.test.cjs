const test = require('node:test');
const assert = require('node:assert/strict');
const { buildAiRequest, normalizeAiResponse } = require('./ai-provider-boundary.cjs');

const PROVIDER = { id: 'local-assistant', version: '1', licenseStatus: 'accepted', networkPolicy: 'user-approved' };
const COMMAND = { type: 'batch', label: 'AI proposal', commands: [{ type: 'add_measure', count: 1 }] };

test('AI request applies provider license, network, size, and redaction gates', () => {
  const result = buildAiRequest({ provider: PROVIDER, prompt: 'Add a cadence', scoreContext: { title: 'Draft', token: 'do-not-send' } });
  assert.equal(result.usable, true);
  assert.equal(result.request.scoreContext.token, '[REDACTED]');
});

test('AI request rejects unapproved or unlicensed providers', () => {
  assert.deepEqual(buildAiRequest({ provider: { ...PROVIDER, networkPolicy: 'disabled' }, prompt: 'x' }).diagnostics, ['network-not-approved']);
  assert.deepEqual(buildAiRequest({ provider: { ...PROVIDER, licenseStatus: 'unreviewed' }, prompt: 'x' }).diagnostics, ['provider-license-unreviewed']);
});

test('AI response becomes a validated command proposal and never a Score', () => {
  assert.deepEqual(normalizeAiResponse({ status: 'success', body: COMMAND }), { usable: true, proposal: COMMAND, diagnostics: [] });
  assert.deepEqual(normalizeAiResponse({ status: 'success', body: { type: 'load_score' } }).diagnostics, ['proposal-invalid']);
  assert.deepEqual(normalizeAiResponse({ status: 'timeout' }).diagnostics, ['provider-timeout']);
});
