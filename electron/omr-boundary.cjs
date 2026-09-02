const MAX_OMR_INPUT_BYTES = 64 * 1024 * 1024;
const MAX_DRAFT_MUSICXML_BYTES = 8 * 1024 * 1024;
const MAX_OMR_ITEMS = 4096;
const { runJsonProvider } = require('./provider-runtime.cjs');
const OMR_INPUT_FORMATS = new Set(['image', 'pdf']);
const OMR_ITEM_STATUSES = new Set(['review', 'accepted', 'rejected', 'corrected']);

function normalizeOmrProvider(value) {
  const source = value && typeof value === 'object' ? value : {};
  const licenseStatus = ['unreviewed', 'accepted', 'rejected'].includes(source.licenseStatus) ? source.licenseStatus : 'unreviewed';
  return {
    id: typeof source.id === 'string' && source.id.length <= 128 ? source.id : null,
    name: typeof source.name === 'string' && source.name.length <= 256 ? source.name : null,
    version: typeof source.version === 'string' && source.version.length <= 64 ? source.version : null,
    licenseStatus,
    distribution: source.distribution === 'bundled' || source.distribution === 'optional-external' ? source.distribution : 'optional-external',
  };
}

function normalizeOmrBox(value) {
  const source = value && typeof value === 'object' ? value : {};
  const number = (key) => Number.isFinite(source[key]) ? Math.max(0, Math.min(100000, source[key])) : null;
  return { x: number('x'), y: number('y'), width: number('width'), height: number('height') };
}

function normalizeOmrItem(value) {
  const source = value && typeof value === 'object' ? value : {};
  const confidence = Number.isFinite(source.confidence) ? Math.max(0, Math.min(1, source.confidence)) : null;
  const status = OMR_ITEM_STATUSES.has(source.status) ? source.status : 'review';
  return {
    id: typeof source.id === 'string' && source.id.length <= 128 ? source.id : null,
    kind: typeof source.kind === 'string' && source.kind.length <= 64 ? source.kind : 'unknown',
    confidence,
    sourceBox: normalizeOmrBox(source.sourceBox),
    status,
    proposal: source.proposal && typeof source.proposal === 'object' ? source.proposal : null,
  };
}

function assessOmrProposal(value) {
  const source = value && typeof value === 'object' ? value : {};
  const provider = normalizeOmrProvider(source.provider);
  const inputFormat = OMR_INPUT_FORMATS.has(source.inputFormat) ? source.inputFormat : null;
  const inputBytes = Number.isSafeInteger(source.inputBytes) && source.inputBytes >= 0 ? source.inputBytes : null;
  const draftMusicxml = typeof source.draftMusicxml === 'string' ? source.draftMusicxml : null;
  const items = Array.isArray(source.items) ? source.items.slice(0, MAX_OMR_ITEMS).map(normalizeOmrItem) : [];
  const diagnostics = [];
  if (!provider.id || !provider.name || !provider.version) diagnostics.push('provider-incomplete');
  if (provider.licenseStatus !== 'accepted') diagnostics.push(`provider-license-${provider.licenseStatus}`);
  if (!inputFormat) diagnostics.push('input-format-unsupported');
  if (inputBytes === null || inputBytes > MAX_OMR_INPUT_BYTES) diagnostics.push('input-too-large-or-missing');
  if (!draftMusicxml || Buffer.byteLength(draftMusicxml, 'utf8') > MAX_DRAFT_MUSICXML_BYTES) diagnostics.push('draft-musicxml-too-large-or-missing');
  if (items.some((item) => !item.id || item.confidence === null || Object.values(item.sourceBox).some((number) => number === null))) diagnostics.push('item-metadata-incomplete');
  return { proposal: { provider, inputFormat, inputBytes, draftMusicxml, items }, usable: diagnostics.length === 0, diagnostics };
}

function transitionOmrItem(value, action, correction) {
  const item = normalizeOmrItem(value);
  if (action === 'accept' && item.proposal) return { ...item, status: 'accepted' };
  if (action === 'reject') return { ...item, status: 'rejected' };
  if (action === 'correct' && correction && typeof correction === 'object') return { ...item, status: 'corrected', proposal: correction };
  return { ...item, status: 'review' };
}

function createOmrReviewQueue(value) {
  const assessed = assessOmrProposal(value);
  const items = new Map(assessed.proposal.items.filter((item) => item.id).map((item) => [item.id, item]));
  return {
    usable: assessed.usable,
    diagnostics: assessed.diagnostics,
    get: (id) => items.get(typeof id === 'string' ? id : '') || null,
    list: (status = null) => [...items.values()]
      .filter((item) => !status || item.status === status)
      .sort((left, right) => (left.confidence ?? 1) - (right.confidence ?? 1) || left.id.localeCompare(right.id)),
    transition: (id, action, correction) => {
      const current = items.get(typeof id === 'string' ? id : '');
      if (!current) return null;
      const next = transitionOmrItem(current, action, correction);
      items.set(next.id, next);
      return next;
    },
  };
}

function findOmrItemAtPoint(value, x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  const assessed = assessOmrProposal(value);
  return assessed.proposal.items
    .filter((item) => item.id && item.sourceBox.x !== null && item.sourceBox.y !== null && item.sourceBox.width !== null && item.sourceBox.height !== null)
    .filter((item) => x >= item.sourceBox.x && x <= item.sourceBox.x + item.sourceBox.width && y >= item.sourceBox.y && y <= item.sourceBox.y + item.sourceBox.height)
    .sort((left, right) => (left.sourceBox.width * left.sourceBox.height) - (right.sourceBox.width * right.sourceBox.height) || left.id.localeCompare(right.id))[0] || null;
}

function normalizeOmrRunResult(value) {
  const source = value && typeof value === 'object' ? value : {};
  const status = ['success', 'failed', 'timeout'].includes(source.status) ? source.status : 'failed';
  if (status !== 'success') {
    return { status, usable: false, proposal: null, diagnostics: [status === 'timeout' ? 'provider-timeout' : 'provider-failed'] };
  }
  const assessed = assessOmrProposal(source.proposal);
  return { status, usable: assessed.usable, proposal: assessed.proposal, diagnostics: assessed.diagnostics };
}

async function runExternalOmrProvider({ executable, args, request, timeoutMs, spawnImpl } = {}) {
  const provider = normalizeOmrProvider(request?.provider);
  if (!provider.id || !provider.name || !provider.version) return { status: 'failed', usable: false, proposal: null, diagnostics: ['provider-incomplete'] };
  if (provider.licenseStatus !== 'accepted') return { status: 'failed', usable: false, proposal: null, diagnostics: [`provider-license-${provider.licenseStatus}`] };
  const response = await runJsonProvider({ executable, args, request, timeoutMs, spawnImpl });
  return normalizeOmrRunResult(response.status === 'success' && response.body && typeof response.body === 'object' ? { ...response.body, status: response.status } : response);
}

module.exports = { MAX_DRAFT_MUSICXML_BYTES, MAX_OMR_INPUT_BYTES, MAX_OMR_ITEMS, assessOmrProposal, createOmrReviewQueue, findOmrItemAtPoint, normalizeOmrItem, normalizeOmrProvider, normalizeOmrRunResult, runExternalOmrProvider, transitionOmrItem };
