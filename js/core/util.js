/* ===========================================================
   util.js — 基础工具：数学、随机、颜色、几何、对象池
   全局命名空间：window.G
   =========================================================== */
(function (root) {
  'use strict';
  var G = root.G = root.G || {};

  var U = G.U = {};

  /* ---------- 数学 ---------- */
  U.PI = Math.PI;
  U.TAU = Math.PI * 2;
  U.D2R = Math.PI / 180;
  U.R2D = 180 / Math.PI;

  U.clamp = function (v, a, b) { return v < a ? a : (v > b ? b : v); };
  U.clamp01 = function (v) { return v < 0 ? 0 : (v > 1 ? 1 : v); };
  U.lerp = function (a, b, t) { return a + (b - a) * t; };
  U.unlerp = function (a, b, v) { return b === a ? 0 : (v - a) / (b - a); };
  U.remap = function (v, a, b, c, d) { return U.lerp(c, d, U.clamp01(U.unlerp(a, b, v))); };
  U.smoothstep = function (t) { t = U.clamp01(t); return t * t * (3 - 2 * t); };
  U.smootherstep = function (t) { t = U.clamp01(t); return t * t * t * (t * (t * 6 - 15) + 10); };
  U.sign = function (v) { return v < 0 ? -1 : (v > 0 ? 1 : 0); };
  U.approach = function (cur, target, step) {
    if (cur < target) return Math.min(cur + step, target);
    if (cur > target) return Math.max(cur - step, target);
    return target;
  };
  /* 帧率无关的指数平滑：t 为「每秒收敛比例」 */
  U.damp = function (cur, target, rate, dt) {
    return target + (cur - target) * Math.exp(-rate * dt);
  };

  /* ---------- 角度 ---------- */
  U.normAngle = function (a) {
    while (a > Math.PI) a -= U.TAU;
    while (a < -Math.PI) a += U.TAU;
    return a;
  };
  U.angleTo = function (x1, y1, x2, y2) { return Math.atan2(y2 - y1, x2 - x1); };
  U.angleLerp = function (a, b, t) { return a + U.normAngle(b - a) * t; };

  /* ---------- 距离 / 碰撞 ---------- */
  U.dist = function (x1, y1, x2, y2) { var dx = x2 - x1, dy = y2 - y1; return Math.sqrt(dx * dx + dy * dy); };
  U.dist2 = function (x1, y1, x2, y2) { var dx = x2 - x1, dy = y2 - y1; return dx * dx + dy * dy; };
  U.circleHit = function (x1, y1, r1, x2, y2, r2) {
    var dx = x2 - x1, dy = y2 - y1, r = r1 + r2;
    return dx * dx + dy * dy <= r * r;
  };
  U.pointInRect = function (px, py, x, y, w, h) {
    return px >= x && px <= x + w && py >= y && py <= y + h;
  };
  U.rectOverlap = function (a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  };
  /* 圆 vs AABB 最近点距离 */
  U.circleRect = function (cx, cy, r, x, y, w, h) {
    var nx = U.clamp(cx, x, x + w), ny = U.clamp(cy, y, y + h);
    var dx = cx - nx, dy = cy - ny;
    return dx * dx + dy * dy <= r * r;
  };

  /* ---------- 随机 ---------- */
  /* mulberry32 — 可复现的种子随机 */
  U.rng = function (seed) {
    var s = (seed | 0) || 1;
    var f = function () {
      s |= 0; s = s + 0x6D2B79F5 | 0;
      var t = Math.imul(s ^ s >>> 15, 1 | s);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
    f.range = function (a, b) { return a + f() * (b - a); };
    f.int = function (a, b) { return Math.floor(a + f() * (b - a + 1)); };
    f.pick = function (arr) { return arr[Math.floor(f() * arr.length)]; };
    f.sign = function () { return f() < 0.5 ? -1 : 1; };
    f.chance = function (p) { return f() < p; };
    return f;
  };
  U.rand = function (a, b) {
    if (a === undefined) return Math.random();
    if (b === undefined) return Math.random() * a;
    return a + Math.random() * (b - a);
  };
  U.randInt = function (a, b) { return Math.floor(a + Math.random() * (b - a + 1)); };
  U.pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };
  U.chance = function (p) { return Math.random() < p; };
  U.randSign = function () { return Math.random() < 0.5 ? -1 : 1; };
  U.shuffle = function (arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  };

  /* 平滑噪声（1D，用于云层/呼吸抖动） */
  U.noise1 = (function () {
    var p = [];
    for (var i = 0; i < 256; i++) p[i] = Math.random();
    return function (x) {
      var xi = Math.floor(x), f = x - xi;
      var a = p[(xi) & 255], b = p[(xi + 1) & 255];
      var t = f * f * (3 - 2 * f);
      return a + (b - a) * t;
    };
  })();

  /* ---------- 颜色 ---------- */
  U.hexToRgb = function (hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    var n = parseInt(hex, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  };
  U.rgbToHex = function (r, g, b) {
    var h = function (v) { v = U.clamp(Math.round(v), 0, 255).toString(16); return v.length < 2 ? '0' + v : v; };
    return '#' + h(r) + h(g) + h(b);
  };
  /* 感知亮度 0..1（Rec.601），用来决定该垫暗晕还是亮边 */
  U.lum = function (hex) {
    var c = U.hexToRgb(hex);
    return (c.r * .299 + c.g * .587 + c.b * .114) / 255;
  };
  U.rgba = function (hex, a) {
    var c = U.hexToRgb(hex);
    return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + a + ')';
  };
  /* 颜色混合：t=0 → c1, t=1 → c2 */
  U.mix = function (c1, c2, t) {
    var a = U.hexToRgb(c1), b = U.hexToRgb(c2);
    return U.rgbToHex(U.lerp(a.r, b.r, t), U.lerp(a.g, b.g, t), U.lerp(a.b, b.b, t));
  };
  /* 明暗：amt>0 变亮，amt<0 变暗 */
  U.shade = function (hex, amt) {
    var c = U.hexToRgb(hex);
    if (amt >= 0) return U.rgbToHex(U.lerp(c.r, 255, amt), U.lerp(c.g, 255, amt), U.lerp(c.b, 255, amt));
    return U.rgbToHex(c.r * (1 + amt), c.g * (1 + amt), c.b * (1 + amt));
  };
  /* 饱和度 / 去色（麻木、死亡演出用） */
  U.desat = function (hex, amt) {
    var c = U.hexToRgb(hex);
    var l = c.r * 0.299 + c.g * 0.587 + c.b * 0.114;
    return U.rgbToHex(U.lerp(c.r, l, amt), U.lerp(c.g, l, amt), U.lerp(c.b, l, amt));
  };
  U.hsl = function (h, s, l, a) {
    return 'hsla(' + (h % 360) + ',' + (s * 100) + '%,' + (l * 100) + '%,' + (a === undefined ? 1 : a) + ')';
  };

  /* ---------- HSL 互转（赛璐璐上色需要按色相偏移，不能只做明暗） ---------- */
  /* 返回 {h:0..360, s:0..1, l:0..1} */
  U.hexToHsl = function (hex) {
    var c = U.hexToRgb(hex);
    var r = c.r / 255, g = c.g / 255, b = c.b / 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    var l = (mx + mn) / 2, h = 0, s = 0;
    var d = mx - mn;
    if (d > 1e-6) {
      s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
      if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0));
      else if (mx === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    return { h: h, s: s, l: l };
  };
  U.hslToHex = function (h, s, l) {
    h = ((h % 360) + 360) % 360 / 360;
    s = U.clamp01(s); l = U.clamp01(l);
    if (s < 1e-6) { var v = l * 255; return U.rgbToHex(v, v, v); }
    var q = l < .5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    var f = function (t) {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    return U.rgbToHex(f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255);
  };
  /* 在 HSL 空间上做增量调整；h 为角度增量，s/l 为加法增量 */
  U.hslAdj = function (hex, dh, ds, dl) {
    var c = U.hexToHsl(hex);
    return U.hslToHex(c.h + (dh || 0), c.s + (ds || 0), c.l + (dl || 0));
  };
  U.sat = function (hex, amt) { return U.hslAdj(hex, 0, amt, 0); };

  /* 色相最短路径差（度），结果落在 -180..180 */
  U.hueDelta = function (from, to) {
    var d = (to - from) % 360;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    return d;
  };

  /* 赛璐璐阴影色：明度下降 + 色相往紫罗兰(275°)偏 + 饱和度按剩余空间上推。
     三条规则缺一不可：
       只降明度 → 发灰的脏色；
       直接加饱和 → 已经很艳的主色会爆成荧光；
       不偏色相 → 阴影不透气，像蒙了层黑纱。
     amt 约 0.5 为一号影，0.85 为二号影。 */
  U.celShadow = function (hex, amt) {
    amt = amt === undefined ? .5 : amt;
    var c = U.hexToHsl(hex);
    var dh = U.hueDelta(c.h, 265) * (.05 + .08 * amt);
    /* 饱和度朝 0.40 这条中线收敛：淡色在阴影里变得更有颜色，
       本来就很艳的色（皮肤、纯红）则必须降饱和，否则阴影会烧成荧光。 */
    var ds = (.40 - c.s) * (.35 + .30 * amt);
    /* 明度下降取「等量下降」与「按比例下降」中较温和的那个：
       亮色需要固定跌幅才看得出影子，暗色若也固定跌幅会直接压成纯黑丢掉所有结构。 */
    var nl = Math.max(c.l * (1 - (.20 + .28 * amt)), c.l - (.085 + .115 * amt));
    return U.hslToHex(c.h + dh, U.clamp01(c.s + ds), U.clamp01(nl));
  };
  /* 赛璐璐受光色：明度上升 + 色相往暖黄(48°)偏 + 饱和度按比例回落 */
  U.celLight = function (hex, amt) {
    amt = amt === undefined ? .5 : amt;
    var c = U.hexToHsl(hex);
    var dh = U.hueDelta(c.h, 48) * (.04 + .06 * amt);
    var ds = -c.s * (.08 + .12 * amt);
    var dl = (.06 + .11 * amt);
    return U.hslToHex(c.h + dh, U.clamp01(c.s + ds), U.clamp01(c.l + dl));
  };
  /* 线稿色：保留色相的深色，绝不用纯黑（纯黑会把二次元画成简笔画）。
     amt=1 为最实的轮廓线，0.4 左右适合脸上的内部结构线。 */
  U.celLine = function (hex, amt) {
    amt = amt === undefined ? 1 : amt;
    var c = U.hexToHsl(hex);
    var dh = U.hueDelta(c.h, 275) * .16;
    return U.hslToHex(
      c.h + dh,
      U.clamp01(c.s * .70 + .12),
      U.clamp01(Math.max(.10, c.l * (1 - .55 * amt) - .04 * amt))
    );
  };

  /* ---------- 缓动 ---------- */
  var E = U.ease = {
    linear: function (t) { return t; },
    inQuad: function (t) { return t * t; },
    outQuad: function (t) { return t * (2 - t); },
    inOutQuad: function (t) { return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t; },
    inCubic: function (t) { return t * t * t; },
    outCubic: function (t) { return (--t) * t * t + 1; },
    inOutCubic: function (t) { return t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1; },
    inQuart: function (t) { return t * t * t * t; },
    outQuart: function (t) { return 1 - (--t) * t * t * t; },
    inOutQuart: function (t) { return t < .5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t; },
    inQuint: function (t) { return t * t * t * t * t; },
    outQuint: function (t) { return 1 + (--t) * t * t * t * t; },
    inSine: function (t) { return 1 - Math.cos(t * Math.PI / 2); },
    outSine: function (t) { return Math.sin(t * Math.PI / 2); },
    inOutSine: function (t) { return -(Math.cos(Math.PI * t) - 1) / 2; },
    inExpo: function (t) { return t === 0 ? 0 : Math.pow(2, 10 * t - 10); },
    outExpo: function (t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); },
    inOutExpo: function (t) {
      if (t === 0 || t === 1) return t;
      return t < .5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2;
    },
    inCirc: function (t) { return 1 - Math.sqrt(1 - t * t); },
    outCirc: function (t) { return Math.sqrt(1 - (--t) * t); },
    inBack: function (t) { return 2.70158 * t * t * t - 1.70158 * t * t; },
    outBack: function (t) { return 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2); },
    inOutBack: function (t) {
      var c = 1.70158 * 1.525;
      return t < .5 ? (Math.pow(2 * t, 2) * ((c + 1) * 2 * t - c)) / 2
        : (Math.pow(2 * t - 2, 2) * ((c + 1) * (t * 2 - 2) + c) + 2) / 2;
    },
    outElastic: function (t) {
      if (t === 0 || t === 1) return t;
      return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (U.TAU / 3)) + 1;
    },
    outBounce: function (t) {
      var n = 7.5625, d = 2.75;
      if (t < 1 / d) return n * t * t;
      if (t < 2 / d) return n * (t -= 1.5 / d) * t + .75;
      if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + .9375;
      return n * (t -= 2.625 / d) * t + .984375;
    },
    /* 抖动型：给震屏/故障用 */
    shakeOut: function (t) { return (1 - t) * Math.sin(t * 40) ; }
  };
  U.easeOf = function (name) {
    if (typeof name === 'function') return name;
    return E[name] || E.linear;
  };

  /* ---------- 对象池 ---------- */
  U.Pool = function (factory, size, resetFn) {
    this.factory = factory;
    this.reset = resetFn || null;
    this.items = new Array(size);
    this.active = 0;                      // items[0..active-1] 为存活对象
    for (var i = 0; i < size; i++) {
      this.items[i] = factory();
      this.items[i]._alive = false;
    }
    this.cap = size;
  };
  U.Pool.prototype.get = function () {
    if (this.active >= this.cap) return null;   // 满了就丢弃，绝不 new
    var o = this.items[this.active++];
    o._alive = true;
    if (this.reset) this.reset(o);
    return o;
  };
  /* 交换删除：O(1)，遍历时用倒序或配合 sweep */
  U.Pool.prototype.release = function (i) {
    var last = --this.active;
    var o = this.items[i];
    o._alive = false;
    this.items[i] = this.items[last];
    this.items[last] = o;
  };
  U.Pool.prototype.clear = function () {
    for (var i = 0; i < this.active; i++) this.items[i]._alive = false;
    this.active = 0;
  };
  U.Pool.prototype.forEach = function (fn) {
    for (var i = 0; i < this.active; i++) fn(this.items[i], i);
  };

  /* ---------- 杂项 ---------- */
  U.clone = function (o) {
    if (o === null || typeof o !== 'object') return o;
    if (Array.isArray(o)) {
      var a = new Array(o.length);
      for (var i = 0; i < o.length; i++) a[i] = U.clone(o[i]);
      return a;
    }
    var r = {};
    for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) r[k] = U.clone(o[k]);
    return r;
  };
  U.merge = function (dst, src) {
    for (var k in src) if (Object.prototype.hasOwnProperty.call(src, k)) dst[k] = src[k];
    return dst;
  };
  U.defaults = function (dst, def) {
    for (var k in def) if (dst[k] === undefined) dst[k] = def[k];
    return dst;
  };
  U.pad = function (n, w) {
    var s = '' + n;
    while (s.length < w) s = '0' + s;
    return s;
  };
  U.time = function (ms) {
    var s = Math.floor(ms / 1000);
    return U.pad(Math.floor(s / 60), 2) + ':' + U.pad(s % 60, 2);
  };
  /* 离屏画布 */
  U.canvas = function (w, h) {
    var c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w));
    c.height = Math.max(1, Math.ceil(h));
    return c;
  };
  /* 预渲染径向光斑精灵（替代 shadowBlur） */
  U.glowSprite = function (size, color, power) {
    power = power === undefined ? 1 : power;
    var c = U.canvas(size, size), x = c.getContext('2d');
    var r = size / 2;
    var g = x.createRadialGradient(r, r, 0, r, r, r);
    var rgb = U.hexToRgb(color);
    g.addColorStop(0, 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + power + ')');
    g.addColorStop(0.35, 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + (power * 0.42) + ')');
    g.addColorStop(0.72, 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + (power * 0.10) + ')');
    g.addColorStop(1, 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',0)');
    x.fillStyle = g;
    x.fillRect(0, 0, size, size);
    return c;
  };

  /* 圆角矩形路径（老浏览器无 roundRect） */
  U.roundRect = function (ctx, x, y, w, h, r) {
    if (r === undefined) r = 8;
    var rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();
  };

  /* 切角矩形（科幻边框用） */
  U.cutRect = function (ctx, x, y, w, h, c) {
    if (c === undefined) c = 14;
    ctx.beginPath();
    ctx.moveTo(x + c, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + h - c);
    ctx.lineTo(x + w - c, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + c);
    ctx.closePath();
  };

  /* ===========================================================
     二次元作画用几何：光滑曲线、变宽描边、发束
     全部只负责铺路径（beginPath..closePath），填充与描边由调用方决定
     =========================================================== */

  /* Catmull-Rom 转三次贝塞尔，穿过所有给定点。pts: [{x,y}...] */
  U.smoothPath = function (ctx, pts, closed, tension) {
    var n = pts.length;
    if (n < 2) return;
    tension = tension === undefined ? .5 : tension;
    var at = function (i) {
      if (closed) return pts[(i + n) % n];
      return pts[U.clamp(i, 0, n - 1)];
    };
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    var last = closed ? n : n - 1;
    for (var i = 0; i < last; i++) {
      var p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
      ctx.bezierCurveTo(
        p1.x + (p2.x - p0.x) * tension / 3, p1.y + (p2.y - p0.y) * tension / 3,
        p2.x - (p3.x - p1.x) * tension / 3, p2.y - (p3.y - p1.y) * tension / 3,
        p2.x, p2.y
      );
    }
    if (closed) ctx.closePath();
  };

  /* 变宽“描边”——把中心线加粗成一条可填充的带子。
     线稿粗细必须随位置变化（遮挡处粗、受光处细），否则一眼就是矢量图不是手绘。
     pts: 中心线点列；wFn(t) 返回该处的总宽度（t: 0..1）。 */
  U.taperPath = function (ctx, pts, wFn) {
    var n = pts.length;
    if (n < 2) return;
    var nx = [], ny = [];
    for (var i = 0; i < n; i++) {
      var a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      var dx = b.x - a.x, dy = b.y - a.y;
      var len = Math.sqrt(dx * dx + dy * dy) || 1;
      nx[i] = -dy / len; ny[i] = dx / len;
    }
    var w = [];
    for (i = 0; i < n; i++) w[i] = (typeof wFn === 'function' ? wFn(i / (n - 1)) : wFn) * .5;
    var L = [], R = [];
    for (i = 0; i < n; i++) {
      L.push({ x: pts[i].x + nx[i] * w[i], y: pts[i].y + ny[i] * w[i] });
      R.push({ x: pts[i].x - nx[i] * w[i], y: pts[i].y - ny[i] * w[i] });
    }
    R.reverse();
    U.smoothPath(ctx, L.concat(R), true, .4);
  };

  /* 发束 / 尖角布片：根部宽、末端收成一个尖，中途带弧。
     ang 为根部朝向（弧度），curl 为侧向弯曲量（相对 len 的比例，正负决定弯向）。 */
  U.lock = function (ctx, x, y, ang, len, wRoot, curl, bulge) {
    curl = curl || 0;
    bulge = bulge === undefined ? .55 : bulge;
    var dx = Math.cos(ang), dy = Math.sin(ang);
    var px = -dy, py = dx;                       /* 法向 */
    var tipX = x + dx * len + px * curl * len;
    var tipY = y + dy * len + py * curl * len;
    var hw = wRoot * .5;
    /* 两条控制点：外侧鼓、内侧略凹，得到自然的水滴尖 */
    var m = .52;
    var c1x = x + dx * len * m + px * (hw * (1 + bulge) + curl * len * m * .5);
    var c1y = y + dy * len * m + py * (hw * (1 + bulge) + curl * len * m * .5);
    var c2x = x + dx * len * m - px * (hw * (1 - bulge * .35) - curl * len * m * .5);
    var c2y = y + dy * len * m - py * (hw * (1 - bulge * .35) - curl * len * m * .5);
    ctx.beginPath();
    ctx.moveTo(x + px * hw, y + py * hw);
    ctx.quadraticCurveTo(c1x, c1y, tipX, tipY);
    ctx.quadraticCurveTo(c2x, c2y, x - px * hw, y - py * hw);
    ctx.closePath();
    return { tipX: tipX, tipY: tipY };
  };

  /* 叶形（眼睛轮廓、嘴、腮红都用得到）：两段弧围成的凸透镜形 */
  U.leaf = function (ctx, x, y, w, h, tiltUp) {
    tiltUp = tiltUp || 0;
    ctx.beginPath();
    ctx.moveTo(x - w, y + tiltUp * h * .5);
    ctx.quadraticCurveTo(x, y - h, x + w, y - tiltUp * h * .5);
    ctx.quadraticCurveTo(x, y + h, x - w, y + tiltUp * h * .5);
    ctx.closePath();
  };

  /* 文本换行（返回行数组）—— 中文按字断行 */
  U.wrapText = function (ctx, text, maxW) {
    var lines = [], cur = '';
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (ch === '\n') { lines.push(cur); cur = ''; continue; }
      var test = cur + ch;
      if (ctx.measureText(test).width > maxW && cur.length) {
        lines.push(cur); cur = ch;
      } else cur = test;
    }
    lines.push(cur);
    return lines;
  };

  /* 事件总线 */
  U.Bus = function () { this.map = {}; };
  U.Bus.prototype.on = function (k, fn) { (this.map[k] = this.map[k] || []).push(fn); return fn; };
  U.Bus.prototype.off = function (k, fn) {
    var a = this.map[k]; if (!a) return;
    var i = a.indexOf(fn); if (i >= 0) a.splice(i, 1);
  };
  U.Bus.prototype.emit = function (k, data) {
    var a = this.map[k]; if (!a) return;
    for (var i = 0; i < a.length; i++) a[i](data);
  };

})(window);
