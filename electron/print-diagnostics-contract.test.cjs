const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('print diagnostics contract keeps geometry and render metadata on export paths', () => {
  const source = fs.readFileSync(require.resolve('../src/app.js'), 'utf8');
  assert.match(source, /AcordePrintGeometry\.calculate/);
  assert.match(source, /code: 'print\.page-geometry'/);
  assert.match(source, /code: 'render\.vector-glyphs'/);
  assert.match(source, /code: 'render\.accessible-text'/);
  assert.match(source, /installPdfRenderDiagnostics\(\)/);
});
