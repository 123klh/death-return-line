/* ===========================================================
   tools/shots.js — Playwright 真实浏览器截图自验证
   用法：
     node tools/shots.js                 # 跑默认脚本
     node tools/shots.js title map:camp   # 只跑指定项
   输出：tools/shots/*.png  +  控制台打印页面错误
   =========================================================== */
const path = require('path');
const fs = require('fs');

/* playwright 可能只存在于 npx 缓存里，逐个候选路径尝试 */
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

const ROOT = path.resolve(__dirname, '..');

/* 命令行开关：
     --out=DIR    输出目录（默认 tools/shots）
     --jpg[=Q]    存成 jpeg 并指定质量（文档配图用，体积小一个数量级）
     --nodebug    去掉 debug=1，不画左上角的调试 HUD（文档配图用） */
const FLAGS = {};
const ARGS = [];
process.argv.slice(2).forEach(function (a) {
  var m = /^--([a-z]+)(?:=(.*))?$/.exec(a);
  if (m) FLAGS[m[1]] = m[2] === undefined ? true : m[2];
  else ARGS.push(a);
});
const OUT = FLAGS.out ? path.resolve(ROOT, FLAGS.out) : path.join(__dirname, 'shots');
const JPG = FLAGS.jpg !== undefined;
const JPGQ = JPG && FLAGS.jpg !== true ? parseInt(FLAGS.jpg, 10) : 88;
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const fileUrl = (q) => {
  if (FLAGS.nodebug && q) q = q.replace(/debug=1/g, 'debug=0');
  return 'file:///' + ROOT.replace(/\\/g, '/').replace(/^\/+/, '') + '/index.html' + (q ? '?' + q : '');
};

/* 截图任务表：name → {q: query string, steps:[{key|wait|click|eval}]} */
const TASKS = {
  title:      { q: '', steps: [{ wait: 2200 }] },
  titleDiff:  { q: '', steps: [{ wait: 1400 }, { key: 'ArrowDown' }, { key: 'Enter' }, { wait: 700 }] },
  gallery:    { q: '', steps: [{ wait: 1400 }, { key: 'ArrowDown' }, { key: 'ArrowDown' }, { key: 'ArrowDown' }, { key: 'Enter' }, { wait: 700 }] },
  codex:      { q: '', steps: [{ wait: 1400 }, { key: 'ArrowDown' }, { key: 'ArrowDown' }, { key: 'ArrowDown' }, { key: 'ArrowDown' }, { key: 'Enter' }, { wait: 700 }] },
  settings:   { q: '', steps: [{ wait: 1400 }, { key: 'ArrowDown' }, { key: 'ArrowDown' }, { key: 'Enter' }, { wait: 700 }] },

  /* 序章：连点推进对话 */
  prologue:   { q: 'debug=1&jump=ch:0', steps: [{ wait: 3000 }, { spam: 26, ms: 260 }] },

  /* 地图 */
  map_camp:    { q: 'debug=1&jump=map:camp', steps: [{ wait: 2600 }] },
  map_ruins:   { q: 'debug=1&jump=map:ruins', steps: [{ wait: 2600 }] },
  map_storm:   { q: 'debug=1&jump=map:storm', steps: [{ wait: 2600 }] },
  map_factory: { q: 'debug=1&jump=map:factory', steps: [{ wait: 2600 }] },
  map_shrine:  { q: 'debug=1&jump=map:shrine', steps: [{ wait: 2600 }] },
  map_core:    { q: 'debug=1&jump=map:core', steps: [{ wait: 2600 }] },
  map_walk:    { q: 'debug=1&jump=map:camp', steps: [{ wait: 1600 }, { keyHold: 'KeyA', ms: 900 }, { keyHold: 'KeyW', ms: 700 }, { wait: 400 }] },

  /* 战斗 */
  boss1:  { q: 'debug=1&jump=boss:boss1', steps: [{ wait: 5000 }] },
  boss2:  { q: 'debug=1&jump=boss:boss2&diff=hard', steps: [{ wait: 6000 }] },
  boss3:  { q: 'debug=1&jump=boss:boss3', steps: [{ wait: 6500 }] },
  boss4:  { q: 'debug=1&jump=boss:boss4', steps: [{ wait: 5000 }] },
  boss5:  { q: 'debug=1&jump=boss:boss5', steps: [{ wait: 5000 }] },
  boss6:  { q: 'debug=1&jump=boss:boss6&diff=hard', steps: [{ wait: 6000 }] },
  boss6if:{ q: 'debug=1&jump=boss:boss6_if', steps: [{ wait: 5000 }] },
  stage:  { q: 'debug=1&jump=stage:ruins', steps: [{ wait: 6000 }] },
  stageHard: { q: 'debug=1&jump=stage:factory&diff=hard', steps: [{ wait: 8000 }] },


  /* 小怪试验场：逐个核对 12 种 */
  en_bee: { q: 'debug=1&jump=enemy:bee', steps: [{ wait: 6500 }] },
  en_sniper: { q: 'debug=1&jump=enemy:sniper', steps: [{ wait: 6500 }] },
  en_splitter: { q: 'debug=1&jump=enemy:splitter', steps: [{ wait: 6500 }] },
  en_chaser: { q: 'debug=1&jump=enemy:chaser', steps: [{ wait: 6500 }] },
  en_blocker: { q: 'debug=1&jump=enemy:blocker', steps: [{ wait: 6500 }] },
  en_phantom: { q: 'debug=1&jump=enemy:phantom', steps: [{ wait: 6500 }] },
  en_parasite: { q: 'debug=1&jump=enemy:parasite', steps: [{ wait: 6500 }] },
  en_summoner: { q: 'debug=1&jump=enemy:summoner', steps: [{ wait: 6500 }] },
  en_bouncer: { q: 'debug=1&jump=enemy:bouncer', steps: [{ wait: 6500 }] },
  en_laserbee: { q: 'debug=1&jump=enemy:laserbee', steps: [{ wait: 6500 }] },
  en_shielder: { q: 'debug=1&jump=enemy:shielder', steps: [{ wait: 6500 }] },
  en_swarm: { q: 'debug=1&jump=enemy:swarm', steps: [{ wait: 6500 }] },

  /* 系统 */
  hangar: { q: 'debug=1&jump=hangar', steps: [{ wait: 2200 }] },
  hangarLog: { q: 'debug=1&jump=hangar', steps: [{ wait: 1400 }, { key: 'Tab' }, { wait: 600 }] },
  hangarCodex: { q: 'debug=1&jump=hangar', steps: [{ wait: 1400 }, { key: 'Tab' }, { key: 'Tab' }, { wait: 600 }] },
  ret:    { q: 'debug=1&jump=ret', steps: [{ wait: 4200 }] },
  ret2:   { q: 'debug=1&jump=ret', steps: [{ wait: 6200 }] },

  /* 关键过场 */
  cut_oldman: { q: 'debug=1&jump=cut:p_oldman_death', steps: [{ wait: 2000 }, { spam: 14, ms: 320 }] },
  cut_revive: { q: 'debug=1&jump=cut:c1_revive_ty', steps: [{ wait: 2000 }, { spam: 12, ms: 340 }] },
  cut_tear:   { q: 'debug=1&jump=cut:c4_tear_shot', steps: [{ wait: 9000 }] },
  cut_upright:{ q: 'debug=1&jump=cut:c2_upright_death', steps: [{ wait: 3000 }, { spam: 8, ms: 320 }] },
  cut_upright2:{ q: 'debug=1&jump=cut:c2_upright_death', steps: [{ wait: 9500 }] },
  cut_boss6:  { q: 'debug=1&jump=cut:c6_boss6_pre', steps: [{ wait: 2400 }, { spam: 10, ms: 340 }] },
  cut_madturn:{ q: 'debug=1&jump=cut:c6_madman_turn', steps: [{ wait: 2400 }, { spam: 12, ms: 320 }] },
  cut_lucky:  { q: 'debug=1&jump=cut:c6_lucky_death', steps: [{ wait: 3000 }, { spam: 10, ms: 340 }] },
  cut_lucky2: { q: 'debug=1&jump=cut:c6_lucky_death', steps: [{ wait: 3000 }, { spam: 10, ms: 340 }, { wait: 5200 }] },
  cut_lucky3: { q: 'debug=1&jump=cut:c6_lucky_death', steps: [{ wait: 3000 }, { spam: 10, ms: 340 }, { wait: 26000 }] },

  /* 结局 */
  end_good: { q: 'debug=1&jump=end:good', steps: [{ wait: 3000 }, { spam: 16, ms: 380 }] },
  end_good2:{ q: 'debug=1&jump=end:good', steps: [{ wait: 3000 }, { spam: 40, ms: 300 }] },
  end_good3:{ q: 'debug=1&jump=end:good', steps: [{ wait: 3000 }, { spam: 70, ms: 260 }] },
  end_A:    { q: 'debug=1&jump=end:badA', steps: [{ wait: 3000 }, { spam: 14, ms: 360 }] },
  end_card: { q: 'debug=1&jump=end:good', steps: [{ wait: 2000 }, { spam: 200, ms: 90 }, { wait: 2600 }] },
  end_B:    { q: 'debug=1&jump=end:badB', steps: [{ wait: 3000 }, { spam: 14, ms: 360 }] },
  end_B2:   { q: 'debug=1&jump=end:badB', steps: [{ wait: 6400 }, { spam: 3, ms: 700 }] },
  end_C:    { q: 'debug=1&jump=end:badC', steps: [{ wait: 3000 }, { spam: 14, ms: 360 }] },
  end_D:    { q: 'debug=1&jump=end:badD', steps: [{ wait: 3000 }, { spam: 14, ms: 360 }] },
  end_E:    { q: 'debug=1&jump=end:badE', steps: [{ wait: 3000 }, { spam: 14, ms: 360 }] },
  end_if:   { q: 'debug=1&jump=end:if', steps: [{ wait: 3000 }, { spam: 18, ms: 360 }] },
  end_if2:  { q: 'debug=1&jump=end:if', steps: [{ wait: 3000 }, { spam: 46, ms: 300 }] },
  cut_reveal: { q: 'debug=1&jump=cut:c5_friend_reveal', steps: [{ wait: 2400 }, { spam: 16, ms: 320 }] },
  cut_puppet: { q: 'debug=1&jump=cut:c4_puppet_beg', steps: [{ wait: 2400 }, { spam: 16, ms: 320 }] },
  cut_hide:   { q: 'debug=1&jump=cut:c3_hero_fear', steps: [{ wait: 2400 }, { spam: 12, ms: 320 }] },

  /* 暂停菜单 */
  pause:      { q: 'debug=1&jump=map:camp', steps: [{ wait: 2000 }, { key: 'Escape' }, { wait: 700 }] },
  pauseSet:   { q: 'debug=1&jump=map:camp', steps: [{ wait: 2000 }, { key: 'Escape' }, { wait: 400 },
                { key: 'ArrowDown' }, { key: 'ArrowDown' }, { key: 'Enter' }, { wait: 600 }] },
  pauseLog:   { q: 'debug=1&jump=cut:c1_madman', steps: [{ wait: 2000 }, { spam: 10, ms: 300 },
                { key: 'Escape' }, { wait: 400 }, { key: 'ArrowDown' }, { key: 'Enter' }, { wait: 600 }] }
};

/* 优先使用系统安装的 Chrome/Edge，避免 playwright 自带 chromium 版本不匹配 */
function findBrowser() {
  const cands = [
    process.env.DRL_CHROME,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe'
  ].filter(Boolean);
  for (const c of cands) if (fs.existsSync(c)) return c;
  return null;
}

async function launch() {
  const args = ['--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required',
                '--disable-lcd-text', '--force-color-profile=srgb', '--hide-scrollbars'];
  const exe = findBrowser();
  if (exe) {
    try { return await chromium.launch({ executablePath: exe, args }); }
    catch (e) { console.warn('系统浏览器启动失败，回退到自带 chromium：' + e.message); }
  }
  return await chromium.launch({ args });
}

async function main() {
  const want = ARGS;
  const names = want.length ? want : Object.keys(TASKS);

  const browser = await launch();
  let failed = 0;

  for (const name of names) {
    const task = TASKS[name] || { q: name.includes('=') ? name : '', steps: [{ wait: 2500 }] };
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push('PAGEERROR: ' + e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') {
        const t = m.text();
        if (!/Failed to load resource|net::ERR_FILE_NOT_FOUND|favicon/.test(t)) errs.push('CONSOLE: ' + t);
      }
    });

    try {
      await page.goto(fileUrl(task.q), { waitUntil: 'load' });
      await page.waitForTimeout(300);
      /* 点击启动按钮（Web Audio 手势） */
      await page.click('#bootBtn').catch(() => {});
      for (const s of task.steps || []) {
        if (s.wait) await page.waitForTimeout(s.wait);
        if (s.key) { await page.keyboard.press(s.key); await page.waitForTimeout(260); }
        if (s.keyHold) { await page.keyboard.down(s.keyHold); await page.waitForTimeout(s.ms || 500); await page.keyboard.up(s.keyHold); }
        /* spam：连续按确认键推进对话 */
        if (s.spam) {
          for (let i = 0; i < s.spam; i++) {
            await page.keyboard.press('Enter');
            await page.waitForTimeout(s.ms || 300);
          }
        }
        if (s.click) await page.mouse.click(s.click[0], s.click[1]);
        if (s.eval) await page.evaluate(s.eval);
      }
      const ext = JPG ? '.jpg' : '.png';
      const file = path.join(OUT, name.replace(/[^a-zA-Z0-9_.-]/g, '_') + ext);
      await page.screenshot(JPG ? { path: file, type: 'jpeg', quality: JPGQ } : { path: file });
      const status = errs.length ? 'ERRORS' : 'ok';
      console.log(`[${status}] ${name} -> ${path.relative(ROOT, file)}`);
      if (errs.length) {
        failed++;
        errs.slice(0, 12).forEach((e) => console.log('    ' + e));
      }
    } catch (e) {
      failed++;
      console.log(`[FAIL] ${name}: ${e.message}`);
    }
    await ctx.close();
  }

  await browser.close();
  console.log(failed ? `\n${failed} 项有问题` : '\n全部通过');
  process.exit(failed ? 1 : 0);
}

main();
