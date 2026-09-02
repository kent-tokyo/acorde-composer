const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function calculate() {
  const source = fs.readFileSync(require.resolve('../src/print-geometry.js'), 'utf8');
  const context = vm.createContext({ window: {} });
  vm.runInContext(source, context);
  return context.window.AcordePrintGeometry.calculate;
}

test('print geometry reports oriented page and printable dimensions', () => {
  const geometry = calculate()('A4', 'landscape', 0.4);
  assert.equal(geometry.width_points, 841.89);
  assert.equal(geometry.height_points, 595.28);
  assert.equal(geometry.margin_points, 28.8);
  assert.equal(geometry.valid, true);
  assert.equal(Math.round(geometry.content_width_points), 784);
});

test('print geometry rejects margins that consume the page', () => {
  assert.equal(calculate()('A5', 'portrait', 4).valid, false);
});

test('SVG bounds analysis detects elements outside the viewBox', () => {
  const source = fs.readFileSync(require.resolve('../src/print-geometry.js'), 'utf8');
  const context = vm.createContext({ window: {} });
  vm.runInContext(source, context);
  const analyze = context.window.AcordePrintGeometry.analyzeSvgBounds;
  assert.equal(analyze('<svg viewBox="0 0 100 100"><rect x="10" y="10" width="20" height="20" /></svg>').valid, true);
  assert.equal(analyze('<svg viewBox="0 0 100 100"><rect x="90" y="10" width="20" height="20" /></svg>').valid, false);
});
