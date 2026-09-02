const test = require('node:test');
const assert = require('node:assert/strict');
const { MAX_OMR_INPUT_BYTES, inspectOmrInput, inspectOmrInputWithHeader } = require('./omr-input.cjs');

test('OMR input preflight accepts bounded image and PDF files', () => {
  assert.equal(inspectOmrInput('/tmp/score.PNG', { isFile: true, size: 1024 }).inputFormat, 'image');
  assert.equal(inspectOmrInput('/tmp/score.pdf', { isFile: true, size: MAX_OMR_INPUT_BYTES }).usable, true);
});

test('OMR input preflight rejects unsupported, non-file, missing, and oversized inputs', () => {
  assert.equal(inspectOmrInput('/tmp/score.svg', { isFile: true, size: 10 }).reason, 'unsupported-extension');
  assert.equal(inspectOmrInput('/tmp/score.png', null).reason, 'missing');
  assert.equal(inspectOmrInput('/tmp/score.png', { isFile: false, size: 10 }).reason, 'not-file');
  assert.equal(inspectOmrInput('/tmp/score.png', { isFile: true, size: MAX_OMR_INPUT_BYTES + 1 }).reason, 'too-large');
  assert.equal(inspectOmrInputWithHeader('/tmp/score.png', { isFile: true, size: 10 }, Buffer.from('%PDF-')).reason, 'invalid-signature');
  assert.equal(inspectOmrInputWithHeader('/tmp/score.pdf', { isFile: true, size: 10 }, Buffer.from('%PDF-1.7')).usable, true);
});
