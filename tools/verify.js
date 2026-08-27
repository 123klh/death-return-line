/* ===========================================================
   tools/verify.js — 剧情图 / 资源引用 / 结局条件 完整性校验
   在真实浏览器里加载游戏，然后对内部数据做断言。
   用法：node tools/verify.js
   =========================================================== */
const path = require('path');
const fs = require('fs');

let chromium;
(function () {
  const cands = ['playwright'];
  const la = process.env.LOCALAPPDATA;
  if (la) {
    const npx = path.join(la, 'npm-cache', '_npx');
    try { for (const d of fs.readdirSync(npx)) {
      const p = path.join(npx, d, 'node_modules', 'playwright');
      if (fs.existsSync(p)) cands.push(p);
    } } catch (e) {}
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

async function main() {
  const browser = await chromium.launch({
    executablePath: findBrowser() || undefined,
    args: ['--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required']
  });
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text()); });

  await page.goto('file:///' + ROOT.replace(/\\/g, '/').replace(/^\/+/, '') + '/index.html?debug=1',
                  { waitUntil: 'load' });
  await page.waitForTimeout(500);
  await page.click('#bootBtn').catch(() => {});
  await page.waitForTimeout(800);

  const rep = await page.evaluate(() => {
    const G = window.G;
    const fail = [];
    const info = {};
    const push = (m) => fail.push(m);

    /* ---- 1. 剧情图：每个 beat 引用的资源都必须存在 ---- */
    let beats = 0, cuts = 0, battles = 0, maps = 0;
    G.Story.chapters.forEach((ch, ci) => {
      const bids = ch.beats.filter(b => b.bid).map(b => b.bid);
      ch.beats.forEach((b, bi) => {
        beats++;
        const at = `ch${ci}[${bi}] ${b.k}`;
        if (b.k === 'cut') {
          cuts++;
          if (!G.Cutscenes[b.id]) push(`${at}: 缺少过场 "${b.id}"`);
        } else if (b.k === 'battle') {
          battles++;
          if (b.kind === 'boss' && !G.Bosses[b.id]) push(`${at}: 缺少 Boss "${b.id}"`);
          if (b.field && !G.Art.DEFS[b.field]) push(`${at}: 缺少战场 "${b.field}"`);
          if (b.bgm && !G.Aud.THEMES[b.bgm]) push(`${at}: 缺少 BGM "${b.bgm}"`);
        } else if (b.k === 'map') {
          maps++;
          const m = G.Maps[b.region];
          if (!m) { push(`${at}: 缺少区域 "${b.region}"`); return; }
          if (b.target) {
            const arr = b.target.kind === 'npc' ? m.npcs : m.zones;
            if (!arr.some(o => o.id === b.target.id))
              push(`${at}: 区域 ${b.region} 里没有目标 ${b.target.kind}:${b.target.id}`);
          }
        } else if (b.k === 'branch') {
          const outs = Object.values(b.map || {});
          outs.forEach(o => {
            if (bids.indexOf(o) < 0) push(`${at}: branch 目标 bid "${o}" 在本章不存在`);
          });
        } else if (b.k === 'ending') {
          if (!G.Endings[b.id]) push(`${at}: 缺少结局 "${b.id}"`);
        }
      });
    });
    info.beats = beats; info.cuts = cuts; info.battles = battles; info.mapBeats = maps;

    /* ---- 2. 地图：NPC/可读物引用的对话必须存在；角色必须存在 ---- */
    let npcN = 0, zoneN = 0;
    Object.keys(G.Maps).forEach(rid => {
      const m = G.Maps[rid];
      m.npcs.forEach(n => {
        npcN++;
        if (!G.Chars[n.char]) push(`地图 ${rid}: NPC ${n.id} 的角色 "${n.char}" 不存在`);
        if (!G.Talk.data[n.talk]) push(`地图 ${rid}: NPC ${n.id} 的对话 "${n.talk}" 不存在`);
      });
      m.zones.forEach(z => {
        zoneN++;
        if (z.kind === 'read' && !G.Talk.data[z.read]) push(`地图 ${rid}: 可读物 ${z.id} 的文本 "${z.read}" 不存在`);
        if (z.kind === 'exit' && !G.Maps[z.to]) push(`地图 ${rid}: 出口 ${z.id} 指向不存在的区域 "${z.to}"`);
      });
      if (!G.Art.DEFS[m.bg]) push(`地图 ${rid}: 缺少背景 "${m.bg}"`);
      if (m.music && !G.Aud.THEMES[m.music]) push(`地图 ${rid}: 缺少 BGM "${m.music}"`);
      /* 出口互通性 */
      m.zones.filter(z => z.kind === 'exit').forEach(z => {
        const t = G.Maps[z.to];
        if (t && !t.zones.some(z2 => z2.kind === 'exit' && z2.to === rid))
          push(`地图 ${rid} → ${z.to} 是单向的（回不去）`);
      });
    });
    info.npcs = npcN; info.zones = zoneN;

    /* ---- 3. 所有过场步骤：painter / 角色 / 背景 / 音效 引用有效 ---- */
    const VALID_T = ('bg field cam enter exit actor emo clear say lines closebox choice wait hold input ' +
      'shake flash tint desat vignette redEdge letterbox scanlines grain glitch zoom slowmo black ' +
      'shatter motes feather burst ring explode paint unpaint sub clearsub card sfx bgm stopBgm layers ' +
      'duck scream wind flag learn kill sanity codex call par seq if repeat reset').split(' ');
    let steps = 0, dlgLines = 0;
    /* 对话行数组（lines / choice.lines）：形如 {who,text,emo,...}，没有 t */
    function walkLines(arr, where) {
      if (!Array.isArray(arr)) return;
      arr.forEach(L => {
        if (!L || typeof L !== 'object') return;
        if (L.t) { walk([L], where); return; }   /* 混入的真步骤 */
        dlgLines++;
        if (!L.who) { push(`${where}: 对话行缺少 who`); return; }
        if (!G.Chars[L.who]) push(`${where}: 对话行角色 "${L.who}" 不存在`);
        if (typeof L.text !== 'string') push(`${where}: 对话行 (${L.who}) 缺少 text`);
        if (L.sfx && !G.Aud.sfx[L.sfx]) push(`${where}: 对话行音效 "${L.sfx}" 不存在`);
        if (L.bgm && !G.Aud.THEMES[L.bgm]) push(`${where}: 对话行 BGM "${L.bgm}" 不存在`);
        if (L.choices) L.choices.forEach(c => { if (c.lines) walkLines(c.lines, where + '/opt'); });
      });
    }
    function walk(arr, where) {
      if (!Array.isArray(arr)) return;
      arr.forEach(s => {
        if (!s || typeof s !== 'object') return;
        steps++;
        if (VALID_T.indexOf(s.t) < 0) push(`${where}: 未知步骤类型 "${s.t}"`);
        if (s.t === 'paint' && !G.Paint[s.fn]) push(`${where}: 缺少 painter "${s.fn}"`);
        if (s.t === 'bg' && s.id && !G.Art.DEFS[s.id]) push(`${where}: 缺少背景 "${s.id}"`);
        if ((s.t === 'say' || s.t === 'enter' || s.t === 'actor' || s.t === 'shatter' || s.t === 'emo')
            && s.who && !G.Chars[s.who]) push(`${where}: 缺少角色 "${s.who}"`);
        if (s.t === 'say' && typeof s.text !== 'string') push(`${where}: say 缺少 text`);
        if (s.t === 'kill' && s.who && !G.Chars[s.who]) push(`${where}: kill 的角色 "${s.who}" 不存在`);
        if (s.t === 'sfx' && !G.Aud.sfx[s.id]) push(`${where}: 缺少音效 "${s.id}"`);
        if (s.t === 'bgm' && !G.Aud.THEMES[s.id]) push(`${where}: 缺少 BGM "${s.id}"`);
        if (s.t === 'flag' && !(s.k in G.St.s.flags)) push(`${where}: 未声明的 flag "${s.k}"`);
        if (s.t === 'lines') walkLines(s.list, where + '/lines');
        if (s.t === 'par') (s.steps || []).forEach((sub, i) => walk(Array.isArray(sub) ? sub : [sub], where + '/par' + i));
        if (s.t === 'seq' || s.t === 'repeat') walk(s.steps, where);
        if (s.t === 'if') { walk(s.then, where + '/then'); walk(s.else, where + '/else'); }
        if (s.t === 'choice') {
          if (typeof s.text !== 'string') push(`${where}: choice 缺少 text`);
          if (!s.choices || !s.choices.length) push(`${where}: choice 没有选项`);
          (s.choices || []).forEach(c => {
            if (typeof c.text !== 'string') push(`${where}: 选项缺少 text`);
            if (!c.id) push(`${where}: 选项缺少 id`);
            if (c.lines) walkLines(c.lines, where + '/opt:' + c.id);
          });
          if (s.branches) Object.keys(s.branches).forEach(k => walk(s.branches[k], where + '/br:' + k));
        }
      });
    }
    Object.keys(G.Cutscenes).forEach(k => walk(G.Cutscenes[k], 'cut:' + k));
    Object.keys(G.Endings).forEach(k => {
      const e = G.Endings[k];
      if (!e || !e.steps) return;
      walk(e.steps, 'end:' + k);
      if (e.after) walk(e.after, 'end:' + k + '.after');
      if (!e.title || !e.tag || !e.color || !e.sub) push(`end:${k}: 缺少 title/tag/color/sub`);
    });
    info.cutsceneCount = Object.keys(G.Cutscenes).length;
    info.steps = steps;
    info.dialogueLines = dlgLines;

    /* ---- 3b. 地图对话数据：全部跑一遍，检查角色与结构 ---- */
    let talkLines = 0;
    Object.keys(G.Talk.data).forEach(k => {
      let v;
      try { v = G.Talk.get(k, {}); }
      catch (e) { push(`talk:${k}: 求值抛错 ${e.message}`); return; }
      if (v === null) return;                 /* 条件性返回 null 是合法的 */
      if (!Array.isArray(v)) { push(`talk:${k}: 不是数组`); return; }
      talkLines += v.length;
      walkLines(v, 'talk:' + k);
    });
    info.talkLines = talkLines;

    /* ---- 4. Boss：每个难度每个阶段都必须有 generator ---- */
    let phases = 0;
    G.Bosses.list.forEach(id => {
      const b = G.Bosses[id];
      if (!b) { push(`缺少 Boss "${id}"`); return; }
      if (!b.hp || !b.hp.easy || !b.hp.normal || !b.hp.hard) push(`Boss ${id}: hp 三档不全`);
      if (typeof b.draw !== 'function') push(`Boss ${id}: 缺少 draw`);
      (b.phases || []).forEach((ph, i) => {
        phases++;
        ['easy', 'normal', 'hard'].forEach(d => {
          if (typeof (ph.pattern || {})[d] !== 'function')
            push(`Boss ${id} 阶段${i}: 缺少 ${d} 难度弹幕`);
        });
        /* 三档必须是三个不同的 generator，或至少函数体里读了难度参数。
           光检查「函数存在」挡不住三档指向同一个函数这种静默缩水。 */
        const p = ph.pattern || {};
        const uniq = new Set([p.easy, p.normal, p.hard].filter(Boolean));
        if (uniq.size === 1) {
          const src = String(p.easy || '');
          if (!/diff|easy|normal|hard/.test(src))
            push(`Boss ${id} 阶段${i}: 三档难度共用同一个弹幕且未按难度分支`);
        }
      });
      if ((b.phases || []).length < 2) push(`Boss ${id}: 阶段数 < 2`);
    });
    info.bossPhases = phases;
    info.bosses = G.Bosses.list.length;

    /* ---- 4b. 弹幕配色语法：敌弹暖色、己弹冷色（spec 硬要求） ----
       做法是拿一个记录型 api 去空跑每个阶段的 generator，把所有开火调用里的
       color 收集起来，再按色相判定。静态正则分不清「Boss 机体色」和「弹色」，
       只有真跑一遍才准。 */
    function lumOf(hex) {
      hex = String(hex || '').replace('#', '');
      if (hex.length === 3) hex = hex.replace(/(.)/g, '$1$1');
      if (!/^[0-9a-fA-F]{6}$/.test(hex)) return 0;
      const n = parseInt(hex, 16);
      return (((n >> 16) & 255) * .299 + ((n >> 8) & 255) * .587 + (n & 255) * .114) / 255;
    }
    function hueOf(hex) {
      hex = String(hex || '').replace('#', '');
      if (hex.length === 3) hex = hex.replace(/(.)/g, '$1$1');
      if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;
      const n = parseInt(hex, 16);
      const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
      if (d < .08) return -1;                   /* 真中性（近纯白/灰）：单独报，不测色相 */
      let h;
      if (mx === r) h = ((g - b) / d) % 6;
      else if (mx === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60; if (h < 0) h += 360;
      return h;
    }
    const FIRE = ['shoot', 'fan', 'ring', 'wall', 'aimed', 'laser', 'homing', 'reflect',
                  'spiral', 'burst', 'petals', 'rain', 'arc', 'chain', 'sweep',
                  'escortMissiles', 'fatalBeam', 'beam', 'spread', 'cross', 'lattice'];
    const badCols = {};
    let colorSamples = 0;
    G.Bosses.list.forEach(id => {
      const b = G.Bosses[id];
      if (!b) return;
      (b.phases || []).forEach((ph, pi) => {
        ['easy', 'normal', 'hard'].forEach(d => {
          const gen = (ph.pattern || {})[d];
          if (typeof gen !== 'function') return;
          const seen = [];
          const rec = new Proxy({}, {
            get(_, k) {
              if (k === 'aimX' || k === 'aimY') return () => 640;
              if (k === 'st') return () => G.St.s;
              if (k === 'fx') return G.Fx;
              if (k === 'diff') return d;
              return function () {
                const o = arguments[0];
                if (o && typeof o === 'object' && o.color && FIRE.indexOf(String(k)) >= 0) {
                  seen.push(o.color);
                }
                if (k === 'spawnCore') return { hp: 1, maxHp: 1, broken: true, x: 640, y: 200 };
                if (k === 'spawnMinion') return { dead: true };
                return (function* () { return 0; })();
              };
            }
          });
          const mockBoss = { x: 640, y: 200, r: 50, hp: 100, maxHp: 100, form: 0, phase: pi, def: b };
          let it;
          try { it = gen(rec, mockBoss, d); } catch (e) { return; }
          try {
            for (let n = 0; n < 3000; n++) { const r2 = it.next(); if (r2.done) break; }
          } catch (e) { /* 空跑难免踩到没 mock 到的东西，收集到的部分仍然有效 */ }
          seen.forEach(c => {
            colorSamples++;
            const h = hueOf(c);
            if (h !== null && h >= 165 && h <= 260) {
              badCols[id + ' 阶段' + pi + '/' + d + ' ' + c] = 1;
            }
            if (h === -1 && lumOf(c) > .78) {
              badCols[id + ' 阶段' + pi + '/' + d + ' ' + c + '（近纯白：会和自机光晕/擦弹环混淆）'] = 1;
            }
          });
        });
      });
    });
    Object.keys(badCols).forEach(k => push('敌弹用了冷色（会和己弹混淆）：' + k));

    /* 小怪同样过一遍：ai(e, api) 也是 generator */
    const badEn = {};
    G.Enemies.list.forEach(id => {
      const e = G.Enemies[id];
      if (!e || typeof e.ai !== 'function') return;
      const seen = [];
      const rec = new Proxy({}, {
        get(_, k) {
          if (k === 'px' || k === 'py') return 640;
          if (k === 'player') return { x: 640, y: 600, r: 8 };
          if (k === 'fx') return G.Fx;
          if (k === 'st') return () => G.St.s;
          return function () {
            const o = arguments[0];
            if (o && typeof o === 'object' && o.color && FIRE.indexOf(String(k)) >= 0) seen.push(o.color);
            if (k === 'spawn' || k === 'spawnMinion') return { dead: true };
            return (function* () { return 0; })();
          };
        }
      });
      const me = { x: 640, y: 200, r: 16, hp: 10, maxHp: 10, t: 0, dead: false, vx: 0, vy: 1 };
      let it;
      try { it = e.ai(me, rec); } catch (err) { return; }
      try { for (let n = 0; n < 2000; n++) { const r2 = it.next(); if (r2.done) break; } } catch (err) {}
      seen.forEach(c => {
        colorSamples++;
        const h = hueOf(c);
        if (h !== null && h >= 165 && h <= 260) badEn[id + ' ' + c] = 1;
        if (h === -1 && lumOf(c) > .78) badEn[id + ' ' + c + '（近纯白）'] = 1;
      });
    });
    Object.keys(badEn).forEach(k => push('小怪弹用了冷色：' + k));
    info.bulletColorSamples = colorSamples;
    if (colorSamples < 60) push('弹幕配色抽样过少（' + colorSamples + '）—— 校验没真正跑到开火调用');

    /* ---- 5. 小怪：三位一体齐全 ---- */
    G.Enemies.list.forEach(id => {
      const e = G.Enemies[id];
      if (!e) { push(`缺少小怪 "${id}"`); return; }
      if (typeof e.draw !== 'function') push(`小怪 ${id}: 缺少 draw（外观）`);
      if (typeof e.move !== 'function') push(`小怪 ${id}: 缺少 move（移动）`);
      if (typeof e.ai !== 'function') push(`小怪 ${id}: 缺少 ai（攻击）`);
    });
    info.enemies = G.Enemies.list.length;
    ['easy', 'normal', 'hard'].forEach(d => {
      const t = G.Enemies.waveTable[d];
      if (!t || !t.length) push(`波次表缺少 ${d}`);
      (t || []).forEach((mix, i) => mix.forEach(id => {
        if (!G.Enemies[id]) push(`波次表 ${d}[${i}]: 未知小怪 "${id}"`);
      }));
    });

    /* ---- 6. 角色：哔声 + 立绘参数齐全，且哔声互不相同 ---- */
    const voiceSigs = {};
    Object.keys(G.Chars).forEach(id => {
      const c = G.Chars[id];
      if (!c.voice) { push(`角色 ${id}: 缺少哔声`); return; }
      if (!c.color) push(`角色 ${id}: 缺少主色`);
      if (!c.noPortrait && !c.head) push(`角色 ${id}: 缺少 head`);
      const v = c.voice;
      const sig = [v.wave, Math.round(v.f), v.dual ? 'D' : '', v.unstable ? 'U' : '',
                   v.noise || 0, v.harm || 0].join('|');
      if (voiceSigs[sig]) push(`角色 ${id} 与 ${voiceSigs[sig]} 的哔声完全相同（${sig}）`);
      voiceSigs[sig] = id;
    });
    info.chars = Object.keys(G.Chars).length;

    /* ---- 7. 结局：7 个齐全，且 badB/D/E/IF 的触发条件可达 ---- */
    const need = ['good', 'badA', 'badB', 'badC', 'badD', 'badE', 'if'];
    need.forEach(id => { if (!G.Endings[id]) push(`缺少结局 "${id}"`); });
    info.endings = need.filter(id => !!G.Endings[id]).length;

    /* 每个坏结局都必须有独立的「世界之后」段落（spec 硬要求）。
       只数结局个数挡不住把这段悄悄砍掉。 */
    ['badA', 'badB', 'badC', 'badD', 'badE'].forEach(id => {
      const e = G.Endings[id];
      if (!e) return;
      const all = JSON.stringify([e.steps || [], e.after || []]);
      if (!/世\s*界\s*之\s*后/.test(all)) push(`end:${id}: 没有「世界之后」段落`);
      const n = (e.steps || []).length + (e.after || []).length;
      if (n < 25) push(`end:${id}: 演出只有 ${n} 步，太短`);
    });

    /* 触发条件逐个验证（用真状态跑 terminalCheck） */
    const snap = JSON.parse(JSON.stringify(G.St.s));
    function tc(mutate, arg) {
      G.St.reset();
      mutate(G.St.s);
      return G.Loop.terminalCheck(arg || {});
    }
    const cases = [
      ['badA', s2 => { s2.flags.tyFleshLost = true; }, {}],
      ['badE', s2 => { s2.flags.killedTy = true; }, {}],
      ['badD', s2 => { s2.flags.joinedBoss = true; }, {}],
      ['badC', s2 => { s2.flags.doomEarly = true; }, {}],
      ['__ask_give_up__', s2 => { s2.sanity = 10; }, {}],
      ['if', s2 => { s2.flags.uprightAlive = true; s2.boss6Deaths = 2; }, { boss: 'boss6', phase: 2 }],
      [null, s2 => { s2.sanity = 80; }, {}]
    ];
    cases.forEach(([expect, mut, arg]) => {
      const got = tc(mut, arg);
      if (got !== expect) push(`terminalCheck 断言失败: 期望 ${expect}，实际 ${got}`);
    });
    /* IF 前提：warnedUpright && fatalCoreBroken */
    G.St.reset();
    G.St.s.flags.warnedUpright = true; G.St.s.flags.fatalCoreBroken = true;
    const b3 = G.Story.chapters[2].beats.filter(b => b.k === 'branch')[0];
    if (b3.fn() !== 'survive') push('Boss3 分支：警告+击破核心 应导致 survive');
    G.St.s.flags.fatalCoreBroken = false;
    if (b3.fn() !== 'death') push('Boss3 分支：未击破核心 应导致 death');
    /* 坏结局D 选项门槛：绝望值 */
    G.St.reset();
    G.St.kill('oldman'); G.St.kill('upright'); G.St.kill('puppet'); G.St.kill('lucky');
    G.St.s.flags.friendRevealed = true; G.St.s.sanity = 20; G.St.s.loopCount = 8;
    if (G.St.despair() < 70) push('坏结局D 门槛：全损状态下 despair 仍 < 70（选项永不出现）');
    G.St.restore(snap);

    /* ---- 8. 难度配置完整 ---- */
    ['easy', 'normal', 'hard'].forEach(d => {
      const c = G.Diff[d];
      ['playerHp', 'playerLives', 'bombs', 'mobDensity', 'mobHp', 'bossHp',
       'bossFireRate', 'telegraph', 'reward', 'maxBullets'].forEach(k => {
        if (typeof c[k] !== 'number') push(`难度 ${d}: 缺少数值 ${k}`);
      });
    });
    /* 三档必须真的不同 */
    if (G.Diff.easy.bossHp === G.Diff.hard.bossHp) push('难度 easy/hard 的 bossHp 相同');

    /* ---- 9. 区域数 / 结局图鉴 ---- */
    info.regions = Object.keys(G.Maps).length;
    if (info.regions < 6) push(`区域数 ${info.regions} < 6`);
    if (info.enemies < 10) push(`小怪种类 ${info.enemies} < 10`);
    if (info.bosses < 6) push(`Boss 数 ${info.bosses} < 6`);

    return { fail, info };
  });

  console.log('=== 统计 ===');
  Object.keys(rep.info).forEach(k => console.log('  ' + k.padEnd(16) + rep.info[k]));
  console.log('\n=== 校验 ===');
  if (rep.fail.length) {
    rep.fail.forEach(f => console.log('  ✗ ' + f));
    console.log('\n' + rep.fail.length + ' 项不通过');
  } else console.log('  ✓ 全部通过');

  if (errs.length) {
    console.log('\n=== 运行时报错 ===');
    [...new Set(errs)].slice(0, 20).forEach(e => console.log('  ' + e));
  }

  await browser.close();
  process.exit(rep.fail.length || errs.length ? 1 : 0);
}
main();
