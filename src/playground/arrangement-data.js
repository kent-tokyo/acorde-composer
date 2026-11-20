export const ARRANGEMENT_SAMPLES = [
  {
    id: 'four-four',
    abc: 'X:1\nT:Four-beat melody\nM:4/4\nL:1/4\nK:C\nC D E G | A G E D | F E D C | D E F G | A c B A | G E F D | C E G B | c G E C |',
    chords: ['C', 'Am', 'F', 'G', 'C', 'Am', 'G', 'C'],
    presets: ['bass-pulse', 'alternating-bass', 'offbeat-chords'],
  },
  {
    id: 'waltz',
    abc: 'X:1\nT:Three-beat melody\nM:3/4\nL:1/4\nK:C\nC E G | A G E | F A c | B G D | E G c | A F D | G B d | c G E |',
    chords: ['C', 'Am', 'F', 'G', 'C', 'F', 'G', 'C'],
    presets: ['waltz-bass', 'held-chord', 'alternating-bass'],
  },
  {
    id: 'swing',
    abc: 'X:1\nT:Swing melody\nM:4/4\nL:1/8\nK:C\nC D E G A G E D | C E G A G E D C | A c B G E G F D | C E G E D C C2 | E G A c B A G E | F A c A G F E D | G A B d c B A G | E G E D C2 C2 |',
    chords: ['C', 'F', 'G', 'C', 'Am', 'F', 'G', 'C'],
    presets: ['swing-pulse', 'bass-pulse', 'offbeat-chords'],
  },
  {
    id: 'harmony',
    abc: 'X:1\nT:Harmony layers\nM:4/4\nL:1/4\nK:C\ne e e e | c c c c | a a a a | b b b b | e e e e | c c c c | b b b b | e e e e |',
    chords: ['C', 'Am', 'F', 'G', 'C', 'Am', 'G', 'C'],
    presets: ['held-chord', 'bass-pulse', 'alternating-bass'],
  },
];

export const PRESET_LABELS = {
  'bass-pulse': ['Bass and chord pulse', 'ベースと和音', '低音与和弦'],
  'alternating-bass': ['Alternating bass', '交互ベース', '交替低音'],
  'offbeat-chords': ['Offbeat chords', '裏拍の和音', '反拍和弦'],
  'waltz-bass': ['Waltz bass', 'ワルツ伴奏', '华尔兹低音'],
  'held-chord': ['Held chord', '伸ばす和音', '持续和弦'],
  'swing-pulse': ['Swing pulse', 'スイング', '摇摆节奏'],
};

const LANGUAGES = ['en', 'ja', 'zh'];
export function localizedPreset(id, language) {
  return PRESET_LABELS[id]?.[LANGUAGES.indexOf(language)] || id;
}

export function makeSelection(chords, bassMode = 'standard-bass') {
  return {
    chords: chords.map((root, measure_index) => ({
      measure_index,
      offset_beats: 0,
      chord: { root: root.replace(/m$/, ''), kind: root.endsWith('m') ? 'minor' : 'major', bass: null, degrees: [] },
    })),
    alternative_chords: null,
    inversion: null,
    bass_mode: bassMode,
  };
}
