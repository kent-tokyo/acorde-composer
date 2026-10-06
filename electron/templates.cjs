const DENOMINATORS = new Set([1, 2, 4, 8, 16, 32]);

// Key and time are written into measure 1 so the parsed score carries them at the measure level,
// exactly like an imported MusicXML file; invalid values fall back to C major in 4/4.
function normalizeTemplateOptions({ fifths = 0, beats = 4, beatType = 4 } = {}) {
  const key = Number(fifths);
  const numerator = Number(beats);
  const denominator = Number(beatType);
  return {
    fifths: Number.isInteger(key) && key >= -7 && key <= 7 ? key : 0,
    beats: Number.isInteger(numerator) && numerator >= 1 && numerator <= 32 ? numerator : 4,
    beatType: Number.isInteger(denominator) && DENOMINATORS.has(denominator) ? denominator : 4,
  };
}

function buildNewScoreXml(template = 'piano', options = {}) {
  const ensemble = template === 'ensemble';
  const { fifths, beats, beatType } = normalizeTemplateOptions(options);
  const attributes = `<attributes><divisions>480</divisions><key><fifths>${fifths}</fifths><mode>major</mode></key><time><beats>${beats}</beats><beat-type>${beatType}</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <work><work-title>Untitled score</work-title></work>
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part>${ensemble ? '<score-part id="P2"><part-name>Strings</part-name></score-part>' : ''}</part-list>
  <part id="P1"><measure number="1">${attributes}</measure></part>${ensemble ? `<part id="P2"><measure number="1">${attributes}</measure></part>` : ''}
</score-partwise>`;
}

module.exports = { buildNewScoreXml, normalizeTemplateOptions };
