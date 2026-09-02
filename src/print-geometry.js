(function () {
  const PAGE_POINTS = { A4: [595.28, 841.89], Letter: [612, 792], A5: [419.53, 595.28] };
  function calculate(page, orientation = 'portrait', marginInches = 0.4) {
    const [baseWidth, baseHeight] = PAGE_POINTS[page] || PAGE_POINTS.A4;
    const landscape = orientation === 'landscape';
    const width = landscape ? baseHeight : baseWidth;
    const height = landscape ? baseWidth : baseHeight;
    const margin = Math.max(0, Number(marginInches) || 0) * 72;
    return { width_points: width, height_points: height, content_width_points: Math.max(0, width - margin * 2), content_height_points: Math.max(0, height - margin * 2), margin_points: margin, valid: width > margin * 2 && height > margin * 2 };
  }
  window.AcordePrintGeometry = { calculate };
})();
