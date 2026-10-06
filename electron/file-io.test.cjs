const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const fileIo = require('../src/file-io.js');
const registry = require('../src/command-registry.js');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8');
const main = fs.readFileSync(path.join(root, 'electron', 'main.cjs'), 'utf8');
const index = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8');

test('File menu follows MuseScore Studio: Save a copy and a single Export… dialog', () => {
  const file = registry.MENU_TREE.find((node) => node.label === 'File').children.filter((node) => node.type === 'command').map((node) => node.id);
  assert.deepEqual(file, ['file:new', 'file:open', 'file:close', 'file:save', 'file:save-as', 'file:save-copy', 'file:import-omr', 'file:export', 'file:score-properties', 'file:parts', 'file:print']);
  assert.equal(registry.resolveCommand('file:new').label, 'New…');
  assert.equal(registry.resolveCommand('file:import-omr').label, 'Import PDF…');
  assert.equal(registry.resolveCommand('file:save-copy').handler, 'save-copy');
  assert.equal(registry.resolveCommand('file:export').handler, 'open-export');
  for (const language of ['ja', 'zh']) for (const label of ['New…', 'Save a Copy…', 'Import PDF…', 'Export…']) assert.notEqual(registry.translate(label, language), label, `${language} missing ${label}`);
  assert.match(app, /'open-export': \(\) => openExportDialog\(\), 'save-copy': \(\) => saveDocumentCopy\(\),/);
});

test('Save a copy never retargets the open document or recent files', () => {
  assert.match(main, /let filePath = saveAs \|\| copy \? null : documentSaveTargets\.get\(ownerId\);/);
  assert.match(main, /await fs\.writeFile\(filePath, content, 'utf8'\);\n  if \(copy\) return filePath;\n  documentSaveTargets\.set\(ownerId, filePath\);/);
  assert.match(app, /saveDocument\(\{ suggestedName: `\$\{currentDocumentStem\(\)\} copy\.musicxml`, content: report\.output, copy: true \}\)/);
});

test('export formats map to existing export paths and only MusicXML/MIDI export parts', () => {
  assert.deepEqual(fileIo.EXPORT_FORMATS.map((format) => format.id), ['pdf', 'svg', 'musicxml', 'midi', 'abc']);
  assert.deepEqual(fileIo.EXPORT_FORMATS.filter((format) => format.parts).map((format) => format.id), ['musicxml', 'midi']);
  assert.deepEqual(fileIo.EXPORT_FORMATS.filter((format) => format.pageOptions).map((format) => format.id), ['pdf', 'svg']);
  assert.equal(fileIo.exportFormat('nope').id, 'pdf');
  assert.match(app, /\{ pdf: 'pdf-save-button', svg: 'svg-save-button', abc: 'abc-save-button' \}\[format\.id\]/);
  assert.match(app, /window\.acorde\.extractPart\(currentScore, partIndex\)/);
});

test('export targets list the main score then each part', () => {
  const targets = fileIo.exportTargets({ parts: [{ name: 'Piano' }, {}] });
  assert.deepEqual(targets.map((target) => [target.value, target.label, target.partIndex]), [['score', 'Main score', null], ['part:0', 'Piano', 0], ['part:1', 'Part 2', 1]]);
  assert.equal(fileIo.parseExportTarget('part:1'), 1);
  assert.equal(fileIo.parseExportTarget('score'), null);
  assert.equal(fileIo.parseExportTarget('part:x'), null);
  assert.deepEqual(fileIo.exportTargets(null).map((target) => target.value), ['score']);
});

test('file stems are safe and bounded', () => {
  assert.equal(fileIo.safeFileStem('Harbor Theme.musicxml'), 'Harbor Theme');
  assert.equal(fileIo.safeFileStem('a/b:c*d?.mid'), 'a b c d');
  assert.equal(fileIo.safeFileStem('   '), 'score');
  assert.equal(fileIo.safeFileStem('x'.repeat(200)).length, 80);
});

test('new score setup normalizes MuseScore-style additional information', () => {
  assert.deepEqual(fileIo.normalizeNewScoreSetup({}), { title: '', composer: '', fifths: 0, time: '4/4', tempo: 120, measures: 32 });
  assert.deepEqual(fileIo.normalizeNewScoreSetup({ title: '  Harbor  ', composer: 'K', fifths: 2, time: '3/4', tempo: 88, measures: 70 }), { title: 'Harbor', composer: 'K', fifths: 2, time: '3/4', tempo: 88, measures: 70 });
  assert.deepEqual(fileIo.normalizeNewScoreSetup({ fifths: 8, time: '7/9', tempo: 0, measures: 5000 }), { title: '', composer: '', fifths: 0, time: '4/4', tempo: 120, measures: 32 });
  assert.equal(fileIo.KEY_SIGNATURES.length, 15);
});

test('new score setup emits engine commands in ≤64-operation batches', () => {
  const commands = fileIo.newScoreSetupCommands({ title: 'T', fifths: -1, time: '6/8', tempo: 90, measures: 70 }, 1);
  assert.deepEqual(commands.slice(0, 4).map((command) => command.type), ['set_metadata', 'set_key_signature', 'set_time_signature', 'set_tempo']);
  assert.deepEqual(commands[2], { type: 'set_time_signature', numerator: 6, denominator: 8 });
  const measures = commands.filter((command) => command.type === 'add_measure');
  assert.equal(measures.length, 69);
  assert.deepEqual(measures.slice(0, 2), [{ type: 'add_measure', after_index: 0 }, { type: 'add_measure', after_index: 1 }]);
  assert.ok(fileIo.chunkCommands(commands).every((chunk) => chunk.length <= fileIo.MAX_BATCH_OPERATIONS));
  assert.equal(fileIo.chunkCommands(commands).flat().length, commands.length);
  assert.ok(!fileIo.newScoreSetupCommands({}, 1).some((command) => command.type === 'set_metadata'), 'empty title/composer keeps template metadata');
  assert.equal(fileIo.newScoreSetupCommands({ measures: 1 }, 1).filter((command) => command.type === 'add_measure').length, 0);
});

test('New score dialog carries MuseScore additional score information fields', () => {
  for (const id of ['template-select', 'new-score-title', 'new-score-composer', 'new-score-key', 'new-score-time', 'new-score-tempo', 'new-score-measures']) assert.match(index, new RegExp(`id="${id}"`));
  assert.match(app, /window\.acorde\.newScore\(\$\('template-select'\)\.value, newScoreTemplateOptions\(\)\)/, 'key and time are written into the template measure');
  assert.match(app, /\$\('template-dialog'\)\.close\(\); clearDirty\(\); await applyNewScoreSetup\(\);/);
});

test('every dialog label is localized', () => {
  const keys = [...new Set([...index.matchAll(/data-fileio-label="([^"]+)"/g), ...app.matchAll(/data-fileio-label="([^"]+)"/g)].map((match) => match[1]))];
  assert.ok(keys.length >= 10);
  for (const language of ['ja', 'zh']) {
    for (const key of [...keys, ...fileIo.EXPORT_FORMATS.map((format) => format.description), 'Main score', 'Graphics', 'Score', 'Print…']) assert.ok(fileIo.TRANSLATIONS[language][key], `${language} missing ${key}`);
  }
});

test('Cancel in New score and Project properties never applies changes', () => {
  assert.match(app, /\$\('template-form'\)\.addEventListener\('submit', async \(event\) => \{ event\.preventDefault\(\); if \(event\.submitter\?\.value === 'cancel'\) \{ \$\('template-dialog'\)\.close\(\); return; \}/);
  assert.match(app, /\$\('score-settings-form'\)\.addEventListener\('submit', async \(event\) => \{ event\.preventDefault\(\); if \(event\.submitter\?\.value === 'cancel'\) \{ \$\('score-settings'\)\.close\(\); return; \}/);
});
