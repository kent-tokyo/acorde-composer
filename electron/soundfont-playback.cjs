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
  const loopSource = source.loop_points ?? source.loop;
  const loop = loopSource && typeof loopSource === 'object'
    ? { start: finiteInt(loopSource.start ?? loopSource.startFrame ?? loopSource.start_frame, null, 0), end: finiteInt(loopSource.end ?? loopSource.endFrame ?? loopSource.end_frame, null, 1) }
    : null;
  const envelopeSource = source.envelope && typeof source.envelope === 'object' ? source.envelope : source;
  const numberOr = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const envelope = envelopeSource
    ? { attack: numberOr(envelopeSource.attack ?? envelopeSource.attackSecs ?? envelopeSource.attack_secs, 0), decay: numberOr(envelopeSource.decay ?? envelopeSource.decaySecs ?? envelopeSource.decay_secs, 0), sustain: numberOr(envelopeSource.sustain ?? envelopeSource.sustainLevel ?? envelopeSource.sustain_level, 1), release: numberOr(envelopeSource.release ?? envelopeSource.releaseSecs ?? envelopeSource.release_secs, 0) }
    : null;
  return {
    bank, program, sampleId, keyMin, keyMax, velocityMin, velocityMax,
    sampleRate, rootMidi, startFrame, endFrame,
    tuningCents: numberOr(source.tuningCents ?? source.tuning_cents ?? source.fineTuneCents ?? source.fine_tune_cents, 0),
    gain: Number.isFinite(source.gain) ? Number(source.gain) : 1,
    loop: loop && loop.start !== null && loop.end !== null && loop.start < loop.end ? loop : null,
    envelope: envelope && envelope.attack >= 0 && envelope.decay >= 0 && envelope.sustain >= 0 && envelope.sustain <= 1 && envelope.release >= 0 ? envelope : null,
    valid,
    diagnostics: valid ? [] : ['invalid-resolved-zone'],
  };
}

function selectResolvedZone(zones, { bank = 0, program = 0, pitchMidi = 60, velocity = 100 } = {}) {
  return selectResolvedZones(zones, { bank, program, pitchMidi, velocity })[0] || null;
}

function selectResolvedZones(zones, { bank = 0, program = 0, pitchMidi = 60, velocity = 100 } = {}) {
  if (!Number.isInteger(bank) || !Number.isInteger(program) || !Number.isInteger(pitchMidi) || !Number.isInteger(velocity)) return [];
  return (Array.isArray(zones) ? zones : [])
    .slice(0, MAX_ZONES)
    .map(normalizeResolvedZone)
    .filter((zone) => zone.valid && zone.bank === bank && zone.program === program && pitchMidi >= zone.keyMin && pitchMidi <= zone.keyMax && velocity >= zone.velocityMin && velocity <= zone.velocityMax)
    .sort((left, right) => (left.keyMax - left.keyMin) - (right.keyMax - right.keyMin) || (left.velocityMax - left.velocityMin) - (right.velocityMax - right.velocityMin) || left.sampleId - right.sampleId);
}

function attachResolvedSample(events, zones, samplesById, selection = {}) {
  const diagnostics = [];
  const sourceZones = Array.isArray(zones) ? zones : [];
  if (sourceZones.length > MAX_ZONES) diagnostics.push('zone-list-truncated');
  const normalizedZones = sourceZones.slice(0, MAX_ZONES).map(normalizeResolvedZone);
  if (normalizedZones.some((zone) => !zone.valid)) diagnostics.push('invalid-resolved-zone');
  const output = (Array.isArray(events) ? events : []).map((event) => {
    if (!event || event.is_metronome) return event;
    const zone = selectResolvedZone(normalizedZones, { bank: selection.bank ?? 0, program: selection.program ?? 0, pitchMidi: event.pitch_midi, velocity: event.velocity });
    if (!zone) return event;
    const sample = samplesById && typeof samplesById === 'object' ? samplesById[String(zone.sampleId)] || samplesById[zone.sampleId] : null;
    if (!sample) { diagnostics.push(`sample-missing:${zone.sampleId}`); return event; }
    const decodedSample = { ...sample };
    if (zone.rootMidi !== null) decodedSample.rootMidi = zone.rootMidi;
    if (zone.loop) { decodedSample.loopStart = zone.loop.start; decodedSample.loopEnd = zone.loop.end; }
    return { ...event, resolved_zone: zone, decoded_sample: decodedSample, sample_envelope: zone.envelope, sample_gain: zone.gain, sample_tuning_cents: zone.tuningCents };
  });
  return { events: output, diagnostics: [...new Set(diagnostics)] };
}

function attachResolvedSnapshot(events, snapshot, samplesById, selection = {}) {
  if (!snapshot || typeof snapshot !== 'object' || !Array.isArray(snapshot.zones)) {
    return { events: Array.isArray(events) ? events : [], diagnostics: ['snapshot-missing'] };
  }
  const preset = snapshot.preset && typeof snapshot.preset === 'object' ? snapshot.preset : {};
  const explicitBank = Number.isInteger(selection.bank) ? selection.bank : null;
  const explicitProgram = Number.isInteger(selection.program) ? selection.program : null;
  const snapshotBank = Number.isInteger(preset.bank) ? preset.bank : null;
  const snapshotProgram = Number.isInteger(preset.program) ? preset.program : null;
  if ((explicitBank === null || explicitProgram === null) && (snapshotBank === null || snapshotProgram === null)) {
    return { events: Array.isArray(events) ? events : [], diagnostics: ['snapshot-preset-missing'] };
  }
  const attached = attachResolvedSample(events, snapshot.zones, samplesById, {
    bank: explicitBank ?? snapshotBank,
    program: explicitProgram ?? snapshotProgram,
  });
  const providerDiagnostics = Array.isArray(snapshot.diagnostics)
    ? snapshot.diagnostics.slice(0, 4096).map((diagnostic) => typeof diagnostic === 'string' ? diagnostic : 'provider-zone-diagnostic')
    : [];
  return { ...attached, diagnostics: [...new Set([...providerDiagnostics, ...attached.diagnostics])] };
}

// Acorde materializes preset-zone snapshots. This adapter preserves every matching
// layer for the Web Audio scheduler instead of collapsing layered presets to one zone.
function attachResolvedLayers(events, zones, samplesById, selection = {}) {
  const diagnostics = [];
  const sourceZones = Array.isArray(zones) ? zones : [];
  if (sourceZones.length > MAX_ZONES) diagnostics.push('zone-list-truncated');
  const normalizedZones = sourceZones.slice(0, MAX_ZONES).map(normalizeResolvedZone);
  if (normalizedZones.some((zone) => !zone.valid)) diagnostics.push('invalid-resolved-zone');
  const output = [];
  for (const event of Array.isArray(events) ? events : []) {
    if (!event || event.is_metronome) { output.push(event); continue; }
    const layers = selectResolvedZones(normalizedZones, { bank: selection.bank ?? 0, program: selection.program ?? 0, pitchMidi: event.pitch_midi, velocity: event.velocity });
    if (!layers.length) { output.push(event); continue; }
    for (const [layerIndex, zone] of layers.entries()) {
      const sample = samplesById && typeof samplesById === 'object' ? samplesById[String(zone.sampleId)] || samplesById[zone.sampleId] : null;
      if (!sample) { diagnostics.push(`sample-missing:${zone.sampleId}`); continue; }
      const decodedSample = { ...sample };
      if (zone.rootMidi !== null) decodedSample.rootMidi = zone.rootMidi;
      if (zone.loop) { decodedSample.loopStart = zone.loop.start; decodedSample.loopEnd = zone.loop.end; }
      output.push({ ...event, soundfont_layer: layerIndex, resolved_zone: zone, decoded_sample: decodedSample, sample_envelope: zone.envelope, sample_gain: zone.gain, sample_tuning_cents: zone.tuningCents });
    }
  }
  return { events: output, diagnostics: [...new Set(diagnostics)] };
}

module.exports = { MAX_ZONES, normalizeResolvedZone, selectResolvedZone, selectResolvedZones, attachResolvedSample, attachResolvedSnapshot, attachResolvedLayers };
