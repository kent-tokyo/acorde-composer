(function () {
  const clamp = (value, min, max, fallback) => {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : fallback;
  };
  const normalizeSoundfont = (value) => {
    const source = value && typeof value === 'object' ? value : {};
    const provider = source.provider === 'soundfont' ? 'soundfont' : 'oscillator';
    const preset = source.preset && typeof source.preset === 'object' && Number.isInteger(source.preset.bank) && Number.isInteger(source.preset.program)
      ? { bank: source.preset.bank, program: source.preset.program, name: typeof source.preset.name === 'string' ? source.preset.name : null }
      : null;
    const presets = Array.isArray(source.presets) ? source.presets.filter((item) => item && Number.isInteger(item.bank) && Number.isInteger(item.program)).slice(0, 256).map((item) => ({ bank: item.bank, program: item.program, name: typeof item.name === 'string' ? item.name : null })) : [];
    return {
      provider,
      path: typeof source.path === 'string' && source.path.length > 0 ? source.path : null,
      version: typeof source.version === 'string' ? source.version : null,
      license: typeof source.license === 'string' ? source.license : null,
      checksum: typeof source.checksum === 'string' ? source.checksum : null,
      presetCount: Number.isSafeInteger(source.presetCount) && source.presetCount >= 0 ? source.presetCount : null,
      preset,
      presets,
      offline: source.offline === undefined ? true : Boolean(source.offline),
    };
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
    return { ...source, master: { volume: clamp(master.volume, 0, 1, 1), pan: clamp(master.pan, -1, 1, 0), mute: Boolean(master.mute) }, soloPiano: Boolean(source.soloPiano), metronome: Boolean(source.metronome), midiInputId: typeof source.midiInputId === 'string' && source.midiInputId.length > 0 ? source.midiInputId : null, outputDeviceId: typeof source.outputDeviceId === 'string' && source.outputDeviceId.length > 0 ? source.outputDeviceId : null, soundfont: normalizeSoundfont(source.soundfont), channels };
  }
  window.AcordeMixerState = { normalize };
})();
