const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const registry = require('../src/command-registry.js');
const editing = require('../src/score-editing.js');
const { assertCommand } = require('./command-schema.cjs');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8');
const node = (label) => registry.MENU_TREE.find((item) => item.label === label);
const ids = (children) => children.filter((item) => item.type === 'command').map((item) => item.id);
const NEW_COMMANDS = ['add:measure-insert', 'add:measures-insert', 'add:measures-append', 'format:system-breaks', 'tools:exchange-voices-1-2', 'tools:split-measure', 'tools:join-measures', 'tools:remove-range', 'tools:respell', 'tools:remove-trailing-measures'];

test('Edit menu lists Select all / Select section directly, as in MuseScore Studio', () => {
  const edit = node('Edit').children;
  assert.deepEqual(ids(edit), ['edit:undo', 'edit:redo', 'edit:history', 'edit:cut', 'edit:copy', 'edit:paste', 'edit:delete', 'edit:select-all', 'edit:select-section', 'edit:find-go-to']);
  assert.ok(!edit.some((item) => item.type === 'submenu'));
});

test('Add > Measures offers insert before selection and append at end', () => {
  const measures = node('Add').children.find((item) => item.label === 'Measures').children;
  assert.deepEqual(ids(measures), ['add:measure-insert', 'add:measures-insert', 'add:measure', 'add:measures-append']);
  assert.equal(registry.resolveCommand('add:measure-insert').count, 1);
  assert.equal(registry.resolveCommand('add:measures-insert').count, null);
  assert.deepEqual(registry.resolveCommand('add:measure-insert').shortcuts, [{ key: 'Insert' }]);
  assert.deepEqual(registry.resolveCommand('add:measure').shortcuts, [{ key: 'b', modifier: true }]);
});

test('Format and Tools expose MuseScore score-editing tools', () => {
  assert.deepEqual(ids(node('Format').children), ['format:text-style', 'format:page-settings', 'format:system-breaks', 'format:layout-density']);
  const tools = node('Tools').children;
  assert.deepEqual(ids(tools), ['tools:transpose', 'tools:respell', 'tools:remove-trailing-measures']);
  const voices = tools.find((item) => item.label === 'Voices').children;
  assert.deepEqual(ids(voices).filter((id) => id.startsWith('tools:exchange')), ['1-2', '1-3', '1-4', '2-3', '2-4', '3-4'].map((pair) => `tools:exchange-voices-${pair}`));
  assert.deepEqual(registry.resolveCommand('tools:exchange-voices-2-4').voices, [1, 3], 'menu voices are one-based, Acorde voices zero-based');
  assert.deepEqual(ids(tools.find((item) => item.label === 'Measures').children), ['tools:split-measure', 'tools:join-measures', 'tools:remove-range']);
  assert.deepEqual(registry.resolveCommand('tools:remove-range').shortcuts, [{ key: 'Delete', modifier: true }]);
});

test('every new editing command has a renderer handler and ja/zh labels', () => {
  for (const id of NEW_COMMANDS) {
    const command = registry.resolveCommand(id);
    assert.ok(command, id);
    assert.match(app, new RegExp(`'${command.handler}': \\(\\) =>`), `${id} handler ${command.handler}`);
    for (const language of ['ja', 'zh']) assert.notEqual(registry.translate(command.label, language), command.label, `${language} missing ${command.label}`);
  }
  for (const language of ['ja', 'zh']) for (const key of Object.keys(editing.TEXT.en)) assert.ok(editing.TEXT[language][key], `${language} missing ${key}`);
  assert.match(index, /<script src="\.\/score-editing\.js"><\/script>(?:<script src="\.\/[a-z-]+\.js"><\/script>)*<script src="\.\/app\.js"><\/script>/);
});

test('measure insert/append use add_measure after-index semantics', () => {
  assert.deepEqual(editing.insertMeasureCommands(3, 2), [{ type: 'add_measure', after_index: 2 }, { type: 'add_measure', after_index: 3 }]);
  assert.equal(editing.insertMeasureCommands(0, 1), null, 'nothing can be inserted before the first measure');
  assert.equal(editing.insertMeasureCommands(2, 0), null);
  assert.equal(editing.insertMeasureCommands(2, 1000), null);
  assert.deepEqual(editing.appendMeasureCommands(4, 2), [{ type: 'add_measure', after_index: 3 }, { type: 'add_measure', after_index: 4 }]);
  assert.equal(editing.appendMeasureCommands(0, 1), null);
  assert.equal(editing.parseCount(' 12 '), 12);
  for (const bad of [null, '', '0', '1.5', 'abc', '1000']) assert.equal(editing.parseCount(bad), null, String(bad));
});

test('join, remove range and system breaks respect Acorde index rules', () => {
  assert.deepEqual(editing.joinMeasureCommands([5, 3]), [{ type: 'join_measures', measure_index: 3 }, { type: 'join_measures', measure_index: 3 }]);
  assert.equal(editing.joinMeasureCommands([4, 4]), null);
  assert.deepEqual(editing.removeRangeCommands([1, 3], 10).map((command) => command.measure_index), [3, 2, 1], 'delete from the end');
  assert.equal(editing.removeRangeCommands([0, 9], 10), null, 'a score keeps one measure');
  assert.equal(editing.removeRangeCommands([8, 12], 10), null, 'out-of-range selection');
  assert.deepEqual(editing.systemBreakCommand(4), { type: 'set_system_break_interval', interval: 4 });
  assert.deepEqual(editing.systemBreakCommand(0, [7, 2]), { type: 'set_system_break_interval', interval: 0, start_measure: 2, end_measure: 8 }, 'end_measure is exclusive');
  assert.equal(editing.systemBreakCommand(-1), null);
  assert.equal(editing.systemBreakCommand(1000), null);
});

test('exchange voices maps the selection to an inclusive Acorde range', () => {
  assert.deepEqual(editing.exchangeVoicesCommand({ part: 1, staff: 0 }, [6, 2], [0, 1]), { type: 'exchange_voices', part_index: 1, staff_index: 0, start_measure: 2, end_measure: 6, first_voice: 0, second_voice: 1 });
  assert.equal(editing.exchangeVoicesCommand({}, [0, 0], [1, 1]), null);
  assert.equal(editing.exchangeVoicesCommand({}, [0, 0], [0, 4]), null);
  assert.equal(editing.exchangeVoicesCommand({}, null, [0, 1]), null);
});

test('split before the selected note uses Acorde quarter-note beats', () => {
  assert.equal(editing.noteBeats({ duration: 'Quarter', dot_count: 0 }), 1);
  assert.equal(editing.noteBeats({ duration: 'Half', dot_count: 1 }), 3);
  assert.equal(editing.noteBeats({ duration: 'Eighth', dot_count: 2 }), 0.875);
  assert.equal(editing.noteBeats({ duration: 'Eighth', tuplet: { actual_notes: 3, normal_notes: 2 } }), 1 / 3);
  assert.equal(editing.noteBeats({ duration: 'Quarter', is_grace: true }), 0);
  const measure = { voices: [[{ duration: 'Quarter' }, { duration: 'Eighth', dot_count: 1 }, { duration: 'Sixteenth' }, { duration: 'Half' }], [], [], []] };
  assert.deepEqual(editing.splitMeasureCommand(measure, { measure: 4, voice: 0, note: 3 }), { type: 'split_measure', measure_index: 4, split_at_beats: 2 });
  const triplets = { voices: [[1, 2, 3].map(() => ({ duration: 'Eighth', tuplet: { actual_notes: 3, normal_notes: 2 } })).concat([{ duration: 'Quarter' }])] };
  assert.equal(editing.splitMeasureCommand(triplets, { measure: 0, voice: 0, note: 3 }).split_at_beats, 1, 'triplet sums are rounded');
  assert.equal(editing.splitMeasureCommand(measure, { measure: 4, voice: 0, note: 0 }), null, 'cannot split before the first note');
  assert.equal(editing.splitMeasureCommand(measure, { measure: 4, voice: 1, note: 1 }), null);
  assert.equal(editing.splitMeasureCommand(null, null), null);
});

test('command schema accepts the Acorde editing commands and rejects bad input', () => {
  for (const command of [
    editing.exchangeVoicesCommand({}, [1, 3], [0, 1]), ...editing.joinMeasureCommands([2, 3]), editing.systemBreakCommand(4), editing.systemBreakCommand(0, [2, 5]),
    { type: 'split_measure', measure_index: 0, split_at_beats: 2 }, { type: 'respell_score_to_key' }, { type: 'remove_trailing_empty_measures' },
  ]) assertCommand(command);
  assert.throws(() => assertCommand({ type: 'exchange_voices', part_index: 0, staff_index: 0, start_measure: 0, end_measure: 0, first_voice: 1, second_voice: 1 }), /two different voices/);
  assert.throws(() => assertCommand({ type: 'exchange_voices', part_index: 0, staff_index: 0, start_measure: 0, end_measure: 0, first_voice: 0, second_voice: 4 }), /two different voices/);
  assert.throws(() => assertCommand({ type: 'exchange_voices', part_index: 0, staff_index: 0, start_measure: 3, end_measure: 1, first_voice: 0, second_voice: 1 }), /must not precede/);
  assert.throws(() => assertCommand({ type: 'join_measures' }), /measure_index/);
  assert.throws(() => assertCommand({ type: 'split_measure', measure_index: 0, split_at_beats: 0 }), /split_at_beats/);
  assert.throws(() => assertCommand({ type: 'split_measure', measure_index: 0, split_at_beats: '2' }), /split_at_beats/);
  assert.throws(() => assertCommand({ type: 'set_system_break_interval', interval: -1 }), /interval/);
  assert.throws(() => assertCommand({ type: 'set_system_break_interval', interval: 1000 }), /too large/);
});

test('renderer explains engine limits instead of failing silently', () => {
  assert.match(app, /if \(range\[0\] === 0\) return uiAlert\(editingText\('firstMeasure'\)\);/);
  assert.match(app, /applyCommandsInBatches\(commands, 'JoinMeasures', editingText\('joinFit'\)\)/);
  assert.match(app, /applyCommandsInBatches\(\[command\], 'SplitMeasure', editingText\('splitAlign'\)\)/);
  assert.match(app, /window\.AcordeFileIo\.chunkCommands\(commands\)/, 'large inserts respect the 64-operation batch limit');
});
