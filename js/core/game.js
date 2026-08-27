/* ===========================================================
   game.js — 主循环、逻辑分辨率缩放、慢放、暂停、debug
   =========================================================== */
(function (root) {
  'use strict';
  var G = root.G, U = G.U;

  var Game = G.Game = {
    W: 1280, H: 720,
    canvas: null, ctx: null,
    view: { scale: 1, ox: 0, oy: 0, cw: 1280, ch: 720 },
    timeScale: 1,          // 慢放（演出用）
    _tsTarget: 1,
    paused: false,
    running: false,
    frame: 0,
    time: 0,               // 逻辑毫秒（受 timeScale 影响）
    real: 0,               // 真实毫秒
    fps: 60, _fpsAcc: 0, _fpsN: 0,
    debug: false,
    query: {},
    blurBuf: null,         // 毛玻璃用的模糊缓冲
    blurCtx: null,
    _lastTs: 0
  };

  /* ---------- 查询参数 ---------- */
  function parseQuery() {
    var q = {};
    var s = root.location.search.replace(/^\?/, '');
    if (!s) return q;
    s.split('&').forEach(function (kv) {
      var a = kv.split('=');
      q[decodeURIComponent(a[0])] = a.length > 1 ? decodeURIComponent(a[1]) : '1';
    });
    return q;
  }

  /* ---------- 缩放 / letterbox ---------- */
  function resize() {
    var cw = root.innerWidth, ch = root.innerHeight;
    var s = Math.min(cw / Game.W, ch / Game.H);
    var bw = Math.round(Game.W * s), bh = Math.round(Game.H * s);
    /* 按「实际占用的设备像素」决定后备缓冲，而不是只看 devicePixelRatio。
       以前这里漏乘了 s，1080p 上等于渲染 720p 再放大 1.5 倍，矢量美术和文字全是软的。
       用总像素数封顶来控制弹幕场景的开销，而不是牺牲清晰度。 */
    var want = s * (root.devicePixelRatio || 1);
    var MAXPX = 2560 * 1440;
    var cap = Math.sqrt(MAXPX / (Game.W * Game.H));
    var dpr = Math.max(1, Math.min(want, cap));
    Game.canvas.style.width = bw + 'px';
    Game.canvas.style.height = bh + 'px';
    Game.canvas.width = Math.round(Game.W * dpr);
    Game.canvas.height = Math.round(Game.H * dpr);
    Game.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    Game.ctx.imageSmoothingEnabled = true;
    Game.ctx.imageSmoothingQuality = 'high';
    Game.view.scale = s;
    Game.view.cw = bw; Game.view.ch = bh;
    Game.view.dpr = dpr;
    Game.view.ox = Math.round((cw - bw) / 2);
    Game.view.oy = Math.round((ch - bh) / 2);
    var st = document.getElementById('stage');
    if (st) { st.style.width = bw + 'px'; st.style.height = bh + 'px'; }
    if (G.Sc && G.Sc.cur && G.Sc.cur.onResize) G.Sc.cur.onResize();
  }
  Game.resize = resize;

  /* 屏幕坐标（相对 canvas 元素）→ 逻辑坐标 */
  Game.toLogical = function (cx, cy) {
    var s = Game.view.scale || 1;
    return { x: cx / s, y: cy / s };
  };

  /* ---------- 慢放 ---------- */
  Game.slowmo = function (scale, ms, ease) {
    Game.timeScale = scale;
    G.Tw.killTag('slowmo');
    var o = { v: scale };
    G.Tw.to(o, ms || 900, {
      v: 1, ease: ease || 'inQuad', tag: 'slowmo',
      onUpdate: function () { Game.timeScale = o.v; },
      onComplete: function () { Game.timeScale = 1; }
    });
  };
  Game.setTimeScale = function (v) { Game.timeScale = v; };

  /* ---------- 顿帧 ----------
     命中的瞬间把逻辑冻住几十毫秒，是弹幕/动作游戏打击感最便宜的一笔投资。
     渲染继续（所以画面不会看起来卡死），只有逻辑时间停。 */
  Game.hitstopT = 0;
  Game.hitstop = function (ms) {
    Game.hitstopT = Math.max(Game.hitstopT, ms || 40);
  };

  /* ---------- 震屏代理 ---------- */
  Game.shake = function (power, ms) {
    if (G.Save && G.Save.data && !G.Save.data.settings.shake) return;
    if (G.Fx) G.Fx.shake(power, ms);
  };
  Game.flash = function (color, ms, alpha) { if (G.Fx) G.Fx.flash(color, ms, alpha); };
  Game.tint = function (color, alpha, ms) { if (G.Fx) G.Fx.tint(color, alpha, ms); };

  /* ---------- 毛玻璃模糊缓冲 ----------
     每帧把已绘制内容降采样+模糊，供 ui.glass() 取样，实现真实磨砂效果 */
  Game.updateBlurBuf = function () {
    if (!Game.blurBuf) return;
    var bw = Game.blurBuf.width, bh = Game.blurBuf.height;
    var x = Game.blurCtx;
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.globalAlpha = 1;
    x.filter = 'none';
    x.clearRect(0, 0, bw, bh);
    /* 从主画布采样（注意主画布带 dpr 变换，用像素尺寸） */
    try {
      x.filter = Game.blurSupported ? 'blur(6px)' : 'none';
      x.drawImage(Game.canvas, 0, 0, Game.canvas.width, Game.canvas.height, 0, 0, bw, bh);
      x.filter = 'none';
    } catch (e) { /* 忽略 */ }
  };

  /* ---------- 主循环 ---------- */
  function frame(ts) {
    if (!Game.running) return;
    root.requestAnimationFrame(frame);
    if (!Game._lastTs) Game._lastTs = ts;
    var real = ts - Game._lastTs;
    Game._lastTs = ts;
    if (real > 120) real = 120;      // 切标签页回来时不要跳帧
    if (real < 0) real = 0;
    Game.real += real;

    /* fps */
    Game._fpsAcc += real; Game._fpsN++;
    if (Game._fpsAcc >= 500) {
      Game.fps = Math.round(1000 / (Game._fpsAcc / Game._fpsN));
      Game._fpsAcc = 0; Game._fpsN = 0;
    }

    var dt = Game.paused ? 0 : real * Game.timeScale;
    /* 顿帧：逻辑时间停住，渲染照常 */
    if (Game.hitstopT > 0) {
      Game.hitstopT -= real;
      dt = 0;
    }
    /* 过场快进：按住 Ctrl 时整段演出（等待/补间/painter/对话）一起加速。
       只在标记为可跳过的过场里生效，战斗与结算不受影响。 */
    Game.ffwd = 1;
    if (!Game.paused && G.Cut && G.Cut.playing && G.Cut.skippable && !G.Cut.noFF &&
        G.In && G.In.down('skip') &&
        !(G.Dlg && G.Dlg.line && G.Dlg.line.noSkip) &&
        G.Sc && (G.Sc.name === 'cutscene' || G.Sc.name === 'ending')) {
      Game.ffwd = 5;
      dt *= Game.ffwd;
    }
    Game.time += dt;
    Game.frame++;

    /* --- 更新 --- */
    if (!Game.paused) {
      G.Tw.tick(dt, dt / (1000 / 60));
      if (G.Sc) G.Sc.update(dt);
      if (G.Fx) G.Fx.update(dt, real);
    } else {
      /* 暂停时仍更新 UI 动画（用真实时间） */
      G.Tw.tick(0, 0);
      if (G.Fx) G.Fx.update(0, real);
    }

    /* --- 绘制 --- */
    var ctx = Game.ctx;
    ctx.save();
    ctx.clearRect(0, 0, Game.W, Game.H);
    if (G.Fx) G.Fx.preDraw(ctx);
    if (G.Sc) G.Sc.draw(ctx);
    if (G.Fx) G.Fx.postDraw(ctx);
    ctx.restore();

    if (Game.pauseOverlay && Game.paused) Game.pauseOverlay(ctx);
    if (Game.debug) drawDebug(ctx);

    G.In.endFrame();
  }
  function drawDebug(ctx) {
    ctx.save();
    ctx.font = '12px monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    var lines = [
      'FPS ' + Game.fps + '  ts ' + Game.timeScale.toFixed(2),
      'scene ' + (G.Sc ? G.Sc.name : '-') + (G.Sc && G.Sc.busy() ? ' [trans]' : ''),
      'tw ' + G.Tw.count(),
      'beat ' + (G.Story && G.Story.curBeatId ? G.Story.curBeatId() : '-'),
      'loop ' + (G.St ? G.St.s.loopCount : '-') + '  san ' + (G.St ? Math.round(G.St.s.sanity) : '-') + '  tyDecay ' + (G.St ? G.St.s.tyDecay : '-')
    ];
    if (G.Sc && G.Sc.cur && G.Sc.cur.debugInfo) lines = lines.concat(G.Sc.cur.debugInfo());
    var w = 0;
    for (var i = 0; i < lines.length; i++) w = Math.max(w, ctx.measureText(lines[i]).width);
    ctx.fillStyle = 'rgba(0,0,0,.55)';
    ctx.fillRect(6, 6, w + 12, lines.length * 15 + 8);
    ctx.fillStyle = '#8ef';
    for (var j = 0; j < lines.length; j++) ctx.fillText(lines[j], 12, 11 + j * 15);
    ctx.restore();
  }

  /* ---------- 暂停 ---------- */
  Game.togglePause = function () {
    if (G.Sc && G.Sc.name === 'title') return;
    Game.paused = !Game.paused;
    if (Game.paused) {
      G.Aud.duck(999999, .25);
      G.Aud.sfx.uiBack();
      if (G.Pause) G.Pause.open();
    } else { G.Aud.duck(300, 1); G.Aud.sfx.uiOk(); }
  };

  /* ---------- 启动 ---------- */
  Game.boot = function () {
    Game.query = parseQuery();
    Game.debug = Game.query.debug === '1';

    Game.canvas = document.getElementById('game');
    Game.ctx = Game.canvas.getContext('2d', { alpha: false });
    Game.ctx.imageSmoothingEnabled = true;

    /* ctx.filter 支持检测（Chromium/Firefox 有，Safari 较新版本才有） */
    Game.blurSupported = (function () {
      var c = U.canvas(4, 4), x = c.getContext('2d');
      try { x.filter = 'blur(2px)'; return x.filter === 'blur(2px)'; } catch (e) { return false; }
    })();
    Game.blurBuf = U.canvas(Game.W / 4, Game.H / 4);
    Game.blurCtx = Game.blurBuf.getContext('2d');

    G.Save.load();
    var st = G.Save.settings();
    G.Aud.vol.master = st.volMaster; G.Aud.vol.bgm = st.volBgm;
    G.Aud.vol.sfx = st.volSfx; G.Aud.vol.voice = st.volVoice;

    G.In.install(Game.canvas);
    root.addEventListener('resize', resize);
    resize();

    /* 全局快捷键 */
    root.addEventListener('keydown', function (e) {
      if (e.code === 'Backquote' && (Game.query.debug === '1' || e.shiftKey)) {
        Game.debug = !Game.debug;
      }
      if (e.code === 'KeyM' && e.altKey) G.Aud.setMuted(!G.Aud.muted);
      if (e.code === 'KeyF' && e.altKey) toggleFullscreen();
    });

    Game.running = true;
    root.requestAnimationFrame(frame);
  };

  function toggleFullscreen() {
    var el = document.documentElement;
    if (!document.fullscreenElement) { if (el.requestFullscreen) el.requestFullscreen(); }
    else if (document.exitFullscreen) document.exitFullscreen();
  }
  Game.toggleFullscreen = toggleFullscreen;

  /* 首次手势后：初始化音频并进入标题（或 debug 跳转） */
  Game.start = function () {
    G.Aud.init();
    G.Aud.resume();
    var q = Game.query;
    if (q.diff && ['easy', 'normal', 'hard'].indexOf(q.diff) >= 0) {
      G.Save.settings().difficulty = q.diff; G.Save.save();
    }
    if (q.jump && G.Debug) { G.Debug.jump(q.jump); return; }
    if (q.scene) { G.Sc.set(q.scene, {}); return; }
    G.Sc.set('title', { fromBoot: true });
  };

})(window);
