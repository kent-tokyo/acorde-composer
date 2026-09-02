(function () {
  class OscillatorAudioBackend {
    constructor() { this.context = null; this.master = null; this.masterPanner = null; this.nodes = new Set(); this.channels = new Set(); this.channelBuses = new Map(); }
    async resume() { this.context ||= new AudioContext(); if (!this.master) { this.master = this.context.createGain(); this.masterPanner = this.context.createStereoPanner(); this.master.connect(this.masterPanner).connect(this.context.destination); } if (this.outputDeviceId) { try { await this.setOutputDevice(this.outputDeviceId); } catch { this.outputDeviceId = null; } } await this.context.resume(); return this.context; }
    setMasterControls({ volume = 1, pan = 0, mute = false } = {}) { if (!this.master || !this.masterPanner) return; this.master.gain.value = mute ? 0 : Math.max(0, Math.min(1, Number(volume))); this.masterPanner.pan.value = Math.max(-1, Math.min(1, Number(pan))); }
    async setOutputDevice(deviceId) { if (!this.context || !deviceId || typeof this.context.setSinkId !== 'function') return false; await this.context.setSinkId(deviceId); this.outputDeviceId = deviceId; return true; }
    schedule(events, start, channel = {}, channelKey = null) {
      if (channel.mute) return;
      const gainScale = Math.max(0, Math.min(1, Number(channel.volume ?? 1)));
      const panner = this.context.createStereoPanner(); const channelGain = this.context.createGain();
      channelGain.gain.value = gainScale; panner.pan.value = Math.max(-1, Math.min(1, Number(channel.pan ?? 0))); channelGain.connect(panner).connect(this.master); this.channels.add(channelGain); this.channels.add(panner); if (channelKey !== null) this.channelBuses.set(channelKey, { gain: channelGain, panner });
      events.forEach((item) => { const oscillator = this.context.createOscillator(); const gain = this.context.createGain(); oscillator.type = item.is_metronome ? 'square' : 'sine'; oscillator.frequency.value = item.is_metronome ? 1200 : 440 * 2 ** ((item.pitch_midi - 69) / 12); gain.gain.setValueAtTime(Math.max(0.03, item.velocity / 1270), start + item.time_secs); gain.gain.exponentialRampToValueAtTime(0.001, start + item.time_secs + Math.max(0.04, item.duration_secs)); oscillator.connect(gain).connect(channelGain); oscillator.start(start + item.time_secs); oscillator.stop(start + item.time_secs + Math.max(0.05, item.duration_secs)); this.nodes.add(oscillator); oscillator.addEventListener('ended', () => this.nodes.delete(oscillator)); });
    }
    setChannelControls(channelKey, { volume = 1, pan = 0, mute = false } = {}) { const bus = this.channelBuses.get(channelKey); if (!bus) return false; bus.gain.gain.value = mute ? 0 : Math.max(0, Math.min(1, Number(volume))); bus.panner.pan.value = Math.max(-1, Math.min(1, Number(pan))); return true; }
    stopAll() { this.nodes.forEach((node) => { try { node.stop(); } catch {} try { node.disconnect(); } catch {} }); this.nodes.clear(); this.channels.forEach((node) => { try { node.disconnect(); } catch {} }); this.channels.clear(); this.channelBuses.clear(); }
    async dispose() { this.stopAll(); if (this.context && this.context.state !== 'closed') await this.context.close(); this.context = null; this.master = null; this.masterPanner = null; }
  }
  window.AcordeAudioBackend = OscillatorAudioBackend;
})();
