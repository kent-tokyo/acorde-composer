(function () {
  class OscillatorAudioBackend {
    constructor() { this.context = null; this.master = null; this.masterPanner = null; this.nodes = new Set(); this.channels = new Set(); this.channelBuses = new Map(); this.sampleBuffers = new Map(); this.sustainNodes = new Map(); this.sustainPedals = new Map(); this.maxPolyphony = 128; }
    async resume() { this.context ||= new AudioContext(); if (!this.master) { this.master = this.context.createGain(); this.masterPanner = this.context.createStereoPanner(); this.master.connect(this.masterPanner).connect(this.context.destination); } if (this.outputDeviceId) { try { await this.setOutputDevice(this.outputDeviceId); } catch { this.outputDeviceId = null; } } await this.context.resume(); return this.context; }
    setMasterControls({ volume = 1, pan = 0, mute = false } = {}) { if (!this.master || !this.masterPanner) return; this.master.gain.value = mute ? 0 : Math.max(0, Math.min(1, Number(volume))); this.masterPanner.pan.value = Math.max(-1, Math.min(1, Number(pan))); }
    setMaxPolyphony(value = 128) { this.maxPolyphony = Number.isSafeInteger(value) ? Math.max(1, Math.min(512, value)) : 128; }
    enforcePolyphony() { while (this.nodes.size >= this.maxPolyphony) { const oldest = this.nodes.values().next().value; if (!oldest) break; try { oldest.stop(); } catch {} try { oldest.disconnect(); } catch {} this.nodes.delete(oldest); } }
    async setOutputDevice(deviceId = null) { if (!this.context || typeof this.context.setSinkId !== 'function') return false; await this.context.setSinkId(deviceId || ''); this.outputDeviceId = deviceId || null; return true; }
    schedule(events, start, channel = {}, channelKey = null) {
      if (channel.mute) return;
      const gainScale = Math.max(0, Math.min(1, Number(channel.volume ?? 1)));
      const panner = this.context.createStereoPanner(); const channelGain = this.context.createGain();
      channelGain.gain.value = gainScale; panner.pan.value = Math.max(-1, Math.min(1, Number(channel.pan ?? 0))); channelGain.connect(panner).connect(this.master); this.channels.add(channelGain); this.channels.add(panner); if (channelKey !== null) this.channelBuses.set(channelKey, { gain: channelGain, panner });
      events.forEach((item) => {
        this.enforcePolyphony();
        if (item.decoded_sample) { this.scheduleDecodedSample(item.decoded_sample, item, start, channelGain, channelKey); return; }
        const oscillator = this.context.createOscillator(); const gain = this.context.createGain(); oscillator.type = item.is_metronome ? 'square' : 'sine'; oscillator.frequency.value = item.is_metronome ? 1200 : 440 * 2 ** ((item.pitch_midi - 69) / 12); gain.gain.setValueAtTime(Math.max(0.03, item.velocity / 1270), start + item.time_secs); gain.gain.exponentialRampToValueAtTime(0.001, start + item.time_secs + Math.max(0.04, item.duration_secs)); oscillator.connect(gain).connect(channelGain); oscillator.start(start + item.time_secs); oscillator.stop(start + item.time_secs + Math.max(0.05, item.duration_secs)); this.nodes.add(oscillator); oscillator.addEventListener('ended', () => this.nodes.delete(oscillator));
      });
    }
    scheduleDecodedSample(sample, event, start, destination = this.master, channelKey = null) {
      if (!this.context || !sample || !destination) return null;
      const channels = Number.isInteger(sample.channels) ? Math.max(1, Math.min(2, sample.channels)) : 1;
      const sampleRate = Number.isFinite(sample.sampleRate) ? Math.max(1, sample.sampleRate) : 44100;
      const pcm = Array.isArray(sample.pcm) || ArrayBuffer.isView(sample.pcm) ? sample.pcm : null;
      if (!pcm || pcm.length === 0 || pcm.length % channels !== 0) return null;
      const frames = pcm.length / channels; const cacheKey = typeof sample.cacheKey === 'string' && sample.cacheKey.length <= 256 ? sample.cacheKey : null;
      let buffer = cacheKey ? this.sampleBuffers.get(cacheKey) : null;
      if (!buffer) {
        buffer = this.context.createBuffer(channels, frames, sampleRate);
        for (let channel = 0; channel < channels; channel++) {
          const data = buffer.getChannelData(channel);
          for (let frame = 0; frame < frames; frame++) data[frame] = Number(pcm[frame * channels + channel]) || 0;
        }
        if (cacheKey) this.sampleBuffers.set(cacheKey, buffer);
      }
      this.enforcePolyphony();
      const source = this.context.createBufferSource(); const gain = this.context.createGain();
      const when = start + Math.max(0, Number(event.time_secs) || 0);
      const duration = Math.max(0.01, Number(event.duration_secs) || frames / sampleRate);
      const velocity = Math.max(0, Math.min(1, (Number(event.velocity) || 0) / 127));
      const attack = Math.min(0.02, duration / 4); const release = Math.min(0.12, duration / 3);
      const sustain = Math.max(0.001, velocity * 0.82);
      source.buffer = buffer; source.loop = Number.isInteger(sample.loopStart) && Number.isInteger(sample.loopEnd) && sample.loopEnd > sample.loopStart;
      if (source.loop) { source.loopStart = sample.loopStart / sampleRate; source.loopEnd = Math.min(frames, sample.loopEnd) / sampleRate; }
      source.playbackRate.value = Number.isFinite(event.playback_rate) && event.playback_rate > 0 ? event.playback_rate : 1;
      gain.gain.setValueAtTime(0.0001, when); gain.gain.linearRampToValueAtTime(Math.max(0.0001, velocity), when + attack);
      gain.gain.setValueAtTime(sustain, when + attack); gain.gain.setValueAtTime(sustain, when + Math.max(attack, duration - release));
      gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
      source.connect(gain).connect(destination); source.start(when);
      const sustained = (Boolean(event.sustain) || this.sustainPedals.get(channelKey) === true) && channelKey !== null;
      if (!sustained) source.stop(when + duration);
      if (sustained) { if (!this.sustainNodes.has(channelKey)) this.sustainNodes.set(channelKey, new Set()); this.sustainNodes.get(channelKey).add(source); }
      this.nodes.add(source); source.addEventListener('ended', () => { this.nodes.delete(source); this.sustainNodes.get(channelKey)?.delete(source); });
      return source;
    }
    releaseSustain(channelKey = null) {
      const nodes = this.sustainNodes.get(channelKey);
      if (!nodes) return 0;
      const count = nodes.size;
      nodes.forEach((node) => { try { node.stop((this.context?.currentTime || 0) + 0.05); } catch {} });
      this.sustainNodes.delete(channelKey); return count;
    }
    setSustain(channelKey = null, down = false) {
      if (channelKey === null) return false;
      this.sustainPedals.set(channelKey, down === true);
      if (!down) this.releaseSustain(channelKey);
      return true;
    }
    setChannelControls(channelKey, { volume = 1, pan = 0, mute = false } = {}) { const bus = this.channelBuses.get(channelKey); if (!bus) return false; bus.gain.gain.value = mute ? 0 : Math.max(0, Math.min(1, Number(volume))); bus.panner.pan.value = Math.max(-1, Math.min(1, Number(pan))); return true; }
    stopAll() { this.nodes.forEach((node) => { try { node.stop(); } catch {} try { node.disconnect(); } catch {} }); this.nodes.clear(); this.sustainNodes.clear(); this.sustainPedals.clear(); this.channels.forEach((node) => { try { node.disconnect(); } catch {} }); this.channels.clear(); this.channelBuses.clear(); }
    async dispose() { this.stopAll(); if (this.context && this.context.state !== 'closed') await this.context.close(); this.context = null; this.master = null; this.masterPanner = null; this.sampleBuffers.clear(); }
  }
  window.AcordeAudioBackend = OscillatorAudioBackend;
})();
