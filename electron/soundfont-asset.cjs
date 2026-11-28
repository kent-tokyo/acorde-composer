const path = require('node:path');

// Matches acorde_soundfont::MAX_ASSET_BYTES (Acorde 2.0.0). The engine reads the
// file itself by path, so this is the real asset ceiling rather than a JSON
// transport limit; larger files are reported as `too-large` before any read.
const MAX_SOUNDFONT_BYTES = 64 * 1024 * 1024;
const SOUND_FONT_EXTENSIONS = new Set(['.sf2', '.sf3']);

function inspectSoundfontAsset(filePath, stat) {
  const value = typeof filePath === 'string' ? filePath : '';
  const extension = path.extname(value).toLowerCase();
  if (!SOUND_FONT_EXTENSIONS.has(extension)) return { exists: false, path: value, reason: 'unsupported-extension' };
  if (!stat) return { exists: false, path: value, reason: 'missing' };
  if (!stat.isFile) return { exists: false, path: value, reason: 'not-file' };
  if (!Number.isSafeInteger(stat.size) || stat.size < 0) return { exists: false, path: value, reason: 'invalid-size' };
  if (stat.size > MAX_SOUNDFONT_BYTES) return { exists: false, path: value, reason: 'too-large', sizeBytes: stat.size, maxBytes: MAX_SOUNDFONT_BYTES };
  return { exists: true, path: value, reason: null, sizeBytes: stat.size, maxBytes: MAX_SOUNDFONT_BYTES };
}

module.exports = { MAX_SOUNDFONT_BYTES, inspectSoundfontAsset };
