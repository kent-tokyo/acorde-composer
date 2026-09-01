function buildNewScoreXml(template = 'piano') {
  const ensemble = template === 'ensemble';
  return `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <work><work-title>Untitled score</work-title></work>
  <part-list><score-part id="P1"><part-name>Piano</part-name></score-part>${ensemble ? '<score-part id="P2"><part-name>Strings</part-name></score-part>' : ''}</part-list>
  <part id="P1"><measure number="1"><attributes><divisions>480</divisions><key><fifths>0</fifths><mode>major</mode></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes></measure></part>${ensemble ? '<part id="P2"><measure number="1"><attributes><divisions>480</divisions><key><fifths>0</fifths><mode>major</mode></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes></measure></part>' : ''}
</score-partwise>`;
}

module.exports = { buildNewScoreXml };
