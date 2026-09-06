function addComposerImportWarnings(report, xml) {
  const next = { ...report, diagnostics: [...(report?.diagnostics || [])] };
  const parsedVoices = report?.score?.parts?.some((part) => part.staves?.some((staff) => staff.measures?.some((measure) => measure.voices?.slice(1).some((voice) => Array.isArray(voice) && voice.length > 0))));
  if (/<voice>\s*[2-9]\d*\s*<\/voice>/i.test(xml || '') && !parsedVoices) {
    next.diagnostics.push({
      code: 'composer.musicxml-multiple-voices',
      severity: 'Warning',
      loss_reason: 'engine did not preserve MusicXML voice numbers above 1',
      source_location: 'MusicXML <voice>',
    });
  }
  return next;
}

module.exports = { addComposerImportWarnings };
