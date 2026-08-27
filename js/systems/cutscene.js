/* ===========================================================
   cutscene.js — 声明式过场 DSL 解释器
     步骤数组 → generator 协程执行，支持并行/条件/自定义绘制
   步骤类型：
     bg field  enter exit actor emo move clear
     say lines choice  wait hold input
     shake flash tint desat vignette redEdge letterbox scanlines grain glitch zoom slowmo
     shatter motes feather burst ring
     paint unpaint sub card
     sfx bgm stopBgm layers scream wind duck
     flag learn kill call par seq if
   =========================================================== */
(function (root) {
  'use strict';
  var G = root.G, U = G.U, Ui = G.Ui;

  var Cut = G.Cut = {
    playing: false,
    bg: null, bgId: null,
    bgPrev: null, bgFade: 1,
    field: null,
    painters: [],
    sub: null,
    card: null,
    onDone: null,
    coro: null,
    camX: 0, camY: 0,
    skippable: true,
    _waitInput: false,
    blackout: 0
  };

  /* 自定义绘制函数注册表（cutscenes.js / endings.js 里填充） */
  var Paint = G.Paint = {};

  /* ---------------- 生命周期 ---------------- */
  Cut.start = function (steps, onDone, opt) {
    opt = opt || {};
    Cut.playing = true;
    Cut.noFF = false;
    Cut.onDone = onDone || null;
    Cut.painters.length = 0;
    Cut.sub = null; Cut.card = null;
    Cut.camX = Cut.camY = 0;
    Cut.blackout = 0;
    Cut.skippable = opt.skippable !== false;
    if (opt.bg) Cut.setBg(opt.bg, 0);
    Cut.coro = G.Tw.coro(run(steps), Cut);
  };
  Cut.stop = function () {
    if (Cut.coro) Cut.coro.kill();
    Cut.coro = null;
    Cut.playing = false;
    Cut.noFF = false;
    G.Dlg.keepBox = false;
    G.Dlg.stop();
  };
  function finish() {
    Cut.playing = false;
    G.Dlg.keepBox = false;
    var cb = Cut.onDone;
    Cut.onDone = null;
    if (cb) cb();
  }

  Cut.setBg = function (id, ms) {
    if (!G.Art.hasScene(id)) { console.warn('[cut] 未知背景 ' + id); return; }
    if (Cut.bgId === id) return;
    Cut.bgPrev = Cut.bg;
    Cut.bg = G.Art.scene(id);
    Cut.bgId = id;
    if (ms) {
      Cut.bgFade = 0;
      G.Tw.to(Cut, ms, { bgFade: 1, ease: 'inOutQuad' });
    } else Cut.bgFade = 1;
  };

  /* ---------------- 步骤执行 ---------------- */
  function* run(steps) {
    for (var i = 0; i < steps.length; i++) {
      if (!Cut.playing) return;
      yield* step(steps[i]);
    }
    finish();
  }
  Cut.runSteps = function (steps, onDone) {
    Cut.playing = true;
    Cut.onDone = onDone || null;
    Cut.coro = G.Tw.coro(run(steps), Cut);
  };

  function* step(s) {
    if (!s) return;
    var Dlg = G.Dlg, Fx = G.Fx;

    switch (s.t) {

      /* ---- 背景 ---- */
      case 'bg':
        Cut.setBg(s.id, s.fade === undefined ? 600 : s.fade);
        if (s.fade) yield { ms: s.fade };
        break;
      case 'field':
        Cut.field = s.id ? G.Art.field(s.id) : null;
        break;
      case 'cam':
        G.Tw.to(Cut, s.ms || 800, { camX: s.x || 0, camY: s.y || 0, ease: s.ease || 'inOutQuad' });
        if (s.wait !== false) yield { ms: s.ms || 800 };
        break;

      /* ---- 立绘 ---- */
      case 'enter':
        Dlg.enter(s.who, s);
        if (s.wait !== false) yield { ms: s.ms || 520 };
        break;
      case 'exit':
        Dlg.exit(s.who, s);
        if (s.wait !== false) yield { ms: s.ms || 420 };
        break;
      case 'actor': {
        var a = Dlg.actor(s.who) || Dlg.addActor(s.who, s);
        var tw = {};
        ['x', 'y', 'scale', 'alpha', 'alt', 'decay', 'dim', 'emblemGlow', 'crack',
         'distort', 'auraPower', 'mechHalf', 'tintAmt', 'rot', 'sit'].forEach(function (k) {
          if (s[k] !== undefined) tw[k] = s[k];
        });
        if (s.emo) a.emo = s.emo;
        if (s.flip !== undefined) a.flip = s.flip;
        if (s.auraColor !== undefined) a.auraColor = s.auraColor;
        if (s.tintColor !== undefined) a.tintColor = s.tintColor;
        if (s.hairCol !== undefined) a.hairCol = s.hairCol;
        if (s.luckOff !== undefined) a.luckOff = s.luckOff;
        if (s.z !== undefined) { a.z = s.z; Dlg.actors.sort(function (p, q) { return p.z - q.z; }); }
        if (Object.keys(tw).length) {
          tw.ease = s.ease || 'outCubic';
          G.Tw.to(a, s.ms || 400, tw);
          if (s.wait) yield { ms: s.ms || 400 };
        }
        break;
      }
      case 'emo': {
        var ae = Dlg.actor(s.who);
        if (ae) ae.emo = s.emo;
        break;
      }
      case 'clear':
        Dlg.clearStage();
        break;

      /* ---- 对话 ---- */
      case 'say': {
        var doneFlag = { v: false };
        Dlg.keepBox = true;
        Dlg.play([s], function () { doneFlag.v = true; });
        yield { until: function () { return doneFlag.v; } };
        break;
      }
      case 'lines': {
        var df2 = { v: false };
        Dlg.keepBox = true;
        Dlg.play(s.list, function () { df2.v = true; });
        yield { until: function () { return df2.v; } };
        break;
      }
      case 'closebox':
        Dlg.keepBox = false;
        Dlg.stop();
        G.Tw.to(Dlg, 240, { boxA: 0 });
        yield { ms: 240 };
        break;
      case 'choice': {
        var picked = { id: null, done: false };
        Dlg.keepBox = true;
        Dlg.onChoice = function (id) { picked.id = id; };
        Dlg.play([{ who: s.who, text: s.text, emo: s.emo, choices: s.choices }],
                 function () { picked.done = true; });
        yield { until: function () { return picked.done; } };
        Dlg.onChoice = null;
        if (s.branches && picked.id && s.branches[picked.id]) yield* run2(s.branches[picked.id]);
        break;
      }

      /* ---- 时间 ---- */
      case 'wait':
        yield { ms: s.ms || 500 };
        break;
      case 'hold': {
        /* 定格：可选黑边 + 静音 */
        if (s.letterbox) Fx.setLetterbox(1, 500);
        if (s.mute) G.Aud.stopBgm(400);
        if (s.wind) Cut._windStop = G.Aud.sfx.wind(s.windGain === undefined ? .12 : s.windGain);
        yield { ms: s.ms || 3000 };
        if (s.letterbox && s.keepBox !== true) Fx.setLetterbox(0, 500);
        if (Cut._windStop && s.windOff !== false) { Cut._windStop(1200); Cut._windStop = null; }
        break;
      }
      case 'input':
        Cut._waitInput = true;
        yield { until: function () { return !Cut._waitInput; } };
        break;

      /* ---- 屏幕效果 ---- */
      case 'shake': G.Game.shake(s.p || 12, s.ms || 400); if (s.wait) yield { ms: s.ms || 400 }; break;
      case 'flash': Fx.flash(s.color || '#fff', s.ms || 240, s.a === undefined ? .8 : s.a); if (s.wait) yield { ms: s.ms || 240 }; break;
      case 'tint': Fx.tint(s.color || '#000', s.a === undefined ? .35 : s.a, s.ms === undefined ? 400 : s.ms); if (s.wait) yield { ms: s.ms || 400 }; break;
      case 'desat': Fx.setDesat(s.a === undefined ? 1 : s.a, s.ms === undefined ? 800 : s.ms); if (s.wait) yield { ms: s.ms || 800 }; break;
      case 'vignette': Fx.setVignette(s.a === undefined ? .5 : s.a, s.ms, s.color); break;
      case 'redEdge': Fx.setRedEdge(s.a === undefined ? 1 : s.a, s.ms === undefined ? 600 : s.ms); break;
      case 'letterbox': Fx.setLetterbox(s.a === undefined ? 1 : s.a, s.ms === undefined ? 500 : s.ms); if (s.wait) yield { ms: s.ms || 500 }; break;
      case 'scanlines': Fx.scanlines = s.a === undefined ? 1 : s.a; break;
      case 'grain': Fx.grain = s.a === undefined ? 1 : s.a; break;
      case 'glitch': Fx.glitchBurst(s.ms || 500, s.p === undefined ? 1 : s.p); if (s.wait) yield { ms: s.ms || 500 }; break;
      case 'zoom': Fx.setZoom(s.z === undefined ? 1 : s.z, s.ms === undefined ? 700 : s.ms, s.cx, s.cy); if (s.wait) yield { ms: s.ms || 700 }; break;
      case 'slowmo': G.Game.slowmo(s.scale === undefined ? .2 : s.scale, s.ms || 1200); break;
      case 'black':
        G.Tw.to(Cut, s.ms === undefined ? 700 : s.ms, { blackout: s.a === undefined ? 1 : s.a, ease: 'inOutQuad' });
        if (s.wait !== false) yield { ms: s.ms === undefined ? 700 : s.ms };
        break;

      /* ---- 粒子 / 死亡 ---- */
      case 'shatter': {
        var as = Dlg.actor(s.who);
        if (as) {
          G.Portrait.shatter(as.ch, as.x, as.y, as.scale, { color: s.color, n: s.n });
          G.Tw.to(as, s.ms || 500, { alpha: 0, ease: 'outQuad',
            onComplete: function () { if (s.keep !== true) Dlg.removeActor(s.who); } });
        }
        if (s.wait !== false) yield { ms: s.ms || 500 };
        break;
      }
      case 'motes': {
        var am = Dlg.actor(s.who);
        var mx = s.x !== undefined ? s.x : (am ? am.x : 640);
        var my = s.y !== undefined ? s.y : (am ? am.y - 70 : 400);
        Fx.motes(mx, my, s.color || (am ? am.ch.color : '#fff'), s.n || 30, s);
        break;
      }
      case 'feather':
        for (var fi = 0; fi < (s.n || 1); fi++) Fx.feather(s.x === undefined ? 640 : s.x, s.y === undefined ? 200 : s.y, s.color);
        break;
      case 'burst': Fx.burst(s.x, s.y, s); break;
      case 'ring': Fx.ring(s.x, s.y, s); break;
      case 'explode': Fx.explode(s.x, s.y, s); break;

      /* ---- 自定义绘制 ---- */
      case 'paint': {
        var fn = Paint[s.fn];
        if (!fn) { console.warn('[cut] 未知 painter: ' + s.fn); break; }
        var pt = {
          fn: fn, name: s.fn, t: 0, dur: s.ms || 2000, alpha: s.a === undefined ? 1 : s.a,
          keep: !!s.keep, over: s.layer === 'over', data: s.data || {}, fade: s.fade || 0
        };
        Cut.painters.push(pt);
        if (s.wait !== false && !s.keep) yield { ms: s.ms || 2000 };
        break;
      }
      case 'unpaint':
        for (var pi = Cut.painters.length - 1; pi >= 0; pi--) {
          if (!s.fn || Cut.painters[pi].name === s.fn) {
            if (s.ms) {
              (function (p) {
                G.Tw.to(p, s.ms, { alpha: 0, onComplete: function () { p.dead = true; } });
              })(Cut.painters[pi]);
            } else Cut.painters[pi].dead = true;
          }
        }
        if (s.ms && s.wait !== false) yield { ms: s.ms };
        break;

      /* ---- 字幕 / 标题卡 ---- */
      case 'sub': {
        Cut.sub = { text: s.text, alpha: 0, opt: s };
        G.Tw.to(Cut.sub, s.fade === undefined ? 600 : s.fade, { alpha: 1, ease: 'outQuad' });
        if (s.ms) {
          /* wait:false —— 字幕自己走完并淡出，主序列继续。
             用于「宣告」型旁白必须与画面事件同时发生的场合。 */
          if (s.wait === false) {
            if (s.keep !== true) {
              (function (sb) {
                G.Tw.delay(s.ms, function () {
                  if (Cut.sub !== sb) return;
                  G.Tw.to(sb, 500, { alpha: 0, onComplete: function () { if (Cut.sub === sb) Cut.sub = null; } });
                });
              })(Cut.sub);
            }
            break;
          }
          yield { ms: s.ms };
          if (s.keep !== true) {
            var sb = Cut.sub;
            G.Tw.to(sb, 500, { alpha: 0, onComplete: function () { if (Cut.sub === sb) Cut.sub = null; } });
            yield { ms: 500 };
          }
        }
        break;
      }
      case 'clearsub':
        if (Cut.sub) {
          var sb2 = Cut.sub;
          G.Tw.to(sb2, s.ms || 400, { alpha: 0, onComplete: function () { if (Cut.sub === sb2) Cut.sub = null; } });
          if (s.wait !== false) yield { ms: s.ms || 400 };
        }
        break;
      case 'card': {
        Cut.card = { small: s.small || '', big: s.big || '', p: 0 };
        G.Tw.to(Cut.card, 700, { p: 1, ease: 'outCubic' });
        yield { ms: s.ms || 2200 };
        var cd = Cut.card;
        G.Tw.to(cd, 500, { p: 0, ease: 'inQuad', onComplete: function () { if (Cut.card === cd) Cut.card = null; } });
        yield { ms: 520 };
        break;
      }

      /* ---- 音频 ---- */
      case 'sfx': if (G.Aud.sfx[s.id]) G.Aud.sfx[s.id](s.arg); break;
      case 'bgm': G.Aud.playBgm(s.id, { fade: s.fade === undefined ? 900 : s.fade, layers: s.layers, intensity: s.intensity }); break;
      case 'stopBgm': G.Aud.stopBgm(s.ms === undefined ? 700 : s.ms); if (s.wait) yield { ms: s.ms || 700 }; break;
      case 'layers': G.Aud.setLayers(s.set || {}); break;
      case 'duck': G.Aud.duck(s.ms || 1200, s.a); break;
      case 'scream':
        G.Aud.scream(s.dur || 3.2);
        /* 复活时继承的痛苦不允许快进 —— 这段必须整段看完 */
        Cut.noFF = true;
        G.Tw.delay((s.dur || 3.2) * 1000 + 400, function () { Cut.noFF = false; });
        break;
      case 'wind':
        if (s.off) { if (Cut._windStop) { Cut._windStop(s.ms ? s.ms / 1000 : 1.2); Cut._windStop = null; } }
        else Cut._windStop = G.Aud.sfx.wind(s.gain === undefined ? .12 : s.gain);
        break;

      /* ---- 状态 ---- */
      case 'flag': G.St.setFlag(s.k, s.v === undefined ? true : s.v); break;
      case 'learn': G.St.learn(s.k, s.label); break;
      case 'kill': G.St.kill(s.who); break;
      case 'sanity': G.St.addSanity(s.n || 0); break;
      case 'codex': G.Save.unlockCodex(s.id); break;
      case 'call': if (s.fn) s.fn(); break;

      /* ---- 控制流 ---- */
      case 'par': {
        /* 并行：各子序列同时跑，全部结束才继续 */
        var subs = s.steps || [];
        var handles = [], left = subs.length;
        var doneCount = { v: 0 };
        for (var k = 0; k < subs.length; k++) {
          (function (arr) {
            var g = (function* () { yield* run2(arr); doneCount.v++; })();
            handles.push(G.Tw.coro(g, Cut));
          })(Array.isArray(subs[k]) ? subs[k] : [subs[k]]);
        }
        yield { until: function () { return doneCount.v >= left; } };
        break;
      }
      case 'seq':
        yield* run2(s.steps || []);
        break;
      case 'if':
        if (s.cond && s.cond()) { if (s.then) yield* run2(s.then); }
        else if (s.else) yield* run2(s.else);
        break;
      case 'repeat':
        for (var r = 0; r < (s.n || 1); r++) yield* run2(s.steps || []);
        break;
      case 'reset':
        G.Fx.reset();
        break;
      default:
        console.warn('[cut] 未知步骤类型: ' + s.t);
    }
  }
  /* 子序列（不触发 finish） */
  function* run2(steps) {
    for (var i = 0; i < steps.length; i++) {
      if (!Cut.playing) return;
      yield* step(steps[i]);
    }
  }
  Cut._step = step;

  /* ---------------- 更新 ---------------- */
  Cut.update = function (dt) {
    G.Dlg.update(dt);
    /* 等待任意键 */
    if (Cut._waitInput && (G.In.hit('confirm') || G.In.mclick)) Cut._waitInput = false;
    /* painter 计时 */
    for (var i = Cut.painters.length - 1; i >= 0; i--) {
      var p = Cut.painters[i];
      p.t += dt;
      if (p.dead || (!p.keep && p.t > p.dur + 60)) Cut.painters.splice(i, 1);
    }
  };

  /* ---------------- 绘制 ---------------- */
  Cut.draw = function (ctx, dt) {
    /* 背景 */
    if (Cut.field) {
      Cut.field.draw(ctx, dt, 1);
    } else if (Cut.bg) {
      if (Cut.bgPrev && Cut.bgFade < 1) {
        Cut.bgPrev.draw(ctx, dt, { camX: Cut.camX, camY: Cut.camY });
        ctx.save();
        ctx.globalAlpha = Cut.bgFade;
        Cut.bg.draw(ctx, dt, { camX: Cut.camX, camY: Cut.camY });
        ctx.restore();
      } else {
        Cut.bg.draw(ctx, dt, { camX: Cut.camX, camY: Cut.camY });
      }
    } else {
      ctx.fillStyle = '#05070e';
      ctx.fillRect(0, 0, 1280, 720);
    }

    /* 底层 painter */
    drawPainters(ctx, false);

    /* 立绘与背景分离：先压暗背景下半，角色才读得出来 */
    if (G.Dlg.actors.length) {
      ctx.save();
      var fg = ctx.createLinearGradient(0, 260, 0, 720);
      fg.addColorStop(0, 'rgba(4,7,14,0)');
      fg.addColorStop(1, 'rgba(4,7,14,.46)');
      ctx.fillStyle = fg;
      ctx.fillRect(0, 260, 1280, 460);
      ctx.restore();
    }

    /* 立绘 */
    G.Dlg.drawStage(ctx);

    /* 上层 painter */
    drawPainters(ctx, true);

    /* 全屏黑 */
    if (Cut.blackout > 0.002) {
      ctx.save();
      ctx.globalAlpha = Cut.blackout;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 1280, 720);
      ctx.restore();
    }

    G.Game.updateBlurBuf();

    /* 对话框 */
    G.Dlg.draw(ctx);

    /* 字幕 */
    if (Cut.sub && Cut.sub.alpha > 0.01) {
      var o = U.merge({}, Cut.sub.opt);
      o.alpha = Cut.sub.alpha;
      Ui.subtitle(ctx, Cut.sub.text, o);
    }
    /* 标题卡 */
    if (Cut.card) Ui.chapterCard(ctx, Cut.card.small, Cut.card.big, Cut.card.p);

    /* 跳过提示 */
    if (Cut.playing && Cut.skippable) {
      var ff = G.Game.ffwd > 1;
      var a = ff ? .95 : (.28 + .16 * Math.sin(G.Game.real * .003));
      Ui.text(ctx, ff ? '▶▶ 快进中' : '按住 Ctrl 快进', 1256, 706, {
        size: ff ? 13 : 12, align: 'right', weight: ff ? 600 : 400,
        color: ff ? 'rgba(159,240,255,.95)' : 'rgba(200,225,245,' + a + ')', shadow: ff
      });
    }
    /* 等待输入提示 */
    if (Cut._waitInput) {
      var bob = Math.sin(G.Game.real * .005) * 4;
      Ui.text(ctx, '▼', 640, 664 + bob, { size: 22, align: 'center', color: '#9ff0ff', glow: 1 });
    }
  };

  function drawPainters(ctx, over) {
    for (var i = 0; i < Cut.painters.length; i++) {
      var p = Cut.painters[i];
      if (!!p.over !== over) continue;
      var prog = p.keep ? U.clamp01(p.t / Math.max(1, p.dur)) : U.clamp01(p.t / Math.max(1, p.dur));
      ctx.save();
      ctx.globalAlpha = p.alpha;
      try { p.fn(ctx, prog, p.data, p.t); } catch (e) { console.error('[paint ' + p.name + ']', e); p.dead = true; }
      ctx.restore();
    }
  }

})(window);
