const test = require('node:test');
const assert = require('node:assert/strict');
const workspace = require('../src/musescore-workspace.js');

const address = { part: 0, staff: 0, measure: 0, voice: 1, note: 0 };
const score = {
  parts: [{ staves: [{ measures: [{ voices: [[], [{
    is_rest: false,
    pitches: [{ step: 'C', octave: 4, alter: 1 }],
    duration: 'Quarter',
    dot_count: 1,
    dynamic: 'Mf',
    stem_up: false,
    fingering: 3,
    string_number: 2,
  }]] }] }] }],
};

test('MuseScore palette contract exposes ordered, actionable notation groups', () => {
  assert.deepEqual(workspace.PALETTE_GROUPS.slice(0, 4).map((group) => group.id), ['clefs', 'key-signatures', 'time-signatures', 'accidentals']);
  assert.ok(workspace.PALETTE_GROUPS.some((group) => group.id === 'dynamics'));
  assert.ok(workspace.PALETTE_GROUPS.some((group) => group.id === 'lines'));
  assert.ok(workspace.PALETTE_GROUPS.some((group) => group.id === 'layout'));
  for (const group of workspace.PALETTE_GROUPS) for (const item of group.items) assert.ok(item.target || item.command, `${group.id}/${item.label} is actionable`);
  assert.equal(workspace.paletteLabel('Palettes', 'ja'), 'Palettes');
  assert.equal(workspace.paletteLabel('Clefs', 'ja'), '音部記号');
  assert.equal(workspace.paletteLabel('Layout', 'zh'), '布局');
});

test('MuseScore duration shortcuts only advertise durations supported by acorde', () => {
  assert.deepEqual(workspace.DURATION_SHORTCUTS, {
    1: 'sixtyfourth', 2: 'thirtysecond', 3: 'sixteenth', 4: 'eighth', 5: 'quarter', 6: 'half', 7: 'whole',
  });
  assert.equal(workspace.DURATION_SHORTCUTS[8], undefined);
  assert.equal(workspace.DURATION_SHORTCUTS[9], undefined);
});

test('selection snapshot reads note properties without mutating the score', () => {
  const before = JSON.stringify(score);
  assert.deepEqual(workspace.selectionSnapshot(score, address), {
    selected: true,
    kind: 'note',
    label: 'C♯4 · measure 1 · voice 2',
    duration: 'quarter',
    dotted: true,
    dynamic: 'Mf',
    stem: 'down',
    fingering: '3',
    stringNumber: '2',
  });
  assert.equal(JSON.stringify(score), before);
  assert.deepEqual(workspace.selectionSnapshot(score, { ...address, note: 99 }), { selected: false });
});

test('selection properties compile to existing acorde ScoreCommands', () => {
  assert.deepEqual(workspace.propertyCommand('duration', 'Half', address, { dotted: true }), { type: 'set_duration', part_index: 0, staff_index: 0, measure_index: 0, note_index: 0, voice: 1, duration: 'Half', dot_count: 1 });
  assert.deepEqual(workspace.propertyCommand('dynamic', '', address), { type: 'set_dynamic', part_index: 0, staff_index: 0, measure_index: 0, note_index: 0, voice: 1, dynamic: null });
  assert.deepEqual(workspace.propertyCommand('stem', 'auto', address), { type: 'set_stem', part_index: 0, staff_index: 0, measure_index: 0, note_index: 0, voice_index: 1, stem_up: null });
  assert.deepEqual(workspace.propertyCommand('fingering', '', address), { type: 'set_fingering', part_index: 0, staff_index: 0, measure_index: 0, note_index: 0, voice: 1, fingering: null });
  assert.equal(workspace.propertyCommand('unknown', '', address), null);
});
