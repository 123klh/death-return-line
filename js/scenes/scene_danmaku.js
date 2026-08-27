/* ===========================================================
   scene_danmaku.js — 弹幕飞机大战
     玩家（点判定 / 擦弹 / 2 技能）· 弹幕对象池 · 小怪波次 · Boss 多阶段
     暖色=敌弹，冷色=己弹；预警线；三档难度数值全部来自 G.Diff
   =========================================================== */
(function (root) {
  'use strict';
  var G = root.G, U = G.U, Ui = G.Ui, In = G.In;

  var W = 1280, H = 720;
  var PLAY = { x: 190, y: 0, w: 900, h: 720 };   // 战斗区（两侧留 HUD）

  /* ---------------- 子弹精灵缓存 ---------------- */
  var spriteCache = {};
  function bulletSprite(kind, color, size) {
    var key = kind + '|' + color + '|' + size;
    if (spriteCache[key]) return spriteCache[key];
    /* 细长弹需要更大的画布留出长度 */
    var pad = (kind === 'needle' || kind === 'pshot') ? size * 4.2 : size * 2.05;
    var c = U.canvas(pad * 2, pad * 2), x = c.getContext('2d');
    var cx = pad, cy = pad;
    /* 外发光：细长弹用竖向拉伸的椭圆光，避免变成圆球。
       光圈刻意收紧 —— 上千发弹幕的光晕叠起来会把整屏洗成一片粉红，弹形就读不出来了。 */
    if (kind === 'needle' || kind === 'pshot') {
      x.save();
      x.translate(cx, cy);
      x.scale(.34, 1);
      var gl = x.createRadialGradient(0, 0, 0, 0, 0, pad);
      gl.addColorStop(0, U.rgba(color, .8));
      gl.addColorStop(.35, U.rgba(color, .3));
      gl.addColorStop(1, U.rgba(color, 0));
      x.fillStyle = gl;
      x.beginPath(); x.arc(0, 0, pad, 0, U.TAU); x.fill();
      x.restore();
    } else {
      var g = x.createRadialGradient(cx, cy, 0, cx, cy, pad);
      g.addColorStop(0, U.rgba(color, .62));
      g.addColorStop(.5, U.rgba(color, .17));
      g.addColorStop(1, U.rgba(color, 0));
      x.fillStyle = g;
      x.fillRect(0, 0, pad * 2, pad * 2);
    }

    x.save();
    x.translate(cx, cy);
    if (kind === 'pshot') {
      /* 己方弹：细长冷色光束 + 白亮核心 */
      var L = size * 3.6;
      var lg = x.createLinearGradient(0, -L, 0, L * .5);
      lg.addColorStop(0, 'rgba(255,255,255,0)');
      lg.addColorStop(.25, '#ffffff');
      lg.addColorStop(.6, color);
      lg.addColorStop(1, U.rgba(color, 0));
      x.fillStyle = lg;
      U.roundRect(x, -size * .42, -L, size * .84, L * 1.5, size * .42);
      x.fill();
      x.fillStyle = 'rgba(255,255,255,.95)';
      U.roundRect(x, -size * .18, -L * .85, size * .36, L * .9, size * .18);
      x.fill();
    } else if (kind === 'needle') {
      var L2 = size * 3.4;
      var lg2 = x.createLinearGradient(0, -L2, 0, L2 * .6);
      lg2.addColorStop(0, '#ffffff');
      lg2.addColorStop(.35, color);
      lg2.addColorStop(1, U.rgba(color, .06));
      x.fillStyle = lg2;
      x.beginPath();
      x.moveTo(0, -L2); x.lineTo(size * .58, L2 * .3);
      x.lineTo(0, L2 * .6); x.lineTo(-size * .58, L2 * .3);
      x.closePath(); x.fill();
      x.fillStyle = 'rgba(255,255,255,.8)';
      x.beginPath();
      x.moveTo(0, -L2 * .9); x.lineTo(size * .2, 0); x.lineTo(0, L2 * .2); x.lineTo(-size * .2, 0);
      x.closePath(); x.fill();
    } else if (kind === 'shard') {
      x.fillStyle = '#ffffff';
      x.beginPath();
      x.moveTo(0, -size * 1.5); x.lineTo(size * 1.2, 0);
      x.lineTo(0, size * 1.5); x.lineTo(-size * 1.2, 0);
      x.closePath(); x.fill();
      /* 暗轮廓：暖色底（核心空域）上也能读出弹形 */
      x.strokeStyle = U.rgba(U.shade(color, -.72), .8);
      x.lineWidth = 1.2; x.stroke();
      x.fillStyle = U.rgba(color, .92);
      x.beginPath();
      x.moveTo(0, -size * 1.15); x.lineTo(size * .92, 0);
      x.lineTo(0, size * 1.15); x.lineTo(-size * .92, 0);
      x.closePath(); x.fill();
    } else if (kind === 'ringlet') {
      x.strokeStyle = U.rgba(U.shade(color, -.7), .75); x.lineWidth = size * .68;
      x.beginPath(); x.arc(0, 0, size, 0, U.TAU); x.stroke();
      x.strokeStyle = '#ffffff'; x.lineWidth = size * .5;
      x.beginPath(); x.arc(0, 0, size, 0, U.TAU); x.stroke();
      x.strokeStyle = color; x.lineWidth = size * .3;
      x.beginPath(); x.arc(0, 0, size, 0, U.TAU); x.stroke();
    } else if (kind === 'petal') {
      x.fillStyle = U.rgba(color, .95);
      x.beginPath();
      x.moveTo(0, -size * 1.6);
      x.quadraticCurveTo(size * 1.1, 0, 0, size * 1.6);
      x.quadraticCurveTo(-size * 1.1, 0, 0, -size * 1.6);
      x.fill();
      x.strokeStyle = U.rgba(U.shade(color, -.72), .85);
      x.lineWidth = 1.3; x.stroke();
      x.fillStyle = 'rgba(255,255,255,.75)';
      x.beginPath(); x.arc(0, -size * .3, size * .32, 0, U.TAU); x.fill();
    } else if (kind === 'square') {
      x.fillStyle = U.rgba(U.shade(color, -.72), .85);
      x.fillRect(-size * 1.18, -size * 1.18, size * 2.36, size * 2.36);
      x.fillStyle = '#ffffff';
      x.fillRect(-size, -size, size * 2, size * 2);
      x.fillStyle = U.rgba(color, .95);
      x.fillRect(-size * .74, -size * .74, size * 1.48, size * 1.48);
    } else {  /* orb */
      var og = x.createRadialGradient(-size * .3, -size * .35, size * .1, 0, 0, size);
      og.addColorStop(0, '#ffffff');
      og.addColorStop(.45, U.shade(color, .35));
      og.addColorStop(1, U.shade(color, -.25));
      x.fillStyle = og;
      x.beginPath(); x.arc(0, 0, size, 0, U.TAU); x.fill();
      x.strokeStyle = U.rgba(U.shade(color, -.62), .8);
      x.lineWidth = 1.3;
      x.beginPath(); x.arc(0, 0, size, 0, U.TAU); x.stroke();
    }
    x.restore();
    spriteCache[key] = { img: c, pad: pad };
    return spriteCache[key];
  }

  /* ---------------- 池 ---------------- */
  function mkBullet() {
    return { x: 0, y: 0, vx: 0, vy: 0, ax: 0, ay: 0, r: 6, color: '#ff6a6a', kind: 'orb',
             life: 600, rot: 0, spin: 0, bounce: 0, homing: 0, turn: 0, dmg: 1, drag: 1,
             grazed: false, scale: 1, sizeDraw: 6, wobble: 0, wphase: 0, sine: 0, spd: 0, ang: 0,
             toEscort: false, killable: false, khp: 0 };
  }
  function mkEnemy() {
    return { x: 0, y: 0, vx: 0, vy: 0, r: 14, hp: 10, maxHp: 10, def: null, t: 0,
             flash: 0, coro: null, slot: 0, spd: 1, small: false, dead: false, alive: true };
  }
  function mkLaser() {
    return { x: 0, y: 0, a: 0, w: 10, len: 900, ms: 300, t: 0, color: '#ff5a3c',
             pierce: false, dmg: 1, active: true, grow: 0 };
  }

  var S = {
    eb: null, pb: null, en: null, lasers: [],
    warns: [],
    field: null,
    player: null,
    boss: null,
    kind: 'stage',
    t: 0, dt: 16.7,
    cfg: null,
    score: 0, graze: 0, kills: 0,
    over: false, won: false,
    intro: '', introT: 0,
    waveIdx: 0, waveCo: null,
    bark: null, barkT: 0,
    escort: null,
    slowT: 0,
    shieldT: 0,
    resultT: 0,
    battleId: '',
    api: null,
    bossPhase: 0,
    hpGhost: 1,
    fieldSpeed: 1,
    _final: false,
    clearBanner: 0,
    ally: null,
    asUpright: false
  };

  /* ============================================================
     进入
     ============================================================ */
  S.enter = function (p) {
    p = p || {};
    S.cfg = G.diffCfg();
    S.battleId = p.id || 'stage_intro';
    S.kind = p.kind || 'stage';
    S.field = G.Art.field(p.field || 'ruins');
    S.t = 0; S.score = 0; S.graze = 0; S.kills = 0;
    S.over = false; S.won = false; S.resultT = 0;
    S.intro = p.intro || '';
    S.introT = 0;
    S.waveIdx = 0;
    S.bark = null;
    S.lasers.length = 0;
    S.warns.length = 0;
    S.bossPhase = 0;
    S.hpGhost = 1;
    S.fieldSpeed = 1;
    S._final = !!p.final;
    S.clearBanner = 0;
    S.escort = null;
    S.ally = null;
    S.asUpright = !!p.asUpright;
    S._finished = false;
    S._terminal = null;
    S._onWin = p.onWin || null;
    S._onLose = p.onLose || null;
    S.waves = p.waves || 0;
    S.onlyEnemy = p.onlyEnemy || null;
    S._params = p;

    if (!S.eb) {
      S.eb = new U.Pool(mkBullet, 2200);
      S.pb = new U.Pool(mkBullet, 460);
      S.en = new U.Pool(mkEnemy, 90);
    }
    S.eb.clear(); S.pb.clear(); S.en.clear();
    G.Fx.clearParticles();

    var up = G.St.s.upgrades;
    S.player = {
      x: 640, y: 560, vx: 0, vy: 0,
      hp: S.cfg.playerHp + up.shield, maxHp: S.cfg.playerHp + up.shield,
      lives: S.cfg.playerLives, bombs: S.cfg.bombs + Math.floor(up.bombs / 2),
      inv: 90, r: 3.2, bodyR: 13,
      fireCd: 0, power: S.cfg.playerPower * (1 + up.power * .22),
      spd: S.cfg.playerSpd * (1 + up.speed * .06),
      slowCd: 0, shieldCd: 0, slowLeft: 0, shieldLeft: 0,
      dead: false, respawnT: 0, focus: false, slowedT: 0
    };

    /* 护航目标（Boss5：TY 的护航舱） */
    if (p.escort) {
      /* 放在右上角：Boss5 在左上方巡航，重叠会让护航舱被流弹和 Boss 立绘一起吞掉 */
      S.escort = { x: 950, y: 150, hp: 100, maxHp: 100, r: 26, t: 0, dead: false,
                   warn: 0, hurt: 0 };
    }

    /* API */
    S.api = buildApi();

    /* Boss or 道中 */
    if (S.kind === 'boss') {
      var def = G.Bosses[S.battleId];
      if (!def) { console.warn('[danmaku] 未知 Boss ' + S.battleId); G.Story.onBattleWin(); return; }
      var hp = def.hp[S.cfg.key] || def.hp.normal;
      S.boss = {
        def: def, hp: hp, maxHp: hp, x: 640, y: 170, r: def.r || 46,
        t: 0, phase: 0, form: 0, flash: 0, coro: null, dying: false,
        vx: 0, vy: 0, ux: 640, uy: 170, invul: 0, core: null,
        extra: {}
      };
      startPhase(0);
      G.Aud.playBgm(p.bgm || def.bgm || 'boss1', { fade: 700 });
    } else {
      S.boss = null;
      S.waveCo = G.Tw.coro(stageScript(), S);
      G.Aud.playBgm(p.bgm || 'ruins', { fade: 900 });
    }

    G.Fx.reset();
    G.Fx.setVignette(.34);
    G.Fx.grain = .4;
    G.Dlg.clearStage();
  };

  S.exit = function () {
    G.Tw.killCoros(S);
    if (S.boss && S.boss.coro) S.boss.coro.kill();
    if (S.waveCo) S.waveCo.kill();
  };

  /* ============================================================
     API（供 enemies.js / bosses.js 的 generator 使用）
     ============================================================ */
  function buildApi() {
    var c = S.cfg;
    var api = {
      W: W, H: H, PLAY: PLAY,
      easy: c.key === 'easy', normal: c.key === 'normal', hard: c.key === 'hard',
      diff: c.key,
      tele: c.telegraph, rate: c.bossFireRate, bspd: c.bossBulletSpd,
      player: null, boss: null
    };
    Object.defineProperty(api, 'player', { get: function () { return S.player; } });
    Object.defineProperty(api, 'boss', { get: function () { return S.boss; } });

    api.shoot = function (o) {
      var b = S.eb.get();
      if (!b) return null;
      b.x = o.x; b.y = o.y;
      var spd = (o.spd === undefined ? 3 : o.spd) * (o.raw ? 1 : c.bossBulletSpd);
      if (o.a !== undefined) { b.vx = Math.cos(o.a) * spd; b.vy = Math.sin(o.a) * spd; b.ang = o.a; }
      else { b.vx = o.vx || 0; b.vy = o.vy === undefined ? spd : o.vy; b.ang = Math.atan2(b.vy, b.vx); }
      b.ax = o.ax || 0; b.ay = o.ay || 0;
      b.r = o.r === undefined ? 6 : o.r;
      b.sizeDraw = b.r;
      b.color = o.color || '#ff6a6a';
      b.kind = o.kind || 'orb';
      b.life = o.life === undefined ? 700 : o.life;
      b.rot = o.rot || b.ang + Math.PI / 2;
      b.spin = o.spin || 0;
      b.bounce = o.bounce || 0;
      b.homing = o.homing || 0;
      b.turn = o.turn || 0;
      b.dmg = o.dmg === undefined ? 1 : o.dmg;
      b.drag = o.drag === undefined ? 1 : o.drag;
      b.grazed = false;
      b.wobble = o.wobble || 0;
      b.wphase = Math.random() * U.TAU;
      b.sine = o.sine || 0;
      b.spd = spd;
      b.toEscort = !!o.toEscort;
      b.killable = !!o.killable;
      b.khp = o.khp || 0;
      return b;
    };
    api.ring = function (o) {
      var n = o.n || 12;
      var off = o.off || 0;
      for (var i = 0; i < n; i++) {
        api.shoot(U.merge(U.clone(o), { a: off + i / n * U.TAU }));
      }
    };
    api.fan = function (o) {
      var n = o.n || 7;
      var a0 = o.a === undefined ? aimA(o.x, o.y) : o.a;
      var sp = o.spread === undefined ? .8 : o.spread;
      for (var i = 0; i < n; i++) {
        var t = n === 1 ? .5 : i / (n - 1);
        api.shoot(U.merge(U.clone(o), { a: a0 - sp / 2 + sp * t }));
      }
    };
    api.aimed = function (o) {
      var a0 = aimA(o.x, o.y);
      var n = o.n || 1;
      var sp = o.spread === undefined ? .4 : o.spread;
      for (var i = 0; i < n; i++) {
        var t = n === 1 ? .5 : i / (n - 1);
        api.shoot(U.merge(U.clone(o), { a: a0 - sp / 2 + sp * t }));
      }
    };
    api.wall = function (o) {
      var n = o.n || 11;
      var gap = o.gap === undefined ? U.randInt(1, n - 2) : o.gap;
      var gw = o.gapW || (api.easy ? 2 : api.hard ? 1 : 1);
      for (var i = 0; i < n; i++) {
        if (i >= gap && i < gap + gw) continue;
        api.shoot(U.merge(U.clone(o), {
          x: PLAY.x + 30 + (PLAY.w - 60) * i / (n - 1),
          y: o.y === undefined ? -20 : o.y,
          a: Math.PI / 2
        }));
      }
    };
    api.spiral = function (o) {
      var arms = o.arms || 3;
      var a0 = o.a0 || 0;
      for (var i = 0; i < arms; i++) {
        api.shoot(U.merge(U.clone(o), { a: a0 + i / arms * U.TAU }));
      }
    };
    api.homing = function (o) {
      var oo = U.clone(o);
      oo.homing = 1;
      oo.turn = o.turn || .03;
      var n = o.n || 1;
      for (var i = 0; i < n; i++) {
        oo.a = aimA(o.x, o.y) + (i - (n - 1) / 2) * .4;
        api.shoot(oo);
      }
    };
    /* 锁定护航舱的导弹：预警 → 慢速追踪 → 可被己弹拦下。
       这是玩家保护 TY 的唯一手段，也是坏结局A 的唯一来路。 */
    api.escortMissiles = function (o) {
      o = o || {};
      var e = S.escort;
      if (!e || e.dead) return 0;
      var n = o.n || 3;
      var from = o.x === undefined ? (S.boss ? S.boss.x : 640) : o.x;
      var fromY = o.y === undefined ? (S.boss ? S.boss.y : 120) : o.y;
      e.warn = 1;
      for (var i = 0; i < n; i++) {
        var a = U.angleTo(from, fromY, e.x, e.y) + (i - (n - 1) / 2) * .22;
        api.shoot({
          x: from, y: fromY, a: a, spd: o.spd || 1.5, raw: true,
          r: 9, color: '#ff4a5e', kind: 'shard',
          homing: 1, turn: o.turn || .012, life: o.life || 900,
          dmg: o.dmg || 1, toEscort: true, killable: true, khp: o.khp || 10
        });
      }
      G.Aud.sfx.warn && G.Aud.sfx.warn();
      return n;
    };
    api.laser = function (o) {
      var l = mkLaser();
      l.x = o.x; l.y = o.y; l.a = o.a === undefined ? Math.PI / 2 : o.a;
      l.w = o.w || 12; l.len = o.len || 1000;
      l.ms = o.ms || 300; l.t = 0;
      l.color = o.color || '#ff5a3c';
      l.pierce = !!o.pierce; l.dmg = o.dmg || 1;
      l.rotate = o.rotate || 0;
      l.follow = o.follow || null;
      S.lasers.push(l);
      return l;
    };
    api.warnLine = function (src, a, frames) {
      S.warns.push({ x: src.x, y: src.y, a: a, t: 0, dur: frames * 16.67, src: src });
    };
    api.spawn = function (id, x, y) { return spawnEnemy(id, x, y); };
    api.killEnemy = function (e, boom) { killEnemy(e, boom); };
    api.slowPlayer = function (fr) { S.player.slowedT = Math.max(S.player.slowedT, fr * 16.67); };
    api.shake = function (p, ms) { G.Game.shake(p, ms); };
    api.flash = function (col, ms, a) { G.Fx.flash(col, ms, a); };
    api.say = function (who, text, ms) { S.bark = { who: who, text: text }; S.barkT = ms || 2600; };
    api.setForm = function (n) { if (S.boss) S.boss.form = n; };
    api.moveTo = function (x, y, ms) {
      if (!S.boss) return;
      G.Tw.to(S.boss, ms || 800, { ux: x, uy: y, ease: 'inOutQuad' });
    };
    api.aimA = function (x, y) { return aimA(x, y); };
    api.spawnCore = function (o) {
      if (!S.boss) return null;
      var core = { x: S.boss.x, y: S.boss.y + 70, r: 26, hp: o.hp || 400, maxHp: o.hp || 400,
                   broken: false, t: 0, warnMs: o.warnMs || 1800 };
      S.boss.core = core;
      return core;
    };
    api.flagSet = function (k, v) { G.St.setFlag(k, v === undefined ? true : v); };
    /* TY 剪影穿越射线 —— 坏结局E 的触发装置。玩家必须停火。 */
    api.spawnAlly = function (o) {
      o = o || {};
      if (S.ally) return S.ally;
      var fromLeft = Math.random() < .5;
      S.ally = {
        who: o.who || 'ty',
        x: fromLeft ? PLAY.x - 40 : PLAY.x + PLAY.w + 40,
        y: S.player ? U.clamp(S.player.y - 190, 150, 430) : 300,
        vx: (fromLeft ? 1 : -1) * 2.6,
        r: 26, t: 0, life: 3400, hit: false
      };
      return S.ally;
    };
    api.clearAlly = function () { S.ally = null; };
    api.fx = G.Fx;
    api.st = function () { return G.St.s; };
    return api;
  }

  function aimA(x, y) { return U.angleTo(x, y, S.player.x, S.player.y); }

  /* ============================================================
     Boss 阶段
     ============================================================ */
  function startPhase(i) {
    var b = S.boss;
    var ph = b.def.phases[i];
    if (!ph) return;
    b.phase = i;
    S.bossPhase = i;
    if (b.coro) b.coro.kill();
    var gen = ph.pattern[S.cfg.key] || ph.pattern.normal;
    b.coro = G.Tw.coro(gen(S.api, b), S);
    if (ph.form !== undefined) b.form = ph.form;
    if (ph.bgm) G.Aud.playBgm(ph.bgm, { fade: 400 });
  }

  function checkPhase() {
    var b = S.boss;
    if (!b || b.dying) return;
    var ratio = b.hp / b.maxHp;
    var next = b.phase + 1;
    var ph = b.def.phases[next];
    if (ph && ratio <= ph.hpFrom) {
      /* 转阶段演出：定格 + 形态变化 + BGM */
      b.invul = 90;
      G.Game.hitstop(130);
      G.Game.slowmo(.15, 1100);
      G.Fx.flash('#ffffff', 300, .75);
      G.Game.shake(20, 800);
      G.Aud.sfx.bossDown();
      S.eb.clear();
      G.Fx.explode(b.x, b.y, { big: true, color: b.def.color });
      if (ph.bark) S.api.say(b.def.who || 'savior', ph.bark, 3000);
      G.Fx.float(640, 240, ph.title || '形态变化', b.def.color, { size: 30, life: 1800, vy: -.12 });
      startPhase(next);
    }
  }

  /* ============================================================
     道中波次
     ============================================================ */
  function* stageScript() {
    /* 调试：只出指定一种小怪，用来逐个核对 12 种的外观/移动/攻击 */
    var table = S.onlyEnemy ? [[S.onlyEnemy]] : G.Enemies.waveTable[S.cfg.key];
    var total = S.waves || (S.cfg.key === 'easy' ? 5 : S.cfg.key === 'hard' ? 8 : 6);
    yield 70;
    for (var w = 0; w < total; w++) {
      S.waveIdx = w + 1;
      var mix = table[w % table.length];
      var count = Math.round((3 + w) * S.cfg.mobDensity);
      for (var i = 0; i < count; i++) {
        var id = mix[i % mix.length];
        var ex = PLAY.x + 60 + Math.random() * (PLAY.w - 120);
        var e = spawnEnemy(id, ex, -40 - (i % 4) * 50);
        if (e) e.slot = i;
        yield Math.round(14 / S.cfg.mobDensity);
      }
      /* 等清场或超时 */
      var guard = 0;
      while (S.en.active > 0 && guard++ < 420) yield 6;
      yield 50;
    }
    /* 通关 */
    yield 40;
    win();
  }

  function spawnEnemy(id, x, y) {
    var def = G.Enemies[id];
    if (!def) return null;
    var e = S.en.get();
    if (!e) return null;
    e.def = def;
    e.x = x; e.y = y;
    e.vx = 0; e.vy = 0;
    e.r = def.r;
    e.maxHp = e.hp = Math.max(3, def.hp * S.cfg.mobHp);
    e.spd = (def.spd || 1.6) * S.cfg.mobSpd;
    e.t = 0; e.flash = 0; e.dead = false; e.small = false;
    e.aimed = false; e.armed = false; e.charging = false;
    e.orbA = undefined; e.jt = undefined; e.wp = undefined;
    e.dirSet = undefined; e.formX = x; e.phase = undefined; e.blink = 1;
    e.shieldDown = false; e.shieldHp = 40 * (S.cfg.mobHp || 1);   /* 从池里取出必须重置，否则复用到已破盾的对象 */
    e.slot = S.en.active;
    if (e.coro) e.coro.kill();
    e.coro = def.ai ? G.Tw.coro(def.ai(e, S.api), S) : null;
    return e;
  }

  function killEnemy(e, silent) {
    if (e.dead) return;
    e.dead = true;
    if (e.coro) e.coro.kill();
    S.kills++;
    S.score += e.def.score || 100;
    G.St.addPoints((e.def.score || 100) * .12 * S.cfg.reward);
    if (!silent) G.Fx.explode(e.x, e.y, { color: e.def.color });
    else G.Fx.explode(e.x, e.y, { big: true, color: '#ffb15e' });
    G.Aud.sfx.explode(!!silent);
    if (e.def.onDeath) e.def.onDeath(e, S.api);
    G.Fx.float(e.x, e.y - 20, '+' + (e.def.score || 100), '#ffd479', { size: 14, life: 700 });
  }

  /* ============================================================
     更新
     ============================================================ */
  S.update = function (dt) {
    S.dt = dt;
    S.t += dt;
    var f = dt / 16.67;

    if (In.hit('pause') && !S.over) { G.Game.togglePause(); return; }

    if (S.intro && S.introT < 2400) S.introT += dt;

    if (S.over) {
      S.resultT += dt;
      if (S.resultT > 1500 && (In.hit('confirm') || In.mclick)) finishBattle();
      if (S.resultT > 4200) finishBattle();
      updBullets(f);       /* 残弹继续飞完，但此时玩家已无敌，见 win() */
      return;
    }

    if (S.bark) { S.barkT -= dt; if (S.barkT <= 0) S.bark = null; }

    updPlayer(f, dt);
    updEnemies(f);
    if (S.boss) updBoss(f);
    updBullets(f);
    updLasers(dt);
    updWarns(dt);
    if (S.escort) updEscort(f);
    if (S.ally) updAlly(f, dt);
  };

  /* ---------------- TY 剪影（坏结局E） ---------------- */
  function updAlly(f, dt) {
    var a = S.ally;
    a.t += dt;
    a.x += a.vx * f;
    if (a.t > a.life || a.x < PLAY.x - 90 || a.x > PLAY.x + PLAY.w + 90) {
      S.ally = null;
      /* 安全通过：给一点正反馈 */
      if (!a.hit) {
        G.Fx.float(640, 250, '你停了火。', '#9ff0ff', { size: 20, life: 1800, vy: -.1 });
        G.St.learn('held_fire', '我在混乱中停下了扳机 —— 那一次没有打中他');
      }
    }
  }
  function allyHit() {
    var a = S.ally;
    if (!a || a.hit) return;
    a.hit = true;
    S.ally = null;
    G.St.setFlag('killedTy');
    G.St.setFlag('tyAlive', false);
    G.St.kill('ty');
    G.Fx.flash('#ffffff', 700, 1);
    G.Game.shake(30, 1200);
    G.Game.slowmo(.1, 2000);
    G.Aud.stopBgm(300);
    G.Aud.sfx.playerHit();
    S.eb.clear();
    S.over = true; S.won = false; S.resultT = 0;
    S._terminal = 'badE';
  }

  /* ---------------- 玩家 ---------------- */
  function updPlayer(f, dt) {
    var p = S.player;
    if (p.dead) {
      p.respawnT -= dt;
      if (p.respawnT <= 0) {
        if (p.lives <= 0) { lose(); return; }
        p.dead = false;
        p.hp = p.maxHp;
        p.inv = S.cfg.invMs;
        p.x = 640; p.y = 600;
        S.eb.clear();
        G.Fx.ring(p.x, p.y, { color: '#4FC3F7', r: 10, r2: 200, life: 600 });
      }
      return;
    }
    if (p.inv > 0) p.inv -= dt;
    if (p.slowedT > 0) p.slowedT -= dt;
    if (p.slowLeft > 0) {
      p.slowLeft -= dt;
      if (p.slowLeft <= 0) { G.Game.setTimeScale(1); S.fieldSpeed = 1; }
    }
    if (p.shieldLeft > 0) p.shieldLeft -= dt;
    if (p.slowCd > 0) p.slowCd -= dt;
    if (p.shieldCd > 0) p.shieldCd -= dt;

    /* 移动 */
    var ax = In.axis();
    p.focus = In.down('focus');
    var spd = p.spd * (p.focus ? .45 : 1) * (p.slowedT > 0 ? .5 : 1);
    p.vx = ax.x * spd; p.vy = ax.y * spd;
    p.x = U.clamp(p.x + p.vx * f, PLAY.x + 16, PLAY.x + PLAY.w - 16);
    p.y = U.clamp(p.y + p.vy * f, 40, H - 26);

    /* 尾焰 */
    if (Math.random() < .8) {
      G.Fx.spawn({ x: p.x + U.rand(-4, 4), y: p.y + 16, vy: U.rand(1.4, 3),
                   vx: U.rand(-.3, .3), life: U.rand(180, 340), size: U.rand(2, 4.4),
                   color: p.focus ? '#9ff0ff' : '#5ce1ff', kind: 'mote', glow: 1 });
    }

    /* 射击（TY 剪影在场时禁用自动射击 —— 玩家必须主动松手） */
    var firing = S.ally ? In.down('fire') : (In.down('fire') || G.Save.settings().autoFire);
    p.fireCd -= dt;
    if (firing && p.fireCd <= 0) {
      p.fireCd = 78;
      shootPlayer();
    }

    /* 技能1：清屏炸弹（独立于护盾冷却——保命键不能被别的技能锁死） */
    if (In.hit('skill1') && p.bombs > 0) {
      p.bombs--;
      p.inv = Math.max(p.inv, 1400);
      G.Aud.sfx.bomb();
      G.Fx.flash('#dff4ff', 500, .85);
      G.Game.shake(24, 800);
      G.Fx.ring(p.x, p.y, { color: '#9ff0ff', r: 20, r2: 900, life: 900, width: 14 });
      /* 清弹 + 伤害 */
      for (var i = S.eb.active - 1; i >= 0; i--) {
        var b = S.eb.items[i];
        G.Fx.burst(b.x, b.y, { n: 2, color: '#9ff0ff', spdMax: 1.6, life: 200 });
        S.eb.release(i);
      }
      S.lasers.length = 0;
      for (var k = S.en.active - 1; k >= 0; k--) {
        var e = S.en.items[k];
        e.hp -= 60 * p.power;
        e.flash = 1;
        if (e.hp <= 0) killEnemy(e);
      }
      if (S.boss && !S.boss.dying) damageBoss(220 * p.power);
      G.Game.slowmo(.35, 700);
    } else if (In.hit('skill1')) {
      G.Aud.sfx.uiDeny();      /* 没炸弹了要有反馈，别静默吞掉 */
    }

    /* 技能2：护盾 / 时间缓速（交替可用） */
    if (In.hit('skill2')) {
      if (p.shieldCd <= 0) {
        p.shieldCd = 12000;
        p.shieldLeft = 3200;
        G.Aud.sfx.shield();
        G.Fx.ring(p.x, p.y, { color: '#7CE04A', r: 8, r2: 90, life: 500 });
      } else if (p.slowCd <= 0) {
        p.slowCd = 16000;
        p.slowLeft = 2600;
        G.Aud.sfx.slowmo();
        G.Game.setTimeScale(.42);
        S.fieldSpeed = .42;
      } else G.Aud.sfx.uiDeny();
    }
  }

  function shootPlayer() {
    var p = S.player;
    var lv = Math.min(3, 1 + Math.floor(G.St.s.upgrades.power / 2));
    var col = S.asUpright ? '#FFFCF0' : '#5ce1ff';
    if (S.asUpright) lv = 3;
    function pb(dx, a, r, dmg) {
      var b = S.pb.get();
      if (!b) return;
      b.x = p.x + dx; b.y = p.y - 14;
      b.vx = Math.cos(a) * 14; b.vy = Math.sin(a) * 14;
      b.r = r; b.sizeDraw = r; b.color = col; b.kind = 'pshot';
      b.life = 900; b.rot = a + Math.PI / 2; b.spin = 0;
      b.dmg = dmg * p.power;
      b.homing = 0; b.bounce = 0; b.drag = 1; b.ax = 0; b.ay = 0;
    }
    var up = -Math.PI / 2;
    pb(-11, up, 4.6, 6); pb(11, up, 4.6, 6);
    if (lv >= 2) { pb(-24, up - .09, 4, 4); pb(24, up + .09, 4, 4); }
    if (lv >= 3) { pb(-35, up - .2, 3.6, 3.4); pb(35, up + .2, 3.6, 3.4); }
    /* IF 线：几何完美的光之雨 —— 每一发都不浪费 */
    if (S.asUpright) {
      pb(-46, up - .3, 3.6, 3.2); pb(46, up + .3, 3.6, 3.2);
      pb(0, up, 5.4, 5);
      G.Fx.spawn({ x: p.x, y: p.y - 22, vy: -3, life: 260, size: 3,
                   color: '#FFFCF0', kind: 'mote', glow: 1 });
    }
    G.Aud.sfx.shoot();
  }

  /* ---------------- TY 剪影绘制 ---------------- */
  function drawAlly(ctx) {
    var a = S.ally;
    var ch = G.charOf(a.who);
    var blink = .55 + .45 * Math.sin(S.t * .014);
    ctx.save();
    /* 危险区提示：他所在的横带 */
    ctx.globalCompositeOperation = 'lighter';
    var g = ctx.createLinearGradient(0, a.y - 60, 0, a.y + 60);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(.5, 'rgba(160,220,255,' + (.10 + .06 * blink) + ')');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(PLAY.x, a.y - 60, PLAY.w, 120);
    ctx.restore();

    /* 剪影 */
    ctx.save();
    ctx.globalAlpha = .9;
    G.Portrait.draw(ctx, ch, a.x, a.y + 44, .8, {
      emo: 'surprise', t: a.t, breathT: a.t,
      decay: G.St.s.tyDecay, tintColor: '#0a1428', tintAmt: .25,
      flip: a.vx < 0
    });
    ctx.restore();
    /* 警告 */
    ctx.save();
    ctx.globalAlpha = blink;
    Ui.text(ctx, '⚠ 停 火 ！', a.x, a.y - 62, {
      size: 24, weight: 900, align: 'center', color: '#fff', glow: 1, glowColor: '#ff2b4e'
    });
    ctx.restore();
    Ui.text(ctx, '松开射击键', a.x, a.y - 34, {
      size: 14, align: 'center', color: 'rgba(230,245,255,.9)'
    });
  }

  /* ---------------- 小怪 ---------------- */
  function updEnemies(f) {
    for (var i = S.en.active - 1; i >= 0; i--) {
      var e = S.en.items[i];
      if (e.dead) { S.en.release(i); continue; }
      e.t += S.dt;
      if (e.flash > 0) e.flash -= f * .12;
      if (e.def.move) e.def.move(e, S.api, f);
      /* 出界回收 */
      if (e.y > H + 90 || e.x < -140 || e.x > W + 140) {
        if (e.coro) e.coro.kill();
        S.en.release(i);
        continue;
      }
      /* 撞机 */
      if (!S.player.dead && S.player.inv <= 0 &&
          U.circleHit(e.x, e.y, e.r, S.player.x, S.player.y, S.player.r + 3)) {
        hitPlayer(1);
      }
    }
  }

  /* ---------------- Boss ---------------- */
  function updBoss(f) {
    var b = S.boss;
    b.t += S.dt;
    if (b.flash > 0) b.flash -= f * .1;
    if (b.invul > 0) b.invul -= f;
    /* 平滑移动到目标位 */
    b.x = U.damp(b.x, b.ux, 4, S.dt / 1000);
    b.y = U.damp(b.y, b.uy, 4, S.dt / 1000);
    if (b.def.move) b.def.move(b, S.api, f);
    /* 蓄力核心 */
    if (b.core && !b.core.broken) {
      b.core.t += S.dt;
      b.core.x = b.x; b.core.y = b.y + 76;
      if (b.core.t > b.core.warnMs + 1200) b.core = null;
    }
    /* 撞机 */
    if (!S.player.dead && S.player.inv <= 0 &&
        U.circleHit(b.x, b.y, b.r * .7, S.player.x, S.player.y, S.player.r + 4)) {
      hitPlayer(1);
    }
    S.hpGhost = U.damp(S.hpGhost, b.hp / b.maxHp, 3, S.dt / 1000);
    checkPhase();
  }

  function damageBoss(d) {
    var b = S.boss;
    if (!b || b.dying || b.invul > 0) return;
    b.hp -= d;
    b.flash = 1;
    if (b.hp <= 0) {
      b.hp = 0;
      b.dying = true;
      if (b.coro) b.coro.kill();
      S.eb.clear();
      S.lasers.length = 0;
      G.Aud.sfx.bossDown();
      G.Game.hitstop(200);
      G.Game.slowmo(.2, 2200);
      G.Fx.setDesat(.4, 900);
      var co = G.Tw.coro((function* () {
        for (var i = 0; i < 10; i++) {
          G.Fx.explode(b.x + U.rand(-70, 70), b.y + U.rand(-50, 50), { big: i % 3 === 0, color: b.def.color });
          G.Game.shake(14, 300);
          yield 12;
        }
        G.Fx.flash('#ffffff', 700, 1);
        G.Fx.shards(b.x, b.y, b.def.color, 70, { rx: 70, ry: 60, spd: 5 });
        yield 30;
        win();
      })(), S);
    }
  }
  S.damageBoss = damageBoss;

  /* ---------------- 子弹 ---------------- */
  function updBullets(f) {
    var p = S.player;
    /* 敌弹 */
    for (var i = S.eb.active - 1; i >= 0; i--) {
      var b = S.eb.items[i];
      b.life -= f;
      if (b.life <= 0) { S.eb.release(i); continue; }
      if (b.homing && !p.dead) {
        /* 锁定护航舱的导弹追护航舱，其余追玩家 */
        var hx = p.x, hy = p.y;
        if (b.toEscort && S.escort && !S.escort.dead) { hx = S.escort.x; hy = S.escort.y; }
        var ta = U.angleTo(b.x, b.y, hx, hy);
        var ca = Math.atan2(b.vy, b.vx);
        var na = ca + U.clamp(U.normAngle(ta - ca), -b.turn, b.turn) * f;
        var sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        b.vx = Math.cos(na) * sp; b.vy = Math.sin(na) * sp;
      }
      b.vx += b.ax * f; b.vy += b.ay * f;
      if (b.drag !== 1) { var dd = Math.pow(b.drag, f); b.vx *= dd; b.vy *= dd; }
      var wob = b.wobble ? Math.sin(S.t * .006 + b.wphase) * b.wobble : 0;
      b.x += (b.vx + wob) * f;
      b.y += b.vy * f;
      if (b.spin) b.rot += b.spin * f;
      else b.rot = Math.atan2(b.vy, b.vx) + Math.PI / 2;

      /* 反弹 */
      if (b.bounce > 0) {
        if (b.x < PLAY.x + 8) { b.x = PLAY.x + 8; b.vx = Math.abs(b.vx); b.bounce--; }
        else if (b.x > PLAY.x + PLAY.w - 8) { b.x = PLAY.x + PLAY.w - 8; b.vx = -Math.abs(b.vx); b.bounce--; }
        if (b.y < 8) { b.y = 8; b.vy = Math.abs(b.vy); b.bounce--; }
      }

      /* 出界 */
      if (b.y > H + 60 || b.y < -120 || b.x < PLAY.x - 120 || b.x > PLAY.x + PLAY.w + 120) {
        S.eb.release(i); continue;
      }

      /* 判定 */
      if (!p.dead) {
        var d2 = U.dist2(b.x, b.y, p.x, p.y);
        var hitR = b.r + p.r;
        if (d2 <= hitR * hitR) {
          if (p.shieldLeft > 0) {
            G.Fx.burst(b.x, b.y, { n: 3, color: '#7CE04A', spdMax: 2 });
            S.eb.release(i);
            continue;
          }
          if (p.inv <= 0) { hitPlayer(b.dmg); S.eb.release(i); continue; }
        } else if (!b.grazed && d2 <= (b.r + 22) * (b.r + 22)) {
          b.grazed = true;
          S.graze++;
          S.score += Math.round(12 * S.cfg.grazeBonus);
          G.Aud.sfx.graze();
          G.Fx.spawn({ x: b.x, y: b.y, life: 260, size: 2.4, color: '#9ff0ff', kind: 'mote', glow: 1,
                       vx: U.rand(-.4, .4), vy: U.rand(-.6, 0) });
        }
      }
      /* 护航目标受击：只有专门锁定它的导弹才算，流弹穿过不扣血。
         否则「护航舱被击毁 → 坏结局A」会变成 Boss5 的默认结果，而不是玩家失误的结果。 */
      if (b.toEscort && S.escort && !S.escort.dead &&
          U.circleHit(b.x, b.y, b.r, S.escort.x, S.escort.y, S.escort.r)) {
        S.escort.hp -= b.dmg * 3;
        S.escort.hurt = 1;
        G.Fx.burst(b.x, b.y, { n: 6, color: '#E0E6ED' });
        G.Game.shake(6, 200);
        S.eb.release(i);
        if (S.escort.hp <= 0) escortDown();
        continue;
      }
    }

    /* 己弹 */
    for (var k = S.pb.active - 1; k >= 0; k--) {
      var pbu = S.pb.items[k];
      pbu.life -= f;
      pbu.x += pbu.vx * f; pbu.y += pbu.vy * f;
      if (pbu.life <= 0 || pbu.y < -40 || pbu.x < -40 || pbu.x > W + 40) { S.pb.release(k); continue; }
      var hit = false;
      /* vs 可击落的敌弹（锁定护航舱的导弹）—— 拦截是玩家的护航手段 */
      for (var ki = 0; ki < S.eb.active; ki++) {
        var kb = S.eb.items[ki];
        if (!kb.killable) continue;
        if (!U.circleHit(pbu.x, pbu.y, pbu.r + 3, kb.x, kb.y, kb.r + 3)) continue;
        kb.khp = (kb.khp || 1) - pbu.dmg;
        G.Fx.burst(pbu.x, pbu.y, { n: 3, color: '#9ff0ff', spdMax: 1.6, life: 200 });
        if (kb.khp <= 0) {
          G.Fx.explode(kb.x, kb.y, { color: '#ffb15e' });
          G.Aud.sfx.hit();
          S.score += Math.round(40 * S.cfg.grazeBonus);
          S.eb.release(ki);
        }
        S.pb.release(k);
        hit = true;
        break;
      }
      if (hit) continue;
      /* vs TY 剪影 —— 打中即触发坏结局E。
         只有「还在扣扳机」才算：警告一响就松手的玩家，不该被已经出膛的那几发弹害死。
         spec 的条件是「玩家继续射击命中」，这里按字面实现。 */
      if (S.ally && U.circleHit(pbu.x, pbu.y, pbu.r, S.ally.x, S.ally.y, S.ally.r)) {
        S.pb.release(k);
        if (In.down('fire') || In.mdown) allyHit();
        continue;
      }
      /* vs 小怪 */
      for (var m = 0; m < S.en.active; m++) {
        var e = S.en.items[m];
        if (e.dead) continue;
        if (!U.circleHit(pbu.x, pbu.y, pbu.r, e.x, e.y, e.r)) continue;
        /* 护盾兵：下方来的子弹被盾挡住，但盾自身会被打碎。
           以前 shieldDown 只有读没有写，等于枪械完全无法击破，只能靠炸弹。 */
        if (e.def.id === 'shielder' && !e.shieldDown) {
          var ang = U.angleTo(e.x, e.y, pbu.x, pbu.y);
          if (ang > .1 && ang < Math.PI - .1) {
            if (e.shieldHp === undefined) e.shieldHp = 40 * (S.cfg.mobHp || 1);
            e.shieldHp -= pbu.dmg;
            if (e.shieldHp <= 0) {
              e.shieldDown = true;
              G.Fx.burst(e.x, e.y + e.r, { n: 16, color: '#a8fff0', spdMax: 4.2, life: 420 });
              G.Fx.ring(e.x, e.y, { color: '#a8fff0', r: e.r, r2: e.r * 3.2, life: 340, width: 4 });
              G.Aud.sfx.hit();
            } else {
              G.Fx.burst(pbu.x, pbu.y, { n: 3, color: '#a8fff0', spdMax: 1.6 });
              G.Aud.sfx.graze();
            }
            hit = true; break;
          }
        }
        e.hp -= pbu.dmg;
        e.flash = 1;
        G.Fx.burst(pbu.x, pbu.y, { n: 2, color: '#bfe8ff', spdMax: 1.8, life: 160 });
        G.Aud.sfx.hit();
        if (e.hp <= 0) killEnemy(e);
        hit = true;
        break;
      }
      /* vs Boss 核心 */
      if (!hit && S.boss && S.boss.core && !S.boss.core.broken) {
        var cc = S.boss.core;
        if (U.circleHit(pbu.x, pbu.y, pbu.r, cc.x, cc.y, cc.r)) {
          cc.hp -= pbu.dmg * 1.6;
          G.Fx.burst(pbu.x, pbu.y, { n: 3, color: '#ffe9a8', spdMax: 2 });
          G.Aud.sfx.hit();
          if (cc.hp <= 0) {
            cc.broken = true;
            G.Fx.flash('#ffe9a8', 500, .9);
            G.Game.shake(18, 600);
            G.Aud.sfx.bomb();
            if (S.boss.def.onCoreBreak) S.boss.def.onCoreBreak(S.api, S.boss);
          }
          hit = true;
        }
      }
      /* vs Boss */
      if (!hit && S.boss && !S.boss.dying) {
        if (U.circleHit(pbu.x, pbu.y, pbu.r, S.boss.x, S.boss.y, S.boss.r * .82)) {
          damageBoss(pbu.dmg);
          G.Fx.burst(pbu.x, pbu.y, { n: 2, color: '#bfe8ff', spdMax: 1.6, life: 150 });
          if (Math.random() < .3) G.Aud.sfx.hit();
          hit = true;
        }
      }
      if (hit) S.pb.release(k);
    }
  }

  /* ---------------- 激光 / 预警 ---------------- */
  function updLasers(dt) {
    var p = S.player;
    for (var i = S.lasers.length - 1; i >= 0; i--) {
      var l = S.lasers[i];
      l.t += dt;
      if (l.rotate) l.a += l.rotate * dt / 16.67;
      if (l.follow) { l.x = l.follow.x; l.y = l.follow.y; }
      if (l.t > l.ms) { S.lasers.splice(i, 1); continue; }
      var grow = U.clamp01(l.t / 90);
      l.grow = grow;
      if (p.dead || p.inv > 0 || p.shieldLeft > 0) continue;
      /* 点到线段距离 */
      var dx = Math.cos(l.a), dy = Math.sin(l.a);
      var px2 = p.x - l.x, py2 = p.y - l.y;
      var proj = px2 * dx + py2 * dy;
      if (proj < 0 || proj > l.len) continue;
      var perp = Math.abs(px2 * dy - py2 * dx);
      if (perp < l.w * .5 * grow + p.r) hitPlayer(l.dmg);
    }
  }
  function updWarns(dt) {
    for (var i = S.warns.length - 1; i >= 0; i--) {
      var w2 = S.warns[i];
      w2.t += dt;
      if (w2.src) { w2.x = w2.src.x; w2.y = w2.src.y; if (w2.src.lookA !== undefined) w2.a = w2.src.lookA; }
      if (w2.t > w2.dur) S.warns.splice(i, 1);
    }
  }

  /* ---------------- 护航目标 ---------------- */
  function updEscort(f) {
    var e = S.escort;
    if (e.dead) return;
    e.t += S.dt;
    e.x = 950 + Math.sin(e.t * .0006) * 105;
    e.y = 152 + Math.cos(e.t * .0009) * 44;
    if (e.warn > 0) e.warn = Math.max(0, e.warn - S.dt / 2200);
    if (e.hurt > 0) e.hurt = Math.max(0, e.hurt - S.dt / 400);
    /* 没有导弹在飞时缓慢自修，避免一次失手就注定坏结局A */
    var incoming = false;
    for (var i = 0; i < S.eb.active; i++) if (S.eb.items[i].toEscort) { incoming = true; break; }
    if (!incoming && e.hp < e.maxHp) e.hp = Math.min(e.maxHp, e.hp + S.dt * .006);
  }
  function escortDown() {
    var e = S.escort;
    if (e.dead) return;
    e.dead = true;
    G.Fx.explode(e.x, e.y, { big: true, color: '#E0E6ED' });
    G.Game.shake(26, 900);
    G.Fx.flash('#ffffff', 500, .8);
    G.St.setFlag('tyFleshLost');
    G.St.setFlag('tyAlive', false);
    G.St.kill('ty');
    S.over = true; S.won = false;
    S.resultT = 0;
    S._terminal = 'badA';
  }

  /* ---------------- 受伤 / 死亡 ---------------- */
  function hitPlayer(d) {
    var p = S.player;
    if (p.dead || p.inv > 0) return;
    p.hp -= d;
    p.inv = 900;
    G.Game.hitstop(70);          /* 被打到必须有一下"停"，否则容易根本没注意到掉血 */
    G.Aud.sfx.playerHit();
    G.Game.shake(16, 400);
    G.Fx.flash('#ff2b4e', 260, .4);
    G.Fx.setRedEdge(1, 200);
    G.Tw.delay(400, function () { G.Fx.setRedEdge(0, 700); });
    G.Fx.splash(p.x, p.y, -Math.PI / 2, '#7fdcff');
    if (p.hp <= 0) {
      p.dead = true;
      p.lives--;
      p.respawnT = 1500;
      G.Fx.explode(p.x, p.y, { big: true, color: '#4FC3F7' });
      G.Fx.shards(p.x, p.y, '#4FC3F7', 40, { rx: 20, ry: 20, spd: 4 });
      G.Game.shake(30, 900);
      G.Game.slowmo(.25, 900);
      if (p.lives <= 0) { p.respawnT = 1400; }
    }
  }

  function win() {
    if (S.over) return;
    S.over = true; S.won = true; S.resultT = 0;
    S.clearBanner = 1;
    stopScripts();
    if (S.player) S.player.inv = Math.max(S.player.inv, 999999);   /* 结算画面不该再被打死 */
    G.Aud.playBgm('hope', { fade: 900 });
    G.Fx.setDesat(0, 600);
    var pts = Math.round((S.score * .05 + 120) * S.cfg.reward);
    G.St.addPoints(pts);
    S._pts = pts;
    if (S.kind === 'boss') {
      G.St.s.bossCleared[S.battleId] = true;
      G.Save.data.stats.bossKills++;
      G.Save.save();
    }
  }
  function lose() {
    if (S.over) return;
    S.over = true; S.won = false; S.resultT = 0;
    stopScripts();
    G.Aud.stopBgm(600);
    G.Fx.setDesat(.85, 900);
    G.Fx.setRedEdge(.6, 600);
  }

  /* 战斗一结束就掐掉所有还在跑的弹幕脚本。
     以前 win()/lose() 不做这件事，结算的 4.2 秒里 Boss 继续开火、
     擦弹继续加分，玩家还能在 CLEAR 横幅后面被打死。 */
  function stopScripts() {
    if (S.boss && S.boss.coro) { S.boss.coro.kill(); S.boss.coro = null; }
    if (S.waveCo) { S.waveCo.kill(); S.waveCo = null; }
    for (var i = 0; i < S.en.active; i++) {
      var e = S.en.items[i];
      if (e && e.coro) { e.coro.kill(); e.coro = null; }
    }
    S.lasers.length = 0;
    S.warns.length = 0;
  }

  function finishBattle() {
    if (S._finished) return;
    S._finished = true;
    G.Game.setTimeScale(1);
    if (S.won) {
      if (S._onWin) S._onWin();
      else G.Story.onBattleWin();
    } else if (S._terminal) {
      var t = S._terminal; S._terminal = null;
      G.Loop.terminal(t, { boss: S.battleId });
    } else if (S._onLose) {
      S._onLose();
    } else {
      G.Story.onBattleLose({
        boss: S.kind === 'boss' ? S.battleId : null,
        bossName: S.boss ? S.boss.def.name : null,
        phase: S.bossPhase
      });
    }
  }
  S._finished = false;

  /* ============================================================
     绘制
     ============================================================ */
  S.draw = function (ctx) {
    S.field.draw(ctx, S.dt, S.fieldSpeed);
    /* 可读性压层：只作用在战斗区内，把背景的明度和饱和度压下去。
       弹幕游戏的配色规则是「背景低明度低饱和 / 弹幕高明度高饱和」——
       核心空域那种满屏高饱和血红背景会让暖色敌弹完全糊在里面。
       这里不改区域的色彩识别（天空、外围、雾都保留），只让玩家真正要读的
       那块画面退到后面去。 */
    ctx.save();
    ctx.beginPath();
    ctx.rect(PLAY.x, 0, PLAY.w, H);
    ctx.clip();
    ctx.globalCompositeOperation = 'saturation';
    ctx.globalAlpha = .42;
    ctx.fillStyle = '#808080';
    ctx.fillRect(PLAY.x, 0, PLAY.w, H);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    var sc = ctx.createLinearGradient(0, 0, 0, H);
    sc.addColorStop(0, 'rgba(4,6,12,.30)');
    sc.addColorStop(.55, 'rgba(4,6,12,.42)');
    sc.addColorStop(1, 'rgba(4,6,12,.52)');
    ctx.fillStyle = sc;
    ctx.fillRect(PLAY.x, 0, PLAY.w, H);
    ctx.restore();

    /* IF 线：纯白光之雨铺满战场 */
    if (S.asUpright && G.Paint.lightRain) {
      ctx.save();
      ctx.globalAlpha = .55;
      G.Paint.lightRain(ctx, 1, {}, S.t);
      ctx.restore();
    }

    /* 战斗区外的遮罩（HUD 背板） */
    ctx.save();
    ctx.fillStyle = 'rgba(4,7,14,.72)';
    ctx.fillRect(0, 0, PLAY.x, H);
    ctx.fillRect(PLAY.x + PLAY.w, 0, W - PLAY.x - PLAY.w, H);
    ctx.strokeStyle = 'rgba(120,200,255,.28)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(PLAY.x, 0); ctx.lineTo(PLAY.x, H);
    ctx.moveTo(PLAY.x + PLAY.w, 0); ctx.lineTo(PLAY.x + PLAY.w, H);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.rect(PLAY.x, 0, PLAY.w, H);
    ctx.clip();

    drawWarns(ctx);
    if (S.escort) drawEscort(ctx);
    drawEnemies(ctx);
    if (S.boss) drawBoss(ctx);
    drawLasers(ctx);
    drawPlayerBullets(ctx);
    if (S.ally) drawAlly(ctx);
    if (!S.player.dead) drawPlayer(ctx);
    drawEnemyBullets(ctx);

    ctx.restore();

    G.Game.updateBlurBuf();
    drawHud(ctx);
    if (S.intro && S.introT < 2400) drawIntro(ctx);
    if (S.bark) drawBark(ctx);
    if (S.over) drawResult(ctx);
  };

  function drawEnemyBullets(ctx) {
    ctx.save();
    for (var i = 0; i < S.eb.active; i++) {
      var b = S.eb.items[i];
      var sp = bulletSprite(b.kind, b.color, b.sizeDraw);
      if (b.kind === 'orb' || b.kind === 'square' || b.kind === 'ringlet') {
        ctx.drawImage(sp.img, b.x - sp.pad, b.y - sp.pad);
      } else {
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rot);
        ctx.drawImage(sp.img, -sp.pad, -sp.pad);
        ctx.restore();
      }
    }
    ctx.restore();
  }

  function drawPlayerBullets(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < S.pb.active; i++) {
      var b = S.pb.items[i];
      var sp = bulletSprite(b.kind || 'pshot', b.color, b.sizeDraw);
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rot);
      ctx.drawImage(sp.img, -sp.pad, -sp.pad);
      ctx.restore();
    }
    ctx.restore();
  }

  function drawEnemies(ctx) {
    for (var i = 0; i < S.en.active; i++) {
      var e = S.en.items[i];
      if (e.dead) continue;
      ctx.save();
      ctx.translate(e.x, e.y);
      /* 血条（大怪才显示） */
      if (e.maxHp > 40 && e.hp < e.maxHp) {
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,.5)';
        ctx.fillRect(-e.r, -e.r - 14, e.r * 2, 4);
        ctx.fillStyle = '#ff7a8a';
        ctx.fillRect(-e.r, -e.r - 14, e.r * 2 * (e.hp / e.maxHp), 4);
        ctx.restore();
      }
      e.def.draw(ctx, e, e.t);
      ctx.restore();
    }
  }

  function drawBoss(ctx) {
    var b = S.boss;
    ctx.save();
    ctx.translate(b.x, b.y);
    if (b.def.draw) b.def.draw(ctx, b, b.t);
    if (b.flash > 0) {
      ctx.globalAlpha = b.flash * .6;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(0, 0, b.r, 0, U.TAU); ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    /* 蓄力核心 */
    if (b.core && !b.core.broken) {
      var c = b.core;
      var pulse = .5 + .5 * Math.sin(S.t * .012);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      var g = G.Fx.glowSprite('#ffe9a8');
      var sz = c.r * (5 + pulse * 2);
      ctx.globalAlpha = .8;
      ctx.drawImage(g, c.x - sz / 2, c.y - sz / 2, sz, sz);
      ctx.restore();
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(S.t * .004);
      ctx.strokeStyle = '#fff6d0'; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -c.r); ctx.lineTo(c.r * .8, 0); ctx.lineTo(0, c.r); ctx.lineTo(-c.r * .8, 0);
      ctx.closePath(); ctx.stroke();
      ctx.fillStyle = U.rgba('#ffe9a8', .45);
      ctx.fill();
      ctx.restore();
      /* 核心血条 + 提示 */
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,.55)';
      ctx.fillRect(c.x - 46, c.y + 34, 92, 6);
      ctx.fillStyle = '#ffe9a8';
      ctx.fillRect(c.x - 46, c.y + 34, 92 * U.clamp01(c.hp / c.maxHp), 6);
      ctx.restore();
      Ui.text(ctx, '击破蓄力核心！', c.x, c.y + 62, {
        size: 15, weight: 700, align: 'center', color: '#fff6d0', glow: 1, glowColor: '#ffb15e'
      });
    }
  }

  function drawLasers(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < S.lasers.length; i++) {
      var l = S.lasers[i];
      var fade = l.t > l.ms - 90 ? (l.ms - l.t) / 90 : 1;
      var w2 = l.w * l.grow * fade;
      ctx.save();
      ctx.translate(l.x, l.y);
      ctx.rotate(l.a);
      var g = ctx.createLinearGradient(0, -w2, 0, w2);
      g.addColorStop(0, U.rgba(l.color, 0));
      g.addColorStop(.5, U.rgba('#ffffff', .95 * fade));
      g.addColorStop(1, U.rgba(l.color, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, -w2, l.len, w2 * 2);
      var g2 = ctx.createLinearGradient(0, -w2 * 3, 0, w2 * 3);
      g2.addColorStop(0, U.rgba(l.color, 0));
      g2.addColorStop(.5, U.rgba(l.color, .55 * fade));
      g2.addColorStop(1, U.rgba(l.color, 0));
      ctx.fillStyle = g2;
      ctx.fillRect(0, -w2 * 3, l.len, w2 * 6);
      ctx.restore();
      /* 枪口闪光 */
      var gs = G.Fx.glowSprite(l.color);
      var sz = w2 * 10;
      ctx.globalAlpha = fade;
      ctx.drawImage(gs, l.x - sz / 2, l.y - sz / 2, sz, sz);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  function drawWarns(ctx) {
    ctx.save();
    for (var i = 0; i < S.warns.length; i++) {
      var w2 = S.warns[i];
      var p = U.clamp01(w2.t / w2.dur);
      var a = .18 + .3 * Math.abs(Math.sin(w2.t * .02));
      ctx.save();
      ctx.translate(w2.x, w2.y);
      ctx.rotate(w2.a);
      ctx.globalCompositeOperation = 'lighter';
      var g = ctx.createLinearGradient(0, 0, 1100, 0);
      g.addColorStop(0, 'rgba(255,60,80,' + a + ')');
      g.addColorStop(1, 'rgba(255,60,80,0)');
      ctx.fillStyle = g;
      var hw = 2 + p * 4;
      ctx.fillRect(0, -hw, 1100, hw * 2);
      ctx.restore();
    }
    ctx.restore();
  }

  function drawEscort(ctx) {
    var e = S.escort;
    if (e.dead) return;
    ctx.save();
    ctx.translate(e.x, e.y);
    /* 护航舱 */
    var g = G.Fx.glowSprite('#E0E6ED');
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = .5;
    ctx.drawImage(g, -70, -70, 140, 140);
    ctx.restore();
    ctx.fillStyle = '#3a4450';
    U.roundRect(ctx, -26, -18, 52, 36, 16); ctx.fill();
    ctx.strokeStyle = '#E0E6ED'; ctx.lineWidth = 2.4; ctx.stroke();
    ctx.fillStyle = U.rgba('#9fd8ff', .7);
    U.roundRect(ctx, -14, -10, 28, 20, 8); ctx.fill();
    ctx.restore();
    /* 血条 */
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.6)';
    ctx.fillRect(e.x - 50, e.y - 42, 100, 7);
    ctx.fillStyle = e.hp / e.maxHp > .4 ? '#E0E6ED' : '#ff5f7a';
    ctx.fillRect(e.x - 50, e.y - 42, 100 * U.clamp01(e.hp / e.maxHp), 7);
    ctx.restore();
    Ui.text(ctx, 'TY 护航舱 —— 必须保护', e.x, e.y - 52, {
      size: 13, align: 'center', color: '#dfe8f2', glow: 1, glowColor: '#8fa8c0'
    });
    /* 来袭导弹预警：让玩家知道该去拦什么 */
    if (e.warn > 0 || e.hurt > 0) {
      var pw = .5 + .5 * Math.sin(S.t * .02);
      ctx.save();
      ctx.strokeStyle = U.rgba('#ff4a5e', (.45 + pw * .5) * Math.max(e.warn, e.hurt));
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(e.x, e.y, 42 + pw * 8, 0, U.TAU); ctx.stroke();
      ctx.restore();
      Ui.text(ctx, '导弹锁定 —— 用射击拦截！', e.x, e.y + 62, {
        size: 14, weight: 600, align: 'center', color: '#ffd0d8',
        glow: 1, glowColor: '#ff4a5e', alpha: Math.max(e.warn, e.hurt)
      });
    }
  }

  function drawPlayer(ctx) {
    var p = S.player;
    var asUp = S.asUpright;
    var mainCol = asUp ? '#FFE9A8' : '#4FC3F7';
    var blink = p.inv > 0 && Math.floor(S.t / 70) % 2 === 0;
    ctx.save();
    ctx.globalAlpha = blink ? .45 : 1;
    ctx.translate(p.x, p.y);
    /* 冷色底光：暖色弹雨里也一眼能找到自机 */
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    var pgs = G.Fx.glowSprite(asUp ? '#ffe9a8' : '#6fd8ff');
    var pz = 96;
    ctx.globalAlpha = .34 + .06 * Math.sin(S.t * .006);
    ctx.drawImage(pgs, -pz / 2, -pz / 2 + 2, pz, pz);
    ctx.restore();
    /* 护盾 */
    if (p.shieldLeft > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      var sa = .35 + .25 * Math.sin(S.t * .01);
      ctx.strokeStyle = U.rgba('#7CE04A', sa + .35);
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, 34, 0, U.TAU); ctx.stroke();
      ctx.strokeStyle = U.rgba('#7CE04A', sa * .5);
      ctx.lineWidth = 12;
      ctx.beginPath(); ctx.arc(0, 0, 34, 0, U.TAU); ctx.stroke();
      ctx.restore();
    }
    /* 机体 */
    var tilt = U.clamp(p.vx * .04, -.3, .3);
    ctx.rotate(tilt);
    var g = ctx.createLinearGradient(0, -22, 0, 20);
    if (asUp) {
      g.addColorStop(0, '#ffffff');
      g.addColorStop(.45, '#FFE9A8');
      g.addColorStop(1, '#c8a040');
    } else {
      g.addColorStop(0, '#dff4ff');
      g.addColorStop(.45, '#4FC3F7');
      g.addColorStop(1, '#1a6a9a');
    }
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, -24);
    ctx.lineTo(9, -6); ctx.lineTo(24, 10); ctx.lineTo(10, 8);
    ctx.lineTo(6, 18); ctx.lineTo(-6, 18); ctx.lineTo(-10, 8);
    ctx.lineTo(-24, 10); ctx.lineTo(-9, -6);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(10,40,70,.9)'; ctx.lineWidth = 1.6; ctx.stroke();
    /* 驾驶舱 */
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.beginPath(); ctx.ellipse(0, -8, 4, 7, 0, 0, U.TAU); ctx.fill();
    /* 引擎 */
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    var fl = .7 + Math.random() * .3;
    var fg = ctx.createLinearGradient(0, 16, 0, 16 + 26 * fl);
    fg.addColorStop(0, 'rgba(200,245,255,.95)');
    fg.addColorStop(1, 'rgba(80,190,255,0)');
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.moveTo(-5, 16); ctx.lineTo(5, 16); ctx.lineTo(0, 16 + 28 * fl);
    ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.restore();

    /* 点判定 */
    if (G.Save.settings().showHitbox || p.focus) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      var gs = G.Fx.glowSprite('#ff4a6a');
      var sz = p.focus ? 34 : 22;
      ctx.globalAlpha = p.focus ? .95 : .6;
      ctx.drawImage(gs, p.x - sz / 2, p.y - sz / 2, sz, sz);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, U.TAU); ctx.fill();
      ctx.strokeStyle = '#ff4a6a'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 1.6, 0, U.TAU); ctx.stroke();
      /* 低速时显示判定环 */
      if (p.focus) {
        ctx.strokeStyle = 'rgba(255,255,255,.35)';
        ctx.lineWidth = 1;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(S.t * .003);
        ctx.beginPath();
        for (var i = 0; i < 8; i++) {
          var a = i / 8 * U.TAU;
          ctx.moveTo(Math.cos(a) * 14, Math.sin(a) * 14);
          ctx.lineTo(Math.cos(a) * 20, Math.sin(a) * 20);
        }
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    }
  }

  /* ---------------- HUD ---------------- */
  function drawHud(ctx) {
    var p = S.player, s = G.St.s;
    /* 左栏 */
    Ui.glass(ctx, 12, 14, 166, 250, { r: 12, accent: '#6fd8ff', alpha: .3, glow: .8, corners: true, tintColor: '#0c1830' });
    Ui.text(ctx, '机体', 28, 44, { size: 13, color: '#9fd8ff' });
    Ui.tube(ctx, 28, 52, 134, 16, p.hp / p.maxHp, { color: p.hp / p.maxHp > .4 ? '#5ce1ff' : '#ff5f7a' });
    Ui.text(ctx, '生命', 28, 96, { size: 13, color: '#9fd8ff' });
    for (var i = 0; i < Math.max(0, p.lives); i++) {
      ctx.save();
      ctx.translate(34 + i * 22, 112);
      ctx.fillStyle = '#4FC3F7';
      ctx.beginPath();
      ctx.moveTo(0, -8); ctx.lineTo(6, 6); ctx.lineTo(0, 3); ctx.lineTo(-6, 6);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    Ui.text(ctx, '炸弹 ×' + p.bombs, 28, 148, { size: 14, color: p.bombs > 0 ? '#ffd479' : '#6a7a88' });
    /* 技能冷却 */
    Ui.text(ctx, '护盾 C', 28, 176, { size: 12, color: '#9fc4dd' });
    Ui.tube(ctx, 28, 182, 134, 10, p.shieldCd > 0 ? 1 - p.shieldCd / 12000 : 1, { color: '#7CE04A' });
    Ui.text(ctx, '缓速 C', 28, 210, { size: 12, color: '#9fc4dd' });
    Ui.tube(ctx, 28, 216, 134, 10, p.slowCd > 0 ? 1 - p.slowCd / 16000 : 1, { color: '#c9a8ff' });
    Ui.text(ctx, '炸弹 X', 28, 244, { size: 12, color: '#9fc4dd' });

    /* 右栏 */
    Ui.glass(ctx, W - 178, 14, 166, 230, { r: 12, accent: '#6fd8ff', alpha: .3, glow: .8, corners: true, tintColor: '#0c1830' });
    Ui.text(ctx, '得分', W - 162, 44, { size: 13, color: '#9fd8ff' });
    Ui.text(ctx, '' + S.score, W - 28, 44, { size: 18, weight: 700, align: 'right', color: '#eaf6ff' });
    Ui.text(ctx, '擦弹', W - 162, 74, { size: 13, color: '#9fd8ff' });
    Ui.text(ctx, '' + S.graze, W - 28, 74, { size: 16, weight: 600, align: 'right', color: '#9ff0ff' });
    Ui.text(ctx, '击坠', W - 162, 102, { size: 13, color: '#9fd8ff' });
    Ui.text(ctx, '' + S.kills, W - 28, 102, { size: 16, weight: 600, align: 'right', color: '#eaf6ff' });
    var dc = G.diffCfg();
    Ui.badge(ctx, W - 20, 122, dc.label + '  ' + dc.reward + '×', { accent: dc.color, align: 'right', size: 13 });
    Ui.text(ctx, '回归 ×' + s.loopCount, W - 162, 186, { size: 13, color: '#c9a8ff' });
    Ui.text(ctx, '精神 ' + Math.round(s.sanity), W - 162, 210, {
      size: 13, color: s.sanity > 40 ? '#9fc4dd' : '#ff9f9f' });
    if (S.kind === 'stage') {
      Ui.text(ctx, '波次 ' + S.waveIdx, W - 162, 234, { size: 13, color: '#ffd479' });
    }

    /* Boss 血条 */
    if (S.boss) drawBossBar(ctx);

    /* 底部操作提示 */
    Ui.text(ctx, 'Z 射击   X 炸弹   C 护盾/缓速   Shift 低速', 640, 710,
            { size: 12, align: 'center', color: 'rgba(180,212,235,.45)' });
  }

  /* 血条刻度画在真实的转阶段血量上，而不是均分。
     以前 boss2 显示 33/67%，实际阈值是 62/26% —— 直接误导走位决策。 */
  function phaseMarks(b) {
    if (b._marks) return b._marks;
    var m = [];
    for (var i = 1; i < b.def.phases.length; i++) {
      var hf = b.def.phases[i].hpFrom;
      if (typeof hf === 'number') m.push(hf);
    }
    b._marks = m;
    return m;
  }

  function drawBossBar(ctx) {
    var b = S.boss;
    var x = PLAY.x + 40, y = 22, w = PLAY.w - 80;
    Ui.text(ctx, b.def.name, x, y + 2, { size: 17, weight: 700, color: b.def.color, glow: 1, glowColor: b.def.color });
    Ui.text(ctx, b.def.title || '', x + w, y + 2, { size: 12, align: 'right', color: 'rgba(200,225,245,.7)' });
    Ui.tube(ctx, x, y + 10, w, 18, b.hp / b.maxHp, {
      color: b.def.color, ghost: S.hpGhost, segments: phaseMarks(b)
    });
    /* 阶段标记 */
    Ui.text(ctx, '阶段 ' + (b.phase + 1) + ' / ' + b.def.phases.length, x, y + 46,
            { size: 12, color: 'rgba(200,225,245,.8)' });
  }

  function drawIntro(ctx) {
    var p = S.introT / 2400;
    var a = p < .12 ? p / .12 : (p > .82 ? (1 - p) / .18 : 1);
    ctx.save();
    ctx.globalAlpha = U.clamp01(a);
    var w = 700;
    Ui.glass(ctx, 640 - w / 2, 300, w, 84, { r: 14, accent: '#ffd479', alpha: .34, glow: 1.4, corners: true, tintColor: '#2a2010' });
    Ui.spaced(ctx, S.intro, 640, 344, { size: 24, weight: 700, align: 'center', spacing: 3, color: '#fff6d8', glow: 1, glowColor: '#ffb15e' });
    ctx.restore();
  }

  function drawBark(ctx) {
    var ch = G.charOf(S.bark.who);
    var txt = String(S.bark.text).replace(/\{[^}]*\}/g, '');
    var a = U.clamp01(S.barkT / 400);
    ctx.save();
    ctx.globalAlpha = a;
    var w = 0;
    ctx.font = '600 17px ' + G.FONT;
    w = ctx.measureText(txt).width + 130;
    /* 台词框躲开自机：自机在左半屏就靠右贴，反之靠左，别盖住玩家脚下的走位空间 */
    var px = S.player ? S.player.x : 640;
    var x = px < 640 ? Math.min(PLAY.x + PLAY.w - w - 12, 1090 - w - 12) : PLAY.x + 12;
    if (w > PLAY.w - 24) x = 640 - w / 2;
    var y = 606;
    Ui.glass(ctx, x, y, w, 56, { r: 12, accent: ch.color, alpha: .34, glow: 1.2, tintColor: U.shade(ch.color, -.76) });
    G.Portrait.thumb(ctx, ch, x + 34, y + 28, 44, { emo: ch.defaultEmo, decay: S.bark.who === 'ty' ? G.St.s.tyDecay : 0 });
    Ui.text(ctx, ch.name, x + 66, y + 22, { size: 12, color: ch.color });
    Ui.text(ctx, txt, x + 66, y + 44, { size: 17, weight: 600, color: '#f0f7ff' });
    ctx.restore();
  }

  function drawResult(ctx) {
    var a = U.clamp01(S.resultT / 500);
    ctx.save();
    ctx.globalAlpha = a * .7;
    ctx.fillStyle = '#04060d';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = a;
    if (S.won) {
      Ui.spaced(ctx, 'CLEAR', 640, 280, {
        size: 66, weight: 900, align: 'center', spacing: 14,
        gradient: ['#ffffff', '#8fd8ff'], glow: 1, glowColor: '#4fa8ff'
      });
      var rows = [
        ['得分', '' + S.score],
        ['擦弹', '' + S.graze],
        ['击坠', '' + S.kills],
        ['情报点', '+' + (S._pts || 0)]
      ];
      for (var i = 0; i < rows.length; i++) {
        Ui.text(ctx, rows[i][0], 540, 360 + i * 34, { size: 16, color: '#9fc4dd' });
        Ui.text(ctx, rows[i][1], 740, 360 + i * 34, { size: 18, weight: 700, align: 'right', color: '#eaf6ff' });
      }
      Ui.text(ctx, '按 Z / Enter 继续', 640, 560, { size: 15, align: 'center', color: 'rgba(200,225,245,.7)' });
    } else {
      var msg = S._terminal ? '……能力没有反应。' : '你死了。';
      Ui.spaced(ctx, S._terminal ? '无 法 回 归' : '死 亡 回 归', 640, 300, {
        size: S._terminal ? 54 : 48, weight: 900, align: 'center', spacing: 12,
        gradient: S._terminal ? ['#ffffff', '#ff5f7a'] : ['#ffffff', '#c9a8ff'],
        glow: 1, glowColor: S._terminal ? '#E0244A' : '#8a6ad0'
      });
      Ui.text(ctx, msg, 640, 372, { size: 19, align: 'center', color: '#dfe8f2' });
      if (!S._terminal) {
        Ui.text(ctx, '时间将回溯到存档点。你和 TY 会记得这一切。', 640, 410,
                { size: 15, align: 'center', color: 'rgba(200,225,245,.75)' });
      }
      Ui.text(ctx, '按 Z / Enter 继续', 640, 560, { size: 15, align: 'center', color: 'rgba(200,225,245,.6)' });
    }
    ctx.restore();
  }

  S.debugInfo = function () {
    return ['eb ' + S.eb.active + '/' + S.eb.cap, 'pb ' + S.pb.active, 'en ' + S.en.active,
            'lasers ' + S.lasers.length,
            'boss ' + (S.boss ? (S.boss.def.id + ' p' + S.boss.phase + ' ' + Math.round(S.boss.hp)) : '-')];
  };

  G.Sc.register('danmaku', S);

})(window);
