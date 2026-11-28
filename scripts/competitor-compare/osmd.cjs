// node osmd.cjs <musicxml>...  — OSMD load+render timing in headless Chromium
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const lib = fs.readFileSync(process.env.OSMD_JS || require.resolve('opensheetmusicdisplay/build/opensheetmusicdisplay.min.js'), 'utf8');
(async () => {
  const browser = await chromium.launch();
  for (const file of process.argv.slice(2)) {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    await page.setContent('<div id="osmd" style="width:1200px"></div>');
    await page.addScriptTag({ content: lib });
    const xml = fs.readFileSync(file, 'utf8');
    const res = await page.evaluate(async (xml) => {
      const times = [];
      for (let i = 0; i < 3; i++) {
        const el = document.getElementById('osmd'); el.innerHTML = '';
        const o = new opensheetmusicdisplay.OpenSheetMusicDisplay(el, { autoResize: false, backend: 'svg' });
        const t0 = performance.now(); await o.load(xml); const t1 = performance.now(); o.render(); const t2 = performance.now();
        times.push([t1 - t0, t2 - t1]);
      }
      return { parse: Math.min(...times.map((t) => t[0])), render: Math.min(...times.map((t) => t[1])) };
    }, xml).catch((e) => ({ error: String(e).slice(0, 200) }));
    console.log(JSON.stringify({ file: path.basename(file), osmd_ms: res }));
    await page.close();
  }
  await browser.close();
})();
