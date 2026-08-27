/* ===========================================================
   paints.js — 过场专用绘制件（G.Paint.*）
   签名：fn(ctx, p, data, t)   p = 0..1 进度，t = 毫秒
   =========================================================== */
(function (root) {
  'use strict';
  var G = root.G, U = G.U, Ui = G.Ui, Art = G.Art;
  var P = G.Paint;
  G.Cutscenes = G.Cutscenes || {};

  var W = 1280, H = 720;

  function glow(ctx, x, y, r, color, a) {
    var g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, U.rgba(color, a));
    g.addColorStop(.4, U.rgba(color, a * .38));
    g.addColorStop(1, U.rgba(color, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  /* ---------------- 警报灯（空袭） ---------------- */
  P.alarmLights = function (ctx, p, d, t) {
    var pulse = Math.abs(Math.sin(t * .004));
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, 0, H * .5, 520, '#ff2b3e', .30 * pulse);
    glow(ctx, W, H * .5, 520, '#ff2b3e', .30 * pulse);
    ctx.restore();
    /* 扫射光柱 */
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < 3; i++) {
      var a = t * .0012 + i * 2.1;
      var x = W * .5 + Math.sin(a) * W * .5;
      var g = ctx.createLinearGradient(x, 0, x, H);
      g.addColorStop(0, 'rgba(255,80,60,.20)');
      g.addColorStop(1, 'rgba(255,40,30,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x, 0); ctx.lineTo(x + 90, H); ctx.lineTo(x - 90, H);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  };

  /* ---------------- 远处敌机剪影掠过 ---------------- */
  P.raidPlanes = function (ctx, p, d, t) {
    ctx.save();
    for (var i = 0; i < 6; i++) {
      var sp = .06 + (i % 3) * .02;
      var x = ((t * sp + i * 260) % (W + 400)) - 200;
      var y = 120 + (i % 4) * 52 + Math.sin(t * .002 + i) * 8;
      var s = .5 + (i % 3) * .18;
      ctx.save();
      ctx.translate(x, y); ctx.scale(s, s);
      ctx.fillStyle = 'rgba(20,14,22,.85)';
      ctx.beginPath();
      ctx.moveTo(-34, 0); ctx.lineTo(4, -6); ctx.lineTo(30, 0); ctx.lineTo(4, 6);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-4, -4); ctx.lineTo(-18, -22); ctx.lineTo(-8, -4);
      ctx.moveTo(-4, 4); ctx.lineTo(-18, 22); ctx.lineTo(-8, 4);
      ctx.closePath(); ctx.fill();
      /* 引擎光 */
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, -34, 0, 22, '#ff7a4a', .5);
      ctx.restore();
    }
    ctx.restore();
  };

  /* ---------------- 老人被光束穿透 ---------------- */
  P.pierceBeam = function (ctx, p, d, t) {
    var x = d.x === undefined ? 640 : d.x;
    var y = d.y === undefined ? 380 : d.y;
    var a = p < .12 ? p / .12 : (1 - (p - .12) / .88);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    /* 贯穿光束（从右上打来） */
    ctx.strokeStyle = U.rgba('#ffe9c0', .9 * a);
    ctx.lineWidth = 5 + 10 * a;
    ctx.beginPath();
    ctx.moveTo(x + 700, y - 420);
    ctx.lineTo(x - 260, y + 160);
    ctx.stroke();
    ctx.strokeStyle = U.rgba('#ff9a5a', .5 * a);
    ctx.lineWidth = 22 * a;
    ctx.stroke();
    glow(ctx, x, y, 160 * (0.4 + a), '#ffd9a0', .7 * a);
    ctx.restore();
  };

  /* ---------------- 血迹（主角触碰） ---------------- */
  P.bloodPool = function (ctx, p, d, t) {
    var x = d.x === undefined ? 640 : d.x, y = d.y === undefined ? 500 : d.y;
    var s = U.smoothstep(U.clamp01(p * 2));
    ctx.save();
    ctx.globalAlpha = .78;
    var g = ctx.createRadialGradient(x, y, 2, x, y, 120 * s);
    g.addColorStop(0, 'rgba(120,18,24,.95)');
    g.addColorStop(.6, 'rgba(80,10,18,.7)');
    g.addColorStop(1, 'rgba(60,8,14,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x, y, 120 * s, 34 * s, 0, 0, U.TAU);
    ctx.fill();
    /* 反光 */
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, x - 26, y - 6, 40 * s, '#ff5a5a', .18);
    ctx.restore();
  };

  /* ---------------- 遗迹装置觉醒 ---------------- */
  P.runeAwaken = function (ctx, p, d, t) {
    var cx = 640, cy = 400;
    var s = U.smoothstep(p);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    /* 中心光核 */
    glow(ctx, cx, cy, 60 + 240 * s, '#9fd8ff', .5 * s);
    /* 同心符文环 */
    for (var r = 0; r < 3; r++) {
      var rr = (70 + r * 62) * (0.4 + s * .9);
      ctx.strokeStyle = U.rgba('#bfeaff', .5 + .4 * Math.sin(t * .003 + r));
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, rr, 0, U.TAU); ctx.stroke();
      /* 符文刻痕 */
      var n = 8 + r * 4;
      for (var i = 0; i < n; i++) {
        var a = i / n * U.TAU + t * .0004 * (r % 2 ? 1 : -1);
        var px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr;
        ctx.save();
        ctx.translate(px, py); ctx.rotate(a);
        ctx.fillStyle = U.rgba('#eaf8ff', .8 * s);
        ctx.fillRect(-2, -7, 4, 14);
        ctx.restore();
      }
    }
    /* 上升粒子 */
    for (var k = 0; k < 30; k++) {
      var ph = (t * .0006 + k * .137) % 1;
      var ang = k / 30 * U.TAU;
      var rad = 200 * (1 - ph) + 20;
      ctx.fillStyle = U.rgba('#dff4ff', (1 - ph) * .8 * s);
      ctx.beginPath();
      ctx.arc(cx + Math.cos(ang) * rad, cy - ph * 260, 2.2, 0, U.TAU);
      ctx.fill();
    }
    ctx.restore();
  };

  /* ---------------- 时间倒流（死亡回归） ---------------- */
  P.rewindRings = function (ctx, p, d, t) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    var cx = 640, cy = 360;
    /* 倒流环 */
    for (var k = 0; k < 7; k++) {
      var rr = ((t * .38 + k * 130) % 760);
      var a = (1 - rr / 760) * .5;
      ctx.strokeStyle = U.rgba(k % 2 ? '#9fd8ff' : '#c9a8ff', a);
      ctx.lineWidth = 2 + (1 - rr / 760) * 4;
      ctx.beginPath(); ctx.arc(cx, cy, rr, 0, U.TAU); ctx.stroke();
    }
    /* 反向时钟指针 */
    var ang = -t * .003;
    ctx.strokeStyle = 'rgba(220,240,255,.30)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(ang) * 210, cy + Math.sin(ang) * 210);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(ang * 7) * 140, cy + Math.sin(ang * 7) * 140);
    ctx.stroke();
    /* 逆流碎片 */
    for (var i = 0; i < 46; i++) {
      var ph = ((t * .0009 + i * .0217) % 1);
      var a2 = i / 46 * U.TAU;
      var rad = 520 * ph;
      ctx.fillStyle = U.rgba('#eaf6ff', (1 - ph) * .7);
      var px = cx + Math.cos(a2) * rad, py = cy + Math.sin(a2) * rad;
      ctx.fillRect(px - 1.5, py - 6, 3, 12);
    }
    ctx.restore();
    /* 水平撕裂条 */
    ctx.save();
    for (var s = 0; s < 16; s++) {
      var sy = (s / 16) * H;
      ctx.globalAlpha = .10 + Math.random() * .1;
      ctx.fillStyle = s % 3 === 0 ? '#ff2b5e' : (s % 3 === 1 ? '#2bffe0' : '#a08cff');
      ctx.fillRect((Math.random() - .5) * 160, sy, W, H / 16 * .55);
    }
    ctx.restore();
  };

  /* ---------------- TY 的尸体 ---------------- */
  P.tyCorpse = function (ctx, p, d, t) {
    var x = d.x === undefined ? 700 : d.x, y = d.y === undefined ? 520 : d.y;
    ctx.save();
    ctx.translate(x, y);
    /* 影子 */
    ctx.fillStyle = 'rgba(0,0,0,.45)';
    ctx.beginPath(); ctx.ellipse(0, 12, 120, 22, 0, 0, U.TAU); ctx.fill();
    /* 躺着的火柴人 */
    var col = d.color || '#8f98a4';
    ctx.strokeStyle = col; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.fillStyle = U.rgba(col, .18);
    ctx.beginPath(); ctx.ellipse(-92, -14, 20, 17, -.2, 0, U.TAU); ctx.fill(); ctx.stroke();
    /* 头发 */
    ctx.fillStyle = U.shade(col, -.25);
    ctx.beginPath();
    ctx.moveTo(-110, -26); ctx.quadraticCurveTo(-92, -42, -72, -24);
    ctx.quadraticCurveTo(-92, -30, -110, -26); ctx.fill();
    /* 身体 */
    ctx.beginPath(); ctx.moveTo(-70, -6); ctx.lineTo(30, 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-64, -18); ctx.lineTo(-56, 8); ctx.stroke();
    /* 手臂：一只摊开 */
    ctx.beginPath(); ctx.moveTo(-56, -6); ctx.lineTo(-30, -32); ctx.lineTo(4, -26); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-56, -2); ctx.lineTo(-24, 16); ctx.stroke();
    /* 腿 */
    ctx.beginPath(); ctx.moveTo(30, 2); ctx.lineTo(74, -8); ctx.lineTo(108, 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(30, 4); ctx.lineTo(70, 16); ctx.lineTo(104, 12); ctx.stroke();
    /* 闭眼 */
    ctx.strokeStyle = U.shade(col, -.3); ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.arc(-96, -18, 5, .4, Math.PI - .4); ctx.stroke();
    ctx.beginPath(); ctx.arc(-84, -16, 5, .4, Math.PI - .4); ctx.stroke();
    ctx.restore();
    /* 微弱残光 */
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, x - 92, y - 14, 70, '#cfe0ee', .12 + .06 * Math.sin(t * .002));
    ctx.restore();
  };

  /* ---------------- 空战剪影（远景对峙） ---------------- */
  /* 运气好的人之死：导弹 → 被撞开 → 偏飞 → 击中平台核心。
     旁白连着四句都在说这发导弹，所以画面里必须真有一发导弹、真有一次偏转、
     真有一次命中，否则观众只会看到两架飞机在打转。 */
  P.planeDuel = function (ctx, p, d, t) {
    var c1 = d.c1 || '#FFA23A';          /* 幸运儿 */
    var c2 = d.c2 || '#4FC3F7';          /* 主角 */
    ctx.save();

    /* --- 两架机的位置：主角偏左下，幸运儿从右侧切进来 --- */
    var wob = Math.sin(t * .0018);
    var hx = 470 + wob * 26, hy = 400 + Math.cos(t * .0022) * 18;
    /* 时间轴对齐旁白（画笔 16000ms，五句字幕依次占 0-.14 / -.33 / -.55 / -.76 / .82-）：
       .28 撞开 → .28~.55 偏飞 → .84 命中平台核心 */
    var lkT = U.smoothstep(U.clamp01((p - .12) / .16));   /* 横切过程 */
    /* 从右下方切进来：正上方那块被幸运儿的立绘挡住，飞机会整架消失 */
    var lx = U.lerp(1195, hx + 96, lkT) + wob * 14;
    var ly = U.lerp(520, hy - 34, lkT);

    /* --- 导弹：右上进场 → 被撞开 → 偏向左下平台 --- */
    var HIT = .28, BOOM = .84;
    var mx, my, mang, alive = p < BOOM;
    if (p < HIT) {
      var q = U.clamp01(p / HIT);
      mx = U.lerp(1250, hx + 150, q);
      my = U.lerp(120, hy - 20, q);
      mang = Math.atan2(hy - 20 - 120, hx + 150 - 1250);
    } else {
      var q2 = U.clamp01((p - HIT) / (BOOM - HIT));
      /* 偏向左后方那座浮空平台（旁白：击中了他身后那座平台的能源核心）。
         终点不能落在画面下缘 —— 那里正是主角立绘的脚下，冲击环会像在他身上炸开。 */
      mx = U.lerp(hx + 150, 236, q2);
      my = U.lerp(hy - 20, 344, q2);
      mang = Math.atan2(344 - (hy - 20), 236 - (hx + 150));
    }

    /* 导弹尾烟 */
    if (alive) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (var k = 1; k < 14; k++) {
        var back = k * 15;
        var sx = mx - Math.cos(mang) * back, sy = my - Math.sin(mang) * back;
        ctx.fillStyle = U.rgba('#ff8a5a', .3 * (1 - k / 14));
        ctx.beginPath(); ctx.arc(sx, sy, 3 + (1 - k / 14) * 7, 0, U.TAU); ctx.fill();
      }
      ctx.restore();
      /* 弹体 */
      ctx.save();
      ctx.translate(mx, my); ctx.rotate(mang);
      ctx.fillStyle = '#e8e2d8';
      ctx.beginPath();
      ctx.moveTo(20, 0); ctx.lineTo(-14, -5); ctx.lineTo(-14, 5);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ff3b2f';
      ctx.fillRect(-6, -5, 5, 10);
      ctx.fillStyle = '#9aa4ae';
      ctx.beginPath();
      ctx.moveTo(-14, -5); ctx.lineTo(-22, -11); ctx.lineTo(-16, -4);
      ctx.moveTo(-14, 5); ctx.lineTo(-22, 11); ctx.lineTo(-16, 4);
      ctx.closePath(); ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, -18, 0, 22, '#ffb15e', .8);
      ctx.restore();
    }

    /* --- 撞开的接触闪光 --- */
    if (p > HIT - .05 && p < HIT + .12) {
      var fa = 1 - Math.abs(p - HIT) / .12;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, hx + 150, hy - 20, 150 * fa, '#fff6d0', .9 * fa);
      ctx.strokeStyle = U.rgba('#fff6d0', .85 * fa);
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(hx + 150, hy - 20, 26 + (1 - fa) * 90, 0, U.TAU); ctx.stroke();
      ctx.restore();
    }

    /* --- 命中平台核心 --- */
    if (p > BOOM) {
      var ba = U.clamp01((p - BOOM) / .16);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, 236, 344, 120 + ba * 420, '#ffb15e', .9 * (1 - ba * .55));
      ctx.strokeStyle = U.rgba('#ffd9a0', .7 * (1 - ba));
      ctx.lineWidth = 5 * (1 - ba) + 1;
      ctx.beginPath(); ctx.arc(236, 344, 40 + ba * 460, 0, U.TAU); ctx.stroke();
      ctx.restore();
    }

    /* --- 两架机 --- */
    function plane(x, y, ang, col, glowCol, sc) {
      ctx.save();
      ctx.translate(x, y); ctx.rotate(ang); ctx.scale(sc, sc);
      ctx.fillStyle = U.rgba(col, .95);
      ctx.beginPath();
      ctx.moveTo(28, 0); ctx.lineTo(-6, -8); ctx.lineTo(-26, 0); ctx.lineTo(-6, 8);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = U.rgba(U.shade(col, -.3), .95);
      ctx.beginPath();
      ctx.moveTo(0, -5); ctx.lineTo(-14, -24); ctx.lineTo(-6, -5);
      ctx.moveTo(0, 5); ctx.lineTo(-14, 24); ctx.lineTo(-6, 5);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = U.rgba(U.shade(col, -.6), .85); ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(28, 0); ctx.lineTo(-6, -8); ctx.lineTo(-26, 0); ctx.lineTo(-6, 8);
      ctx.closePath(); ctx.stroke();
      ctx.fillStyle = 'rgba(232,250,255,.9)';
      ctx.beginPath(); ctx.ellipse(8, 0, 6, 3.6, 0, 0, U.TAU); ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, -26, 0, 26, glowCol, .6);
      ctx.restore();
    }
    plane(hx, hy, -.06 + wob * .05, c2, '#9fe8ff', .95);
    plane(lx, ly, .30 - lkT * .5, c1, '#ffd08a', .88);

    ctx.restore();
  };

  /* ---------------- 正直的人挡弹 ---------------- */
  P.shieldDive = function (ctx, p, d, t) {
    /* 三段：切入(0-.35) 命中(.35-.5) 解体(.5-1) */
    var cx = 640, cy = 340;
    ctx.save();
    /* 主角机（下方） */
    ctx.save();
    ctx.translate(cx - 40, cy + 130);
    ctx.fillStyle = U.rgba('#4FC3F7', .95);
    ctx.beginPath();
    ctx.moveTo(0, -20); ctx.lineTo(14, 14); ctx.lineTo(0, 8); ctx.lineTo(-14, 14);
    ctx.closePath(); ctx.fill();
    ctx.restore();

    /* 致命弹幕（从上方压下来） */
    var bulletY = U.lerp(-60, cy + 40, U.clamp01(p / .5));
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < 11; i++) {
      var bx = cx - 200 + i * 40;
      var by = bulletY + Math.sin(i) * 14;
      glow(ctx, bx, by, 34, '#ff4a5e', .55);
      ctx.fillStyle = '#ffd0d8';
      ctx.beginPath(); ctx.arc(bx, by, 7, 0, U.TAU); ctx.fill();
    }
    ctx.restore();

    /* 正直的人机（横向切入） */
    var ux = U.lerp(-260, cx - 40, U.smoothstep(U.clamp01(p / .35)));
    var uy = cy + 70;
    var breaking = p > .5;
    ctx.save();
    ctx.translate(ux, uy);
    ctx.rotate(-0.35 + U.clamp01((p - .35) / .3) * .5);
    if (!breaking) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(26, 0); ctx.lineTo(-8, -10); ctx.lineTo(-24, 0); ctx.lineTo(-8, 10);
      ctx.closePath(); ctx.fill();
      /* 后掠翼 + 座舱：这是全片最该被看清的一架机，光一个四边形读不出「战机扑过来」 */
      ctx.fillStyle = '#d6e4f0';
      ctx.beginPath();
      ctx.moveTo(-4, -8); ctx.lineTo(-14, -24); ctx.lineTo(-22, -22); ctx.lineTo(-11, -5);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-4, 8); ctx.lineTo(-14, 24); ctx.lineTo(-22, 22); ctx.lineTo(-11, 5);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(120,145,170,.9)'; ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(26, 0); ctx.lineTo(-8, -10); ctx.lineTo(-24, 0); ctx.lineTo(-8, 10);
      ctx.closePath(); ctx.stroke();
      ctx.fillStyle = 'rgba(150,205,255,.95)';
      ctx.beginPath(); ctx.ellipse(7, 0, 6, 3.6, 0, 0, U.TAU); ctx.fill();
      /* 冲刺拖影 */
      ctx.globalCompositeOperation = 'lighter';
      var tg = ctx.createLinearGradient(-24, 0, -150, 0);
      tg.addColorStop(0, 'rgba(223,244,255,.55)');
      tg.addColorStop(1, 'rgba(223,244,255,0)');
      ctx.fillStyle = tg;
      ctx.beginPath();
      ctx.moveTo(-22, -7); ctx.lineTo(-150, -2); ctx.lineTo(-150, 2); ctx.lineTo(-22, 7);
      ctx.closePath(); ctx.fill();
      glow(ctx, -24, 0, 30, '#dff4ff', .7);
    } else {
      /* 解体碎片 */
      var q = (p - .5) / .5;
      var rr = U.rng(99);
      for (var k = 0; k < 14; k++) {
        var a = rr() * U.TAU, dd = q * 150 * rr.range(.4, 1.4);
        ctx.save();
        ctx.translate(Math.cos(a) * dd, Math.sin(a) * dd);
        ctx.rotate(a + q * 4);
        ctx.globalAlpha = 1 - q;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-4, -2, 9, 4);
        ctx.restore();
      }
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = (1 - q) * .8;
      glow(ctx, 0, 0, 130 * (0.3 + q), '#ffffff', .6);
    }
    ctx.restore();

    /* 命中闪光 */
    if (p > .46 && p < .58) {
      ctx.save();
      ctx.globalAlpha = 1 - Math.abs(p - .52) / .06;
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
    ctx.restore();
  };

  /* ---------------- 蓄力核心被击破（IF 前提） ---------------- */
  P.coreBreak = function (ctx, p, d, t) {
    var cx = 640, cy = 250;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    var q = U.smoothstep(p);
    glow(ctx, cx, cy, 90 + 260 * q, '#ffe9a8', .6 * (1 - q * .5));
    for (var i = 0; i < 26; i++) {
      var a = i / 26 * U.TAU;
      var rr = 40 + q * 420;
      ctx.strokeStyle = U.rgba('#fff6d0', (1 - q) * .8);
      ctx.lineWidth = 3 * (1 - q) + .5;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * 30, cy + Math.sin(a) * 30);
      ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
      ctx.stroke();
    }
    ctx.restore();
  };

  /* ---------------- 含泪一枪：超慢镜头子弹 ---------------- */
  P.slowBullet = function (ctx, p, d, t) {
    var x0 = 400, y0 = 560, x1 = 880, y1 = 250;
    var q = U.smoothstep(p);
    var bx = U.lerp(x0, x1, q), by = U.lerp(y0, y1, q);
    ctx.save();
    /* 目标：残破战机（驾驶舱暴露） */
    ctx.save();
    ctx.translate(x1, y1);
    ctx.rotate(.2 + Math.sin(t * .001) * .04);
    /* 机体 */
    ctx.fillStyle = U.rgba('#4A2A6A', .95);
    ctx.beginPath();
    ctx.moveTo(-46, 0); ctx.lineTo(6, -16); ctx.lineTo(40, 0); ctx.lineTo(6, 16);
    ctx.closePath(); ctx.fill();
    /* 机械侵蚀 */
    ctx.fillStyle = 'rgba(14,10,20,.9)';
    ctx.beginPath();
    ctx.moveTo(-10, -14); ctx.lineTo(40, 0); ctx.lineTo(-10, 14); ctx.closePath(); ctx.fill();
    /* 破损 */
    ctx.strokeStyle = U.rgba('#C7A8F0', .8); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-30, -8); ctx.lineTo(-14, 6); ctx.moveTo(-20, 10); ctx.lineTo(-6, -4); ctx.stroke();
    /* 驾驶舱（暴露、无护盾） */
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, -4, -2, 42, '#C7A8F0', .5 + .2 * Math.sin(t * .006));
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = U.rgba('#e8dcff', .9);
    ctx.beginPath(); ctx.ellipse(-4, -2, 11, 8, 0, 0, U.TAU); ctx.fill();
    ctx.restore();

    /* 求救信号（脉冲圈） */
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    var sos = (t * .0006) % 1;
    ctx.strokeStyle = U.rgba('#C7A8F0', (1 - sos) * .5);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x1, y1, 40 + sos * 180, 0, U.TAU); ctx.stroke();
    ctx.restore();

    /* 子弹 + 拖尾 */
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var k = 0; k < 22; k++) {
      var qq = U.clamp01(q - k * .012);
      var tx = U.lerp(x0, x1, qq), ty = U.lerp(y0, y1, qq);
      ctx.fillStyle = U.rgba('#dff4ff', (1 - k / 22) * .5);
      ctx.beginPath(); ctx.arc(tx, ty, 5 * (1 - k / 26) + 1, 0, U.TAU); ctx.fill();
    }
    glow(ctx, bx, by, 60, '#eaf6ff', .8);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(bx, by, 6.5, 0, U.TAU); ctx.fill();
    ctx.restore();

    /* 主角机（发射端） */
    ctx.save();
    ctx.translate(x0, y0);
    ctx.rotate(-.62);
    ctx.fillStyle = U.rgba('#4FC3F7', .9);
    ctx.beginPath();
    ctx.moveTo(30, 0); ctx.lineTo(-8, -12); ctx.lineTo(-26, 0); ctx.lineTo(-8, 12);
    ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.restore();
  };

  /* 寂静中的爆炸（含泪一枪之后） */
  P.silentBoom = function (ctx, p, d, t) {
    var x = d.x === undefined ? 880 : d.x, y = d.y === undefined ? 250 : d.y;
    var q = U.smoothstep(p);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, x, y, 60 + q * 520, d.color || '#C7A8F0', (1 - q) * .8);
    ctx.strokeStyle = U.rgba('#ffffff', (1 - q) * .7);
    ctx.lineWidth = 6 * (1 - q) + 1;
    ctx.beginPath(); ctx.arc(x, y, q * 420, 0, U.TAU); ctx.stroke();
    /* 白色碎片 */
    var rr = U.rng(7);
    for (var i = 0; i < 40; i++) {
      var a = rr() * U.TAU, dd = q * 460 * rr.range(.3, 1.2);
      ctx.globalAlpha = (1 - q) * .8;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + Math.cos(a) * dd, y + Math.sin(a) * dd, 3, 3);
    }
    ctx.restore();
  };

  /* ---------------- 运气好的人：羽毛般飘落 ---------------- */
  P.featherFall = function (ctx, p, d, t) {
    var x = 640, y0 = 240;
    var y = y0 + p * 420;
    ctx.save();
    /* 战机（缓缓下沉，不爆炸） */
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(t * .0008) * .18);
    ctx.globalAlpha = 1 - p * .8;
    ctx.fillStyle = U.rgba('#FFA23A', .9);
    ctx.beginPath();
    ctx.moveTo(34, 0); ctx.lineTo(-8, -13); ctx.lineTo(-30, 0); ctx.lineTo(-8, 13);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, -6); ctx.lineTo(-16, -28); ctx.lineTo(-8, -6);
    ctx.moveTo(0, 6); ctx.lineTo(-16, 28); ctx.lineTo(-8, 6);
    ctx.closePath(); ctx.fill();
    ctx.restore();
    /* 发光羽毛 */
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < 9; i++) {
      var ph = (t * .0004 + i * .11) % 1;
      var fx = x + Math.sin(t * .001 + i * 2) * (60 + i * 12);
      var fy = y0 + 40 + ph * 480;
      ctx.save();
      ctx.translate(fx, fy);
      ctx.rotate(Math.sin(t * .0015 + i) * .8);
      ctx.globalAlpha = (1 - ph) * .85;
      glow(ctx, 0, 0, 40, '#ffd8a8', .4);
      ctx.fillStyle = '#fff0d0';
      ctx.beginPath();
      ctx.moveTo(0, -13);
      ctx.quadraticCurveTo(7, 0, 0, 13);
      ctx.quadraticCurveTo(-7, 0, 0, -13);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  };

  /* ---------------- 含泪一枪：对峙（扳机前的漫长几秒） ---------------- */
  P.standoff = function (ctx, p, d, t) {
    var mx = 400, my = 560;     /* 主角机 */
    var tx = 880, ty = 250;     /* 被操控的朋友 */
    ctx.save();

    /* 目标：残破战机，驾驶舱暴露 */
    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(.16 + Math.sin(t * .0009) * .05);
    ctx.fillStyle = U.rgba('#4A2A6A', .95);
    ctx.beginPath();
    ctx.moveTo(-46, 0); ctx.lineTo(6, -16); ctx.lineTo(40, 0); ctx.lineTo(6, 16);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(14,10,20,.92)';
    ctx.beginPath();
    ctx.moveTo(-10, -14); ctx.lineTo(40, 0); ctx.lineTo(-10, 14); ctx.closePath(); ctx.fill();
    /* 破损与漏电 */
    ctx.strokeStyle = U.rgba('#C7A8F0', .85); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-30, -8); ctx.lineTo(-14, 6);
    ctx.moveTo(-20, 10); ctx.lineTo(-6, -4); ctx.stroke();
    if (Math.random() < .18) {
      ctx.strokeStyle = '#e8dcff'; ctx.lineWidth = 1.4;
      ctx.beginPath();
      var sx = -20 + Math.random() * 30, sy = -10 + Math.random() * 20;
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + U.rand(-14, 14), sy + U.rand(-12, 12));
      ctx.stroke();
    }
    /* 暴露的驾驶舱（护盾已解除） */
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, -4, -2, 46, '#C7A8F0', .5 + .22 * Math.sin(t * .005));
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = U.rgba('#e8dcff', .92);
    ctx.beginPath(); ctx.ellipse(-4, -2, 11, 8, 0, 0, U.TAU); ctx.fill();
    ctx.restore();

    /* 求救信号：一圈圈扩散的脉冲 */
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var k = 0; k < 3; k++) {
      var ph = ((t * .0005 + k / 3) % 1);
      ctx.strokeStyle = U.rgba('#C7A8F0', (1 - ph) * .45);
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(tx, ty, 40 + ph * 240, 0, U.TAU); ctx.stroke();
    }
    ctx.restore();

    /* 主角机 */
    ctx.save();
    ctx.translate(mx, my);
    ctx.rotate(-.62 + Math.sin(t * .0011) * .03);
    ctx.fillStyle = U.rgba('#4FC3F7', .95);
    ctx.beginPath();
    ctx.moveTo(30, 0); ctx.lineTo(-8, -12); ctx.lineTo(-26, 0); ctx.lineTo(-8, 12);
    ctx.closePath(); ctx.fill();
    /* 机翼与座舱：单纯一个四边形在这个尺寸下只是一块碎片，读不出「战机」 */
    ctx.fillStyle = U.rgba(U.shade('#4FC3F7', -.34), .95);
    ctx.beginPath();
    ctx.moveTo(-4, -9); ctx.lineTo(-16, -26); ctx.lineTo(-24, -24); ctx.lineTo(-12, -6);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-4, 9); ctx.lineTo(-16, 26); ctx.lineTo(-24, 24); ctx.lineTo(-12, 6);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = U.rgba(U.shade('#4FC3F7', -.6), .85);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(30, 0); ctx.lineTo(-8, -12); ctx.lineTo(-26, 0); ctx.lineTo(-8, 12);
    ctx.closePath(); ctx.stroke();
    /* 座舱罩 */
    ctx.fillStyle = 'rgba(228,250,255,.9)';
    ctx.beginPath(); ctx.ellipse(9, 0, 7, 4.2, 0, 0, U.TAU); ctx.fill();
    ctx.strokeStyle = U.rgba(U.shade('#4FC3F7', -.5), .8);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(9, 0, 7, 4.2, 0, 0, U.TAU); ctx.stroke();
    /* 机身脊线 */
    ctx.strokeStyle = 'rgba(255,255,255,.35)';
    ctx.beginPath(); ctx.moveTo(26, 0); ctx.lineTo(-20, 0); ctx.stroke();
    /* 弹药耗尽：引擎微弱 */
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, -26, 0, 22, '#5ce1ff', .25 + .12 * Math.sin(t * .004));
    ctx.restore();

    /* 瞄准线：颤抖的准星 —— 手在抖 */
    var tremble = 5 + Math.sin(t * .013) * 3.4;
    var jx = Math.sin(t * .021) * tremble, jy = Math.cos(t * .017) * tremble;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    /* 虚线瞄准线 */
    ctx.strokeStyle = 'rgba(255,90,110,.32)';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([9, 9]);
    ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(tx + jx, ty + jy); ctx.stroke();
    ctx.setLineDash([]);
    /* 准星 */
    var R = 34;
    ctx.strokeStyle = 'rgba(255,110,130,.85)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(tx + jx, ty + jy, R, 0, U.TAU); ctx.stroke();
    for (var q = 0; q < 4; q++) {
      var a = q / 4 * U.TAU + Math.PI / 4;
      ctx.beginPath();
      ctx.moveTo(tx + jx + Math.cos(a) * (R - 10), ty + jy + Math.sin(a) * (R - 10));
      ctx.lineTo(tx + jx + Math.cos(a) * (R + 10), ty + jy + Math.sin(a) * (R + 10));
      ctx.stroke();
    }
    ctx.restore();

    /* 心跳暗角脉冲 */
    var beat = Math.max(0, Math.sin(t * .0028));
    var vg = ctx.createRadialGradient(640, 360, 200, 640, 360, 620);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,' + (.4 + beat * .3) + ')');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  };

  /* ---------------- 地下空间：完整场景（好结局） ---------------- */
  P.undergroundRoom = function (ctx, p, d, t) {
    ctx.save();
    /* 后墙：混凝土板 + 水渍 */
    var wallTop = 90, floorY = 520;
    var wg = ctx.createLinearGradient(0, wallTop, 0, floorY);
    wg.addColorStop(0, '#12161c');
    wg.addColorStop(.55, '#1b2129');
    wg.addColorStop(1, '#232a33');
    ctx.fillStyle = wg;
    ctx.fillRect(0, wallTop, W, floorY - wallTop);
    /* 板缝 */
    ctx.strokeStyle = 'rgba(0,0,0,.45)';
    ctx.lineWidth = 2;
    for (var i = 1; i < 7; i++) {
      ctx.beginPath(); ctx.moveTo(i * (W / 7), wallTop); ctx.lineTo(i * (W / 7), floorY); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(0, wallTop + 150); ctx.lineTo(W, wallTop + 150); ctx.stroke();
    /* 水渍 */
    var rr = U.rng(515);
    for (var k = 0; k < 16; k++) {
      var sx = rr() * W, sy = wallTop + rr() * (floorY - wallTop) * .8;
      var sr = rr.range(30, 110);
      var sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
      sg.addColorStop(0, 'rgba(10,14,18,.5)');
      sg.addColorStop(1, 'rgba(10,14,18,0)');
      ctx.fillStyle = sg;
      ctx.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
    }

    /* 天花板 + 管道 */
    ctx.fillStyle = '#0a0d12';
    ctx.fillRect(0, 0, W, wallTop);
    ctx.strokeStyle = '#39424c'; ctx.lineWidth = 12;
    ctx.beginPath(); ctx.moveTo(0, 44); ctx.lineTo(W, 34); ctx.stroke();
    ctx.strokeStyle = '#2c343c'; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(0, 70); ctx.lineTo(W, 62); ctx.stroke();
    /* 悬垂线缆 */
    ctx.strokeStyle = 'rgba(20,24,30,.9)'; ctx.lineWidth = 3;
    for (var c = 0; c < 5; c++) {
      var cx0 = 120 + c * 260;
      ctx.beginPath();
      ctx.moveTo(cx0, 50);
      ctx.quadraticCurveTo(cx0 + 70, 50 + 60 + c * 12, cx0 + 150, 46);
      ctx.stroke();
    }

    /* 地面 + 反光 */
    var fg = ctx.createLinearGradient(0, floorY, 0, H);
    fg.addColorStop(0, '#1a2027');
    fg.addColorStop(1, '#0c1015');
    ctx.fillStyle = fg;
    ctx.fillRect(0, floorY, W, H - floorY);
    /* 湿地反光 */
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    var rg2 = ctx.createLinearGradient(0, floorY, 0, H);
    rg2.addColorStop(0, 'rgba(150,175,200,.10)');
    rg2.addColorStop(1, 'rgba(150,175,200,0)');
    ctx.fillStyle = rg2;
    ctx.fillRect(0, floorY, W, H - floorY);
    ctx.restore();
    ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, floorY); ctx.lineTo(W, floorY); ctx.stroke();

    /* 应急灯（带笼罩） + 光锥 */
    var flick = (Math.random() < .05) ? .35 : (.9 + Math.sin(t * .004) * .1);
    var lx = 300, ly = 150;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    var cone = ctx.createLinearGradient(lx, ly, lx, H);
    cone.addColorStop(0, 'rgba(190,210,235,' + (.22 * flick) + ')');
    cone.addColorStop(1, 'rgba(150,180,210,0)');
    ctx.fillStyle = cone;
    ctx.beginPath();
    ctx.moveTo(lx - 26, ly); ctx.lineTo(lx + 26, ly);
    ctx.lineTo(lx + 320, H); ctx.lineTo(lx - 320, H);
    ctx.closePath(); ctx.fill();
    glow(ctx, lx, ly, 130, '#c8dcf0', .3 * flick);
    ctx.restore();
    /* 灯体 */
    ctx.fillStyle = '#2a3138';
    ctx.fillRect(lx - 20, ly - 16, 40, 16);
    ctx.fillStyle = U.rgba('#e8f2ff', .85 * flick);
    ctx.fillRect(lx - 15, ly - 2, 30, 6);
    ctx.strokeStyle = '#4a545e'; ctx.lineWidth = 1.4;
    for (var g2 = 0; g2 < 4; g2++) {
      ctx.beginPath();
      ctx.moveTo(lx - 15 + g2 * 10, ly - 4); ctx.lineTo(lx - 15 + g2 * 10, ly + 6);
      ctx.stroke();
    }

    /* 远处的门缝：庆功宴的暖光（门体先画，光后画，否则光被门盖住） */
    var doorX = 1130;
    var breath = .12 + .05 * Math.sin(t * .0016);
    ctx.fillStyle = '#080b10';
    ctx.fillRect(doorX + 10, 200, 96, 310);
    ctx.strokeStyle = '#39424c'; ctx.lineWidth = 3;
    ctx.strokeRect(doorX + 10, 200, 96, 310);
    /* 门板分格 */
    ctx.strokeStyle = 'rgba(255,255,255,.05)'; ctx.lineWidth = 1.5;
    ctx.strokeRect(doorX + 22, 216, 72, 130);
    ctx.strokeRect(doorX + 22, 362, 72, 132);
    /* 门缝漏光 */
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    var slit = ctx.createLinearGradient(doorX, 0, doorX + 26, 0);
    slit.addColorStop(0, 'rgba(255,208,146,' + (.55 + breath) + ')');
    slit.addColorStop(.35, 'rgba(255,196,128,.20)');
    slit.addColorStop(1, 'rgba(255,196,128,0)');
    ctx.fillStyle = slit;
    ctx.fillRect(doorX, 198, 34, 314);
    /* 门缝在墙上的散射 */
    var wash = ctx.createLinearGradient(doorX + 4, 0, doorX - 190, 0);
    wash.addColorStop(0, 'rgba(255,198,132,' + (.16 + breath * .5) + ')');
    wash.addColorStop(1, 'rgba(255,198,132,0)');
    ctx.fillStyle = wash;
    ctx.fillRect(doorX - 190, 190, 194, 330);
    /* 光洒在地上的楔形 */
    ctx.fillStyle = U.rgba('#ffc884', .12 + breath * .5);
    ctx.beginPath();
    ctx.moveTo(doorX + 8, 508);
    ctx.lineTo(doorX + 8, floorY);
    ctx.lineTo(doorX - 250, H);
    ctx.lineTo(doorX + 40, H);
    ctx.closePath();
    ctx.fill();
    glow(ctx, doorX + 8, 350, 230, '#ffcf8a', .18 + breath);
    ctx.restore();
    /* 最亮的一线 */
    ctx.fillStyle = U.rgba('#fff0d2', .8);
    ctx.fillRect(doorX + 5, 200, 4, 310);

    /* 角落的旧长椅（TY 坐的地方） */
    var bx0 = 560, bw = 224, bsy = 486;
    /* 地面投影 */
    ctx.save();
    ctx.globalAlpha = .5;
    var bsh = ctx.createLinearGradient(0, bsy + 46, 0, bsy + 78);
    bsh.addColorStop(0, 'rgba(0,0,0,.55)');
    bsh.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = bsh;
    ctx.fillRect(bx0 - 14, bsy + 44, bw + 28, 34);
    ctx.restore();
    /* 靠背（两根横板） */
    ctx.fillStyle = '#2b2318';
    ctx.fillRect(bx0 + 8, bsy - 62, bw - 16, 13);
    ctx.fillRect(bx0 + 8, bsy - 40, bw - 16, 13);
    /* 靠背立柱 */
    ctx.fillStyle = '#1e2831';
    ctx.fillRect(bx0 + 12, bsy - 66, 9, 70);
    ctx.fillRect(bx0 + bw - 21, bsy - 66, 9, 70);
    /* 坐板：三条木条 */
    for (var bp = 0; bp < 3; bp++) {
      ctx.fillStyle = bp === 1 ? '#332a1d' : '#2b2318';
      ctx.fillRect(bx0, bsy + bp * 9, bw, 8);
      ctx.fillStyle = 'rgba(255,235,200,.07)';
      ctx.fillRect(bx0, bsy + bp * 9, bw, 2);
    }
    /* 铁腿 */
    ctx.fillStyle = '#1c242c';
    ctx.fillRect(bx0 + 16, bsy + 27, 13, 42);
    ctx.fillRect(bx0 + bw - 29, bsy + 27, 13, 42);
    ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.lineWidth = 1.5;
    ctx.strokeRect(bx0, bsy, bw, 26);

    /* 滴水 */
    for (var q = 0; q < 4; q++) {
      var ph = ((t * .0006 + q * .27) % 1);
      ctx.fillStyle = 'rgba(180,205,225,' + ((1 - ph) * .55) + ')';
      ctx.beginPath();
      ctx.ellipse(240 + q * 280, 70 + ph * 460, 1.8, 5.5, 0, 0, U.TAU);
      ctx.fill();
      if (ph > .95) {
        ctx.strokeStyle = 'rgba(180,205,225,.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(240 + q * 280, 530, (ph - .95) * 300, (ph - .95) * 80, 0, 0, U.TAU);
        ctx.stroke();
      }
    }
    ctx.restore();
  };

  /* ---------------- 分屏：两个过去 ---------------- */
  P.splitPast = function (ctx, p, d, t) {
    var q = U.smoothstep(U.clamp01(p * 2));
    var mid = 640;
    ctx.save();
    /* 左：Boss 的过去（被排挤的孩子） */
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, mid * q, H); ctx.clip();
    var g1 = ctx.createLinearGradient(0, 0, 0, H);
    g1.addColorStop(0, '#1a0410'); g1.addColorStop(1, '#4a0a20');
    ctx.fillStyle = g1; ctx.fillRect(0, 0, mid, H);
    /* 远处几个背对的剪影 + 一个被孤立的小人 */
    ctx.fillStyle = 'rgba(0,0,0,.55)';
    for (var i = 0; i < 4; i++) {
      var bx = 120 + i * 90, by = 470;
      stick(ctx, bx, by, .8, 'rgba(10,4,10,.9)');
    }
    stick(ctx, 130, 540, 1.0, U.rgba('#E0244A', .9));
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, 130, 470, 130, '#E0244A', .18);
    ctx.restore();

    /* 右：主角的过去（失去的人们） */
    ctx.save();
    ctx.beginPath(); ctx.rect(mid + (1 - q) * mid, 0, mid, H); ctx.clip();
    var g2 = ctx.createLinearGradient(0, 0, 0, H);
    g2.addColorStop(0, '#0a1428'); g2.addColorStop(1, '#123048');
    ctx.fillStyle = g2; ctx.fillRect(mid, 0, mid, H);
    var lost = ['#8D6E4A', '#FFFFFF', '#C7A8F0', '#FFA23A'];
    for (var k = 0; k < lost.length; k++) {
      ctx.globalAlpha = .32;
      stick(ctx, 800 + k * 110, 470, .75, lost[k]);
    }
    ctx.globalAlpha = 1;
    stick(ctx, 1140, 540, 1.0, U.rgba('#4FC3F7', .9));
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, 1140, 470, 130, '#4FC3F7', .18);
    ctx.restore();

    /* 中缝 */
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = U.rgba('#ffffff', .5 * q);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(mid, 0); ctx.lineTo(mid, H); ctx.stroke();
    glow(ctx, mid, H / 2, 120, '#ffffff', .12 * q);
    ctx.restore();

    /* 字 */
    if (q > .7) {
      Ui.text(ctx, '他 的 过 去', 300, 90, { size: 22, align: 'center', color: '#ff8098', glow: 1, glowColor: '#E0244A', alpha: (q - .7) / .3 });
      Ui.text(ctx, '你 的 过 去', 980, 90, { size: 22, align: 'center', color: '#8fd8ff', glow: 1, glowColor: '#4FC3F7', alpha: (q - .7) / .3 });
    }
  };

  /* 简易火柴人（painter 内部用，不含情绪） */
  function stick(ctx, x, y, s, col) {
    ctx.save();
    ctx.translate(x, y); ctx.scale(s, s);
    ctx.strokeStyle = col; ctx.fillStyle = col;
    ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, -46, 13, 0, U.TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, -33); ctx.lineTo(0, 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-14, -20); ctx.lineTo(14, -20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 4); ctx.lineTo(-11, 30); ctx.moveTo(0, 4); ctx.lineTo(11, 30); ctx.stroke();
    ctx.restore();
  }
  P._stick = stick;

  /* ---------------- 实验室环境叙事 ---------------- */
  P.mechLab = function (ctx, p, d, t) {
    ctx.save();
    /* 培养舱 */
    for (var i = 0; i < 3; i++) {
      var x = 300 + i * 340, y = 400;
      ctx.save();
      ctx.translate(x, y);
      /* 舱体 */
      ctx.fillStyle = 'rgba(20,24,30,.9)';
      U.roundRect(ctx, -58, -130, 116, 260, 52); ctx.fill();
      ctx.strokeStyle = 'rgba(255,90,60,.7)'; ctx.lineWidth = 2;
      U.roundRect(ctx, -58, -130, 116, 260, 52); ctx.stroke();
      /* 内部液体 */
      ctx.save();
      U.roundRect(ctx, -50, -122, 100, 244, 46); ctx.clip();
      var g = ctx.createLinearGradient(0, -122, 0, 122);
      g.addColorStop(0, 'rgba(180,60,80,.30)');
      g.addColorStop(1, 'rgba(90,20,40,.55)');
      ctx.fillStyle = g; ctx.fillRect(-50, -122, 100, 244);
      /* 气泡 */
      for (var k = 0; k < 7; k++) {
        var ph = (t * .0004 + k * .143 + i * .3) % 1;
        ctx.fillStyle = 'rgba(255,200,200,.35)';
        ctx.beginPath();
        ctx.arc(-30 + ((k * 17) % 60), 120 - ph * 240, 2 + (k % 3), 0, U.TAU);
        ctx.fill();
      }
      /* 里面的影子 */
      if (i === 1) {
        ctx.globalAlpha = .5;
        stick(ctx, 0, 60, .9, 'rgba(10,6,14,.9)');
      }
      ctx.restore();
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, 0, 0, 130, '#ff4a3c', .10 + .05 * Math.sin(t * .002 + i));
      ctx.restore();
    }
    /* 血迹与散落记录 */
    ctx.fillStyle = 'rgba(90,10,18,.55)';
    ctx.beginPath(); ctx.ellipse(720, 600, 130, 24, 0, 0, U.TAU); ctx.fill();
    ctx.fillStyle = 'rgba(220,220,215,.55)';
    for (var q2 = 0; q2 < 6; q2++) {
      ctx.save();
      ctx.translate(560 + q2 * 62, 620 + (q2 % 3) * 12);
      ctx.rotate((q2 - 3) * .22);
      ctx.fillRect(-18, -12, 36, 24);
      ctx.restore();
    }
    ctx.restore();
  };

  /* ---------------- 白色光之雨（IF 线觉醒） ---------------- */
  P.lightRain = function (ctx, p, d, t) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    var n = 90;
    for (var i = 0; i < n; i++) {
      var seed = i * 2.399;
      var x = ((Math.abs(Math.sin(seed) * 43758.5) % 1) * W + Math.sin(t * .0002 + i) * 20);
      var ph = ((t * .0011 + (Math.abs(Math.sin(seed * 1.7) * 1234.5) % 1)) % 1);
      var y = ph * (H + 200) - 100;
      var len = 40 + (i % 5) * 26;
      var a = (1 - Math.abs(ph - .5) * 1.2) * .85;
      var g = ctx.createLinearGradient(x, y, x, y + len);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(.5, 'rgba(255,252,240,' + a + ')');
      g.addColorStop(1, 'rgba(255,233,168,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - 1.4, y, 2.8, len);
    }
    /* 金色底光 */
    glow(ctx, 640, 620, 620, '#ffe9a8', .16 + .06 * Math.sin(t * .0016));
    ctx.restore();
  };

  /* 纹章觉醒 */
  P.emblemAwake = function (ctx, p, d, t) {
    var x = d.x === undefined ? 640 : d.x, y = d.y === undefined ? 330 : d.y;
    var q = U.smoothstep(p);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, x, y, 70 + q * 300, '#ffe9a8', .55 * q);
    /* 菱形纹章 */
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(q * .3);
    ctx.scale(1 + q * .7, 1 + q * .7);
    ctx.strokeStyle = U.rgba('#fff6d0', .95);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -40); ctx.lineTo(30, 0); ctx.lineTo(0, 40); ctx.lineTo(-30, 0);
    ctx.closePath(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -20); ctx.lineTo(15, 0); ctx.lineTo(0, 20); ctx.lineTo(-15, 0);
    ctx.closePath(); ctx.stroke();
    ctx.restore();
    /* 扩散光环 */
    for (var k = 0; k < 3; k++) {
      var rr = ((t * .32 + k * 200) % 620) * q;
      ctx.strokeStyle = U.rgba('#ffe9a8', (1 - rr / 620) * .5);
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, rr, 0, U.TAU); ctx.stroke();
    }
    ctx.restore();
  };

  /* ---------------- 结局：都市逐一坠落 ---------------- */
  P.cityFall = function (ctx, p, d, t) {
    var list = [
      { x: 210, y: 210, s: .9, delay: 0 },
      { x: 1030, y: 180, s: .8, delay: .16 },
      { x: 620, y: 250, s: 1.15, delay: .34 },
      { x: 380, y: 160, s: .65, delay: .52 },
      { x: 860, y: 300, s: .75, delay: .70 }
    ];
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      var q = U.clamp01((p - c.delay) / .42);
      if (q <= 0) {
        Art.fallingCity(ctx, c.x, c.y, c.s, 0, '#241820', '#ff9a6a');
      } else {
        var yy = c.y + q * q * 760;
        ctx.save();
        ctx.globalAlpha = 1 - q * .35;
        Art.fallingCity(ctx, c.x + Math.sin(q * 6) * 22, yy, c.s, q, '#241820', '#ff7a4a');
        ctx.restore();
      }
    }
    /* 火光泛红 */
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, 640, 760, 900, '#ff5a28', .18 + p * .22);
    ctx.restore();
  };

  /* 幸存者互相残杀（远景剪影） */
  P.survivorFight = function (ctx, p, d, t) {
    ctx.save();
    ctx.globalAlpha = .85;
    var pairs = [[380, 560], [720, 590], [980, 555]];
    for (var i = 0; i < pairs.length; i++) {
      var x = pairs[i][0], y = pairs[i][1];
      var sw = Math.sin(t * .004 + i * 2) * 8;
      stick(ctx, x - 24 + sw, y, .8, 'rgba(12,8,10,.95)');
      stick(ctx, x + 24 - sw, y, .8, 'rgba(12,8,10,.95)');
      /* 火花 */
      if (Math.sin(t * .006 + i) > .9) {
        ctx.globalCompositeOperation = 'lighter';
        glow(ctx, x, y - 30, 40, '#ffcf6a', .5);
        ctx.globalCompositeOperation = 'source-over';
      }
    }
    ctx.restore();
  };

  /* 两具靠在一起的白骨 + 锈战机 */
  P.boneScene = function (ctx, p, d, t) {
    ctx.save();
    Art.wreckPlane(ctx, 900, 520, 1.5, '#6a5c50');
    Art.bones(ctx, 560, 560, 1.5, '#d8d4cc');
    ctx.save();
    ctx.translate(0, 0);
    Art.bones(ctx, 618, 566, 1.45, '#cfcbc2');
    ctx.restore();
    /* 风吹的沙 */
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < 40; i++) {
      var x = ((t * .06 + i * 37) % (W + 100)) - 50;
      var y = 480 + (i % 7) * 26 + Math.sin(t * .002 + i) * 6;
      ctx.fillStyle = 'rgba(200,196,186,.14)';
      ctx.fillRect(x, y, 12, 1.2);
    }
    ctx.restore();
  };

  /* TY 独自在黑暗中推演 */
  P.tyAlone = function (ctx, p, d, t) {
    ctx.save();
    /* 一束顶光 */
    ctx.globalCompositeOperation = 'lighter';
    var g = ctx.createLinearGradient(640, 40, 640, 620);
    g.addColorStop(0, 'rgba(170,190,210,.16)');
    g.addColorStop(1, 'rgba(120,150,180,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(560, 0); ctx.lineTo(720, 0); ctx.lineTo(810, 620); ctx.lineTo(470, 620);
    ctx.closePath(); ctx.fill();
    ctx.restore();
    /* 虚空推演的公式符号 */
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    var syms = ['∑', '∂', '∞', 'Δ', 'λ', 'π', '∫', 'Ω', '≠', '→'];
    for (var i = 0; i < 16; i++) {
      var a = t * .0006 + i * .4;
      var rr = 90 + (i % 4) * 34;
      var x = 640 + Math.cos(a) * rr;
      var y = 380 + Math.sin(a * 1.3) * rr * .6;
      ctx.globalAlpha = .18 + .18 * Math.sin(t * .002 + i);
      ctx.fillStyle = '#cfe0ee';
      ctx.font = (14 + (i % 3) * 6) + 'px ' + G.FONT;
      ctx.textAlign = 'center';
      ctx.fillText(syms[i % syms.length], x, y);
    }
    ctx.restore();
  };

  /* 监控录像风格（坏结局C） */
  P.surveil = function (ctx, p, d, t) {
    ctx.save();
    /* 底：荒废废墟 */
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0d1014'); g.addColorStop(1, '#20262c');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    /* 废墟块 */
    var rr = U.rng(4242);
    for (var i = 0; i < 26; i++) {
      ctx.fillStyle = 'rgba(48,54,60,' + rr.range(.4, .9) + ')';
      var w = rr.range(30, 130), h = rr.range(14, 90);
      ctx.fillRect(rr() * W, 420 + rr() * 240, w, h);
    }
    /* 尸体：抬头看天的姿势 */
    ctx.save();
    ctx.translate(640, 560);
    ctx.strokeStyle = '#5a6b7a'; ctx.fillStyle = '#5a6b7a';
    ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, -34, 13, 0, U.TAU); ctx.fill();
    /* 脸朝上 */
    ctx.strokeStyle = '#2a3540'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(-5, -38, 3, 0, U.TAU); ctx.moveTo(8, -38); ctx.arc(5, -38, 3, 0, U.TAU); ctx.stroke();
    ctx.strokeStyle = '#5a6b7a'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(0, -21); ctx.lineTo(4, 6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(2, -14); ctx.lineTo(-26, -22); ctx.moveTo(2, -14); ctx.lineTo(30, -20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(4, 6); ctx.lineTo(-18, 24); ctx.moveTo(4, 6); ctx.lineTo(28, 22); ctx.stroke();
    ctx.restore();
    /* 一个幸存者走近 */
    var wx = U.lerp(1180, 760, U.smoothstep(U.clamp01(p * 1.4)));
    stick(ctx, wx, 566, 1.0, 'rgba(90,104,118,.95)');
    /* 录像 UI */
    ctx.globalAlpha = .8;
    Ui.text(ctx, '● REC', 60, 62, { size: 18, weight: 700, color: '#ff4a4a', shadow: false });
    Ui.text(ctx, 'CAM-07   FLOATING DISTRICT 4   [SIGNAL LOST]', 60, 90,
            { size: 13, color: 'rgba(200,220,235,.7)', shadow: false, font: G.FONT_MONO });
    Ui.text(ctx, '--:--:--', 1220, 62, { size: 16, align: 'right', color: 'rgba(200,220,235,.7)', shadow: false, font: G.FONT_MONO });
    /* 画框角 */
    ctx.strokeStyle = 'rgba(220,240,255,.5)'; ctx.lineWidth = 2;
    [[40, 40, 1, 1], [1240, 40, -1, 1], [40, 680, 1, -1], [1240, 680, -1, -1]].forEach(function (c) {
      ctx.beginPath();
      ctx.moveTo(c[0] + 26 * c[2], c[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(c[0], c[1] + 26 * c[3]);
      ctx.stroke();
    });
    ctx.restore();
  };

  /* 暴君秩序（坏结局D）：主角站在最高点，身后是Boss雕像 */
  P.tyrantScene = function (ctx, p, d, t) {
    ctx.save();
    /* 平台 */
    ctx.fillStyle = '#140618';
    ctx.beginPath();
    ctx.moveTo(340, 620); ctx.lineTo(940, 620); ctx.lineTo(880, 720); ctx.lineTo(400, 720);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(192,90,144,.7)'; ctx.lineWidth = 2; ctx.stroke();
    /* Boss 雕像（背后，巨大） */
    ctx.save();
    ctx.translate(640, 600);
    ctx.scale(3.1, 3.1);
    ctx.globalAlpha = .55;
    ctx.strokeStyle = '#3a0a24'; ctx.fillStyle = '#2a0618';
    ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, -60, 15, 0, U.TAU); ctx.fill();
    /* 尖冠 */
    ctx.beginPath();
    ctx.moveTo(-16, -68); ctx.lineTo(-12, -92); ctx.lineTo(-4, -72);
    ctx.lineTo(2, -98); ctx.lineTo(10, -70); ctx.lineTo(16, -88); ctx.lineTo(17, -66);
    ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, -45); ctx.lineTo(0, -4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-18, -32); ctx.lineTo(18, -32); ctx.stroke();
    /* 披风 */
    ctx.beginPath();
    ctx.moveTo(-20, -34); ctx.lineTo(-32, 4); ctx.lineTo(32, 4); ctx.lineTo(20, -34);
    ctx.closePath(); ctx.fill();
    ctx.restore();
    /* 主角剪影（小、孤独） */
    stick(ctx, 640, 600, 1.25, U.rgba('#1c3a5c', .95));
    /* 脚下云海 */
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, 640, 700, 500, '#6a1a48', .2);
    ctx.restore();
  };

  /* 纯白虚无（坏结局B） */
  P.whiteVoid = function (ctx, p, d, t) {
    ctx.save();
    ctx.fillStyle = '#f6f8fa';
    ctx.fillRect(0, 0, W, H);
    /* 极淡的溶解痕迹 */
    ctx.globalAlpha = .10 * (1 - p);
    for (var i = 0; i < 30; i++) {
      ctx.fillStyle = '#8fa0b0';
      var x = 640 + Math.sin(i * 1.7) * 200;
      var y = 400 + Math.cos(i * 2.1) * 120 + p * 200;
      ctx.beginPath(); ctx.arc(x, y, 30 + (i % 5) * 12, 0, U.TAU); ctx.fill();
    }
    ctx.restore();
  };

  /* 溶解的立绘（放弃回归） */
  P.dissolve = function (ctx, p, d, t) {
    var x = d.x === undefined ? 640 : d.x, y = d.y === undefined ? 470 : d.y;
    var col = d.color || '#4FC3F7';
    ctx.save();
    /* 像被水浸泡的纸：从下往上褪色 + 边缘晕开 */
    ctx.globalAlpha = 1 - p * .9;
    G.Portrait.draw(ctx, G.Chars[d.who || 'hero'], x, y, d.scale || 1.4, {
      emo: 'numb', alpha: 1 - p * .85, t: t,
      tintColor: '#ffffff', tintAmt: p * .8, distort: p * .6
    });
    /* 晕开的色块 */
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < 24; i++) {
      var ph = ((i * .0417 + p) % 1);
      ctx.globalAlpha = (1 - ph) * .3 * (1 - p * .5);
      var rr = 8 + ph * 70;
      ctx.fillStyle = U.rgba(col, .5);
      ctx.beginPath();
      ctx.arc(x + Math.sin(i * 2.3) * 40 * ph, y - 70 + Math.cos(i * 1.7) * 90 - ph * 40, rr, 0, U.TAU);
      ctx.fill();
    }
    ctx.restore();
  };

  /* 所有死者的面孔（坏结局B 的回归瞬间） */
  /* 死者名单单独维护：StarColors 是彩蛋星空的出场序（且刻意不含正直的人，
     他那颗星要单独闪）。这里要的是「死在主角面前的每一张脸」。 */
  var FACE_ROSTER = ['oldman', 'upright', 'lucky', 'puppet'];

  P.deadFaces = function (ctx, p, d, t) {
    var ids = [];
    for (var k = 0; k < FACE_ROSTER.length; k++) {
      if (d.all || (G.St.isDead && G.St.isDead(FACE_ROSTER[k]))) ids.push(FACE_ROSTER[k]);
    }
    if (!ids.length) return;
    ctx.save();
    var q = U.smoothstep(U.clamp01(p * 1.5));
    /* 横向浅弧排布：让开画面中轴的主角立绘，两端的脸往下沉。
       不用栅格 —— 人数为偶数时正中间那格会正好糊在主角胸口。 */
    var n = ids.length;
    var half = (n - 1) / 2;
    var spread = Math.min(300, 1080 / Math.max(1, n));
    for (var i = 0; i < n; i++) {
      var ch = G.Chars[ids[i]];
      if (!ch) continue;
      var off = i - half;
      var x = 640 + off * spread;
      var y = 252 + (half ? Math.abs(off) / half : 0) * 92 + Math.sin(t * .0009 + i * 1.9) * 7;
      var a = q * (.54 + .2 * Math.sin(t * .002 + i));
      /* 白色虚空里浅色角色（正直的人纯白）整张脸会消失，先垫一层暗晕托出轮廓 */
      ctx.globalAlpha = a * .62;
      ctx.globalCompositeOperation = 'multiply';
      ctx.drawImage(G.Fx.glowSprite('#5d6b7c'), x - 104, y - 104, 208, 208);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = a;
      G.Portrait.thumb(ctx, ch, x, y, 116, { emo: 'numb' });
    }
    ctx.restore();
  };

  /* ---------------- 彩蛋结局：星空（每颗星=一个角色） ---------------- */
  P.starsSky = function (ctx, p, d, t) {
    ctx.save();
    var list = G.StarColors;
    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      var ang = i / list.length * U.TAU;
      var x = 640 + Math.cos(ang * 1.3 + 1) * (240 + i * 34);
      var y = 200 + Math.sin(ang * 1.7) * 110 - i * 8;
      var tw = .55 + .45 * Math.sin(t * .0016 + i * 1.7);
      var q = U.clamp01((p - i * .07) / .3);
      if (q <= 0) continue;
      Art.star(ctx, x, y, 3.4, e.color, q * tw);
      if (p > .8) {
        Ui.text(ctx, e.label, x, y + 34, {
          size: 12, align: 'center', color: U.rgba(e.color, (p - .8) / .2 * .8), shadow: false
        });
      }
    }
    /* 正直的人自己的星（闪烁，暗示还活着） */
    var blink = Math.sin(t * .005) > -.2 ? 1 : .25;
    if (p > .55) Art.star(ctx, 640, 150, 4.4, '#FFE9A8', U.clamp01((p - .55) / .3) * blink);
    ctx.restore();
  };

  /* 新世界广场 */
  P.newPlaza = function (ctx, p, d, t) {
    ctx.save();
    /* 地面 */
    var g = ctx.createLinearGradient(0, 560, 0, 720);
    g.addColorStop(0, '#8aa8b8'); g.addColorStop(1, '#5c7688');
    ctx.fillStyle = g; ctx.fillRect(0, 560, W, 160);
    /* 铺砖线 */
    ctx.strokeStyle = 'rgba(255,255,255,.16)'; ctx.lineWidth = 1;
    for (var i = 0; i < 14; i++) {
      ctx.beginPath();
      ctx.moveTo(640 + (i - 7) * 40, 560);
      ctx.lineTo(640 + (i - 7) * 160, 720);
      ctx.stroke();
    }
    for (var k = 0; k < 5; k++) {
      ctx.beginPath(); ctx.moveTo(0, 566 + k * k * 7); ctx.lineTo(W, 566 + k * k * 7); ctx.stroke();
    }
    /* 朴素建筑 */
    for (var b = 0; b < 7; b++) {
      var bx = 90 + b * 175, bw = 90 + (b % 3) * 26, bh = 120 + (b % 4) * 54;
      ctx.fillStyle = 'rgba(232,238,240,.92)';
      ctx.fillRect(bx, 560 - bh, bw, bh);
      ctx.fillStyle = 'rgba(150,175,190,.5)';
      ctx.fillRect(bx + bw - 12, 560 - bh, 12, bh);
      /* 窗（暖光） */
      for (var r = 0; r < Math.floor(bh / 30); r++) {
        for (var c = 0; c < 2; c++) {
          ctx.fillStyle = 'rgba(255,225,160,' + (.5 + .4 * Math.sin(t * .001 + b + r + c)) + ')';
          ctx.fillRect(bx + 14 + c * 34, 560 - bh + 16 + r * 30, 18, 14);
        }
      }
      /* 屋顶小旗 */
      ctx.strokeStyle = '#7a8e9c'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(bx + bw / 2, 560 - bh); ctx.lineTo(bx + bw / 2, 560 - bh - 22); ctx.stroke();
      ctx.fillStyle = '#ffd08a';
      ctx.beginPath();
      ctx.moveTo(bx + bw / 2, 560 - bh - 22);
      ctx.lineTo(bx + bw / 2 + 18 + Math.sin(t * .003 + b) * 3, 560 - bh - 16);
      ctx.lineTo(bx + bw / 2, 560 - bh - 10);
      ctx.closePath(); ctx.fill();
    }
    /* 人群（普通人：士兵、工匠、孩子） */
    var crowd = [
      { x: 420, s: .95, c: '#6a8898' }, { x: 470, s: .82, c: '#8a7060' },
      { x: 800, s: .9, c: '#70889a' }, { x: 860, s: .7, c: '#c8a878' },
      { x: 340, s: .68, c: '#d8c090' }, { x: 920, s: .88, c: '#7a8a70' }
    ];
    for (var q2 = 0; q2 < crowd.length; q2++) {
      var cc = crowd[q2];
      stick(ctx, cc.x, 596 + (1 - cc.s) * 20, cc.s, cc.c);
    }
    ctx.restore();
  };

  /* 庆功宴的模糊笑声（好结局：远处灯光） */
  P.farFeast = function (ctx, p, d, t) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    var x = d.x === undefined ? 1140 : d.x;
    glow(ctx, x, 300, 220, '#ffcf8a', .12 + .04 * Math.sin(t * .002));
    for (var i = 0; i < 12; i++) {
      var a = .2 + .2 * Math.sin(t * .003 + i * 1.3);
      ctx.fillStyle = U.rgba('#ffdca8', a);
      ctx.beginPath();
      ctx.arc(x - 40 + (i % 4) * 26, 240 + Math.floor(i / 4) * 40, 2.6, 0, U.TAU);
      ctx.fill();
    }
    ctx.restore();
  };

  /* 地下空间：昏暗应急灯 */
  P.emergencyLight = function (ctx, p, d, t) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    var flick = (Math.random() < .04) ? .25 : 1;
    glow(ctx, 300, 200, 260, '#7a90a4', .14 * flick);
    glow(ctx, 980, 240, 220, '#6a8090', .1 * flick);
    ctx.restore();
    /* 管道与滴水 */
    ctx.save();
    ctx.strokeStyle = 'rgba(90,104,116,.7)'; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(0, 120); ctx.lineTo(W, 96); ctx.stroke();
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(0, 168); ctx.lineTo(W, 150); ctx.stroke();
    for (var i = 0; i < 4; i++) {
      var ph = ((t * .0007 + i * .27) % 1);
      ctx.fillStyle = 'rgba(170,200,220,' + (1 - ph) * .5 + ')';
      ctx.beginPath();
      ctx.ellipse(220 + i * 280, 130 + ph * 480, 1.8, 5, 0, 0, U.TAU);
      ctx.fill();
    }
    ctx.restore();
  };

  /* 疯癫反转：正经战斗姿态的剪影压迫 */
  P.madSerious = function (ctx, p, d, t) {
    /* 光心放在他头部，不是胯部 */
    var ox = 978, oy = 296;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, ox, oy, 340, '#B8860B', .17 + .06 * Math.sin(t * .002));
    ctx.restore();
    /* 精准的几何弹道预示线：近端亮、远端散尽，
       否则就是一堆横穿画面、把主角也划开的直线 */
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineWidth = 1.4;
    for (var i = 0; i < 14; i++) {
      var a = i / 14 * U.TAU + t * .0004;
      var len = 620 + 120 * Math.sin(i * 2.1 + t * .0015);
      var ex = ox + Math.cos(a) * len, ey = oy + Math.sin(a) * len;
      var g2 = ctx.createLinearGradient(ox, oy, ex, ey);
      g2.addColorStop(0, 'rgba(214,168,40,.55)');
      g2.addColorStop(.35, 'rgba(184,134,11,.24)');
      g2.addColorStop(1, 'rgba(184,134,11,0)');
      ctx.strokeStyle = g2;
      ctx.beginPath();
      ctx.moveTo(ox + Math.cos(a) * 46, oy + Math.sin(a) * 46);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    }
    /* 预示环：一圈缓慢收紧的准星，暗示他算得出每一发 */
    var ph2 = (t * .00035) % 1;
    ctx.strokeStyle = 'rgba(214,168,40,' + ((1 - ph2) * .3) + ')';
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(ox, oy, 60 + (1 - ph2) * 300, 0, U.TAU); ctx.stroke();
    ctx.restore();
  };

  /* 躲藏（主角蜷缩在角落） */
  P.hideCorner = function (ctx, p, d, t) {
    ctx.save();
    /* 前景遮挡箱体 */
    ctx.fillStyle = 'rgba(14,12,18,.94)';
    ctx.beginPath();
    ctx.moveTo(0, 720); ctx.lineTo(0, 380); ctx.lineTo(300, 420); ctx.lineTo(340, 720);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(1280, 720); ctx.lineTo(1280, 340); ctx.lineTo(940, 400); ctx.lineTo(900, 720);
    ctx.closePath(); ctx.fill();
    /* 呼吸暗角 */
    var br = .5 + .5 * Math.sin(t * .006);
    var g = ctx.createRadialGradient(640, 460, 120, 640, 460, 520);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,' + (.6 + br * .2) + ')');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.restore();
  };

  /* 通用：横向流动的能量线（Boss 转阶段） */
  P.energyLines = function (ctx, p, d, t) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    var col = d.color || '#ff2b4e';
    for (var i = 0; i < 22; i++) {
      var y = (i / 22) * H;
      var x = ((t * .8 + i * 140) % (W + 600)) - 300;
      var g = ctx.createLinearGradient(x, y, x + 300, y);
      g.addColorStop(0, U.rgba(col, 0));
      g.addColorStop(.5, U.rgba(col, .5));
      g.addColorStop(1, U.rgba(col, 0));
      ctx.fillStyle = g;
      ctx.fillRect(x, y, 300, 2.4);
    }
    ctx.restore();
  };

  /* 通用：全屏文字冲击（核心台词） */
  P.impactText = function (ctx, p, d, t) {
    var q = U.smoothstep(U.clamp01(p * 2.2));
    ctx.save();
    ctx.globalAlpha = (p > .82 ? (1 - (p - .82) / .18) : 1);
    var sc = 1 + (1 - q) * .5;
    ctx.translate(640, d.y === undefined ? 300 : d.y);
    ctx.scale(sc, sc);
    Ui.spaced(ctx, d.text || '', 0, 0, {
      size: d.size || 40, weight: 900, align: 'center', spacing: d.spacing === undefined ? 6 : d.spacing,
      gradient: d.grad || ['#ffffff', '#ff8098'], glow: 1, glowColor: d.glow || '#E0244A'
    });
    ctx.restore();
  };

})(window);
