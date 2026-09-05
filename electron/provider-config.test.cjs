const test = require('node:test');
const assert = require('node:assert/strict');
const { assessProviderConfig, normalizeProviderConfig } = require('./provider-config.cjs');

const BASE = { id: 'local', name: 'Local provider', version: '1.0.0', executable: '/opt/acorde/provider', licenseStatus: 'accepted' };

test('provider config normalizes bounded runtime settings', () => {
  const result = normalizeProviderConfig({ ...BASE, args: ['--json'], timeoutMs: 999999 }, 'ai');
  assert.deepEqual(result, { kind: 'ai', id: 'local', name: 'Local provider', version: '1.0.0', executable: '/opt/acorde/provider', args: ['--json'], licenseStatus: 'accepted', networkPolicy: 'disabled', timeoutMs: 60000 });
});

test('OMR config is usable only with identity, safe executable, and accepted license', () => {
  assert.equal(assessProviderConfig(BASE, 'omr').usable, true);
  assert.deepEqual(assessProviderConfig({ ...BASE, licenseStatus: 'unreviewed' }, 'omr').diagnostics, ['provider-license-unreviewed']);
  assert.deepEqual(assessProviderConfig({ ...BASE, executable: 'provider' }, 'omr').diagnostics, ['provider-executable-missing-or-unsafe']);
});

test('AI config requires explicit user-approved network policy', () => {
  const result = assessProviderConfig(BASE, 'ai');
  assert.deepEqual(result.diagnostics, ['network-not-approved']);
  assert.equal(assessProviderConfig({ ...BASE, networkPolicy: 'user-approved' }, 'ai').usable, true);
});

test('provider config rejects NUL arguments without spawning anything', () => {
  const result = assessProviderConfig({ ...BASE, args: ['ok', 'bad\0arg'] }, 'omr');
  assert.equal(result.usable, false);
  assert.deepEqual(result.diagnostics, ['provider-args-invalid']);
});
