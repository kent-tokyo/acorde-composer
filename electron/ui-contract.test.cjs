const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');

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
