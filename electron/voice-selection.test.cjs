const test = require('node:test');
const assert = require('node:assert/strict');
const voiceSelection = require('../src/voice-selection.js');

const twoVoiceScoreWithEmptySlots = { parts: [{ staves: [{ measures: [{ voices: [[{ pitch: 'C4' }], [{ pitch: 'G3' }], [], []], source_voice_numbers: [1, 2, null, null] }] }] }] };

test('voice selection exposes populated score slots, not empty internal slots', () => {
  assert.deepEqual(voiceSelection.slots(twoVoiceScoreWithEmptySlots), [0, 1]);
  assert.equal(voiceSelection.sourceNumber(twoVoiceScoreWithEmptySlots, 0, 0), 1);
  assert.equal(voiceSelection.sourceNumber(twoVoiceScoreWithEmptySlots, 0, 1), 2);
});

test('voice selection keeps slot identity and wraps shortcuts across available voices', () => {
  assert.equal(voiceSelection.resolveSlot(twoVoiceScoreWithEmptySlots, 0, 3), 0);
  assert.equal(voiceSelection.stepSlot(twoVoiceScoreWithEmptySlots, 0, 0, 1), 1);
  assert.equal(voiceSelection.stepSlot(twoVoiceScoreWithEmptySlots, 0, 1, 1), 0);
  assert.equal(voiceSelection.stepSlot(twoVoiceScoreWithEmptySlots, 0, 0, -1), 1);
});
