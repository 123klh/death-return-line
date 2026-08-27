/* 功能回归：护盾后炸弹是否可用 / 护盾兵是否可击破 / 结算是否还能被打死 */
const path = require('path'), fs = require('fs');
let chromium;
(function () {
  const c = ['playwright'], la = process.env.LOCALAPPDATA;
  if (la) { const n = path.join(la, 'npm-cache', '_npx');
    try { for (const d of fs.readdirSync(n)) { const q = path.join(n, d, 'node_modules', 'playwright'); if (fs.existsSync(q)) c.push(q); } } catch (e) {} }
  if (process.env.APPDATA) c.push(path.join(process.env.APPDATA, 'npm/node_modules/playwright'));
  for (const x of c) { try { ({ chromium } = require(x)); if (chromium) return; } catch (e) {} }
  process.exit(2);
})();
const ROOT = path.resolve(__dirname, '..');
function fb() {
  for (const q of ['C:/Program Files/Google/Chrome/Application/chrome.exe',
                   'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe']) if (fs.existsSync(q)) return q;
  return null;
}
const url = j => 'file:///' + ROOT.replace(/\\/g, '/').replace(/^\/+/, '') + '/index.html?debug=1&jump=' + j;

(async () => {
  const b = await chromium.launch({ executablePath: fb() || undefined,
    args: ['--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required', '--hide-scrollbars'] });
  const errs = [];
  let pass = 0, fail = 0;
  function chk(name, ok, detail) {
    if (ok) { pass++; console.log('  \u2713 ' + name + (detail ? '   ' + detail : '')); }
    else { fail++; console.log('  \u2717 ' + name + '   ' + detail); }
  }

  /* --- 1. 护盾冷却中炸弹仍可用 --- */
  {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(e.message));
    await p.goto(url('boss:boss1&diff=normal'));
    await p.click('#bootBtn').catch(() => {});
    await p.waitForTimeout(3200);
    await p.keyboard.press('KeyC');            // 开护盾 → shieldCd = 12000
    await p.waitForTimeout(300);
    const before = await p.evaluate(() => ({ b: G.Sc.cur.player.bombs, cd: Math.round(G.Sc.cur.player.shieldCd) }));
    await p.keyboard.press('KeyX');            // 投弹
    await p.waitForTimeout(400);
    const after = await p.evaluate(() => ({ b: G.Sc.cur.player.bombs, cd: Math.round(G.Sc.cur.player.shieldCd) }));
    chk('护盾冷却中炸弹可用', before.cd > 0 && after.b === before.b - 1,
        'shieldCd=' + before.cd + '  bombs ' + before.b + '\u2192' + after.b);
    await ctx.close();
  }

  /* --- 2. 护盾兵可被枪械击破 --- */
  {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(e.message));
    await p.goto(url('enemy:shielder&diff=normal'));
    await p.click('#bootBtn').catch(() => {});
    await p.waitForTimeout(2600);
    await p.keyboard.down('KeyZ');
    let broke = false, killed = false;
    for (let i = 0; i < 60 && !killed; i++) {
      await p.waitForTimeout(500);
      const st = await p.evaluate(() => {
        const s = G.Sc.cur; let down = 0, n = 0, kills = s.kills;
        for (let i = 0; i < s.en.active; i++) { const e = s.en.items[i];
          if (e.def && e.def.id === 'shielder') { n++; if (e.shieldDown) down++; } }
        return { n: n, down: down, kills: kills };
      });
      if (st.down > 0) broke = true;
      if (st.kills > 0) killed = true;
    }
    await p.keyboard.up('KeyZ').catch(() => {});
    chk('护盾兵护盾可击破', broke, broke ? '' : '60 秒射击后 shieldDown 仍为 false');
    chk('护盾兵可被击杀', killed, killed ? '' : 'kills 仍为 0');
    await ctx.close();
  }

  /* --- 3. 存档 / 继续往返 --- */
  {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(e.message));
    await p.goto(url('ch:3'));
    await p.click('#bootBtn').catch(() => {});
    await p.waitForTimeout(3500);
    const r = await p.evaluate(() => {
      const run = G.Save.loadRun();
      if (!run) return { ok: false };
      const snap = { ch: run.ch, beat: run.beat, up: run.st.flags.uprightAlive, pts: run.st.intelPoints };
      G.St.s.intelPoints = 99999;              // 弄脏当前状态
      G.Story.continueRun();                   // 从盘上恢复
      return { ok: true, snap: snap, restoredPts: G.St.s.intelPoints, ch: G.Story.ch, up: G.St.s.flags.uprightAlive };
    });
    chk('存档点落盘并可恢复', r.ok && r.restoredPts === r.snap.pts && r.ch === r.snap.ch,
        r.ok ? ('ch=' + r.ch + ' 情报点 ' + r.restoredPts) : '没有写入 run');
    chk('章节选择不再掐死 IF 线', r.ok && r.up === true, 'uprightAlive=' + (r.ok ? r.up : '?'));
    await ctx.close();
  }

  /* --- 4. 血条刻度用真实阈值 --- */
  {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
    const p = await ctx.newPage();
    await p.goto(url('boss:boss2'));
    await p.click('#bootBtn').catch(() => {});
    await p.waitForTimeout(3000);
    const m = await p.evaluate(() => G.Bosses.boss2.phases.map(x => x.hpFrom));
    chk('boss2 真实转阶段阈值', JSON.stringify(m) === '[1,0.62,0.26]', JSON.stringify(m));
    await ctx.close();
  }

  /* --- 5. 顿帧存在且会自行归零 --- */
  {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
    const p = await ctx.newPage();
    await p.goto(url('boss:boss1'));
    await p.click('#bootBtn').catch(() => {});
    await p.waitForTimeout(2500);
    const hs = await p.evaluate(async () => {
      G.Game.hitstop(150);
      const during = G.Game.hitstopT;
      await new Promise(r => setTimeout(r, 500));
      return { during: during, after: G.Game.hitstopT };
    });
    chk('顿帧生效且自动恢复', hs.during > 0 && hs.after <= 0, 'during=' + Math.round(hs.during) + ' after=' + Math.round(hs.after));
    await ctx.close();
  }

  console.log('\n' + (fail === 0 ? '全部通过' : fail + ' 项失败') + '   (' + pass + '/' + (pass + fail) + ')');
  if (errs.length) console.log('\n运行时报错:\n' + [...new Set(errs)].slice(0, 8).join('\n'));
  await b.close();
  process.exit(fail === 0 ? 0 : 1);
})();
