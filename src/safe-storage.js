(function initSafeStorage(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AcordeSafeStorage = api;
})(typeof globalThis === 'object' ? globalThis : this, function safeStorageFactory() {
  'use strict';

  function read(storage, key, fallback = null) {
    try {
      const value = storage?.getItem(key);
      return value === null || value === undefined ? fallback : value;
    } catch { return fallback; }
  }

  function write(storage, key, value) {
    try { storage?.setItem(key, value); return Boolean(storage); } catch { return false; }
  }

  function remove(storage, key) {
    try { storage?.removeItem(key); return Boolean(storage); } catch { return false; }
  }

  function readJson(storage, key, fallback = null) {
    const value = read(storage, key, null);
    if (value === null) return fallback;
    try { return JSON.parse(value); } catch { remove(storage, key); return fallback; }
  }

  function writeJson(storage, key, value) { return write(storage, key, JSON.stringify(value)); }

  return { read, write, remove, readJson, writeJson };
});
