/* ===========================================================
   dialogue.js — 逐字弹出对话 + 差异化哔声 + 立绘舞台 + 选项
     · Undertale 式逐字，每个字一声「哔」，每角色音色不同
     · 说话者立绘必须有反应（呼吸/口型/放大/提亮，非说话者压暗）
     · 富文本标签：{s}抖{/s} {c:#f00}色{/c} {p:400}停顿 {slow} {fast} {g}故障{/g}
     · 选项：毛玻璃按钮，支持条件显示
   =========================================================== */
(function (root) {
  'use strict';
  var G = root.G, U = G.U, Ui = G.Ui;

  var Dlg = G.Dlg = {
    active: false,
    actors: [],
    line: null,
    queue: [],
    onDone: null,
    onChoice: null,
    tokens: [],
    shown: 0,
    typeAcc: 0,
    pauseLeft: 0,
    done: false,          // 当前行是否已全部显示
    boxA: 0,             // 对话框淡入
    choiceMode: false,
    choiceMenu: null,
    choiceList: null,
    hideBox: false,
    log: [],
    autoMode: false,
    lastBeep: 0,
    skipHold: 0,
    nameA: 0,
    _bump: 0
  };

  var BOX = { x: 90, y: 520, w: 1100, h: 158 };
  /* groundY / 默认缩放：换成正比例人体后，头只占全身的 1/6.3，
     再用旧的 1.95 倍脸只有 39px 宽——对话时根本看不清表情。
     所以把默认放大到 3.0 并把站位下移，让头肩落在画面上半，腿藏进对话框后面。 */
  var SLOT = { left: 300, right: 980, center: 640, farLeft: 150, farRight: 1130, groundY: 468 };
  Dlg.SLOT = SLOT;
  Dlg.BOX = BOX;

  /* ---------------- 舞台（立绘） ---------------- */
  Dlg.clearStage = function () { Dlg.actors.length = 0; };

  Dlg.addActor = function (id, opt) {
    opt = opt || {};
    var ex = Dlg.actor(id);
    if (ex) return ex;
    var slot = opt.slot || 'center';
    var a = {
      id: id, ch: G.charOf(id),
      x: opt.x === undefined ? (SLOT[slot] === undefined ? 640 : SLOT[slot]) : opt.x,
      y: opt.y === undefined ? SLOT.groundY : opt.y,
      scale: opt.scale === undefined ? 3.00 : opt.scale,
      alpha: opt.alpha === undefined ? 1 : opt.alpha,
      emo: opt.emo || (G.charOf(id).defaultEmo || 'calm'),
      flip: !!opt.flip, z: opt.z || 0,
      decay: opt.decay === undefined ? (id === 'ty' ? G.St.s.tyDecay : 0) : opt.decay,
      alt: opt.alt || 0, dim: 0, talkOpen: 0, bump: 0,
      auraColor: opt.auraColor || null, auraPower: opt.auraPower === undefined ? 1 : opt.auraPower,
      emblemGlow: opt.emblemGlow || 0, crack: opt.crack || 0,
      tintColor: opt.tintColor || null, tintAmt: opt.tintAmt || 0,
      mechHalf: opt.mechHalf || 0, breathT: Math.random() * 5000,
      rot: opt.rot || 0, luckOff: !!opt.luckOff, hairCol: opt.hairCol || null,
      distort: opt.distort || 0, sit: opt.sit || 0
    };
    Dlg.actors.push(a);
    Dlg.actors.sort(function (p, q) { return p.z - q.z; });
    return a;
  };
  Dlg.actor = function (id) {
    for (var i = 0; i < Dlg.actors.length; i++) if (Dlg.actors[i].id === id) return Dlg.actors[i];
    return null;
  };
  Dlg.removeActor = function (id) {
    for (var i = Dlg.actors.length - 1; i >= 0; i--) if (Dlg.actors[i].id === id) Dlg.actors.splice(i, 1);
  };
  /* 入场动画 */
  Dlg.enter = function (id, opt) {
    opt = opt || {};
    var a = Dlg.addActor(id, opt);
    var from = opt.from || 'fade';
    var tx = a.x;
    if (from === 'left') { a.x = tx - 220; a.alpha = 0; }
    else if (from === 'right') { a.x = tx + 220; a.alpha = 0; }
    else if (from === 'below') { a.y += 120; a.alpha = 0; }
    else { a.alpha = 0; a.scale *= .88; }
    var target = { x: tx, y: opt.y === undefined ? SLOT.groundY : opt.y,
                   alpha: 1, scale: opt.scale === undefined ? 3.00 : opt.scale };
    G.Tw.to(a, opt.ms || 520, U.merge({ ease: 'outCubic' }, target));
    return a;
  };
  Dlg.exit = function (id, opt) {
    opt = opt || {};
    var a = Dlg.actor(id);
    if (!a) return;
    var dx = opt.to === 'left' ? -180 : (opt.to === 'right' ? 180 : 0);
    G.Tw.to(a, opt.ms || 420, {
      alpha: 0, x: a.x + dx, ease: 'inQuad',
      onComplete: function () { Dlg.removeActor(id); }
    });
  };

  Dlg.drawStage = function (ctx) {
    for (var i = 0; i < Dlg.actors.length; i++) {
      var a = Dlg.actors[i];
      if (a.alpha <= 0.01) continue;
      var st = {
        emo: a.emo, alpha: a.alpha, decay: a.decay, alt: a.alt,
        talkOpen: a.talkOpen, flip: a.flip, breathT: a.breathT,
        auraColor: a.auraColor, auraPower: a.auraPower,
        emblemGlow: a.emblemGlow, crack: a.crack, distort: a.distort,
        tintColor: a.tintColor, tintAmt: a.tintAmt, mechHalf: a.mechHalf,
        rot: a.rot, luckOff: a.luckOff, hairCol: a.hairCol, sit: a.sit
      };
      /* 非说话者压暗 */
      if (a.dim > 0) {
        st.tintColor = '#0b1220';
        st.tintAmt = a.dim * .45;
        st.alpha = a.alpha * (1 - a.dim * .22);
      }
      var sc = a.scale * (1 + a.bump * .04);
      /* 地面投影 */
      ctx.save();
      ctx.globalAlpha = a.alpha * .3 * (1 - a.dim * .5);
      var sw = 46 * sc, sh = 11 * sc;
      var g = ctx.createRadialGradient(a.x, a.y + 4, 0, a.x, a.y + 4, sw);
      g.addColorStop(0, 'rgba(0,0,0,.55)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(a.x, a.y + 4, sw, sh, 0, 0, U.TAU); ctx.fill();
      ctx.restore();

      /* 分离晕：立绘经常和同色系背景糊在一起（暗绿的朋友站在暗绿祭坛前、
         纯白的正直的人站在亮天空前）。按角色自身亮度选反向的晕 ——
         深色角色垫亮边，浅色角色垫暗晕。 */
      var hc = a.ch.color;
      if (a.alt && a.ch.color2) hc = U.mix(a.ch.color, a.ch.color2, a.alt);
      var dark = U.lum(hc) < .45;
      ctx.save();
      ctx.globalAlpha = a.alpha * (dark ? .3 : .34) * (1 - a.dim * .55);
      ctx.globalCompositeOperation = dark ? 'lighter' : 'source-over';
      var hw = 150 * sc, hh = 200 * sc;
      var hg = ctx.createRadialGradient(a.x, a.y - 110 * sc, 10, a.x, a.y - 110 * sc, hw);
      hg.addColorStop(0, dark ? 'rgba(150,180,210,.34)' : 'rgba(4,7,14,.5)');
      hg.addColorStop(.6, dark ? 'rgba(120,150,185,.13)' : 'rgba(4,7,14,.22)');
      hg.addColorStop(1, dark ? 'rgba(120,150,185,0)' : 'rgba(4,7,14,0)');
      ctx.fillStyle = hg;
      ctx.beginPath();
      ctx.ellipse(a.x, a.y - 110 * sc, hw, hh, 0, 0, U.TAU);
      ctx.fill();
      ctx.restore();

      G.Portrait.draw(ctx, a.ch, a.x, a.y, sc, st);
    }
  };

  /* ---------------- 文本解析 ---------------- */
  /* 返回 token 数组：{ch, color, shake, glitch, pause, speed} */
  function parse(text) {
    var out = [];
    var color = null, shake = 0, glitch = 0, speed = 1;
    var i = 0;
    while (i < text.length) {
      if (text[i] === '{') {
        var end = text.indexOf('}', i);
        if (end > i) {
          var tag = text.substring(i + 1, end);
          i = end + 1;
          if (tag === 's') shake = 1;
          else if (tag === '/s') shake = 0;
          else if (tag === 'g') glitch = 1;
          else if (tag === '/g') glitch = 0;
          else if (tag === 'slow') speed = .4;
          else if (tag === 'fast') speed = 2.2;
          else if (tag === '/slow' || tag === '/fast') speed = 1;
          else if (tag.indexOf('c:') === 0) color = tag.substring(2);
          else if (tag === '/c') color = null;
          else if (tag.indexOf('p:') === 0) out.push({ ch: '', pause: parseInt(tag.substring(2), 10) || 300 });
          continue;
        }
      }
      out.push({ ch: text[i], color: color, shake: shake, glitch: glitch, speed: speed });
      i++;
    }
    return out;
  }

  /* ---------------- 播放 ---------------- */
  /* lines: [{who, text, emo, alt, decay, slot, shake, tint, sfx, choices, onEnter, wait}] */
  Dlg.play = function (lines, onDone) {
    Dlg.queue = lines.slice();
    Dlg.onDone = onDone || null;
    Dlg.active = true;
    Dlg.hideBox = false;
    G.Tw.to(Dlg, 260, { boxA: 1, ease: 'outCubic' });
    next();
  };
  Dlg.stop = function () {
    Dlg.active = false; Dlg.line = null; Dlg.queue.length = 0;
    Dlg.choiceMode = false; Dlg.choiceMenu = null;
    Dlg.boxA = 0;
  };

  function next() {
    if (!Dlg.queue.length) {
      var cb = Dlg.onDone;
      Dlg.active = false;
      /* keepBox：过场中连续多行时保留框与最后一行，避免闪烁 */
      if (Dlg.keepBox) {
        Dlg.boxA = 1;
      } else {
        Dlg.line = null;
        G.Tw.to(Dlg, 220, { boxA: 0, ease: 'inQuad' });
      }
      if (cb) cb();
      return;
    }
    var L = Dlg.queue.shift();
    /* 条件行 */
    if (L.cond && !L.cond()) { next(); return; }
    Dlg.line = L;
    Dlg.tokens = parse(L.text || '');
    Dlg.shown = 0; Dlg.typeAcc = 0; Dlg.pauseLeft = 0;
    Dlg.done = (Dlg.tokens.length === 0);
    Dlg.choiceMode = false;
    Dlg._bump = 0;

    /* 说话者高亮 / 其他压暗 */
    for (var i = 0; i < Dlg.actors.length; i++) {
      var a = Dlg.actors[i];
      var isSpk = (a.id === L.who);
      G.Tw.to(a, 220, { dim: isSpk ? 0 : .85, ease: 'outQuad' });
      if (isSpk) {
        if (L.emo) a.emo = L.emo;
        if (L.alt !== undefined) a.alt = L.alt;
        if (L.decay !== undefined) a.decay = L.decay;
        a.bump = 1;
        G.Tw.to(a, 380, { bump: 0, ease: 'outQuad' });
      } else if (L.othersEmo && L.othersEmo[a.id]) {
        a.emo = L.othersEmo[a.id];
      }
    }
    if (L.onEnter) L.onEnter();
    if (L.sfx && G.Aud.sfx[L.sfx]) G.Aud.sfx[L.sfx]();
    if (L.shake) G.Game.shake(L.shake, L.shakeMs || 340);
    if (L.tint) G.Fx.tint(L.tint, L.tintA === undefined ? .3 : L.tintA, L.tintMs || 400);
    if (L.flash) G.Fx.flash(L.flash, 220, .6);
    if (L.glitch) G.Fx.glitchBurst(L.glitchMs || 400, L.glitch);
    if (L.hideBox !== undefined) Dlg.hideBox = L.hideBox;
    if (L.bgm) G.Aud.playBgm(L.bgm);
    if (L.duck !== false) G.Aud.duck(1400, .45);
    /* 记录 backlog */
    if (L.text) Dlg.log.push({ who: L.who, text: L.text.replace(/\{[^}]*\}/g, '') });
    if (Dlg.log.length > 120) Dlg.log.shift();
  }
  Dlg.next = next;

  function finishLine() {
    Dlg.shown = Dlg.tokens.length;
    Dlg.done = true;
    Dlg.pauseLeft = 0;
  }

  function buildChoices(L) {
    var list = [];
    for (var i = 0; i < L.choices.length; i++) {
      var c = L.choices[i];
      if (c.cond && !c.cond()) continue;
      list.push(c);
    }
    if (!list.length) return null;
    Dlg.choiceList = list;
    Dlg.choiceMenu = new Ui.Menu(list.map(function (c) {
      return { label: c.text.replace(/\{[^}]*\}/g, ''), id: c.id, hint: c.hint };
    }), { size: 18 });
    Dlg.choiceMode = true;
    return list;
  }

  Dlg.update = function (dt) {
    /* 立绘呼吸时间推进（不受慢放影响过多） */
    for (var i = 0; i < Dlg.actors.length; i++) Dlg.actors[i].breathT += dt;

    if (!Dlg.active || !Dlg.line) return;
    var L = Dlg.line;

    /* 选项模式 */
    if (Dlg.choiceMode) {
      var pick = Dlg.choiceMenu.update();
      if (pick) {
        var c = null;
        for (var k = 0; k < Dlg.choiceList.length; k++) if (Dlg.choiceList[k].id === pick.id) c = Dlg.choiceList[k];
        Dlg.choiceMode = false; Dlg.choiceMenu = null;
        if (c) {
          Dlg.log.push({ who: 'hero', text: '▸ ' + c.text.replace(/\{[^}]*\}/g, '') });
          if (c.effect) c.effect();
          if (Dlg.onChoice) Dlg.onChoice(c.id, c);
          if (c.lines) { Dlg.queue = c.lines.concat(Dlg.queue); }
          if (c.jump) { Dlg.queue.length = 0; Dlg.onDone = null; c.jump(); return; }
        }
        next();
      }
      return;
    }

    /* 打字机 */
    if (!Dlg.done) {
      if (Dlg.pauseLeft > 0) { Dlg.pauseLeft -= dt; return; }
      var speedMul = G.Save.settings().textSpeed || 1;
      if (G.In.down('skip')) speedMul *= 6;
      var tk = Dlg.tokens[Dlg.shown];
      var perChar = 38 / speedMul / ((tk && tk.speed) || 1);
      Dlg.typeAcc += dt;
      var guard = 0;
      while (Dlg.typeAcc >= perChar && Dlg.shown < Dlg.tokens.length && guard++ < 64) {
        var t = Dlg.tokens[Dlg.shown];
        Dlg.shown++;
        Dlg.typeAcc -= perChar;
        if (t.pause) { Dlg.pauseLeft = t.pause; break; }
        if (t.ch && t.ch !== ' ' && t.ch !== '\n') {
          /* 哔声（标点降低频次） */
          var isPunct = '，。！？…、：；—「」（）,.!?:;'.indexOf(t.ch) >= 0;
          if (!isPunct || Math.random() < .4) {
            var spk = Dlg.actor(L.who);
            var v = G.voiceOf(L.who, {
              alt: spk ? spk.alt > .5 : (L.alt > .5),
              decay: spk ? spk.decay : G.St.s.tyDecay,
              ifline: G.St.flag('uprightSurvived')
            });
            G.Aud.beep(v, Dlg.shown, L.emo);
            /* 口型 + 头部微动 */
            if (spk) {
              spk.talkOpen = 1;
              G.Tw.killTag('mouth' + spk.id);
              G.Tw.to(spk, 90, { talkOpen: 0, tag: 'mouth' + spk.id });
            }
          }
        }
        if (t.glitch && Math.random() < .3) G.Fx.glitchBurst(120, .35);
        perChar = 38 / speedMul / ((Dlg.tokens[Dlg.shown] && Dlg.tokens[Dlg.shown].speed) || 1);
      }
      if (Dlg.shown >= Dlg.tokens.length) {
        Dlg.done = true;
        if (L.choices) { if (!buildChoices(L)) Dlg.choiceMode = false; }
      }
      /* 打字中按确认 → 立即显示完 */
      if (G.In.hit('confirm') || G.In.mclick) {
        finishLine();
        if (L.choices) buildChoices(L);
      }
      return;
    }

    /* 已显示完：等确认 */
    if (L.autoNext !== undefined) {
      L._wait = (L._wait || 0) + dt;
      if (L._wait >= L.autoNext) { next(); return; }
    }
    if (G.In.hit('confirm') || G.In.mclick || (G.In.down('skip') && !L.noSkip)) {
      next();
    }
  };

  /* ---------------- 绘制 ---------------- */
  Dlg.draw = function (ctx) {
    if (Dlg.boxA <= 0.01 || Dlg.hideBox) return;
    var L = Dlg.line;
    if (!L) return;
    var ch = G.charOf(L.who);
    var accent = ch.color || '#6fd8ff';
    if (L.who === 'narrator') accent = '#9FC4DD';

    ctx.save();
    ctx.globalAlpha = Dlg.boxA;

    var by = BOX.y + (1 - Dlg.boxA) * 26;

    /* 名牌 */
    var nameTxt = ch.name || '';
    var wash0 = Math.max(G.Fx.tintA || 0, (G.Fx.desatAmt || 0) * .45);
    if (L.nameOverride !== undefined) nameTxt = L.nameOverride;
    else {
      var spk = Dlg.actor(L.who);
      if (spk && spk.alt > .5 && ch.altName) nameTxt = ch.altName;
    }
    if (nameTxt) {
      ctx.font = '700 18px ' + G.FONT;
      var nw = ctx.measureText(nameTxt).width + 46;
      Ui.glass(ctx, BOX.x + 18, by - 26, nw, 38, {
        r: 10, accent: accent, alpha: .5 + wash0 * .44, glow: 1.2, tintColor: U.shade(accent, -.72),
        noise: false, base: 'rgba(5,9,18,.88)', frostA: .5
      });
      Ui.text(ctx, nameTxt, BOX.x + 40, by - 6, {
        size: 18, weight: 700, color: '#ffffff', glow: 1, glowColor: accent
      });
      /* 名牌小圆点 */
      ctx.fillStyle = accent;
      ctx.beginPath(); ctx.arc(BOX.x + 30, by - 7, 4.5, 0, U.TAU); ctx.fill();
    }

    /* 主框 */
    /* 全屏染色/去色是画在对话框之上的（Fx.postDraw 在 Sc.draw 之后），
       会把文字和衬底一起拉向同一个颜色，框里的明暗差被压掉。
       有染色时把衬底压实一些，保住可读性。 */
    var wash = wash0;
    Ui.glass(ctx, BOX.x, by, BOX.w, BOX.h, {
      r: 16, accent: accent, alpha: .46 + wash * .46, glow: 1, corners: true,
      tintColor: U.shade(accent, -.78),
      /* 关掉顶部高光：它是一条 16% 白的渐变，正好压在第一行文字上，
         把白字和衬底的明暗差抹平 —— 对话框比按钮高得多，撑不起这层反光。
         base + 低磨砂：保证衬底恒暗，同时保留背后模糊内容的颜色与流动。 */
      topLight: false, base: 'rgba(5,9,18,.9)', frostA: .5
    });

    /* 文本 */
    var fs = 21;
    ctx.font = '400 ' + fs + 'px ' + G.FONT;
    var maxW = BOX.w - 72;
    var lineH = 34;
    /* 逐 token 排版（支持换行、着色、抖动） */
    var cx = BOX.x + 36, cy = by + 44;
    var t0 = G.Game.real;
    for (var i = 0; i < Dlg.shown && i < Dlg.tokens.length; i++) {
      var tk = Dlg.tokens[i];
      if (!tk.ch) continue;
      if (tk.ch === '\n') { cx = BOX.x + 36; cy += lineH; continue; }
      var w = ctx.measureText(tk.ch).width;
      if (cx + w > BOX.x + 36 + maxW) { cx = BOX.x + 36; cy += lineH; }
      var ox = 0, oy = 0;
      if (tk.shake) { ox = (Math.random() - .5) * 3.4; oy = (Math.random() - .5) * 3.4; }
      if (tk.glitch) { ox += (Math.random() - .5) * 5; }
      /* 刚出现的字做一个小放大 */
      var age = Dlg.shown - i;
      var pop = age < 3 ? (1 - age / 3) : 0;
      var col = tk.color || (L.who === 'narrator' ? '#c8dcea' : '#f0f7ff');
      ctx.save();
      if (pop > 0) {
        ctx.translate(cx + w / 2 + ox, cy + oy);
        ctx.scale(1 + pop * .35, 1 + pop * .35);
        ctx.translate(-(cx + w / 2), -cy);
        ctx.globalAlpha = Dlg.boxA;
      }
      ctx.fillStyle = 'rgba(0,0,0,.6)';
      ctx.fillText(tk.ch, cx + ox + 1.5, cy + oy + 2);
      if (tk.glitch) {
        ctx.fillStyle = 'rgba(255,40,90,.6)';
        ctx.fillText(tk.ch, cx + ox - 2, cy + oy);
        ctx.fillStyle = 'rgba(40,255,220,.6)';
        ctx.fillText(tk.ch, cx + ox + 2, cy + oy);
      }
      ctx.fillStyle = col;
      ctx.fillText(tk.ch, cx + ox, cy + oy);
      ctx.restore();
      cx += w;
    }

    /* 继续指示 */
    if (Dlg.done && !Dlg.choiceMode && Dlg.active) {
      var bob = Math.sin(t0 * .006) * 3;
      ctx.save();
      ctx.globalAlpha = Dlg.boxA * (.6 + .4 * Math.sin(t0 * .006));
      ctx.fillStyle = accent;
      var ax = BOX.x + BOX.w - 34, ay = by + BOX.h - 26 + bob;
      ctx.beginPath();
      ctx.moveTo(ax - 7, ay - 5); ctx.lineTo(ax + 7, ay - 5); ctx.lineTo(ax, ay + 6);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }

    /* 选项 */
    if (Dlg.choiceMode && Dlg.choiceMenu) {
      var n = Dlg.choiceList.length;
      var bh = 46, gap = 10;
      var totalH = n * bh + (n - 1) * gap;
      var sy = by - 18 - totalH;
      var sw = 720;
      Dlg.choiceMenu.draw(ctx, 640 - sw / 2, sy, sw, bh, gap);
    }

    ctx.restore();
  };

  /* 便捷：单行提示（无立绘） */
  Dlg.say = function (who, text, opt) {
    var L = U.merge({ who: who, text: text }, opt || {});
    Dlg.play([L]);
  };

})(window);
