/* ===========================================================
   art.js — 程序化二次元场景绘制（无图片素材）
     · Art.scene(id)  地平线视角背景（地图 / 过场）
     · Art.field(id)  俯视卷轴弹幕战场
   技法：大色块渐变天空 + 梦幻光晕 + 蓬松动漫云（预渲染精灵）
         + 浮空岛剪影（三色阶 + 边缘光 + 霓虹窗）+ 体积光 + 尘埃
   静态层一次性烘进离屏画布，每帧只重绘云/光/粒子。
   =========================================================== */
(function (root) {
  'use strict';
  var G = root.G, U = G.U;
  var Art = G.Art = {};
  var W = 1280, H = 720;

  /* ============ 调色板定义 ============ */
  var DEFS = Art.DEFS = {
    /* 区域1 废弃机库/营地 — 暖黄 + 锈迹 */
    camp: {
      skyFix: [[0, '#241a2e'], [.28, '#6b3a3e'], [.55, '#c96a3c'], [.78, '#f0a05a'], [1, '#ffd9a0']],
      light: { x: .74, y: .30, r: 420, color: '#ffd9a0', power: .62 },
      cloudCols: ['#ffcf9a', '#ff9f66', '#a35a44', '#6b3644'],
      cloudBands: [
        { y: .30, n: 5, scale: 1.5, speed: .0035, alpha: .55, tint: 2 },
        { y: .44, n: 6, scale: 1.9, speed: .006, alpha: .7, tint: 1 },
        { y: .60, n: 5, scale: 2.5, speed: .011, alpha: .82, tint: 0 }
      ],
      islands: [
        { x: .12, y: .56, s: .55, depth: .35, style: 'rock', col: '#4a2c2e', top: '#7b4a3c', rim: '#ffc48a', build: 2, neon: '#ffb15e' },
        { x: .86, y: .50, s: .40, depth: .3, style: 'rock', col: '#3e2528', top: '#6b3f36', rim: '#ffb377', build: 1, neon: '#ff9f5e' },
        { x: .50, y: .63, s: .82, depth: .6, style: 'plate', col: '#2f1e22', top: '#5b3830', rim: '#ffd6a0', build: 3, neon: '#ffd479' }
      ],
      fog: '#3a2018', fogA: .55,
      motes: { color: '#ffcf8a', n: 46, speed: -.25 },
      rays: { color: '#ffd9a0', a: .12, from: [.74, .30] },
      grain: .5, vignette: .3, vigCol: '#20101a'
    },
    /* 区域2 浮空都市残骸 — 灰蓝 + 霓虹残光 */
    ruins: {
      skyFix: [[0, '#070c1c'], [.3, '#132444'], [.6, '#2b4a6e'], [.85, '#5b7fa0'], [1, '#8fb4c9']],
      light: { x: .28, y: .22, r: 360, color: '#9fd8ff', power: .4 },
      cloudCols: ['#c9dcea', '#8ba9c4', '#4a6482', '#2a3a52'],
      cloudBands: [
        { y: .34, n: 5, scale: 1.6, speed: .004, alpha: .5, tint: 2 },
        { y: .50, n: 6, scale: 2.1, speed: .008, alpha: .66, tint: 1 },
        { y: .66, n: 5, scale: 2.7, speed: .014, alpha: .8, tint: 0 }
      ],
      islands: [
        { x: .18, y: .52, s: .62, depth: .35, style: 'city', col: '#16233a', top: '#2c4260', rim: '#8fd4ff', build: 5, neon: '#4fd8ff', broken: 1 },
        { x: .72, y: .46, s: .48, depth: .28, style: 'city', col: '#121d30', top: '#25384f', rim: '#7ec4f0', build: 4, neon: '#ff5f9e', broken: 1 },
        { x: .45, y: .68, s: .95, depth: .62, style: 'city', col: '#0d1626', top: '#1d2d44', rim: '#a8e0ff', build: 7, neon: '#5ce1ff', broken: 1 }
      ],
      fog: '#16243c', fogA: .6,
      motes: { color: '#9fd8ff', n: 40, speed: -.2 },
      neonFlicker: 1,
      grain: .55, vignette: .34, vigCol: '#060c18'
    },
    /* 区域3 风暴云域 — 暗紫 + 闪电 */
    storm: {
      skyFix: [[0, '#0a0616'], [.3, '#241243'], [.58, '#3d1c5c'], [.82, '#5a2a6e'], [1, '#7b3f7a']],
      light: { x: .5, y: .18, r: 300, color: '#c9a8ff', power: .3 },
      cloudCols: ['#d9c4ff', '#9a76d0', '#5b3a86', '#2e1a4a'],
      cloudBands: [
        { y: .26, n: 6, scale: 2.0, speed: .012, alpha: .72, tint: 2 },
        { y: .44, n: 7, scale: 2.6, speed: .02, alpha: .85, tint: 1 },
        { y: .64, n: 6, scale: 3.2, speed: .03, alpha: .95, tint: 0 }
      ],
      islands: [
        { x: .22, y: .58, s: .5, depth: .4, style: 'rock', col: '#1b0f2e', top: '#33204a', rim: '#c9a8ff', build: 0 },
        { x: .80, y: .54, s: .42, depth: .34, style: 'rock', col: '#170d28', top: '#2c1c40', rim: '#b899ff', build: 0 }
      ],
      fog: '#1b0f2e', fogA: .7,
      motes: { color: '#c9a8ff', n: 60, speed: -.9 },
      lightning: 1, rain: 1,
      grain: .7, vignette: .42, vigCol: '#0a0616'
    },
    /* 区域4 机械工厂 — 铁灰 + 红光 */
    factory: {
      skyFix: [[0, '#0b0d10'], [.32, '#1d2228'], [.6, '#33383e'], [.85, '#4a4038'], [1, '#6b4a3a']],
      light: { x: .5, y: .74, r: 460, color: '#ff5a3c', power: .5 },
      cloudCols: ['#b9bec4', '#7d848c', '#4a5057', '#2a2e33'],
      cloudBands: [
        { y: .36, n: 4, scale: 1.7, speed: .003, alpha: .42, tint: 2 },
        { y: .52, n: 5, scale: 2.2, speed: .006, alpha: .6, tint: 1 }
      ],
      islands: [
        { x: .16, y: .50, s: .58, depth: .32, style: 'mech', col: '#171b1f', top: '#2b3238', rim: '#ff6a4a', build: 4, neon: '#ff3b2f' },
        { x: .84, y: .48, s: .52, depth: .3, style: 'mech', col: '#141719', top: '#262c31', rim: '#ff8a5a', build: 3, neon: '#ff5a3c' },
        { x: .5, y: .70, s: 1.0, depth: .6, style: 'mech', col: '#0f1214', top: '#20262b', rim: '#ff7a4a', build: 6, neon: '#ff3b2f' }
      ],
      fog: '#241a16', fogA: .62,
      motes: { color: '#ff8a5a', n: 54, speed: -.5, ember: 1 },
      redPulse: 1,
      grain: .8, vignette: .45, vigCol: '#100608'
    },
    /* 区域5 高空祭坛/神殿 — 暗绿 + 诡异静谧 */
    shrine: {
      skyFix: [[0, '#04100c'], [.32, '#0d2a20'], [.6, '#164034'], [.84, '#245c44'], [1, '#3f7a58']],
      light: { x: .5, y: .34, r: 380, color: '#a8ffd0', power: .34 },
      cloudCols: ['#c4f0d8', '#7ec4a0', '#3f7a60', '#1d4436'],
      cloudBands: [
        { y: .32, n: 5, scale: 1.7, speed: .0022, alpha: .48, tint: 2 },
        { y: .5, n: 5, scale: 2.3, speed: .0045, alpha: .62, tint: 1 },
        { y: .68, n: 4, scale: 2.9, speed: .008, alpha: .74, tint: 0 }
      ],
      islands: [
        { x: .5, y: .62, s: .9, depth: .55, style: 'temple', col: '#0c2018', top: '#1a3a2c', rim: '#a8ffd0', build: 3, neon: '#5fffb0' },
        { x: .15, y: .54, s: .44, depth: .3, style: 'temple', col: '#0a1a14', top: '#153025', rim: '#8fe0b8', build: 1, neon: '#4fe0a0' },
        { x: .87, y: .56, s: .4, depth: .28, style: 'temple', col: '#0a1a14', top: '#153025', rim: '#8fe0b8', build: 1, neon: '#4fe0a0' }
      ],
      fog: '#0c2018', fogA: .6,
      motes: { color: '#a8ffd0', n: 44, speed: -.16, slow: 1 },
      rays: { color: '#a8ffd0', a: .1, from: [.5, .34] },
      grain: .5, vignette: .4, vigCol: '#03100a'
    },
    /* 区域6 核心空域 — 血红 + 深紫 + 压迫感 */
    core: {
      skyFix: [[0, '#050107'], [.28, '#180310'], [.52, '#2e0616'], [.75, '#48091e'], [1, '#6a0f28']],
      light: { x: .5, y: .46, r: 520, color: '#ff3a5a', power: .34 },
      cloudCols: ['#c07084', '#8a2c44', '#4a0c20', '#240610'],
      cloudBands: [
        { y: .28, n: 6, scale: 1.9, speed: .006, alpha: .6, tint: 2 },
        { y: .46, n: 7, scale: 2.5, speed: .011, alpha: .78, tint: 1 },
        { y: .66, n: 6, scale: 3.1, speed: .018, alpha: .9, tint: 0 }
      ],
      islands: [
        { x: .5, y: .56, s: 1.15, depth: .5, style: 'throne', col: '#1a0410', top: '#3a0a20', rim: '#ff5a7a', build: 5, neon: '#ff2b4e' },
        { x: .14, y: .48, s: .46, depth: .3, style: 'rock', col: '#16040e', top: '#320818', rim: '#ff4a6a', build: 0 },
        { x: .88, y: .5, s: .42, depth: .28, style: 'rock', col: '#16040e', top: '#320818', rim: '#ff4a6a', build: 0 }
      ],
      fog: '#2a0414', fogA: .66,
      motes: { color: '#ff6a86', n: 62, speed: -.6, ember: 1 },
      redPulse: .7,
      dark: .56,
      grain: .75, vignette: .5, vigCol: '#0a0206'
    },
    /* 标题：梦幻黄昏浮空群岛 */
    title: {
      skyFix: [[0, '#0a0a22'], [.26, '#1e2560'], [.5, '#4a3a8a'], [.72, '#a05a9a'], [.88, '#ea8a7a'], [1, '#ffd0a0']],
      light: { x: .5, y: .70, r: 480, color: '#ffd0a0', power: .55 },
      cloudCols: ['#ffd8e8', '#c08ac0', '#6a4a90', '#32255a'],
      cloudBands: [
        { y: .30, n: 6, scale: 1.6, speed: .0028, alpha: .5, tint: 2 },
        { y: .46, n: 7, scale: 2.2, speed: .0055, alpha: .68, tint: 1 },
        { y: .64, n: 6, scale: 2.9, speed: .01, alpha: .82, tint: 0 }
      ],
      islands: [
        { x: .16, y: .52, s: .5, depth: .32, style: 'city', col: '#2a1c48', top: '#4a3470', rim: '#ffd0e8', build: 4, neon: '#8fd4ff' },
        { x: .82, y: .48, s: .44, depth: .28, style: 'city', col: '#241840', top: '#402c66', rim: '#ffc0d8', build: 3, neon: '#ff9fd0' },
        { x: .5, y: .70, s: 1.0, depth: .58, style: 'city', col: '#1c1435', top: '#382a5c', rim: '#ffd8f0', build: 6, neon: '#7fe0ff' }
      ],
      fog: '#2a1c48', fogA: .5,
      motes: { color: '#ffd8f0', n: 56, speed: -.22 },
      rays: { color: '#ffd0a0', a: .14, from: [.5, .70] },
      stars: 1,
      grain: .45, vignette: .32, vigCol: '#0a0a22'
    },
    /* 结局用：坠落中的世界 */
    fall: {
      skyFix: [[0, '#160408'], [.3, '#3a0a10'], [.6, '#6a1614'], [.85, '#a03a1c'], [1, '#d06a2a']],
      light: { x: .5, y: .8, r: 520, color: '#ff8a3c', power: .6 },
      cloudCols: ['#ffbf8a', '#e07a4a', '#8a3a24', '#4a1810'],
      cloudBands: [
        { y: .3, n: 6, scale: 2.1, speed: .009, alpha: .7, tint: 2 },
        { y: .5, n: 7, scale: 2.7, speed: .016, alpha: .85, tint: 1 }
      ],
      islands: [],
      fog: '#3a0a10', fogA: .7,
      motes: { color: '#ff8a4a', n: 70, speed: -.9, ember: 1 },
      redPulse: 1.2, grain: .8, vignette: .5, vigCol: '#0a0204'
    },
    /* 结局用：崭新的希望之城 */
    newcity: {
      skyFix: [[0, '#0e2a4a'], [.28, '#2a6a9a'], [.55, '#6ab0d0'], [.8, '#b0e0e8'], [1, '#ffe8c0']],
      light: { x: .62, y: .30, r: 420, color: '#fff0c8', power: .6 },
      cloudCols: ['#ffffff', '#d8f0ff', '#9fc8e0', '#6a9ab8'],
      cloudBands: [
        { y: .3, n: 5, scale: 1.5, speed: .0022, alpha: .55, tint: 0 },
        { y: .46, n: 6, scale: 2.0, speed: .004, alpha: .68, tint: 1 }
      ],
      islands: [
        { x: .5, y: .68, s: 1.0, depth: .55, style: 'plate', col: '#3a5a70', top: '#7aa8be', rim: '#ffffff', build: 6, neon: '#ffe8a0' },
        { x: .16, y: .54, s: .44, depth: .3, style: 'plate', col: '#345268', top: '#6d9cb2', rim: '#ffffff', build: 3, neon: '#ffe8a0' },
        { x: .85, y: .56, s: .4, depth: .28, style: 'plate', col: '#345268', top: '#6d9cb2', rim: '#ffffff', build: 3, neon: '#ffe8a0' }
      ],
      fog: '#8fc0d8', fogA: .4,
      motes: { color: '#ffffff', n: 50, speed: -.18 },
      rays: { color: '#fff0c8', a: .16, from: [.62, .30] },
      grain: .35, vignette: .22, vigCol: '#123048'
    },
    /* 结局用：星空 */
    starry: {
      skyFix: [[0, '#02030c'], [.4, '#081334'], [.72, '#122a58'], [1, '#26456e']],
      light: { x: .5, y: .9, r: 400, color: '#8fc0ff', power: .3 },
      cloudCols: ['#a8c8f0', '#5a7ab0', '#2a3a68', '#141e3a'],
      cloudBands: [{ y: .68, n: 5, scale: 2.4, speed: .0018, alpha: .5, tint: 1 }],
      islands: [],
      fog: '#081334', fogA: .5,
      motes: { color: '#dfe8ff', n: 30, speed: -.1 },
      stars: 2, grain: .4, vignette: .45, vigCol: '#01020a'
    },
    /* 结局用：地下空间（TY 最终结局） */
    underground: {
      skyFix: [[0, '#05070a'], [.5, '#0b1016'], [1, '#141a22']],
      light: { x: .5, y: .3, r: 260, color: '#7a8fa0', power: .3 },
      cloudCols: ['#3a4450', '#2a333c', '#1a2028', '#101418'],
      cloudBands: [],
      islands: [],
      fog: '#05070a', fogA: .4,
      motes: { color: '#8fa0b0', n: 22, speed: -.06, slow: 1 },
      dripLight: 1,
      grain: .7, vignette: .6, vigCol: '#000000'
    },
    /* 结局用：虚无 */
    voidw: {
      skyFix: [[0, '#f4f6f8'], [.5, '#e8ecf0'], [1, '#dde3e8']],
      light: { x: .5, y: .5, r: 500, color: '#ffffff', power: .5 },
      cloudCols: ['#ffffff', '#f0f2f5', '#e0e5ea', '#d0d6dc'],
      cloudBands: [{ y: .5, n: 4, scale: 2.6, speed: .001, alpha: .3, tint: 0 }],
      islands: [],
      fog: '#ffffff', fogA: .3,
      motes: { color: '#c8d0d8', n: 18, speed: -.05, slow: 1 },
      grain: .3, vignette: .1, vigCol: '#b0b8c0'
    },
    /* 结局用：灰白废土（坏结局E/A 的白骨场景） */
    bone: {
      skyFix: [[0, '#1a1a1c'], [.35, '#33343a'], [.68, '#55565e'], [1, '#7a7c84']],
      light: { x: .4, y: .35, r: 380, color: '#a8aab4', power: .35 },
      cloudCols: ['#c8cad2', '#8e9099', '#5a5c64', '#33343a'],
      cloudBands: [
        { y: .34, n: 5, scale: 1.8, speed: .0025, alpha: .5, tint: 2 },
        { y: .54, n: 5, scale: 2.4, speed: .005, alpha: .64, tint: 1 }
      ],
      islands: [{ x: .5, y: .68, s: .8, depth: .5, style: 'rock', col: '#2a2b30', top: '#494a52', rim: '#a8aab4', build: 0 }],
      fog: '#3a3b42', fogA: .6,
      motes: { color: '#b0b2ba', n: 30, speed: -.3 },
      grain: .8, vignette: .5, vigCol: '#0c0c0e'
    },
    /* 结局用：暴君秩序（坏结局D） */
    tyrant: {
      skyFix: [[0, '#06040e'], [.3, '#160a26'], [.6, '#2a0e3a'], [.85, '#4a1244'], [1, '#6a1a48']],
      light: { x: .5, y: .2, r: 300, color: '#b04a80', power: .3 },
      cloudCols: ['#d090b0', '#8a4a76', '#4a2048', '#220e28'],
      cloudBands: [
        { y: .3, n: 5, scale: 1.9, speed: .003, alpha: .55, tint: 2 },
        { y: .5, n: 5, scale: 2.5, speed: .006, alpha: .7, tint: 1 }
      ],
      islands: [{ x: .5, y: .64, s: 1.05, depth: .55, style: 'throne', col: '#140618', top: '#2e0c30', rim: '#c05a90', build: 5, neon: '#ff2b6e' }],
      fog: '#1a0820', fogA: .68,
      motes: { color: '#c05a90', n: 36, speed: -.2 },
      dark: .48,
      grain: .7, vignette: .55, vigCol: '#040208'
    }
  };

  /* ============ 云精灵 ============ */
  /* 蓬松动漫云：多圆叠加 + 上缘提亮 + 下缘压暗 */
  function cloudSprite(baseCol, lightCol, darkCol, seed, scale) {
    var rnd = U.rng(seed);
    var w = Math.round(260 * scale), h = Math.round(120 * scale);
    var c = U.canvas(w, h), x = c.getContext('2d');
    var lobes = [];
    var n = 6 + Math.floor(rnd() * 5);
    for (var i = 0; i < n; i++) {
      var t = i / (n - 1);
      var lx = w * (.14 + t * .72) + rnd.range(-w * .05, w * .05);
      var arch = Math.sin(t * Math.PI);
      var r = h * (.24 + arch * .3) * rnd.range(.85, 1.2);
      var ly = h * .70 - arch * h * .3 + rnd.range(-h * .05, h * .05);
      lobes.push({ x: lx, y: ly, r: r });
    }
    /* 底座 */
    lobes.push({ x: w * .5, y: h * .78, r: h * .3 });

    function blob(off, col, sc) {
      x.fillStyle = col;
      x.beginPath();
      for (var i = 0; i < lobes.length; i++) {
        var L = lobes[i];
        x.moveTo(L.x + L.r * sc, L.y + off);
        x.arc(L.x, L.y + off, L.r * sc, 0, U.TAU);
      }
      x.fill();
    }
    /* 暗层 */
    blob(h * .06, darkCol, 1.0);
    /* 主体 */
    blob(0, baseCol, .96);
    /* 上缘高光 */
    x.save();
    x.globalCompositeOperation = 'source-atop';
    var g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, U.rgba(lightCol, .95));
    g.addColorStop(.42, U.rgba(lightCol, .1));
    g.addColorStop(1, 'rgba(0,0,0,.28)');
    x.fillStyle = g;
    x.fillRect(0, 0, w, h);
    x.restore();
    /* 柔化边缘 */
    x.save();
    x.globalCompositeOperation = 'destination-in';
    var g2 = x.createRadialGradient(w / 2, h * .6, h * .1, w / 2, h * .6, w * .58);
    g2.addColorStop(0, 'rgba(0,0,0,1)');
    g2.addColorStop(.72, 'rgba(0,0,0,1)');
    g2.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g2;
    x.fillRect(0, 0, w, h);
    x.restore();
    return c;
  }
  Art.cloudSprite = cloudSprite;

  /* ============ 浮空岛精灵 ============ */
  function islandSprite(def, seed) {
    var rnd = U.rng(seed);
    var s = def.s;
    var w = Math.round(520 * s), h = Math.round(420 * s);
    var c = U.canvas(w, h), x = c.getContext('2d');
    var topY = h * .34, cx = w / 2;
    var topW = w * .82;

    /* --- 岩体（倒锥 + 锯齿） --- */
    x.beginPath();
    x.moveTo(cx - topW / 2, topY);
    x.lineTo(cx + topW / 2, topY);
    var steps = 9;
    for (var i = 0; i <= steps; i++) {
      var t = i / steps;
      var px = cx + topW / 2 - topW * t * .5 - (t * topW * .0);
      var spread = (1 - t);
      var xx = cx + (topW / 2) * spread * rnd.range(.75, 1.05) * (1 - t * .1);
      var yy = topY + (h - topY) * t;
      x.lineTo(cx + (xx - cx), yy);
    }
    for (var j = steps; j >= 0; j--) {
      var t2 = j / steps;
      var xx2 = cx - (topW / 2) * (1 - t2) * rnd.range(.75, 1.05);
      var yy2 = topY + (h - topY) * t2;
      x.lineTo(xx2, yy2);
    }
    x.closePath();
    var gr = x.createLinearGradient(0, topY, 0, h);
    gr.addColorStop(0, def.top);
    gr.addColorStop(.35, def.col);
    gr.addColorStop(1, U.shade(def.col, -.5));
    x.fillStyle = gr;
    x.fill();

    /* 岩体三色阶 */
    x.save();
    x.globalCompositeOperation = 'source-atop';
    x.fillStyle = U.rgba(U.shade(def.col, -.3), .5);
    x.beginPath();
    x.moveTo(cx + topW * .1, topY);
    x.lineTo(cx + topW / 2, topY);
    x.lineTo(cx + topW * .1, h);
    x.closePath(); x.fill();
    x.restore();

    /* --- 顶面 --- */
    x.beginPath();
    x.ellipse(cx, topY, topW / 2, h * .055, 0, 0, U.TAU);
    x.fillStyle = def.top;
    x.fill();
    x.strokeStyle = U.rgba(def.rim, .9);
    x.lineWidth = 2 * Math.max(.6, s);
    x.stroke();

    /* --- 建筑 --- */
    var nb = def.build || 0;
    for (var b = 0; b < nb; b++) {
      var bt = (b + .5) / nb;
      var bx = cx - topW * .38 + topW * .76 * bt + rnd.range(-10, 10) * s;
      var bw = w * rnd.range(.05, .11);
      var bh = h * rnd.range(.12, .30);
      var by = topY - bh;
      if (def.style === 'temple') {
        /* 神殿：柱 + 三角顶 */
        x.fillStyle = U.shade(def.top, .1);
        x.fillRect(bx - bw / 2, by, bw, bh);
        x.beginPath();
        x.moveTo(bx - bw * .75, by);
        x.lineTo(bx, by - bh * .3);
        x.lineTo(bx + bw * .75, by);
        x.closePath();
        x.fillStyle = U.shade(def.top, .22); x.fill();
        x.strokeStyle = U.rgba(def.rim, .7); x.lineWidth = 1.2; x.stroke();
      } else if (def.style === 'mech') {
        /* 工厂：管道 + 烟囱 */
        x.fillStyle = U.shade(def.top, -.1);
        x.fillRect(bx - bw / 2, by, bw, bh);
        x.fillStyle = U.shade(def.top, .16);
        x.fillRect(bx - bw * .18, by - bh * .34, bw * .36, bh * .34);
        x.strokeStyle = U.rgba(def.neon || def.rim, .8);
        x.lineWidth = 2;
        x.beginPath(); x.moveTo(bx - bw, by + bh * .4); x.lineTo(bx + bw, by + bh * .4); x.stroke();
      } else if (def.style === 'throne') {
        x.fillStyle = U.shade(def.top, -.05);
        x.beginPath();
        x.moveTo(bx - bw / 2, topY);
        x.lineTo(bx - bw * .3, by);
        x.lineTo(bx + bw * .3, by);
        x.lineTo(bx + bw / 2, topY);
        x.closePath(); x.fill();
        x.strokeStyle = U.rgba(def.neon || def.rim, .85); x.lineWidth = 1.5; x.stroke();
      } else {
        /* 城市塔楼 */
        x.fillStyle = U.shade(def.top, -.05);
        x.fillRect(bx - bw / 2, by, bw, bh);
        /* 断裂顶（残骸） */
        if (def.broken && rnd() < .55) {
          x.fillStyle = 'rgba(0,0,0,0)';
          x.save();
          x.globalCompositeOperation = 'destination-out';
          x.beginPath();
          x.moveTo(bx - bw / 2, by);
          x.lineTo(bx + bw / 2, by);
          x.lineTo(bx + bw / 2, by + bh * .12);
          x.lineTo(bx + bw * .1, by + bh * .04);
          x.lineTo(bx - bw * .2, by + bh * .16);
          x.lineTo(bx - bw / 2, by + bh * .06);
          x.closePath(); x.fill();
          x.restore();
        }
        /* 霓虹窗 */
        if (def.neon) {
          var rows = Math.floor(bh / (10 * s)) || 1;
          for (var r2 = 0; r2 < rows; r2++) {
            for (var cc = 0; cc < 2; cc++) {
              if (rnd() < .45) continue;
              x.fillStyle = U.rgba(def.neon, rnd.range(.35, .95));
              x.fillRect(bx - bw * .28 + cc * bw * .36, by + 6 * s + r2 * 10 * s, bw * .2, 3.5 * s);
            }
          }
        }
        x.strokeStyle = U.rgba(def.rim, .35); x.lineWidth = 1; x.strokeRect(bx - bw / 2, by, bw, bh);
      }
    }

    /* --- 顶缘边缘光 --- */
    x.save();
    x.globalCompositeOperation = 'lighter';
    var g3 = x.createLinearGradient(0, topY - 14, 0, topY + 10);
    g3.addColorStop(0, U.rgba(def.rim, 0));
    g3.addColorStop(.5, U.rgba(def.rim, .35));
    g3.addColorStop(1, U.rgba(def.rim, 0));
    x.fillStyle = g3;
    x.fillRect(0, topY - 14, w, 24);
    x.restore();

    /* --- 底部反重力光环 --- */
    x.save();
    x.globalCompositeOperation = 'lighter';
    var g4 = x.createRadialGradient(cx, h * .92, 2, cx, h * .92, w * .3);
    g4.addColorStop(0, U.rgba(def.neon || def.rim, .5));
    g4.addColorStop(1, U.rgba(def.neon || def.rim, 0));
    x.fillStyle = g4;
    x.fillRect(0, h * .6, w, h * .5);
    x.restore();
    return c;
  }
  Art.islandSprite = islandSprite;

  /* ============ 场景背景实例 ============ */
  function Scene(id) {
    var d = DEFS[id] || DEFS.title;
    this.id = id; this.d = d;
    this.t = 0;
    this.seed = 0;
    for (var i = 0; i < id.length; i++) this.seed = (this.seed * 31 + id.charCodeAt(i)) | 0;
    this.build();
  }
  Scene.prototype.build = function () {
    var d = this.d, self = this;
    var rnd = U.rng(this.seed);

    /* --- 静态层：天空 + 光源 + 星 + 远景雾 --- */
    var sc = U.canvas(W, H), sx = sc.getContext('2d');
    var g = sx.createLinearGradient(0, 0, 0, H);
    (d.skyFix || d.sky).forEach(function (s) { g.addColorStop(s[0], s[1]); });
    sx.fillStyle = g; sx.fillRect(0, 0, W, H);

    if (d.stars) {
      var sn = d.stars === 2 ? 260 : 120;
      for (var i = 0; i < sn; i++) {
        var y = rnd() * H * (d.stars === 2 ? .92 : .5);
        var a = rnd.range(.15, .95) * (1 - y / H * .5);
        var r = rnd.range(.5, d.stars === 2 ? 1.7 : 1.2);
        sx.fillStyle = 'rgba(255,255,255,' + a + ')';
        sx.beginPath(); sx.arc(rnd() * W, y, r, 0, U.TAU); sx.fill();
      }
    }
    /* 主光晕 */
    if (d.light) {
      var L = d.light;
      var lg = sx.createRadialGradient(W * L.x, H * L.y, 0, W * L.x, H * L.y, L.r);
      lg.addColorStop(0, U.rgba(L.color, L.power));
      lg.addColorStop(.28, U.rgba(L.color, L.power * .45));
      lg.addColorStop(.65, U.rgba(L.color, L.power * .12));
      lg.addColorStop(1, U.rgba(L.color, 0));
      sx.fillStyle = lg; sx.fillRect(0, 0, W, H);
      /* 光盘 */
      sx.fillStyle = U.rgba(U.shade(L.color, .5), .5);
      sx.beginPath(); sx.arc(W * L.x, H * L.y, L.r * .1, 0, U.TAU); sx.fill();
    }
    this.staticC = sc;

    /* --- 云 --- */
    this.clouds = [];
    var pal = d.cloudCols;
    (d.cloudBands || []).forEach(function (band, bi) {
      var sprites = [];
      for (var k = 0; k < 3; k++) {
        sprites.push(cloudSprite(pal[band.tint] || pal[1], pal[0], pal[3] || pal[2],
                                 self.seed + bi * 97 + k * 13, band.scale));
      }
      for (var n = 0; n < band.n; n++) {
        var sp = sprites[n % sprites.length];
        self.clouds.push({
          sp: sp, x: rnd() * (W + 600) - 300, y: H * band.y + rnd.range(-24, 24),
          sc: rnd.range(.8, 1.25), speed: band.speed * rnd.range(.8, 1.25),
          alpha: band.alpha * rnd.range(.8, 1.05), band: bi,
          bob: rnd() * U.TAU
        });
      }
    });
    this.clouds.sort(function (a, b) { return a.band - b.band; });

    /* --- 岛 --- */
    this.islands = [];
    (d.islands || []).forEach(function (idef, ii) {
      self.islands.push({
        sp: islandSprite(idef, self.seed + 500 + ii * 71),
        def: idef, bob: rnd() * U.TAU, x: idef.x, y: idef.y, depth: idef.depth
      });
    });

    /* --- 尘埃 --- */
    this.motes = [];
    if (d.motes) {
      for (var m = 0; m < d.motes.n; m++) {
        this.motes.push({
          x: rnd() * W, y: rnd() * H, r: rnd.range(.8, 2.6),
          v: rnd.range(.4, 1.5), ph: rnd() * U.TAU, a: rnd.range(.2, .8)
        });
      }
    }
    this.lightT = 0; this.nextLight = 1200 + Math.random() * 2600;
    /* 雨 */
    this.rain = [];
    if (d.rain) for (var q = 0; q < 140; q++) this.rain.push({ x: Math.random() * W, y: Math.random() * H, l: U.rand(14, 40), v: U.rand(9, 18) });
  };

  /* opt: {camX, camY} 视差偏移（地图滚动时用）；scale 云速倍率 */
  Scene.prototype.draw = function (ctx, dt, opt) {
    opt = opt || {};
    var d = this.d;
    this.t += dt || 0;
    var t = this.t;
    var camX = opt.camX || 0, camY = opt.camY || 0;

    /* 静态天空 */
    ctx.drawImage(this.staticC, -camX * .02, -camY * .02);

    /* 体积光 */
    if (d.rays) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      var fx = W * d.rays.from[0], fy = H * d.rays.from[1];
      for (var r = 0; r < 9; r++) {
        var a0 = (r / 9) * U.TAU + t * 0.00006;
        var spread = .07 + Math.sin(t * .0004 + r) * .03;
        ctx.fillStyle = U.rgba(d.rays.color, d.rays.a * (.4 + .6 * Math.abs(Math.sin(t * .0003 + r * 1.7))));
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(fx + Math.cos(a0 - spread) * 1500, fy + Math.sin(a0 - spread) * 1500);
        ctx.lineTo(fx + Math.cos(a0 + spread) * 1500, fy + Math.sin(a0 + spread) * 1500);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }

    /* 远景云（band 0,1）→ 岛 → 近景云（band 2） */
    this.drawClouds(ctx, dt, camX, 0, 1);
    this.drawIslands(ctx, camX, camY);
    this.drawClouds(ctx, dt, camX, 2, 9);

    /* 雾 */
    if (d.fog) {
      var fg = ctx.createLinearGradient(0, H * .55, 0, H);
      fg.addColorStop(0, U.rgba(d.fog, 0));
      fg.addColorStop(1, U.rgba(d.fog, d.fogA || .5));
      ctx.fillStyle = fg;
      ctx.fillRect(0, H * .55, W, H * .45);
    }

    /* 闪电 */
    if (d.lightning) {
      this.lightT += dt || 0;
      if (this.lightT > this.nextLight) {
        this.lightT = 0;
        this.nextLight = 1400 + Math.random() * 3400;
        this.flashT = 0; this.flashSeed = Math.random() * 1000;
        this.boltX = U.rand(150, W - 150);
        if (G.Aud && G.Aud.ready) {
          G.Aud.noise({ fc: 220, fc2: 60, q: .5, dur: 1.6, gain: .16 });
          G.Aud.tone({ wave: 'sine', f: 70, f2: 30, dur: 1.2, gain: .1, glideExp: true });
        }
      }
      if (this.flashT !== undefined && this.flashT < 420) {
        this.flashT += dt || 0;
        var fp = 1 - this.flashT / 420;
        ctx.save();
        ctx.globalAlpha = fp * .35 * (Math.random() * .5 + .5);
        ctx.fillStyle = '#e8dcff';
        ctx.fillRect(0, 0, W, H);
        /* 闪电分叉 */
        if (this.flashT < 180) {
          ctx.globalAlpha = fp;
          ctx.strokeStyle = '#f0e8ff';
          ctx.lineWidth = 2.6;
          var rr = U.rng(this.flashSeed | 0);
          var bx = this.boltX, by = 0;
          ctx.beginPath(); ctx.moveTo(bx, by);
          while (by < H * .62) {
            bx += rr.range(-46, 46); by += rr.range(24, 56);
            ctx.lineTo(bx, by);
          }
          ctx.stroke();
          ctx.lineWidth = 7; ctx.globalAlpha = fp * .25;
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    /* 雨 */
    if (d.rain) {
      ctx.save();
      ctx.strokeStyle = 'rgba(200,190,255,.32)';
      ctx.lineWidth = 1.3;
      for (var i = 0; i < this.rain.length; i++) {
        var p = this.rain[i];
        p.y += p.v * (dt || 16) / 16.67;
        p.x -= p.v * .3 * (dt || 16) / 16.67;
        if (p.y > H) { p.y = -30; p.x = Math.random() * (W + 200); }
        if (p.x < -40) p.x = W + 40;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.l * .3, p.y + p.l); ctx.stroke();
      }
      ctx.restore();
    }

    /* 红色脉冲（工厂/核心） */
    if (d.redPulse) {
      var pulse = (Math.sin(t * .0013) * .5 + .5) * d.redPulse;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      var pg = ctx.createRadialGradient(W / 2, H * .62, 40, W / 2, H * .62, W * .62);
      pg.addColorStop(0, 'rgba(255,50,60,' + (.10 * pulse) + ')');
      pg.addColorStop(1, 'rgba(255,20,40,0)');
      ctx.fillStyle = pg; ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    /* 地下滴水光 */
    if (d.dripLight) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      var flick = .55 + Math.random() * .12 + Math.sin(t * .004) * .1;
      var dg = ctx.createRadialGradient(W * .5, H * .16, 8, W * .5, H * .16, 320);
      dg.addColorStop(0, 'rgba(180,200,220,' + (.22 * flick) + ')');
      dg.addColorStop(1, 'rgba(120,150,180,0)');
      ctx.fillStyle = dg; ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    /* 尘埃 */
    if (d.motes) this.drawMotes(ctx, dt, d.motes);

    /* 暗角 */
    if (d.vignette) {
      var vg = ctx.createRadialGradient(W / 2, H * .5, H * .3, W / 2, H * .5, H * .85);
      vg.addColorStop(0, U.rgba(d.vigCol || '#000', 0));
      vg.addColorStop(1, U.rgba(d.vigCol || '#000', d.vignette));
      ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    }
  };

  Scene.prototype.drawClouds = function (ctx, dt, camX, bandLo, bandHi) {
    ctx.save();
    for (var i = 0; i < this.clouds.length; i++) {
      var c = this.clouds[i];
      if (c.band < bandLo || c.band > bandHi) continue;
      c.x += c.speed * (dt || 16) * (1 + c.band * .3);
      var wpx = c.sp.width * c.sc;
      if (c.x > W + 320) c.x = -wpx - 60;
      if (c.x < -wpx - 320) c.x = W + 60;
      var px = c.x - camX * (.06 + c.band * .05);
      var py = c.y + Math.sin(this.t * .0006 + c.bob) * 5;
      ctx.globalAlpha = c.alpha;
      ctx.drawImage(c.sp, px, py, wpx, c.sp.height * c.sc);
    }
    ctx.restore();
  };

  Scene.prototype.drawIslands = function (ctx, camX, camY) {
    var d = this.d;
    ctx.save();
    for (var i = 0; i < this.islands.length; i++) {
      var is = this.islands[i];
      var w = is.sp.width, h = is.sp.height;
      var px = W * is.x - w / 2 - camX * (.10 + is.depth * .12);
      var py = H * is.y - h * .5 + Math.sin(this.t * .0004 + is.bob) * 6 - camY * .03;
      /* 霓虹闪烁 */
      if (d.neonFlicker && Math.random() < .012) ctx.globalAlpha = .82;
      else ctx.globalAlpha = 1;
      ctx.drawImage(is.sp, px, py);
    }
    ctx.restore();
  };

  Scene.prototype.drawMotes = function (ctx, dt, cfg) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < this.motes.length; i++) {
      var m = this.motes[i];
      m.y += (cfg.speed || -.2) * m.v * (dt || 16) / 16.67;
      m.x += Math.sin(this.t * .001 + m.ph) * .22 * (cfg.slow ? .3 : 1);
      if (m.y < -10) { m.y = H + 10; m.x = Math.random() * W; }
      if (m.y > H + 10) { m.y = -10; m.x = Math.random() * W; }
      var a = m.a * (.55 + .45 * Math.sin(this.t * .002 + m.ph));
      if (cfg.ember) {
        ctx.fillStyle = U.rgba(cfg.color, a);
        ctx.fillRect(m.x, m.y, m.r, m.r * 2.4);
      } else {
        ctx.fillStyle = U.rgba(cfg.color, a * .5);
        ctx.beginPath(); ctx.arc(m.x, m.y, m.r * 2.4, 0, U.TAU); ctx.fill();
        ctx.fillStyle = U.rgba(cfg.color, a);
        ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, U.TAU); ctx.fill();
      }
    }
    ctx.restore();
  };

  var sceneCache = {};
  Art.scene = function (id) {
    if (!sceneCache[id]) sceneCache[id] = new Scene(id);
    return sceneCache[id];
  };
  Art.hasScene = function (id) { return !!DEFS[id]; };

  /* ============ 俯视卷轴战场 ============ */
  /* 从上往下飞行：云海向下滚动 + 岛顶掠过 + 能量网格 */
  function Field(id) {
    var d = DEFS[id] || DEFS.title;
    this.id = id; this.d = d;
    this.scroll = 0;
    this.t = 0;
    this.seed = 0;
    for (var i = 0; i < id.length; i++) this.seed = (this.seed * 37 + id.charCodeAt(i)) | 0;
    this.build();
  }
  Field.prototype.build = function () {
    var d = this.d, rnd = U.rng(this.seed + 7777);
    /* 底色 tile（垂直可循环） */
    var TH = 1440;
    var c = U.canvas(W, TH), x = c.getContext('2d');
    var pal = d.skyFix || d.sky;
    /* 取调色板中最饱和的几档，做成上下同色的循环渐变 */
    var deep = pal[1] ? pal[1][1] : pal[0][1];
    var mid = pal[Math.min(pal.length - 1, 2)][1];
    var bright = pal[pal.length - 1][1];
    var g = x.createLinearGradient(0, 0, 0, TH);
    g.addColorStop(0, deep);
    g.addColorStop(.22, mid);
    g.addColorStop(.44, U.mix(mid, bright, .45));
    g.addColorStop(.5, U.mix(mid, bright, .6));
    g.addColorStop(.56, U.mix(mid, bright, .45));
    g.addColorStop(.78, mid);
    g.addColorStop(1, deep);
    x.fillStyle = g; x.fillRect(0, 0, W, TH);

    /* 云海：大团斑 + 上下镜像补边保证无缝 */
    var cols = d.cloudCols;
    function blob(cx, cy, r, col, a) {
      var rg = x.createRadialGradient(cx, cy, 0, cx, cy, r);
      rg.addColorStop(0, U.rgba(col, a));
      rg.addColorStop(.55, U.rgba(col, a * .45));
      rg.addColorStop(1, U.rgba(col, 0));
      x.fillStyle = rg;
      x.fillRect(cx - r, cy - r, r * 2, r * 2);
    }
    for (var i = 0; i < 60; i++) {
      var cx = rnd() * W, cy = rnd() * TH;
      var r = rnd.range(110, 380);
      var col = cols[rnd.int(0, Math.min(2, cols.length - 1))];
      var a = rnd.range(.22, .55);
      blob(cx, cy, r, col, a);
      if (cy < r) blob(cx, cy + TH, r, col, a);
      if (cy > TH - r) blob(cx, cy - TH, r, col, a);
    }
    /* 气流带：横向亮条，强化速度感 */
    for (var k = 0; k < 26; k++) {
      var by = rnd() * TH;
      var bh = rnd.range(3, 16);
      var bg = x.createLinearGradient(0, by, W, by);
      var bc = cols[0];
      bg.addColorStop(0, U.rgba(bc, 0));
      bg.addColorStop(rnd.range(.2, .5), U.rgba(bc, rnd.range(.12, .3)));
      bg.addColorStop(1, U.rgba(bc, 0));
      x.fillStyle = bg;
      x.fillRect(0, by, W, bh);
    }
    /* 深色涡流（增加层次） */
    for (var q = 0; q < 18; q++) {
      var qx = rnd() * W, qy = rnd() * TH, qr = rnd.range(80, 240);
      blob(qx, qy, qr, cols[cols.length - 1], rnd.range(.2, .45));
      if (qy < qr) blob(qx, qy + TH, qr, cols[cols.length - 1], .3);
      if (qy > TH - qr) blob(qx, qy - TH, qr, cols[cols.length - 1], .3);
    }
    /* 霓虹信号：每个区域的标志色，让战场一眼可辨 */
    var neon = (d.islands && d.islands[0] && d.islands[0].neon) || (d.light && d.light.color) || cols[0];
    for (var n2 = 0; n2 < 34; n2++) {
      var nx = rnd() * W, ny = rnd() * TH;
      var nl = rnd.range(30, 140);
      x.save();
      x.globalCompositeOperation = 'lighter';
      var ng = x.createLinearGradient(nx, ny, nx, ny + nl);
      ng.addColorStop(0, U.rgba(neon, 0));
      ng.addColorStop(.5, U.rgba(neon, rnd.range(.25, .6)));
      ng.addColorStop(1, U.rgba(neon, 0));
      x.fillStyle = ng;
      x.fillRect(nx, ny, rnd.range(1.4, 3.2), nl);
      x.restore();
    }
    /* 少量亮点（远处灯火） */
    for (var s3 = 0; s3 < 90; s3++) {
      x.save();
      x.globalCompositeOperation = 'lighter';
      x.fillStyle = U.rgba(neon, rnd.range(.3, .9));
      var sr = rnd.range(.8, 2.2);
      x.beginPath(); x.arc(rnd() * W, rnd() * TH, sr, 0, U.TAU); x.fill();
      x.restore();
    }
    this.tile = c; this.tileH = TH;

    /* 掠过的岛顶（俯视：椭圆平台） */
    this.plates = [];
    for (var p = 0; p < 7; p++) {
      this.plates.push({
        x: rnd() * W, y: rnd() * (TH * 2), s: rnd.range(.5, 1.5),
        rot: rnd() * U.TAU, style: (d.islands && d.islands[0]) ? d.islands[0].style : 'rock',
        spd: rnd.range(.75, 1.35)
      });
    }
    this.plateSprite = this.makePlate(d);
    /* 速度线 */
    this.streaks = [];
    for (var s2 = 0; s2 < 30; s2++) this.streaks.push({ x: rnd() * W, y: rnd() * H, l: rnd.range(20, 90), v: rnd.range(3, 9), a: rnd.range(.06, .22) });
  };
  Field.prototype.makePlate = function (d) {
    var rnd = U.rng(this.seed + 31);
    var w = 420, h = 260;
    var c = U.canvas(w, h), x = c.getContext('2d');
    var col = (d.islands && d.islands[0]) ? d.islands[0] : { col: '#2a2a30', top: '#4a4a55', rim: '#9fd8ff', neon: '#5ce1ff' };
    /* 阴影 */
    x.fillStyle = 'rgba(0,0,0,.35)';
    x.beginPath(); x.ellipse(w / 2 + 12, h / 2 + 14, w * .42, h * .38, 0, 0, U.TAU); x.fill();
    /* 平台顶面 */
    x.beginPath(); x.ellipse(w / 2, h / 2, w * .42, h * .38, 0, 0, U.TAU);
    var g = x.createRadialGradient(w * .4, h * .38, 10, w / 2, h / 2, w * .45);
    g.addColorStop(0, U.shade(col.top, .18));
    g.addColorStop(1, col.col);
    x.fillStyle = g; x.fill();
    x.strokeStyle = U.rgba(col.rim, .34); x.lineWidth = 1.6; x.stroke();
    /* 结构线：只留几条极淡的，太亮会被误读成弹幕预警 */
    x.strokeStyle = U.rgba(col.rim, .09); x.lineWidth = 1;
    for (var i = 0; i < 3; i++) {
      var a = i / 3 * Math.PI;
      x.beginPath();
      x.moveTo(w / 2 - Math.cos(a) * w * .4, h / 2 - Math.sin(a) * h * .36);
      x.lineTo(w / 2 + Math.cos(a) * w * .4, h / 2 + Math.sin(a) * h * .36);
      x.stroke();
    }
    /* 建筑俯视块 */
    for (var b = 0; b < 7; b++) {
      var bx = w / 2 + rnd.range(-w * .3, w * .3);
      var by = h / 2 + rnd.range(-h * .24, h * .24);
      var bw = rnd.range(16, 42), bh = rnd.range(14, 34);
      x.fillStyle = U.rgba(U.shade(col.top, .1), .95);
      x.fillRect(bx - bw / 2, by - bh / 2, bw, bh);
      x.fillStyle = 'rgba(0,0,0,.3)';
      x.fillRect(bx - bw / 2 + 3, by - bh / 2 + 3, bw, bh);
      x.fillStyle = U.rgba(col.neon || col.rim, rnd.range(.4, .9));
      x.fillRect(bx - bw / 2 + 2, by - bh / 2 + 2, bw - 4, 2.5);
    }
    return c;
  };
  Field.prototype.draw = function (ctx, dt, speed) {
    speed = speed === undefined ? 1 : speed;
    this.t += dt || 0;
    this.scroll += (dt || 16) * 0.12 * speed;
    var TH = this.tileH;
    var off = this.scroll % TH;
    ctx.drawImage(this.tile, 0, off - TH);
    ctx.drawImage(this.tile, 0, off);

    /* 平台 */
    var sp = this.plateSprite;
    for (var i = 0; i < this.plates.length; i++) {
      var p = this.plates[i];
      var py = ((p.y + this.scroll * p.spd * .55) % (TH * 2)) - 300;
      ctx.save();
      ctx.globalAlpha = .62;
      ctx.translate(p.x, py);
      ctx.rotate(p.rot);
      ctx.scale(p.s, p.s);
      ctx.drawImage(sp, -sp.width / 2, -sp.height / 2);
      ctx.restore();
    }
    /* 速度线 */
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    for (var s = 0; s < this.streaks.length; s++) {
      var st = this.streaks[s];
      st.y += st.v * speed * (dt || 16) / 16.67;
      if (st.y > H + 50) { st.y = -60; st.x = Math.random() * W; }
      ctx.globalAlpha = st.a;
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(st.x, st.y); ctx.lineTo(st.x, st.y + st.l); ctx.stroke();
    }
    ctx.restore();

    /* 压暗背景：让暖色敌弹与冷色己弹都能从底色里跳出来。
       暖色系战场（核心/暴君）压得更狠，否则红弹沉进红底看不见。
       这一层必须压在浮空岛之上 —— 岛顶那圈亮边如果不压暗，
       在弹幕里看起来就像一个巨大的攻击预警圈。 */
    ctx.save();
    ctx.fillStyle = 'rgba(5,7,14,' + (this.d.dark === undefined ? .34 : this.d.dark) + ')';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    /* 氛围叠加 */
    var d = this.d;
    /* 区域主光色的整体色调（强化辨识度） */
    if (d.light) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      var lg = ctx.createRadialGradient(W * .5, H * .3, 40, W * .5, H * .3, W * .85);
      lg.addColorStop(0, U.rgba(d.light.color, .13 * d.light.power));
      lg.addColorStop(1, U.rgba(d.light.color, 0));
      ctx.fillStyle = lg;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
    if (d.amb || d.fog) {
      ctx.save();
      ctx.globalAlpha = .16;
      ctx.fillStyle = d.fog || '#000';
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
    if (d.redPulse) {
      var pulse = (Math.sin(this.t * .0016) * .5 + .5) * d.redPulse;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      var pg = ctx.createRadialGradient(W / 2, H / 2, 60, W / 2, H / 2, W * .7);
      pg.addColorStop(0, 'rgba(255,40,60,' + (.09 * pulse) + ')');
      pg.addColorStop(1, 'rgba(255,20,40,0)');
      ctx.fillStyle = pg; ctx.fillRect(0, 0, W, H); ctx.restore();
    }
    /* 暗角 */
    var vg = ctx.createRadialGradient(W / 2, H / 2, H * .34, W / 2, H / 2, H * .92);
    vg.addColorStop(0, U.rgba(d.vigCol || '#000', 0));
    vg.addColorStop(1, U.rgba(d.vigCol || '#000', (d.vignette || .3) * 1.1));
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  };

  var fieldCache = {};
  Art.field = function (id) {
    if (!fieldCache[id]) fieldCache[id] = new Field(id);
    return fieldCache[id];
  };

  /* ============ 通用小绘制件（过场/结局复用） ============ */
  /* 坠落的浮空都市剪影 */
  Art.fallingCity = function (ctx, x, y, s, p, col, neon) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(p * 0.5);
    ctx.scale(s, s);
    ctx.globalAlpha = 1;
    /* 岩体 */
    ctx.fillStyle = col || '#1a1418';
    ctx.beginPath();
    ctx.moveTo(-60, -14); ctx.lineTo(60, -14);
    ctx.lineTo(40, 40); ctx.lineTo(6, 74); ctx.lineTo(-26, 36); ctx.lineTo(-56, 20);
    ctx.closePath(); ctx.fill();
    /* 顶面 */
    ctx.fillStyle = U.shade(col || '#1a1418', .28);
    ctx.beginPath(); ctx.ellipse(0, -14, 60, 9, 0, 0, U.TAU); ctx.fill();
    /* 楼 */
    for (var i = 0; i < 5; i++) {
      var bx = -42 + i * 21, bh = 16 + (i % 3) * 13;
      ctx.fillStyle = U.shade(col || '#1a1418', .16);
      ctx.fillRect(bx, -14 - bh, 12, bh);
      ctx.fillStyle = U.rgba(neon || '#ff7a4a', .8 * (1 - p * .8));
      ctx.fillRect(bx + 2, -12 - bh, 8, 2);
    }
    /* 火焰拖尾 */
    ctx.globalCompositeOperation = 'lighter';
    var g = ctx.createLinearGradient(0, 40, 0, 200);
    g.addColorStop(0, 'rgba(255,150,60,.6)');
    g.addColorStop(1, 'rgba(255,60,30,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(-24, 40); ctx.lineTo(24, 40); ctx.lineTo(8, 210); ctx.lineTo(-10, 210); ctx.closePath(); ctx.fill();
    ctx.restore();
  };

  /* 白骨（坏结局A/E） */
  Art.bones = function (ctx, x, y, s, col) {
    ctx.save();
    ctx.translate(x, y); ctx.scale(s, s);
    ctx.strokeStyle = col || '#d8d4cc';
    ctx.fillStyle = col || '#d8d4cc';
    ctx.lineWidth = 4; ctx.lineCap = 'round';
    /* 头骨 */
    ctx.beginPath(); ctx.arc(0, -30, 13, 0, U.TAU); ctx.fill();
    ctx.fillStyle = 'rgba(20,20,24,.85)';
    ctx.beginPath(); ctx.arc(-5, -32, 3.4, 0, U.TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(5, -32, 3.4, 0, U.TAU); ctx.fill();
    ctx.fillStyle = col || '#d8d4cc';
    /* 脊 + 肋 */
    ctx.beginPath(); ctx.moveTo(0, -17); ctx.lineTo(0, 20); ctx.stroke();
    for (var i = 0; i < 4; i++) {
      var yy = -10 + i * 8;
      ctx.beginPath();
      ctx.moveTo(0, yy);
      ctx.quadraticCurveTo(13, yy + 3, 10, yy + 9);
      ctx.moveTo(0, yy);
      ctx.quadraticCurveTo(-13, yy + 3, -10, yy + 9);
      ctx.stroke();
    }
    /* 四肢 */
    ctx.beginPath();
    ctx.moveTo(0, -12); ctx.lineTo(-18, 4);
    ctx.moveTo(0, -12); ctx.lineTo(19, 2);
    ctx.moveTo(0, 20); ctx.lineTo(-12, 44);
    ctx.moveTo(0, 20); ctx.lineTo(13, 44);
    ctx.stroke();
    ctx.restore();
  };

  /* 锈迹战机骨架 */
  Art.wreckPlane = function (ctx, x, y, s, col) {
    ctx.save();
    ctx.translate(x, y); ctx.scale(s, s);
    ctx.strokeStyle = col || '#6a5c50';
    ctx.fillStyle = U.rgba(col || '#6a5c50', .35);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-60, 0); ctx.lineTo(-20, -10); ctx.lineTo(40, -6); ctx.lineTo(58, 0);
    ctx.lineTo(40, 8); ctx.lineTo(-20, 10); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-6, -8); ctx.lineTo(-30, -40); ctx.lineTo(-14, -8);
    ctx.moveTo(-6, 8); ctx.lineTo(-34, 34); ctx.lineTo(-14, 8);
    ctx.stroke();
    /* 破洞 */
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath(); ctx.arc(12, 0, 7, 0, U.TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(-30, -2, 4, 0, U.TAU); ctx.fill();
    ctx.restore();
  };

  /* 星星（彩蛋结局：每颗对应一个角色） */
  Art.star = function (ctx, x, y, r, col, twinkle) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    var g = G.Fx ? G.Fx.glowSprite(col) : null;
    var a = twinkle === undefined ? 1 : twinkle;
    if (g) {
      var s = r * 14;
      ctx.globalAlpha = .8 * a;
      ctx.drawImage(g, x - s / 2, y - s / 2, s, s);
    }
    ctx.globalAlpha = a;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x, y, r, 0, U.TAU); ctx.fill();
    /* 十字光芒 */
    ctx.strokeStyle = U.rgba(col, .9 * a);
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x - r * 5, y); ctx.lineTo(x + r * 5, y);
    ctx.moveTo(x, y - r * 5); ctx.lineTo(x, y + r * 5);
    ctx.stroke();
    ctx.restore();
  };

})(window);
