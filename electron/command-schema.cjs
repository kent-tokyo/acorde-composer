const COMMAND_TYPES = new Set([
  'add_measure', 'add_note', 'add_part', 'add_pitch', 'add_staff',
  'delete_measure', 'delete_note', 'delete_part', 'delete_staff',
  'set_clef', 'set_duration', 'set_key_signature', 'set_measure_text', 'set_metadata',
  'set_midi_instrument', 'set_part_name', 'set_tempo', 'set_time_signature',
  'add_hairpin', 'add_pedal', 'add_spanner', 'remove_spanner', 'set_arpeggio', 'set_barline', 'set_chord_symbol', 'set_cross_staff', 'set_cue', 'set_dynamic', 'set_expression_text', 'set_fingering', 'set_glissando', 'set_grace', 'set_guitar_technique', 'set_lyric', 'set_multi_rest', 'set_navigation_mark', 'set_note_head', 'set_ottava', 'set_page_break', 'set_part_group', 'set_rehearsal_mark', 'set_stem', 'set_string_number', 'set_system_break', 'set_technique_text', 'set_tempo_at_measure', 'set_transpose', 'set_tuplet', 'set_volta', 'toggle_articulation', 'toggle_slur', 'toggle_tie', 'toggle_trill_line', 'update_spanner',
]);
const TEXT_STYLES = new Set(['Expression', 'Technique', 'Lyrics', 'ChordSymbol', 'FiguredBass', 'RehearsalMark', 'Generic']);
const SPANNER_KINDS = new Set(['Slur', 'Glissando', 'TrillLine', 'Pedal', 'Ottava']);
const MAX_STYLED_TEXT_LENGTH = 4096;
const MAX_SPANNER_STRING_LENGTH = 1024;
const ENGINE_DURATIONS = Object.freeze({ whole: 'Whole', half: 'Half', quarter: 'Quarter', eighth: 'Eighth', sixteenth: 'Sixteenth', thirtysecond: 'ThirtySecond', sixtyfourth: 'SixtyFourth' });

function normalizeCommandForEngine(command) {
  if (command?.type === 'batch') return { ...command, commands: command.commands.map(normalizeCommandForEngine) };
  if (typeof command?.duration !== 'string') return command;
  const duration = ENGINE_DURATIONS[command.duration.replace(/[^a-z]/gi, '').toLowerCase()];
  return duration ? { ...command, duration } : command;
}

function assertObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object`);
}

function assertNonNegativeInteger(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`${label} must be a non-negative integer`);
}

function assertStyledText(value, path) {
  if (value === null) return;
  assertObject(value, path);
  if (!TEXT_STYLES.has(value.style)) throw new Error(`${path}.style is not supported`);
  if (typeof value.text !== 'string' || value.text.length > MAX_STYLED_TEXT_LENGTH) throw new Error(`${path}.text is invalid or too long`);
}

function assertNoteAddress(value, path) {
  assertObject(value, path);
  for (const key of ['part', 'staff', 'measure', 'voice', 'note']) assertNonNegativeInteger(value[key], `${path}.${key}`);
}

function assertSpanner(value, path) {
  assertObject(value, path);
  if (typeof value.id !== 'string' || value.id.length === 0 || value.id.length > 256) throw new Error(`${path}.id is invalid or too long`);
  if (!SPANNER_KINDS.has(value.kind)) throw new Error(`${path}.kind is not supported`);
  assertNoteAddress(value.start, `${path}.start`);
  assertNoteAddress(value.end, `${path}.end`);
  if (value.number !== undefined && value.number !== null && (!Number.isSafeInteger(value.number) || value.number < 0 || value.number > 65535)) throw new Error(`${path}.number is invalid`);
  for (const key of ['line_type', 'text', 'placement', 'ottava_type']) {
    if (value[key] !== undefined && value[key] !== null && (typeof value[key] !== 'string' || value[key].length > MAX_SPANNER_STRING_LENGTH)) throw new Error(`${path}.${key} is invalid or too long`);
  }
  if (value.ottava_size !== undefined && value.ottava_size !== null && (!Number.isSafeInteger(value.ottava_size) || value.ottava_size < 0 || value.ottava_size > 255)) throw new Error(`${path}.ottava_size is invalid`);
}

function assertCommand(command, path = 'command') {
  assertObject(command, path);
  if (command.type === 'batch') {
    if (!Array.isArray(command.commands) || command.commands.length === 0) throw new Error(`${path}.commands must not be empty`);
    if (command.commands.length > 64) throw new Error(`${path}.commands exceeds 64 operations`);
    command.commands.forEach((item, index) => assertCommand(item, `${path}.commands[${index}]`));
    if (command.label !== undefined && typeof command.label !== 'string') throw new Error(`${path}.label must be a string`);
    return command;
  }
  if (typeof command.type !== 'string' || !COMMAND_TYPES.has(command.type)) throw new Error(`${path}.type is not supported`);
  for (const key of ['part_index', 'staff_index', 'measure_index', 'text_index', 'voice', 'voice_index', 'note_index', 'position', 'after_index']) {
    if (command[key] !== undefined) assertNonNegativeInteger(command[key], `${path}.${key}`);
  }
  if (command.type === 'set_measure_text') {
    if (!Object.hasOwn(command, 'text')) throw new Error(`${path}.text is required`);
    assertStyledText(command.text, `${path}.text`);
  }
  if (command.type === 'add_spanner' || command.type === 'update_spanner') assertSpanner(command.spanner, `${path}.spanner`);
  if (command.type === 'remove_spanner' && (typeof command.id !== 'string' || command.id.length === 0 || command.id.length > 256)) throw new Error(`${path}.id is invalid or too long`);
  return command;
}

function commandTarget(command) {
  if (command.type === 'batch') return `${command.commands.length} operations`;
  const part = command.part_index === undefined ? null : `part ${command.part_index + 1}`;
  const staff = command.staff_index === undefined ? null : `staff ${command.staff_index + 1}`;
  const measure = command.measure_index === undefined ? null : `measure ${command.measure_index + 1}`;
  return [part, staff, measure].filter(Boolean).join(' · ');
}

function describeCommand(command) {
  if (command.type === 'batch') return command.commands.flatMap(describeCommand);
  const labels = {
    add_note: command.is_rest ? 'Add rest' : 'Add note',
    add_pitch: 'Change pitch',
    set_duration: 'Change duration',
    set_tuplet: 'Set tuplet',
    set_dynamic: 'Set dynamic',
    set_grace: 'Set grace note',
    set_chord_symbol: 'Set chord symbol',
    set_lyric: 'Set lyric',
    set_rehearsal_mark: 'Set rehearsal mark',
    set_tempo_at_measure: 'Set measure tempo',
    add_hairpin: 'Add hairpin',
    add_pedal: 'Add pedal',
    add_spanner: 'Add notation spanner',
    update_spanner: 'Update notation spanner',
    remove_spanner: 'Remove notation spanner',
    set_arpeggio: 'Set arpeggio',
    set_glissando: 'Set glissando',
    set_cross_staff: 'Set cross-staff placement',
    toggle_trill_line: 'Toggle trill line',
    set_barline: 'Set barline',
    set_cue: 'Set cue note',
    set_expression_text: 'Set expression text',
    set_measure_text: 'Set styled measure text',
    set_fingering: 'Set fingering',
    set_note_head: 'Set notehead',
    set_ottava: 'Set ottava',
    set_string_number: 'Set string number',
    set_guitar_technique: 'Set guitar technique',
    set_multi_rest: 'Set multi-rest',
    set_page_break: 'Set page break',
    set_part_group: 'Set part group',
    set_stem: 'Set stem direction',
    set_system_break: 'Set system break',
    set_technique_text: 'Set technique text',
    set_navigation_mark: 'Set navigation mark',
    set_volta: 'Set volta',
    toggle_articulation: 'Toggle articulation',
    toggle_slur: 'Toggle slur',
    toggle_tie: 'Toggle tie',
  };
  const detail = command.pitch ? `${command.pitch.step}${command.pitch.octave}` : command.duration || command.articulation || command.dynamic || '';
  const target = commandTarget(command);
  return `${labels[command.type] || command.type}${detail ? `: ${detail}` : ''}${target ? ` (${target})` : ''}`;
}

module.exports = { COMMAND_TYPES, assertCommand, describeCommand, normalizeCommandForEngine };
