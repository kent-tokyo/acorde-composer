const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'src/index.html'), 'utf8');
const style = fs.readFileSync(path.join(root, 'src/style.css'), 'utf8');
const packageManifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const multiVoiceFixture = fs.readFileSync(path.join(root, 'qa/fixtures/multivoice-ui.musicxml'), 'utf8');
const advancedNotationFixture = fs.readFileSync(path.join(root, 'qa/fixtures/notation-advanced.musicxml'), 'utf8');

test('editor UI exposes truthful save state and accessible core actions', () => {
  assert.match(index, /id="save-status"/);
  assert.match(index, /Save MusicXML/);
  assert.match(app, /updateSaveStatus/);
  assert.match(app, /Unsaved changes/);
  assert.match(app, /Save failed/);
  assert.match(app, /function persistAutosave\(\)/);
  assert.match(app, /setTimeout\(persistAutosave, 150\)/);
  assert.match(app, /aria-label.*Undo/);
  assert.match(app, /aria-label.*Redo/);
  assert.match(index, /role="note"/);
  assert.match(index, /aria-label="Current voice"/);
  assert.match(app, /function installUiSemantics\(\)/);
  assert.match(app, /setAttribute\('role', 'toolbar'\)/);
  assert.match(app, /Playback controls/);
  assert.match(app, /'play-button': 'Play score'/);
  assert.match(app, /'loop-button': 'Loop playback'/);
  assert.match(app, /focus-visible/);
  assert.match(app, /playbackPositionInFlight/);
});

test('score changes emit one update notification per render', () => {
  assert.equal((app.match(/new Event\('score-changed'\)/g) || []).length, 1);
  assert.match(app, /updateRenderedScore\(await window\.acorde\.renderCurrent\(900\)\)/);
  assert.equal((app.match(/addEventListener\('score-changed'/g) || []).length, 1);
  assert.match(app, /function syncEditorAfterScoreChange\(\)/);
});

test('mixer persistence skips unchanged synchronous localStorage writes', () => {
  assert.match(app, /let mixerSnapshot = ''/);
  assert.match(app, /if \(serialized === mixerSnapshot\) return/);
  assert.match(app, /mixerSnapshot = serialized/);
});

test('editor dialogs expose their purpose to assistive technology', () => {
  assert.match(app, /querySelectorAll\('dialog'\)/);
  assert.match(app, /setAttribute\('aria-labelledby'/);
  assert.match(app, /heading\.id \|\|=/);
});

test('application preferences expose persisted English, Japanese, and Chinese language choices', () => {
  assert.match(index, /id="preferences-button"/);
  assert.match(index, /id="preferences-dialog"/);
  assert.match(index, /id="language-select"/);
  assert.match(index, /value="en">English/);
  assert.match(index, /value="ja">日本語/);
  assert.match(index, /value="zh">简体中文/);
  assert.match(app, /acorde-composer\.language\.v1/);
  assert.match(app, /document\.documentElement\.lang = language/);
  assert.match(app, /saveLanguagePreference/);
});

test('editor labels use the English UI contract and route prompt/alert/confirm through the shared modal', () => {
  assert.match(index, /<html lang="en">/);
  assert.match(app, /function uiAlert\(message\)/);
  assert.match(app, /function uiPrompt\(label, initial = ''\)/);
  assert.match(app, /function uiConfirm\(message\)/);
  assert.match(app, /class="ui-dialog-form"/);
  assert.match(app, /value="cancel" class="quiet">Cancel/);
  assert.doesNotMatch(app, /window\.prompt\(/);
  assert.doesNotMatch(app, /window\.confirm\(/);
  assert.doesNotMatch(app, /\balert\(/);
});

test('packaging contract includes the release acorde engine sidecar', () => {
  const main = fs.readFileSync(path.join(root, 'electron/main.cjs'), 'utf8');
  assert.match(packageManifest.scripts.pack, /build-engine\.cjs/);
  assert.deepEqual(packageManifest.build.extraResources, [{ from: 'build/engine', to: 'engine' }]);
  assert.match(main, /process\.resourcesPath/);
  assert.match(main, /Packaged acorde engine is missing/);
});

test('editor landmarks expose meaningful navigation names', () => {
  assert.match(app, /left-rail'\)\?\.setAttribute\('aria-label', 'Score library'\)/);
  assert.match(app, /editor'\)\?\.setAttribute\('aria-label', 'Score editor'\)/);
  assert.match(app, /right-panel'\)\?\.setAttribute\('aria-label', 'Assistant and import panel'\)/);
});

test('editor transport exposes accessible playback actions', () => {
  assert.match(index, /id="play-button"/);
  assert.match(index, /id="loop-button"/);
  assert.match(app, /setAttribute\('aria-label', 'Play or stop score'\)/);
  assert.match(app, /setAttribute\('aria-label', 'Toggle loop playback'\)/);
  assert.match(style, /\.transport-button:focus-visible/);
});

test('editor UI keeps advanced notation controls discoverable at narrow widths', () => {
  assert.match(app, /groupAdvancedNotationControls/);
  assert.match(style, /\.advanced-tools/);
  assert.match(style, /\.editor-toolbar[^}]*flex-wrap:wrap/);
  assert.match(style, /@media \(max-width:1120px\)/);
});

test('selection-dependent actions are disabled until a score selection exists', () => {
  assert.match(app, /SELECTION_REQUIRED_IDS/);
  assert.match(app, /refreshSelectionActions/);
  assert.match(app, /element\.setAttribute\('aria-disabled', String\(disabled\)\)/);
  assert.match(app, /Select a note or measure first/);
});

test('editor UI groups dense metadata controls and explains first use', () => {
  assert.match(index, /id="first-use-guide"/);
  assert.match(index, /Quick start/);
  assert.match(app, /groupScoreMetaControls/);
  assert.match(app, /Notation: \[/);
  assert.match(app, /installQuickStartGuide/);
  assert.match(app, /acorde-composer\.quick-start-dismissed/);
});

test('editor UI prioritizes recovery and keeps advanced controls discoverable', () => {
  assert.match(app, /first-use-guide.*classList\.add\('hidden'\)/);
  assert.match(app, /revealQuickStartAfterRecovery/);
  assert.match(app, /createElement\('details'\)/);
  assert.match(app, /summary\.textContent = 'Advanced'/);
  assert.match(style, /\.advanced-tools summary/);
  assert.match(style, /#page-preset/);
});

test('editor UI keeps export actions in a secondary menu and exposes voice state', () => {
  assert.match(index, /id="voice-status"/);
  assert.match(app, /setAttribute\('aria-describedby', 'voice-status'\)/);
  assert.match(app, /setAttribute\('role', 'status'\)/);
  assert.match(app, /exportMenu\.id = 'export-menu'/);
  assert.match(app, /const exportIds = \[/);
  assert.match(app, /status\.textContent = count > 1/);
  assert.match(style, /\.export-menu summary/);
  assert.match(style, /\.voice-status/);
});

test('editor UI remains usable on compact windows with consistent focus treatment', () => {
  assert.match(style, /@media \(max-width:860px\)/);
  assert.match(style, /@media \(max-width:720px\)/);
  assert.match(style, /\.workspace \{ height:auto; min-height:calc\(100vh - 68px\); flex-direction:column; \}/);
  assert.match(style, /select:focus-visible/);
  assert.match(style, /\.left-rail \{ display:none; \}/);
});

test('editor panel navigation exposes accessible tabs and keyboard switching', () => {
  assert.match(app, /const panelTabs = \[\.\.\.document\.querySelectorAll\('\.panel-tab'\)\]/);
  assert.match(app, /setAttribute\('role', 'tablist'\)/);
  assert.match(app, /setAttribute\('role', 'tab'\)/);
  assert.match(app, /setAttribute\('role', 'tabpanel'\)/);
  assert.match(app, /aria-labelledby/);
  assert.match(app, /aria-selected/);
  assert.match(app, /aria-keyshortcuts', 'ArrowLeft ArrowRight Home End'/);
  assert.match(app, /ArrowLeft.*ArrowRight.*Home.*End/);
});

test('editor UI translates engine failures into recovery guidance', () => {
  assert.match(app, /function userFacingError\(error\)/);
  assert.match(app, /acorde engineを起動できませんでした。アプリを再起動してもう一度お試しください。/);
  assert.match(app, /userFacingError\(error\)/);
  assert.match(app, /下書きを復旧できませんでした: \$\{userFacingError\(error\)\}/);
  assert.match(app, /選択範囲を再生できませんでした: \$\{userFacingError\(error\)\}/);
  assert.doesNotMatch(app, /catch \(error\)[^\n]*\$\{error\.message\}/);
});

test('editor UI does not claim engine readiness before a successful response', () => {
  assert.match(app, /function updateEngineIndicator\(state\)/);
  assert.match(app, /updateEngineIndicator\('checking'\)/);
  assert.match(app, /updateEngineIndicator\('ready'\)/);
  assert.match(app, /Unavailable · restart app/);
  assert.match(app, /badge\.setAttribute\('aria-live', 'polite'\)/);
  assert.match(app, /badge\.setAttribute\('role', 'status'\)/);
  assert.match(app, /badge\.setAttribute\('aria-label', 'acorde engine status'\)/);
  assert.match(style, /\.pulse\.error/);
});

test('editor UI exposes SoundFont readiness beside playback controls', () => {
  assert.match(app, /soundfont-indicator/);
  assert.match(app, /SoundFont: \$\{label\}/);
  assert.match(app, /active · \$\{mixerState\.soundfont\.presetCount\} presets/);
  assert.match(app, /setAttribute\('role', 'status'\)/);
  assert.match(app, /SoundFont status:/);
  assert.match(app, /soundfont\.title = soundfont\.textContent/);
});

test('multiple-voice UI contract keeps fixture structure and voice-aware controls', () => {
  assert.match(index, /id="voice-select"/);
  assert.match(app, /function voiceCount\(\)/);
  assert.match(app, /function refreshVoiceSelector\(\)/);
  assert.match(app, /voice: voiceIndex/);
  assert.match(app, /key === '\[' \|\| key === '\]'/);
  assert.match(multiVoiceFixture, /<backup><duration>1920<\/duration><\/backup>/);
  assert.equal((multiVoiceFixture.match(/<voice>1<\/voice>/g) || []).length, 2);
  assert.equal((multiVoiceFixture.match(/<voice>2<\/voice>/g) || []).length, 2);
  assert.match(multiVoiceFixture, /<rest\/>/);
});

test('notation UI exposes advanced spanners and explicit ABC loss diagnostics', () => {
  const app = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8');
  assert.match(app, /id = 'glissando-button'/);
  assert.match(app, /id = 'cross-staff-button'/);
  assert.match(app, /id = 'text-style-button'/);
  assert.match(app, /composer\.abc-lossy-spanners/);
  assert.match(app, /composer\.abc-lossy-text-styles/);
});

test('cross-staff multi-voice workflow keeps address, edit, save, and reload boundaries explicit', () => {
  assert.match(advancedNotationFixture, /<glissando number="1" type="start">/);
  assert.match(advancedNotationFixture, /<voice>2<\/voice>/);
  assert.match(advancedNotationFixture, /<staff>2<\/staff>/);
  assert.match(app, /type: 'set_cross_staff'/);
  assert.match(app, /type: 'set_glissando'/);
  assert.match(app, /markDirty\(\)/);
  assert.match(app, /serializeMusicxmlReport/);
});

test('voice counting avoids intermediate arrays on score-change updates', () => {
  const source = app.match(/function voiceCount\(\) \{[^\n]+/u)?.[0] || '';
  assert.match(source, /for \(const staff of staves\)/);
  assert.doesNotMatch(source, /flatMap|\.map\(/);
});

test('playback highlight advances with a cursor instead of filtering every animation frame', () => {
  assert.match(app, /let playbackEventCursor = 0/);
  assert.match(app, /while \(playbackEventCursor \+ 1 < scheduledEvents\.length/);
  assert.doesNotMatch(app, /scheduledEvents\.filter\(\(item\) => item\.time_secs <= elapsed\)/);
});

test('playback highlight uses a rendered-note address map', () => {
  assert.match(app, /const playbackNoteByAddress = new Map\(\)/);
  assert.match(app, /playbackNoteByAddress\.set\(note\.dataset\.noteAddr, note\)/);
  assert.match(app, /playbackNoteByAddress\.get\(address\)/);
  assert.doesNotMatch(app, /querySelectorAll\('\.acorde-playing'\)/);
});

test('playback start guards empty or incomplete scores before engine access', () => {
  assert.match(app, /const guardedStartPlayback = startPlayback/);
  assert.match(app, /const measures = currentScore\?\.parts\?\.\[0\]\?\.staves\?\.\[0\]\?\.measures/);
  assert.match(app, /if \(!Array\.isArray\(measures\) \|\| measures\.length === 0\) return/);
});

test('playback highlight skips redundant DOM class updates', () => {
  assert.match(app, /let highlightedPlaybackAddress = null/);
  assert.match(app, /if \(address === highlightedPlaybackAddress\) return/);
  assert.match(app, /highlightedPlaybackAddress = null/);
});

test('playback start serializes asynchronous startup', () => {
  assert.match(app, /let playbackStartInFlight = false/);
  assert.match(app, /if \(playbackStartInFlight\) return/);
  assert.match(app, /playbackStartInFlight = true/);
  assert.match(app, /finally \{ playbackStartInFlight = false; \}/);
});

test('OMR review UI is wired to the provider-neutral queue without Score application', () => {
  assert.match(app, /omr-review-filter/);
  assert.match(app, /omr-review-list/);
  assert.match(app, /listOmrReviewItems/);
  assert.match(app, /transitionOmrItem/);
  assert.match(app, /action === 'correct'/);
  assert.match(app, /omr-navigation-target/);
  assert.match(app, /omr-proposal-ready/);
  assert.doesNotMatch(app, /applyCommand\([^)]*omrReview/);
});

test('diagnostics export uses the support bundle path and reports save errors', () => {
  const preload = fs.readFileSync(path.join(root, 'electron/preload.cjs'), 'utf8');
  assert.match(app, /saveSupportBundle\(/);
  assert.match(app, /acorde-support-bundle\.json/);
  assert.match(app, /support bundleを書き出せませんでした/);
  assert.match(preload, /saveSupportBundle: \(payload\) => ipcRenderer\.invoke\('file:saveSupportBundle'/);
});
