/* ===========================================================
   tools/playthrough.js — 真实按键通关走查（无 debug 跳转）
   从标题开始，模拟玩家输入，抓取全过程的场景轨迹与报错。
   用法：
     node tools/playthrough.js            # 简单难度，跑到超时或结局
     node tools/playthrough.js hard 900   # 难度 + 最多多少「秒」
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
const OUT = path.join(__dirname, 'shots', 'play');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

function findBrowser() {
  const c = ['C:/Program Files/Google/Chrome/Application/chrome.exe',
             'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'];
  for (const p of c) if (fs.existsSync(p)) return p;
  return null;
}

const DIFF = process.argv[2] || 'easy';
const MAX_SEC = parseInt(process.argv[3] || '600', 10);

async function main() {
  const exe = findBrowser();
  const browser = await chromium.launch({
    executablePath: exe || undefined,
    args: ['--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required', '--hide-scrollbars']
  });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  page.on('console', m => {
    if (m.type() === 'error') {
      const t = m.text();
      if (!/Failed to load resource|ERR_FILE_NOT_FOUND|favicon/.test(t)) errs.push('CONSOLE: ' + t);
    }
  });

  const url = 'file:///' + ROOT.replace(/\\/g, '/').replace(/^\/+/, '') + '/index.html?debug=1&diff=' + DIFF;
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(400);
  await page.click('#bootBtn').catch(() => {});
  await page.waitForTimeout(1200);

  /* 从标题选「开始新的轮回」 */
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1200);

  const trace = [];
  let lastKey = '';
  let shots = 0;
  let stallTicks = 0;
  let lastFine = '';
  let lastPos = null, blocked = 0, detour = null, detourLeft = 0;
  let firing = false;
  let fast = false;
  const t0 = Date.now();

  /* 每一「tick」= 250ms，读取状态并决定按什么键 */
  while ((Date.now() - t0) / 1000 < MAX_SEC) {
    const st = await page.evaluate(() => {
      const G = window.G;
      const s = G.Sc.name;
      const out = {
        scene: s, beat: G.Story.curBeatId(), loop: G.St.s.loopCount,
        san: Math.round(G.St.s.sanity), decay: G.St.s.tyDecay,
        ch: G.Story.ch, trans: G.Sc.busy(),
        dlgActive: G.Dlg.active, choice: G.Dlg.choiceMode,
        choices: G.Dlg.choiceMode && G.Dlg.choiceList ? G.Dlg.choiceList.map(c => c.id) : null,
        chIdx: G.Dlg.choiceMenu ? G.Dlg.choiceMenu.i : -1
      };
      if (s === 'map') {
        const m = G.Sc.get('map');
        out.region = m.map && m.map.id;
        out.near = m.near ? m.near.obj.id : null;
        out.target = m.target ? m.target.id : null;
        out.talking = m.talking;
        /* 目标世界坐标 */
        if (m.target) {
          const arr = m.target.kind === 'npc' ? m.map.npcs : m.map.zones;
          const t = arr.filter(o => o.id === m.target.id)[0];
          if (t) { out.tx = t.x; out.ty = t.y; out.px = m.player.x; out.py = m.player.y; }
        }
      }
      if (s === 'danmaku') {
        const d = G.Sc.get('danmaku');
        out.over = d.over; out.won = d.won; out.lives = d.player && d.player.lives;
        out.hp = d.player && Math.round(d.player.hp);
        out.bossHp = d.boss ? Math.round(d.boss.hp) : null;
        out.bossX = d.boss ? Math.round(d.boss.x) : null;
        out.ally = !!d.ally;
        out.px = d.player ? Math.round(d.player.x) : 0;
        out.py = d.player ? Math.round(d.player.y) : 0;
        out.bullets = d.eb ? d.eb.active : 0;
        /* 最近的敌人（没有 Boss 时用来对准） */
        out.enX = null;
        if (d.en && d.en.active) {
          let bd = 1e9;
          for (let i = 0; i < d.en.active; i++) {
            const e = d.en.items[i];
            if (e.dead) continue;
            const dd = Math.abs(e.x - d.player.x) + Math.abs(e.y - d.player.y) * .3;
            if (dd < bd) { bd = dd; out.enX = Math.round(e.x); }
          }
        }
        /* 威胁分级：urgent = 必须马上闪；soft = 可以边打边挪 */
        out.dodge = 0; out.urgent = 0;
        if (d.eb && d.player) {
          let bestD = 1e9, dir = 0, ubest = 1e9, udir = 0;
          for (let i = 0; i < d.eb.active; i++) {
            const b = d.eb.items[i];
            const dy = d.player.y - b.y;
            if (dy < -30 || dy > 240) continue;
            const dxx = b.x - d.player.x;
            const ax = Math.abs(dxx);
            if (ax > 90) continue;
            if (dy < bestD) { bestD = dy; dir = dxx > 0 ? -1 : 1; }
            if (dy < 140 && ax < 52 && dy < ubest) { ubest = dy; udir = dxx > 0 ? -1 : 1; }
          }
          out.dodge = dir;
          out.urgent = udir;
        }
      }
      if (s === 'hangar') out.tab = G.Sc.get('hangar').tab;
      if (s === 'ending') { const e = G.Sc.get('ending'); out.endId = e.id; out.phase = e.phase; }
      return out;
    });

    const sig = st.scene + '|' + st.beat;
    /* 细粒度进展签名：血量/命数/区域/目标在动，就不算停滞 */
    const fine = [st.region, st.target, st.near, st.talking, st.over, st.lives,
                  st.bossHp === null || st.bossHp === undefined ? '' : Math.floor(st.bossHp / 40),
                  st.phase, st.tab].join(',');
    if (trace.length === 0 || trace[trace.length - 1].sig !== sig) {
      trace.push({ sig, t: Math.round((Date.now() - t0) / 1000), st });
      if (shots < 40) {
        await page.screenshot({ path: path.join(OUT, String(shots).padStart(2, '0') + '_' + st.scene + '.png') });
        shots++;
      }
      console.log(`[${trace[trace.length - 1].t}s] ${st.scene.padEnd(9)} ${st.beat}` +
                  (st.region ? '  region=' + st.region : '') +
                  (st.target ? '  target=' + st.target : '') +
                  `  loop=${st.loop} san=${st.san}`);
      stallTicks = 0;
    } else {
      if (fine !== lastFine) stallTicks = 0; else stallTicks++;
      if (stallTicks % 40 === 0 && stallTicks > 0) {
        console.log(`    ...停滞 ${stallTicks} tick @ ${st.scene}` +
          (st.px !== undefined ? `  pos=${Math.round(st.px)},${Math.round(st.py)}` : '') +
          (st.tx !== undefined ? ` → ${st.tx},${st.ty}` : '') +
          (st.near !== undefined ? `  near=${st.near}` : '') +
          (st.talking !== undefined ? `  talking=${st.talking}` : '') +
          (st.over !== undefined ? `  over=${st.over} lives=${st.lives} bossHp=${st.bossHp}` : ''));
      }
      if (stallTicks > 1400) { console.log('!!! 卡死超时，中止'); break; }
    }
    lastFine = fine;

    if (st.scene === 'ending' && st.phase === 'card') {
      console.log('\n=== 抵达结局：' + st.endId + ' ===');
      break;
    }

    /* --- 决策 --- */
    if (st.scene === 'map') {
      if (firing) { await releaseAll(page); firing = false; }
      if (st.talking) { await tap(page, 'Enter'); }
      else if (st.near && st.near === st.target) { await tap(page, 'KeyE'); }
      else if (st.tx !== undefined) {
        /* 检测是否被挡住：位置几乎没变就绕行 */
        const moved = lastPos ? Math.hypot(st.px - lastPos.x, st.py - lastPos.y) : 99;
        lastPos = { x: st.px, y: st.py };
        if (moved < 4) blocked++; else blocked = 0;

        const keys = [];
        if (blocked > 2) {
          /* 绕行：沿垂直方向走一段 */
          if (!detour || detourLeft <= 0) {
            detour = Math.random() < .5 ? ['KeyW'] : ['KeyS'];
            if (Math.random() < .5) detour.push(Math.random() < .5 ? 'KeyA' : 'KeyD');
            detourLeft = 8 + Math.floor(Math.random() * 10);
          }
          detourLeft--;
          keys.push(...detour);
        } else {
          detour = null;
          const dx = st.tx - st.px, dy = st.ty - st.py;
          if (dx > 20) keys.push('KeyD'); else if (dx < -20) keys.push('KeyA');
          if (dy > 20) keys.push('KeyS'); else if (dy < -20) keys.push('KeyW');
        }
        if (!keys.length) await tap(page, 'KeyE');
        else {
          for (const k of keys) await page.keyboard.down(k);
          await page.waitForTimeout(200);
          for (const k of keys) await page.keyboard.up(k);
        }
      } else await tap(page, 'Enter');

    } else if (st.scene === 'danmaku') {
      if (st.over) { if (firing) { await releaseAll(page); firing = false; } await tap(page, 'Enter'); }
      else if (st.ally) {
        /* TY 剪影在场：必须停火（否则触发坏结局E） */
        await releaseAll(page); firing = false;
        await page.waitForTimeout(220);
      } else {
        /* 持续射击 + 朝目标横向对准；只有真正贴脸的弹才放弃对准去闪 */
        if (!firing) { await page.keyboard.down('KeyZ'); firing = true; }
        const keys = [];
        if (st.urgent) keys.push(st.urgent > 0 ? 'KeyD' : 'KeyA');
        else {
          const aimX = st.bossX !== null && st.bossX !== undefined ? st.bossX
                     : (st.enX !== null && st.enX !== undefined ? st.enX
                     : 640 + Math.sin(Date.now() / 2600) * 330);
          const dx = aimX - st.px;
          if (dx > 18) keys.push('KeyD'); else if (dx < -18) keys.push('KeyA');
          if (!keys.length && st.dodge) keys.push(st.dodge > 0 ? 'KeyD' : 'KeyA');
        }
        /* 纵向：贴脸时后退，安全时前压提高命中 */
        if (st.urgent && st.py < 620) keys.push('KeyS');
        else if (!st.dodge && st.py > 470) keys.push('KeyW');
        for (const k of keys) await page.keyboard.down(k);
        await page.waitForTimeout(150);
        for (const k of keys) await page.keyboard.up(k);
      }

    } else if (st.scene === 'hangar') {
      if (firing) { await releaseAll(page); firing = false; }
      /* Esc 即离开机库（剧情节拍会自动推进） */
      await tap(page, 'Escape', 400);

    } else if (st.scene === 'cutscene' || st.scene === 'ending') {
      if (firing) { await releaseAll(page); firing = false; }
      /* 按住 Ctrl 快进过场（游戏内置的快进键），否则一周目要跑一小时 */
      if (!fast) { await page.keyboard.down('ControlLeft'); fast = true; }
      await tap(page, 'Enter', 120);

    } else if (st.scene === 'title') {
      await tap(page, 'Enter');
    } else {
      await page.waitForTimeout(200);
    }
    if (fast && st.scene !== 'cutscene' && st.scene !== 'ending') {
      await page.keyboard.up('ControlLeft'); fast = false;
    }
  }

  console.log('\n--- 场景轨迹 ' + trace.length + ' 段 ---');
  if (errs.length) {
    console.log('\n!!! 报错 ' + errs.length + ' 条:');
    [...new Set(errs)].slice(0, 25).forEach(e => console.log('  ' + e));
  } else console.log('\n无报错。');
  await page.screenshot({ path: path.join(OUT, 'final.png') });
  await browser.close();
  process.exit(errs.length ? 1 : 0);
}

async function releaseAll(page) {
  for (const k of ['KeyZ', 'KeyA', 'KeyD', 'KeyW', 'KeyS']) {
    try { await page.keyboard.up(k); } catch (e) {}
  }
}

async function tap(page, key, ms) {
  await page.keyboard.press(key);
  await page.waitForTimeout(ms || 200);
}

main();
