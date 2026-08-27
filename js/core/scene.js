/* ===========================================================
   scene.js — 场景栈 + 转场（淡入/光圈/跃迁/故障/黑边）
   场景接口：{ enter(p), exit(), update(dt), draw(ctx), onKey?() }
   =========================================================== */
(function (root) {
  'use strict';
  var G = root.G, U = G.U;

  var Sc = G.Sc = {
    cur: null,
    stack: [],
    name: '',
    trans: null,
    W: 1280, H: 720,
    pendingParams: null
  };

  var registry = {};
  Sc.register = function (name, sceneObj) { registry[name] = sceneObj; sceneObj._name = name; };
  Sc.get = function (name) { return registry[name]; };

  function enterScene(sc, params) {
    Sc.cur = sc;
    Sc.name = sc._name || '?';
    if (sc.enter) sc.enter(params || {});
  }

  /* 立即切换（无转场） */
  Sc.set = function (name, params) {
    var sc = typeof name === 'string' ? registry[name] : name;
    if (!sc) { console.warn('[scene] 未注册: ' + name); return; }
    if (Sc.cur && Sc.cur.exit) Sc.cur.exit();
    G.Tw.killCoros(Sc.cur);
    enterScene(sc, params);
  };

  /* 带转场切换 */
  Sc.go = function (name, params, opt) {
    opt = opt || {};
    var kind = opt.trans || 'fade';
    var ms = opt.ms || (kind === 'warp' ? 1100 : kind === 'glitch' ? 1400 : 620);
    if (kind === 'none') { Sc.set(name, params); return; }
    /* 已有转场尚未换场：只改目标，不重置计时 —— 否则连续调用会让换场永远不发生 */
    if (Sc.trans && !Sc.trans.swapped) {
      Sc.trans.target = name;
      Sc.trans.params = params;
      return;
    }
    Sc.trans = {
      kind: kind, t: 0, dur: ms, half: ms * (opt.split === undefined ? .5 : opt.split),
      swapped: false, color: opt.color || '#04060d',
      target: name, params: params, snap: null, opt: opt
    };
  };

  Sc.push = function (name, params, opt) {
    if (Sc.cur) Sc.stack.push({ sc: Sc.cur, name: Sc.name });
    var sc = typeof name === 'string' ? registry[name] : name;
    if (!sc) return;
    if (Sc.cur && Sc.cur.suspend) Sc.cur.suspend();
    enterScene(sc, params);
  };
  Sc.pop = function (params) {
    if (!Sc.stack.length) return;
    if (Sc.cur && Sc.cur.exit) Sc.cur.exit();
    var e = Sc.stack.pop();
    Sc.cur = e.sc; Sc.name = e.name;
    if (Sc.cur.resume) Sc.cur.resume(params || {});
  };

  Sc.update = function (dt) {
    var tr = Sc.trans;
    if (tr) {
      tr.t += dt;
      if (!tr.swapped && tr.t >= tr.half) {
        tr.swapped = true;
        if (Sc.cur && Sc.cur.exit) Sc.cur.exit();
        G.Tw.killCoros(Sc.cur);
        var sc = typeof tr.target === 'string' ? registry[tr.target] : tr.target;
        if (sc) enterScene(sc, tr.params);
      }
      if (tr.t >= tr.dur) Sc.trans = null;
    }
    if (Sc.cur && Sc.cur.update) Sc.cur.update(dt);
  };

  Sc.draw = function (ctx) {
    if (Sc.cur && Sc.cur.draw) Sc.cur.draw(ctx);
    if (Sc.trans) drawTrans(ctx, Sc.trans);
  };

  function drawTrans(ctx, tr) {
    var W = Sc.W, H = Sc.H;
    /* p: 0→1 覆盖, 1→0 揭开 */
    var p;
    if (tr.t < tr.half) p = U.clamp01(tr.t / tr.half);
    else p = 1 - U.clamp01((tr.t - tr.half) / Math.max(1, tr.dur - tr.half));

    ctx.save();
    if (tr.kind === 'fade') {
      ctx.globalAlpha = U.smoothstep(p);
      ctx.fillStyle = tr.color;
      ctx.fillRect(0, 0, W, H);

    } else if (tr.kind === 'iris') {
      var maxR = Math.sqrt(W * W + H * H) / 2;
      var r = maxR * (1 - U.smoothstep(p));
      ctx.fillStyle = tr.color;
      ctx.beginPath();
      ctx.rect(0, 0, W, H);
      ctx.arc(W / 2, H / 2, Math.max(0, r), 0, U.TAU, true);
      ctx.fill();
      /* 光圈边缘 */
      if (r > 1) {
        ctx.strokeStyle = 'rgba(120,220,255,' + (0.5 * p) + ')';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(W / 2, H / 2, r, 0, U.TAU); ctx.stroke();
      }

    } else if (tr.kind === 'warp') {
      /* 战机跃迁：速度线 + 白闪 */
      var e = U.smoothstep(p);
      ctx.fillStyle = 'rgba(6,10,22,' + (e * .92) + ')';
      ctx.fillRect(0, 0, W, H);
      var n = 70;
      ctx.lineCap = 'round';
      for (var i = 0; i < n; i++) {
        var seed = i * 12.9898;
        var yy = (Math.abs(Math.sin(seed) * 43758.5453) % 1) * H;
        var len = 60 + (Math.abs(Math.sin(seed * 1.7) * 1234.5) % 1) * 420 * e;
        var xx = ((Math.abs(Math.sin(seed * 2.3) * 9876.5) % 1) * W + tr.t * 2.2) % (W + 400) - 200;
        ctx.strokeStyle = 'rgba(150,235,255,' + (0.1 + 0.5 * e) + ')';
        ctx.lineWidth = 1 + (i % 3);
        ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx + len, yy); ctx.stroke();
      }
      if (p > .82) {
        ctx.globalAlpha = (p - .82) / .18;
        ctx.fillStyle = '#eaf6ff'; ctx.fillRect(0, 0, W, H);
      }

    } else if (tr.kind === 'glitch') {
      /* 死亡回归：RGB 撕裂 + 噪点 + 时间倒流环 */
      var e2 = U.smoothstep(p);
      ctx.fillStyle = 'rgba(2,4,10,' + (e2 * .96) + ')';
      ctx.fillRect(0, 0, W, H);
      var slices = 26;
      for (var s = 0; s < slices; s++) {
        var sy = s / slices * H;
        var sh = H / slices + 1;
        var off = (Math.random() - .5) * 140 * e2;
        var col = s % 3 === 0 ? 'rgba(255,60,90,' : (s % 3 === 1 ? 'rgba(60,255,220,' : 'rgba(150,120,255,');
        ctx.fillStyle = col + (0.06 + 0.14 * e2) + ')';
        ctx.fillRect(off, sy, W, sh);
      }
      var rings = 4;
      for (var k = 0; k < rings; k++) {
        var rr = ((tr.t * 0.5 + k * 120) % 620) * (0.6 + e2);
        ctx.strokeStyle = 'rgba(160,220,255,' + (0.34 * e2 * (1 - rr / 700)) + ')';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(W / 2, H / 2, rr, 0, U.TAU); ctx.stroke();
      }
      for (var q = 0; q < 90 * e2; q++) {
        ctx.fillStyle = 'rgba(255,255,255,' + (Math.random() * .18) + ')';
        ctx.fillRect(Math.random() * W, Math.random() * H, 2 + Math.random() * 5, 1 + Math.random() * 2);
      }

    } else if (tr.kind === 'bars') {
      var bh = H / 2 * U.smoothstep(p);
      ctx.fillStyle = tr.color;
      ctx.fillRect(0, 0, W, bh);
      ctx.fillRect(0, H - bh, W, bh);
      ctx.strokeStyle = 'rgba(110,200,255,' + (.5 * p) + ')';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, bh); ctx.lineTo(W, bh);
      ctx.moveTo(0, H - bh); ctx.lineTo(W, H - bh); ctx.stroke();

    } else if (tr.kind === 'wipe') {
      var wx = W * U.smoothstep(p);
      ctx.fillStyle = tr.color;
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(wx, 0); ctx.lineTo(wx - 90, H); ctx.lineTo(0, H);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(120,220,255,' + (.7 * p) + ')';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(wx, 0); ctx.lineTo(wx - 90, H); ctx.stroke();
    }
    ctx.restore();
  }

  Sc.busy = function () { return !!Sc.trans; };

})(window);
