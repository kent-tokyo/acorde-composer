const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');
const { spawn } = require('node:child_process');
const readline = require('node:readline');
const { assertScoreSize, assertEngineRequestSize } = require('./limits.cjs');
const { inspectSoundfontAsset } = require('./soundfont-asset.cjs');
const { buildNewScoreXml } = require('./templates.cjs');
const { addComposerImportWarnings } = require('./import-diagnostics.cjs');
const { assertCommand } = require('./command-schema.cjs');
const { assessOmrProposal, createOmrReviewQueue, findOmrItemAtPoint, normalizeOmrRunResult, runExternalOmrProvider, transitionOmrItem } = require('./omr-boundary.cjs');
const { buildAiRequest, normalizeAiResponse } = require('./ai-provider-boundary.cjs');
const { normalizeDecodedSample } = require('./sample-contract.cjs');
const { inspectOmrInputWithHeader } = require('./omr-input.cjs');

let engine;
const RECENT_FILES_LIMIT = 8;
function recentFilesPath() { return path.join(app.getPath('userData'), 'recent-files.json'); }
async function readRecentFiles() { try { const value = JSON.parse(await fs.readFile(recentFilesPath(), 'utf8')); return Array.isArray(value) ? value.filter((item) => item?.path).slice(0, RECENT_FILES_LIMIT) : []; } catch { return []; } }
async function rememberRecentFile(filePath) { const items = (await readRecentFiles()).filter((item) => item.path !== filePath); items.unshift({ path: filePath, name: path.basename(filePath), openedAt: new Date().toISOString() }); await fs.mkdir(app.getPath('userData'), { recursive: true }); await fs.writeFile(recentFilesPath(), JSON.stringify(items.slice(0, RECENT_FILES_LIMIT)), 'utf8'); }
function startEngine() {
  const child = process.env.ACORDE_ENGINE_BIN
    ? spawn(process.env.ACORDE_ENGINE_BIN, [], { stdio: ['pipe', 'pipe', 'pipe'] })
    : spawn('cargo', ['run', '--quiet', '--manifest-path', path.join(__dirname, '../engine/Cargo.toml')], { stdio: ['pipe', 'pipe', 'pipe'] });
  const pending = [];
  readline.createInterface({ input: child.stdout }).on('line', (line) => {
    const item = pending.shift();
    if (!item) return;
    const response = JSON.parse(line);
    response.ok ? item.resolve(response.result) : item.reject(new Error(response.error));
  });
  child.stderr.on('data', (data) => console.error(`[acorde-engine] ${data}`));
  child.on('exit', () => { while (pending.length) pending.shift().reject(new Error('acorde engine stopped')); engine = null; });
  return (request) => new Promise((resolve, reject) => { const payload = JSON.stringify(request); try { assertEngineRequestSize(Buffer.byteLength(payload)); } catch (error) { return reject(error); } pending.push({ resolve, reject }); child.stdin.write(`${payload}\n`); });
}
function callEngine(request) { engine ||= startEngine(); return engine(request); }

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
  window.loadFile(path.join(__dirname, '../src/index.html'));
}

async function openScorePath(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const binary = extension === '.mid' || extension === '.midi' || extension === '.mxl';
  const fileData = await fs.readFile(filePath);
  assertScoreSize(fileData.byteLength);
  const content = binary ? null : fileData.toString('utf8');
  let report = extension === '.abc'
    ? await callEngine({ op: 'parse_abc_report', text: content })
    : extension === '.mxl'
    ? await callEngine({ op: 'parse_mxl_report', data: [...fileData] })
      : binary
        ? await callEngine({ op: 'parse_midi_report', data: [...fileData] })
        : await callEngine({ op: 'parse_musicxml_report', xml: content });
  if (!binary && extension !== '.abc') report = addComposerImportWarnings(report, content);
  const score = report.score;
  await callEngine({ op: 'load_score', score });
  const svg = await callEngine({ op: 'render_current', width: 900 });
  await rememberRecentFile(filePath);
  return { filePath, content, format: extension === '.abc' ? 'abc' : extension === '.mxl' ? 'mxl' : binary ? 'midi' : 'musicxml', score, report, svg };
}

ipcMain.handle('file:open', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Music score', extensions: ['musicxml', 'xml', 'mxl', 'mid', 'midi', 'abc'] }],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return openScorePath(result.filePaths[0]);
});
ipcMain.handle('file:openPath', async (_event, { filePath }) => {
  const items = await readRecentFiles();
  if (!Number.isInteger(filePath) || filePath < 0 || filePath >= items.length) throw new Error('Recent file index is invalid');
  return openScorePath(items[filePath].path);
});
ipcMain.handle('file:recent', async () => (await readRecentFiles()).map(({ name, path: filePath, openedAt }) => ({ name, path: filePath, openedAt })));

ipcMain.handle('file:new', async (_event, { template = 'piano' } = {}) => {
  const xml = buildNewScoreXml(template);
  const report = await callEngine({ op: 'parse_musicxml_report', xml });
  await callEngine({ op: 'load_score', score: report.score });
  const svg = await callEngine({ op: 'render_current', width: 900 });
  return { score: report.score, report, svg };
});

ipcMain.handle('file:save', async (_event, { suggestedName, content }) => {
  const result = await dialog.showSaveDialog({ defaultPath: suggestedName || 'score.musicxml' });
  if (result.canceled || !result.filePath) return null;
  await fs.writeFile(result.filePath, content, 'utf8');
  return result.filePath;
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

ipcMain.handle('engine:serializeMusicxml', async (_event, { score }) => callEngine({ op: 'serialize_musicxml', score }));
ipcMain.handle('engine:renderSvg', async (_event, { score, width, staffSize, measuresPerSystem, interactive }) => callEngine({ op: 'render_svg', score, width, staff_size: staffSize, measures_per_system: measuresPerSystem, interactive }));
ipcMain.handle('engine:renderSvgMetadata', async (_event, { score, width, staffSize, measuresPerSystem, interactive }) => callEngine({ op: 'render_svg_metadata', score, width, staff_size: staffSize, measures_per_system: measuresPerSystem, interactive }));
ipcMain.handle('engine:applyCommand', async (_event, payload) => {
  assertCommand(payload?.command);
  return callEngine({ op: 'apply_command', ...payload });
});
ipcMain.handle('engine:undo', async () => callEngine({ op: 'undo' }));
ipcMain.handle('engine:redo', async () => callEngine({ op: 'redo' }));
ipcMain.handle('engine:renderCurrent', async (_event, { width }) => callEngine({ op: 'render_current', width }));
ipcMain.handle('engine:loadScore', async (_event, { score }) => callEngine({ op: 'load_score', score }));
ipcMain.handle('engine:extractPart', async (_event, { score, partIndex }) => callEngine({ op: 'extract_part', score, part_index: partIndex }));
ipcMain.handle('engine:serializeCurrent', async () => callEngine({ op: 'serialize_current' }));
ipcMain.handle('engine:serializeMidi', async (_event, { score }) => callEngine({ op: 'serialize_midi', score }));
ipcMain.handle('engine:serializeMusicxmlReport', async (_event, { score }) => callEngine({ op: 'serialize_musicxml_report', score }));
ipcMain.handle('engine:serializeAbcReport', async (_event, { score }) => callEngine({ op: 'serialize_abc_report', score }));
ipcMain.handle('engine:serializeMidiReport', async (_event, { score }) => callEngine({ op: 'serialize_midi_report', score }));
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
ipcMain.handle('engine:playbackEvents', async (_event, { score, bpm, loopRegion }) => callEngine({ op: 'playback_events', score, bpm, loop_region: loopRegion }));
ipcMain.handle('engine:playbackPosition', async (_event, { elapsedSecs, bpm }) => callEngine({ op: 'playback_position', elapsed_secs: elapsedSecs, bpm }));
ipcMain.handle('engine:inspectSoundfont', async (_event, { data, provider_version: providerVersion, bank, program }) => callEngine({ op: 'inspect_soundfont', data, provider_version: providerVersion, bank, program }));
ipcMain.handle('engine:decodeSoundfontSample', async (_event, { format, data, startFrame, endFrame, sampleRate, channels }) => callEngine({ op: 'decode_soundfont_sample', format, data, start_frame: startFrame, end_frame: endFrame, sample_rate: sampleRate, channels }));
ipcMain.handle('soundfont:normalizeDecodedSample', async (_event, sample) => normalizeDecodedSample(sample));
ipcMain.handle('omr:assessProposal', async (_event, proposal) => assessOmrProposal(proposal));
ipcMain.handle('omr:normalizeRunResult', async (_event, result) => normalizeOmrRunResult(result));
ipcMain.handle('omr:runExternalProvider', async (_event, { executable, args, request, timeoutMs } = {}) => runExternalOmrProvider({ executable, args, request, timeoutMs }));
ipcMain.handle('omr:listReviewItems', async (_event, { proposal, status = null } = {}) => { const queue = createOmrReviewQueue(proposal); return { usable: queue.usable, diagnostics: queue.diagnostics, items: queue.list(status) }; });
ipcMain.handle('omr:transitionItem', async (_event, { item, action, correction } = {}) => transitionOmrItem(item, action, correction));
ipcMain.handle('omr:findItemAtPoint', async (_event, { proposal, x, y }) => findOmrItemAtPoint(proposal, x, y));
ipcMain.handle('ai:buildRequest', async (_event, payload) => buildAiRequest(payload));
ipcMain.handle('ai:normalizeResponse', async (_event, { response, expectedContextFingerprint } = {}) => normalizeAiResponse(response, { expectedContextFingerprint }));

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
