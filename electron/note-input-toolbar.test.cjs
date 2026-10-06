const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const toolbar = require('../src/note-input-toolbar.js');
const registry = require('../src/command-registry.js');
const shell = require('../src/musescore-shell.js');
const workspaceState = require('../src/workspace-state.js');

const root = path.resolve(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8');

test('duration buttons follow MuseScore order and reuse the registry duration shortcuts', () => {
  assert.deepEqual(toolbar.DURATIONS.map((definition) => definition.value), ['sixtyfourth', 'thirtysecond', 'sixteenth', 'eighth', 'quarter', 'half', 'whole']);
  for (const definition of toolbar.DURATIONS) {
    const command = registry.resolveCommand(definition.command);
    assert.ok(command, `missing command ${definition.command}`);
    assert.equal(command.handler, 'set-duration');
    assert.equal(command.duration, definition.value);
    assert.equal(command.shortcuts[0].key, definition.shortcut);
  }
  const dot = registry.resolveCommand(toolbar.DOT.command);
  assert.equal(dot.handler, 'toggle-dot');
  assert.equal(dot.shortcuts[0].key, toolbar.DOT.shortcut);
});

test('accidental and tuplet buttons dispatch existing selection commands', () => {
  assert.deepEqual(toolbar.ACCIDENTALS.map((definition) => definition.value), ['-2', '-1', '0', '1', '2'], 'MuseScore order: 𝄫 ♭ ♮ ♯ 𝄪');
  const accidentalSource = index.match(/<select id="accidental-select"[\s\S]*?<\/select>/)?.[0] || '';
  for (const definition of toolbar.ACCIDENTALS) {
    const command = registry.resolveCommand(definition.command);
    assert.equal(command.handler, 'set-accidental');
    assert.equal(command.accidental, definition.value);
    assert.equal(command.shortcuts[0]?.key, definition.shortcut);
    assert.match(accidentalSource, new RegExp(`<option value="${definition.value}">`), `hidden source accepts ${definition.value}`);
  }
  const flip = registry.resolveCommand(toolbar.FLIP.command);
  assert.equal(flip.handler, 'flip-direction');
  assert.deepEqual(flip.shortcuts, [{ key: 'x' }], 'MuseScore flips with X');
  assert.match(app, /'flip-direction': \(\) => flipSelectedStem\(\)/);
  const tuplet = registry.resolveCommand(toolbar.TUPLET.command);
  assert.equal(tuplet.handler, 'tuplet');
  assert.equal(tuplet.tuplet, 3);
  assert.deepEqual(tuplet.shortcuts[0], { key: toolbar.TUPLET.shortcut, modifier: true });
});

test('articulation buttons follow MuseScore order and map to the hidden articulation source control', () => {
  assert.deepEqual(toolbar.ARTICULATIONS.map((definition) => definition.value), ['Marcato', 'Accent', 'Tenuto', 'Staccato']);
  const select = index.match(/<select id="articulation-select"[\s\S]*?<\/select>/)?.[0] || '';
  for (const definition of toolbar.ARTICULATIONS) assert.match(select, new RegExp(`<option value="${definition.value}">`));
});

test('tool icons target existing tool buttons and localized tool names', () => {
  for (const definition of toolbar.TOOLS) {
    assert.match(index, new RegExp(`id="${definition.id}"`));
    assert.match(app, new RegExp(`\\b${definition.copyKey}: '`));
    const command = registry.resolveCommand(definition.command);
    assert.ok(command && command.customizable, `${definition.command} must exist and be customizable`);
  }
});

test('icons are inline SVG without external references or scripts', () => {
  const icons = [
    ...toolbar.DURATIONS.map((definition) => toolbar.durationIcon(definition)),
    ...['dot', 'staccato', 'accent', 'tenuto', 'marcato', 'triplet', 'flip', 'noteInput', 'rest', 'tie', 'slur', 'doubleFlat', 'flat', 'natural', 'sharp', 'doubleSharp'].map((name) => toolbar.icon(name)),
  ];
  for (const svg of icons) {
    assert.match(svg, /^<svg class="ni-icon" viewBox="0 0 20 20"[^>]*aria-hidden="true"/);
    assert.doesNotMatch(svg, /href|url\(|<script|on[a-z]+=/i);
  }
  const flags = (value) => (toolbar.durationIcon(toolbar.DURATIONS.find((definition) => definition.value === value)).match(/<path /g) || []).length;
  assert.deepEqual(['sixtyfourth', 'thirtysecond', 'sixteenth', 'eighth', 'quarter'].map(flags), [4, 3, 2, 1, 0]);
  assert.doesNotMatch(toolbar.durationIcon(toolbar.DURATIONS.at(-1)), /<line /, 'a whole note has no stem');
  assert.equal(toolbar.icon('missing'), '');
});

test('labels, tooltips, and shortcut hints are localized for every language', () => {
  const labels = [...toolbar.DURATIONS, toolbar.DOT, ...toolbar.ACCIDENTALS, toolbar.TUPLET, toolbar.FLIP, ...toolbar.ARTICULATIONS].map((definition) => definition.label).concat(['Durations', 'Accidentals', 'Articulations'], Object.values(toolbar.TOOLBAR_LABELS));
  for (const language of ['ja', 'zh']) for (const label of labels) assert.ok(toolbar.TRANSLATIONS[language][label], `${language} missing ${label}`);
  const quarter = toolbar.DURATIONS.find((definition) => definition.value === 'quarter');
  assert.equal(toolbar.tooltip(quarter), 'Quarter note (5)');
  assert.equal(toolbar.tooltip(quarter, 'ja'), '4分音符 (5)');
  assert.equal(toolbar.tooltip(toolbar.TUPLET, 'en', true), 'Triplet (⌘3)');
  assert.equal(toolbar.tooltip(toolbar.TUPLET, 'zh', false), '三连音 (Ctrl+3)');
  assert.equal(toolbar.tooltip(toolbar.ARTICULATIONS[0]), 'Marcato');
  assert.equal(toolbar.tooltip(toolbar.FLIP), 'Flip direction (X)');
});

test('pressed state reflects the source controls and ignores unknown durations', () => {
  assert.deepEqual({ ...toolbar.pressedState({ duration: 'Eighth', dotted: 1, tuplet: '3:2' }) }, { duration: 'eighth', dot: true, triplet: true });
  assert.deepEqual({ ...toolbar.pressedState({ duration: 'breve', dotted: false, tuplet: '5:4' }) }, { duration: null, dot: false, triplet: false });
  assert.deepEqual({ ...toolbar.pressedState() }, { duration: null, dot: false, triplet: false });
});

test('voice colors are the four distinct MuseScore defaults', () => {
  assert.deepEqual([...toolbar.VOICE_COLORS], ['#0065bf', '#007f00', '#c53f00', '#c31989']);
});

test('toolbar customization targets stay in sync with persisted toolbar items', () => {
  assert.deepEqual(Object.keys(shell.TOOLBAR_TARGETS).sort(), [...workspaceState.TOOLBAR_ITEMS].sort());
  const generatedIds = new Set(['duration-buttons', 'dot-button', 'accidental-buttons', 'tuplet-button', 'flip-button', 'articulation-buttons', 'voice-button-1', 'voice-button-2', 'voice-button-3', 'voice-button-4']);
  assert.deepEqual(Object.keys(toolbar.TOOLBAR_LABELS).sort(), [...workspaceState.TOOLBAR_ITEMS].sort(), 'every customization item has a label');
  assert.ok(!workspaceState.TOOLBAR_ITEMS.includes('select') && !workspaceState.TOOLBAR_ITEMS.includes('undo-redo'));
  for (const id of Object.values(shell.TOOLBAR_TARGETS).flat()) {
    assert.ok(generatedIds.has(id) || index.includes(`id="${id}"`), `toolbar target ${id} has no element`);
  }
  const normalized = workspaceState.normalizeToolbar({ duration: false });
  assert.equal(normalized.duration, false);
  assert.equal(normalized.slur, true, 'workspaces saved before the slur button existed keep it visible');
  assert.equal(normalized['extra-voices'], false, 'voices 3–4 are opt-in, as in MuseScore Studio');
  assert.equal(workspaceState.normalizeToolbar({ 'extra-voices': true })['extra-voices'], true);
  assert.equal(toolbar.DEFAULT_VISIBLE_VOICES, 2);
});

test('renderer builds the icon toolbar and keeps legacy selects as hidden command sources', () => {
  assert.match(index, /<script src="\.\/note-input-toolbar\.js"><\/script>(?:<script src="\.\/[a-z-]+\.js"><\/script>)*<script src="\.\/app\.js"><\/script>/);
  assert.match(app, /function buildNoteInputButtons\(\)/);
  assert.match(app, /function syncNoteInputToolbar\(\)/);
  assert.match(app, /\['select-tool', 'duration-select', 'tuplet-select', 'voice-select', 'accidental-select', 'articulation-select'/);
  assert.match(app, /\['input', 'Input'\], \['duration', 'Duration'\], \['accidentals', 'Accidentals'\], \['lines', 'Ties and slurs'\], \['articulations', 'Articulations'\], \['rhythm', 'Rhythm'\], \['voices', 'Voices'\]/);
  assert.match(app, /historyControls\.className = 'musescore-history'[\s\S]*topbar\.insertBefore\(historyControls, topActions\)/, 'undo/redo move to the top bar');
  assert.match(app, /dispatchApplicationMenuCommand\(definition\.command\)/);
});

test('hidden utility classes win over component display rules', () => {
  const style = fs.readFileSync(path.join(root, 'src', 'style.css'), 'utf8');
  assert.match(style, /\.hidden \{ display:none !important; \}/);
  assert.match(style, /\.score-meta:empty \{ display:none; \}/);
  assert.match(app, /tabSummary\.id = 'score-tab-summary'/);
  assert.match(app, /tabsRow\.append\(documentTabs\)[\s\S]*tabsRow\.append\(tabSummary\)/, 'the summary is a sibling of the tablist, not a tab');
  assert.match(style, /@media screen \{ \.score-area \{ padding-top:20px; \} \}/, 'print keeps its own score padding');
  assert.match(style, /:root\[data-theme="dark"\] \.score-tabs-row \{ background:/);
});

test('tooltips and aria-keyshortcuts follow the live, customizable bindings', () => {
  assert.equal(toolbar.tooltip({ label: 'Note' }, 'en', false, 'M'), 'Note (M)');
  assert.equal(toolbar.tooltip({ label: 'Accent' }, 'en', false, ''), 'Accent');
  assert.equal(toolbar.ariaKeyShortcut({ key: '+' }), 'Plus');
  assert.equal(toolbar.ariaKeyShortcut({ key: 'n' }), 'N');
  assert.equal(toolbar.ariaKeyShortcut({ key: '3', modifier: true }, true), 'Meta+3');
  assert.equal(toolbar.ariaKeyShortcut({ key: '2', modifier: true, alt: true }), 'Control+Alt+2');
  assert.equal(toolbar.ariaKeyShortcut({ key: ' ', code: 'Space' }), 'Space');
  assert.equal(toolbar.ariaKeyShortcut(null), '');
  assert.match(app, /relabelNoteInputToolbar\(\);\n\}/, 'saving shortcut overrides refreshes toolbar tooltips');
});

test('flip direction inverts the rendered stem and falls back to the stored preference', () => {
  assert.equal(toolbar.nextStemDirection({ renderedUp: true, stem: 'auto' }), 'down');
  assert.equal(toolbar.nextStemDirection({ renderedUp: false, stem: 'down' }), 'up');
  assert.equal(toolbar.nextStemDirection({ renderedUp: null, stem: 'up' }), 'down');
  assert.equal(toolbar.nextStemDirection({ renderedUp: null, stem: 'auto' }), 'up');
  assert.equal(toolbar.nextStemDirection(), 'up');
});
