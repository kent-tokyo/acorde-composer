const { app, BrowserWindow, dialog, ipcMain, Menu, shell } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');
const { spawn } = require('node:child_process');
const readline = require('node:readline');
const { assertScoreSize, assertEngineRequestSize } = require('./limits.cjs');
const { inspectSoundfontAsset } = require('./soundfont-asset.cjs');
const { buildNewScoreXml } = require('./templates.cjs');
const { addComposerImportWarnings } = require('./import-diagnostics.cjs');
const { assertCommand, normalizeCommandForEngine } = require('./command-schema.cjs');
const { assessOmrProposal, createOmrReviewQueue, findOmrItemAtPoint, normalizeOmrRunResult, runExternalOmrProvider, transitionOmrItem } = require('./omr-boundary.cjs');
const { buildAiRequest, createAiRateLimiter, normalizeAiResponse, runExternalAiProvider } = require('./ai-provider-boundary.cjs');
const { assessProviderConfig, normalizeProviderConfig } = require('./provider-config.cjs');
const { normalizeDecodedSample } = require('./sample-contract.cjs');
const { attachResolvedLayers, attachResolvedSample, attachResolvedSnapshot } = require('./soundfont-playback.cjs');
const { inspectOmrInputWithHeader } = require('./omr-input.cjs');
const { serializeSupportBundle } = require('./support-bundle.cjs');
const { supportBundleSaveDialogOptions, supportBundleSaveResult } = require('./support-bundle-path.cjs');
const { buildApplicationMenuTemplate, normalizeMenuLanguage } = require('./application-menu.cjs');
const { normalizeShortcutOverrides } = require('../src/command-registry.js');
const { DocumentSaveTargets, ensureMusicXmlPath } = require('./document-save-target.cjs');
const { buildScoreContextMenuTemplate } = require('./score-context-menu.cjs');
const { EngineSessionManager } = require('./engine-session-manager.cjs');

const DEFAULT_MENU_STATE = Object.freeze({ hasScore: false, hasSelection: false, canUndo: false, canRedo: false, palettesVisible: true, propertiesVisible: true, historyVisible: false, mixerVisible: false, playbackControlsVisible: true, noteInputVisible: true, statusBarVisible: true, navigatorVisible: true, sectionSelectionAvailable: false, shortcutOverrides: {} });
const applicationMenuLanguages = new Map();
const applicationMenuStates = new Map();
const applicationMenuRevisions = new Map();
const aiRateLimiter = createAiRateLimiter();
const documentSaveTargets = new DocumentSaveTargets();
const RECENT_FILES_LIMIT = 8;
const MAX_PENDING_ENGINE_REQUESTS = 64;
function recentFilesPath() { return path.join(app.getPath('userData'), 'recent-files.json'); }
async function readRecentFiles() { try { const value = JSON.parse(await fs.readFile(recentFilesPath(), 'utf8')); return Array.isArray(value) ? value.filter((item) => item?.path).slice(0, RECENT_FILES_LIMIT) : []; } catch { return []; } }
async function rememberRecentFile(filePath) { const items = (await readRecentFiles()).filter((item) => item.path !== filePath); items.unshift({ path: filePath, name: path.basename(filePath), openedAt: new Date().toISOString() }); await fs.mkdir(app.getPath('userData'), { recursive: true }); await fs.writeFile(recentFilesPath(), JSON.stringify(items.slice(0, RECENT_FILES_LIMIT)), 'utf8'); }
async function clearRecentFiles() { await fs.mkdir(app.getPath('userData'), { recursive: true }); await fs.writeFile(recentFilesPath(), '[]', 'utf8'); }
function startEngineSession() {
  const packagedPath = path.join(process.resourcesPath, 'engine', `acorde-composer-engine${process.platform === 'win32' ? '.exe' : ''}`);
  const enginePath = process.env.ACORDE_ENGINE_BIN || (app.isPackaged ? packagedPath : null);
  if (app.isPackaged && !process.env.ACORDE_ENGINE_BIN && !require('node:fs').existsSync(packagedPath)) {
    throw new Error(`Packaged acorde engine is missing: ${packagedPath}`);
  }
  const child = enginePath
    ? spawn(enginePath, [], { stdio: ['pipe', 'pipe', 'pipe'] })
    : spawn('cargo', ['run', '--quiet', '--manifest-path', path.join(__dirname, '../engine/Cargo.toml')], { stdio: ['pipe', 'pipe', 'pipe'] });
  const pending = [];
  let closed = false;
  const failPending = (message) => { while (pending.length) pending.shift().reject(new Error(message)); };
  readline.createInterface({ input: child.stdout }).on('line', (line) => {
    const item = pending.shift();
    if (!item) return;
    try {
      const response = JSON.parse(line);
      response.ok ? item.resolve(response.result) : item.reject(new Error(response.error || 'acorde engine request failed'));
    } catch {
      item.reject(new Error('acorde engine returned invalid JSON'));
      failPending('acorde engine returned invalid JSON');
      child.kill();
    }
  });
  child.stderr.on('data', (data) => console.error(`[acorde-engine] ${data}`));
  child.stdin.on('error', (error) => { console.error(`[acorde-engine] stdin failed: ${error.message}`); failPending('acorde engine input failed'); });
  child.on('error', (error) => { console.error(`[acorde-engine] spawn failed: ${error.message}`); failPending('acorde engine failed to start'); });
  child.on('exit', (code, signal) => { if (!closed) console.error(`[acorde-engine] exited code=${code} signal=${signal || 'none'}`); failPending('acorde engine stopped'); });
  return {
    request: (request) => new Promise((resolve, reject) => { const payload = JSON.stringify(request); try { assertEngineRequestSize(Buffer.byteLength(payload)); } catch (error) { return reject(error); } if (pending.length >= MAX_PENDING_ENGINE_REQUESTS) return reject(new Error('acorde engine request queue is full')); pending.push({ resolve, reject }); try { child.stdin.write(`${payload}\n`); } catch { pending.pop(); reject(new Error('acorde engine input failed')); } }),
    close: () => { if (closed) return; closed = true; failPending('acorde engine session closed'); child.kill(); },
  };
}
const engineSessions = new EngineSessionManager(() => startEngineSession());
function callEngine(ownerId, request) { return engineSessions.request(ownerId, request); }
function callEventEngine(event, request) { return callEngine(ownerId(event), request); }
function ownerId(event) { return event?.sender?.id; }
function menuLanguageFor(window) { return applicationMenuLanguages.get(window.webContents.id) || 'en'; }
function menuStateFor(window) { return applicationMenuStates.get(window.webContents.id) || DEFAULT_MENU_STATE; }

async function installApplicationMenu(window, language = menuLanguageFor(window)) {
  const windowId = window.webContents.id;
  const revision = (applicationMenuRevisions.get(windowId) || 0) + 1;
  applicationMenuRevisions.set(windowId, revision);
  const normalizedLanguage = normalizeMenuLanguage(language);
  applicationMenuLanguages.set(windowId, normalizedLanguage);
  const recentFiles = await readRecentFiles();
  if (revision !== applicationMenuRevisions.get(windowId) || window.isDestroyed()) return;
  const sendMenuCommand = (command) => {
    if (!window.isDestroyed()) window.webContents.send('menu:command', command);
  };
  const template = buildApplicationMenuTemplate({
    send: sendMenuCommand,
    platform: process.platform,
    language: normalizedLanguage,
    recentFiles,
    menuState: menuStateFor(window),
    openDocumentation: () => shell.openExternal('https://github.com/kent-tokyo/acorde-composer#readme'),
    openMuseScoreReference: () => shell.openExternal('https://handbook.musescore.org/navigation/the-user-interface'),
  });
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1050,
    minHeight: 700,
    backgroundColor: '#f5f7fb',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  const windowId = window.webContents.id;
  window.loadFile(path.join(__dirname, '../src/index.html'));
  window.on('focus', () => { void installApplicationMenu(window); });
  window.on('closed', () => {
    engineSessions.release(windowId);
    documentSaveTargets.clear(windowId);
    applicationMenuLanguages.delete(windowId);
    applicationMenuStates.delete(windowId);
    applicationMenuRevisions.delete(windowId);
  });
  void installApplicationMenu(window);
  return window;
}

ipcMain.handle('app:setLanguage', async (event, { language } = {}) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) throw new Error('No Composer window is available for menu localization');
  await installApplicationMenu(window, language);
  return menuLanguageFor(window);
});

ipcMain.handle('app:setMenuState', async (event, state = {}) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) throw new Error('No Composer window is available for menu state synchronization');
  const next = {
    hasScore: state.hasScore === true,
    hasSelection: state.hasSelection === true,
    canUndo: state.canUndo === true,
    canRedo: state.canRedo === true,
    palettesVisible: state.palettesVisible !== false,
    propertiesVisible: state.propertiesVisible !== false,
    historyVisible: state.historyVisible === true,
    mixerVisible: state.mixerVisible === true,
    playbackControlsVisible: state.playbackControlsVisible !== false,
    noteInputVisible: state.noteInputVisible !== false,
    statusBarVisible: state.statusBarVisible !== false,
    navigatorVisible: state.navigatorVisible !== false,
    sectionSelectionAvailable: state.sectionSelectionAvailable === true,
    shortcutOverrides: normalizeShortcutOverrides(state.shortcutOverrides),
  };
  const windowId = event.sender.id;
  if (JSON.stringify(next) === JSON.stringify(applicationMenuStates.get(windowId) || DEFAULT_MENU_STATE)) return next;
  applicationMenuStates.set(windowId, next);
  await installApplicationMenu(window);
  return next;
});

ipcMain.handle('app:closeWindow', async (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) return false;
  window.close();
  return true;
});

ipcMain.handle('app:clearRecentFiles', async (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  await clearRecentFiles();
  if (window) await installApplicationMenu(window);
  return true;
});

ipcMain.handle('app:showScoreContextMenu', async (event, state = {}) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window) return false;
  const send = (command) => {
    if (!window.isDestroyed()) window.webContents.send('menu:command', command);
  };
  const template = buildScoreContextMenuTemplate({ send, state, language: menuLanguageFor(window) });
  Menu.buildFromTemplate(template).popup({ window });
  return true;
});

async function openScorePath(owner, filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const binary = extension === '.mid' || extension === '.midi' || extension === '.mxl';
  const fileData = await fs.readFile(filePath);
  assertScoreSize(fileData.byteLength);
  const content = binary ? null : fileData.toString('utf8');
  let report = extension === '.abc'
    ? await callEngine(owner, { op: 'parse_abc_report', text: content })
    : extension === '.mxl'
    ? await callEngine(owner, { op: 'parse_mxl_report', data: [...fileData] })
      : binary
        ? await callEngine(owner, { op: 'parse_midi_report', data: [...fileData] })
        : await callEngine(owner, { op: 'parse_musicxml_report', xml: content });
  if (!binary && extension !== '.abc') report = addComposerImportWarnings(report, content);
  const score = report.score;
  await callEngine(owner, { op: 'load_score', score });
  const svg = await callEngine(owner, { op: 'render_current', width: 900 });
  await rememberRecentFile(filePath);
  const window = BrowserWindow.getAllWindows().find((candidate) => candidate.webContents.id === owner);
  if (window) await installApplicationMenu(window);
  return { filePath, content, format: extension === '.abc' ? 'abc' : extension === '.mxl' ? 'mxl' : binary ? 'midi' : 'musicxml', score, report, svg };
}

ipcMain.handle('file:open', async (event) => {
  const result = await dialog.showOpenDialog(BrowserWindow.fromWebContents(event.sender), {
    properties: ['openFile'],
    filters: [{ name: 'Music score', extensions: ['musicxml', 'xml', 'mxl', 'mid', 'midi', 'abc'] }],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  const opened = await openScorePath(ownerId(event), result.filePaths[0]);
  documentSaveTargets.trackOpened(event.sender.id, opened.filePath);
  return opened;
});
ipcMain.handle('file:openPath', async (event, { filePath }) => {
  const items = await readRecentFiles();
  if (!Number.isInteger(filePath) || filePath < 0 || filePath >= items.length) throw new Error('Recent file index is invalid');
  const opened = await openScorePath(ownerId(event), items[filePath].path);
  documentSaveTargets.trackOpened(event.sender.id, opened.filePath);
  return opened;
});
ipcMain.handle('file:recent', async () => (await readRecentFiles()).map(({ name, path: filePath, openedAt }) => ({ name, path: filePath, openedAt })));

ipcMain.handle('file:new', async (event, { template = 'piano' } = {}) => {
  const xml = buildNewScoreXml(template);
  const owner = ownerId(event);
  const report = await callEngine(owner, { op: 'parse_musicxml_report', xml });
  await callEngine(owner, { op: 'load_score', score: report.score });
  const svg = await callEngine(owner, { op: 'render_current', width: 900 });
  documentSaveTargets.clear(event.sender.id);
  return { score: report.score, report, svg };
});

ipcMain.handle('file:saveDocument', async (event, { suggestedName, content, saveAs = false } = {}) => {
  if (typeof content !== 'string') throw new TypeError('MusicXML document content is required');
  const ownerId = event.sender.id;
  let filePath = saveAs ? null : documentSaveTargets.get(ownerId);
  if (!filePath) {
    const window = BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showSaveDialog(window, {
      defaultPath: suggestedName || 'score.musicxml',
      filters: [{ name: 'MusicXML score', extensions: ['musicxml', 'xml'] }],
    });
    if (result.canceled || !result.filePath) return null;
    filePath = ensureMusicXmlPath(result.filePath);
  }
  await fs.writeFile(filePath, content, 'utf8');
  documentSaveTargets.set(ownerId, filePath);
  await rememberRecentFile(filePath);
  return filePath;
});

ipcMain.handle('file:save', async (_event, { suggestedName, content }) => {
  const result = await dialog.showSaveDialog({ defaultPath: suggestedName || 'score.musicxml' });
  if (result.canceled || !result.filePath) return null;
  await fs.writeFile(result.filePath, content, 'utf8');
  return result.filePath;
});
ipcMain.handle('file:saveSupportBundle', async (_event, { suggestedName, diagnostics, releaseQa } = {}) => {
  const result = await dialog.showSaveDialog(supportBundleSaveDialogOptions(suggestedName));
  const filePath = supportBundleSaveResult(result);
  if (!filePath) return null;
  const content = serializeSupportBundle({ version: app.getVersion(), platform: `${process.platform}-${process.arch}`, diagnostics, releaseQa });
  await fs.writeFile(filePath, content, 'utf8');
  return filePath;
});
ipcMain.handle('file:savePdf', async (_event, { suggestedName, pageSize, landscape = false, margin = 0.4 }) => {
  const sourceWindow = BrowserWindow.getFocusedWindow();
  if (!sourceWindow) throw new Error('No Composer window is available for PDF export');
  const result = await dialog.showSaveDialog(sourceWindow, { defaultPath: suggestedName || 'score.pdf', filters: [{ name: 'PDF', extensions: ['pdf'] }] });
  if (result.canceled || !result.filePath) return null;
  const safeMargin = Number.isFinite(margin) ? Math.min(1, Math.max(0, margin)) : 0.4;
  const data = await sourceWindow.webContents.printToPDF({ printBackground: true, landscape: landscape === true, pageSize: ['Letter', 'A5'].includes(pageSize) ? pageSize : 'A4', margins: { top: safeMargin, bottom: safeMargin, left: safeMargin, right: safeMargin } });
  await fs.writeFile(result.filePath, data);
  return result.filePath;
});

ipcMain.handle('engine:serializeMusicxml', async (event, { score }) => callEventEngine(event, { op: 'serialize_musicxml', score }));
ipcMain.handle('engine:renderSvg', async (event, { score, width, staffSize, measuresPerSystem, interactive }) => callEventEngine(event, { op: 'render_svg', score, width, staff_size: staffSize, measures_per_system: measuresPerSystem, interactive }));
ipcMain.handle('engine:renderSvgMetadata', async (event, { score, width, staffSize, measuresPerSystem, interactive }) => callEventEngine(event, { op: 'render_svg_metadata', score, width, staff_size: staffSize, measures_per_system: measuresPerSystem, interactive }));
ipcMain.handle('engine:applyCommand', async (event, payload) => {
  assertCommand(payload?.command);
  return callEventEngine(event, { op: 'apply_command', ...payload, command: normalizeCommandForEngine(payload.command) });
});
ipcMain.handle('engine:undo', async (event) => callEventEngine(event, { op: 'undo' }));
ipcMain.handle('engine:redo', async (event) => callEventEngine(event, { op: 'redo' }));
ipcMain.handle('engine:renderCurrent', async (event, { width, staffSize, measuresPerSystem, interactive }) => callEventEngine(event, { op: 'render_current', width, staff_size: staffSize, measures_per_system: measuresPerSystem, interactive }));
ipcMain.handle('engine:loadScore', async (event, { score }) => callEventEngine(event, { op: 'load_score', score }));
ipcMain.handle('engine:extractPart', async (event, { score, partIndex }) => callEventEngine(event, { op: 'extract_part', score, part_index: partIndex }));
ipcMain.handle('engine:serializeCurrent', async (event) => callEventEngine(event, { op: 'serialize_current' }));
ipcMain.handle('engine:serializeMidi', async (event, { score }) => callEventEngine(event, { op: 'serialize_midi', score }));
ipcMain.handle('engine:serializeMusicxmlReport', async (event, { score }) => callEventEngine(event, { op: 'serialize_musicxml_report', score }));
ipcMain.handle('engine:serializeAbcReport', async (event, { score }) => callEventEngine(event, { op: 'serialize_abc_report', score }));
ipcMain.handle('engine:serializeMidiReport', async (event, { score }) => callEventEngine(event, { op: 'serialize_midi_report', score }));
ipcMain.handle('file:saveMidi', async (_event, { suggestedName, data }) => {
  const result = await dialog.showSaveDialog({ defaultPath: suggestedName || 'score.mid', filters: [{ name: 'MIDI', extensions: ['mid'] }] });
  if (result.canceled || !result.filePath) return null;
  await fs.writeFile(result.filePath, Buffer.from(data));
  return result.filePath;
});
ipcMain.handle('file:chooseSoundfont', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openFile'], filters: [{ name: 'SoundFont', extensions: ['sf2', 'sf3'] }] });
  if (result.canceled || !result.filePaths.length) return null;
  return result.filePaths[0];
});
ipcMain.handle('file:chooseOmrInput', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openFile'], filters: [{ name: 'OMR input', extensions: ['png', 'jpg', 'jpeg', 'pdf'] }] });
  if (result.canceled || !result.filePaths.length) return null;
  const filePath = result.filePaths[0];
  let stat = null;
  let header = null;
  try { stat = await fs.stat(filePath); } catch {}
  if (stat?.isFile && stat.size > 0) {
    try { const handle = await fs.open(filePath, 'r'); const buffer = Buffer.alloc(8); await handle.read(buffer, 0, buffer.length, 0); await handle.close(); header = buffer; } catch {}
  }
  return inspectOmrInputWithHeader(filePath, stat, header);
});
ipcMain.handle('file:validateSoundfont', async (_event, { filePath }) => {
  try { return inspectSoundfontAsset(filePath, await fs.stat(filePath)); } catch { return inspectSoundfontAsset(filePath, null); }
});
ipcMain.handle('file:readSoundfont', async (_event, { filePath }) => {
  const asset = inspectSoundfontAsset(filePath, await fs.stat(filePath));
  if (!asset.exists) throw new Error(`SoundFont asset is not loadable: ${asset.reason}`);
  return fs.readFile(filePath);
});
ipcMain.handle('engine:playbackEvents', async (event, { score, bpm, loopRegion }) => callEventEngine(event, { op: 'playback_events', score, bpm, loop_region: loopRegion }));
ipcMain.handle('engine:playbackPosition', async (event, { elapsedSecs, bpm }) => callEventEngine(event, { op: 'playback_position', elapsed_secs: elapsedSecs, bpm }));
ipcMain.handle('engine:inspectSoundfont', async (event, { data, provider_version: providerVersion, bank, program }) => callEventEngine(event, { op: 'inspect_soundfont', data, provider_version: providerVersion, bank, program }));
ipcMain.handle('engine:decodeSoundfontSample', async (event, { format, data, startFrame, endFrame, sampleRate, channels }) => callEventEngine(event, { op: 'decode_soundfont_sample', format, data, start_frame: startFrame, end_frame: endFrame, sample_rate: sampleRate, channels }));
ipcMain.handle('engine:prepareSoundfontPlayback', async (event, { data, providerVersion, bank, program, channels, events }) => callEventEngine(event, { op: 'prepare_soundfont_playback', data, provider_version: providerVersion, bank, program, channels, events }));
ipcMain.handle('soundfont:normalizeDecodedSample', async (_event, sample) => normalizeDecodedSample(sample));
ipcMain.handle('soundfont:attachResolvedSample', async (_event, { events, zones, samplesById, bank, program } = {}) => attachResolvedSample(events, zones, samplesById, { bank, program }));
ipcMain.handle('soundfont:attachResolvedSnapshot', async (_event, { events, snapshot, samplesById, bank, program } = {}) => attachResolvedSnapshot(events, snapshot, samplesById, { bank, program }));
ipcMain.handle('soundfont:attachResolvedLayers', async (_event, { events, zones, samplesById, bank, program } = {}) => attachResolvedLayers(events, zones, samplesById, { bank, program }));
ipcMain.handle('omr:assessProposal', async (_event, proposal) => assessOmrProposal(proposal));
ipcMain.handle('omr:normalizeRunResult', async (_event, result) => normalizeOmrRunResult(result));
ipcMain.handle('omr:runExternalProvider', async (_event, { executable, args, request, timeoutMs } = {}) => runExternalOmrProvider({ executable, args, request, timeoutMs }));
ipcMain.handle('omr:listReviewItems', async (_event, { proposal, status = null } = {}) => { const queue = createOmrReviewQueue(proposal); return { usable: queue.usable, diagnostics: queue.diagnostics, items: queue.list(status) }; });
ipcMain.handle('omr:transitionItem', async (_event, { item, action, correction } = {}) => transitionOmrItem(item, action, correction));
ipcMain.handle('omr:findItemAtPoint', async (_event, { proposal, x, y }) => findOmrItemAtPoint(proposal, x, y));
ipcMain.handle('ai:buildRequest', async (_event, payload) => buildAiRequest(payload));
ipcMain.handle('ai:normalizeResponse', async (_event, { response, expectedContextFingerprint } = {}) => normalizeAiResponse(response, { expectedContextFingerprint }));
ipcMain.handle('ai:runExternalProvider', async (_event, payload = {}) => runExternalAiProvider({ ...payload, limiter: aiRateLimiter }));
ipcMain.handle('provider:normalizeConfig', async (_event, { config, kind } = {}) => normalizeProviderConfig(config, kind));
ipcMain.handle('provider:assessConfig', async (_event, { config, kind } = {}) => assessProviderConfig(config, kind));

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
