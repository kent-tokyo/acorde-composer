const VALID_STATUSES = new Set([
  'missing',
  'preserved',
  'editable',
  'rendered',
  'playable',
  'roundtrip-tested',
  'release-ready',
]);

function validateNotationCoverageMatrix(input) {
  const errors = [];
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { valid: false, errors: ['matrix must be an object'] };
  }
  if (input.schemaVersion !== 1) errors.push('schemaVersion must be 1');
  if (typeof input.engine !== 'string' || !/^acorde@\d+\.\d+\.\d+$/.test(input.engine)) {
    errors.push('engine must be a pinned acorde semver');
  }
  const requiredLayers = Array.isArray(input.requiredLayers) ? input.requiredLayers : [];
  if (!requiredLayers.length || new Set(requiredLayers).size !== requiredLayers.length) {
    errors.push('requiredLayers must be a non-empty unique array');
  }
  const knownLayers = new Set(requiredLayers);
  const elements = Array.isArray(input.elements) ? input.elements : [];
  if (!elements.length) errors.push('elements must be a non-empty array');
  const ids = new Set();
  for (const element of elements) {
    if (!element || typeof element !== 'object' || Array.isArray(element)) {
      errors.push('each element must be an object');
      continue;
    }
    if (typeof element.id !== 'string' || !element.id) errors.push('element id is required');
    else if (ids.has(element.id)) errors.push(`duplicate element id: ${element.id}`);
    else ids.add(element.id);
    if (typeof element.category !== 'string' || !element.category) errors.push(`category is required for ${element.id || 'unknown'}`);
    if (typeof element.fixturePath !== 'string' || !element.fixturePath.endsWith('.musicxml')) errors.push(`fixturePath must be a MusicXML path for ${element.id || 'unknown'}`);
    if (!VALID_STATUSES.has(element.status)) errors.push(`invalid status for ${element.id || 'unknown'}`);
    if (!Array.isArray(element.layers) || !element.layers.length) {
      errors.push(`layers are required for ${element.id || 'unknown'}`);
      continue;
    }
    const layers = new Set(element.layers);
    if (layers.size !== element.layers.length) errors.push(`duplicate layers for ${element.id}`);
    for (const layer of layers) if (!knownLayers.has(layer)) errors.push(`unknown layer ${layer} for ${element.id}`);
    if (element.status === 'release-ready' && !requiredLayers.every((layer) => layers.has(layer))) {
      errors.push(`release-ready element is missing required layers: ${element.id}`);
    }
  }
  return { valid: errors.length === 0, errors };
}

module.exports = { validateNotationCoverageMatrix };
