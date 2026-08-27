/* ===========================================================
   fx.js — 屏幕特效与粒子
     震屏 / 闪光 / 色调 / 暗角 / 黑边 / 扫描线 / 故障撕裂 / 慢放涡流
     粒子：火花、碎片(立绘碎裂)、烟、星、羽毛、光环、浮字
   =========================================================== */
(function (root) {
  'use strict';
  var G = root.G, U = G.U;

  var W = 1280, H = 720;

  var Fx = G.Fx = {
    shakeP: 0, shakeT: 0, shakeDur: 0,
    ox: 0, oy: 0, rot: 0,
    tintColor: '#000', tintA: 0,
    flashColor: '#fff', flashA: 0, flashDur: 1,
    vignette: 0.22, vignetteColor: '#000',
    redEdge: 0,
    letterbox: 0,
    scanlines: 0,
    grain: 0,
    grainFloor: .5,
    glitch: 0,
    chroma: 0,
    desatAmt: 0,
    bloom: 0,
    zoom: 1, zoomCx: 640, zoomCy: 360,
    _t: 0
  };

  /* ---------------- 粒子池 ---------------- */
  function mkP() {
    return { x: 0, y: 0, vx: 0, vy: 0, ax: 0, ay: 0, life: 0, max: 1, size: 4, size2: 0,
             color: '#fff', kind: 'spark', rot: 0, vr: 0, a: 1, drag: 1, text: '', glow: 0,
             sway: 0, phase: 0, w: 4, h: 4 };
  }
  var pool = new U.Pool(mkP, 1400);
  Fx.pool = pool;

  var glowCache = {};
  function glow(color) {
    if (!glowCache[color]) glowCache[color] = U.glowSprite(64, color, 1);
    return glowCache[color];
  }
  Fx.glowSprite = glow;

  function spawn(o) {
    var p = pool.get();
    if (!p) return null;
    p.x = o.x; p.y = o.y;
    p.vx = o.vx || 0; p.vy = o.vy || 0;
    p.ax = o.ax || 0; p.ay = o.ay || 0;
    p.max = p.life = o.life || 600;
    p.size = o.size || 4; p.size2 = o.size2 === undefined ? 0 : o.size2;
    p.color = o.color || '#fff';
    p.kind = o.kind || 'spark';
    p.rot = o.rot || 0; p.vr = o.vr || 0;
    p.a = o.a === undefined ? 1 : o.a;
    p.drag = o.drag === undefined ? 1 : o.drag;
    p.text = o.text || '';
    p.glow = o.glow || 0;
    p.sway = o.sway || 0;
    p.phase = Math.random() * U.TAU;
    p.w = o.w || p.size; p.h = o.h || p.size;
    return p;
  }
  Fx.spawn = spawn;

  /* 火花爆散 */
  Fx.burst = function (x, y, opt) {
    opt = opt || {};
    var n = opt.n || 14;
    for (var i = 0; i < n; i++) {
      var a = opt.dir === undefined ? Math.random() * U.TAU : opt.dir + (Math.random() - .5) * (opt.spread || U.TAU);
      var s = U.rand(opt.spdMin || .8, opt.spdMax || 4.2);
      spawn({
        x: x + U.rand(-2, 2), y: y + U.rand(-2, 2),
        vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        ay: opt.gravity || 0, drag: opt.drag === undefined ? .965 : opt.drag,
        life: U.rand(opt.life || 320, (opt.life || 320) * 1.9),
        size: U.rand(opt.size || 2, (opt.size || 2) * 2.4),
        color: opt.color || '#ffd479', kind: 'spark', glow: opt.glow === undefined ? 1 : opt.glow
      });
    }
  };
  /* 爆炸（烟+火花+环） */
  Fx.explode = function (x, y, opt) {
    opt = opt || {};
    var big = opt.big;
    Fx.burst(x, y, { n: big ? 34 : 16, color: opt.color || '#ffb15e', spdMax: big ? 7 : 4, size: big ? 3.4 : 2.2, life: big ? 620 : 380 });
    for (var i = 0; i < (big ? 14 : 6); i++) {
      spawn({
        x: x + U.rand(-8, 8), y: y + U.rand(-8, 8),
        vx: U.rand(-1.1, 1.1), vy: U.rand(-1.4, .3),
        life: U.rand(600, 1500), size: U.rand(big ? 16 : 8, big ? 42 : 20),
        size2: big ? 90 : 44, color: opt.smoke || '#3a2b33', kind: 'smoke', a: .5, drag: .97
      });
    }
    Fx.ring(x, y, { color: opt.color || '#ffd479', r: big ? 12 : 6, r2: big ? 190 : 78, life: big ? 620 : 340, width: big ? 6 : 3 });
    if (big) Fx.ring(x, y, { color: '#fff', r: 4, r2: 120, life: 300, width: 2 });
  };
  /* 冲击环 */
  Fx.ring = function (x, y, opt) {
    opt = opt || {};
    spawn({ x: x, y: y, life: opt.life || 400, size: opt.r || 6, size2: opt.r2 || 80,
            color: opt.color || '#8ef', kind: 'ring', w: opt.width || 3, a: opt.a === undefined ? 1 : opt.a });
  };
  /* 立绘碎裂（火柴人碎成光点） */
  Fx.shards = function (x, y, color, n, opt) {
    opt = opt || {};
    n = n || 40;
    for (var i = 0; i < n; i++) {
      var a = Math.random() * U.TAU;
      var s = U.rand(.5, opt.spd || 3.2);
      spawn({
        x: x + U.rand(-(opt.rx || 28), (opt.rx || 28)),
        y: y + U.rand(-(opt.ry || 90), (opt.ry || 90)),
        vx: Math.cos(a) * s * .5, vy: Math.sin(a) * s - U.rand(.2, 1.4),
        ay: opt.gravity === undefined ? .006 : opt.gravity, drag: .988,
        life: U.rand(900, 2400), size: U.rand(2, 6), rot: Math.random() * U.TAU, vr: U.rand(-.06, .06),
        color: color, kind: 'shard', glow: 1
      });
    }
  };
  /* 上升光点（消散/星尘） */
  Fx.motes = function (x, y, color, n, opt) {
    opt = opt || {};
    for (var i = 0; i < (n || 20); i++) {
      spawn({
        x: x + U.rand(-(opt.rx || 30), (opt.rx || 30)),
        y: y + U.rand(-(opt.ry || 70), (opt.ry || 70)),
        vx: U.rand(-.25, .25), vy: U.rand(-1.1, -.25),
        life: U.rand(1200, 3000), size: U.rand(1.6, 4.2),
        color: color, kind: 'mote', glow: 1, sway: U.rand(.2, .8)
      });
    }
  };
  /* 羽毛（运气好的人之死） */
  Fx.feather = function (x, y, color) {
    spawn({ x: x, y: y, vx: U.rand(-.3, .3), vy: U.rand(.15, .45),
            life: 6000, size: U.rand(9, 16), color: color || '#ffd8a8', kind: 'feather',
            rot: Math.random() * U.TAU, vr: U.rand(-.012, .012), sway: U.rand(.6, 1.4), glow: .6 });
  };
  /* 浮动伤害/提示字 */
  Fx.float = function (x, y, text, color, opt) {
    opt = opt || {};
    spawn({ x: x, y: y, vy: opt.vy === undefined ? -.5 : opt.vy, life: opt.life || 900,
            text: text, color: color || '#fff', kind: 'text', size: opt.size || 18, drag: .99 });
  };
  /* 拖尾点 */
  Fx.trail = function (x, y, color, size, life) {
    spawn({ x: x, y: y, life: life || 240, size: size || 5, color: color, kind: 'mote', glow: 1, vy: 0 });
  };
  /* 血迹/能量溅射（受击） */
  Fx.splash = function (x, y, dir, color) {
    for (var i = 0; i < 10; i++) {
      var a = dir + U.rand(-.7, .7);
      var s = U.rand(1.5, 5);
      spawn({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, drag: .93,
              life: U.rand(240, 520), size: U.rand(1.5, 4), color: color || '#ff6b8a', kind: 'spark', glow: 1 });
    }
  };
  Fx.clearParticles = function () { pool.clear(); };

  /* ---------------- 屏幕效果控制 ---------------- */
  Fx.shake = function (power, ms) {
    power = power || 8;
    if (power > Fx.shakeP || Fx.shakeT >= Fx.shakeDur) {
      Fx.shakeP = power; Fx.shakeT = 0; Fx.shakeDur = ms || 320;
    } else {
      Fx.shakeP = Math.max(Fx.shakeP, power);
      Fx.shakeDur = Math.max(Fx.shakeDur, Fx.shakeT + (ms || 320));
    }
  };
  /* 光敏友好：settings.flash = 0 时大幅削弱全屏闪光与故障撕裂。
     不是直接关掉——演出信息还要保留——而是把亮度跳变压到安全范围并拉长过渡。 */
  function flashScale() {
    var st = G.Save && G.Save.data && G.Save.data.settings;
    return (st && st.flash === 0) ? .14 : 1;
  }
  function glitchScale() {
    var st = G.Save && G.Save.data && G.Save.data.settings;
    return (st && st.flash === 0) ? .22 : 1;
  }
  Fx.reducedFlash = function () { return flashScale() < 1; };

  Fx.flash = function (color, ms, alpha) {
    var k = flashScale();
    Fx.flashColor = color || '#fff';
    Fx.flashA = (alpha === undefined ? .8 : alpha) * k;
    Fx.flashDur = (ms || 260) * (k < 1 ? 1.6 : 1);
    Fx._flashT = 0;
    Fx._flashA0 = Fx.flashA;
  };
  Fx.tint = function (color, alpha, ms) {
    Fx.tintColor = color || '#000';
    if (ms) {
      var o = { a: Fx.tintA };
      G.Tw.to(o, ms, { a: alpha, ease: 'outQuad', onUpdate: function () { Fx.tintA = o.a; } });
    } else Fx.tintA = alpha;
  };
  Fx.setVignette = function (v, ms, color) {
    if (color) Fx.vignetteColor = color;
    if (ms) {
      var o = { a: Fx.vignette };
      G.Tw.to(o, ms, { a: v, onUpdate: function () { Fx.vignette = o.a; } });
    } else Fx.vignette = v;
  };
  Fx.setRedEdge = function (v, ms) {
    if (ms) {
      var o = { a: Fx.redEdge };
      G.Tw.to(o, ms, { a: v, onUpdate: function () { Fx.redEdge = o.a; } });
    } else Fx.redEdge = v;
  };
  Fx.setLetterbox = function (v, ms) {
    var o = { a: Fx.letterbox };
    if (!ms) { Fx.letterbox = v; return; }
    G.Tw.to(o, ms, { a: v, ease: 'outCubic', onUpdate: function () { Fx.letterbox = o.a; } });
  };
  Fx.glitchBurst = function (ms, power) {
    Fx.glitch = (power === undefined ? 1 : power) * glitchScale();
    var o = { g: Fx.glitch };
    G.Tw.to(o, ms || 500, { g: 0, onUpdate: function () { Fx.glitch = o.g; } });
    if (G.Aud.ready) G.Aud.sfx.glitch(10);
  };
  Fx.setDesat = function (v, ms) {
    if (!ms) { Fx.desatAmt = v; return; }
    var o = { a: Fx.desatAmt };
    G.Tw.to(o, ms, { a: v, onUpdate: function () { Fx.desatAmt = o.a; } });
  };
  Fx.setZoom = function (z, ms, cx, cy) {
    Fx.zoomCx = cx === undefined ? 640 : cx;
    Fx.zoomCy = cy === undefined ? 360 : cy;
    if (!ms) { Fx.zoom = z; return; }
    var o = { z: Fx.zoom };
    G.Tw.to(o, ms, { z: z, ease: 'outCubic', onUpdate: function () { Fx.zoom = o.z; } });
  };
  Fx.reset = function () {
    Fx.shakeP = 0; Fx.shakeT = Fx.shakeDur = 0;
    Fx.tintA = 0; Fx.flashA = 0; Fx.redEdge = 0;
    Fx.letterbox = 0; Fx.scanlines = 0; Fx.grain = 0;
    Fx.grainFloor = .5;      /* 常驻胶片颗粒，场景切换不清零 */
    Fx.bloom = .40;
    Fx.glitch = 0; Fx.chroma = 0; Fx.desatAmt = 0;
    Fx.vignette = .22; Fx.vignetteColor = '#000';
    Fx.zoom = 1; Fx.zoomCx = 640; Fx.zoomCy = 360;
    pool.clear();
  };

  /* ---------------- 更新 ---------------- */
  Fx.update = function (dt, real) {
    Fx._t += real;
    /* 震屏用真实时间，慢放时也在抖 */
    if (Fx.shakeT < Fx.shakeDur) {
      Fx.shakeT += real;
      var k = 1 - U.clamp01(Fx.shakeT / Fx.shakeDur);
      var p = Fx.shakeP * k * k;
      Fx.ox = (Math.random() * 2 - 1) * p;
      Fx.oy = (Math.random() * 2 - 1) * p;
      Fx.rot = (Math.random() * 2 - 1) * p * 0.0012;
    } else { Fx.ox = Fx.oy = Fx.rot = 0; Fx.shakeP = 0; }

    if (Fx.flashA > 0) {
      Fx._flashT += real;
      Fx.flashA = Fx._flashA0 * (1 - U.clamp01(Fx._flashT / Fx.flashDur));
    }

    /* 粒子 */
    for (var i = pool.active - 1; i >= 0; i--) {
      var p = pool.items[i];
      p.life -= dt;
      if (p.life <= 0) { pool.release(i); continue; }
      p.vx += p.ax * dt / 16.67;
      p.vy += p.ay * dt / 16.67;
      if (p.drag !== 1) {
        var d = Math.pow(p.drag, dt / 16.67);
        p.vx *= d; p.vy *= d;
      }
      var sw = 0;
      if (p.sway) sw = Math.sin(Fx._t * 0.0022 + p.phase) * p.sway;
      p.x += (p.vx + sw) * dt / 16.67;
      p.y += p.vy * dt / 16.67;
      p.rot += p.vr * dt / 16.67;
    }
  };

  /* ---------------- 绘制 ---------------- */
  Fx.preDraw = function (ctx) {
    ctx.save();
    if (Fx.zoom !== 1) {
      ctx.translate(Fx.zoomCx, Fx.zoomCy);
      ctx.scale(Fx.zoom, Fx.zoom);
      ctx.translate(-Fx.zoomCx, -Fx.zoomCy);
    }
    if (Fx.ox || Fx.oy || Fx.rot) {
      ctx.translate(640 + Fx.ox, 360 + Fx.oy);
      ctx.rotate(Fx.rot);
      ctx.translate(-640, -360);
    }
  };

  Fx.drawParticles = function (ctx) {
    ctx.save();
    for (var i = 0; i < pool.active; i++) {
      var p = pool.items[i];
      var t = p.life / p.max;
      var a = U.clamp01(t) * p.a;
      if (a <= 0.005) continue;

      if (p.kind === 'spark') {
        if (p.glow) {
          var g = glow(p.color), s = p.size * 7 * (0.4 + t * .6);
          ctx.globalAlpha = a * .5;
          ctx.drawImage(g, p.x - s / 2, p.y - s / 2, s, s);
        }
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        var sz = p.size * (0.35 + t * 0.65);
        ctx.fillRect(p.x - sz / 2, p.y - sz / 2, sz, sz);

      } else if (p.kind === 'mote') {
        var g2 = glow(p.color), s2 = p.size * 6;
        ctx.globalAlpha = a * .55;
        ctx.drawImage(g2, p.x - s2 / 2, p.y - s2 / 2, s2, s2);
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.4 + t * .6), 0, U.TAU); ctx.fill();

      } else if (p.kind === 'shard') {
        ctx.globalAlpha = a * .45;
        var g3 = glow(p.color), s3 = p.size * 8;
        ctx.drawImage(g3, p.x - s3 / 2, p.y - s3 / 2, s3, s3);
        ctx.globalAlpha = a;
        ctx.save();
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, -p.size); ctx.lineTo(p.size * .6, 0);
        ctx.lineTo(0, p.size * .8); ctx.lineTo(-p.size * .6, 0);
        ctx.closePath(); ctx.fill();
        ctx.restore();

      } else if (p.kind === 'smoke') {
        var r = U.lerp(p.size, p.size2, 1 - t);
        ctx.globalAlpha = a * .45 * t;
        var gr = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        gr.addColorStop(0, U.rgba(p.color, .8));
        gr.addColorStop(1, U.rgba(p.color, 0));
        ctx.fillStyle = gr;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, U.TAU); ctx.fill();

      } else if (p.kind === 'ring') {
        var rr = U.lerp(p.size, p.size2, U.smoothstep(1 - t));
        ctx.globalAlpha = a * t;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.w * t;
        ctx.beginPath(); ctx.arc(p.x, p.y, rr, 0, U.TAU); ctx.stroke();

      } else if (p.kind === 'feather') {
        ctx.globalAlpha = a;
        ctx.save();
        ctx.translate(p.x, p.y); ctx.rotate(p.rot + Math.sin(Fx._t * .001 + p.phase) * .3);
        if (p.glow) {
          var g4 = glow(p.color), s4 = p.size * 4;
          ctx.globalAlpha = a * .4;
          ctx.drawImage(g4, -s4 / 2, -s4 / 2, s4, s4);
          ctx.globalAlpha = a;
        }
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.quadraticCurveTo(p.size * .55, 0, 0, p.size);
        ctx.quadraticCurveTo(-p.size * .55, 0, 0, -p.size);
        ctx.fill();
        ctx.strokeStyle = U.rgba('#ffffff', .5); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, -p.size); ctx.lineTo(0, p.size); ctx.stroke();
        ctx.restore();

      } else if (p.kind === 'text') {
        ctx.globalAlpha = a;
        ctx.font = '700 ' + p.size + 'px ' + G.FONT;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(0,0,0,.6)';
        ctx.fillText(p.text, p.x + 1, p.y + 2);
        ctx.fillStyle = p.color;
        ctx.fillText(p.text, p.x, p.y);
      }
    }
    ctx.restore();
  };

  var grainTiles = null, grainI = 0;
  function getGrain() {
    if (!grainTiles) {
      grainTiles = [];
      for (var k = 0; k < 3; k++) {
        var c = U.canvas(128, 128), x = c.getContext('2d');
        var img = x.createImageData(128, 128);
        for (var i = 0; i < img.data.length; i += 4) {
          var v = 128 + (Math.random() * 2 - 1) * 60;
          img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
          img.data[i + 3] = 255;
        }
        x.putImageData(img, 0, 0);
        grainTiles.push(c);
      }
    }
    return grainTiles[(grainI++) % 3];
  }

  /* ============================================================
     成片级后处理：泛光 + 分离色调 + 对比塑形
     这一层是让程序化矢量画面「看起来像成品」的关键——矢量填色本身是平的，
     真正制造质感的是光的溢出和统一的调色，而不是往物体上加细节。
     ============================================================ */
  var bloomA = null, bloomB = null, bloomAC = null, bloomBC = null;
  var BW = 320, BH = 180, BW2 = 160, BH2 = 90;
  Fx.bloom = .40;          // 泛光强度（0 关闭）
  Fx.grade = {
    hi: '#ffd2a0',         // 高光偏暖
    lo: '#0d1d3a',         // 暗部偏冷
    amt: .34,              // 分离色调强度
    contrast: .16          // 中心提亮 / 边缘压暗
  };
  Fx.setGrade = function (o, ms) {
    if (!o) return;
    if (!ms) { U.merge(Fx.grade, o); return; }
    var from = { hi: Fx.grade.hi, lo: Fx.grade.lo, amt: Fx.grade.amt, contrast: Fx.grade.contrast };
    var t = { k: 0 };
    G.Tw.to(t, ms, { k: 1, ease: 'outQuad', onUpdate: function () {
      if (o.hi) Fx.grade.hi = U.mix(from.hi, o.hi, t.k);
      if (o.lo) Fx.grade.lo = U.mix(from.lo, o.lo, t.k);
      if (o.amt !== undefined) Fx.grade.amt = U.lerp(from.amt, o.amt, t.k);
      if (o.contrast !== undefined) Fx.grade.contrast = U.lerp(from.contrast, o.contrast, t.k);
    } });
  };

  function ensureBloom() {
    if (bloomA) return;
    bloomA = U.canvas(BW, BH); bloomAC = bloomA.getContext('2d');
    bloomB = U.canvas(BW2, BH2); bloomBC = bloomB.getContext('2d');
  }

  function drawBloom(ctx) {
    if (!(Fx.bloom > .01) || !G.Game.blurSupported) return;
    ensureBloom();
    var src = ctx.canvas, sw = src.width, sh = src.height;
    var a = bloomAC, b = bloomBC;
    a.setTransform(1, 0, 0, 1, 0, 0);
    a.globalCompositeOperation = 'source-over';
    a.globalAlpha = 1; a.filter = 'none';
    a.clearRect(0, 0, BW, BH);
    try { a.drawImage(src, 0, 0, sw, sh, 0, 0, BW, BH); } catch (e) { return; }
    /* 高光提取：color-burn 叠 50% 灰，数学上等于 max(0, 2·L − 1)，
       就是一条阈值 0.5、增益 2 的硬阈值曲线。
       比"自乘几次"准确得多——自乘是逐通道的，饱和的纯红照样能穿过去，
       结果整片中间调都在发光，画面糊成一团。 */
    a.globalCompositeOperation = 'color-burn';
    a.fillStyle = '#808080';
    a.fillRect(0, 0, BW, BH);
    /* 再自乘一次做柔和的膝点，让刚过阈值的部分不要突然亮起来 */
    a.globalCompositeOperation = 'multiply';
    a.drawImage(bloomA, 0, 0);
    a.globalCompositeOperation = 'source-over';

    b.setTransform(1, 0, 0, 1, 0, 0);
    b.globalCompositeOperation = 'source-over';
    b.globalAlpha = 1;
    b.clearRect(0, 0, BW2, BH2);
    b.filter = 'blur(3px)';
    b.drawImage(bloomA, 0, 0, BW, BH, 0, 0, BW2, BH2);
    b.filter = 'none';

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    /* 近距紧致的一层 + 远距扩散的一层，合起来才有真实镜头的光晕形状 */
    ctx.globalAlpha = Fx.bloom;
    ctx.drawImage(bloomB, 0, 0, BW2, BH2, 0, 0, W, H);
    ctx.globalAlpha = Fx.bloom * .45;
    ctx.drawImage(bloomB, 0, 0, BW2, BH2, -W * .035, -H * .035, W * 1.07, H * 1.07);
    ctx.restore();
  }

  function drawGrade(ctx) {
    var gd = Fx.grade;
    if (gd.amt > .005) {
      /* 上暖下冷的分离色调：模拟天光 + 地面反弹光，是电影调色最基础的一层 */
      var g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, U.rgba(gd.hi, gd.amt));
      g.addColorStop(.5, U.rgba(U.mix(gd.hi, gd.lo, .5), gd.amt * .5));
      g.addColorStop(1, U.rgba(gd.lo, gd.amt));
      ctx.save();
      ctx.globalCompositeOperation = 'soft-light';
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
    if (gd.contrast > .005) {
      /* 中心提亮、边缘压暗：给平涂的矢量画面一条 S 型明度曲线 */
      var r = ctx.createRadialGradient(W / 2, H * .46, 0, W / 2, H * .46, W * .72);
      r.addColorStop(0, 'rgba(255,255,255,' + (gd.contrast * .55) + ')');
      r.addColorStop(.55, 'rgba(128,128,128,0)');
      r.addColorStop(1, 'rgba(0,0,0,' + (gd.contrast * .85) + ')');
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = r;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  }

  Fx.postDraw = function (ctx) {
    /* 粒子在震屏坐标系内 */
    Fx.drawParticles(ctx);
    ctx.restore();   // 结束 preDraw 的 save（震屏/缩放）

    /* 泛光要在去色/色调之前——它属于「镜头」，不属于「调色」 */
    drawBloom(ctx);

    ctx.save();
    /* 去色 */
    if (Fx.desatAmt > 0.01) {
      ctx.globalAlpha = Fx.desatAmt * .85;
      ctx.globalCompositeOperation = 'saturation';
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }
    /* 色调 */
    if (Fx.tintA > 0.005) {
      ctx.globalAlpha = Fx.tintA;
      ctx.fillStyle = Fx.tintColor;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
    /* 故障撕裂 */
    if (Fx.glitch > 0.01) {
      var gl = Fx.glitch;
      var n = Math.floor(4 + gl * 16);
      for (var i = 0; i < n; i++) {
        var sy = Math.random() * H;
        var sh = 3 + Math.random() * 42 * gl;
        var off = (Math.random() - .5) * 90 * gl;
        try {
          ctx.drawImage(ctx.canvas, 0, sy * (ctx.canvas.height / H), ctx.canvas.width, sh * (ctx.canvas.height / H),
                        off, sy, W, sh);
        } catch (e) {}
      }
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = .1 * gl;
      ctx.fillStyle = '#ff2b5e'; ctx.fillRect(-6 * gl, 0, W, H);
      ctx.fillStyle = '#2bffe0'; ctx.fillRect(6 * gl, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      for (var q = 0; q < 40 * gl; q++) {
        ctx.fillStyle = 'rgba(255,255,255,' + (Math.random() * .22) + ')';
        ctx.fillRect(Math.random() * W, Math.random() * H, 3 + Math.random() * 30, 1 + Math.random() * 2);
      }
    }
    /* 统一调色：放在剧情用的 tint/desat 之后，全屏闪光之前 */
    drawGrade(ctx);
    /* 暗角：椭圆而非正圆，配合 16:9 才不会在左右两侧过早压黑 */
    if (Fx.vignette > 0.005) {
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.scale(1, H / W);
      var g = ctx.createRadialGradient(0, 0, W * .32, 0, 0, W * .78);
      g.addColorStop(0, U.rgba(Fx.vignetteColor, 0));
      g.addColorStop(.68, U.rgba(Fx.vignetteColor, Fx.vignette * .34));
      g.addColorStop(1, U.rgba(Fx.vignetteColor, Fx.vignette));
      ctx.fillStyle = g;
      ctx.fillRect(-W, -W, W * 2, W * 2);
      ctx.restore();
    }
    /* 屏幕边缘泛红（崩溃/濒死） */
    if (Fx.redEdge > 0.005) {
      var g2 = ctx.createRadialGradient(W / 2, H / 2, H * .2, W / 2, H / 2, H * .78);
      g2.addColorStop(0, 'rgba(255,20,50,0)');
      g2.addColorStop(.72, 'rgba(255,20,50,' + (Fx.redEdge * .18) + ')');
      g2.addColorStop(1, 'rgba(255,20,50,' + (Fx.redEdge * .62) + ')');
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, W, H);
    }
    /* 扫描线（监控录像风格） */
    if (Fx.scanlines > 0.005) {
      ctx.globalAlpha = Fx.scanlines * .5;
      ctx.fillStyle = '#000';
      for (var y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
      ctx.globalAlpha = Fx.scanlines * .12;
      ctx.fillStyle = '#9fe';
      ctx.fillRect(0, (Fx._t * 0.14) % H, W, 40);
      ctx.globalAlpha = 1;
    }
    /* 噪点：始终留一层很淡的底噪。纯净的矢量色块会显得"廉价"，
       一层胶片颗粒能把平涂的渐变连起来，同时掩盖 8bit 色带。 */
    var gn = Math.max(Fx.grain, Fx.grainFloor);
    if (gn > 0.005) {
      ctx.globalAlpha = gn * .09;
      ctx.globalCompositeOperation = 'overlay';
      var t = getGrain();
      for (var gx = 0; gx < W; gx += 128) for (var gy = 0; gy < H; gy += 128) ctx.drawImage(t, gx, gy);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }
    /* 闪光 */
    if (Fx.flashA > 0.005) {
      ctx.globalAlpha = U.clamp01(Fx.flashA);
      ctx.fillStyle = Fx.flashColor;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
    /* 电影黑边 */
    if (Fx.letterbox > 0.005) {
      var bh = H * .13 * Fx.letterbox;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, bh);
      ctx.fillRect(0, H - bh, W, bh);
    }
    ctx.restore();
  };

})(window);
