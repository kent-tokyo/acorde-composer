const path = require('node:path');

const MAX_OMR_INPUT_BYTES = 64 * 1024 * 1024;
const OMR_INPUT_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.pdf']);

function inspectOmrInput(filePath, stat) {
  const value = typeof filePath === 'string' ? filePath : '';
  const extension = path.extname(value).toLowerCase();
  const inputFormat = extension === '.pdf' ? 'pdf' : OMR_INPUT_EXTENSIONS.has(extension) ? 'image' : null;
  if (!inputFormat) return { usable: false, path: value, inputFormat: null, reason: 'unsupported-extension' };
  if (!stat) return { usable: false, path: value, inputFormat, reason: 'missing' };
  if (!stat.isFile) return { usable: false, path: value, inputFormat, reason: 'not-file' };
  if (!Number.isSafeInteger(stat.size) || stat.size < 0) return { usable: false, path: value, inputFormat, reason: 'invalid-size' };
  if (stat.size > MAX_OMR_INPUT_BYTES) return { usable: false, path: value, inputFormat, reason: 'too-large', sizeBytes: stat.size, maxBytes: MAX_OMR_INPUT_BYTES };
  return { usable: true, path: value, inputFormat, reason: null, sizeBytes: stat.size, maxBytes: MAX_OMR_INPUT_BYTES };
}

function hasSupportedSignature(inputFormat, header) {
  if (!Buffer.isBuffer(header)) return true;
  if (inputFormat === 'pdf') return header.subarray(0, 5).toString('ascii') === '%PDF-';
  return header.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) || header.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
}

function inspectOmrInputWithHeader(filePath, stat, header) {
  const result = inspectOmrInput(filePath, stat);
  if (result.usable && !hasSupportedSignature(result.inputFormat, header)) return { ...result, usable: false, reason: 'invalid-signature' };
  return result;
}

module.exports = { MAX_OMR_INPUT_BYTES, hasSupportedSignature, inspectOmrInput, inspectOmrInputWithHeader };
