#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const measureCount = Number.parseInt(process.argv[2] || '1000', 10);
const outputPath = path.resolve(process.argv[3] || `qa/fixtures/performance/${measureCount}-measures.musicxml`);

if (!Number.isInteger(measureCount) || measureCount < 1 || measureCount > 10000) {
  throw new Error('measure count must be an integer from 1 to 10000');
}

const note = (step, type = 'quarter', duration = 480) =>
  `<note><pitch><step>${step}</step><octave>4</octave></pitch><duration>${duration}</duration><voice>1</voice><type>${type}</type></note>`;
const rest = '<note><rest/><duration>1440</duration><voice>1</voice><type>half</type></note>';
const measures = [];
for (let number = 1; number <= measureCount; number += 1) {
  const attributes = number === 1
    ? '<attributes><divisions>480</divisions><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>'
    : '';
  measures.push(`<measure number="${number}">${attributes}${note(number % 2 === 0 ? 'G' : 'C')}${rest}</measure>`);
}

const xml = `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="4.0"><part-list><score-part id="P1"><part-name>Performance Fixture</part-name></score-part></part-list><part id="P1">${measures.join('')}</part></score-partwise>\n`;
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, xml);
process.stdout.write(`${JSON.stringify({ outputPath, measureCount })}\n`);
