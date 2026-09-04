const MAX_ZONES = 4096;

function finiteInt(value, fallback = null, min = 0, max = Number.MAX_SAFE_INTEGER) {
  return Number.isInteger(value) && value >= min && value <= max ? value : fallback;
}

function normalizeResolvedZone(value) {
  const source = value && typeof value === 'object' ? value : {};
  const bank = finiteInt(source.bank, null, 0, 16383);
  const program = finiteInt(source.program, null, 0, 127);
  const sampleId = finiteInt(source.sampleId ?? source.sample_id, null, 1);
  const keyMin = finiteInt(source.keyMin ?? source.key_min, 0, 0, 127);
  const keyMax = finiteInt(source.keyMax ?? source.key_max, 127, 0, 127);
  const velocityMin = finiteInt(source.velocityMin ?? source.velocity_min, 1, 1, 127);
  const velocityMax = finiteInt(source.velocityMax ?? source.velocity_max, 127, 1, 127);
  const sampleRate = finiteInt(source.sampleRate ?? source.sample_rate, null, 1, 384000);
  const rootMidi = finiteInt(source.rootMidi ?? source.root_key, null, 0, 127);
  const startFrame = finiteInt(source.startFrame ?? source.start_frame, 0, 0);
  const endFrame = finiteInt(source.endFrame ?? source.end_frame, null, 1);
  const valid = bank !== null && program !== null && sampleId !== null
    && keyMin <= keyMax && velocityMin <= velocityMax
    && sampleRate !== null && endFrame !== null && startFrame < endFrame;
  const loop = source.loop && typeof source.loop === 'object'
    ? { start: finiteInt(source.loop.start ?? source.loop.startFrame, null, 0), end: finiteInt(source.loop.end ?? source.loop.endFrame, null, 1) }
    : null;
  const envelope = source.envelope && typeof source.envelope === 'object'
    ? { attack: Number(source.envelope.attack ?? source.envelope.attackSecs) || 0, decay: Number(source.envelope.decay ?? source.envelope.decaySecs) || 0, sustain: Number(source.envelope.sustain ?? source.envelope.sustainLevel) || 1, release: Number(source.envelope.release ?? source.envelope.releaseSecs) || 0 }
    : null;
  return {
    bank, program, sampleId, keyMin, keyMax, velocityMin, velocityMax,
    sampleRate, rootMidi, startFrame, endFrame,
    tuningCents: Number.isFinite(source.tuningCents ?? source.tuning_cents) ? Number(source.tuningCents ?? source.tuning_cents) : 0,
    gain: Number.isFinite(source.gain) ? Number(source.gain) : 1,
    loop: loop && loop.start !== null && loop.end !== null && loop.start < loop.end ? loop : null,
    envelope: envelope && envelope.attack >= 0 && envelope.decay >= 0 && envelope.sustain >= 0 && envelope.sustain <= 1 && envelope.release >= 0 ? envelope : null,
    valid,
    diagnostics: valid ? [] : ['invalid-resolved-zone'],
  };
}

function selectResolvedZone(zones, { bank = 0, program = 0, pitchMidi = 60, velocity = 100 } = {}) {
  if (!Number.isInteger(bank) || !Number.isInteger(program) || !Number.isInteger(pitchMidi) || !Number.isInteger(velocity)) return null;
  return (Array.isArray(zones) ? zones : [])
    .slice(0, MAX_ZONES)
    .map(normalizeResolvedZone)
    .filter((zone) => zone.valid && zone.bank === bank && zone.program === program && pitchMidi >= zone.keyMin && pitchMidi <= zone.keyMax && velocity >= zone.velocityMin && velocity <= zone.velocityMax)
    .sort((left, right) => (left.keyMax - left.keyMin) - (right.keyMax - right.keyMin) || (left.velocityMax - left.velocityMin) - (right.velocityMax - right.velocityMin) || left.sampleId - right.sampleId)[0] || null;
}

function attachResolvedSample(events, zones, samplesById, selection = {}) {
  const diagnostics = [];
  const output = (Array.isArray(events) ? events : []).map((event) => {
    if (!event || event.is_metronome) return event;
    const zone = selectResolvedZone(zones, { bank: selection.bank ?? 0, program: selection.program ?? 0, pitchMidi: event.pitch_midi, velocity: event.velocity });
    if (!zone) return event;
    const sample = samplesById && typeof samplesById === 'object' ? samplesById[String(zone.sampleId)] || samplesById[zone.sampleId] : null;
    if (!sample) { diagnostics.push(`sample-missing:${zone.sampleId}`); return event; }
    return { ...event, resolved_zone: zone, decoded_sample: sample };
  });
  return { events: output, diagnostics: [...new Set(diagnostics)] };
}

module.exports = { MAX_ZONES, normalizeResolvedZone, selectResolvedZone, attachResolvedSample };
