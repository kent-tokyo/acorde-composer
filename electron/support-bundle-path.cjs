const DEFAULT_SUPPORT_BUNDLE_FILENAME = 'acorde-support-bundle.json';

function supportBundleSaveDialogOptions(suggestedName) {
  const defaultPath = typeof suggestedName === 'string' && suggestedName.trim() ? suggestedName : DEFAULT_SUPPORT_BUNDLE_FILENAME;
  return { defaultPath, filters: [{ name: 'Acorde support bundle', extensions: ['json'] }] };
}

function supportBundleSaveResult(result) {
  if (!result || result.canceled === true || typeof result.filePath !== 'string' || !result.filePath.trim()) return null;
  return result.filePath;
}

module.exports = { DEFAULT_SUPPORT_BUNDLE_FILENAME, supportBundleSaveDialogOptions, supportBundleSaveResult };
