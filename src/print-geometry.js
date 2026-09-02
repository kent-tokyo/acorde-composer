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
  function analyzeSvgBounds(svg) {
    const root = svg.match(/<svg\b[^>]*>/i)?.[0] || '';
    const values = root.match(/\bviewBox="([^\"]+)"/i)?.[1]?.trim().split(/[ ,]+/).map(Number) || [];
    if (values.length !== 4 || values.some((value) => !Number.isFinite(value)) || values[2] <= 0 || values[3] <= 0) return { valid: false, checked: 0, reason: 'viewBox is unavailable or invalid' };
    const [left, top, width, height] = values;
    const violations = [];
    for (const tag of svg.matchAll(/<([a-z][\w:-]*)\b[^>]*>/gi)) {
      const attributes = Object.fromEntries([...tag[0].matchAll(/\b(x|y|width|height)="(-?[0-9]+(?:\.[0-9]+)?)"/gi)].map((match) => [match[1].toLowerCase(), Number(match[2])]));
      if (!Object.keys(attributes).some((key) => ['x', 'y', 'width', 'height'].includes(key))) continue;
      const x = attributes.x ?? left; const y = attributes.y ?? top; const right = x + (attributes.width ?? 0); const bottom = y + (attributes.height ?? 0);
      if (x < left || y < top || right > left + width || bottom > top + height) violations.push(tag[1]);
    }
    return { valid: violations.length === 0, checked: violations.length, reason: violations.length ? `elements outside viewBox: ${violations.join(', ')}` : 'explicit element bounds are inside viewBox' };
  }
  window.AcordePrintGeometry = { calculate, analyzeSvgBounds };
})();
