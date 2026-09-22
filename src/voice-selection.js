(function initVoiceSelection(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AcordeVoiceSelection = api;
})(typeof globalThis === 'object' ? globalThis : this, function voiceSelectionFactory() {
  'use strict';

  function slots(score, partIndex = 0) {
    const present = new Set();
    for (const staff of score?.parts?.[partIndex]?.staves || []) for (const measure of staff.measures || []) (measure.voices || []).forEach((voice, index) => { if (Array.isArray(voice) && voice.length) present.add(index); });
    return present.size ? [...present].sort((left, right) => left - right) : [0];
  }

  function sourceNumber(score, partIndex = 0, slot = 0) {
    for (const staff of score?.parts?.[partIndex]?.staves || []) for (const measure of staff.measures || []) {
      const value = measure.source_voice_numbers?.[slot];
      if (Number.isInteger(value) && value > 0) return value;
    }
    return slot + 1;
  }

  function resolveSlot(score, partIndex = 0, requestedSlot = 0) {
    const available = slots(score, partIndex);
    const numeric = Number(requestedSlot);
    return available.includes(numeric) ? numeric : available[0];
  }

  function stepSlot(score, partIndex = 0, currentSlot = 0, direction = 1) {
    const available = slots(score, partIndex); const current = resolveSlot(score, partIndex, currentSlot);
    const next = (available.indexOf(current) + (direction < 0 ? -1 : 1) + available.length) % available.length;
    return available[next];
  }

  return { slots, sourceNumber, resolveSlot, stepSlot };
});
