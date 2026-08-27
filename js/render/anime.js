/* ===========================================================
   anime.js — 二次元作画内核
     所有尺寸以「头半径 hr」为单位，hr = 颅骨半宽。
     头全高 = 2.28hr（颅顶 -1.0 → 下巴 +1.28），全身 6.5 头身 = 14.82hr。
     只提供画法，不持有状态；角色差异全部由 palette + 发型数据驱动。

     赛璐璐三件套（缺一不可）：
       固有色 → 一号影（U.celShadow .5）→ 二号影（.9），边界必须硬。
       线稿用 U.celLine 出的深色，不用纯黑。
       受光侧补一条 rim，让人物从背景里拔出来。
   =========================================================== */
(function (root) {
  'use strict';
  var G = root.G, U = G.U;
  var A = G.Anime = {};

  /* ---------- 比例表（单位 hr） ---------- */
  var M = A.M = {
    crown: -1.00,      /* 颅顶 */
    hairline: -0.52,
    browY: -0.16,
    eyeY: 0.24,        /* 眼中心：二次元的眼睛压得比写实低 */
    eyeCx: 0.50,       /* 眼中心离中线 */
    eyeW: 0.265,       /* 单眼半宽 */
    eyeH: 0.215,       /* 单眼半高（几乎和半宽等大，这是二次元的关键） */
    earY: 0.28,
    noseY: 0.66,
    mouthY: 0.92,
    chin: 1.28,
    neckW: 0.40,
    shoulder: 1.92,
    shoulderW: 2.10,
    chest: 2.75,
    chestW: 1.72,
    waist: 4.35,
    waistW: 1.12,
    hip: 5.25,
    hipW: 1.26,
    crotch: 5.85,
    knee: 9.40,
    ankle: 13.30,
    sole: 13.82,
    elbow: 4.30,       /* 自然下垂时的肘高 */
    wrist: 6.40
  };
  A.HEAD_H = 2.28;
  A.BODY_H = M.sole - M.crown;   /* 14.82 */

  /* ===========================================================
     调色板：把角色的单一「主色」展开成一整套赛璐璐色阶
     =========================================================== */
  var palCache = {};

  /* 默认肤色：偏暖的浅色，所有角色共用一条基准，再按 art.skin 覆盖 */
  var SKIN_DEFAULT = '#ffe0c8';

  A.palette = function (ch, o) {
    o = o || {};
    var art = ch.art || {};
    var key = ch.id + '|' + (art.skin || '') + '|' + (art.hair || '') + '|' +
              (o.cloth || ch.color) + '|' + (o.tint || '') + '|' + (o.decay || 0);
    var c = palCache[key];
    if (c) return c;

    var skin = art.skin || SKIN_DEFAULT;
    var cloth = o.cloth || ch.color;
    /* 发色：给了就用；没给就从主色推——亮色主角压暗，暗色主角提亮，
       否则头发会和衣服糊成一块。 */
    var hair = art.hair || (U.lum(ch.color) > .58 ? U.hslAdj(ch.color, -6, .10, -.34)
                                                  : U.hslAdj(ch.color, 4, .06, .10));
    var iris = art.iris || ch.eyeCol || U.hslAdj(cloth, 6, .18, -.10);

    c = {
      skin: skin,
      skinS1: U.celShadow(skin, .42),
      skinS2: U.celShadow(skin, .78),
      skinLine: U.celLine(skin, .82),
      blush: U.hslAdj(skin, -14, .34, -.06),

      hair: hair,
      hairS1: U.celShadow(hair, .52),
      hairS2: U.celShadow(hair, .92),
      /* 高光不能走 celLight —— 它会降饱和，头发高光一降饱和就变成灰渣。
         这里保留色相与彩度，只把明度顶上去。 */
      hairLit: U.hslAdj(hair, 5, .04, U.lum(hair) > .70 ? .12 : .40),
      hairLine: U.celLine(hair, .92),

      cloth: cloth,
      clothS1: U.celShadow(cloth, .48),
      clothS2: U.celShadow(cloth, .86),
      clothLit: U.celLight(cloth, .45),
      clothLine: U.celLine(cloth, .95),

      accent: art.accent || U.celLight(cloth, .8),
      inner: art.inner || U.celShadow(cloth, .70),   /* 内衬 / 里布 */

      iris: iris,
      irisDeep: U.celShadow(iris, .80),
      irisLit: U.celLight(iris, .70),
      sclera: art.sclera || '#fbfdff',
      lash: art.lash || U.celLine(hair, 1),
      rim: art.rim || '#cfe8ff'
    };
    palCache[key] = c;
    return c;
  };
  A.clearPaletteCache = function () { palCache = {}; };

  /* ===========================================================
     基础笔法
     =========================================================== */

  /* 变宽线稿：把点列画成一条两端收尖的实心带子。
     w0 起点宽、w1 终点宽、peak 最粗处所在的 t（0..1）。 */
  function ink(ctx, pts, col, w0, w1, peak) {
    if (pts.length < 2) return;
    peak = peak === undefined ? .45 : peak;
    U.taperPath(ctx, pts, function (t) {
      /* 以 peak 为顶的不对称抛物线，两端各自趋近 w0 / w1 */
      var k = t < peak ? (t / Math.max(1e-4, peak)) : (1 - t) / Math.max(1e-4, 1 - peak);
      k = Math.sqrt(U.clamp01(k));
      return U.lerp(t < peak ? w0 : w1, Math.max(w0, w1) * 1.45, k);
    });
    ctx.fillStyle = col;
    ctx.fill();
  }
  A.ink = ink;

  /* 硬边影：把 shape 路径与 clip 区域求交后填充。
     赛璐璐的影子边界必须是硬的，所以这里不能用 gradient。 */
  function celShape(ctx, col, pathFn) {
    ctx.fillStyle = col;
    pathFn(ctx);
    ctx.fill();
  }
  A.celShape = celShape;

  /* 逆光边缘：沿受光侧描一条亮边，把人物从背景拔出来。
     做法是在已有剪裁区内，把一份偏移过的同形状用 lighter 叠一层。 */
  function rimLight(ctx, pathFn, col, dx, dy, a) {
    ctx.save();
    pathFn(ctx);
    ctx.clip();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = a === undefined ? .5 : a;
    ctx.translate(dx, dy);
    ctx.fillStyle = col;
    pathFn(ctx);
    ctx.fill();
    ctx.restore();
  }
  A.rimLight = rimLight;

  /* 整体逆光轮廓 ----------------------------------------------------
     文件开头就写了「逆光边缘是必须的」，但 rimLight() 从来没有被调用过——
     这是这套立绘看起来"平"的最大单一原因：所有形体都只有正面受光的固有色，
     没有任何一条把人物从背景里拔出来的亮边。

     做法：把整个人物用一份"所有键都是同一个发光色"的调色板再画一遍，
     整体偏移一点点，然后正常图层盖上去。只有偏移方向那一侧会露出一条
     沿着真实轮廓的亮边——包括头发丝、披风缺口、手指这些用别的办法很难
     单独描边的地方。代价是多一次 lod0 的绘制。 */
  var RIM_KEYS = ['skin', 'skinS1', 'skinS2', 'skinLine', 'blush',
                  'hair', 'hairS1', 'hairS2', 'hairLit', 'hairLine',
                  'cloth', 'clothS1', 'clothS2', 'clothLit', 'clothLine',
                  'accent', 'inner', 'iris', 'irisDeep', 'irisLit',
                  'sclera', 'lash', 'rim'];
  var rimPalCache = {};
  function rimPalette(col) {
    var p = rimPalCache[col];
    if (p) return p;
    p = {};
    for (var i = 0; i < RIM_KEYS.length; i++) p[RIM_KEYS[i]] = col;
    rimPalCache[col] = p;
    return p;
  }
  A.rimPalette = rimPalette;

  /* 细节等级：脸太小的时候多画的层只会糊成一团脏点，必须逐级砍掉 */
  A.lod = function (hr) { return hr >= 30 ? 2 : (hr >= 14 ? 1 : 0); };

  /* ===========================================================
     眼睛 —— 决定「像不像二次元」的唯一一层
     o: {cx, cy, w, h, side, open, tilt, mode, pupilDx, pupilDy, lod, hr}
     side: -1 画面左眼 / +1 右眼；tilt>0 外眼角上挑（锐利），<0 下垂（柔和）
     =========================================================== */

  /* 眼眶开口路径（局部坐标，已含 side 镜像） */
  function aperture(ctx, o) {
    var s = o.side, cx = o.cx, cy = o.cy, w = o.w, h = o.h * o.open;
    var tilt = (o.tilt || 0) * o.h;
    var ix = s * (cx - w), iy = cy + o.h * .10;          /* 内眼角略低 */
    var ox = s * (cx + w), oy = cy - tilt;               /* 外眼角受 tilt 抬降 */
    ctx.beginPath();
    ctx.moveTo(ix, iy);
    /* 上眼睑：一条高拱，峰值偏外侧 */
    ctx.bezierCurveTo(s * (cx - w * .62), cy - h * .96,
                      s * (cx + w * .18), cy - h * 1.12 - tilt * .4,
                      ox, oy);
    /* 下眼睑：浅得多，几乎是直线带一点弧 */
    ctx.quadraticCurveTo(s * (cx - w * .06), cy + h * .92, ix, iy);
    ctx.closePath();
  }
  A.aperture = aperture;

  A.eye = function (ctx, P, o) {
    var lod = o.lod === undefined ? 2 : o.lod;
    var s = o.side, cx = o.cx, cy = o.cy, w = o.w, h = o.h;
    var open = U.clamp01(o.open === undefined ? 1 : o.open);

    /* 闭眼：只留一条向下弯的睫毛线 */
    if (open < .12) {
      var lw0 = h * .30;
      ink(ctx, [
        { x: s * (cx - w), y: cy + h * .06 },
        { x: s * (cx - w * .2), y: cy + h * .30 },
        { x: s * (cx + w * .72), y: cy + h * .12 },
        { x: s * (cx + w * 1.06), y: cy - h * .16 }
      ], P.lash, lw0 * .5, lw0 * .35, .5);
      return;
    }

    var od = U.merge({}, o); od.open = open;

    /* --- 剪裁进眼眶，画内部结构 --- */
    ctx.save();
    aperture(ctx, od);
    ctx.clip();

    /* 眼白：上深下浅，本身就是一层弱阴影 */
    var gS = ctx.createLinearGradient(0, cy - h, 0, cy + h);
    gS.addColorStop(0, U.mix(P.sclera, P.skinS1, .34));
    gS.addColorStop(.55, P.sclera);
    gS.addColorStop(1, U.mix(P.sclera, P.skinS1, .12));
    ctx.fillStyle = gS;
    ctx.fillRect(s * (cx - w) - s * .3 - .3, cy - h * 1.6, (w * 2 + .8) * (s > 0 ? 1 : -1), h * 3.4);

    var ix = s * cx + (o.pupilDx || 0), iy = cy + (o.pupilDy || 0);
    var irx = w * .60, iry = h * 1.06 * (o.open > .5 ? 1 : .9);

    /* 虹膜：上暗下亮的竖向渐变 —— 这是「眼睛里有光」的根 */
    var gI = ctx.createLinearGradient(0, iy - iry, 0, iy + iry);
    gI.addColorStop(0, P.irisDeep);
    gI.addColorStop(.42, P.iris);
    gI.addColorStop(.86, P.irisLit);
    gI.addColorStop(1, U.celLight(P.iris, .9));
    ctx.fillStyle = gI;
    ctx.beginPath(); ctx.ellipse(ix, iy, irx, iry, 0, 0, U.TAU); ctx.fill();

    if (lod >= 1) {
      /* 虹膜外圈：一圈深色，把虹膜从眼白里切出来。
         注意这里处在 scale(hr) 之后的坐标系，线宽单位是 hr —— 不能写像素常数。 */
      ctx.strokeStyle = U.rgba(P.irisDeep, .85);
      ctx.lineWidth = Math.max(.012, w * .10);
      ctx.beginPath(); ctx.ellipse(ix, iy, irx, iry, 0, 0, U.TAU); ctx.stroke();
    }

    /* 瞳孔 */
    ctx.fillStyle = U.celShadow(P.iris, 1);
    ctx.beginPath(); ctx.ellipse(ix, iy + h * .04, irx * .38, iry * .44, 0, 0, U.TAU); ctx.fill();

    if (lod >= 1) {
      /* 上眼睑投影：横贯眼球上部的暗带。少了这层，眼睛就是贴上去的两颗玻璃珠。 */
      ctx.fillStyle = 'rgba(28,18,42,.34)';
      ctx.fillRect(s * (cx - w) - s * .4 - .4, cy - h * 1.7, (w * 2 + 1) * (s > 0 ? 1 : -1),
                   h * 1.7 - h * .30);
      /* 虹膜底部聚光：环境光在眼球下缘的反弹 */
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = .55;
      ctx.fillStyle = P.irisLit;
      ctx.beginPath();
      ctx.ellipse(ix, iy + iry * .62, irx * .74, iry * .34, 0, 0, U.TAU);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }

    /* 高光：主高光在受光侧上方，副高光在对角，一大一小才有玻璃感 */
    ctx.fillStyle = 'rgba(255,255,255,.95)';
    ctx.beginPath();
    ctx.ellipse(ix - s * irx * .34, iy - iry * .40, irx * .30, iry * .26, -.4, 0, U.TAU);
    ctx.fill();
    if (lod >= 1) {
      ctx.fillStyle = 'rgba(255,255,255,.55)';
      ctx.beginPath();
      ctx.ellipse(ix + s * irx * .38, iy + iry * .44, irx * .16, iry * .13, .3, 0, U.TAU);
      ctx.fill();
    }
    ctx.restore();

    /* --- 眼眶之外的结构 --- */
    var tilt = (o.tilt || 0) * h;
    /* 上睫毛线：最粗的一笔，越过外眼角挑出去 */
    ink(ctx, [
      { x: s * (cx - w * 1.02), y: cy + h * .12 },
      { x: s * (cx - w * .45), y: cy - h * .74 },
      { x: s * (cx + w * .30), y: cy - h * .98 - tilt * .5 },
      { x: s * (cx + w), y: cy - tilt },
      { x: s * (cx + w * 1.28), y: cy - tilt - h * .30 }
    ], P.lash, h * .12, h * .05, .62);

    if (lod >= 1) {
      /* 外眼角的两根睫毛 */
      [0, 1].forEach(function (k) {
        var bx = s * (cx + w * (.62 + k * .26)), by = cy - h * (.86 - k * .30) - tilt * .5;
        U.lock(ctx, bx, by, Math.atan2(-h * .5, s * w * .5), h * (.46 - k * .10), h * .10, s * .25);
        ctx.fillStyle = P.lash; ctx.fill();
      });
      /* 下眼睑：只在外半段，细而短 */
      ink(ctx, [
        { x: s * (cx - w * .1), y: cy + h * 1.02 },
        { x: s * (cx + w * .70), y: cy + h * .82 },
        { x: s * (cx + w * .98), y: cy + h * .30 - tilt * .5 }
      ], U.rgba(P.skinLine, .8), h * .05, h * .03, .5);
    }
    if (lod >= 2) {
      /* 双眼皮褶：一条离睫毛线一点距离的细弧 */
      ctx.strokeStyle = U.rgba(P.skinLine, .38);
      ctx.lineWidth = Math.max(.010, h * .055);
      ctx.beginPath();
      ctx.moveTo(s * (cx - w * .70), cy - h * .78);
      ctx.quadraticCurveTo(s * (cx + w * .1), cy - h * 1.34 - tilt * .5,
                           s * (cx + w * .98), cy - h * .58 - tilt);
      ctx.stroke();
    }
  };

  /* ---------- 眉 ---------- */
  /* mode: normal / angry / sad / worried / flat / raised */
  A.brow = function (ctx, P, o) {
    var s = o.side, cx = o.cx, cy = o.cy, w = o.w, mode = o.mode || 'normal';
    var inner = 0, outer = 0, arch = -.30, thick = 1;
    if (mode === 'angry') { inner = .34; outer = -.20; arch = -.10; thick = 1.25; }
    else if (mode === 'sad') { inner = -.34; outer = .22; arch = -.14; }
    else if (mode === 'worried') { inner = -.22; outer = .06; arch = -.34; }
    else if (mode === 'flat') { arch = -.08; }
    else if (mode === 'raised') { inner = -.16; outer = -.26; arch = -.46; }
    var y = cy + (o.dy || 0);
    ink(ctx, [
      { x: s * (cx - w * 1.02), y: y + inner * w },
      { x: s * (cx - w * .30), y: y + arch * w * .8 },
      { x: s * (cx + w * .52), y: y + arch * w },
      { x: s * (cx + w * 1.08), y: y + outer * w }
    ], P.hairS1, w * .17 * thick, w * .05, .38);
  };

  /* ---------- 鼻 ---------- */
  A.nose = function (ctx, P, o) {
    if (o.lod < 1) return;
    var x = o.x, y = o.y, k = o.k;      /* k: 鼻子大小（hr 比例） */
    /* 二次元的鼻子只是一个受光面的小折角：一笔就够，画长了立刻变写实脸 */
    ink(ctx, [
      { x: x + k * .10, y: y - k * .30 },
      { x: x + k * .16, y: y + k * .16 },
      { x: x - k * .22, y: y + k * .30 }
    ], U.rgba(P.skinLine, .52), k * .20, k * .06, .5);
  };

  /* ---------- 嘴 ---------- */
  /* mode: line / smile / frown / open / grin / small / wave */
  A.mouth = function (ctx, P, o) {
    var x = o.x, y = o.y, w = o.w, open = o.open || 0, mode = o.mode || 'line';
    var lc = U.rgba(P.skinLine, .78);
    if (open > .06) {
      /* 张口：外形是个圆角梯形，里面压深，下方留一点下唇的受光 */
      var oh = w * (.28 + open * .95);
      ctx.fillStyle = U.celShadow(P.blush, .92);
      ctx.beginPath();
      ctx.ellipse(x, y + oh * .30, w * (mode === 'grin' ? .92 : .62), oh, 0, 0, U.TAU);
      ctx.fill();
      if (o.lod >= 1) {
        ctx.fillStyle = U.rgba(P.blush, .85);      /* 舌 */
        ctx.beginPath();
        ctx.ellipse(x, y + oh * .78, w * .40, oh * .42, 0, 0, U.TAU);
        ctx.fill();
      }
      return;
    }
    if (mode === 'smile' || mode === 'grin') {
      ink(ctx, [{ x: x - w * .62, y: y - w * .16 }, { x: x, y: y + w * .30 },
                { x: x + w * .62, y: y - w * .16 }], lc, w * .13, w * .13, .5);
    } else if (mode === 'frown') {
      ink(ctx, [{ x: x - w * .58, y: y + w * .22 }, { x: x, y: y - w * .20 },
                { x: x + w * .58, y: y + w * .22 }], lc, w * .12, w * .12, .5);
    } else if (mode === 'wave') {   /* 快哭出来的波浪嘴 */
      ink(ctx, [{ x: x - w * .62, y: y }, { x: x - w * .2, y: y + w * .26 },
                { x: x + w * .2, y: y - w * .14 }, { x: x + w * .62, y: y + w * .12 }],
          lc, w * .11, w * .09, .5);
    } else if (mode === 'small') {
      ink(ctx, [{ x: x - w * .26, y: y }, { x: x + w * .26, y: y + w * .06 }], lc, w * .12, w * .10, .5);
    } else {
      ink(ctx, [{ x: x - w * .52, y: y }, { x: x + w * .52, y: y + w * .05 }], lc, w * .13, w * .10, .45);
    }
  };

  /* ===========================================================
     头部
     所有坐标以 hr 为单位，头心在 (0,0)。调用方负责 translate + scale(hr)。
     turn: 偏头量 -1..1（0 为正面）。纯正面对称脸僵硬且发怵，默认给 .3 的四分之三侧脸。
     =========================================================== */

  /* 脸型轮廓：颅顶弧 + 颊 + 下巴。shape: round/oval/sharp/square/wide */
  A.faceOutline = function (ctx, turn, shape) {
    turn = turn || 0;
    shape = shape || 'round';
    var chinY = M.chin, jawX = .56, cheekY = .70, cheekX = .92, tempX = .97;
    if (shape === 'sharp') { jawX = .44; chinY = 1.30; cheekX = .88; }
    else if (shape === 'oval') { jawX = .50; chinY = 1.34; cheekX = .90; }
    else if (shape === 'square') { jawX = .70; chinY = 1.20; cheekX = .96; cheekY = .78; }
    else if (shape === 'wide') { jawX = .66; chinY = 1.16; cheekX = 1.00; }
    var cx = turn * .34;                    /* 下巴随偏头横移 */
    ctx.beginPath();
    /* 颅顶：一段接近半圆的弧 */
    ctx.moveTo(-tempX, .16);
    ctx.bezierCurveTo(-1.02, -.72, -.62, -1.04, turn * .10, -1.04);
    ctx.bezierCurveTo(.62, -1.04, 1.02, -.72, tempX, .16);
    /* 右颊 → 下巴 */
    ctx.quadraticCurveTo(cheekX, cheekY, cx + jawX * (1 - turn * .35), chinY - .18);
    ctx.quadraticCurveTo(cx + jawX * .52 * (1 - turn * .3), chinY, cx, chinY);
    /* 下巴 → 左颊 */
    ctx.quadraticCurveTo(cx - jawX * .52 * (1 + turn * .3), chinY, cx - jawX * (1 + turn * .35), chinY - .18);
    ctx.quadraticCurveTo(-cheekX, cheekY, -tempX, .16);
    ctx.closePath();
  };

  /* 耳（只画朝向观众的那只，另一只被偏头藏掉） */
  function ear(ctx, P, side, turn) {
    var x = side * .95, y = M.earY;
    var vis = 1 - U.clamp01(-side * turn * 2.2);      /* 转过去的那侧逐渐消失 */
    if (vis <= .05) return;
    ctx.save();
    ctx.globalAlpha *= vis;
    ctx.fillStyle = P.skin;
    ctx.beginPath();
    ctx.ellipse(x, y, .17, .30, side * .18, 0, U.TAU);
    ctx.fill();
    ctx.strokeStyle = U.rgba(P.skinLine, .55);
    ctx.lineWidth = .035;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - side * .04, y - .14);
    ctx.quadraticCurveTo(x + side * .07, y, x - side * .02, y + .14);
    ctx.stroke();
    ctx.restore();
  }

  /* 刘海在额头上的投影：一条起伏的下边界，上方全部压成一号影。
     这层不能省——它把头发和脸「焊」在一起，否则头发像帽子一样浮着。 */
  function fringeShade(ctx, turn, dip) {
    var dy = .18 + (dip || 0);
    var o = turn * .16;
    ctx.beginPath();
    ctx.moveTo(-1.20, -.16 + dy);
    ctx.lineTo(-.98 + o, -.16 + dy);
    hairEdgePath(ctx, dy, turn, false);
    ctx.lineTo(1.20, -.12 + dy);
    ctx.lineTo(1.20, -1.40);
    ctx.lineTo(-1.20, -1.40);
    ctx.closePath();
  }
  A.fringeShade = fringeShade;

  A.head = function (ctx, ch, P, o) {
    o = o || {};
    var turn = o.turn === undefined ? .30 : o.turn;
    var lod = o.lod === undefined ? 2 : o.lod;
    var shape = o.shape || 'round';
    var fx = turn * .26;                       /* 五官整体横移 */
    var blink = o.blink === undefined ? 1 : o.blink;
    var face = function (c) { A.faceOutline(c, turn, shape); };

    /* --- 耳：先画，让脸盖住内侧 --- */
    ear(ctx, P, 1, turn);
    ear(ctx, P, -1, turn);

    /* --- 肌肤底 --- */
    ctx.fillStyle = P.skin;
    face(ctx); ctx.fill();

    /* --- 脸上的影：全部剪在脸里 --- */
    ctx.save();
    face(ctx); ctx.clip();

    /* 球面体积：脸不是一块平的色片。中央偏受光侧亮、两颊向外压暗，
       再在下颌收一层。这一层在硬边影之下，负责"体积"而不是"形状"。 */
    if (lod >= 1) {
      var lgx = turn >= 0 ? .34 : -.34;
      var fg = ctx.createRadialGradient(lgx, .10, .10, 0, .25, 1.55);
      fg.addColorStop(0, U.rgba(U.celLight(P.skin, .35), .40));
      fg.addColorStop(.52, U.rgba(P.skin, 0));
      fg.addColorStop(1, U.rgba(P.skinS1, .58));
      ctx.fillStyle = fg;
      ctx.fillRect(-1.4, -1.3, 2.8, 2.9);
    }

    /* 刘海投影 */
    ctx.fillStyle = P.skinS1;
    fringeShade(ctx, turn, o.fringeDip || 0);
    ctx.fill();

    /* 背光侧的颊影（与偏头方向相反的那侧） */
    var bs = turn >= 0 ? -1 : 1;
    ctx.fillStyle = U.rgba(P.skinS1, .85);
    ctx.beginPath();
    ctx.moveTo(bs * 1.10, .00);
    ctx.quadraticCurveTo(bs * .82, .52, bs * .58, 1.12);
    ctx.lineTo(bs * 1.10, 1.30);
    ctx.closePath();
    ctx.fill();

    if (lod >= 1) {
      /* 鼻侧与下巴下方的二号影，脸才有厚度 */
      ctx.fillStyle = U.rgba(P.skinS2, .40);
      ctx.beginPath();
      ctx.ellipse(fx, M.chin - .06, .30, .10, 0, 0, U.TAU);
      ctx.fill();
    }

    /* 腮红：横向几道细线比一整片粉更像手绘 */
    if (o.blush > 0) {
      ctx.save();
      ctx.globalAlpha = U.clamp01(o.blush) * .55;
      ctx.fillStyle = P.blush;
      [-1, 1].forEach(function (s) {
        ctx.beginPath();
        ctx.ellipse(s * .62 + fx, M.eyeY + .40, .26, .13, 0, 0, U.TAU);
        ctx.fill();
      });
      if (lod >= 2) {
        ctx.globalAlpha = U.clamp01(o.blush) * .5;
        ctx.fillStyle = U.celShadow(P.blush, .3);
        [-1, 1].forEach(function (s) {
          for (var i = 0; i < 3; i++) {
            var yy = M.eyeY + .32 + i * .075;
            ink(ctx, [{ x: s * (.46 + i * .03) + fx, y: yy },
                      { x: s * (.78 - i * .03) + fx, y: yy - .03 }], ctx.fillStyle, .028, .022, .5);
          }
        });
      }
      ctx.restore();
    }
    ctx.restore();

    /* --- 下颌线：只描下半，上半被头发盖住 --- */
    var cxx = turn * .34, jx = shape === 'square' ? .70 : (shape === 'sharp' ? .44 : .56);
    ink(ctx, [
      { x: .95, y: .22 },
      { x: cxx + jx * (1 - turn * .35), y: M.chin - .20 },
      { x: cxx, y: M.chin }
    ], U.rgba(P.skinLine, .62), .055, .028, .55);
    ink(ctx, [
      { x: -.95, y: .22 },
      { x: cxx - jx * (1 + turn * .35), y: M.chin - .20 },
      { x: cxx, y: M.chin }
    ], U.rgba(P.skinLine, .5), .05, .026, .55);

    /* --- 五官 --- */
    A.nose(ctx, P, { x: fx + .12, y: M.noseY, k: .20, lod: lod });
    A.mouth(ctx, P, { x: fx + .04, y: M.mouthY, w: .26, open: o.mouthOpen || 0,
                      mode: o.mouthMode || 'line', lod: lod });

    A.eyes(ctx, ch, P, o, turn, fx, blink, lod);

    if (o.browMode !== 'none') {
      [-1, 1].forEach(function (s) {
        A.brow(ctx, P, { side: s, cx: M.eyeCx + s * fx * (s > 0 ? .9 : 1.1), cy: M.browY,
                         w: M.eyeW * .96, mode: o.browMode || 'normal', dy: o.browDy || 0 });
      });
    }

    /* --- 泪 / 汗 --- */
    if (o.tears > 0) A.tears(ctx, P, o, fx);
    if (o.sweat > 0) A.sweat(ctx, P, o, fx, turn);
  };

  /* ---------- 双眼派发 ----------
     四分之三侧脸的两只眼不对称：偏头方向那一侧是「远眼」，
     离脸缘更近且被压窄；近眼更完整。对称画法一眼假。 */
  A.eyes = function (ctx, ch, P, o, turn, fx, blink, lod) {
    var mode = o.eyeMode || 'normal';
    var t = o.t || 0;

    /* 特殊眼型：不走常规眼眶结构 */
    if (mode === 'void') { A.eyeVoid(ctx, ch, P, o, fx, lod); return; }
    if (mode === 'swirl') { A.eyeSwirl(ctx, P, fx, t); return; }

    var openMap = { normal: 1, wide: 1.34, half: .52, down: .60, shut: 0, shifty: .92,
                    angry: .84, sharp: .88, determined: .92, hollow: 1, line: .16, crescent: 0 };
    var open = openMap[mode] === undefined ? 1 : openMap[mode];
    open *= blink;
    var tilt = 0;
    if (mode === 'sharp' || mode === 'determined') tilt = .38;
    if (mode === 'angry') tilt = .30;
    if (mode === 'down' || mode === 'half') tilt = -.16;
    var pdx = 0, pdy = 0;
    if (mode === 'shifty') pdx = Math.sin(t * .006) * M.eyeW * .30;
    if (mode === 'down') pdy = M.eyeH * .26;
    if (mode === 'angry') pdy = -M.eyeH * .06;

    var compress = 1 - Math.abs(turn) * .16;
    ctx.save();
    ctx.translate(fx, 0);

    /* 弯月笑眼：一条向上拱的粗弧，不画眼球 */
    if (mode === 'crescent') {
      [-1, 1].forEach(function (s) {
        var far = (s === U.sign(turn));
        var w = M.eyeW * (far ? 1 - Math.abs(turn) * .26 : 1);
        var cx = M.eyeCx * compress;
        ink(ctx, [
          { x: s * (cx - w * 1.0), y: M.eyeY + M.eyeH * .34 },
          { x: s * (cx - w * .2), y: M.eyeY - M.eyeH * .52 },
          { x: s * (cx + w * .6), y: M.eyeY - M.eyeH * .40 },
          { x: s * (cx + w * 1.1), y: M.eyeY + M.eyeH * .18 }
        ], P.lash, M.eyeH * .13, M.eyeH * .07, .5);
      });
      ctx.restore();
      return;
    }

    [-1, 1].forEach(function (s) {
      var far = (s === U.sign(turn) && turn !== 0);
      var w = M.eyeW * (far ? 1 - Math.abs(turn) * .26 : 1);
      var eo = {
        side: s, cx: M.eyeCx * compress, cy: M.eyeY, w: w, h: M.eyeH,
        open: open, tilt: tilt, pupilDx: pdx, pupilDy: pdy, lod: lod
      };
      if (mode === 'hollow') A.eyeHollow(ctx, P, eo);
      else if (mode === 'line') A.eyeLine(ctx, P, eo);
      else if (mode === 'dual' && s === U.sign(turn || 1)) A.eyeMech(ctx, ch, P, eo, o.t || 0);
      else A.eye(ctx, P, eo);
    });
    ctx.restore();
  };

  /* 空洞：眼窝是个坑，只剩一点残光 */
  A.eyeHollow = function (ctx, P, o) {
    var s = o.side, cx = o.cx, cy = o.cy, w = o.w, h = o.h;
    ctx.save();
    aperture(ctx, o); ctx.clip();
    ctx.fillStyle = '#0a0810';
    ctx.fillRect(s * (cx - w) - .2, cy - h * 1.6, w * 3, h * 3.4);
    ctx.fillStyle = 'rgba(190,205,225,.20)';
    ctx.beginPath(); ctx.ellipse(s * cx, cy + h * .55, w * .6, h * .22, 0, 0, U.TAU); ctx.fill();
    ctx.restore();
    ink(ctx, [{ x: s * (cx - w), y: cy + h * .10 }, { x: s * (cx - w * .3), y: cy - h * .82 },
              { x: s * (cx + w), y: cy - h * .10 }], P.lash, h * .13, h * .05, .55);
  };

  /* 一条线的眼（面甲后 / 无表情）。别画粗，粗了就是一条蒙眼布。 */
  A.eyeLine = function (ctx, P, o) {
    var s = o.side, cx = o.cx, cy = o.cy, w = o.w, h = o.h;
    ink(ctx, [{ x: s * (cx - w * .96), y: cy + h * .10 },
              { x: s * (cx + w * .2), y: cy - h * .10 },
              { x: s * (cx + w * 1.02), y: cy - h * .20 }], P.lash, h * .12, h * .05, .5);
  };

  /* 无面：只有两点发光的眼 */
  A.eyeVoid = function (ctx, ch, P, o, fx, lod) {
    var col = o.eyeGlow || ch.eyeGlow || '#ff2b4e';
    ctx.save();
    ctx.translate(fx, 0);
    if (lod >= 1) {
      ctx.globalCompositeOperation = 'lighter';
      var gs = G.Fx ? G.Fx.glowSprite(col) : null;
      if (gs) [-1, 1].forEach(function (s) {
        var z = 1.5;
        ctx.globalAlpha = .8;
        ctx.drawImage(gs, s * M.eyeCx - z / 2, M.eyeY - z / 2, z, z);
      });
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = col;
    [-1, 1].forEach(function (s) {
      /* 细长的裂口，比圆点更有恶意 */
      U.leaf(ctx, s * M.eyeCx, M.eyeY, M.eyeW * .82, M.eyeH * .30, s * .5);
      ctx.fill();
    });
    ctx.restore();
  };

  /* 蚊香眼（疯癫）：必须关在眼眶里，画到脸上就成了涂鸦 */
  A.eyeSwirl = function (ctx, P, fx, t) {
    ctx.save();
    ctx.translate(fx, 0);
    [-1, 1].forEach(function (s) {
      var eo = { side: s, cx: M.eyeCx, cy: M.eyeY, w: M.eyeW, h: M.eyeH, open: 1 };
      ctx.save();
      aperture(ctx, eo); ctx.clip();
      ctx.fillStyle = P.sclera;
      ctx.fillRect(s * (M.eyeCx - M.eyeW) - .4, M.eyeY - M.eyeH * 1.6, M.eyeW * 2 + .8, M.eyeH * 3.2);
      ctx.strokeStyle = P.lash;
      ctx.lineWidth = .038;
      ctx.beginPath();
      for (var i = 0; i < 34; i++) {
        var a = i * .42 + t * .004 * s;
        var rr = .012 + i * .0082;
        var px = s * M.eyeCx + Math.cos(a) * rr, py = M.eyeY + Math.sin(a) * rr * .92;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();
      ink(ctx, [{ x: s * (M.eyeCx - M.eyeW * 1.02), y: M.eyeY + M.eyeH * .12 },
                { x: s * (M.eyeCx - M.eyeW * .3), y: M.eyeY - M.eyeH * .92 },
                { x: s * (M.eyeCx + M.eyeW * 1.1), y: M.eyeY - M.eyeH * .16 }],
          P.lash, M.eyeH * .12, M.eyeH * .05, .55);
    });
    ctx.restore();
  };

  /* 机械义眼（被改造 / 最终 Boss 的异色瞳） */
  A.eyeMech = function (ctx, ch, P, o, t) {
    var s = o.side, cx = o.cx, cy = o.cy, w = o.w, h = o.h;
    var col = ch.eyeGlow || '#ff3355';
    var pulse = .5 + .5 * Math.sin(t * .005);
    ctx.save();
    ctx.fillStyle = '#0a0610';
    ctx.beginPath(); ctx.ellipse(s * cx, cy, w * 1.02, h * 1.0, 0, 0, U.TAU); ctx.fill();
    ctx.strokeStyle = U.rgba(col, .55 + pulse * .4);
    ctx.lineWidth = h * .10;
    ctx.beginPath(); ctx.ellipse(s * cx, cy, w * .62, h * .60, 0, 0, U.TAU); ctx.stroke();
    ctx.lineWidth = h * .06;
    ctx.beginPath();
    ctx.moveTo(s * (cx - w * .96), cy); ctx.lineTo(s * (cx + w * .96), cy);
    ctx.stroke();
    ctx.fillStyle = U.rgba(col, .85);
    ctx.beginPath(); ctx.ellipse(s * cx, cy, w * .16, h * .16, 0, 0, U.TAU); ctx.fill();
    ctx.restore();
    ink(ctx, [{ x: s * (cx - w * 1.04), y: cy + h * .1 }, { x: s * (cx - w * .3), y: cy - h * .9 },
              { x: s * (cx + w * 1.06), y: cy - h * .2 }], P.lash, h * .12, h * .05, .55);
  };

  /* 泪 */
  A.tears = function (ctx, P, o, fx) {
    var amt = U.clamp01(o.tears), t = o.t || 0;
    ctx.save();
    ctx.translate(fx, 0);
    /* 眼下先积一层水光，再垂下一条 */
    [-1, 1].forEach(function (s) {
      ctx.fillStyle = 'rgba(215,240,255,.55)';
      U.leaf(ctx, s * M.eyeCx, M.eyeY + M.eyeH * 1.05, M.eyeW * .8, M.eyeH * .22, 0);
      ctx.fill();
      var flow = ((t * .0013 + (s > 0 ? .5 : 0)) % 1);
      var ty = M.eyeY + M.eyeH + flow * (M.chin - M.eyeY);
      ctx.globalAlpha = amt * (1 - flow * .5);
      ctx.fillStyle = '#e8f6ff';
      ctx.beginPath();
      ctx.ellipse(s * (M.eyeCx + .04), ty, .055, .105, 0, 0, U.TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.9)';
      ctx.beginPath();
      ctx.ellipse(s * (M.eyeCx + .02), ty - .03, .02, .04, 0, 0, U.TAU);
      ctx.fill();
    });
    ctx.restore();
  };

  /* 汗（紧张 / 恐惧的漫画符号） */
  A.sweat = function (ctx, P, o, fx, turn) {
    var amt = U.clamp01(o.sweat), t = o.t || 0;
    var s = turn >= 0 ? -1 : 1;
    var drop = ((t * .0009) % 1);
    ctx.save();
    ctx.globalAlpha = amt * (1 - drop * .3);
    ctx.fillStyle = 'rgba(200,235,255,.85)';
    var x = s * 1.02 + fx, y = -.30 + drop * .5;
    ctx.beginPath();
    ctx.moveTo(x, y - .16);
    ctx.bezierCurveTo(x + .11, y - .02, x + .09, y + .14, x, y + .14);
    ctx.bezierCurveTo(x - .09, y + .14, x - .11, y - .02, x, y - .16);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    ctx.beginPath(); ctx.ellipse(x - .03, y + .02, .022, .035, 0, 0, U.TAU); ctx.fill();
    ctx.restore();
  };

  /* ===========================================================
     头发
     刘海下缘（发际波形）与它在额头上的投影必须共用同一条曲线，
     只差一个向下的偏移量——否则「头发」与「影子」会各画各的，
     头发就像一顶浮在头上的帽子。
     =========================================================== */

  /* 发际波形控制点（从画面左到右）。y 为负 = 在头心之上。 */
  var HAIR_EDGE = [
    [-.98, -.16], [-.74, -.46], [-.48, -.20], [-.20, -.48],
    [.06, -.18], [.34, -.50], [.62, -.22], [.90, -.12]
  ];

  /* 把发际波形铺成一段路径（右→左方向），dy 为整体下移量 */
  function hairEdgePath(ctx, dy, turn, rev) {
    var o = turn * .16;
    var pts = HAIR_EDGE.map(function (p) { return { x: p[0] + o, y: p[1] + dy }; });
    if (rev) pts.reverse();
    for (var i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i];
      ctx.quadraticCurveTo((a.x + b.x) / 2, (i % 2 ? a.y : b.y) + .10, b.x, b.y);
    }
    return pts;
  }

  /* 颅顶发块：比头骨大一圈（头发有体积），下缘接发际波形 */
  function capPath(ctx, vol, turn) {
    var v = vol || 1.08;
    ctx.beginPath();
    ctx.moveTo(.90 + turn * .16, -.12);
    ctx.lineTo(1.04 * v, .12);
    ctx.bezierCurveTo(1.14 * v, -.78 * v, .62 * v, -1.20 * v, turn * .12, -1.20 * v);
    ctx.bezierCurveTo(-.62 * v, -1.20 * v, -1.14 * v, -.78 * v, -1.04 * v, .12);
    ctx.lineTo(-.98 + turn * .16, -.16);
    hairEdgePath(ctx, 0, turn, false);
    ctx.closePath();
  }
  A.capPath = capPath;

  /* 天使环：颅顶那条断续的高光带。
     位置必须在颅顶弧上（跟着头骨的圆），压到刘海中段就变成一条发带。 */
  function angelRing(ctx, P, turn, st) {
    var vol = st.volume || 1.08;
    var k = st.ringY === undefined ? .86 : Math.abs(st.ringY) + .24;
    var o = turn * .20;
    var segs = [[-.70, -.30], [-.18, .26], [.42, .74]];   /* 三段，留缝 */
    ctx.save();
    ctx.fillStyle = P.hairLit;
    ctx.globalAlpha = .78;
    segs.forEach(function (sg) {
      var L = [], R = [], n = 6;
      for (var i = 0; i < n; i++) {
        var f = i / (n - 1);
        var x = U.lerp(sg[0], sg[1], f);
        /* 贴着颅顶弧 */
        var y = -k * vol * Math.sqrt(Math.max(0, 1 - Math.pow(x / (1.04 * vol), 2)));
        var edge = Math.sin(f * Math.PI);              /* 两端收尖 */
        var th = .052 * edge;
        L.push({ x: x + o, y: y - th });
        R.push({ x: x + o, y: y + th });
      }
      R.reverse();
      U.smoothPath(ctx, L.concat(R), true, .35);
      ctx.fill();
    });
    ctx.restore();
  }
  A.angelRing = angelRing;

  /* 取角色发型：优先 art.hairStyle，否则查内置表 */
  A.hairOf = function (ch) {
    var art = ch.art || {};
    if (art.hairStyle) return art.hairStyle;
    return A.HAIR[ch.hair] || A.HAIR[art.hair] || null;
  };

  /* 后发：画在头之前。整体处在阴影里。 */
  A.hairBack = function (ctx, ch, P, o) {
    var st = A.hairOf(ch);
    if (!st) return;
    var turn = o.turn || 0, t = o.t || 0;
    var sway = Math.sin(t * .0013) * .04;
    ctx.fillStyle = P.hairS1;
    /* 后发大块：撑出头骨之外的轮廓。下缘必须是一排尖，
       画成一条平底就变成披风或连衣裙，不是头发。 */
    if (st.backMass) {
      var b = st.backMass;    /* [halfW, topY, bottomY, bulge] */
      var span = b[2] - b[1];
      var tipN = 5;
      ctx.beginPath();
      ctx.moveTo(-b[0], b[1]);
      ctx.bezierCurveTo(-b[0] - b[3], b[1] + span * .45,
                        -b[0] * .94 + sway * 2, b[2] - span * .22,
                        -b[0] * .74 + sway * 3, b[2] - span * .10);
      for (var i = 0; i < tipN; i++) {
        var f0 = i / tipN, f1 = (i + .5) / tipN, f2 = (i + 1) / tipN;
        var x0 = U.lerp(-b[0] * .74, b[0] * .74, f0) + sway * 3;
        var x1 = U.lerp(-b[0] * .74, b[0] * .74, f1) + sway * 3;
        var x2 = U.lerp(-b[0] * .74, b[0] * .74, f2) + sway * 3;
        var dip = b[2] + span * (.04 + (i % 2 ? .07 : .02));
        ctx.quadraticCurveTo((x0 + x1) / 2, dip, x1, dip);
        ctx.quadraticCurveTo((x1 + x2) / 2, b[2] - span * .10, x2, b[2] - span * .10);
      }
      ctx.bezierCurveTo(b[0] * .94 + sway * 2, b[2] - span * .22,
                        b[0] + b[3], b[1] + span * .45, b[0], b[1]);
      ctx.closePath();
      ctx.fill();
      /* 内部的发缕分界：几条竖向的二号影，长发才不会糊成一块板 */
      if (o.lod >= 1 && span > 1.2) {
        ctx.fillStyle = U.rgba(P.hairS2, .45);
        for (var k = 0; k < 4; k++) {
          var fx2 = (k - 1.5) / 1.8;
          var xr = fx2 * b[0] * .52 + turn * .18;
          ink(ctx, [
            { x: xr, y: b[1] + span * .16 },
            { x: xr + fx2 * .10 + sway * 1.5, y: b[1] + span * .58 },
            { x: xr + fx2 * .22 + sway * 3, y: b[2] - span * .06 }
          ], ctx.fillStyle, b[0] * .13, b[0] * .03, .3);
        }
        /* 一条顺着发流的高光 */
        ctx.fillStyle = U.rgba(P.hairLit, .30);
        ink(ctx, [
          { x: -b[0] * .30 + turn * .18, y: b[1] + span * .18 },
          { x: -b[0] * .34 + sway * 2, y: b[1] + span * .60 },
          { x: -b[0] * .30 + sway * 3, y: b[2] - span * .14 }
        ], ctx.fillStyle, b[0] * .16, b[0] * .04, .35);
      }
    }
    (st.back || []).forEach(function (L) {
      U.lock(ctx, L[0] + turn * .14, L[1], L[2] * U.D2R, L[3], L[4], (L[5] || 0) + sway);
      ctx.fill();
    });
    /* 后发的二号影：贴着头骨背面压一圈，让后发与头分层 */
    if (o.lod >= 1 && st.backMass) {
      ctx.fillStyle = U.rgba(P.hairS2, .40);
      ctx.beginPath();
      ctx.ellipse(turn * .22, -.30, 1.00, .92, 0, 0, U.TAU);
      ctx.fill();
    }
  };

  /* 前发：画在脸之后。顺序 = 底色 → 一号影 → 天使环 → 束线 → 呆毛 */
  A.hairFront = function (ctx, ch, P, o) {
    var st = A.hairOf(ch);
    if (!st) return;
    var turn = o.turn || 0, t = o.t || 0;
    var lod = o.lod === undefined ? 2 : o.lod;
    var sway = Math.sin(t * .0012) * .035 + (o.hairSway || 0);
    var locks = (st.top || []).concat(st.fringe || [], st.side || []);
    var shift = turn * .12;

    /* 1. 固有色 */
    ctx.fillStyle = P.hair;
    capPath(ctx, st.volume, turn);
    ctx.fill();
    locks.forEach(function (L) {
      var sw = sway * (L[1] < -.55 ? 1 : .45);
      U.lock(ctx, L[0] + shift, L[1], L[2] * U.D2R, L[3], L[4], (L[5] || 0) + sw);
      ctx.fill();
    });

    /* 2. 一号影：背光侧（与偏头方向相反）整体压一层 */
    var bs = turn >= 0 ? -1 : 1;
    ctx.save();
    capPath(ctx, st.volume, turn);
    ctx.clip();
    ctx.fillStyle = P.hairS1;
    ctx.beginPath();
    ctx.moveTo(bs * 1.40, -1.50);
    ctx.lineTo(bs * .16, -1.50);
    ctx.bezierCurveTo(bs * .44, -.86, bs * .70, -.30, bs * .56, .50);
    ctx.lineTo(bs * 1.40, .50);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    /* 3. 每一束的内侧压深：同根、略窄、朝背光侧偏一点点，
       于是每束发都自带一条硬边影。这一层就是「一坨剪影」与「一束束头发」的分界。 */
    ctx.fillStyle = P.hairS1;
    locks.forEach(function (L) {
      var sw = sway * (L[1] < -.55 ? 1 : .45);
      U.lock(ctx, L[0] + shift, L[1], (L[2] + bs * 5) * U.D2R, L[3] * .97, L[4] * .84,
             (L[5] || 0) + sw + bs * .10);
      ctx.fill();
    });
    /* 再把固有色的窄芯压回去一半，形成 亮-暗-亮 的三层 */
    ctx.fillStyle = P.hair;
    locks.forEach(function (L) {
      if (L[4] < .24) return;
      var sw = sway * (L[1] < -.55 ? 1 : .45);
      U.lock(ctx, L[0] + shift, L[1], (L[2] - bs * 3) * U.D2R, L[3] * .90, L[4] * .52,
             (L[5] || 0) + sw - bs * .06);
      ctx.fill();
    });

    /* 4. 天使环 */
    if (lod >= 1) angelRing(ctx, P, turn, st);

    /* 5. 束尖的线稿：只描刘海最外侧那几束的前缘，画多了变毛线团 */
    if (lod >= 2) {
      (st.fringe || []).forEach(function (L, i) {
        if (i % 2) return;
        var a = L[2] * U.D2R, cu = (L[5] || 0);
        var px = -Math.sin(a), py = Math.cos(a);
        var pts = [];
        for (var k = 0; k <= 3; k++) {
          var f = k / 3;
          pts.push({
            x: L[0] + shift + Math.cos(a) * L[3] * f + px * cu * L[3] * f * f + px * L[4] * .40 * (1 - f),
            y: L[1] + Math.sin(a) * L[3] * f + py * cu * L[3] * f * f + py * L[4] * .40 * (1 - f)
          });
        }
        ink(ctx, pts, U.rgba(P.hairLine, .45), L[4] * .16, L[4] * .03, .25);
      });
    }

    /* 5. 呆毛：单独画在最上层，带自己的摆动 */
    (st.ahoge || []).forEach(function (L) {
      var w = Math.sin(t * .0026) * .22;
      U.lock(ctx, L[0] + shift, L[1], L[2] * U.D2R, L[3], L[4], (L[5] || 0) + w);
      ctx.fillStyle = P.hair;
      ctx.fill();
    });

    /* 6. 帽子 / 头盔（helmet 类发型用） */
    if (st.hat) A.hat(ctx, ch, P, o, st);
  };

  /* ===========================================================
     发型表
     发束格式 [rootX, rootY, angleDeg, len, widthRoot, curl]
       angleDeg: 90=正下 0=右 180=左 270=正上
       curl: 侧向弯曲（相对 len 的比例），正负决定弯向
     backMass: [halfW, topY, bottomY, bulge] —— 后发轮廓
     =========================================================== */
  A.HAIR = {

    /* 主角：乱翘短发。刘海尖端压到眉上，性格里的「毛躁」全在这里。 */
    spiky: {
      volume: 1.10, ringY: -.62,
      backMass: [1.06, -.55, .60, .30],
      top: [[-.88, -.56, 200, .40, .24, .08], [-.52, -.98, 238, .38, .22, .06],
            [.00, -1.14, 268, .44, .24, -.05], [.52, -.98, 300, .40, .22, -.06],
            [.88, -.54, 340, .40, .24, -.10]],
      fringe: [[-.72, -.68, 104, .66, .34, .10], [-.36, -.82, 96, .78, .36, -.04],
               [.02, -.78, 84, .76, .36, .08], [.40, -.80, 72, .74, .34, -.08],
               [.72, -.66, 58, .62, .30, -.14]],
      side: [[-1.00, -.20, 98, .84, .24, .05], [1.00, -.16, 82, .80, .24, -.05]],
      ahoge: [[.06, -1.16, 288, .62, .12, .38]]
    },

    /* TY：整齐后梳 + 一缕垂在脸前的散发（唯一的破绽） */
    sleek: {
      volume: 1.04, ringY: -.66,
      backMass: [1.02, -.50, .80, .26],
      fringe: [[-.66, -.74, 66, .90, .32, .18], [-.24, -.86, 58, 1.00, .34, .16],
               [.18, -.84, 50, .92, .32, .14], [.58, -.72, 42, .78, .28, .12],
               [.00, -.86, 94, 1.34, .09, .28]],
      side: [[-1.02, -.10, 96, .72, .18, .04], [1.02, -.06, 84, .68, .18, -.04]]
    },

    /* 疯子：爆炸乱发，四面八方 */
    messy: {
      volume: 1.14, ringY: -.58,
      backMass: [1.14, -.55, .70, .42],
      top: [[-1.00, -.44, 190, .58, .22, .14], [-.80, -.76, 214, .62, .24, -.10],
            [-.44, -1.04, 244, .56, .22, .12], [-.06, -1.16, 268, .64, .24, -.08],
            [.34, -1.06, 292, .58, .22, .14], [.72, -.82, 320, .62, .24, -.12],
            [.98, -.42, 348, .56, .22, .10]],
      fringe: [[-.70, -.66, 116, .60, .30, .16], [-.30, -.80, 92, .72, .32, -.14],
               [.10, -.76, 78, .68, .30, .18], [.52, -.74, 62, .64, .28, -.16]],
      side: [[-1.04, -.16, 104, .78, .22, .14], [1.04, -.12, 76, .74, .22, -.14]],
      ahoge: [[-.10, -1.18, 282, .78, .11, -.46]]
    },

    /* 老人：发际后移、稀疏，鬓角泛白（白由 decay/palette 处理） */
    old: {
      volume: 1.02, ringY: -.72,
      backMass: [1.00, -.40, .48, .18],
      fringe: [[-.60, -.80, 118, .40, .22, .14], [-.10, -.90, 96, .34, .20, -.10],
               [.44, -.82, 68, .38, .22, -.14]],
      side: [[-1.00, -.06, 100, .62, .20, .08], [1.00, -.02, 80, .58, .20, -.08]]
    },

    /* 被操控的朋友：垂长发，两道侧发帘把脸框住，显得更怯 */
    long: {
      volume: 1.06, ringY: -.64,
      backMass: [1.22, -.62, 4.40, .58],
      fringe: [[-.68, -.72, 100, .70, .32, .06], [-.28, -.86, 94, .80, .34, -.02],
               [.14, -.84, 86, .80, .34, .04], [.54, -.74, 76, .72, .30, -.06]],
      side: [[-1.06, -.30, 95, 2.60, .32, .04], [1.06, -.26, 85, 2.46, .32, -.04]]
    },

    /* 幸运儿：整体上翘，一撮大卷 + 呆毛，气质是「弹起来的」 */
    bounce: {
      volume: 1.12, ringY: -.60,
      backMass: [1.08, -.55, .70, .34],
      top: [[-.74, -.82, 226, .44, .24, .16], [-.20, -1.12, 262, .46, .24, .12],
            [.40, -1.02, 296, .52, .26, -.22], [.86, -.60, 334, .48, .24, -.26]],
      fringe: [[-.66, -.70, 112, .58, .32, .18], [-.24, -.84, 96, .68, .34, .10],
               [.20, -.82, 76, .66, .32, -.16], [.62, -.68, 58, .56, .28, -.22]],
      side: [[-1.00, -.18, 100, .70, .24, .14], [1.00, -.14, 80, .66, .24, -.14]],
      ahoge: [[.16, -1.14, 300, .86, .14, .52]]
    },

    /* 朋友：飘逸中长，肩线附近有一次外翻 */
    flow: {
      volume: 1.07, ringY: -.63,
      backMass: [1.16, -.58, 2.50, .46],
      fringe: [[-.70, -.72, 104, .68, .32, .12], [-.30, -.86, 92, .80, .34, .04],
               [.14, -.82, 80, .76, .32, -.06], [.56, -.70, 64, .64, .28, -.14]],
      side: [[-1.06, -.26, 96, 1.70, .30, .16], [1.06, -.22, 84, 1.60, .30, -.16]]
    },

    /* 最终 Boss：破碎尖冠，全部向上向后，攻击性 */
    crownspike: {
      volume: 1.12, ringY: -.66,
      backMass: [1.20, -.60, 2.10, .52],
      top: [[-1.02, -.40, 196, .72, .26, .10], [-.72, -.84, 220, .84, .28, -.08],
            [-.28, -1.10, 250, .96, .30, .06], [.18, -1.14, 284, 1.02, .30, -.06],
            [.66, -.92, 312, .88, .28, .08], [1.00, -.44, 342, .74, .26, -.10]],
      fringe: [[-.66, -.74, 72, .84, .30, .20], [-.20, -.88, 62, .94, .32, .18],
               [.26, -.84, 52, .88, .30, .16], [.68, -.68, 44, .74, .26, .14]],
      side: [[-1.06, -.22, 94, 1.30, .28, .10], [1.06, -.18, 86, 1.24, .28, -.10]]
    },

    /* 军帽 / 头盔：只留一点鬓发，其余交给 A.hat */
    helmet: {
      volume: .98, ringY: -.70, hat: 'cap',
      backMass: [1.02, -.40, .55, .20],
      fringe: [[-.52, -.60, 112, .34, .22, .10], [.10, -.62, 76, .34, .22, -.10]],
      side: [[-1.00, -.10, 98, .58, .20, .06], [1.00, -.06, 82, .54, .20, -.06]]
    },

    none: null
  };

  /* 军帽 / 飞行帽：帽墙 + 帽箍 + 帽檐，帽檐要在脸上投一条硬影 */
  A.hat = function (ctx, ch, P, o, st) {
    var turn = o.turn || 0;
    var sx = turn * .14;
    /* 帽墙 */
    ctx.fillStyle = P.cloth;
    ctx.beginPath();
    ctx.moveTo(-1.10 + sx, -.40);
    ctx.bezierCurveTo(-1.18 + sx, -1.06, -.56 + sx, -1.30, sx * 1.6, -1.30);
    ctx.bezierCurveTo(.56 + sx, -1.30, 1.18 + sx, -1.06, 1.10 + sx, -.40);
    ctx.closePath();
    ctx.fill();
    /* 帽墙背光侧 */
    var bs = turn >= 0 ? -1 : 1;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-1.10 + sx, -.40);
    ctx.bezierCurveTo(-1.18 + sx, -1.06, -.56 + sx, -1.30, sx * 1.6, -1.30);
    ctx.bezierCurveTo(.56 + sx, -1.30, 1.18 + sx, -1.06, 1.10 + sx, -.40);
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = U.rgba(P.clothS1, .9);
    ctx.fillRect(bs > 0 ? .24 + sx : -1.30, -1.40, 1.10, 1.10);
    ctx.restore();
    /* 帽箍 */
    ctx.fillStyle = P.clothS2;
    U.roundRect(ctx, -1.12 + sx, -.50, 2.24, .22, .07);
    ctx.fill();
    /* 帽徽 */
    if (ch.emblem) {
      ctx.fillStyle = P.accent;
      ctx.beginPath();
      ctx.moveTo(sx + .06, -.62); ctx.lineTo(sx + .20, -.40);
      ctx.lineTo(sx + .06, -.18); ctx.lineTo(sx - .08, -.40);
      ctx.closePath();
      ctx.fill();
    }
    /* 帽檐：必须比帽墙暗一大截，否则白色军帽上根本看不见帽檐 */
    ctx.fillStyle = P.clothLine;
    ctx.beginPath();
    ctx.moveTo(-1.20 + sx, -.32);
    ctx.quadraticCurveTo(sx, .18, 1.20 + sx, -.32);
    ctx.quadraticCurveTo(sx, -.14, -1.20 + sx, -.32);
    ctx.closePath();
    ctx.fill();
    /* 帽檐在额头上的硬影 */
    ctx.save();
    A.faceOutline(ctx, turn, o.shape); ctx.clip();
    ctx.fillStyle = U.rgba(P.skinS2, .55);
    ctx.beginPath();
    ctx.moveTo(-1.20 + sx, -.30);
    ctx.quadraticCurveTo(sx, .26, 1.20 + sx, -.30);
    ctx.lineTo(1.20 + sx, -.60);
    ctx.lineTo(-1.20 + sx, -.60);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  /* 护目镜（老人推到额头上的那副） */
  A.goggles = function (ctx, ch, P, o) {
    var turn = o.turn || 0, sx = turn * .16;
    ctx.save();
    /* 皮带 */
    ctx.fillStyle = U.celShadow('#4a3a2a', .3);
    U.roundRect(ctx, -1.14 + sx, -.72, 2.28, .20, .08);
    ctx.fill();
    /* 两个镜片 */
    [-1, 1].forEach(function (s) {
      var x = s * .52 + sx;
      ctx.fillStyle = U.rgba('#8fd8ff', .5);
      ctx.beginPath();
      ctx.ellipse(x, -.62, .38, .30, 0, 0, U.TAU);
      ctx.fill();
      ctx.strokeStyle = '#6b5230';
      ctx.lineWidth = .07;
      ctx.stroke();
      /* 镜片高光：一条斜的窄条 */
      ctx.fillStyle = 'rgba(255,255,255,.55)';
      ctx.save();
      ctx.beginPath(); ctx.ellipse(x, -.62, .38, .30, 0, 0, U.TAU); ctx.clip();
      ctx.beginPath();
      ctx.moveTo(x - .34, -.50); ctx.lineTo(x - .10, -.86);
      ctx.lineTo(x + .02, -.86); ctx.lineTo(x - .22, -.50);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    });
    ctx.restore();
  };

  /* ===========================================================
     整颗头的装配：后发 → 脸 → 前发 → 配饰
     调用方已经 translate 到头心并 scale(hr)。
     =========================================================== */
  A.face = function (ctx, ch, P, o) {
    o = o || {};
    if (o.lod === undefined) o.lod = 2;
    A.hairBack(ctx, ch, P, o);
    A.head(ctx, ch, P, o);
    A.hairFront(ctx, ch, P, o);
    if (ch.goggles) A.goggles(ctx, ch, P, o);
    if (ch.wrinkles && o.lod >= 1) {
      /* 皱纹：眼下与额头各两道，短、断续，不能画成年轮 */
      var fx = (o.turn || 0) * .26;
      ctx.save();
      A.faceOutline(ctx, o.turn || 0, o.shape); ctx.clip();
      [[-.52, .58], [.44, .56]].forEach(function (p) {
        ink(ctx, [{ x: p[0] + fx, y: p[1] }, { x: p[0] + fx + .22, y: p[1] + .06 }],
            U.rgba(P.skinLine, .38), .035, .018, .5);
      });
      ink(ctx, [{ x: -.30 + fx, y: -.06 }, { x: .04 + fx, y: -.10 }, { x: .34 + fx, y: -.04 }],
          U.rgba(P.skinLine, .30), .032, .016, .5);
      ctx.restore();
    }
  };

  /* ===========================================================
     骨架：先算关节点，再由布料/皮肤各层去描。
     单位仍是 hr，头心在 (0,0)，y 向下。
     o: {crouch, bend, armOut, handsUp, sit, breathe, wMul, hMul, turn, t}
     =========================================================== */
  A.skeleton = function (o) {
    o = o || {};
    var w = o.wMul === undefined ? 1 : o.wMul;
    var h = o.hMul === undefined ? 1 : o.hMul;
    var crouch = o.crouch || 0;          /* hr 单位的整体下沉 */
    var bend = o.bend || 0;              /* 躯干侧弯，正值向画面右 */
    var br = o.breathe || 0;
    var turn = o.turn || 0;
    var sit = o.sit || 0;

    var neckY = M.chin - .18;
    /* 头身比：6.5 头身是标准立绘比例，但地图上的小人只有一百来像素高，
       那个比例下脸会缩成一个点。所以头身比是个参数：
       立绘用 6.4，地图行走图用 5.2，孩子更矮。
       做法是只压缩「下巴以下」的部分，头本身永远是 1 个 hr。 */
    var heads = o.heads || 6.5;
    var bs2 = (heads - 1) * A.HEAD_H / (A.BODY_H - A.HEAD_H);
    /* 下巴必须钉死在画出来的下巴上。头永远是 1 个 hr、不受 hMul 影响，
       所以 hMul 只能作用在「下巴以下」，不能把下巴本身也乘进去——
       以前是 (chin + Δ·bs2)·h，救世主(h=1.16) 的脖子会被拉长 0.2hr，
       孩子(h=0.68) 的头则会陷进躯干里。 */
    var by = function (v, cr) { return M.chin + ((v - M.chin) * bs2 + (cr || 0)) * h; };

    var shY = by(M.shoulder, crouch * .5);
    var chestY = by(M.chest, crouch * .7);
    var waistY = by(M.waist, crouch * .85);
    var hipY = by(M.hip, crouch);
    var crotchY = by(M.crotch, crouch);
    /* 偏头/转身：肩带整体横移，远侧肩往中间收，正面朝向感才出来 */
    var at = Math.abs(turn);
    var shW = M.shoulderW * w * (1 - at * .10);
    var bxT = turn * .40;
    var far = U.sign(turn) || 1;
    var bx = bend * .9 + bxT;

    var S = {
      neck: { x: turn * .16, y: neckY },
      neckBase: { x: bx * .5, y: shY - .18 },
      shL: { x: -shW * (far < 0 ? 1 - at * .20 : 1) + bx, y: shY + .06 - br * .05 },
      shR: { x: shW * (far > 0 ? 1 - at * .20 : 1) + bx, y: shY + .06 - br * .05 },
      chest: { x: bx * .9, y: chestY },
      chestW: M.chestW * w * (1 + br * .02) * (1 - at * .07),
      waist: { x: bx, y: waistY },
      waistW: M.waistW * w * (1 - at * .05),
      hip: { x: bx * .9, y: hipY },
      hipW: M.hipW * w * (1 - at * .05),
      crotch: { x: bx * .9, y: crotchY },
      shW: shW, h: h, w: w, turn: turn, far: far
    };

    /* 手臂：肩关节要落在轮廓里侧，否则手臂会和躯干之间裂开一条缝 */
    var ao = o.armOut || 0;
    var hu = o.handsUp || 0;
    [['L', -1], ['R', 1]].forEach(function (p) {
      var k = p[1], n = p[0];
      var sh = S['sh' + n];
      var root = { x: sh.x - k * .20 * w, y: sh.y + .16 };
      var elX = root.x + k * (.20 + ao * .70) * w;
      var elY = by(M.elbow, crouch * .8);
      var wrX = root.x + k * (.08 + ao * 1.30) * w;
      var wrY = by(M.wrist, crouch * .7);
      if (hu > 0) {
        /* 抱头：手贴在耳侧外面，别压到脸上 */
        elX = root.x + k * 1.15 * w;  elY = U.lerp(elY, shY - .10, hu);
        wrX = U.lerp(wrX, k * 1.16, hu); wrY = U.lerp(wrY, M.earY - .10, hu);
      }
      S['shJ' + n] = root;
      S['el' + n] = { x: elX, y: elY };
      S['wr' + n] = { x: wrX, y: wrY };
    });

    /* 腿：坐姿时大腿朝观众缩短、小腿垂直落地 */
    var kneeY = by(M.knee, crouch), ankY = by(M.ankle, crouch), soleY = by(M.sole, crouch);
    [['L', -1], ['R', 1]].forEach(function (p) {
      var k = p[1], n = p[0];
      var hipX = S.hip.x + k * S.hipW * .46;
      var kX = S.hip.x + k * S.hipW * .40, kY = kneeY;
      var aX = S.hip.x + k * S.hipW * .34, aY = ankY;
      if (sit > 0) {
        kX = U.lerp(kX, S.hip.x + k * S.hipW * 1.10, sit);
        kY = U.lerp(kY, hipY + 1.1 * h * bs2, sit);
        aX = U.lerp(aX, S.hip.x + k * S.hipW * 1.00, sit);
        aY = U.lerp(aY, hipY + 4.6 * h * bs2, sit);
      }
      S['hipJ' + n] = { x: hipX, y: crotchY - .30 * h };
      S['knee' + n] = { x: kX, y: kY };
      S['ankle' + n] = { x: aX, y: aY };
      S['sole' + n] = { x: aX + k * .10, y: sit > .5 ? aY + .40 * h : soleY };
      S.bs = bs2; S.soleY = soleY;
    });
    return S;
  };

  /* 沿折线 a→b→c 均匀取点（会穿过 b），供 taperPath 加粗成肢体 */
  function limbPts(a, b, c, n) {
    n = n || 10;
    var l1 = U.dist(a.x, a.y, b.x, b.y), l2 = U.dist(b.x, b.y, c.x, c.y);
    var tot = l1 + l2 || 1, out = [];
    for (var i = 0; i <= n; i++) {
      var d = tot * i / n;
      if (d <= l1) {
        var t = l1 ? d / l1 : 0;
        out.push({ x: U.lerp(a.x, b.x, t), y: U.lerp(a.y, b.y, t) });
      } else {
        var t2 = l2 ? (d - l1) / l2 : 0;
        out.push({ x: U.lerp(b.x, c.x, t2), y: U.lerp(b.y, c.y, t2) });
      }
    }
    return out;
  }

  /* 肢体：三段宽度插值的实心带子 */
  function limb(ctx, a, b, c, w0, w1, w2, col) {
    var pts = limbPts(a, b, c, 12);
    U.taperPath(ctx, pts, function (t) {
      return t < .5 ? U.lerp(w0, w1, t * 2) : U.lerp(w1, w2, (t - .5) * 2);
    });
    ctx.fillStyle = col;
    ctx.fill();
  }
  A.limb = limb;

  /* 手：这个尺度下画不出手指，画成有拇指的圆润手套形，握拳感 */
  /* 手：不是一个圆片。掌心是个上窄下宽再收尖的四边形，
     拇指从虎口斜伸出来，指节处收一道。手是全身最容易暴露"廉价"的部件——
     一个椭圆手掌会让整个人看起来像布偶。 */
  function hand(ctx, wr, dir, k, col, lod) {
    ctx.save();
    ctx.translate(wr.x, wr.y);
    ctx.rotate(dir);
    /* 掌 + 并起来的四指，整体略微内扣 */
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(-k * .34, k * .06);
    ctx.quadraticCurveTo(-k * .46, k * .42, -k * .34, k * .82);
    ctx.quadraticCurveTo(-k * .16, k * 1.06, k * .06, k * 1.02);
    ctx.quadraticCurveTo(k * .34, k * .92, k * .40, k * .56);
    ctx.quadraticCurveTo(k * .44, k * .20, k * .30, k * .04);
    ctx.closePath();
    ctx.fill();
    /* 拇指：从虎口斜出，不与掌同轴 */
    ctx.beginPath();
    ctx.moveTo(k * .26, k * .14);
    ctx.quadraticCurveTo(k * .56, k * .26, k * .52, k * .52);
    ctx.quadraticCurveTo(k * .40, k * .58, k * .30, k * .40);
    ctx.closePath();
    ctx.fill();
    if (lod >= 2) {
      /* 指缝两道 + 掌心暗部，手才有厚度 */
      ctx.strokeStyle = U.rgba(U.celShadow(col, .55), .75);
      ctx.lineWidth = k * .055;
      ctx.beginPath();
      ctx.moveTo(-k * .18, k * .92); ctx.lineTo(-k * .12, k * .66);
      ctx.moveTo(k * .06, k * .98); ctx.lineTo(k * .10, k * .70);
      ctx.stroke();
      ctx.fillStyle = U.rgba(U.celShadow(col, .45), .5);
      ctx.beginPath();
      ctx.ellipse(-k * .06, k * .46, k * .22, k * .30, .2, 0, U.TAU);
      ctx.fill();
    }
    ctx.restore();
  }
  A.hand = hand;

  /* 躯干轮廓：颈根 → 肩 → 胸 → 腰 → 髋 → 裆。
     所有控制点都必须落在肩宽以内并单调收窄，
     否则胸口会鼓出一个比肩还宽的包，人就变成一只抱枕。 */
  A.torsoPath = function (ctx, S) {
    var sh = S.shW, cw = S.chestW, ww = S.waistW, hw = S.hipW;
    var cx = S.chest.x, wx = S.waist.x, hx = S.hip.x, gx = S.crotch.x;
    ctx.beginPath();
    ctx.moveTo(S.neckBase.x - .30, S.neckBase.y);
    /* 斜方肌：颈根到肩峰是一条下垂的斜线，不是直角 */
    ctx.quadraticCurveTo(S.neckBase.x - sh * .52, S.shL.y - .18, S.shL.x, S.shL.y);
    ctx.quadraticCurveTo(cx - cw - .06, S.chest.y - .30, cx - cw, S.chest.y + .28);
    ctx.quadraticCurveTo(wx - ww - .06, S.waist.y - .60, wx - ww, S.waist.y);
    ctx.quadraticCurveTo(hx - hw - .05, S.hip.y - .40, hx - hw, S.hip.y + .24);
    ctx.quadraticCurveTo(gx - hw * .60, S.crotch.y + .06, gx, S.crotch.y + .18);
    ctx.quadraticCurveTo(gx + hw * .60, S.crotch.y + .06, hx + hw, S.hip.y + .24);
    ctx.quadraticCurveTo(hx + hw + .05, S.hip.y - .40, wx + ww, S.waist.y);
    ctx.quadraticCurveTo(wx + ww + .06, S.waist.y - .60, cx + cw, S.chest.y + .28);
    ctx.quadraticCurveTo(cx + cw + .06, S.chest.y - .30, S.shR.x, S.shR.y);
    ctx.quadraticCurveTo(S.neckBase.x + sh * .52, S.shR.y - .18, S.neckBase.x + .30, S.neckBase.y);
    ctx.closePath();
  };

  /* ===========================================================
     服装表
       hemY: 上衣下缘 y；sleeve: 袖长（1 = 到手腕）
       collar: round / v / stand / hood；下装 pants / 鞋 shoes 由 palette 兜底
     =========================================================== */
  A.OUTFIT = {
    hoodie:  { kind: 'jacket',  hemY: 6.10, collar: 'hood',  sleeve: 1.00, zip: true },
    jacket:  { kind: 'jacket',  hemY: 6.20, collar: 'stand', sleeve: 1.00, zip: true, belt: true },
    coat:    { kind: 'coat',    hemY: 8.90, collar: 'stand', sleeve: 1.00, open: true },
    uniform: { kind: 'uniform', hemY: 5.80, collar: 'stand', sleeve: 1.00, belt: true, trim: true },
    overall: { kind: 'overall', hemY: 6.30, collar: 'round', sleeve: .52 },
    robe:    { kind: 'robe',    hemY: 11.2, collar: 'v',     sleeve: 1.10 },
    armor:   { kind: 'armor',   hemY: 5.90, collar: 'stand', sleeve: .92, pauldron: true, belt: true },
    shroud:  { kind: 'shroud',  hemY: 12.0, collar: 'none',  sleeve: 1.00 },
    plain:   { kind: 'shirt',   hemY: 5.90, collar: 'round', sleeve: .86 }
  };

  A.outfitOf = function (ch) {
    var art = ch.art || {};
    if (art.outfitSpec) return art.outfitSpec;
    return A.OUTFIT[art.outfit] || A.OUTFIT.plain;
  };

  /* ---------- 颈：下颌的投影是这里的关键，没有它头会浮起来 ---------- */
  A.neck = function (ctx, ch, S, P, o) {
    var nw = M.neckW * (S.w || 1);
    var top = M.chin - .34, bot = S.neckBase.y + .16;
    ctx.fillStyle = P.skin;
    ctx.beginPath();
    ctx.moveTo(S.neck.x - nw, top);
    ctx.quadraticCurveTo(S.neck.x - nw - .05, bot - .3, S.neckBase.x - nw * 1.25, bot);
    ctx.lineTo(S.neckBase.x + nw * 1.25, bot);
    ctx.quadraticCurveTo(S.neck.x + nw + .05, bot - .3, S.neck.x + nw, top);
    ctx.closePath();
    ctx.fill();
    /* 下颌投影：一条贴着下巴的硬边影，占颈部上方约四成 */
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(S.neck.x - nw, top);
    ctx.quadraticCurveTo(S.neck.x - nw - .05, bot - .3, S.neckBase.x - nw * 1.25, bot);
    ctx.lineTo(S.neckBase.x + nw * 1.25, bot);
    ctx.quadraticCurveTo(S.neck.x + nw + .05, bot - .3, S.neck.x + nw, top);
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = P.skinS2;
    ctx.beginPath();
    ctx.moveTo(S.neck.x - nw - .1, top - .1);
    ctx.quadraticCurveTo(S.neck.x, top + .46, S.neck.x + nw + .1, top - .1);
    ctx.lineTo(S.neck.x + nw + .1, top - .3);
    ctx.lineTo(S.neck.x - nw - .1, top - .3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  /* ---------- 腿 ---------- */
  A.legs = function (ctx, ch, S, P, o) {
    var art = ch.art || {};
    var of = A.outfitOf(ch);
    var pants = art.pants || P.clothS2;
    var pantsS = U.celShadow(pants, .55);
    var shoes = art.shoes || U.celLine(pants, .55);
    var far = S.far || 1;
    var w = S.w || 1;
    /* 先铺一块骨盆（短裤）把两条大腿的根连起来。
       少了这块，大腿会从髋下方凭空长出来，中间露出一条缝。 */
    ctx.fillStyle = pants;
    ctx.beginPath();
    ctx.moveTo(S.hip.x - S.hipW, S.hip.y - .55);
    ctx.quadraticCurveTo(S.hip.x - S.hipW - .04, S.hip.y + .30, S.hip.x - S.hipW * .80, S.crotch.y + .35);
    ctx.quadraticCurveTo(S.crotch.x, S.crotch.y + .05, S.hip.x + S.hipW * .80, S.crotch.y + .35);
    ctx.quadraticCurveTo(S.hip.x + S.hipW + .04, S.hip.y + .30, S.hip.x + S.hipW, S.hip.y - .55);
    ctx.closePath();
    ctx.fill();

    [['L', -1], ['R', 1]].forEach(function (p) {
      var n = p[0], k = p[1];
      var isFar = (k === far);
      var col = isFar ? pantsS : pants;
      limb(ctx, S['hipJ' + n], S['knee' + n], S['ankle' + n],
           .92 * w, .52 * w, .30 * w, col);
      /* 鞋：鞋面 + 一条独立的鞋底。少了鞋底，脚就是一块色斑，
         人物会看起来"浮"在地上。 */
      var a = S['ankle' + n], s = S['sole' + n];
      var shCol = isFar ? U.celShadow(shoes, .5) : shoes;
      ctx.fillStyle = shCol;
      ctx.beginPath();
      ctx.moveTo(a.x - .30 * w, a.y - .12);
      ctx.lineTo(a.x + .30 * w, a.y - .12);
      ctx.quadraticCurveTo(s.x + .46 * w, s.y - .30, s.x + k * .56 * w, s.y - .10);
      ctx.lineTo(a.x - .34 * w + (k < 0 ? -.14 : 0), s.y - .10);
      ctx.quadraticCurveTo(a.x - .36 * w, s.y - .26, a.x - .30 * w, a.y - .12);
      ctx.closePath();
      ctx.fill();
      /* 鞋底 */
      ctx.fillStyle = U.celLine(shCol, .6);
      U.roundRect(ctx, Math.min(a.x - .38 * w, s.x + k * .56 * w - .1),
                  s.y - .12, Math.abs(k * .56 * w + .38 * w) + .1, .15, .06);
      ctx.fill();
      /* 鞋头受光 */
      if (o.lod >= 1 && !isFar) {
        ctx.fillStyle = U.rgba(U.celLight(shoes, .6), .5);
        ctx.beginPath();
        ctx.ellipse(s.x + k * .30 * w, s.y - .26, .18 * w, .09, 0, 0, U.TAU);
        ctx.fill();
      }
    });
    /* 膝盖上方的布褶：两道短影，腿才不是两根管子 */
    if (o.lod >= 2) {
      [['L', -1], ['R', 1]].forEach(function (p) {
        var n = p[0], kn = S['knee' + n];
        ink(ctx, [{ x: kn.x - .26 * w, y: kn.y - .30 }, { x: kn.x + .10 * w, y: kn.y - .16 }],
            U.rgba(pantsS, .8), .10, .04, .4);
      });
    }
  };

  /* ---------- 躯干与外衣 ---------- */
  A.torso = function (ctx, ch, S, P, o) {
    var of = A.outfitOf(ch);
    var bs = (S.turn || 0) >= 0 ? -1 : 1;      /* 背光侧 */
    var w = S.w || 1, lod = o.lod;

    /* 1. 内衬（领口露出来的那部分） */
    ctx.fillStyle = P.inner;
    A.torsoPath(ctx, S);
    ctx.fill();

    /* 2. 下摆：只有真正的长外套/长袍才需要，短上衣画了会变成裙子 */
    if (of.hemY > M.crotch + 1.0) {
      var hemY = of.hemY * (S.h || 1) + (o.crouch || 0) * (S.h || 1);
      var flare = of.kind === 'robe' ? 1.55 : 1.30;
      var swing = Math.sin((o.t || 0) * .0016) * .10;
      ctx.fillStyle = P.cloth;
      if (of.open) {
        /* 敞开：左右两片各自垂下，中间露出腿。
           连成一片的话，白大衣会变成连衣裙。 */
        [-1, 1].forEach(function (k) {
          var inner = S.hip.x + k * S.hipW * .30;
          ctx.beginPath();
          ctx.moveTo(S.hip.x + k * S.hipW, S.hip.y - .2);
          ctx.quadraticCurveTo(S.hip.x + k * (S.hipW * flare + .1), hemY - 1.2,
                               S.hip.x + k * S.hipW * flare + swing * k, hemY);
          ctx.quadraticCurveTo(inner + k * S.hipW * .5, hemY - .30, inner + swing * k * .6, hemY - .10);
          ctx.lineTo(inner, S.hip.y - .1);
          ctx.closePath();
          ctx.fill();
        });
      } else {
        ctx.beginPath();
        ctx.moveTo(S.hip.x - S.hipW, S.hip.y - .2);
        ctx.quadraticCurveTo(S.hip.x - S.hipW * flare - .1, hemY - 1.2,
                             S.hip.x - S.hipW * flare + swing, hemY);
        /* 下缘做出几道折角，直边会像塑料板 */
        ctx.quadraticCurveTo(S.hip.x - S.hipW * .5 + swing, hemY - .34, S.hip.x + swing * .5, hemY - .06);
        ctx.quadraticCurveTo(S.hip.x + S.hipW * .6 + swing, hemY - .30, S.hip.x + S.hipW * flare + swing, hemY);
        ctx.quadraticCurveTo(S.hip.x + S.hipW * flare + .1, hemY - 1.2,
                             S.hip.x + S.hipW, S.hip.y - .2);
        ctx.closePath();
        ctx.fill();
      }
      /* 下摆的背光侧 + 两道竖褶 */
      ctx.save(); ctx.clip();
      ctx.fillStyle = U.rgba(P.clothS1, .95);
      ctx.fillRect(bs > 0 ? S.hip.x + .1 : S.hip.x - 3.2, S.hip.y - .4, 3.1, hemY - S.hip.y + .6);
      if (lod >= 1) {
        ctx.fillStyle = U.rgba(P.clothS2, .5);
        [-.55, .30].forEach(function (fx2) {
          ink(ctx, [{ x: S.hip.x + fx2 * S.hipW, y: S.hip.y + .2 },
                    { x: S.hip.x + fx2 * S.hipW * 1.5 + swing * .6, y: (S.hip.y + hemY) / 2 },
                    { x: S.hip.x + fx2 * S.hipW * 2.0 + swing, y: hemY - .1 }],
              ctx.fillStyle, .18 * w, .30 * w, .5);
        });
      }
      ctx.restore();
    }

    /* 3. 外衣主体 */
    if (of.kind !== 'shroud') {
      ctx.save();
      A.torsoPath(ctx, S);
      ctx.clip();
      ctx.fillStyle = P.cloth;
      if (of.open) {
        /* 敞开：左右两片，中间留出内衬 */
        var gap = .34 * w;
        ctx.fillRect(S.shL.x - .4, S.shL.y - .2, (S.chest.x - gap) - (S.shL.x - .4), 12);
        ctx.fillRect(S.chest.x + gap, S.shR.y - .2, (S.shR.x + .4) - (S.chest.x + gap), 12);
      } else {
        ctx.fill();
      }
      /* 圆柱体积：一层横向渐变，两侧压暗、受光侧偏亮。
         赛璐璐的硬边影负责"形"，这一层负责"体积"——只有硬边影的话，
         躯干永远是一块贴纸。放在硬边影之前，让硬边影仍然是画面上最重的边界。 */
      if (lod >= 1) {
        var vgx = ctx.createLinearGradient(S.chest.x - S.shW, 0, S.chest.x + S.shW, 0);
        var lit = bs > 0 ? 0 : 1;              /* 受光侧与 bs 相反 */
        vgx.addColorStop(0, U.rgba(P.clothS2, lit ? .34 : .10));
        vgx.addColorStop(lit ? .34 : .66, U.rgba(P.clothLit, .16));
        vgx.addColorStop(1, U.rgba(P.clothS2, lit ? .10 : .34));
        ctx.fillStyle = vgx;
        ctx.fillRect(S.shL.x - .6, S.shL.y - .6, (S.shR.x - S.shL.x) + 1.2, S.crotch.y - S.shL.y + 1.4);
      }
      /* 背光侧一号影 */
      ctx.fillStyle = U.rgba(P.clothS1, .95);
      ctx.beginPath();
      ctx.moveTo(bs * 3, S.shL.y - .4);
      ctx.lineTo(bs * .30, S.shL.y - .4);
      ctx.bezierCurveTo(bs * .58, S.chest.y, bs * .82, S.waist.y, bs * .62, S.crotch.y + .4);
      ctx.lineTo(bs * 3, S.crotch.y + .4);
      ctx.closePath();
      ctx.fill();
      /* 胸腔下沿的一道硬影：宽而扁，贴着肋骨走，不能画成一个椭圆贴纸 */
      if (lod >= 1) {
        ctx.fillStyle = U.rgba(P.clothS2, .30);
        ctx.beginPath();
        ctx.moveTo(S.chest.x - S.chestW, S.chest.y + .30);
        ctx.quadraticCurveTo(S.chest.x, S.chest.y + .95, S.chest.x + S.chestW, S.chest.y + .30);
        ctx.quadraticCurveTo(S.chest.x, S.chest.y + .55, S.chest.x - S.chestW, S.chest.y + .30);
        ctx.closePath();
        ctx.fill();
      }
      /* 受光肩：只在肩头那一小块，顺着肩的圆。
         拉成一条从颈到腰的长带子会变成胸口一道白杠。 */
      if (lod >= 1) {
        ctx.fillStyle = U.rgba(P.clothLit, .30);
        var ls = -bs;
        ctx.beginPath();
        ctx.moveTo(S.neckBase.x + ls * .38, S.neckBase.y + .04);
        ctx.quadraticCurveTo(ls * S.shW * .74, S.shL.y - .06,
                             ls * S.shW * .92, S.shL.y + .46);
        ctx.quadraticCurveTo(ls * S.shW * .52, S.shL.y + .22,
                             S.neckBase.x + ls * .38, S.neckBase.y + .04);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    /* 4. 领 —— 由 A.figure 在画完颈之后再调，这里跳过 */
    if (!o.deferCollar) A.collar(ctx, ch, S, P, o, of);

    /* 5. 腰带 */
    if (of.belt) {
      ctx.fillStyle = P.clothLine;
      U.roundRect(ctx, S.waist.x - S.waistW * 1.02, S.waist.y + .30, S.waistW * 2.04, .40 * w, .12);
      ctx.fill();
      ctx.fillStyle = P.accent;
      U.roundRect(ctx, S.waist.x - .26 * w, S.waist.y + .34, .52 * w, .32 * w, .08);
      ctx.fill();
    }
    /* 6. 镶边（制服的一条竖线 + 肩章） */
    if (of.trim) {
      ctx.fillStyle = P.accent;
      ctx.fillRect(S.chest.x - .05 * w, S.shL.y + .30, .10 * w, S.crotch.y - S.shL.y - .3);
      [-1, 1].forEach(function (k) {
        U.roundRect(ctx, k * S.shW * .78 - .30 * w, S.shL.y + .10, .60 * w, .20 * w, .06);
        ctx.fill();
      });
    }
  };

  /* ---------- 领 ---------- */
  A.collar = function (ctx, ch, S, P, o, of) {
    var w = S.w || 1, nw = M.neckW * w;
    var y0 = S.neckBase.y;
    if (of.collar === 'none') return;
    if (of.collar === 'v' || of.open) {
      /* V 领 / 敞开的翻领：两片斜向下的三角 */
      ctx.fillStyle = P.clothS1;
      [-1, 1].forEach(function (k) {
        ctx.beginPath();
        ctx.moveTo(S.neck.x + k * nw * 1.15, y0 - .18);
        ctx.lineTo(S.neck.x + k * nw * 2.5, y0 + .30);
        ctx.lineTo(S.chest.x + k * .10, S.chest.y + .55);
        ctx.closePath();
        ctx.fill();
      });
    } else if (of.collar === 'stand') {
      /* 立领：绕颈一圈，前方开一个小口 */
      ctx.fillStyle = P.clothS1;
      ctx.beginPath();
      ctx.moveTo(S.neck.x - nw * 1.5, y0 + .22);
      ctx.quadraticCurveTo(S.neck.x - nw * 1.6, y0 - .56, S.neck.x - nw * .95, y0 - .62);
      ctx.lineTo(S.neck.x - nw * .55, y0 - .10);
      ctx.lineTo(S.neck.x + nw * .55, y0 - .10);
      ctx.lineTo(S.neck.x + nw * .95, y0 - .62);
      ctx.quadraticCurveTo(S.neck.x + nw * 1.6, y0 - .56, S.neck.x + nw * 1.5, y0 + .22);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = U.rgba(P.clothLit, .35);
      ctx.fillRect(S.neck.x - nw * 1.5, y0 + .10, nw * 3, .10);
    } else if (of.collar === 'hood') {
      /* 兜帽：堆在颈后的一圈，是主角的「缩着」的一部分 */
      ctx.fillStyle = P.clothS1;
      ctx.beginPath();
      ctx.moveTo(S.neck.x - nw * 2.3, y0 + .30);
      ctx.bezierCurveTo(S.neck.x - nw * 2.6, y0 - .95,
                        S.neck.x + nw * 2.6, y0 - .95,
                        S.neck.x + nw * 2.3, y0 + .30);
      ctx.quadraticCurveTo(S.neck.x, y0 + .02, S.neck.x - nw * 2.3, y0 + .30);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = U.rgba(P.clothS2, .55);
      ctx.beginPath();
      ctx.moveTo(S.neck.x - nw * 1.7, y0 + .06);
      ctx.quadraticCurveTo(S.neck.x, y0 - .34, S.neck.x + nw * 1.7, y0 + .06);
      ctx.quadraticCurveTo(S.neck.x, y0 - .10, S.neck.x - nw * 1.7, y0 + .06);
      ctx.closePath();
      ctx.fill();
    } else {
      /* 圆领：一条弧 */
      ctx.fillStyle = P.clothS1;
      ctx.beginPath();
      ctx.moveTo(S.neck.x - nw * 1.5, y0 + .10);
      ctx.quadraticCurveTo(S.neck.x, y0 + .70, S.neck.x + nw * 1.5, y0 + .10);
      ctx.quadraticCurveTo(S.neck.x, y0 + .40, S.neck.x - nw * 1.5, y0 + .10);
      ctx.closePath();
      ctx.fill();
    }
    /* 拉链 */
    if (of.zip && o.lod >= 1) {
      ctx.fillStyle = U.rgba(P.accent, .8);
      ctx.fillRect(S.chest.x - .045 * w, y0 + .30, .09 * w, S.crotch.y - y0 - .5);
    }
  };

  /* ---------- 手臂 ---------- */
  /* side: -1 画面左 / +1 右。far 表示这条臂在躯干之后。 */
  A.arm = function (ctx, ch, S, P, o, k, isFar) {
    var of = A.outfitOf(ch);
    var n = k < 0 ? 'L' : 'R';
    var w = S.w || 1;
    var root = S['shJ' + n], el = S['el' + n], wr = S['wr' + n];
    var sleeveEnd = of.sleeve;
    var cloth = isFar ? P.clothS1 : P.cloth;
    var skin = isFar ? P.skinS1 : P.skin;

    /* 三角肌：把手臂和躯干缝在一起的那一小块。
       它必须完全待在肩线以下——一旦鼓出肩线，所有人都会长出一对灯笼袖。 */
    ctx.fillStyle = cloth;
    ctx.beginPath();
    ctx.ellipse(root.x, root.y + .26, .30 * w, .36 * w, k * .18, 0, U.TAU);
    ctx.fill();

    if (sleeveEnd >= .95) {
      limb(ctx, root, el, wr, .60 * w, .44 * w, .32 * w, cloth);
      ctx.fillStyle = isFar ? P.clothS2 : P.clothS1;
      ctx.beginPath();
      ctx.ellipse(wr.x, wr.y, .30 * w, .15 * w,
                  Math.atan2(wr.y - el.y, wr.x - el.x) + U.PI / 2, 0, U.TAU);
      ctx.fill();
    } else {
      /* 短袖：先整条画皮肤，再把袖子盖回上臂 */
      limb(ctx, root, el, wr, .54 * w, .42 * w, .30 * w, skin);
      var cut = { x: U.lerp(root.x, el.x, .35 + sleeveEnd), y: U.lerp(root.y, el.y, .35 + sleeveEnd) };
      limb(ctx, root, { x: U.lerp(root.x, el.x, .55), y: U.lerp(root.y, el.y, .55) }, cut,
           .62 * w, .52 * w, .48 * w, cloth);
    }
    /* 手：这个尺度下必须够大才看得出是手，太小就成了两根火柴 */
    var dir = Math.atan2(wr.y - el.y, wr.x - el.x) - U.PI / 2;
    hand(ctx, wr, dir, .46 * w, skin, o.lod);
    /* 肩甲 */
    if (of.pauldron) {
      ctx.fillStyle = isFar ? U.celShadow(P.accent, .5) : P.accent;
      ctx.beginPath();
      ctx.ellipse(root.x + k * .06 * w, root.y - .04, .62 * w, .46 * w, k * .25, 0, U.TAU);
      ctx.fill();
      ctx.fillStyle = U.rgba(P.clothLine, .45);
      ctx.beginPath();
      ctx.ellipse(root.x + k * .06 * w, root.y + .18, .62 * w, .16 * w, k * .25, 0, U.TAU);
      ctx.fill();
    }
    /* 肘部的一道褶 */
    if (o.lod >= 2 && sleeveEnd >= .95) {
      ink(ctx, [{ x: el.x - k * .18 * w, y: el.y - .26 }, { x: el.x + k * .14 * w, y: el.y + .08 }],
          U.rgba(P.clothS2, .65), .12 * w, .05 * w, .4);
    }
  };

  /* ===========================================================
     整体装配
     图层顺序（决定「像不像画的」）：
       后发 → 远侧手臂 → 腿 → 躯干 → 颈 → 领 → 近侧手臂 → 脸 → 前发 → 配饰
     远侧手臂必须在躯干之后，否则两条手臂会和躯干交叉成一个 X。
     o 里除 skeleton 的姿态参数外，还接受 head 那一套表情参数。
     =========================================================== */
  A.figure = function (ctx, ch, P, o) {
    o = o || {};
    if (o.lod === undefined) o.lod = 2;
    if (o.turn === undefined) o.turn = .30;

    /* 逆光轮廓：先铺一层偏移的实心剪影，正常图层随后盖上去 */
    if (!o._isRim) {
      var rimP = o.rimPower === undefined ? .55 : o.rimPower;
      if (rimP > .01 && o.lod >= 1) {
        var bs = o.turn >= 0 ? -1 : 1;          /* 与 head/torso/hair 同一套光向 */
        var ro = {};
        for (var k in o) ro[k] = o[k];
        ro._isRim = true; ro.lod = 0; ro.deferCollar = false;
        ro.tears = 0; ro.sweat = 0; ro.blush = 0;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        /* 偏移要小、透明度要低、颜色要有色相。
           大偏移 + 高不透明 + 近白色 = 贴纸描边，不是光。 */
        ctx.globalAlpha = rimP * .42;
        ctx.translate(bs * .055, -.030);
        A.figure(ctx, ch, rimPalette(o.rimColor || P.rim || '#8fc4ff'), ro);
        ctx.restore();
      }
    }

    var S = A.skeleton(o);
    var far = U.sign(o.turn) || 1;
    o.deferCollar = true;

    if (o.clipY !== undefined) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(-8, -4, 16, o.clipY + 4);
      ctx.clip();
    }

    A.hairBack(ctx, ch, P, o);
    if (ch.cape) A.cape(ctx, ch, S, P, o);
    A.arm(ctx, ch, S, P, o, far, true);
    A.legs(ctx, ch, S, P, o);
    A.torso(ctx, ch, S, P, o);
    A.neck(ctx, ch, S, P, o);
    A.collar(ctx, ch, S, P, o, A.outfitOf(ch));
    A.arm(ctx, ch, S, P, o, -far, false);
    /* 头单独成组：歪头与呼吸的上下浮动只作用在头上，
       后发不跟着转（长发跟着头甩会像一块板子在摆）。原点就是头心。 */
    ctx.save();
    if (o.headDy) ctx.translate(0, o.headDy);
    if (o.headTilt) ctx.rotate(o.headTilt);
    A.head(ctx, ch, P, o);
    A.hairFront(ctx, ch, P, o);
    if (ch.goggles) A.goggles(ctx, ch, P, o);
    ctx.restore();

    if (o.clipY !== undefined) ctx.restore();
    return S;
  };

  /* 胸像：给对话框用。只是把全身裁到胸口，比例仍然一致。 */
  A.bust = function (ctx, ch, P, o) {
    o = o || {};
    o.clipY = o.clipY === undefined ? 3.30 : o.clipY;
    return A.figure(ctx, ch, P, o);
  };

  /* 披风 / 能量翼 */
  A.cape = function (ctx, ch, S, P, o) {
    var t = o.t || 0, w = S.w || 1;
    var ec = ch.capeEdge || P.accent;
    var amp = .22 + Math.sin(t * .0018) * .10;
    var bottom = S.crotch.y + 3.2;
    ctx.save();
    ctx.fillStyle = U.rgba(U.celShadow(P.cloth, .75), .92);
    ctx.beginPath();
    ctx.moveTo(S.shL.x + .10, S.shL.y - .10);
    ctx.bezierCurveTo(S.shL.x - 1.5, S.chest.y + 1.0,
                      S.shL.x - 2.1 + Math.sin(t * .0022) * amp * 3, bottom - 1.4,
                      S.shL.x - 1.6 + Math.sin(t * .0022) * amp * 4, bottom);
    /* 破碎的下缘 */
    for (var i = 0; i < 5; i++) {
      var f0 = i / 5, f1 = (i + .5) / 5, f2 = (i + 1) / 5;
      var xa = U.lerp(S.shL.x - 1.6, S.shR.x + 1.6, f0) + Math.sin(t * .0022) * amp * 4;
      var xb = U.lerp(S.shL.x - 1.6, S.shR.x + 1.6, f1) + Math.sin(t * .0022) * amp * 4;
      var xc = U.lerp(S.shL.x - 1.6, S.shR.x + 1.6, f2) + Math.sin(t * .0022) * amp * 4;
      ctx.quadraticCurveTo((xa + xb) / 2, bottom + .7, xb, bottom + .55);
      ctx.quadraticCurveTo((xb + xc) / 2, bottom - .25, xc, bottom);
    }
    ctx.bezierCurveTo(S.shR.x + 2.1 + Math.sin(t * .0022) * amp * 3, bottom - 1.4,
                      S.shR.x + 1.5, S.chest.y + 1.0,
                      S.shR.x - .10, S.shR.y - .10);
    ctx.closePath();
    ctx.fill();
    /* 边缘的一道亮线 */
    ctx.strokeStyle = U.rgba(ec, .55);
    ctx.lineWidth = .07;
    ctx.stroke();
    /* 能量翼 */
    if (ch.wings) {
      ctx.globalCompositeOperation = 'lighter';
      [-1, 1].forEach(function (k) {
        for (var j = 0; j < 5; j++) {
          var spread = 1.30 + j * .52, rise = .55 + j * .42;
          var ex = k * spread, ey = S.shL.y - rise - Math.sin(t * .0022) * .3 * (j / 4);
          var g = ctx.createLinearGradient(k * .7, S.shL.y, ex, ey);
          g.addColorStop(0, U.rgba(ec, .8));
          g.addColorStop(.5, U.rgba(ec, .32));
          g.addColorStop(1, U.rgba(ec, 0));
          ctx.strokeStyle = g;
          ctx.lineWidth = .30 - j * .04;
          ctx.beginPath();
          ctx.moveTo(k * .7, S.shL.y);
          ctx.quadraticCurveTo(k * spread * .55, S.shL.y + .7 + j * .2, ex, ey);
          ctx.stroke();
        }
      });
    }
    ctx.restore();
  };

  /* PLACEHOLDER_ANIME */

})(window);
