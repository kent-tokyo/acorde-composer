const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const site = path.join(root, '_site');
const required = [
  'playground/index.html',
  'src/playground/index.html',
  'src/playground/playground.js',
  'src/playground/acorde-wasm/acorde_wasm.js',
  'src/playground/acorde-wasm/acorde_wasm_bg.wasm',
];

for (const relativePath of required) {
  if (!fs.existsSync(path.join(root, relativePath))) {
    throw new Error(`Playground build input is missing: ${relativePath}`);
  }
}

fs.rmSync(site, { recursive: true, force: true });
fs.mkdirSync(path.join(site, 'playground'), { recursive: true });
fs.mkdirSync(path.join(site, 'src'), { recursive: true });
fs.cpSync(path.join(root, 'playground'), path.join(site, 'playground'), { recursive: true });
fs.cpSync(path.join(root, 'src/playground'), path.join(site, 'src/playground'), { recursive: true });
fs.writeFileSync(path.join(site, '.nojekyll'), '');
console.log(`Assembled Playground site: ${site}`);
