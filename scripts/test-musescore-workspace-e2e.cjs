const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { _electron: electron } = require('playwright');

const root = path.resolve(__dirname, '..');
const engineName = process.platform === 'win32' ? 'acorde-composer-engine.exe' : 'acorde-composer-engine';
const enginePath = path.join(root, 'engine', 'target', 'debug', engineName);

async function run() {
  const userDataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'acorde-composer-workspace-'));
  let application;
  try {
    await fs.access(enginePath);
    application = await electron.launch({
      args: [root, `--user-data-dir=${userDataDir}`],
      env: { ...process.env, ACORDE_ENGINE_BIN: enginePath, ELECTRON_DISABLE_SECURITY_WARNINGS: 'true' },
    });
    const page = await application.firstWindow();
    const rendererErrors = [];
    page.on('pageerror', (error) => rendererErrors.push(error.message));
    await page.waitForLoadState('domcontentloaded');
    try {
      await page.waitForSelector('.sidebar-tabs');
    } catch (error) {
      const body = (await page.locator('body').innerText().catch(() => '')).slice(0, 1200);
      throw new Error(`Workspace did not load at ${page.url()}. Renderer errors: ${rendererErrors.join(' | ') || 'none'}. Body: ${body}`, { cause: error });
    }

    assert.deepEqual(await page.locator('.sidebar-tabs button').allTextContents(), ['Palettes', 'Instruments', 'Properties']);
    assert.deepEqual(await page.locator('.note-input-group').evaluateAll((groups) => groups.map((group) => group.dataset.group)), ['input', 'duration', 'accidentals', 'lines', 'articulations', 'rhythm', 'voices']);
    assert.equal(await page.locator('#duration-buttons .duration-button').count(), 7);
    assert.equal(await page.locator('#recovery').isVisible(), false, 'a fresh profile has no recovered draft notice');
    assert.equal(await page.locator('#diagnostics').isVisible(), false, 'empty diagnostics stay hidden');
    assert.equal(await page.locator('#score-meta').isVisible(), false, 'score summary lives in the score tab row');
    assert.match(await page.locator('#score-tab-summary #project-title').innerText(), /\S/);
    assert.equal(await page.locator('#navigator-panel').isVisible(), false, 'Navigator is off by default, as in MuseScore 4');
    await page.evaluate(() => dispatchApplicationMenuCommand('view:navigator'));
    assert.equal(await page.locator('#navigator-panel').isVisible(), true);
    await page.evaluate(() => dispatchApplicationMenuCommand('view:navigator'));
    assert.equal(await page.locator('#navigator-panel').isVisible(), false, 'View > Navigator can hide the panel again');
    await page.evaluate(() => dispatchApplicationMenuCommand('view:playback-toolbar'));
    assert.equal(await page.locator('.musescore-playback').isVisible(), false, 'View > Playback toolbar hides the toolbar');
    await page.evaluate(() => dispatchApplicationMenuCommand('view:playback-toolbar'));
    assert.equal(await page.locator('#duration-select').isVisible(), false, 'legacy duration select stays a hidden command source');
    assert.equal(await page.locator('.editor-toolbar .dot-toggle').count(), 0, 'no orphan Dot label remains in the toolbar');
    const firstToolBounds = await page.locator('#note-tool').boundingBox();
    const lastToolBounds = await page.locator('#configure-toolbar-button').boundingBox();
    assert.ok(firstToolBounds && lastToolBounds && Math.abs(firstToolBounds.y - lastToolBounds.y) < 8, 'note input toolbar must fit on one row');
    assert.equal(await page.locator('#select-tool').isVisible(), false, 'MuseScore has no Select button; Esc leaves note input');
    assert.equal(await page.locator('.topbar .musescore-history #undo-button').count(), 1, 'undo/redo sit in the top bar');
    assert.deepEqual(await page.locator('.voice-button').evaluateAll((buttons) => buttons.map((button) => button.getClientRects().length > 0)), [true, true, false, false], 'voices 3–4 are opt-in');
    assert.equal(await page.locator('.right-panel').isVisible(), false);
    assert.deepEqual(await page.locator('.composer-mode-button').allTextContents(), ['Home', 'Score', 'Publish']);
    assert.equal(await page.locator('.composer-mode-button[data-mode="score"]').getAttribute('aria-selected'), 'true');
    await page.locator('.composer-mode-button[data-mode="home"]').click();
    assert.equal(await page.locator('#composer-home').isVisible(), true);
    await page.locator('#home-recent-list').waitFor();
    await page.locator('.composer-mode-button[data-mode="publish"]').click();
    assert.equal(await page.locator('#composer-publish').isVisible(), true);
    assert.equal(await page.locator('.workspace').isVisible(), false);
    await page.locator('.composer-mode-button[data-mode="score"]').click();
    assert.equal(await page.locator('#sidebar-palettes-tab').getAttribute('aria-selected'), 'true');
    assert.ok(await page.locator('.palette-section').count() >= 10);

    await page.locator('#sidebar-instruments-tab').click();
    assert.equal(await page.locator('#sidebar-instruments-tab').getAttribute('aria-selected'), 'true');
    assert.equal(await page.locator('#sidebar-instruments').isVisible(), true);

    await page.locator('#sidebar-properties-tab').click();
    assert.equal(await page.locator('#properties-panel').isVisible(), true);
    assert.equal(await page.locator('#selection-properties-editor select, #selection-properties-editor input').count(), 6);

    await page.keyboard.press('F9');
    assert.equal(await page.locator('#sidebar-palettes-tab').getAttribute('aria-selected'), 'true');
    await page.keyboard.press('F9');
    assert.equal(await page.locator('.left-rail').isVisible(), false);
    await page.keyboard.press('F9');
    assert.equal(await page.locator('.left-rail').isVisible(), true);

    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+F9' : 'Control+F9');
    assert.equal(await page.locator('#palette-search').isVisible(), true);
    await page.keyboard.press('Shift+F9');
    assert.equal(await page.locator('#master-palette-dialog').getAttribute('open'), '');
    await page.keyboard.press('Escape');
    await page.keyboard.press('F10');
    assert.equal(await page.locator('#mixer-settings').getAttribute('open'), '');
    assert.equal(await page.locator('#mixer-settings').evaluate((element) => element.parentElement?.classList.contains('workspace')), true);
    await page.locator('#mixer-close').click();
    await page.locator('.document-title').click();
    await page.keyboard.press('p');
    assert.equal(await page.locator('#piano-panel').isVisible(), true);
    await page.locator('#piano-panel .utility-dock-toggle').click();
    assert.equal(await page.locator('#piano-panel').evaluate((element) => element.classList.contains('floating')), true);
    await page.locator('#piano-panel .utility-dock-toggle').click();
    await page.keyboard.press('p');
    assert.equal(await page.locator('#piano-panel').isVisible(), false);
    await page.locator('#workspace-select').selectOption('review');
    assert.equal(await page.locator('#timeline-panel').isVisible(), true);
    assert.equal(await page.locator('#sidebar-properties-tab').getAttribute('aria-selected'), 'true');
    await page.locator('#workspace-select').selectOption('default');

    await page.locator('#new-button').evaluate((button) => button.click());
    const measure = page.locator('#score .acorde-measure-hit-area').first();
    await measure.waitFor();
    await page.keyboard.press('N');
    assert.equal(await page.locator('#note-tool').getAttribute('aria-pressed'), 'true');
    const measureBounds = await measure.boundingBox();
    assert.ok(measureBounds, 'measure hit area must have screen geometry');
    await page.mouse.click(measureBounds.x + 24, measureBounds.y + 24);
    const notes = page.locator('#score [data-acorde-kind="note"]');
    await notes.first().waitFor();
    const initialNoteCount = await notes.count();
    await notes.first().click();
    await page.locator('#sidebar-properties-tab').click();
    await assert.doesNotReject(async () => {
      await page.locator('#selection-properties-summary').waitFor({ state: 'visible' });
      assert.doesNotMatch(await page.locator('#selection-properties-summary').innerText(), /^Select /);
    });

    await page.keyboard.press('5');
    assert.equal(await page.locator('#duration-select').inputValue(), 'quarter');
    assert.equal(await page.locator('#duration-quarter').getAttribute('aria-pressed'), 'true');
    await page.locator('#duration-eighth').click();
    assert.equal(await page.locator('#duration-select').inputValue(), 'eighth');
    assert.equal(await page.locator('#duration-eighth').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('#duration-quarter').getAttribute('aria-pressed'), 'false');
    await page.locator('#dot-button').click();
    assert.equal(await page.locator('#dot-button').getAttribute('aria-pressed'), 'true');
    await page.locator('#dot-button').click();
    await page.locator('#duration-quarter').click();
    assert.equal(await page.locator('#duration-select').inputValue(), 'quarter');
    await notes.first().click();
    await page.locator('#tuplet-button').click();
    await page.waitForFunction(() => document.getElementById('tuplet-button')?.getAttribute('aria-pressed') === 'true');
    await notes.first().click();
    await page.locator('#tuplet-button').click();
    await page.waitForFunction(() => document.getElementById('tuplet-button')?.getAttribute('aria-pressed') === 'false');
    await page.keyboard.press('Escape');
    await page.evaluate(() => { selectedAddress = null; });
    await page.locator('#tuplet-button').click();
    assert.equal(await page.locator('#tuplet-select').inputValue(), '3:2', 'without a selection the triplet button arms triplet input');
    await page.locator('#tuplet-button').click();
    assert.equal(await page.locator('#tuplet-select').inputValue(), '', 'and a second click disarms it');
    assert.equal(await page.locator('#tuplet-button').getAttribute('aria-pressed'), 'false');
    await notes.first().click();
    await page.keyboard.press('N');
    await page.keyboard.press('A');
    await page.waitForFunction((count) => document.querySelectorAll('#score [data-acorde-kind="note"]').length > count, initialNoteCount);

    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+Alt+2' : 'Control+Alt+2');
    assert.equal(await page.locator('#voice-select').inputValue(), '1');
    assert.equal(await page.locator('.voice-button[data-voice="1"]').getAttribute('aria-pressed'), 'true');
    const refreshedMeasure = page.locator('#score .acorde-measure-hit-area').first();
    const refreshedBounds = await refreshedMeasure.boundingBox();
    assert.ok(refreshedBounds, 'rerendered measure must have screen geometry');
    await page.mouse.click(refreshedBounds.x + 48, refreshedBounds.y + 32);
    await page.locator('#score [data-acorde-kind="note"][data-voice="1"]').first().waitFor();
    assert.deepEqual(rendererErrors, [], 'workspace interactions must not raise renderer exceptions');

    assert.ok(await page.locator('#score-document-tabs .score-document-tab').count() >= 2);
    await page.keyboard.press('F6');
    assert.ok(await page.evaluate(() => Boolean(document.activeElement?.closest('.composer-mode-tabs, .musescore-score-actions, .musescore-playback, .editor-toolbar, .sidebar-tabs, #score, .transport'))));
    console.log('MuseScore workspace E2E passed: modes, panels, palettes, docked Mixer, workspace presets, status controls, score tabs, icon note-input toolbar, and note entry.');
  } finally {
    if (application) {
      const closed = application.waitForEvent('close', { timeout: 5000 }).catch(() => {});
      await application.evaluate(({ app }) => app.exit(0)).catch(() => application.close());
      await closed;
    }
    await fs.rm(userDataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
