const test = require('node:test');
const assert = require('node:assert/strict');
const { buildNewScoreXml, normalizeTemplateOptions } = require('./templates.cjs');

test('piano template creates one piano part', () => {
  const xml = buildNewScoreXml('piano');
  assert.match(xml, /<score-part id="P1"><part-name>Piano<\/part-name><\/score-part>/);
  assert.doesNotMatch(xml, /id="P2"/);
});

test('ensemble template creates a second strings part', () => {
  const xml = buildNewScoreXml('ensemble');
  assert.match(xml, /<score-part id="P2"><part-name>Strings<\/part-name><\/score-part>/);
  assert.match(xml, /<part id="P2">/);
});

test('unknown template safely falls back to piano shape', () => {
  const xml = buildNewScoreXml('unknown');
  assert.doesNotMatch(xml, /id="P2"/);
  assert.match(xml, /<score-partwise version="4\.0">/);
});

test('new score key and time signature are written into measure 1', () => {
  const xml = buildNewScoreXml('ensemble', { fifths: -3, beats: 6, beatType: 8 });
  assert.equal((xml.match(/<key><fifths>-3<\/fifths>/g) || []).length, 2);
  assert.equal((xml.match(/<time><beats>6<\/beats><beat-type>8<\/beat-type><\/time>/g) || []).length, 2);
});

test('invalid template options fall back to C major in 4/4', () => {
  assert.deepEqual(normalizeTemplateOptions({ fifths: 9, beats: 0, beatType: 3 }), { fifths: 0, beats: 4, beatType: 4 });
  assert.deepEqual(normalizeTemplateOptions({ fifths: '2', beats: '3', beatType: '4' }), { fifths: 2, beats: 3, beatType: 4 });
  assert.match(buildNewScoreXml('piano', { fifths: '<x>' }), /<fifths>0<\/fifths>/);
});
