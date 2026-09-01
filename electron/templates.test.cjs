const test = require('node:test');
const assert = require('node:assert/strict');
const { buildNewScoreXml } = require('./templates.cjs');

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
