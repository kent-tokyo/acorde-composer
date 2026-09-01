function addComposerImportWarnings(report, xml) {
  const next = { ...report, diagnostics: [...(report?.diagnostics || [])] };
  if (/<voice>\s*[2-9]\d*\s*<\/voice>/i.test(xml || '')) {
    next.diagnostics.push({
      code: 'composer.musicxml-multiple-voices',
      severity: 'Warning',
      loss_reason: 'acorde MusicXML parser currently flattens voice numbers above 1; see acorde issue #2',
      source_location: 'MusicXML <voice>',
    });
  }
  return next;
}

module.exports = { addComposerImportWarnings };
