/* ===========================================================
   portrait.js — 角色立绘
     只负责「把角色记录 + 情绪状态翻译成 anime.js 的作画参数」，
     具体怎么画一根睫毛、一束头发，全在 js/render/anime.js。

     对外接口保持不变（全项目 9 处调用点依赖它）：
       P.draw(ctx, ch, x, y, scale, st)   原点在髋部，头心 -74*h*scale，脚底 +70*h*scale
       P.bust(ctx, ch, x, y, h, st)       胸像，y 为下缘
       P.thumb(ctx, ch, x, y, size, st)   圆形头像，(x,y) 为圆心
       P.shatter(ch, x, y, scale, opt)    碎裂特效（不画人）

     情绪：calm fear sad anger surprise broken numb smile determined pain cold mad
           另外兼容剧本里实际写过的 sharp / half
   =========================================================== */
(function (root) {
  'use strict';
  var G = root.G, U = G.U;
  var P = G.Portrait = {};

  /* 旧骨架的两个锚点，用来保证换了画法之后所有场景的构图不动 */
  var ANCHOR_HEAD = -74;    /* 头心相对原点 */
  var ANCHOR_FOOT = 70;     /* 脚底相对原点 */
  var ANCHOR_SPAN = ANCHOR_FOOT - ANCHOR_HEAD;   /* 144 */

  /* ===========================================================
     情绪表：一个情绪要同时改眼、眉、嘴、姿态、呼吸和抖动，
     只改一样（比如只换眼型）是看不出情绪的。
     =========================================================== */
  var EMO = {
    calm:       { eye: 'normal',     brow: 'normal',  mouth: 'line' },
    fear:       { eye: 'shifty',     brow: 'worried', mouth: 'wave',
                  crouch: .50, bend: -.06, sweat: 1, tremble: .9, headTilt: -.05,
                  brAmp: 1.9, brRate: 2.4 },
    sad:        { eye: 'down',       brow: 'sad',     mouth: 'frown',
                  crouch: .22, headTilt: -.16, tears: 1, brAmp: 1.3, brRate: .7 },
    anger:      { eye: 'angry',      brow: 'angry',   mouth: 'frown',
                  bend: .07, tremble: .45, headTilt: .04, brAmp: 1.7, brRate: 1.8 },
    surprise:   { eye: 'wide',       brow: 'raised',  mouth: 'open', mouthOpen: .65,
                  headDy: -.16, bend: -.06, brAmp: .4 },
    broken:     { eye: 'shut',       brow: 'sad',     mouth: 'wave',
                  crouch: .85, handsUp: 1, tears: 1.6, tremble: 2.2, distort: 1,
                  headTilt: -.09, brAmp: 2.6, brRate: 3.2 },
    numb:       { eye: 'hollow',     brow: 'flat',    mouth: 'line',
                  crouch: .18, desat: .8, brAmp: .12, brRate: .35 },
    smile:      { eye: 'crescent',   brow: 'normal',  mouth: 'smile',
                  blush: .7, headTilt: .03, brAmp: 1.2, brRate: 1.15 },
    determined: { eye: 'determined', brow: 'angry',   mouth: 'line',
                  bend: -.03, brAmp: 1.1, brRate: .9 },
    pain:       { eye: 'shut',       brow: 'sad',     mouth: 'open', mouthOpen: .85,
                  crouch: .35, tremble: 1.9, headTilt: .14, brAmp: 2.8, brRate: 3.4 },
    cold:       { eye: 'sharp',      brow: 'flat',    mouth: 'line', brAmp: .55, brRate: .8 },
    mad:        { eye: 'swirl',      brow: 'raised',  mouth: 'grin', mouthOpen: .35,
                  tremble: .7, headTilt: .22, brAmp: 2.2, brRate: 2.6 },
    /* 剧本里实际写过的两个「眼型当情绪用」的值，兼容掉 */
    sharp:      { eye: 'sharp',      brow: 'angry',   mouth: 'line' },
    half:       { eye: 'half',       brow: 'flat',    mouth: 'line' }
  };

  /* 头型：旧记录的 head 字段 → anime 的脸型 */
  var SHAPE = { round: 'round', sharp: 'sharp', square: 'square',
                oval: 'oval', void: 'oval', crown: 'sharp' };

  /* ===========================================================
     把「角色记录 + st」翻译成 anime.js 的一整包参数
     =========================================================== */
  function paramsOf(ch, st, scale) {
    st = st || {};
    var A = G.Anime;
    var t = st.t === undefined ? (G.Game ? G.Game.real : 0) : st.t;
    var breathT = st.breathT === undefined ? t : st.breathT;
    var emoName = st.emo || ch.defaultEmo || 'calm';
    var e = EMO[emoName] || EMO.calm;
    var decay = st.decay || 0;
    var alt = st.alt || 0;
    var build = ch.build || {};
    var art = ch.art || {};

    /* --- 主色链：alt 形态 → 衰老灰化 → 外部 tint --- */
    var cloth = art.cloth || ch.color;
    if (alt > 0 && ch.color2) cloth = U.mix(cloth, ch.color2, alt);
    if (e.desat) cloth = U.desat(cloth, e.desat);
    if (decay > 0 && ch.decayGray) cloth = U.mix(cloth, '#b8bcc4', U.clamp01(decay / 6) * .7);
    if (st.tintColor) cloth = U.mix(cloth, st.tintColor, st.tintAmt || .5);

    /* 衰老：头发逐步变白，皮肤失血 */
    var hair = art.hair;
    var skin = art.skin;
    if (decay > 0 && ch.decayGray) {
      hair = U.mix(hair || U.hslAdj(ch.color, 0, 0, -.3), '#f2f5f9', U.clamp01(decay / 5) * .85);
      skin = U.desat(skin || '#ffe0c8', U.clamp01(decay / 6) * .5);
    }
    if (st.hairCol) hair = st.hairCol;

    var P2 = A.palette({ id: ch.id + (alt > 0 ? '|a' + Math.round(alt * 10) : '') +
                             (decay ? '|d' + decay : '') + (st.tintColor ? '|t' : ''),
                         color: cloth, eyeCol: ch.eyeCol, eyeGlow: ch.eyeGlow,
                         art: U.merge(U.merge({}, art), { hair: hair, skin: skin, cloth: cloth }) });

    /* --- 呼吸：TY 是节拍器，疯子带随机抖 --- */
    var brRate = (ch.breath && ch.breath.rate || 1) * (e.brRate || 1);
    var brAmp = (ch.breath && ch.breath.amp || 1) * (e.brAmp || 1);
    var breathe = Math.sin(breathT * .0018 * brRate) * brAmp;
    if (ch.breath && ch.breath.metronome) {
      breathe = (Math.round(Math.sin(breathT * .0016 * brRate) * 2) / 2) * 1.1 * brAmp;
      if (decay >= 3) breathe += Math.sin(breathT * .02) * .4 * (decay / 5);
    }
    if (ch.breath && ch.breath.jitter) breathe += (Math.random() - .5) * ch.breath.jitter;

    /* --- 姿态 --- */
    var posture = build.posture || 'normal';
    var crouch = (e.crouch || 0) + (posture === 'small' ? .28 : 0) +
                 (posture === 'hunch' ? .45 : 0) + decay * .12 + (st.sit ? 0 : 0);
    var bend = (e.bend || 0) + (posture === 'hunch' ? .10 : 0) +
               (posture === 'tilt' ? .16 : 0) + decay * .02;

    /* --- 眼型：角色固有眼型优先级低于情绪，但 void/dual/swirl 是身份特征 --- */
    var eye = e.eye;
    if (ch.eyes === 'void') eye = 'void';
    else if (ch.eyes === 'dual') eye = 'dual';
    else if (ch.eyes === 'swirl' && emoName === (ch.defaultEmo || 'calm')) eye = 'swirl';
    else if (ch.eyes === 'line' && e.eye === 'normal') eye = 'line';
    else if (ch.eyes === 'sharp' && e.eye === 'normal') eye = 'sharp';
    else if (ch.eyes === 'half' && e.eye === 'normal') eye = 'half';
    else if (ch.eyes === 'crescent' && e.eye === 'normal') eye = 'crescent';

    /* 眨眼：说话时不眨，免得和口型撞在一起 */
    var blink = 1;
    if (eye !== 'shut' && eye !== 'crescent') {
      var cyc = (t + (ch.id ? ch.id.length * 700 : 0)) % 4200;
      if (cyc < 130) blink = Math.abs(cyc - 65) / 65;
    }

    var mouthOpen = Math.max(e.mouthOpen || 0, st.talkOpen || 0);
    var mouth = e.mouth;
    if (ch.mouth === 'smile' && mouth === 'line') mouth = 'smile';
    if (mouthOpen > .08) mouth = (mouth === 'grin') ? 'grin' : 'open';

    /* --- 抖动（像素级，最后加在 translate 上） --- */
    var trx = 0, tryy = 0;
    var tremble = (e.tremble || 0);
    if (tremble > 0) {
      trx = Math.sin(t * .06) * tremble + (Math.random() - .5) * tremble;
      tryy = Math.cos(t * .078) * tremble * .6;
    }
    if (ch.wobble) {
      trx += Math.sin(t * .0031) * 3.4 * (1 - alt);
      tryy += Math.sin(t * .0047) * 1.8 * (1 - alt);
    }

    return {
      pal: P2, t: t, emo: emoName,
      /* anime.head / anime.figure 的参数 */
      o: {
        t: t,
        turn: st.turn === undefined ? .30 : st.turn,
        shape: SHAPE[ch.head] || 'round',
        heads: st.heads || art.heads || 6.4,
        eyeMode: eye, blink: blink,
        browMode: e.brow, browDy: (e.brow === 'raised' ? -.05 : 0),
        mouthMode: mouth, mouthOpen: mouthOpen,
        blush: (e.blush || 0) + (st.blush || 0),
        tears: (e.tears || 0) * (st.tears === undefined ? 1 : st.tears),
        sweat: e.sweat || 0,
        eyeGlow: ch.eyeGlow,
        headTilt: (e.headTilt || 0) + (st.headRot || 0),
        headDy: (e.headDy || 0) + breathe * .02,
        crouch: crouch, bend: bend,
        armOut: st.armOut ? .8 : 0,
        handsUp: e.handsUp || 0,
        sit: st.sit || 0,
        breathe: breathe,
        wMul: (build.w || 1) * (1 - decay * .03),
        hMul: (build.h || 1) * (1 - decay * .01),
        fringeDip: 0,
        lod: 2
      },
      trx: trx, tryy: tryy,
      distort: Math.max(e.distort || 0, st.distort || 0),
      decay: decay, alt: alt, cloth: cloth
    };
  }

  /* ===========================================================
     主绘制
     (x, y) 是旧骨架的髋部原点：头心落在 y-74*h*scale，脚底落在 y+70*h*scale。
     换画法不能动这两个锚点，否则全项目的构图、地面阴影、Y 排序都要重调。
     =========================================================== */
  P.draw = function (ctx, ch, x, y, scale, st) {
    if (!ch) return;
    var A = G.Anime;
    if (!A) return;
    st = st || {};
    var p = paramsOf(ch, st, scale);
    var o = p.o;

    /* 由「头心→脚底」的像素距离反推 hr */
    var S0 = A.skeleton(o);
    var hr = ANCHOR_SPAN * o.hMul * scale / S0.soleY;
    o.lod = A.lod(hr);

    var headY = y + ANCHOR_HEAD * o.hMul * scale;

    ctx.save();
    ctx.globalAlpha *= (st.alpha === undefined ? 1 : st.alpha);
    ctx.translate(x + p.trx, headY + p.tryy);
    if (st.flip) ctx.scale(-1, 1);
    if (st.rot) ctx.rotate(st.rot);
    ctx.scale(hr, hr);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    /* 气场：画在人后面 */
    if (st.auraColor || ch.aura) aura(ctx, st.auraColor || ch.aura, st.auraPower, p.t, S0);

    var S = A.figure(ctx, ch, p.pal, o);

    /* 机械侵蚀：现在有真骨架，装甲片直接贴在关节上 */
    if (st.mechHalf || ch.mechHalf) {
      var amt = st.mechHalf === undefined ? (ch.mechHalf || 1) : st.mechHalf;
      mechHalf(ctx, S, p.pal, amt, p.t, o);
    }
    /* 运气好的人：绕头的四角星 */
    if (ch.luckFx && !st.luckOff) luck(ctx, p.cloth, p.t);
    /* 崩溃 / 回归时的信号失真 */
    if (p.distort > 0) distort(ctx, p.distort, S0);
    /* 即将碎裂的裂纹 */
    if (st.crack > 0) crack(ctx, st.crack, S0);

    ctx.restore();
  };

  /* 胸像：给对话框用。y 是下缘，height 是从头顶到下缘的像素高。 */
  P.bust = function (ctx, ch, x, y, height, st) {
    if (!ch) return;
    var A = G.Anime;
    if (!A) return;
    st = st || {};
    var p = paramsOf(ch, st, 1);
    var o = p.o;
    var clipY = st.clipY === undefined ? 3.30 : st.clipY;
    /* 头顶 -1hr 到 clipY 共 (clipY+1) hr */
    var hr = height / (clipY + 1.05);
    o.lod = A.lod(hr);
    o.clipY = clipY;
    ctx.save();
    ctx.globalAlpha *= (st.alpha === undefined ? 1 : st.alpha);
    ctx.translate(x + p.trx, y - clipY * hr + p.tryy);
    if (st.flip) ctx.scale(-1, 1);
    ctx.scale(hr, hr);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    var S = A.figure(ctx, ch, p.pal, o);
    if (st.mechHalf || ch.mechHalf) {
      var amt = st.mechHalf === undefined ? (ch.mechHalf || 1) : st.mechHalf;
      mechHalf(ctx, S, p.pal, amt, p.t, o);
    }
    if (ch.luckFx && !st.luckOff) luck(ctx, p.cloth, p.t);
    if (p.distort > 0) distort(ctx, p.distort, S, clipY);
    ctx.restore();
  };

  /* ===========================================================
     附加特效（全部在 hr 坐标系里，原点为头心）
     =========================================================== */

  function aura(ctx, col, power, t, S) {
    var gs = G.Fx ? G.Fx.glowSprite(col) : null;
    if (!gs) return;
    var pw = (power === undefined ? 1 : power);
    var z = 16 * pw;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = .30 * pw * (.8 + .2 * Math.sin(t * .003));
    ctx.drawImage(gs, -z / 2, S.chest.y - z / 2, z, z);
    ctx.restore();
  }

  function luck(ctx, col, t) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < 7; i++) {
      var a = t * .0012 + i * (U.TAU / 7);
      var rr = 2.0 + Math.sin(t * .002 + i) * .5;
      var px = Math.cos(a) * rr, py = Math.sin(a) * rr * .7;
      var s = .14 + Math.sin(t * .005 + i) * .06;
      ctx.globalAlpha = .5 + .5 * Math.sin(t * .004 + i * 1.3);
      ctx.fillStyle = i % 2 ? '#fff3c4' : col;
      ctx.beginPath();
      ctx.moveTo(px, py - s * 2);
      ctx.lineTo(px + s * .5, py - s * .5); ctx.lineTo(px + s * 2, py);
      ctx.lineTo(px + s * .5, py + s * .5); ctx.lineTo(px, py + s * 2);
      ctx.lineTo(px - s * .5, py + s * .5); ctx.lineTo(px - s * 2, py);
      ctx.lineTo(px - s * .5, py - s * .5);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  /* 机械侵蚀：沿右半身的骨架贴装甲片。有了真骨架，这层比以前贴得准。 */
  function mechHalf(ctx, S, P2, amt, t, o) {
    var g0 = U.clamp01(amt);
    var pulse = (Math.sin(t * .005) * .5 + .5);
    var plate = 'rgba(14,10,22,.97)';
    var edge = U.rgba('#b07aff', .55 + pulse * .3);
    var thick = .58 + .42 * g0;
    ctx.save();
    ctx.globalAlpha = .8 + .2 * g0;

    function seg(a, b, w) {
      w *= thick;
      var ang = Math.atan2(b.y - a.y, b.x - a.x);
      var len = U.dist(a.x, a.y, b.x, b.y);
      ctx.save();
      ctx.translate(a.x, a.y); ctx.rotate(ang);
      ctx.fillStyle = plate;
      U.roundRect(ctx, -w * .3, -w / 2, len + w * .6, w, w * .35); ctx.fill();
      ctx.strokeStyle = edge; ctx.lineWidth = .05;
      U.roundRect(ctx, -w * .3, -w / 2, len + w * .6, w, w * .35); ctx.stroke();
      ctx.strokeStyle = U.rgba('#8a5ad0', .5); ctx.lineWidth = .035;
      var n = Math.max(2, Math.floor(len / .5));
      for (var i = 1; i < n; i++) {
        var px = len * i / n;
        ctx.beginPath(); ctx.moveTo(px, -w / 2); ctx.lineTo(px, w / 2); ctx.stroke();
      }
      ctx.restore();
    }

    /* 右半头盔 */
    if (g0 > .28) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, (.94 + .16 * g0), -U.PI / 2, U.PI / 2);
      ctx.lineTo(0, 1.0);
      ctx.closePath();
      ctx.fillStyle = plate; ctx.fill();
      ctx.strokeStyle = edge; ctx.lineWidth = .06; ctx.stroke();
      ctx.restore();
      ctx.strokeStyle = U.rgba('#8a5ad0', .6); ctx.lineWidth = .04;
      for (var k = 0; k < 3; k++) {
        var gy = -.40 + k * .38;
        ctx.beginPath(); ctx.moveTo(.25, gy); ctx.lineTo(.82, gy + .06); ctx.stroke();
      }
      /* 发光的机械眼 */
      var gs = G.Fx ? G.Fx.glowSprite('#c07aff') : null;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      if (gs) {
        var z = 1.9;
        ctx.globalAlpha = (.65 + pulse * .3) * (.6 + .4 * g0);
        ctx.drawImage(gs, .42 - z / 2, -.12 - z / 2, z, z);
      }
      ctx.globalAlpha = .85;
      ctx.fillStyle = '#e8d0ff';
      ctx.beginPath(); ctx.ellipse(.42, -.12, .13, .07, 0, 0, U.TAU); ctx.fill();
      ctx.restore();
    }
    /* 右肩 → 右手 */
    seg(S.shJR, S.elR, .62);
    if (g0 > .2) seg(S.elR, S.wrR, .48);
    /* 右侧躯干 */
    seg({ x: .12, y: S.shR.y }, { x: .18, y: S.hip.y }, .78);
    /* 右腿 */
    if (g0 > .45) {
      seg(S.hipJR, S.kneeR, .62);
      if (g0 > .62) seg(S.kneeR, S.ankleR, .48);
    }
    /* 侵蚀触须 */
    ctx.strokeStyle = U.rgba('#8a50dc', .8);
    ctx.lineWidth = .11;
    var nT = 1 + Math.round(g0 * 3);
    for (var q = 0; q < nT; q++) {
      var a2 = -.5 + q * .4;
      var wob = Math.sin(t * .004 + q) * .4;
      ctx.beginPath();
      ctx.moveTo(S.shR.x * .5, S.shR.y + .6);
      ctx.quadraticCurveTo(S.shR.x + 1.1 + wob, S.shR.y + .6 + a2 * 1.7,
                           S.shR.x + 1.9, S.shR.y + 1.1 + a2 * 2.6 + wob * .5);
      ctx.stroke();
    }
    ctx.restore();
  }

  function distort(ctx, amt, S, clipY) {
    var bot = clipY === undefined ? S.soleY : clipY;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < 5; i++) {
      var sy = -1.1 + Math.random() * (bot + 1.1);
      ctx.fillStyle = U.rgba(i % 2 ? '#ff2b5e' : '#2bffe0', .16 * amt);
      ctx.fillRect(-2.2 + (Math.random() - .5) * 1.2 * amt, sy, 4.4, .10 + Math.random() * .30);
    }
    ctx.restore();
  }

  function crack(ctx, amt, S) {
    ctx.save();
    ctx.strokeStyle = U.rgba('#ffffff', .8 * amt);
    ctx.lineWidth = .05;
    var rr = U.rng(1234);
    for (var k = 0; k < 9; k++) {
      var px = rr.range(-1.6, 1.6), py = rr.range(-1.0, S.soleY * .6);
      ctx.beginPath();
      ctx.moveTo(px, py);
      for (var s = 0; s < 3; s++) { px += rr.range(-.7, .7); py += rr.range(-.8, .8); ctx.lineTo(px, py); }
      ctx.stroke();
    }
    ctx.restore();
  }

  /* ===========================================================
     小头像（对话名牌 / 图鉴列表）
     (x, y) 是圆心，size 是直径。
     =========================================================== */
  P.thumb = function (ctx, ch, x, y, size, st) {
    if (!ch) return;
    var A = G.Anime;
    if (!A) return;
    st = st || {};
    var p = paramsOf(ch, st, 1);
    var o = p.o;
    var col = p.cloth;
    var pal = p.pal;
    /* 图鉴未解锁：整体压成中性灰，否则名字写着「？？？」而头像还穿着标志色 */
    if (st.silhouette) {
      col = '#4a545e';
      pal = A.palette({ id: 'sil', color: col, eyeCol: '#2a3138',
                        art: { hair: '#3c444c', skin: '#6a7480', iris: '#2a3138' } });
    }

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, U.TAU);
    ctx.clip();
    /* 底：一层从主色推出来的球面渐变 */
    var g = ctx.createRadialGradient(x, y - size * .18, size * .04, x, y, size * .72);
    g.addColorStop(0, U.rgba(U.celLight(col, .5), .55));
    g.addColorStop(1, U.rgba(U.celShadow(col, .9), .8));
    ctx.fillStyle = g;
    ctx.fillRect(x - size, y - size, size * 2, size * 2);

    var hr = size * .30;
    o.lod = A.lod(hr);
    o.clipY = 3.4;
    o.turn = .34;
    ctx.translate(x, y - size * .04);
    ctx.scale(hr, hr);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    A.figure(ctx, ch, pal, o);
    ctx.restore();

    /* 圈 */
    ctx.save();
    ctx.strokeStyle = U.rgba(col, .9);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, size / 2, 0, U.TAU); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.25)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(x, y, size / 2 - 3, 0, U.TAU); ctx.stroke();
    ctx.restore();
  };

  /* ---------- 碎裂（死亡演出）：只放粒子和音，不画人 ---------- */
  P.shatter = function (ch, x, y, scale, opt) {
    opt = opt || {};
    var col = opt.color || ch.color;
    G.Fx.shards(x, y - 70 * scale, col, opt.n || 54, { rx: 30 * scale, ry: 90 * scale, spd: opt.spd || 3.4 });
    G.Fx.motes(x, y - 70 * scale, U.shade(col, .4), 26, { rx: 28 * scale, ry: 80 * scale });
    if (G.Aud.ready) G.Aud.sfx.shatter();
  };

  /* 供调试/工具查询：这个角色在给定 scale 下的实际像素高度 */
  P.metrics = function (ch, scale, st) {
    var A = G.Anime;
    var p = paramsOf(ch, st || {}, scale);
    var S = A.skeleton(p.o);
    var hr = ANCHOR_SPAN * p.o.hMul * scale / S.soleY;
    return { hr: hr, headY: ANCHOR_HEAD * p.o.hMul * scale,
             footY: ANCHOR_FOOT * p.o.hMul * scale, totalH: (S.soleY + 1) * hr };
  };

})(window);
