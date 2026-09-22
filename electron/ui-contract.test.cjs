const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const commandRegistry = require('../src/command-registry.js');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'src/app.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'src/index.html'), 'utf8');
const style = fs.readFileSync(path.join(root, 'src/style.css'), 'utf8');
const sectionNavigation = fs.readFileSync(path.join(root, 'src/section-navigation.js'), 'utf8');
const packageManifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const multiVoiceFixture = fs.readFileSync(path.join(root, 'qa/fixtures/multivoice-ui.musicxml'), 'utf8');
const advancedNotationFixture = fs.readFileSync(path.join(root, 'qa/fixtures/notation-advanced.musicxml'), 'utf8');

test('editor UI exposes truthful save state and accessible core actions', () => {
  assert.match(index, /id="save-status"/);
  assert.match(index, /Save MusicXML/);
  assert.match(app, /updateSaveStatus/);
  assert.match(app, /Unsaved changes/);
  assert.match(app, /Save failed/);
  assert.match(app, /async function saveCurrentDocument\(saveAs = false\)/);
  assert.match(app, /window\.acorde\.saveDocument/);
  assert.doesNotMatch(app, /window\.acorde\.saveScore =/);
  assert.doesNotMatch(app, /window\.acorde\.saveMidi =/);
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
  assert.match(app, /async function renderCurrentScore\(\)/);
  assert.match(index, /render-coordinator\.js/);
  assert.match(app, /function renderAndUpdateCurrentScore\(\)/);
  assert.doesNotMatch(app, /updateRenderedScore\(await renderCurrentScore\(\)\)/);
  assert.ok((app.match(/addEventListener\('score-changed'/g) || []).length >= 1);
  assert.match(app, /function syncEditorAfterScoreChange\(\)/);
});

test('renderer treats imported/provider text as text rather than HTML and isolates browser persistence', () => {
  assert.match(index, /safe-storage\.js/);
  assert.match(app, /const safeStorage = window\.AcordeSafeStorage/);
  assert.match(app, /function sanitizedScoreSvg\(svg\)/);
  assert.match(app, /script, foreignObject, iframe, object, embed/);
  assert.match(app, /\$\('score'\)\.replaceChildren\(sanitizedScoreSvg\(svg\)\)/);
  assert.match(app, /kind\.textContent = String\(item\.kind/);
  assert.match(app, /title\.textContent = String\(part\?\.name/);
  assert.doesNotMatch(app, /row\.innerHTML = `<strong>\$\{item\.kind/);
  assert.doesNotMatch(app, /row\.innerHTML = `<strong>\$\{part\.name/);
  assert.doesNotMatch(app, /\$\('diagnostics'\)\.innerHTML/);
  assert.doesNotMatch(app, /\$\('score'\)\.innerHTML = svg/);
});

test('part controls operate through one active-part implementation', () => {
  assert.match(app, /function installActivePartControls\(\)/);
  assert.match(app, /installActivePartControls\(\);/);
  assert.doesNotMatch(app, /installPartControls\(\);/);
  assert.doesNotMatch(app, /installPartSelector\(\);/);
});

test('SVG export replaces legacy listeners with one diagnostics-aware handler', () => {
  assert.match(app, /function installSingleSvgExport\(\)/);
  assert.match(app, /previous\.cloneNode\(true\); previous\.replaceWith\(button\)/);
  assert.match(app, /installSingleSvgExport\(\);/);
  assert.doesNotMatch(app, /installRenderDiagnostics\(\);/);
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
  assert.doesNotMatch(app, /\['language-label', copy\.language\]/);
  assert.match(app, /setLabelText\('language-label', copy\.language\)/);
});

test('workspace visibility is versioned, restored, and reset from the View menu', () => {
  assert.match(index, /workspace-state\.js/);
  assert.match(app, /acorde-composer\.workspace\.v1/);
  assert.match(app, /function captureWorkspaceState\(\)/);
  assert.match(app, /function applyWorkspaceState\(value\)/);
  assert.match(app, /function restoreWorkspaceState\(\)/);
  assert.match(app, /function resetWorkspaceState\(\)/);
  assert.match(app, /ResizeObserver/);
  assert.match(app, /openMixer = \(visible = true\)[\s\S]*openMixerBase\(visible\)/);
});

test('score right-click routes native context actions through existing commands', () => {
  assert.match(app, /addEventListener\('contextmenu'/);
  assert.match(app, /showScoreContextMenu/);
  assert.match(app, /data-acorde-kind="measure-text"/);
  assert.match(app, /DeleteMeasureText/);
  assert.match(app, /PasteMeasureText/);
  assert.match(app, /const voice = voices\[voiceIndex\] \|\| \[\]/);
  assert.match(app, /setAttribute\('aria-label', `Measure/);
  assert.match(app, /acorde-measure-hit-area/);
  assert.match(app, /interactiveSvg\.setAttribute\('role', 'group'\)/);
  assert.match(fs.readFileSync(path.join(root, 'src\/style.css'), 'utf8'), /pointer-events:bounding-box/);
});

test('adaptive rendering supplies width and measure density to the engine', () => {
  assert.match(index, /render-policy\.js/);
  assert.match(app, /AcordeRenderPolicy\.options/);
  assert.match(app, /renderCurrent\(options\.width, options\)/);
  const main = fs.readFileSync(path.join(root, 'electron/main.cjs'), 'utf8');
  assert.match(main, /measures_per_system: measuresPerSystem/);
});

test('Format routes open real page and display-only layout settings', () => {
  assert.match(index, /id="page-layout-dialog"/);
  assert.match(index, /id="layout-density-dialog"/);
  assert.match(index, /id="layout-density-select"/);
  assert.match(app, /function openPageSettings\(\)/);
  assert.match(app, /function applyPageSettings\(\)/);
  assert.match(app, /function applyLayoutDensity\(nextDensity\)/);
  assert.match(app, /acorde-composer\.layout-density\.v1/);
  assert.match(app, /AcordeRenderPolicy\.options\(available, layoutDensity\)/);
  assert.equal(commandRegistry.resolveCommand('format:page-settings').handler, 'page-settings');
  assert.equal(commandRegistry.resolveCommand('format:layout-density').handler, 'layout-density');
});

test('score viewport exposes page and continuous modes with adaptive rerendering', () => {
  const style = fs.readFileSync(path.join(root, 'src/style.css'), 'utf8');
  assert.match(app, /id = 'score-view-mode'/);
  assert.match(app, /Page view[\s\S]*Continuous view/);
  assert.match(app, /continuous-view[\s\S]*renderAndUpdateCurrentScore/);
  assert.match(style, /\.score-area\.continuous-view \.score-paper/);
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

test('MuseScore-style Find / Go to selects a rendered measure range', () => {
  assert.match(index, /measure-navigation\.js/);
  assert.match(index, /Other built-in shortcuts/);
  assert.match(app, /async function findOrGoToMeasure\(\)/);
  assert.match(app, /AcordeMeasureNavigation\?\.parseMeasureRange/);
  assert.match(app, /function selectMeasureRange\(start, end\)/);
  assert.match(app, /selectedRange = \[start, end\]/);
  assert.match(app, /scrollIntoView\(\{ block: 'center', inline: 'center' \}\)/);
});

test('Navigator and configurable shortcuts use Composer UI state without inventing score semantics', () => {
  assert.match(app, /function renderNavigator\(\)/);
  assert.match(app, /id = 'navigator-panel'/);
  assert.match(app, /'toggle-navigator'/);
  assert.match(index, /id="shortcut-editor"/);
  assert.match(app, /function installShortcutEditor\(\)/);
  assert.match(app, /acorde-composer\.shortcuts\.v1/);
  assert.match(app, /findShortcutConflict/);
  assert.match(app, /function currentSectionRange\(\)/);
  assert.match(index, /section-navigation\.js/);
  assert.match(sectionNavigation, /section_break/);
  assert.doesNotMatch(sectionNavigation, /system_break/);
  assert.equal(commandRegistry.resolveCommand('view:navigator').handler, 'toggle-navigator');
  assert.equal(commandRegistry.resolveCommand('edit:select-section').handler, 'select-section');
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
  assert.match(app, /status\.textContent = slots\.length > 1/);
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
  assert.match(index, /voice-selection\.js/);
  assert.match(app, /function voiceCount\(\)/);
  assert.match(app, /function activeVoiceSlots\(\)/);
  assert.match(app, /AcordeVoiceSelection\.sourceNumber/);
  assert.match(app, /function stepActiveVoice\(direction\)/);
  assert.match(app, /function refreshVoiceSelector\(\)/);
  assert.match(app, /voice: voiceIndex/);
  assert.equal(commandRegistry.commandForKeyboardEvent({ key: '[' }), 'voice:previous');
  assert.equal(commandRegistry.commandForKeyboardEvent({ key: ']' }), 'voice:next');
  assert.match(multiVoiceFixture, /<backup><duration>1920<\/duration><\/backup>/);
  assert.match(multiVoiceFixture, /<forward><duration>960<\/duration><voice>1<\/voice><\/forward>/);
  const notes = multiVoiceFixture.match(/<note>[\s\S]*?<\/note>/g) || [];
  assert.equal(notes.filter((note) => /<voice>1<\/voice>/.test(note)).length, 2);
  assert.equal(notes.filter((note) => /<voice>2<\/voice>/.test(note)).length, 2);
  assert.match(multiVoiceFixture, /<rest\/>/);
  assert.match(fs.readFileSync(path.join(root, 'electron/multivoice-workflow.test.cjs'), 'utf8'), /voice: 1/);
  assert.match(fs.readFileSync(path.join(root, 'electron/multivoice-workflow.test.cjs'), 'utf8'), /source_voice_numbers/);
  assert.match(fs.readFileSync(path.join(root, 'electron/multivoice-workflow.test.cjs'), 'utf8'), /playback_events/);
});

test('notation UI exposes advanced spanners and explicit ABC loss diagnostics', () => {
  const app = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8');
  assert.match(app, /id = 'glissando-button'/);
  assert.match(app, /id = 'cross-staff-button'/);
  assert.match(app, /id = 'text-style-button'/);
  assert.match(app, /composer\.abc-lossy-spanners/);
  assert.match(app, /composer\.abc-lossy-text-styles/);
  assert.match(app, /type: 'set_measure_text'/);
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

test('voice selection derives populated slots without intermediate score arrays', () => {
  const source = app.match(/function voiceCount\(\) \{[^\n]+/u)?.[0] || '';
  const voiceSelection = fs.readFileSync(path.join(root, 'src', 'voice-selection.js'), 'utf8');
  assert.match(source, /return activeVoiceSlots\(\)\.length/);
  assert.match(voiceSelection, /for \(const staff of score\?\.parts/);
  assert.doesNotMatch(voiceSelection, /flatMap/);
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
  assert.match(app, /prepareSoundfontEvents/);
  assert.match(app, /prepareSoundfontPlayback/);
  assert.match(app, /soundfont_sample_key/);
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

test('workspace follows the MuseScore panel and toolbar geography', () => {
  assert.match(index, /data-panel="properties"/);
  assert.match(index, /id="properties-panel"/);
  assert.match(app, /function installMuseScoreWorkspaceLayout\(\)/);
  assert.match(app, /className = 'musescore-score-actions'/);
  assert.match(app, /className = 'musescore-playback'/);
  assert.match(app, /className = 'sidebar-panel sidebar-palettes'/);
  assert.match(app, /className = 'status-zoom'/);
  assert.match(app, /className = 'navigator-panel'/);
  assert.match(app, /rendererCommandHandlers/);
  assert.match(app, /'toggle-palettes':[\s\S]*classList\.toggle\('hidden'/);
  assert.match(app, /'toggle-note-input-toolbar':[\s\S]*classList\.toggle\('hidden'/);
  assert.match(app, /'reset-layout': \(\) => resetWorkspaceState\(\)/);
  assert.equal(commandRegistry.resolveCommand('view:palettes').handler, 'toggle-palettes');
  assert.equal(commandRegistry.resolveCommand('view:note-input-toolbar').handler, 'toggle-note-input-toolbar');
  assert.equal(commandRegistry.resolveCommand('view:reset-layout').handler, 'reset-layout');
  assert.match(style, /MuseScore-oriented workspace/);
  assert.match(style, /\.sidebar-tabs/);
  assert.match(style, /\.properties-actions/);
});
