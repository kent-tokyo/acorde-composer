const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { validateNotationCoverageMatrix } = require('./notation-coverage.cjs');

const matrix = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'qa', 'notation-coverage-matrix.json'), 'utf8'));

test('notation coverage matrix has a stable schema and required pipeline layers', () => {
  assert.equal(matrix.schemaVersion, 1);
  assert.equal(matrix.engine, 'acorde@1.1.1');
  assert.deepEqual(matrix.requiredLayers, ['parser', 'model', 'command', 'layout', 'editor', 'musicxml', 'playback', 'fixture']);
  assert.ok(matrix.elements.length >= 12);
  const ids = new Set();
  for (const element of matrix.elements) {
    assert.ok(element.id && !ids.has(element.id));
    ids.add(element.id);
    assert.match(element.fixturePath, /^qa\/fixtures\/notation\/[^/]+\.musicxml$/);
    assert.ok(fs.existsSync(path.join(__dirname, '..', element.fixturePath)));
    assert.match(fs.readFileSync(path.join(__dirname, '..', element.fixturePath), 'utf8'), /<score-partwise\b/);
    assert.ok(['missing', 'preserved', 'editable', 'rendered', 'playable', 'roundtrip-tested', 'release-ready'].includes(element.status));
    assert.ok(element.layers.every((layer) => matrix.requiredLayers.includes(layer)));
  }
});

test('notation coverage validator rejects duplicate, unknown, and overstated coverage', () => {
  const valid = validateNotationCoverageMatrix(matrix);
  assert.deepEqual(valid, { valid: true, errors: [] });

  const duplicate = structuredClone(matrix);
  duplicate.elements.push({ ...duplicate.elements[0] });
  assert.equal(validateNotationCoverageMatrix(duplicate).valid, false);
  assert.match(validateNotationCoverageMatrix(duplicate).errors.join('\n'), /duplicate element id/);

  const unknownLayer = structuredClone(matrix);
  unknownLayer.elements[0].layers.push('not-a-layer');
  assert.match(validateNotationCoverageMatrix(unknownLayer).errors.join('\n'), /unknown layer/);

  const missingFixturePath = structuredClone(matrix);
  delete missingFixturePath.elements[0].fixturePath;
  assert.match(validateNotationCoverageMatrix(missingFixturePath).errors.join('\n'), /fixturePath/);

  const overstated = structuredClone(matrix);
  overstated.elements[2].status = 'release-ready';
  assert.match(validateNotationCoverageMatrix(overstated).errors.join('\n'), /missing required layers/);
});

test('glissando and cross-staff are represented in every Composer command and UI contract', () => {
  const schema = fs.readFileSync(path.join(__dirname, 'command-schema.cjs'), 'utf8');
  const app = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
  assert.match(schema, /set_glissando/);
  assert.match(schema, /set_cross_staff/);
  assert.match(app, /id = 'glissando-button'/);
  assert.match(app, /id = 'cross-staff-button'/);
});
