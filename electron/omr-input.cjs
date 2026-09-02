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

module.exports = { MAX_OMR_INPUT_BYTES, inspectOmrInput };
