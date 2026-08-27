/* ===========================================================
   enemies.js — 12 种小怪：外观 + 移动 + 攻击「三位一体」
   接口：
     draw(ctx, e, t)        绘制
     move(e, api, f)        每帧移动（f = 帧倍率）
     ai(e, api)             generator：攻击脚本（yield 帧数）
     onDeath(e, api)        死亡特殊行为
   =========================================================== */
(function (root) {
  'use strict';
  var G = root.G, U = G.U;

  var E = G.Enemies = {};

  /* ---------- 通用绘制件 ---------- */
  function glowAt(ctx, x, y, r, color, a) {
    var s = G.Fx.glowSprite(color);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = a === undefined ? .7 : a;
    ctx.drawImage(s, x - r, y - r, r * 2, r * 2);
    ctx.restore();
  }
  function outline(ctx, col, lw) {
    ctx.strokeStyle = U.rgba(U.shade(col, -.55), .9);
    ctx.lineWidth = lw || 2;
    ctx.stroke();
  }
  function hitFlash(ctx, e) {
    if (e.flash > 0) {
      ctx.globalAlpha = e.flash;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(0, 0, e.r * 1.25, 0, U.TAU); ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  /* ============================================================
     1. 自爆蜂 —— 小型黄色球体+翅膀 / 直线冲锋 / 靠近自爆
     ============================================================ */
  E.bee = {
    id: 'bee', name: '自爆蜂', hp: 14, r: 13, score: 90, color: '#FFE23A',
    draw: function (ctx, e, t) {
      var c = e.def.color;
      glowAt(ctx, 0, 0, e.r * 2.4, c, .5);
      /* 翅膀 */
      var w = Math.sin(t * .06) * .5 + .8;
      ctx.fillStyle = 'rgba(255,255,255,.42)';
      [-1, 1].forEach(function (s) {
        ctx.save();
        ctx.scale(s, 1);
        ctx.beginPath();
        ctx.ellipse(e.r * .9, -e.r * .3, e.r * 1.1, e.r * .38 * w, -.5, 0, U.TAU);
        ctx.fill();
        ctx.restore();
      });
      /* 本体 */
      var g = ctx.createRadialGradient(-e.r * .3, -e.r * .3, 1, 0, 0, e.r);
      g.addColorStop(0, U.shade(c, .5));
      g.addColorStop(1, U.shade(c, -.25));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, e.r, 0, U.TAU); ctx.fill();
      outline(ctx, c);
      /* 条纹 */
      ctx.strokeStyle = 'rgba(40,24,0,.7)';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-e.r * .7, e.r * .2); ctx.lineTo(e.r * .7, e.r * .2); ctx.stroke();
      /* 引爆倒计时闪烁 */
      if (e.armed) {
        var f = Math.abs(Math.sin(t * .03));
        ctx.fillStyle = 'rgba(255,60,40,' + (.35 + f * .5) + ')';
        ctx.beginPath(); ctx.arc(0, 0, e.r * .55, 0, U.TAU); ctx.fill();
      }
      hitFlash(ctx, e);
    },
    move: function (e, api, f) {
      if (!e.aimed) {
        var a = U.angleTo(e.x, e.y, api.player.x, api.player.y);
        e.vx = Math.cos(a) * e.spd; e.vy = Math.sin(a) * e.spd;
        e.aimed = true;
      }
      /* 接近时加速 */
      var d = U.dist(e.x, e.y, api.player.x, api.player.y);
      if (d < 220) {
        e.armed = true;
        var k = 1 + (1 - d / 220) * 1.5;
        var a2 = U.angleTo(e.x, e.y, api.player.x, api.player.y);
        e.vx = U.lerp(e.vx, Math.cos(a2) * e.spd * k, .06 * f);
        e.vy = U.lerp(e.vy, Math.sin(a2) * e.spd * k, .06 * f);
      }
      e.x += e.vx * f; e.y += e.vy * f;
      if (d < 42) api.killEnemy(e, true);
      if (Math.random() < .3) G.Fx.trail(e.x, e.y, e.def.color, 3, 200);
    },
    ai: function* (e, api) { for (;;) yield 60; },
    onDeath: function (e, api) {
      /* 自爆：环形弹 */
      api.ring({ x: e.x, y: e.y, n: api.hard ? 14 : (api.easy ? 6 : 10), spd: 2.4, r: 7, color: '#ff9a3c', kind: 'orb' });
      G.Fx.explode(e.x, e.y, { color: '#ffd479' });
      G.Game.shake(5, 200);
    }
  };

  /* ============================================================
     2. 狙击眼 —— 单眼悬浮机械体 / 保持距离横向漂移 / 蓄力激光有预警线
     ============================================================ */
  E.sniper = {
    id: 'sniper', name: '狙击眼', hp: 34, r: 18, score: 180, color: '#FF6B4A',
    draw: function (ctx, e, t) {
      var c = e.def.color;
      /* 外环 */
      ctx.save();
      ctx.rotate(t * .001);
      ctx.strokeStyle = U.rgba(c, .8);
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, e.r * 1.35, .4, Math.PI - .4); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, e.r * 1.35, Math.PI + .4, U.TAU - .4); ctx.stroke();
      ctx.restore();
      /* 眼白 */
      ctx.fillStyle = '#e8e2d8';
      ctx.beginPath(); ctx.ellipse(0, 0, e.r, e.r * .78, 0, 0, U.TAU); ctx.fill();
      outline(ctx, c, 2.4);
      /* 瞳孔（追踪玩家） */
      var pa = e.lookA || 0;
      glowAt(ctx, Math.cos(pa) * e.r * .3, Math.sin(pa) * e.r * .3, e.r * 1.4, c, e.charging ? .9 : .4);
      ctx.fillStyle = e.charging ? '#fff' : U.shade(c, -.2);
      ctx.beginPath();
      ctx.arc(Math.cos(pa) * e.r * .3, Math.sin(pa) * e.r * .3, e.r * .4, 0, U.TAU);
      ctx.fill();
      hitFlash(ctx, e);
    },
    move: function (e, api, f) {
      /* 保持距离 + 横向漂移 */
      var targetY = 130 + (e.slot % 3) * 60;
      e.y = U.damp(e.y, targetY, 2.4, f / 60);
      e.x += Math.cos(e.t * .0012 + e.slot) * 1.6 * f;
      e.x = U.clamp(e.x, 60, api.W - 60);
      e.lookA = U.angleTo(e.x, e.y, api.player.x, api.player.y);
    },
    ai: function* (e, api) {
      yield 30 + (e.slot % 4) * 18;
      for (;;) {
        e.charging = true;
        var warn = Math.round(52 * api.tele);
        api.warnLine(e, e.lookA, warn);
        G.Aud.sfx.charge(warn / 60);
        yield warn;
        e.charging = false;
        api.laser({ x: e.x, y: e.y, a: e.lookA, w: 13, len: 1000, ms: 320, color: '#ff5a3c', dmg: 1 });
        G.Aud.sfx.laser();
        yield Math.round(78 / api.rate);
      }
    }
  };

  /* ============================================================
     3. 分裂虫 —— 绿色蠕虫状 / Z字迂回 / 死亡后分裂为2个小体
     ============================================================ */
  E.splitter = {
    id: 'splitter', name: '分裂虫', hp: 26, r: 16, score: 140, color: '#7CE04A',
    draw: function (ctx, e, t) {
      var c = e.def.color;
      var n = e.small ? 3 : 5;
      for (var i = n - 1; i >= 0; i--) {
        var ph = t * .006 - i * .5;
        var ox = Math.sin(ph) * (6 + i * 2.5);
        var oy = i * e.r * .78;
        var rr = e.r * (1 - i * .13);
        var g = ctx.createRadialGradient(ox - rr * .3, oy - rr * .3, 1, ox, oy, rr);
        g.addColorStop(0, U.shade(c, .45));
        g.addColorStop(1, U.shade(c, -.3));
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(ox, oy, rr, 0, U.TAU); ctx.fill();
        ctx.strokeStyle = U.rgba(U.shade(c, -.6), .8);
        ctx.lineWidth = 1.6; ctx.stroke();
      }
      /* 眼 */
      ctx.fillStyle = '#1a2a10';
      ctx.beginPath(); ctx.arc(-e.r * .32, -e.r * .2, 2.6, 0, U.TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(e.r * .32, -e.r * .2, 2.6, 0, U.TAU); ctx.fill();
      hitFlash(ctx, e);
    },
    move: function (e, api, f) {
      e.y += e.spd * f;
      e.x += Math.sin(e.t * .003) * 3.2 * f;
      e.x = U.clamp(e.x, 40, api.W - 40);
    },
    ai: function* (e, api) {
      for (;;) {
        yield Math.round((e.small ? 90 : 66) / api.rate);
        api.aimed({ x: e.x, y: e.y, n: e.small ? 1 : 3, spread: .5, spd: 2.6, r: 6, color: '#a8ff6a' });
      }
    },
    onDeath: function (e, api) {
      if (e.small) return;
      for (var i = 0; i < 2; i++) {
        var c = api.spawn('splitter', e.x + (i ? 26 : -26), e.y);
        if (c) { c.small = true; c.r = 10; c.hp = c.maxHp = Math.max(6, e.maxHp * .35); c.spd = e.spd * 1.35; }
      }
      G.Fx.burst(e.x, e.y, { color: '#a8ff6a', n: 12 });
    }
  };

  /* ============================================================
     4. 追踪者 —— 红色菱形+推进器 / 环绕玩家 / 发射追踪弹
     ============================================================ */
  E.chaser = {
    id: 'chaser', name: '追踪者', hp: 30, r: 15, score: 170, color: '#FF3B5E',
    draw: function (ctx, e, t) {
      var c = e.def.color;
      ctx.save();
      ctx.rotate(e.rot || 0);
      glowAt(ctx, 0, 0, e.r * 2.2, c, .45);
      /* 菱形 */
      var g = ctx.createLinearGradient(0, -e.r, 0, e.r);
      g.addColorStop(0, U.shade(c, .5));
      g.addColorStop(1, U.shade(c, -.3));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, -e.r * 1.3); ctx.lineTo(e.r * .85, 0);
      ctx.lineTo(0, e.r * 1.3); ctx.lineTo(-e.r * .85, 0);
      ctx.closePath(); ctx.fill();
      outline(ctx, c, 2);
      /* 推进器焰 */
      var fl = .6 + Math.random() * .4;
      ctx.globalCompositeOperation = 'lighter';
      var fg = ctx.createLinearGradient(0, e.r * 1.2, 0, e.r * (1.2 + fl * 1.6));
      fg.addColorStop(0, 'rgba(255,200,120,.9)');
      fg.addColorStop(1, 'rgba(255,80,40,0)');
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.moveTo(-e.r * .34, e.r * 1.2); ctx.lineTo(e.r * .34, e.r * 1.2);
      ctx.lineTo(0, e.r * (1.2 + fl * 1.8));
      ctx.closePath(); ctx.fill();
      ctx.restore();
      hitFlash(ctx, e);
    },
    move: function (e, api, f) {
      if (e.orbA === undefined) { e.orbA = Math.random() * U.TAU; e.orbR = 200 + Math.random() * 90; }
      e.orbA += .014 * f * (e.orbDir || 1);
      var tx = api.player.x + Math.cos(e.orbA) * e.orbR;
      var ty = api.player.y - 120 + Math.sin(e.orbA) * e.orbR * .5;
      ty = U.clamp(ty, 60, api.H * .6);
      e.x = U.damp(e.x, U.clamp(tx, 50, api.W - 50), 3, f / 60);
      e.y = U.damp(e.y, ty, 3, f / 60);
      e.rot = U.angleTo(e.x, e.y, api.player.x, api.player.y) - Math.PI / 2;
    },
    ai: function* (e, api) {
      yield 40;
      for (;;) {
        api.homing({ x: e.x, y: e.y, n: api.hard ? 3 : 2, spd: 2.1, r: 6.5, color: '#ff6a8a', turn: api.hard ? .05 : .028, life: 260 });
        G.Aud.sfx.enemyShoot();
        yield Math.round(96 / api.rate);
      }
    }
  };

  /* ============================================================
     5. 封锁者 —— 蓝色方块+能量场 / 贴边爬行 / 展开弹幕封锁线
     ============================================================ */
  E.blocker = {
    id: 'blocker', name: '封锁者', hp: 48, r: 20, score: 240, color: '#4FA8FF',
    draw: function (ctx, e, t) {
      var c = e.def.color;
      glowAt(ctx, 0, 0, e.r * 2.6, c, .4);
      ctx.save();
      ctx.rotate(t * .0006);
      var g = ctx.createLinearGradient(-e.r, -e.r, e.r, e.r);
      g.addColorStop(0, U.shade(c, .4));
      g.addColorStop(1, U.shade(c, -.35));
      ctx.fillStyle = g;
      U.roundRect(ctx, -e.r, -e.r, e.r * 2, e.r * 2, 5);
      ctx.fill();
      outline(ctx, c, 2.4);
      /* 能量场 */
      ctx.strokeStyle = U.rgba('#bfe8ff', .5 + .3 * Math.sin(t * .004));
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, e.r * 1.7, 0, U.TAU); ctx.stroke();
      ctx.restore();
      /* 核心 */
      ctx.fillStyle = e.deploying ? '#ffffff' : '#dff4ff';
      ctx.beginPath(); ctx.arc(0, 0, e.r * .34, 0, U.TAU); ctx.fill();
      hitFlash(ctx, e);
    },
    move: function (e, api, f) {
      if (e.phase === undefined) { e.phase = 0; e.edge = e.slot % 2 ? 1 : -1; }
      var ty = 110 + (e.slot % 2) * 70;
      e.y = U.damp(e.y, ty, 2, f / 60);
      e.x += e.edge * 1.5 * f;
      if (e.x < 70) { e.x = 70; e.edge = 1; }
      if (e.x > api.W - 70) { e.x = api.W - 70; e.edge = -1; }
    },
    ai: function* (e, api) {
      yield 50;
      for (;;) {
        e.deploying = true;
        yield Math.round(30 * api.tele);
        /* 封锁线：一整排，留一个缝 */
        var gap = U.randInt(1, 8);
        var n = api.hard ? 12 : (api.easy ? 7 : 10);
        for (var i = 0; i < n; i++) {
          if (i === gap || (api.easy && (i === gap + 1))) continue;
          api.shoot({ x: 40 + (api.W - 80) * i / (n - 1), y: e.y + 24, vx: 0, vy: 2.1 * api.bspd,
                      r: 8, color: '#ffa14a', kind: 'orb' });
        }
        G.Aud.sfx.enemyShoot();
        e.deploying = false;
        yield Math.round(118 / api.rate);
      }
    }
  };

  /* ============================================================
     6. 幻影体 —— 半透明紫色 / 瞬移 / 预判射击
     ============================================================ */
  E.phantom = {
    id: 'phantom', name: '幻影体', hp: 28, r: 17, score: 200, color: '#C77AFF',
    draw: function (ctx, e, t) {
      var c = e.def.color;
      var a = e.blink === undefined ? 1 : e.blink;
      ctx.globalAlpha = a * (.55 + .25 * Math.sin(t * .004));
      glowAt(ctx, 0, 0, e.r * 3, c, .35 * a);
      /* 残影 */
      for (var i = 3; i >= 1; i--) {
        ctx.globalAlpha = a * .12 * i / 3;
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.arc(0, i * 7, e.r * (1 - i * .08), 0, U.TAU); ctx.fill();
      }
      ctx.globalAlpha = a * .75;
      var g = ctx.createRadialGradient(0, -e.r * .3, 1, 0, 0, e.r);
      g.addColorStop(0, U.shade(c, .6));
      g.addColorStop(1, U.rgba(c, .25));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, -e.r * 1.2);
      ctx.quadraticCurveTo(e.r, -e.r * .2, e.r * .7, e.r);
      ctx.quadraticCurveTo(0, e.r * .5, -e.r * .7, e.r);
      ctx.quadraticCurveTo(-e.r, -e.r * .2, 0, -e.r * 1.2);
      ctx.fill();
      ctx.strokeStyle = U.rgba('#f0dcff', .7); ctx.lineWidth = 1.6; ctx.stroke();
      /* 眼 */
      ctx.globalAlpha = a;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.ellipse(-e.r * .3, -e.r * .3, 3.4, 5, .2, 0, U.TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(e.r * .3, -e.r * .3, 3.4, 5, -.2, 0, U.TAU); ctx.fill();
      ctx.globalAlpha = 1;
      hitFlash(ctx, e);
    },
    move: function (e, api, f) {
      if (e.blink === undefined) e.blink = 1;
      e.y = U.damp(e.y, 120 + (e.slot % 3) * 55, 2, f / 60);
    },
    ai: function* (e, api) {
      for (;;) {
        yield Math.round(70 / api.rate);
        /* 瞬移 */
        e.blink = 1;
        var o = { b: 1 };
        G.Tw.to(o, 180, { b: 0, onUpdate: function () { e.blink = o.b; } });
        yield 12;
        e.x = U.rand(80, api.W - 80);
        e.y = U.rand(90, 300);
        G.Fx.ring(e.x, e.y, { color: '#C77AFF', r: 4, r2: 60, life: 300 });
        var o2 = { b: 0 };
        G.Tw.to(o2, 220, { b: 1, onUpdate: function () { e.blink = o2.b; } });
        yield 18;
        /* 预判射击（朝玩家速度前方） */
        var lead = api.hard ? 26 : 14;
        var tx = api.player.x + api.player.vx * lead;
        var ty = api.player.y + api.player.vy * lead;
        var a = U.angleTo(e.x, e.y, tx, ty);
        for (var i = -1; i <= 1; i++) {
          api.shoot({ x: e.x, y: e.y, a: a + i * .16, spd: 3.4 * api.bspd, r: 6, color: '#ff9ad0', kind: 'needle' });
        }
        G.Aud.sfx.enemyShoot();
      }
    }
  };

  /* ============================================================
     7. 寄生体 —— 黑色触手状 / 抛物线跳跃 / 吸附玩家减速
     ============================================================ */
  E.parasite = {
    id: 'parasite', name: '寄生体', hp: 22, r: 14, score: 150, color: '#2A2A38',
    draw: function (ctx, e, t) {
      var c = e.def.color;
      /* 触手 */
      ctx.strokeStyle = U.rgba('#4a4a5e', .9);
      ctx.lineWidth = 3;
      for (var i = 0; i < 6; i++) {
        var a = i / 6 * U.TAU + t * .002;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        var wob = Math.sin(t * .008 + i) * 8;
        ctx.quadraticCurveTo(Math.cos(a) * e.r * 1.2 + wob, Math.sin(a) * e.r * 1.2,
                             Math.cos(a) * e.r * 2.1, Math.sin(a) * e.r * 2.1 + wob * .5);
        ctx.stroke();
      }
      var g = ctx.createRadialGradient(-e.r * .3, -e.r * .3, 1, 0, 0, e.r);
      g.addColorStop(0, '#5a5a70');
      g.addColorStop(1, '#12121c');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, e.r, 0, U.TAU); ctx.fill();
      /* 发光眼 */
      glowAt(ctx, 0, 0, e.r * 1.6, '#ff2b6e', .55);
      ctx.fillStyle = '#ff5a8a';
      ctx.beginPath(); ctx.arc(0, 0, e.r * .3, 0, U.TAU); ctx.fill();
      hitFlash(ctx, e);
    },
    move: function (e, api, f) {
      if (e.jt === undefined) { e.jt = 0; e.jvx = U.rand(-2.6, 2.6); e.jvy = -3.4; }
      e.jt += f;
      e.jvy += .09 * f;
      e.x += e.jvx * f;
      e.y += e.jvy * f;
      if (e.y > api.H * .55) { e.jvy = -U.rand(3.2, 4.6); e.jvx = U.rand(-2.8, 2.8); }
      if (e.x < 40 || e.x > api.W - 40) e.jvx *= -1;
      e.x = U.clamp(e.x, 40, api.W - 40);
      /* 吸附 */
      if (U.dist(e.x, e.y, api.player.x, api.player.y) < 60) api.slowPlayer(30);
    },
    ai: function* (e, api) {
      for (;;) {
        yield Math.round(80 / api.rate);
        api.ring({ x: e.x, y: e.y, n: api.hard ? 8 : 5, spd: 1.6, r: 7, color: '#ff4a7a', kind: 'orb', drag: .99 });
      }
    }
  };

  /* ============================================================
     8. 召唤核心 —— 大型金色球体 / 悬浮不动 / 召唤小弟
     ============================================================ */
  E.summoner = {
    id: 'summoner', name: '召唤核心', hp: 90, r: 30, score: 420, color: '#FFC83A',
    draw: function (ctx, e, t) {
      var c = e.def.color;
      glowAt(ctx, 0, 0, e.r * 3, c, .5);
      /* 旋转符环 */
      ctx.save();
      ctx.rotate(t * .0012);
      ctx.strokeStyle = U.rgba('#fff0c0', .7);
      ctx.lineWidth = 2.4;
      for (var k = 0; k < 3; k++) {
        ctx.beginPath();
        ctx.ellipse(0, 0, e.r * (1.5 + k * .28), e.r * (.5 + k * .12), k * 1.1, 0, U.TAU);
        ctx.stroke();
      }
      ctx.restore();
      /* 本体 */
      var g = ctx.createRadialGradient(-e.r * .3, -e.r * .35, 2, 0, 0, e.r);
      g.addColorStop(0, '#fff6d0');
      g.addColorStop(.6, c);
      g.addColorStop(1, U.shade(c, -.4));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, e.r, 0, U.TAU); ctx.fill();
      outline(ctx, c, 3);
      /* 内部符文 */
      ctx.strokeStyle = 'rgba(120,70,0,.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (var i = 0; i < 6; i++) {
        var a = i / 6 * U.TAU + t * .002;
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * e.r * .7, Math.sin(a) * e.r * .7);
      }
      ctx.stroke();
      hitFlash(ctx, e);
    },
    move: function (e, api, f) {
      e.y = U.damp(e.y, 130, 1.6, f / 60);
      e.x = U.damp(e.x, api.W * .5 + Math.sin(e.t * .0006) * 200, 1.2, f / 60);
    },
    ai: function* (e, api) {
      yield 40;
      for (;;) {
        G.Fx.ring(e.x, e.y, { color: '#FFC83A', r: 10, r2: 120, life: 500 });
        G.Aud.sfx.powerup();
        var n = api.hard ? 4 : (api.easy ? 1 : 2);
        for (var i = 0; i < n; i++) {
          var kind = U.pick(['bee', 'chaser', 'splitter']);
          api.spawn(kind, e.x + U.rand(-50, 50), e.y + 40);
        }
        yield Math.round(170 / api.rate);
        api.ring({ x: e.x, y: e.y, n: api.hard ? 20 : 12, spd: 2.2, r: 7, color: '#ffd479', kind: 'orb' });
        yield Math.round(70 / api.rate);
      }
    }
  };

  /* ============================================================
     9. 反弹弹 —— 银色棱镜 / 直线飞行 / 子弹碰到边界反弹
     ============================================================ */
  E.bouncer = {
    id: 'bouncer', name: '反弹棱镜', hp: 32, r: 16, score: 190, color: '#C8D8E8',
    draw: function (ctx, e, t) {
      var c = e.def.color;
      ctx.save();
      ctx.rotate(t * .003);
      glowAt(ctx, 0, 0, e.r * 2.2, '#dff4ff', .4);
      var g = ctx.createLinearGradient(-e.r, -e.r, e.r, e.r);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(.5, c);
      g.addColorStop(1, '#7a9ab8');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, -e.r * 1.25); ctx.lineTo(e.r * 1.1, e.r * .65);
      ctx.lineTo(-e.r * 1.1, e.r * .65);
      ctx.closePath(); ctx.fill();
      outline(ctx, '#7a9ab8', 2);
      /* 内反射 */
      ctx.strokeStyle = 'rgba(255,255,255,.7)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, -e.r * .7); ctx.lineTo(e.r * .5, e.r * .3); ctx.lineTo(-e.r * .5, e.r * .3);
      ctx.closePath(); ctx.stroke();
      ctx.restore();
      hitFlash(ctx, e);
    },
    move: function (e, api, f) {
      if (e.dirSet === undefined) { e.dirSet = 1; e.vx = U.randSign() * 2.2; e.vy = e.spd * .7; }
      e.x += e.vx * f; e.y += e.vy * f;
      if (e.x < 50 || e.x > api.W - 50) e.vx *= -1;
      if (e.y > api.H * .5) e.vy = -Math.abs(e.vy) * .6;
      if (e.y < 80) e.vy = Math.abs(e.vy);
    },
    ai: function* (e, api) {
      yield 45;
      for (;;) {
        var n = api.hard ? 6 : 4;
        for (var i = 0; i < n; i++) {
          api.shoot({ x: e.x, y: e.y, a: i / n * U.TAU + e.t * .001, spd: 2.6 * api.bspd,
                      /* 暖奶白：反弹弹原来是 #dff4ff（近白偏蓝），既撞己弹配色
                         又和自机光晕/擦弹环糊在一起 */
                      r: 7, color: '#ffe0b0', kind: 'shard', bounce: api.easy ? 1 : 3 });
        }
        G.Aud.sfx.enemyShoot();
        yield Math.round(100 / api.rate);
      }
    }
  };

  /* ============================================================
     10. 激光蜂 —— 细长红色 / 高速穿梭 / 蓄力后发射贯穿激光
     ============================================================ */
  E.laserbee = {
    id: 'laserbee', name: '激光蜂', hp: 20, r: 12, score: 210, color: '#FF2B4E',
    draw: function (ctx, e, t) {
      var c = e.def.color;
      ctx.save();
      ctx.rotate((e.moveA || 0) + Math.PI / 2);
      glowAt(ctx, 0, 0, e.r * 2.4, c, e.charging ? .9 : .4);
      var g = ctx.createLinearGradient(0, -e.r * 2, 0, e.r * 2);
      g.addColorStop(0, '#fff');
      g.addColorStop(.4, c);
      g.addColorStop(1, U.shade(c, -.5));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(0, 0, e.r * .5, e.r * 2, 0, 0, U.TAU);
      ctx.fill();
      outline(ctx, c, 1.6);
      /* 蓄力头 */
      if (e.charging) {
        ctx.globalCompositeOperation = 'lighter';
        var cg = ctx.createRadialGradient(0, -e.r * 2, 0, 0, -e.r * 2, e.r * 3);
        cg.addColorStop(0, 'rgba(255,255,255,.95)');
        cg.addColorStop(1, 'rgba(255,60,80,0)');
        ctx.fillStyle = cg;
        ctx.fillRect(-e.r * 3, -e.r * 5, e.r * 6, e.r * 6);
      }
      ctx.restore();
      hitFlash(ctx, e);
    },
    move: function (e, api, f) {
      if (e.wp === undefined) { e.wp = 0; e.tx = U.rand(80, api.W - 80); e.ty = U.rand(80, 280); }
      var a = U.angleTo(e.x, e.y, e.tx, e.ty);
      e.moveA = a;
      var d = U.dist(e.x, e.y, e.tx, e.ty);
      if (e.charging) return;
      if (d < 20) { e.tx = U.rand(80, api.W - 80); e.ty = U.rand(80, 300); }
      else {
        e.x += Math.cos(a) * e.spd * 1.9 * f;
        e.y += Math.sin(a) * e.spd * 1.9 * f;
      }
      if (Math.random() < .5) G.Fx.trail(e.x, e.y, c2(e), 2.4, 180);
    },
    ai: function* (e, api) {
      yield 40 + (e.slot % 5) * 12;
      for (;;) {
        e.charging = true;
        var a = U.angleTo(e.x, e.y, api.player.x, api.player.y);
        e.moveA = a;
        api.warnLine(e, a, Math.round(46 * api.tele));
        G.Aud.sfx.charge(.7);
        yield Math.round(46 * api.tele);
        api.laser({ x: e.x, y: e.y, a: a, w: 9, len: 1100, ms: 260, color: '#ff2b4e', pierce: true });
        G.Aud.sfx.laser();
        e.charging = false;
        yield Math.round(86 / api.rate);
      }
    }
  };
  function c2(e) { return e.def.color; }

  /* ============================================================
     11. 护盾兵 —— 正面护盾，必须绕后或用炸弹
     ============================================================ */
  E.shielder = {
    id: 'shielder', name: '护盾兵', hp: 60, r: 22, score: 300, color: '#5AD8C8',
    draw: function (ctx, e, t) {
      var c = e.def.color;
      /* 本体 */
      var g = ctx.createLinearGradient(0, -e.r, 0, e.r);
      g.addColorStop(0, U.shade(c, .4));
      g.addColorStop(1, U.shade(c, -.35));
      ctx.fillStyle = g;
      U.roundRect(ctx, -e.r * .8, -e.r * .8, e.r * 1.6, e.r * 1.6, 6);
      ctx.fill();
      outline(ctx, c, 2.2);
      /* 护盾（下方弧） */
      if (!e.shieldDown) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        var sa = .35 + .25 * Math.sin(t * .004);
        ctx.strokeStyle = U.rgba('#a8fff0', sa + .3);
        ctx.lineWidth = 6;
        ctx.beginPath(); ctx.arc(0, 0, e.r * 1.6, .25, Math.PI - .25); ctx.stroke();
        ctx.strokeStyle = U.rgba('#5AD8C8', sa);
        ctx.lineWidth = 14;
        ctx.beginPath(); ctx.arc(0, 0, e.r * 1.6, .25, Math.PI - .25); ctx.stroke();
        ctx.restore();
      }
      glowAt(ctx, 0, 0, e.r * 2, c, .35);
      hitFlash(ctx, e);
    },
    move: function (e, api, f) {
      e.y = U.damp(e.y, 150 + (e.slot % 2) * 60, 1.8, f / 60);
      e.x += Math.sin(e.t * .0009 + e.slot) * 1.2 * f;
      e.x = U.clamp(e.x, 70, api.W - 70);
      /* 护盾只挡下方来的子弹 */
      e.shieldArc = { from: .25, to: Math.PI - .25, r: e.r * 1.6 };
    },
    ai: function* (e, api) {
      yield 60;
      for (;;) {
        api.aimed({ x: e.x, y: e.y, n: api.hard ? 5 : 3, spread: .7, spd: 2.4, r: 7, color: '#ffb04a' });
        yield Math.round(110 / api.rate);
      }
    }
  };

  /* ============================================================
     12. 无人机群 —— 编队小机，数量多、血薄
     ============================================================ */
  E.swarm = {
    /* 机体色偏暖钢：原来的 #9FB8D0 是淡蓝灰，和「浮空都市残骸」战场同色系，
       又是全场最小的敌人，实战里几乎看不见 —— 打不到看不见的东西。 */
    id: 'swarm', name: '无人机', hp: 8, r: 9, score: 60, color: '#C89A72',
    draw: function (ctx, e, t) {
      var c = e.def.color;
      ctx.save();
      ctx.rotate(Math.PI);
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(0, -e.r); ctx.lineTo(e.r * .8, e.r * .7);
      ctx.lineTo(0, e.r * .3); ctx.lineTo(-e.r * .8, e.r * .7);
      ctx.closePath(); ctx.fill();
      outline(ctx, c, 1.6);
      /* 机首感应灯：小目标需要一个高对比的点才抓得住 */
      ctx.fillStyle = '#ffe0a8';
      ctx.beginPath(); ctx.arc(0, -e.r * .55, e.r * .26, 0, U.TAU); ctx.fill();
      ctx.restore();
      glowAt(ctx, 0, e.r * .6, e.r * 1.9, '#ff9a4a', .5);
      hitFlash(ctx, e);
    },
    move: function (e, api, f) {
      if (e.formX === undefined) e.formX = e.x;
      e.y += e.spd * 1.15 * f;
      e.x = e.formX + Math.sin(e.t * .004 + e.slot * .6) * 50;
    },
    ai: function* (e, api) {
      yield 40 + (e.slot % 6) * 10;
      for (;;) {
        api.shoot({ x: e.x, y: e.y, a: Math.PI / 2, spd: 3 * api.bspd, r: 5, color: '#ffca8a', kind: 'needle' });
        yield Math.round(120 / api.rate);
      }
    }
  };

  /* ---------- 波次编成（按难度） ---------- */
  E.waveTable = {
    easy:   [['bee'], ['splitter'], ['swarm'], ['sniper'], ['chaser'], ['bee', 'swarm']],
    normal: [['bee', 'swarm'], ['splitter', 'sniper'], ['chaser', 'bouncer'], ['blocker', 'bee'],
             ['phantom', 'swarm'], ['parasite', 'splitter'], ['laserbee', 'chaser'], ['summoner']],
    hard:   [['bee', 'swarm', 'splitter', 'sniper'], ['chaser', 'bouncer', 'phantom', 'laserbee'],
             ['blocker', 'shielder', 'bee', 'swarm'], ['parasite', 'phantom', 'chaser', 'laserbee'],
             ['summoner', 'shielder', 'bouncer', 'swarm'], ['laserbee', 'blocker', 'parasite', 'bee', 'chaser']]
  };

  E.list = ['bee', 'sniper', 'splitter', 'chaser', 'blocker', 'phantom',
            'parasite', 'summoner', 'bouncer', 'laserbee', 'shielder', 'swarm'];

})(window);
