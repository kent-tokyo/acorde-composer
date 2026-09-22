(function initSectionNavigation(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AcordeSectionNavigation = api;
})(typeof globalThis === 'object' ? globalThis : this, function sectionNavigationFactory() {
  'use strict';

  function sectionBreakIndexes(score, measures) {
    if (!Array.isArray(measures)) return [];
    const scoreBreaks = Array.isArray(score?.section_breaks) ? score.section_breaks : null;
    const candidates = scoreBreaks
      ? scoreBreaks.map((value) => typeof value === 'object' ? value.measure_index ?? value.measure : value)
      : measures.flatMap((measure, index) => measure && Object.hasOwn(measure, 'section_break') && measure.section_break === true ? [index] : []);
    return [...new Set(candidates.map(Number).filter((value) => Number.isInteger(value) && value >= 0 && value < measures.length))].sort((a, b) => a - b);
  }

  function supportsSections(score, measures) {
    return Array.isArray(score?.section_breaks) || (Array.isArray(measures) && measures.some((measure) => measure && Object.hasOwn(measure, 'section_break')));
  }

  function rangeForMeasure(score, measures, measureIndex) {
    if (!supportsSections(score, measures) || !Number.isInteger(measureIndex) || measureIndex < 0 || measureIndex >= measures.length) return null;
    const boundaries = sectionBreakIndexes(score, measures);
    const start = boundaries.filter((index) => index <= measureIndex).at(-1) ?? 0;
    const end = (boundaries.find((index) => index > measureIndex) ?? measures.length) - 1;
    return Object.freeze([start, end]);
  }

  return { sectionBreakIndexes, supportsSections, rangeForMeasure };
});
