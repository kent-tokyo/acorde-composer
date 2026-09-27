const test = require('node:test');
const assert = require('node:assert/strict');
const shell = require('../src/musescore-shell.js');

test('MuseScore shell keeps Home, Score, and Publish modes stable', () => {
  assert.deepEqual(shell.MODES, ['home', 'score', 'publish']);
  assert.equal(shell.normalizeMode('publish'), 'publish');
  assert.equal(shell.normalizeMode('unknown'), 'score');
});

test('navigator builds deterministic page thumbnails around the selected measure', () => {
  assert.deepEqual(shell.navigatorPages(18, 9), [
    { page: 1, start: 0, end: 7, active: false },
    { page: 2, start: 8, end: 15, active: true },
    { page: 3, start: 16, end: 17, active: false },
  ]);
  assert.deepEqual(shell.navigatorPages(0), []);
});

test('timeline rows expose bounded part and measure structure without score mutation', () => {
  const score = { parts: [{ name: 'Piano', staves: [{ measures: [{}, {}] }, { measures: [{}] }] }, { staves: [{ measures: [{}] }] }] };
  const before = JSON.stringify(score);
  assert.deepEqual(shell.timelineRows(score), [
    { partIndex: 0, label: 'Piano', measureCount: 2 },
    { partIndex: 1, label: 'Part 2', measureCount: 1 },
  ]);
  assert.equal(JSON.stringify(score), before);
});

test('F6 focus navigation skips unavailable regions and wraps', () => {
  const available = ['mode-tabs', 'score-view', 'status-bar'];
  assert.equal(shell.nextFocusRegion('mode-tabs', available), 'score-view');
  assert.equal(shell.nextFocusRegion('status-bar', available), 'mode-tabs');
  assert.equal(shell.nextFocusRegion('mode-tabs', available, true), 'status-bar');
});

test('custom workspace names are normalized and bounded', () => {
  assert.equal(shell.normalizeWorkspaceName('  Orchestral   review  '), 'Orchestral review');
  assert.equal(shell.normalizeWorkspaceName('\u0000bad'), null);
  assert.equal(shell.normalizeWorkspaceName(''), null);
});
