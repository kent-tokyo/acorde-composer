(function () {
  const clamp = (value, min, max, fallback) => {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : fallback;
  };
  function normalize(state, partCount = null) {
    const source = state || {};
    const master = source.master || {};
    const channels = {};
    const indexes = partCount == null ? Object.keys(source.channels || {}).map(Number).filter(Number.isInteger).sort((a, b) => a - b) : Array.from({ length: partCount }, (_, index) => index);
    for (const index of indexes) {
      const channel = source.channels?.[index] || {};
      channels[index] = { volume: clamp(channel.volume, 0, 1, 1), pan: clamp(channel.pan, -1, 1, 0), mute: Boolean(channel.mute), solo: Boolean(channel.solo) };
    }
    return { ...source, master: { volume: clamp(master.volume, 0, 1, 1), pan: clamp(master.pan, -1, 1, 0), mute: Boolean(master.mute) }, soloPiano: Boolean(source.soloPiano), metronome: Boolean(source.metronome), outputDeviceId: typeof source.outputDeviceId === 'string' ? source.outputDeviceId : null, soundfont: source.soundfont || { provider: 'oscillator', path: null, version: null, license: null, offline: true }, channels };
  }
  window.AcordeMixerState = { normalize };
})();
