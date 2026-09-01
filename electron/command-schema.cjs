const COMMAND_TYPES = new Set([
  'add_measure', 'add_note', 'add_part', 'add_pitch', 'add_staff',
  'delete_measure', 'delete_note', 'delete_part', 'delete_staff',
  'set_clef', 'set_duration', 'set_key_signature', 'set_metadata',
  'set_midi_instrument', 'set_part_name', 'set_tempo', 'set_time_signature',
  'add_hairpin', 'add_pedal', 'set_arpeggio', 'set_barline', 'set_chord_symbol', 'set_cue', 'set_dynamic', 'set_expression_text', 'set_fingering', 'set_grace', 'set_guitar_technique', 'set_lyric', 'set_multi_rest', 'set_navigation_mark', 'set_note_head', 'set_ottava', 'set_page_break', 'set_part_group', 'set_rehearsal_mark', 'set_stem', 'set_string_number', 'set_system_break', 'set_technique_text', 'set_tempo_at_measure', 'set_transpose', 'set_tuplet', 'set_volta', 'toggle_articulation', 'toggle_slur', 'toggle_tie', 'toggle_trill_line',
]);

function assertObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object`);
}

function assertNonNegativeInteger(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`${label} must be a non-negative integer`);
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
  for (const key of ['part_index', 'staff_index', 'measure_index', 'voice', 'voice_index', 'note_index', 'position', 'after_index']) {
    if (command[key] !== undefined) assertNonNegativeInteger(command[key], `${path}.${key}`);
  }
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
    set_arpeggio: 'Set arpeggio',
    toggle_trill_line: 'Toggle trill line',
    set_barline: 'Set barline',
    set_cue: 'Set cue note',
    set_expression_text: 'Set expression text',
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

module.exports = { COMMAND_TYPES, assertCommand, describeCommand };
