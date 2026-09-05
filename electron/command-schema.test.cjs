const test = require('node:test');
const assert = require('node:assert/strict');
const { assertCommand, describeCommand } = require('./command-schema.cjs');

test('accepts supported nested command batches and describes operations', () => {
  const command = { type: 'batch', label: 'AI proposal', commands: [
    { type: 'add_note', part_index: 0, staff_index: 0, measure_index: 0, voice: 0, position: 0, duration: 'quarter', is_rest: false, pitch: { step: 'C', octave: 4, alter: 0 } },
    { type: 'set_duration', part_index: 0, staff_index: 0, measure_index: 0, voice: 0, note_index: 0, duration: 'half', dot_count: 0 },
  ] };
  assert.doesNotThrow(() => assertCommand(command));
  assert.deepEqual(describeCommand(command), ['Add note: C4 (part 1 · staff 1 · measure 1)', 'Change duration: half (part 1 · staff 1 · measure 1)']);
});

test('rejects unknown operations, invalid indexes, and empty batches', () => {
  assert.throws(() => assertCommand({ type: 'delete_everything' }), /not supported/);
  assert.throws(() => assertCommand({ type: 'add_note', measure_index: -1 }), /non-negative integer/);
  assert.throws(() => assertCommand({ type: 'batch', commands: [] }), /must not be empty/);
});

test('caps proposal batches before they reach the engine', () => {
  const commands = Array.from({ length: 65 }, () => ({ type: 'add_measure', after_index: 0 }));
  assert.throws(() => assertCommand({ type: 'batch', commands }), /exceeds 64/);
});

test('accepts notation annotation commands used by the editor', () => {
  assert.doesNotThrow(() => assertCommand({ type: 'set_dynamic', part_index: 0, staff_index: 0, measure_index: 0, voice: 0, note_index: 0, dynamic: 'Mf' }));
  assert.doesNotThrow(() => assertCommand({ type: 'set_grace', part_index: 0, staff_index: 0, measure_index: 0, voice: 0, note_index: 0, is_grace: true, slash: false }));
  assert.equal(describeCommand({ type: 'set_dynamic', part_index: 0, staff_index: 0, measure_index: 0, voice: 0, note_index: 0, dynamic: 'Mf' }), 'Set dynamic: Mf (part 1 · staff 1 · measure 1)');
  assert.doesNotThrow(() => assertCommand({ type: 'set_lyric', part_index: 0, staff_index: 0, measure_index: 0, voice: 0, note_index: 0, lyric: null }));
  assert.doesNotThrow(() => assertCommand({ type: 'set_chord_symbol', part_index: 0, staff_index: 0, measure_index: 0, voice: 0, note_index: 0, chord: { root: 'C', kind: 'major', bass: null } }));
  assert.doesNotThrow(() => assertCommand({ type: 'set_rehearsal_mark', measure_index: 0, text: 'A' }));
  assert.doesNotThrow(() => assertCommand({ type: 'set_tempo_at_measure', measure_index: 0, bpm: 120 }));
  assert.doesNotThrow(() => assertCommand({ type: 'add_hairpin', part_index: 0, staff_index: 0, measure_index: 0, voice: 0, start_note_idx: 0, end_note_idx: 1, kind: 'Crescendo' }));
  assert.doesNotThrow(() => assertCommand({ type: 'set_barline', measure_index: 0, side: 'right', barline: 'RepeatEnd' }));
  assert.doesNotThrow(() => assertCommand({ type: 'set_barline', measure_index: 0, side: 'left', barline: 'Normal' }));
  assert.doesNotThrow(() => assertCommand({ type: 'set_navigation_mark', measure_index: 0, mark: 'Segno' }));
  assert.doesNotThrow(() => assertCommand({ type: 'set_volta', measure_index: 0, volta: { number: 1, kind: 'begin_end' } }));
  assert.doesNotThrow(() => assertCommand({ type: 'set_expression_text', measure_index: 0, text: 'dolce' }));
  assert.doesNotThrow(() => assertCommand({ type: 'set_cue', part_index: 0, staff_index: 0, measure_index: 0, voice: 0, note_index: 0, is_cue: true }));
  assert.doesNotThrow(() => assertCommand({ type: 'set_note_head', part_index: 0, staff_index: 0, measure_index: 0, voice: 0, note_index: 0, note_head: 'Diamond' }));
  assert.doesNotThrow(() => assertCommand({ type: 'set_fingering', part_index: 0, staff_index: 0, measure_index: 0, voice: 0, note_index: 0, fingering: 3 }));
  assert.doesNotThrow(() => assertCommand({ type: 'set_ottava', part_index: 0, staff_index: 0, measure_index: 0, voice: 0, note_index: 0, ottava_start: 'Va8', ottava_end: false }));
  assert.doesNotThrow(() => assertCommand({ type: 'set_ottava', part_index: 0, staff_index: 0, measure_index: 0, voice: 0, note_index: 0, ottava_start: null, ottava_end: false }));
  assert.doesNotThrow(() => assertCommand({ type: 'set_string_number', part_index: 0, staff_index: 0, measure_index: 0, voice: 0, note_index: 0, string_number: 3 }));
  assert.doesNotThrow(() => assertCommand({ type: 'set_guitar_technique', part_index: 0, staff_index: 0, measure_index: 0, voice: 0, note_index: 0, technique: 'Bend' }));
  assert.doesNotThrow(() => assertCommand({ type: 'add_pedal', part_index: 0, staff_index: 0, measure_index: 0, voice: 0, start_note_idx: 0, end_note_idx: 1 }));
  assert.doesNotThrow(() => assertCommand({ type: 'set_technique_text', part_index: 0, staff_index: 0, measure_index: 0, voice: 0, note_index: 0, text: 'pizz.' }));
  assert.doesNotThrow(() => assertCommand({ type: 'set_glissando', part_index: 0, staff_index: 0, measure_index: 0, voice: 0, note_index: 0, start: true, end: false }));
  assert.doesNotThrow(() => assertCommand({ type: 'set_cross_staff', part_index: 0, staff_index: 0, measure_index: 0, voice: 0, note_index: 0, placement: { target_staff: 1, target_voice: null } }));
  assert.doesNotThrow(() => assertCommand({ type: 'set_arpeggio', part_index: 0, staff_index: 0, measure_index: 0, voice_index: 0, note_index: 0, direction: true }));
  assert.doesNotThrow(() => assertCommand({ type: 'toggle_trill_line', start: { part: 0, staff: 0, measure: 0, voice: 0, note: 0 }, end: { part: 0, staff: 0, measure: 0, voice: 0, note: 1 } }));
  assert.doesNotThrow(() => assertCommand({ type: 'set_multi_rest', measure_index: 0, count: 4 }));
  assert.doesNotThrow(() => assertCommand({ type: 'set_page_break', measure_index: 0, value: true }));
  assert.doesNotThrow(() => assertCommand({ type: 'set_system_break', measure_index: 0, value: true }));
  assert.doesNotThrow(() => assertCommand({ type: 'set_part_group', group: { first_part: 0, last_part: 1, symbol: 'Bracket', barlines_connect: true } }));
  assert.doesNotThrow(() => assertCommand({ type: 'set_stem', part_index: 0, staff_index: 0, measure_index: 0, voice_index: 0, note_index: 0, stem_up: true }));
});

test('accepts structured tremolo articulation used by the Composer UI', () => {
  assert.doesNotThrow(() => assertCommand({ type: 'toggle_articulation', part_index: 0, staff_index: 0, measure_index: 0, voice: 0, note_index: 0, articulation: { Tremolo: 1 } }));
});
