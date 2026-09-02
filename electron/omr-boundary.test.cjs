const test = require('node:test');
const assert = require('node:assert/strict');
const { assessOmrProposal, createOmrReviewQueue, transitionOmrItem } = require('./omr-boundary.cjs');

const VALID_PROPOSAL = {
  provider: { id: 'omr-local', name: 'Local OMR', version: '1.0', licenseStatus: 'accepted', distribution: 'optional-external' },
  inputFormat: 'image', inputBytes: 1024, draftMusicxml: '<score-partwise/>',
  items: [{ id: 'n1', kind: 'note', confidence: 0.92, sourceBox: { x: 10, y: 20, width: 30, height: 40 }, proposal: { type: 'note' } }],
};

test('OMR proposal keeps provider, draft, confidence, and source geometry without applying Score', () => {
  const result = assessOmrProposal(VALID_PROPOSAL);
  assert.equal(result.usable, true);
  assert.equal(result.proposal.items[0].status, 'review');
  assert.equal(result.proposal.items[0].sourceBox.width, 30);
});

test('OMR proposal rejects unlicensed, unsupported, and oversized input', () => {
  const result = assessOmrProposal({ ...VALID_PROPOSAL, provider: { ...VALID_PROPOSAL.provider, licenseStatus: 'unreviewed' }, inputFormat: 'audio', inputBytes: 64 * 1024 * 1024 + 1 });
  assert.equal(result.usable, false);
  assert.deepEqual(result.diagnostics, ['provider-license-unreviewed', 'input-format-unsupported', 'input-too-large-or-missing']);
});

test('OMR review transitions produce proposal state only', () => {
  const item = VALID_PROPOSAL.items[0];
  assert.equal(transitionOmrItem(item, 'accept').status, 'accepted');
  assert.equal(transitionOmrItem(item, 'reject').status, 'rejected');
  assert.equal(transitionOmrItem(item, 'correct', { type: 'rest' }).proposal.type, 'rest');
});

test('OMR review queue prioritizes uncertain items and isolates transitions by id', () => {
  const queue = createOmrReviewQueue({ ...VALID_PROPOSAL, items: [
    { ...VALID_PROPOSAL.items[0], id: 'high', confidence: 0.95 },
    { ...VALID_PROPOSAL.items[0], id: 'low', confidence: 0.42 },
  ] });
  assert.equal(queue.usable, true);
  assert.deepEqual(queue.list('review').map((item) => item.id), ['low', 'high']);
  assert.equal(queue.transition('low', 'accept').status, 'accepted');
  assert.equal(queue.list('review').length, 1);
  assert.equal(queue.transition('missing', 'reject'), null);
});
