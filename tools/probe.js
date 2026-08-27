/* ===========================================================
   tools/probe.js — 一次性状态探针：打开某个 jump，跑一段，dump 表达式
   用法： node tools/probe.js "cut:c4_puppet_beg" 3000 "G.Dlg.actors.map(a=>({id:a.id,alt:a.alt,dim:a.dim,tint:a.tintColor,ta:a.tintAmt,mech:a.mechHalf,col:a.ch.color}))"
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
    } catch (e) {}
  }
  if (process.env.APPDATA) cands.push(path.join(process.env.APPDATA, 'npm/node_modules/playwright'));
  for (const c of cands) { try { ({ chromium } = require(c)); if (chromium) return; } catch (e) {} }
  console.error('找不到 playwright'); process.exit(2);
})();

const ROOT = path.resolve(__dirname, '..');
function findBrowser() {
  const c = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
             'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'];
  for (const p of c) if (fs.existsSync(p)) return p;
  return null;
}

const JUMP = process.argv[2] || '';
const WAIT = parseInt(process.argv[3] || '2500', 10);
const EXPR = process.argv[4] || '1';
/* 第 5 个参数：先按 N 次 Enter 推进对话，再等 WAIT。
   很多要探的状态在 say 之后，不推进就永远到不了。 */
const SPAM = parseInt(process.argv[5] || '0', 10);
const SPAM_MS = parseInt(process.argv[6] || '300', 10);

(async () => {
  const browser = await chromium.launch({
    executablePath: findBrowser() || undefined,
    args: ['--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required', '--hide-scrollbars']
  });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  const url = 'file:///' + ROOT.replace(/\\/g, '/').replace(/^\/+/, '') +
              '/index.html?debug=1' + (JUMP ? '&jump=' + JUMP : '');
  await page.goto(url, { waitUntil: 'load' });
  await page.click('#bootBtn').catch(() => {});
  if (SPAM) {
    await page.waitForTimeout(1200);
    for (let i = 0; i < SPAM; i++) { await page.keyboard.press('Enter'); await page.waitForTimeout(SPAM_MS); }
  }
  await page.waitForTimeout(WAIT);
  const r = await page.evaluate('(function(){try{return JSON.stringify(eval(' + JSON.stringify(EXPR) + '),null,1);}catch(e){return "ERR "+e.message;}})()');
  console.log(r);
  if (errs.length) console.log('\n报错:\n' + [...new Set(errs)].join('\n'));
  await browser.close();
})();
