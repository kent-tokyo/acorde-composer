const test = require('node:test');
const assert = require('node:assert/strict');
const { buildScoreContextMenuTemplate, normalizeContextMenuState } = require('./score-context-menu.cjs');

test('score context menu reuses edit and properties commands', () => {
  const sent = [];
  const template = buildScoreContextMenuTemplate({ send: (command) => sent.push(command), state: { hasScore: true, kind: 'note' } });
  assert.deepEqual(template.filter((item) => item.type !== 'separator').map((item) => item.label), ['Cut', 'Copy', 'Paste', 'Delete', 'Properties']);
  template.filter((item) => item.click).forEach((item) => item.click());
  assert.deepEqual(sent, ['edit:cut', 'edit:copy', 'edit:paste', 'edit:delete', 'view:properties']);
});

test('measure context keeps unsupported copy operations disabled', () => {
  const state = normalizeContextMenuState({ hasScore: true, kind: 'measure', canDelete: true });
  assert.equal(state.canCut, false);
  assert.equal(state.canCopy, false);
  assert.equal(state.canPaste, true);
  assert.equal(state.canDelete, true);
  assert.equal(state.canShowProperties, true);
});

test('measure text context enables reversible text editing actions', () => {
  const template = buildScoreContextMenuTemplate({ send() {}, state: { hasScore: true, kind: 'measure-text' } });
  assert.ok(template.filter((item) => item.type !== 'separator').every((item) => item.enabled));
});

test('unknown score context cannot mutate the score', () => {
  const template = buildScoreContextMenuTemplate({ send() {}, state: { hasScore: true, kind: 'unknown' } });
  assert.equal(template.find((item) => item.label === 'Paste').enabled, true);
  assert.equal(template.find((item) => item.label === 'Delete').enabled, false);
  assert.equal(template.find((item) => item.label === 'Properties').enabled, false);
});
