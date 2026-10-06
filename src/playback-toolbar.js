(function initPlaybackToolbar(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AcordePlaybackToolbar = api;
})(typeof globalThis === 'object' ? globalThis : this, function playbackToolbarFactory() {
  'use strict';

  // MuseScore Studio playback toolbar order (handbook "Playback controls"): Rewind, Play,
  // Toggle loop playback, Metronome, Playback settings, playback position counters
  // (time, then measure.beat), and playback speed. Buttons drive Composer's existing
  // playback, loop, metronome, and tempo state; nothing here schedules audio itself.
  const CONTROLS = Object.freeze([
    Object.freeze({ id: 'rewind-button', label: 'Rewind', icon: 'rewind' }),
    Object.freeze({ id: 'play-button', label: 'Play', icon: 'play' }),
    Object.freeze({ id: 'loop-button', label: 'Toggle loop playback', icon: 'loop' }),
    Object.freeze({ id: 'metronome-button', label: 'Metronome', icon: 'metronome' }),
    Object.freeze({ id: 'playback-settings-button', label: 'Playback settings', icon: 'settings' }),
  ]);

  const TRANSLATIONS = Object.freeze({
    ja: Object.freeze({
      Rewind: '巻き戻し', Play: '再生', Stop: '停止', 'Toggle loop playback': 'ループ再生', Metronome: 'メトロノーム', 'Playback settings': '再生設定',
      'Playback position': '再生位置', 'Elapsed time': '経過時間', 'Measure and beat': '小節と拍', 'Playback speed': '再生速度', 'Score tempo': '楽譜のテンポ',
      'Playback range': '再生範囲', 'Play selected measures': '選択した小節を再生', 'Seek': 'シーク', 'Select a measure range first': '先に小節範囲を選択してください',
    }),
    zh: Object.freeze({
      Rewind: '倒回', Play: '播放', Stop: '停止', 'Toggle loop playback': '循环播放', Metronome: '节拍器', 'Playback settings': '播放设置',
      'Playback position': '播放位置', 'Elapsed time': '已播放时间', 'Measure and beat': '小节与拍', 'Playback speed': '播放速度', 'Score tempo': '乐谱速度',
      'Playback range': '播放范围', 'Play selected measures': '播放所选小节', 'Seek': '定位', 'Select a measure range first': '请先选择小节范围',
    }),
  });

  function label(text, language = 'en') { return TRANSLATIONS[language]?.[text] || text; }

  // Elapsed time as H:MM:SS.t, the precision MuseScore's time counter shows.
  function formatTime(seconds) {
    const tenths = Math.max(0, Math.floor((Number(seconds) || 0) * 10 + 1e-6));
    const hours = Math.floor(tenths / 36000);
    const minutes = Math.floor((tenths % 36000) / 600);
    const secs = Math.floor((tenths % 600) / 10);
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${tenths % 10}`;
  }

  // Acorde reports a zero-based measure index and a one-based fractional beat.
  function formatMeasureBeat(position) {
    const measure = Number(position?.measure_index);
    const beat = Number(position?.beat);
    if (!Number.isFinite(measure) || measure < 0 || !Number.isFinite(beat)) return '1.1';
    return `${Math.floor(measure) + 1}.${Math.max(1, Math.floor(beat + 1e-6))}`;
  }

  function tempoLabel(value) {
    const bpm = Number(value);
    return Number.isFinite(bpm) && bpm > 0 ? `♩ = ${Math.round(bpm)}` : '♩ = score';
  }

  const svg = (body) => `<svg class="pb-icon" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false">${body}</svg>`;
  const ICONS = Object.freeze({
    rewind: svg('<path d="M4.5 4 V16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M15.5 4.5 L7 10 L15.5 15.5 Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>'),
    play: svg('<path d="M6 4 L16 10 L6 16 Z" fill="currentColor"/>'),
    stop: svg('<rect x="5.5" y="4.5" width="3.3" height="11" rx="0.8" fill="currentColor"/><rect x="11.2" y="4.5" width="3.3" height="11" rx="0.8" fill="currentColor"/>'),
    loop: svg('<path d="M5 8 V6.5 H14 M14 6.5 L11.8 4.3 M14 6.5 L11.8 8.7 M15 12 V13.5 H6 M6 13.5 L8.2 11.3 M6 13.5 L8.2 15.7" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>'),
    metronome: svg('<path d="M7.6 3.5 H12.4 L15.5 16.5 H4.5 Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M10 13 L14.5 5.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M5.6 12.5 H14.4" stroke="currentColor" stroke-width="1.2"/>'),
    settings: svg('<g fill="currentColor"><rect x="8.7" y="1.6" width="2.6" height="4" rx="0.7" transform="rotate(0 10 10)"/><rect x="8.7" y="1.6" width="2.6" height="4" rx="0.7" transform="rotate(45 10 10)"/><rect x="8.7" y="1.6" width="2.6" height="4" rx="0.7" transform="rotate(90 10 10)"/><rect x="8.7" y="1.6" width="2.6" height="4" rx="0.7" transform="rotate(135 10 10)"/><rect x="8.7" y="1.6" width="2.6" height="4" rx="0.7" transform="rotate(180 10 10)"/><rect x="8.7" y="1.6" width="2.6" height="4" rx="0.7" transform="rotate(225 10 10)"/><rect x="8.7" y="1.6" width="2.6" height="4" rx="0.7" transform="rotate(270 10 10)"/><rect x="8.7" y="1.6" width="2.6" height="4" rx="0.7" transform="rotate(315 10 10)"/><path fill-rule="evenodd" d="M10 4.2a5.8 5.8 0 1 0 0.001 0Z M10 7.6a2.4 2.4 0 1 1 -0.001 0Z"/></g>'),
  });

  function icon(name) { return ICONS[name] || ''; }

  return { CONTROLS, TRANSLATIONS, label, formatTime, formatMeasureBeat, tempoLabel, icon };
});
