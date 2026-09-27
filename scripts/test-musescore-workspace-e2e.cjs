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

    assert.deepEqual(await page.locator('.sidebar-tabs button').allTextContents(), ['Palettes', 'Instruments', 'Layout', 'Properties']);
    assert.deepEqual(await page.locator('.composer-mode-button').allTextContents(), ['Home', 'Score', 'Publish']);
    assert.equal(await page.locator('.composer-mode-button[data-mode="score"]').getAttribute('aria-selected'), 'true');
    await page.locator('.composer-mode-button[data-mode="home"]').click();
    assert.equal(await page.locator('#composer-home').isVisible(), true);
    await page.locator('.composer-mode-button[data-mode="publish"]').click();
    assert.equal(await page.locator('#composer-publish').isVisible(), true);
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
    await page.keyboard.press('A');
    await page.waitForFunction((count) => document.querySelectorAll('#score [data-acorde-kind="note"]').length > count, initialNoteCount);

    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+Alt+2' : 'Control+Alt+2');
    assert.equal(await page.locator('#voice-select').inputValue(), '1');
    const refreshedMeasure = page.locator('#score .acorde-measure-hit-area').first();
    const refreshedBounds = await refreshedMeasure.boundingBox();
    assert.ok(refreshedBounds, 'rerendered measure must have screen geometry');
    await page.mouse.click(refreshedBounds.x + 48, refreshedBounds.y + 32);
    await page.locator('#score [data-acorde-kind="note"][data-voice="1"]').first().waitFor();
    assert.deepEqual(rendererErrors, [], 'workspace interactions must not raise renderer exceptions');

    assert.ok(await page.locator('#score-document-tabs .score-document-tab').count() >= 2);
    await page.keyboard.press('F6');
    assert.ok(await page.evaluate(() => Boolean(document.activeElement?.closest('.composer-mode-tabs, .musescore-score-actions, .musescore-playback, .editor-toolbar, .sidebar-tabs, #score, .transport'))));
    console.log('MuseScore workspace E2E passed: modes, panels, palettes, docked Mixer, workspace presets, status controls, score tabs, and note entry.');
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
