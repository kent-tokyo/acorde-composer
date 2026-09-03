const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'src/index.html'), 'utf8');
const style = fs.readFileSync(path.join(root, 'src/style.css'), 'utf8');

test('editor UI exposes truthful save state and accessible core actions', () => {
  assert.match(index, /id="save-status"/);
  assert.match(index, /Save MusicXML/);
  assert.match(app, /updateSaveStatus/);
  assert.match(app, /Unsaved changes/);
  assert.match(app, /Save failed/);
  assert.match(app, /aria-label.*Undo/);
  assert.match(app, /aria-label.*Redo/);
});

test('editor UI keeps advanced notation controls discoverable at narrow widths', () => {
  assert.match(app, /groupAdvancedNotationControls/);
  assert.match(style, /\.advanced-tools/);
  assert.match(style, /\.editor-toolbar[^}]*flex-wrap:wrap/);
  assert.match(style, /@media \(max-width:1120px\)/);
});

test('selection-dependent actions are disabled until a score selection exists', () => {
  assert.match(app, /SELECTION_REQUIRED_IDS/);
  assert.match(app, /refreshSelectionActions/);
  assert.match(app, /Select a note or measure first/);
});

test('OMR review UI is wired to the provider-neutral queue without Score application', () => {
  assert.match(app, /omr-review-filter/);
  assert.match(app, /omr-review-list/);
  assert.match(app, /listOmrReviewItems/);
  assert.match(app, /transitionOmrItem/);
  assert.match(app, /action === 'correct'/);
  assert.match(app, /omr-navigation-target/);
  assert.match(app, /omr-proposal-ready/);
  assert.doesNotMatch(app, /applyCommand\([^)]*omrReview/);
});

test('diagnostics export uses the support bundle path and reports save errors', () => {
  const preload = fs.readFileSync(path.join(root, 'electron/preload.cjs'), 'utf8');
  assert.match(app, /saveSupportBundle\(/);
  assert.match(app, /acorde-support-bundle\.json/);
  assert.match(app, /support bundleを書き出せませんでした/);
  assert.match(preload, /saveSupportBundle: \(payload\) => ipcRenderer\.invoke\('file:saveSupportBundle'/);
});
