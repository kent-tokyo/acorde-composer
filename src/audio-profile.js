(function () {
  const fallback = () => ({ provider: 'oscillator', path: null, version: null, license: null, offline: true });
  const soundfont = (path) => ({ provider: 'soundfont', path, version: null, license: 'user-supplied', offline: true });
  window.AcordeAudioProfile = { fallback, soundfont };
})();
