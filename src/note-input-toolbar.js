(function initNoteInputToolbar(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AcordeNoteInputToolbar = api;
})(typeof globalThis === 'object' ? globalThis : this, function noteInputToolbarFactory() {
  'use strict';

  // MuseScore Studio 4 note input toolbar order: note input, durations (64th → whole),
  // augmentation dot, rest, accidentals, tie / slur, articulations, tuplet / flip, voices.
  // Every button routes through
  // an existing Composer command or hidden source control, so shortcuts, menus, and
  // undo history keep a single implementation.
  const DURATIONS = Object.freeze([
    Object.freeze({ id: 'duration-sixtyfourth', value: 'sixtyfourth', label: '64th note', command: 'duration:1', shortcut: '1', flags: 4, head: 'filled', stem: true }),
    Object.freeze({ id: 'duration-thirtysecond', value: 'thirtysecond', label: '32nd note', command: 'duration:2', shortcut: '2', flags: 3, head: 'filled', stem: true }),
    Object.freeze({ id: 'duration-sixteenth', value: 'sixteenth', label: '16th note', command: 'duration:3', shortcut: '3', flags: 2, head: 'filled', stem: true }),
    Object.freeze({ id: 'duration-eighth', value: 'eighth', label: 'Eighth note', command: 'duration:4', shortcut: '4', flags: 1, head: 'filled', stem: true }),
    Object.freeze({ id: 'duration-quarter', value: 'quarter', label: 'Quarter note', command: 'duration:5', shortcut: '5', flags: 0, head: 'filled', stem: true }),
    Object.freeze({ id: 'duration-half', value: 'half', label: 'Half note', command: 'duration:6', shortcut: '6', flags: 0, head: 'hollow', stem: true }),
    Object.freeze({ id: 'duration-whole', value: 'whole', label: 'Whole note', command: 'duration:7', shortcut: '7', flags: 0, head: 'whole', stem: false }),
  ]);

  const DOT = Object.freeze({ id: 'dot-button', label: 'Augmentation dot', command: 'duration:dot', shortcut: '.', icon: 'dot' });

  const ACCIDENTALS = Object.freeze([
    Object.freeze({ id: 'accidental-double-flat', value: '-2', label: 'Double flat', command: 'notation:double-flat', icon: 'doubleFlat' }),
    Object.freeze({ id: 'accidental-flat', value: '-1', label: 'Flat', command: 'notation:flat', shortcut: '-', icon: 'flat' }),
    Object.freeze({ id: 'accidental-natural', value: '0', label: 'Natural', command: 'notation:natural', shortcut: '=', icon: 'natural' }),
    Object.freeze({ id: 'accidental-sharp', value: '1', label: 'Sharp', command: 'notation:sharp', shortcut: '+', icon: 'sharp' }),
    Object.freeze({ id: 'accidental-double-sharp', value: '2', label: 'Double sharp', command: 'notation:double-sharp', icon: 'doubleSharp' }),
  ]);

  const TUPLET = Object.freeze({ id: 'tuplet-button', value: '3:2', label: 'Triplet', command: 'add:tuplet:3', shortcut: '3', modifier: true, icon: 'triplet' });
  const FLIP = Object.freeze({ id: 'flip-button', label: 'Flip direction', command: 'notation:flip', shortcut: 'x', icon: 'flip' });

  const ARTICULATIONS = Object.freeze([
    Object.freeze({ id: 'articulation-marcato', value: 'Marcato', label: 'Marcato', icon: 'marcato' }),
    Object.freeze({ id: 'articulation-accent', value: 'Accent', label: 'Accent', icon: 'accent' }),
    Object.freeze({ id: 'articulation-tenuto', value: 'Tenuto', label: 'Tenuto', icon: 'tenuto' }),
    Object.freeze({ id: 'articulation-staccato', value: 'Staccato', label: 'Staccato', icon: 'staccato' }),
  ]);

  // Existing tool-mode buttons keep their ids and handlers; they only gain MuseScore-like icons.
  // `copyKey` names the LANGUAGE_COPY entry app.js already localizes for these tools. MuseScore has
  // no Select button (Esc leaves note input), so #select-tool stays a hidden command source.
  const TOOLS = Object.freeze([
    Object.freeze({ id: 'note-tool', copyKey: 'note', icon: 'noteInput', command: 'add:note' }),
    Object.freeze({ id: 'rest-tool', copyKey: 'rest', icon: 'rest', command: 'add:rest' }),
    Object.freeze({ id: 'tie-tool', copyKey: 'tie', icon: 'tie', command: 'add:tie' }),
    Object.freeze({ id: 'slur-tool', copyKey: 'slur', icon: 'slur', command: 'add:slur' }),
  ]);

  // MuseScore's default voice colors (Preferences → Score → voice colors).
  const VOICE_COLORS = Object.freeze(['#0065bf', '#007f00', '#c53f00', '#c31989']);
  // MuseScore Studio shows voices 1–2 by default; 3–4 are opt-in through toolbar customization.
  const DEFAULT_VISIBLE_VOICES = 2;

  // Labels for the "Customize note input toolbar" dialog, keyed by workspace TOOLBAR_ITEMS.
  const TOOLBAR_LABELS = Object.freeze({
    note: 'Note input', duration: 'Durations', dot: 'Augmentation dot', rest: 'Rest', accidental: 'Accidentals', tie: 'Tie', slur: 'Slur',
    articulation: 'Articulations', tuplet: 'Tuplet', flip: 'Flip direction', voice: 'Voices 1–2', 'extra-voices': 'Voices 3–4',
  });

  const TRANSLATIONS = Object.freeze({
    ja: Object.freeze({
      '64th note': '64分音符', '32nd note': '32分音符', '16th note': '16分音符', 'Eighth note': '8分音符', 'Quarter note': '4分音符', 'Half note': '2分音符', 'Whole note': '全音符',
      'Augmentation dot': '付点', Flat: 'フラット', Natural: 'ナチュラル', Sharp: 'シャープ', Triplet: '3連符',
      Accent: 'アクセント', Staccato: 'スタッカート', Tenuto: 'テヌート', Marcato: 'マルカート',
      Durations: '音価', Accidentals: '臨時記号', Articulations: 'アーティキュレーション', Voice: '声部',
      'Double flat': 'ダブルフラット', 'Double sharp': 'ダブルシャープ', 'Flip direction': '向きを反転',
      'Note input': '音符入力', Rest: '休符', Tie: 'タイ', Slur: 'スラー', Tuplet: '連符', 'Voices 1–2': '声部 1–2', 'Voices 3–4': '声部 3–4',
    }),
    zh: Object.freeze({
      '64th note': '六十四分音符', '32nd note': '三十二分音符', '16th note': '十六分音符', 'Eighth note': '八分音符', 'Quarter note': '四分音符', 'Half note': '二分音符', 'Whole note': '全音符',
      'Augmentation dot': '附点', Flat: '降号', Natural: '还原号', Sharp: '升号', Triplet: '三连音',
      Accent: '重音', Staccato: '断奏', Tenuto: '保持音', Marcato: '着重音',
      Durations: '时值', Accidentals: '变音记号', Articulations: '奏法记号', Voice: '声部',
      'Double flat': '重降号', 'Double sharp': '重升号', 'Flip direction': '翻转方向',
      'Note input': '音符输入', Rest: '休止符', Tie: '连音线', Slur: '连线', Tuplet: '连音', 'Voices 1–2': '声部 1–2', 'Voices 3–4': '声部 3–4',
    }),
  });

  function label(text, language = 'en') { return TRANSLATIONS[language]?.[text] || text; }

  function shortcutText(definition, mac = false) {
    if (!definition?.shortcut) return '';
    const key = definition.shortcut.toUpperCase();
    if (!definition.modifier) return key;
    return mac ? `⌘${key}` : `Ctrl+${key}`;
  }

  // `shortcutOverride` lets the renderer pass the live (user-customizable) binding label.
  function tooltip(definition, language = 'en', mac = false, shortcutOverride) {
    const name = label(definition.label, language);
    const shortcut = typeof shortcutOverride === 'string' ? shortcutOverride : shortcutText(definition, mac);
    return shortcut ? `${name} (${shortcut})` : name;
  }

  const ARIA_KEY_NAMES = Object.freeze({ ' ': 'Space', '+': 'Plus', Escape: 'Escape' });
  function ariaKeyShortcut(binding, mac = false) {
    if (!binding?.key && !binding?.code) return '';
    const key = binding.code === 'Space' ? 'Space' : ARIA_KEY_NAMES[binding.key] || (/^[a-z]$/i.test(binding.key) ? binding.key.toUpperCase() : binding.key);
    return [binding.modifier ? (mac ? 'Meta' : 'Control') : '', binding.alt ? 'Alt' : '', binding.shift ? 'Shift' : '', key].filter(Boolean).join('+');
  }

  const svg = (body, viewBox = '0 0 20 20') => `<svg class="ni-icon" viewBox="${viewBox}" width="20" height="20" aria-hidden="true" focusable="false">${body}</svg>`;

  function durationIcon(definition) {
    if (!definition) return '';
    if (definition.head === 'whole') return svg('<ellipse cx="10" cy="11" rx="5" ry="3.3" fill="none" stroke="currentColor" stroke-width="1.7"/>');
    const flagCount = Math.max(0, Math.min(4, Number(definition.flags) || 0));
    const stemTop = flagCount >= 3 ? 1.5 : 3;
    const head = definition.head === 'hollow'
      ? '<ellipse cx="7.6" cy="14.6" rx="3.7" ry="2.5" transform="rotate(-22 7.6 14.6)" fill="none" stroke="currentColor" stroke-width="1.5"/>'
      : '<ellipse cx="7.6" cy="14.6" rx="3.7" ry="2.5" transform="rotate(-22 7.6 14.6)" fill="currentColor"/>';
    const stem = definition.stem ? `<line x1="10.9" y1="13.6" x2="10.9" y2="${stemTop}" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>` : '';
    const spacing = flagCount >= 3 ? 2.8 : 3.4;
    const flags = Array.from({ length: flagCount }, (_, index) => {
      const y = stemTop + index * spacing;
      return `<path d="M10.9 ${y.toFixed(1)} c2.6 1.4 4.4 3 3.6 6.2" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>`;
    }).join('');
    return svg(head + stem + flags);
  }

  const ICONS = Object.freeze({
    dot: svg('<circle cx="10" cy="11" r="2.1" fill="currentColor"/>'),
    staccato: svg('<circle cx="10" cy="11" r="2.1" fill="currentColor"/>'),
    accent: svg('<path d="M4.5 7.5 L15.5 11 L4.5 14.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"/>'),
    tenuto: svg('<line x1="4.5" y1="11" x2="15.5" y2="11" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>'),
    marcato: svg('<path d="M5 15.5 L10 4.5 L15 15.5 L12.4 15.5 L10 10 L7.6 15.5 Z" fill="currentColor"/>'),
    select: svg('<path d="M5.5 3 V16 L8.7 13 L11 18 L13 17.1 L10.7 12.2 L15 12 Z" fill="currentColor"/>'),
    noteInput: svg('<path d="M4 16.5 L5 12.5 L13 4.5 L16 7.5 L8 15.5 Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M11.5 6 L14.5 9" stroke="currentColor" stroke-width="1.5"/>'),
    rest: svg('<path d="M8.2 2.5 L12.6 7.4 C10.6 9.2 10.4 10.8 12.2 13 L13.3 14.4 C11.1 13.4 9.4 14.2 9.6 15.9 C9.7 17 10.4 17.8 11.2 18.4 C8.3 17.7 7.1 15.2 8.4 13.6 C9.2 12.7 10.2 12.6 11.2 12.9 L7.4 8.6 C9.2 6.9 9.6 5 8.2 2.5 Z" fill="currentColor"/>'),
    tie: svg('<ellipse cx="4.6" cy="11" rx="2.7" ry="1.9" transform="rotate(-22 4.6 11)" fill="currentColor"/><ellipse cx="14.6" cy="11" rx="2.7" ry="1.9" transform="rotate(-22 14.6 11)" fill="currentColor"/><path d="M7 10.3 V2.5 M17 10.3 V2.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><path d="M4.8 14.4 Q10 18.4 15 14.4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>'),
    slur: svg('<path d="M3 14 Q10 3.5 17 14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'),
    flat: svg('<path d="M7.5 2.5 V17.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M7.5 17.5 C11.5 15.2 14.4 12.4 13.6 10.4 C12.8 8.6 10 9 7.5 11.6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>'),
    natural: svg('<path d="M7 2.5 V14 M13 6 V17.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M7 8 L13 6.4 M7 14 L13 12.4" stroke="currentColor" stroke-width="2.4"/>'),
    doubleFlat: svg('<path d="M4.5 2.5 V17.5 M10.5 2.5 V17.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="M4.5 17.5 C7.6 15.5 9.6 13 9 11.2 C8.4 9.6 6.4 10 4.5 12 M10.5 17.5 C13.6 15.5 15.6 13 15 11.2 C14.4 9.6 12.4 10 10.5 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>'),
    doubleSharp: svg('<path d="M5.5 5.5 L14.5 14.5 M14.5 5.5 L5.5 14.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M4 4 h3.2 v3.2 h-3.2 Z M12.8 4 h3.2 v3.2 h-3.2 Z M4 12.8 h3.2 v3.2 h-3.2 Z M12.8 12.8 h3.2 v3.2 h-3.2 Z" fill="currentColor"/>'),
    flip: svg('<ellipse cx="7" cy="14.6" rx="3.2" ry="2.2" transform="rotate(-22 7 14.6)" fill="currentColor"/><path d="M9.6 13.8 V5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="M15.5 5.5 V14.5 M13.3 7.7 L15.5 5.5 L17.7 7.7 M13.3 12.3 L15.5 14.5 L17.7 12.3" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>'),
    sharp: svg('<path d="M8.2 3 V18 M11.8 2 V17" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="M5.5 8.6 L14.5 6.6 M5.5 13.4 L14.5 11.4" stroke="currentColor" stroke-width="2.3"/>'),
    triplet: svg('<path d="M2.5 12 V7.5 H6.5 M13.5 7.5 H17.5 V12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><text x="10" y="11.5" text-anchor="middle" font-size="10" font-weight="700" fill="currentColor" font-family="-apple-system,BlinkMacSystemFont,\'Segoe UI\',sans-serif">3</text>'),
  });

  function icon(name) { return ICONS[name] || ''; }

  // Flip uses the stem direction the engine actually rendered; without a stem (whole notes)
  // it falls back to the stored stem preference.
  function nextStemDirection({ renderedUp = null, stem = 'auto' } = {}) {
    if (renderedUp === true) return 'down';
    if (renderedUp === false) return 'up';
    return stem === 'up' ? 'down' : 'up';
  }

  function pressedState(state = {}) {
    const duration = String(state.duration || '').toLowerCase();
    return Object.freeze({
      duration: DURATIONS.some((definition) => definition.value === duration) ? duration : null,
      dot: Boolean(state.dotted),
      triplet: state.tuplet === TUPLET.value,
    });
  }

  return { DURATIONS, DOT, ACCIDENTALS, TUPLET, FLIP, ARTICULATIONS, TOOLS, VOICE_COLORS, DEFAULT_VISIBLE_VOICES, TOOLBAR_LABELS, TRANSLATIONS, nextStemDirection, label, shortcutText, tooltip, ariaKeyShortcut, durationIcon, icon, pressedState };
});
