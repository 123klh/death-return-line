/* ===========================================================
   tools/lab.js — 给 artlab.html 截图，用于快速迭代人物作画
   用法：
     node tools/lab.js                 # 截 tools/shots/lab.png
     node tools/lab.js out=face2       # 换输出名
     node tools/lab.js page=artlab2    # 换页面
   =========================================================== */
const path = require('path');
const fs = require('fs');

let chromium;
(function resolvePw() {
  const cands = ['playwright'];
  const la = process.env.LOCALAPPDATA;
  if (la) {
    const npx = path.join(la, 'npm-cache', '_npx');
    try {
      for (const d of fs.readdirSync(npx)) {
        const p = path.join(npx, d, 'node_modules', 'playwright');
        if (fs.existsSync(p)) cands.push(p);
      }
    } catch (e) { /* ignore */ }
  }
  if (process.env.APPDATA) cands.push(path.join(process.env.APPDATA, 'npm/node_modules/playwright'));
  for (const c of cands) {
    try { ({ chromium } = require(c)); if (chromium) return; } catch (e) { /* next */ }
  }
  console.error('找不到 playwright 模块。试试：npm i -D playwright');
  process.exit(2);
})();

const args = {};
process.argv.slice(2).forEach(a => {
  const i = a.indexOf('=');
  if (i > 0) args[a.slice(0, i)] = a.slice(i + 1);
});
const page_ = args.page || 'artlab';
const out = args.out || 'lab';

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(__dirname, 'shots');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
const url = 'file:///' + ROOT.replace(/\\/g, '/').replace(/^\/+/, '') + '/tools/' + page_ + '.html';

const EXES = [
  process.env.DRL_CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe'
].filter(Boolean);

(async () => {
  const pwArgs = ['--allow-file-access-from-files', '--force-device-scale-factor=1'];
  let browser = null;
  for (const exe of EXES) {
    if (!fs.existsSync(exe)) continue;
    try { browser = await chromium.launch({ executablePath: exe, args: pwArgs }); break; } catch (e) { /* next */ }
  }
  if (!browser) browser = await chromium.launch({ args: pwArgs });

  const pg = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
  const errs = [];
  pg.on('pageerror', e => errs.push('pageerror: ' + e.message));
  pg.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });

  await pg.goto(url, { waitUntil: 'load' });
  await pg.waitForTimeout(500);
  const cv = await pg.$('#cv');
  const file = path.join(OUT, out + '.png');
  if (cv) await cv.screenshot({ path: file });
  else await pg.screenshot({ path: file });
  await browser.close();

  console.log('→ ' + file);
  if (errs.length) { errs.forEach(e => console.log('  ! ' + e)); process.exit(1); }
  else console.log('  no page errors');
})();
