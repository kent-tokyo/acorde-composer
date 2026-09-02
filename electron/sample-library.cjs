const MAX_LIBRARY_MANIFEST_BYTES = 256 * 1024;
const LICENSE_STATUSES = new Set(['unreviewed', 'accepted', 'rejected']);
const LIBRARY_STATUSES = new Set(['installed', 'active', 'inactive', 'removed']);

function normalizeSampleLibrary(value) {
  const source = value && typeof value === 'object' ? value : {};
  const licenseStatus = LICENSE_STATUSES.has(source.licenseStatus) ? source.licenseStatus : 'unreviewed';
  const instruments = Array.isArray(source.instruments)
    ? source.instruments.filter((item) => typeof item === 'string' && item.length > 0).slice(0, 256)
    : [];
  return {
    id: typeof source.id === 'string' && source.id.length > 0 ? source.id : null,
    name: typeof source.name === 'string' && source.name.length > 0 ? source.name : null,
    provider: typeof source.provider === 'string' && source.provider.length > 0 ? source.provider : null,
    version: typeof source.version === 'string' && source.version.length > 0 ? source.version : null,
    rootPath: typeof source.rootPath === 'string' && source.rootPath.length > 0 ? source.rootPath : null,
    checksum: typeof source.checksum === 'string' && /^[a-f0-9]{64}$/i.test(source.checksum) ? source.checksum.toLowerCase() : null,
    offline: source.offline === undefined ? true : Boolean(source.offline),
    redistributable: Boolean(source.redistributable),
    licenseStatus,
    instruments,
  };
}

function canActivateSampleLibrary(value) {
  const library = normalizeSampleLibrary(value);
  return Boolean(library.id && library.version && library.rootPath && library.checksum && library.licenseStatus === 'accepted');
}

function assessSampleLibrary(value, { offlineRequired = false } = {}) {
  const library = normalizeSampleLibrary(value);
  const diagnostics = [];
  if (!library.id || !library.name || !library.provider) diagnostics.push('identity-incomplete');
  if (!library.version) diagnostics.push('version-missing');
  if (!library.rootPath) diagnostics.push('root-path-missing');
  if (!library.checksum) diagnostics.push('checksum-missing');
  if (library.licenseStatus !== 'accepted') diagnostics.push(`license-${library.licenseStatus}`);
  if (offlineRequired && !library.offline) diagnostics.push('offline-unavailable');
  return { library, usable: diagnostics.length === 0, portable: diagnostics.length === 0 && library.offline, diagnostics };
}

function normalizeSampleLibraryRecord(value) {
  const source = value && typeof value === 'object' ? value : {};
  const library = normalizeSampleLibrary(source.library || source);
  const assessment = assessSampleLibrary(library, { offlineRequired: source.offlineRequired === true });
  const status = LIBRARY_STATUSES.has(source.status) ? source.status : 'installed';
  const valid = assessment.usable && (status !== 'active' || canActivateSampleLibrary(library));
  return { ...library, status: valid ? status : 'inactive', active: valid && status === 'active', valid, portable: assessment.portable, diagnostics: assessment.diagnostics };
}

function transitionSampleLibrary(value, action, nextValue) {
  const current = normalizeSampleLibraryRecord(value);
  if (action === 'remove') return { ...current, status: 'removed', active: false, valid: true, diagnostics: [] };
  if (action === 'deactivate') return { ...current, status: 'inactive', active: false };
  if (action === 'activate') {
    if (!current.valid || !canActivateSampleLibrary(current)) return { ...current, status: 'inactive', active: false, valid: false, diagnostics: current.diagnostics.length ? current.diagnostics : ['activation-rejected'] };
    return { ...current, status: 'active', active: true };
  }
  if (action === 'install') return { ...normalizeSampleLibraryRecord(nextValue), status: 'installed', active: false };
  if (action === 'update') {
    const candidate = normalizeSampleLibraryRecord(nextValue);
    if (candidate.id !== current.id) return { ...current, status: 'inactive', active: false, valid: false, diagnostics: ['library-id-mismatch'] };
    return { ...candidate, status: 'inactive', active: false };
  }
  return { ...current, status: 'inactive', active: false, valid: false, diagnostics: ['unknown-library-action'] };
}

function createSampleLibraryRegistry(initial = []) {
  const records = new Map();
  for (const value of Array.isArray(initial) ? initial : []) {
    const record = normalizeSampleLibraryRecord(value);
    if (record.id) records.set(record.id, record);
  }
  return {
    get: (id) => records.get(typeof id === 'string' ? id : '') || null,
    list: () => [...records.values()].sort((left, right) => left.id.localeCompare(right.id)),
    transition: (id, action, nextValue) => {
      const current = records.get(typeof id === 'string' ? id : '') || null;
      const result = transitionSampleLibrary(current, action, nextValue);
      if (result.id) records.set(result.id, result);
      return result;
    },
  };
}

function manifestWithinLimit(value) {
  try { return Buffer.byteLength(JSON.stringify(normalizeSampleLibrary(value)), 'utf8') <= MAX_LIBRARY_MANIFEST_BYTES; } catch { return false; }
}

module.exports = { LIBRARY_STATUSES, MAX_LIBRARY_MANIFEST_BYTES, assessSampleLibrary, normalizeSampleLibrary, normalizeSampleLibraryRecord, transitionSampleLibrary, createSampleLibraryRegistry, canActivateSampleLibrary, manifestWithinLimit };
