const crypto = require('node:crypto');
const { assertCommand } = require('./command-schema.cjs');
const { runJsonProvider } = require('./provider-runtime.cjs');

const MAX_AI_PROMPT_BYTES = 32 * 1024;
const MAX_SCORE_CONTEXT_BYTES = 128 * 1024;
const MAX_AI_RESPONSE_BYTES = 256 * 1024;
const MAX_AI_TIMEOUT_MS = 30 * 1000;
const MAX_AI_RATE_WINDOW_MS = 10 * 60 * 1000;
const SENSITIVE_KEYS = new Set(['apiKey', 'authorization', 'password', 'secret', 'token']);
const SCORE_CONTEXT_KEYS = new Set(['title', 'tempoBpm', 'timeSignature', 'keySignature', 'parts', 'measures', 'selection']);

function normalizeAiProvider(value) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    id: typeof source.id === 'string' && source.id.length <= 128 ? source.id : null,
    version: typeof source.version === 'string' && source.version.length <= 64 ? source.version : null,
    licenseStatus: ['unreviewed', 'accepted', 'rejected'].includes(source.licenseStatus) ? source.licenseStatus : 'unreviewed',
    networkPolicy: source.networkPolicy === 'user-approved' ? 'user-approved' : 'disabled',
  };
}

function redactSensitiveFields(value, depth = 0) {
  if (depth > 8 || value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.slice(0, 4096).map((item) => redactSensitiveFields(item, depth + 1));
  return Object.fromEntries(Object.entries(value).slice(0, 4096).map(([key, item]) => [key, SENSITIVE_KEYS.has(key) ? '[REDACTED]' : redactSensitiveFields(item, depth + 1)]));
}

function sanitizeScoreContext(value) {
  const source = redactSensitiveFields(value && typeof value === 'object' ? value : {});
  return Object.fromEntries(Object.entries(source).filter(([key]) => SCORE_CONTEXT_KEYS.has(key)));
}

function fingerprintScoreContext(value) {
  return crypto.createHash('sha256').update(JSON.stringify(sanitizeScoreContext(value))).digest('hex');
}

function buildAiRequest({ provider, prompt, scoreContext } = {}) {
  const normalizedProvider = normalizeAiProvider(provider);
  const safePrompt = typeof prompt === 'string' ? prompt.slice(0, MAX_AI_PROMPT_BYTES) : '';
  const safeContext = sanitizeScoreContext(scoreContext);
  const request = { provider: normalizedProvider, prompt: safePrompt, scoreContext: safeContext, contextFingerprint: fingerprintScoreContext(safeContext) };
  const bytes = Buffer.byteLength(JSON.stringify(request), 'utf8');
  return { request, usable: normalizedProvider.id !== null && normalizedProvider.licenseStatus === 'accepted' && normalizedProvider.networkPolicy === 'user-approved' && safePrompt.length > 0 && bytes <= MAX_SCORE_CONTEXT_BYTES, diagnostics: normalizedProvider.id === null ? ['provider-incomplete'] : normalizedProvider.licenseStatus !== 'accepted' ? [`provider-license-${normalizedProvider.licenseStatus}`] : normalizedProvider.networkPolicy !== 'user-approved' ? ['network-not-approved'] : safePrompt.length === 0 ? ['prompt-missing'] : bytes > MAX_SCORE_CONTEXT_BYTES ? ['request-too-large'] : [] };
}

function normalizeAiResponse(value, { expectedContextFingerprint = null } = {}) {
  const source = value && typeof value === 'object' ? value : {};
  const body = typeof source.body === 'string' ? source.body : JSON.stringify(source.body || '');
  if (source.status !== 'success') return { usable: false, proposal: null, diagnostics: [source.status === 'timeout' ? 'provider-timeout' : 'provider-failed'] };
  if (Buffer.byteLength(body, 'utf8') > MAX_AI_RESPONSE_BYTES) return { usable: false, proposal: null, diagnostics: ['response-too-large'] };
  if (expectedContextFingerprint && source.contextFingerprint !== expectedContextFingerprint) return { usable: false, proposal: null, diagnostics: ['context-stale'] };
  let proposal;
  try { proposal = typeof source.body === 'string' ? JSON.parse(source.body) : source.body; assertCommand(proposal); } catch { return { usable: false, proposal: null, diagnostics: ['proposal-invalid'] }; }
  return { usable: true, proposal, diagnostics: [] };
}

async function executeAiProvider(providerFn, request, timeoutMs = 10 * 1000) {
  if (typeof providerFn !== 'function') return { usable: false, proposal: null, diagnostics: ['provider-missing'] };
  const safeTimeout = Number.isFinite(timeoutMs) ? Math.max(1, Math.min(MAX_AI_TIMEOUT_MS, Math.round(timeoutMs))) : 10 * 1000;
  let timer;
  try {
    const result = await Promise.race([
      Promise.resolve().then(() => providerFn(request)),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('provider-timeout')), safeTimeout); }),
    ]);
    return normalizeAiResponse(result);
  } catch (error) {
    return { usable: false, proposal: null, diagnostics: error?.message === 'provider-timeout' ? ['provider-timeout'] : ['provider-failed'] };
  } finally {
    clearTimeout(timer);
  }
}

async function runAiProvider({ providerFn, provider, prompt, scoreContext, limiter = createAiRateLimiter(), timeoutMs } = {}) {
  const requestResult = buildAiRequest({ provider, prompt, scoreContext });
  if (!requestResult.usable) return { ...requestResult, proposal: null };
  const rate = limiter?.check?.() || { allowed: true, retryAfterMs: 0 };
  if (!rate.allowed) return { usable: false, proposal: null, diagnostics: ['rate-limited'], retryAfterMs: rate.retryAfterMs };
  const response = await executeAiProvider(providerFn, requestResult.request, timeoutMs);
  return { ...response, contextFingerprint: requestResult.request.contextFingerprint };
}

async function runExternalAiProvider({ executable, args, provider, prompt, scoreContext, limiter = createAiRateLimiter(), timeoutMs, spawnImpl } = {}) {
  const requestResult = buildAiRequest({ provider, prompt, scoreContext });
  if (!requestResult.usable) return { ...requestResult, proposal: null };
  const rate = limiter?.check?.() || { allowed: true, retryAfterMs: 0 };
  if (!rate.allowed) return { usable: false, proposal: null, diagnostics: ['rate-limited'], retryAfterMs: rate.retryAfterMs };
  const response = await runJsonProvider({ executable, args, request: requestResult.request, timeoutMs, spawnImpl });
  const normalized = normalizeAiResponse(response.status === 'success' && response.body && typeof response.body === 'object' ? { ...response.body, status: response.status } : response, { expectedContextFingerprint: requestResult.request.contextFingerprint });
  return { ...normalized, contextFingerprint: requestResult.request.contextFingerprint };
}

function createAiRateLimiter({ maxRequests = 5, windowMs = 60 * 1000, now = () => Date.now() } = {}) {
  const limit = Number.isSafeInteger(maxRequests) ? Math.max(1, Math.min(100, maxRequests)) : 5;
  const window = Number.isSafeInteger(windowMs) ? Math.max(1000, Math.min(MAX_AI_RATE_WINDOW_MS, windowMs)) : 60 * 1000;
  const timestamps = [];
  return {
    check: () => {
      const current = Number.isFinite(now()) ? now() : 0;
      while (timestamps.length && current - timestamps[0] >= window) timestamps.shift();
      if (timestamps.length >= limit) return { allowed: false, retryAfterMs: Math.max(0, window - (current - timestamps[0])) };
      timestamps.push(current);
      return { allowed: true, retryAfterMs: 0 };
    },
  };
}

module.exports = { MAX_AI_PROMPT_BYTES, MAX_SCORE_CONTEXT_BYTES, MAX_AI_RESPONSE_BYTES, MAX_AI_TIMEOUT_MS, MAX_AI_RATE_WINDOW_MS, buildAiRequest, createAiRateLimiter, executeAiProvider, fingerprintScoreContext, normalizeAiProvider, normalizeAiResponse, redactSensitiveFields, runAiProvider, runExternalAiProvider, sanitizeScoreContext };
