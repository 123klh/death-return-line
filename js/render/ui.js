/* ===========================================================
   ui.js — 毛玻璃 UI 系统
     真实磨砂：从 Game.blurBuf（每帧降采样+模糊的画面）取样
     玻璃管血条 / 霓虹切角边框 / 按钮 / 菜单 / 滑条 / 徽章 / 字幕
   =========================================================== */
(function (root) {
  'use strict';
  var G = root.G, U = G.U;

  G.FONT = '"Noto Sans SC","Microsoft YaHei","PingFang SC","Hiragino Sans GB",sans-serif';
  G.FONT_MONO = '"Consolas","Courier New",monospace';

  var Ui = G.Ui = {};

  var noiseTile = null;
  function getNoise() {
    if (!noiseTile) {
      var c = U.canvas(96, 96), x = c.getContext('2d');
      var img = x.createImageData(96, 96);
      for (var i = 0; i < img.data.length; i += 4) {
        var v = Math.random() * 255;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 26;
      }
      x.putImageData(img, 0, 0);
      noiseTile = c;
    }
    return noiseTile;
  }

  /* 路径：圆角 or 切角 */
  function shapePath(ctx, x, y, w, h, opt) {
    if (opt.cut) U.cutRect(ctx, x, y, w, h, opt.cut === true ? 16 : opt.cut);
    else U.roundRect(ctx, x, y, w, h, opt.r === undefined ? 14 : opt.r);
  }

  /* ---------------- 毛玻璃面板 ---------------- */
  /* opt: {r, cut, accent, alpha, glow, noise, border, topLight, tintColor} */
  Ui.glass = function (ctx, x, y, w, h, opt) {
    opt = opt || {};
    var accent = opt.accent || '#6fd8ff';
    var alpha = opt.alpha === undefined ? 0.30 : opt.alpha;
    /* 尊重调用方已设置的 globalAlpha（暂停层/淡入淡出会用到） */
    var GA = ctx.globalAlpha === undefined ? 1 : ctx.globalAlpha;

    ctx.save();
    shapePath(ctx, x, y, w, h, opt);
    ctx.clip();

    /* 0) 可选实底：文字容器必须保证一个最低暗度。
       磨砂层会把背后的内容照搬进来，背景一亮（朝霞、雪原、白色虚空）
       白字就贴在浅底上，读不出来。 */
    if (opt.base) {
      ctx.globalAlpha = GA;
      ctx.fillStyle = opt.base;
      ctx.fillRect(x, y, w, h);
    }

    /* 1) 磨砂底：把模糊缓冲对应区域放大铺进来 */
    var bb = G.Game && G.Game.blurBuf;
    if (bb && opt.frost !== false) {
      var sx = x / G.Game.W * bb.width, sy = y / G.Game.H * bb.height;
      var sw = w / G.Game.W * bb.width, sh = h / G.Game.H * bb.height;
      ctx.globalAlpha = (opt.frostA === undefined ? 0.92 : opt.frostA) * GA;
      try { ctx.drawImage(bb, sx, sy, sw, sh, x, y, w, h); } catch (e) {}
      ctx.globalAlpha = GA;
    }

    /* 2) 半透明玻璃色（上亮下暗） */
    var g = ctx.createLinearGradient(x, y, x, y + h);
    var tc = opt.tintColor || '#12203a';
    g.addColorStop(0, U.rgba(U.shade(tc, .18), alpha + .1));
    g.addColorStop(.45, U.rgba(tc, alpha));
    g.addColorStop(1, U.rgba(U.shade(tc, -.35), alpha + .16));
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);

    /* 3) 顶部高光 */
    if (opt.topLight !== false) {
      var g2 = ctx.createLinearGradient(x, y, x, y + Math.min(h * .5, 60));
      g2.addColorStop(0, 'rgba(255,255,255,.16)');
      g2.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g2;
      ctx.fillRect(x, y, w, Math.min(h * .5, 60));
    }

    /* 4) 斜向反光条 */
    if (opt.sheen !== false) {
      ctx.globalAlpha = .06 * GA;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(x + w * .1, y);
      ctx.lineTo(x + w * .34, y);
      ctx.lineTo(x + w * .12, y + h);
      ctx.lineTo(x - w * .12, y + h);
      ctx.closePath(); ctx.fill();
      ctx.globalAlpha = GA;
    }

    /* 5) 细微噪点 */
    if (opt.noise !== false) {
      ctx.globalAlpha = .5 * GA;
      var nt = getNoise();
      for (var gx = x - (x % 96); gx < x + w; gx += 96)
        for (var gy = y - (y % 96); gy < y + h; gy += 96) ctx.drawImage(nt, gx, gy);
      ctx.globalAlpha = GA;
    }
    ctx.restore();

    /* 6) 霓虹边框 + 外发光 */
    if (opt.border !== false) {
      ctx.save();
      var gl = opt.glow === undefined ? 1 : opt.glow;
      if (gl > 0) {
        shapePath(ctx, x, y, w, h, opt);
        ctx.strokeStyle = U.rgba(accent, .16 * gl);
        ctx.lineWidth = 7;
        ctx.stroke();
        ctx.strokeStyle = U.rgba(accent, .3 * gl);
        ctx.lineWidth = 3.4;
        ctx.stroke();
      }
      shapePath(ctx, x, y, w, h, opt);
      ctx.strokeStyle = U.rgba(accent, opt.borderA === undefined ? .85 : opt.borderA);
      ctx.lineWidth = opt.lw || 1.4;
      ctx.stroke();
      /* 内侧亮线 */
      ctx.strokeStyle = 'rgba(255,255,255,.14)';
      ctx.lineWidth = 1;
      shapePath(ctx, x + 2, y + 2, w - 4, h - 4, opt);
      ctx.stroke();
      ctx.restore();
    }

    /* 7) 四角科幻装饰 */
    if (opt.corners) {
      ctx.save();
      ctx.strokeStyle = U.rgba(accent, .95);
      ctx.lineWidth = 2;
      var c = 14;
      [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]].forEach(function (p) {
        ctx.beginPath();
        ctx.moveTo(p[0] + c * p[2], p[1]);
        ctx.lineTo(p[0], p[1]);
        ctx.lineTo(p[0], p[1] + c * p[3]);
        ctx.stroke();
      });
      ctx.restore();
    }
  };

  /* ---------------- 玻璃管条（血条/能量/冷却） ---------------- */
  /* opt: {color, bgColor, label, glow, flow, segments, ghost(受伤残影), vertical} */
  Ui.tube = function (ctx, x, y, w, h, ratio, opt) {
    opt = opt || {};
    ratio = U.clamp01(ratio);
    var color = opt.color || '#5ce1ff';
    var r = h / 2;

    ctx.save();
    /* 外壳 */
    U.roundRect(ctx, x, y, w, h, r);
    ctx.fillStyle = 'rgba(8,14,26,.62)';
    ctx.fill();
    ctx.save();
    U.roundRect(ctx, x, y, w, h, r);
    ctx.clip();

    /* 受伤残影 */
    if (opt.ghost !== undefined && opt.ghost > ratio) {
      ctx.fillStyle = U.rgba('#ff5f7a', .38);
      ctx.fillRect(x, y, w * opt.ghost, h);
    }

    /* 内部流光填充 */
    if (ratio > 0) {
      var fw = w * ratio;
      var g = ctx.createLinearGradient(x, y, x, y + h);
      g.addColorStop(0, U.rgba(U.shade(color, .5), .95));
      g.addColorStop(.42, U.rgba(color, .98));
      g.addColorStop(1, U.rgba(U.shade(color, -.4), .95));
      ctx.fillStyle = g;
      ctx.fillRect(x, y, fw, h);

      /* 流动条纹 */
      var t = (G.Game ? G.Game.real : 0) * (opt.flowSpeed || 0.05);
      ctx.globalAlpha = .22;
      ctx.fillStyle = '#fff';
      for (var i = -h * 2; i < fw + h * 2; i += 22) {
        var xx = x + ((i + t) % (fw + h * 4)) - h * 2;
        ctx.beginPath();
        ctx.moveTo(xx, y + h);
        ctx.lineTo(xx + h * .7, y);
        ctx.lineTo(xx + h * .7 + 6, y);
        ctx.lineTo(xx + 6, y + h);
        ctx.closePath();
        if (xx > x - h && xx < x + fw) ctx.fill();
      }
      ctx.globalAlpha = 1;

      /* 头部亮点 */
      var hx = x + fw;
      var gg = ctx.createLinearGradient(hx - 14, y, hx, y);
      gg.addColorStop(0, U.rgba('#ffffff', 0));
      gg.addColorStop(1, U.rgba('#ffffff', .8));
      ctx.fillStyle = gg;
      ctx.fillRect(hx - 14, y, 14, h);
    }

    /* 分段刻度。segments 可以是个数（均分），也可以是一组 0..1 的真实位置。
       Boss 血条必须用后者——均分刻度会告诉玩家错误的转阶段点。 */
    if (opt.segments) {
      var marks = [];
      if (typeof opt.segments === 'number') {
        for (var s = 1; s < opt.segments; s++) marks.push(s / opt.segments);
      } else {
        for (var s2 = 0; s2 < opt.segments.length; s2++) {
          var mv = opt.segments[s2];
          if (mv > 0.001 && mv < 0.999) marks.push(mv);
        }
      }
      for (var mi = 0; mi < marks.length; mi++) {
        var sx = Math.round(x + w * marks[mi]) + .5;
        /* 深色底 + 亮色芯，浅色和深色血条上都看得见 */
        ctx.strokeStyle = 'rgba(0,0,0,.55)';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(sx, y); ctx.lineTo(sx, y + h); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,.75)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(sx, y + 1); ctx.lineTo(sx, y + h - 1); ctx.stroke();
      }
    }
    /* 玻璃上半反光 */
    var g3 = ctx.createLinearGradient(x, y, x, y + h * .55);
    g3.addColorStop(0, 'rgba(255,255,255,.3)');
    g3.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g3;
    ctx.fillRect(x, y, w, h * .55);
    ctx.restore();

    /* 外壳描边 + 光晕 */
    U.roundRect(ctx, x, y, w, h, r);
    ctx.strokeStyle = U.rgba(color, .5);
    ctx.lineWidth = 4; ctx.stroke();
    ctx.strokeStyle = 'rgba(220,245,255,.75)';
    ctx.lineWidth = 1.2; ctx.stroke();

    if (opt.label) {
      ctx.font = '600 ' + Math.max(10, h * .62) + 'px ' + G.FONT;
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(0,0,0,.6)';
      ctx.fillText(opt.label, x + 9, y + h / 2 + 1);
      ctx.fillStyle = '#eaf6ff';
      ctx.fillText(opt.label, x + 8, y + h / 2);
    }
    ctx.restore();
  };

  /* ---------------- 文本 ---------------- */
  Ui.text = function (ctx, str, x, y, opt) {
    opt = opt || {};
    ctx.save();
    ctx.font = (opt.weight || 400) + ' ' + (opt.size || 18) + 'px ' + (opt.font || G.FONT);
    ctx.textAlign = opt.align || 'left';
    ctx.textBaseline = opt.baseline || 'alphabetic';
    /* alpha 必须在描影之前生效 —— 否则淡入时只剩黑色投影，文字看起来是黑的 */
    if (opt.alpha !== undefined) ctx.globalAlpha *= opt.alpha;
    if (opt.glow) {
      ctx.fillStyle = U.rgba(opt.glowColor || opt.color || '#8ef', .35);
      for (var i = 1; i <= 2; i++) {
        ctx.fillText(str, x - i, y); ctx.fillText(str, x + i, y);
        ctx.fillText(str, x, y - i); ctx.fillText(str, x, y + i);
      }
    }
    if (opt.shadow !== false) {
      ctx.fillStyle = 'rgba(0,0,0,' + (opt.shadowA || .55) + ')';
      ctx.fillText(str, x + (opt.sx || 1.5), y + (opt.sy || 2));
    }
    ctx.fillStyle = opt.color || '#eaf6ff';
    ctx.fillText(str, x, y);
    ctx.restore();
  };

  /* 带字距的标题字（二次元/科幻感） */
  Ui.spaced = function (ctx, str, x, y, opt) {
    opt = opt || {};
    var sp = opt.spacing === undefined ? 8 : opt.spacing;
    ctx.save();
    ctx.font = (opt.weight || 800) + ' ' + (opt.size || 40) + 'px ' + (opt.font || G.FONT);
    ctx.textBaseline = opt.baseline || 'middle';
    var widths = [], total = 0;
    for (var i = 0; i < str.length; i++) {
      widths[i] = ctx.measureText(str[i]).width;
      total += widths[i] + (i < str.length - 1 ? sp : 0);
    }
    var cx = opt.align === 'center' ? x - total / 2 : (opt.align === 'right' ? x - total : x);
    ctx.textAlign = 'left';
    for (var j = 0; j < str.length; j++) {
      var ch = str[j];
      if (opt.glow) {
        ctx.fillStyle = U.rgba(opt.glowColor || '#6fd8ff', .30);
        for (var k = 1; k <= 3; k++) {
          ctx.fillText(ch, cx - k, y); ctx.fillText(ch, cx + k, y);
          ctx.fillText(ch, cx, y - k); ctx.fillText(ch, cx, y + k);
        }
      }
      if (opt.shadow !== false) {
        ctx.fillStyle = 'rgba(0,0,0,.6)';
        ctx.fillText(ch, cx + 2, y + 3);
      }
      if (opt.gradient) {
        var g = ctx.createLinearGradient(0, y - (opt.size || 40) / 2, 0, y + (opt.size || 40) / 2);
        g.addColorStop(0, opt.gradient[0]);
        g.addColorStop(1, opt.gradient[1]);
        ctx.fillStyle = g;
      } else ctx.fillStyle = opt.color || '#eaf6ff';
      ctx.fillText(ch, cx, y);
      cx += widths[j] + sp;
    }
    ctx.restore();
    return total;
  };

  /* ---------------- 按钮 ---------------- */
  /* rect {x,y,w,h}；state: {hover, active, disabled} */
  Ui.button = function (ctx, rect, label, state, opt) {
    opt = opt || {};
    state = state || {};
    var accent = state.disabled ? '#5a6a7a' : (opt.accent || (state.hover ? '#9ff0ff' : '#6fd8ff'));
    var lift = state.hover ? -2 : 0;
    var y = rect.y + lift;
    Ui.glass(ctx, rect.x, y, rect.w, rect.h, {
      r: opt.r === undefined ? 12 : opt.r, cut: opt.cut,
      accent: accent, alpha: state.hover ? .34 : .26,
      glow: state.hover ? 1.5 : .7,
      tintColor: state.hover ? '#1b3358' : '#12203a'
    });
    if (state.hover && !state.disabled) {
      ctx.save();
      U.roundRect(ctx, rect.x, y, rect.w, rect.h, opt.r === undefined ? 12 : opt.r);
      ctx.clip();
      var g = ctx.createLinearGradient(rect.x, y, rect.x + rect.w, y);
      g.addColorStop(0, U.rgba(accent, 0));
      g.addColorStop(.5, U.rgba(accent, .18));
      g.addColorStop(1, U.rgba(accent, 0));
      ctx.fillStyle = g; ctx.fillRect(rect.x, y, rect.w, rect.h);
      ctx.restore();
    }
    Ui.text(ctx, label, rect.x + rect.w / 2, y + rect.h / 2 + 1, {
      size: opt.size || 20, weight: 600, align: 'center', baseline: 'middle',
      color: state.disabled ? '#7c8a99' : (state.hover ? '#ffffff' : '#dff0ff'),
      glow: state.hover, glowColor: accent
    });
    if (opt.hint) {
      Ui.text(ctx, opt.hint, rect.x + rect.w - 12, y + rect.h / 2 + 1, {
        size: 13, align: 'right', baseline: 'middle', color: 'rgba(190,215,235,.7)'
      });
    }
  };

  /* ---------------- 菜单（键鼠通用） ---------------- */
  Ui.Menu = function (items, opt) {
    this.items = items;           // [{label, id, hint, disabled, sub}]
    this.i = 0;
    this.opt = opt || {};
    this.hoverI = -1;
    this._rects = [];
    this.wrap = this.opt.wrap !== false;
  };
  Ui.Menu.prototype.setItems = function (items) {
    this.items = items;
    if (this.i >= items.length) this.i = Math.max(0, items.length - 1);
  };
  Ui.Menu.prototype.moveTo = function (i) {
    var n = this.items.length;
    if (!n) return;
    var guard = 0;
    while (guard++ < n) {
      if (i < 0) i = this.wrap ? n - 1 : 0;
      if (i >= n) i = this.wrap ? 0 : n - 1;
      if (!this.items[i].disabled) break;
      i += (i > this.i ? 1 : -1);
    }
    if (i !== this.i) { this.i = i; G.Aud.sfx.uiMove(); }
  };
  /* 返回被选中的 item（confirm 时），否则 null */
  Ui.Menu.prototype.update = function () {
    var In = G.In;
    if (In.hit('up')) this.moveTo(this.i - 1);
    if (In.hit('down')) this.moveTo(this.i + 1);
    /* 鼠标 */
    this.hoverI = -1;
    for (var k = 0; k < this._rects.length; k++) {
      var r = this._rects[k];
      if (r && U.pointInRect(In.mx, In.my, r.x, r.y, r.w, r.h)) {
        this.hoverI = k;
        if (k !== this.i && !this.items[k].disabled) { this.i = k; G.Aud.sfx.uiMove(); }
        break;
      }
    }
    var it = this.items[this.i];
    if (In.hit('confirm') || (In.mclick && this.hoverI === this.i)) {
      if (it && it.disabled) { G.Aud.sfx.uiDeny(); return null; }
      G.Aud.sfx.uiOk();
      return it;
    }
    return null;
  };
  Ui.Menu.prototype.draw = function (ctx, x, y, w, h, gap) {
    gap = gap === undefined ? 12 : gap;
    this._rects = [];
    for (var k = 0; k < this.items.length; k++) {
      var it = this.items[k];
      var r = { x: x, y: y + k * (h + gap), w: w, h: h };
      this._rects.push(r);
      Ui.button(ctx, r, it.label, { hover: k === this.i, disabled: it.disabled },
                { hint: it.hint, size: this.opt.size, cut: this.opt.cut });
      if (it.sub) {
        Ui.text(ctx, it.sub, x + w + 18, r.y + h / 2 + 1,
                { size: 13, baseline: 'middle', color: 'rgba(180,210,235,.75)' });
      }
    }
    /* 选中指示三角 */
    var sel = this._rects[this.i];
    if (sel) {
      var pulse = 0.5 + 0.5 * Math.sin((G.Game ? G.Game.real : 0) * 0.006);
      ctx.save();
      ctx.fillStyle = U.rgba('#9ff0ff', .5 + pulse * .5);
      var px = sel.x - 16 - pulse * 4;
      ctx.beginPath();
      ctx.moveTo(px, sel.y + sel.h / 2 - 7);
      ctx.lineTo(px + 11, sel.y + sel.h / 2);
      ctx.lineTo(px, sel.y + sel.h / 2 + 7);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  };

  /* ---------------- 斜切几何（日系菜单的骨架） ---------------- */
  /* 平行四边形：上边比下边右移 skew。所有斜切 UI 都用它，保证倾角一致。 */
  Ui.SKEW = 16;
  Ui.paraPath = function (ctx, x, y, w, h, skew) {
    if (skew === undefined) skew = Ui.SKEW;
    ctx.beginPath();
    ctx.moveTo(x + skew, y);
    ctx.lineTo(x + w + skew, y);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
  };

  /* 斜切菜单：不用方框，靠「一条重色块 + 一根粗端条 + 错位缩进」建立层级。
     入场时逐项从左侧滑入，delay 按序号递增——这是日系标题最容易辨认的动效。 */
  Ui.Menu.prototype.drawSlash = function (ctx, opt) {
    opt = opt || {};
    var x0 = opt.x === undefined ? 96 : opt.x;
    var y0 = opt.y === undefined ? 300 : opt.y;
    var w = opt.w === undefined ? 300 : opt.w;
    var h = opt.h === undefined ? 46 : opt.h;
    var gap = opt.gap === undefined ? 10 : opt.gap;
    var step = opt.step === undefined ? 22 : opt.step;   /* 每项向右错位 */
    var accent = opt.accent || '#7fe0ff';
    var skew = opt.skew === undefined ? Ui.SKEW : opt.skew;
    var t = opt.t === undefined ? 9999 : opt.t;
    var pulse = .5 + .5 * Math.sin((G.Game ? G.Game.real : 0) * .005);
    this._rects = [];

    for (var k = 0; k < this.items.length; k++) {
      var it = this.items[k];
      /* 入场：每项延迟 70ms，从左边滑入 */
      var p = U.clamp01((t - 260 - k * 70) / 340);
      var ease = U.smootherstep(p);
      var slide = (1 - ease) * -70;
      var bx = x0 + k * step + slide;
      var by = y0 + k * (h + gap);
      var sel = (k === this.i);
      /* 命中框按未滑入前的最终位置算，免得动画途中点不中 */
      this._rects.push({ x: x0 + k * step, y: by, w: w, h: h });
      if (p <= 0) continue;

      ctx.save();
      ctx.globalAlpha = ease;

      if (sel) {
        /* 选中：整块压深 + 左端一根粗条 + 右端渐隐 */
        Ui.paraPath(ctx, bx, by, w, h, skew);
        var g = ctx.createLinearGradient(bx, by, bx + w, by);
        g.addColorStop(0, U.rgba(accent, .34));
        g.addColorStop(.62, U.rgba(accent, .10));
        g.addColorStop(1, U.rgba(accent, 0));
        ctx.fillStyle = g;
        ctx.fill();
      }
      /* 左端条：选中时更长更亮 */
      var barW = sel ? 7 : 3;
      var barH = sel ? h : h * .52;
      var barY = by + (h - barH) / 2;
      ctx.fillStyle = sel ? U.rgba(accent, .85 + pulse * .15) : 'rgba(160,200,225,.42)';
      Ui.paraPath(ctx, bx - 14, barY, barW, barH, skew * .35 * (barH / h));
      ctx.fill();

      Ui.text(ctx, it.label, bx + 26 + (sel ? 6 : 0), by + h / 2 + 1, {
        size: opt.size || 20, weight: sel ? 700 : 500, baseline: 'middle',
        color: it.disabled ? '#6d7c8b' : (sel ? '#ffffff' : 'rgba(206,226,242,.82)'),
        glow: sel ? 1 : 0, glowColor: accent, sx: 1, sy: 2
      });
      if (it.hint) {
        Ui.text(ctx, it.hint, bx + w - 6, by + h / 2 + 2, {
          size: 12, align: 'right', baseline: 'middle',
          color: sel ? U.rgba(accent, .95) : 'rgba(170,200,222,.5)'
        });
      }
      ctx.restore();
    }
  };

  /* 细体标题 + 一根重横线：日系标题的字重对比全靠这两层 */
  Ui.titleBlock = function (ctx, x, y, main, sub, kicker, opt) {
    opt = opt || {};
    var a = opt.alpha === undefined ? 1 : opt.alpha;
    var accent = opt.accent || '#7fe0ff';
    ctx.save();
    ctx.globalAlpha = a;
    if (kicker) {
      Ui.text(ctx, kicker, x + 3, y - 16, {
        size: 12, weight: 500, color: U.rgba(accent, .8), sx: 1, sy: 1
      });
    }
    var wMain = Ui.spaced(ctx, main, x, y + 44, {
      size: opt.size || 54, weight: 300, spacing: opt.spacing === undefined ? 10 : opt.spacing,
      gradient: ['#ffffff', '#cfe6f8'], glow: .8, glowColor: accent, shadow: true
    });
    /* 重横线：右端收细，做出「笔锋」 */
    var lw = Math.max(wMain, 260) * (opt.rule === undefined ? 1 : opt.rule);
    var gy = y + 62;
    var g = ctx.createLinearGradient(x, gy, x + lw, gy);
    g.addColorStop(0, U.rgba(accent, .95));
    g.addColorStop(.72, U.rgba(accent, .55));
    g.addColorStop(1, U.rgba(accent, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x, gy); ctx.lineTo(x + lw, gy + 1);
    ctx.lineTo(x + lw, gy + 3.5); ctx.lineTo(x, gy + 5);
    ctx.closePath(); ctx.fill();
    if (sub) {
      Ui.text(ctx, sub, x + 4, gy + 24, {
        size: 11, weight: 500, color: 'rgba(196,224,244,.5)', sx: 1, sy: 1
      });
    }
    ctx.restore();
    return wMain;
  };

  /* ---------------- 滑条 ---------------- */
  Ui.slider = function (ctx, x, y, w, h, v, opt) {
    opt = opt || {};
    Ui.tube(ctx, x, y, w, h, v, { color: opt.color || '#6fd8ff' });
    var kx = x + w * U.clamp01(v);
    ctx.save();
    ctx.fillStyle = '#eaf6ff';
    ctx.beginPath(); ctx.arc(kx, y + h / 2, h * .78, 0, U.TAU); ctx.fill();
    ctx.strokeStyle = U.rgba(opt.color || '#6fd8ff', .9);
    ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
    if (opt.label) Ui.text(ctx, opt.label, x - 14, y + h / 2 + 1, { size: 15, align: 'right', baseline: 'middle', color: '#cfe6f7' });
    if (opt.valueText) Ui.text(ctx, opt.valueText, x + w + 14, y + h / 2 + 1, { size: 14, baseline: 'middle', color: '#9fc4dd' });
  };

  /* ---------------- 徽章 / 提示 ---------------- */
  Ui.badge = function (ctx, x, y, text, opt) {
    opt = opt || {};
    ctx.save();
    ctx.font = '600 ' + (opt.size || 14) + 'px ' + G.FONT;
    var tw = ctx.measureText(text).width;
    var w = tw + 26, h = (opt.size || 14) + 14;
    var bx = opt.align === 'right' ? x - w : (opt.align === 'center' ? x - w / 2 : x);
    Ui.glass(ctx, bx, y, w, h, { r: h / 2, accent: opt.accent || '#6fd8ff', alpha: .3, glow: .8, noise: false, sheen: false });
    Ui.text(ctx, text, bx + w / 2, y + h / 2 + 1, {
      size: opt.size || 14, weight: 600, align: 'center', baseline: 'middle',
      color: opt.color || '#eaf6ff'
    });
    ctx.restore();
    return { x: bx, y: y, w: w, h: h };
  };

  /* 交互提示（地图里靠近 NPC） */
  Ui.prompt = function (ctx, x, y, key, label) {
    ctx.save();
    var pulse = 0.5 + 0.5 * Math.sin((G.Game ? G.Game.real : 0) * 0.005);
    ctx.font = '700 14px ' + G.FONT;
    var kw = 26, tw = ctx.measureText(label).width;
    var w = kw + tw + 22, h = 30;
    var bx = x - w / 2, by = y - h - 6 - pulse * 3;
    Ui.glass(ctx, bx, by, w, h, { r: 8, accent: '#ffe17a', alpha: .32, glow: .8 + pulse * .6, noise: false });
    Ui.glass(ctx, bx + 6, by + 5, 20, 20, { r: 5, accent: '#ffe17a', alpha: .5, glow: 0, frost: false, noise: false, sheen: false });
    Ui.text(ctx, key, bx + 16, by + 16, { size: 12, weight: 700, align: 'center', baseline: 'middle', color: '#fff6d0' });
    Ui.text(ctx, label, bx + kw + 8, by + 16, { size: 14, baseline: 'middle', color: '#fff6d0' });
    ctx.restore();
  };

  /* 电影字幕（结局用） */
  Ui.subtitle = function (ctx, text, opt) {
    opt = opt || {};
    var y = opt.y === undefined ? 620 : opt.y;
    /* 让开电影黑边：绝大多数字幕写在 y 640/650，而黑边满格时从 y=626 起就是纯黑，
       字幕会被切掉一半。这里统一上推，比在一百多处调用点各自改安全得多。 */
    var lbh = G.Fx ? 720 * .13 * (G.Fx.letterbox || 0) : 0;
    if (lbh > 1) y = Math.min(y, 720 - lbh - 18);
    /* 也让开对话框：旁白和台词经常同时在场（say 之后 keepBox 仍为真），
       字幕写在 y 650 就会盖在台词上，两段文字叠成一团。 */
    var D = G.Dlg;
    if (D && D.line && !D.hideBox && D.boxA > .12) {
      y = Math.min(y, (D.BOX ? D.BOX.y : 520) - 14);
    }
    ctx.save();
    ctx.font = (opt.weight || 500) + ' ' + (opt.size || 22) + 'px ' + G.FONT;
    var lines = U.wrapText(ctx, text, opt.maxW || 940);
    var lh = (opt.size || 22) * 1.6;
    var totalH = lines.length * lh;
    if (opt.box !== false) {
      /* 底衬也要跟着字幕一起淡入，否则会先砸出一条黑带 */
      ctx.globalAlpha = (opt.boxA === undefined ? .5 : opt.boxA) *
                        (opt.alpha === undefined ? 1 : opt.alpha);
      var g = ctx.createLinearGradient(0, y - totalH - 20, 0, y + 30);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(.4, 'rgba(0,0,0,.75)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, y - totalH - 20, 1280, totalH + 60);
      ctx.globalAlpha = 1;
    }
    for (var i = 0; i < lines.length; i++) {
      Ui.text(ctx, lines[i], opt.x === undefined ? 640 : opt.x, y - totalH + (i + 1) * lh - lh * .25, {
        size: opt.size || 22, weight: opt.weight || 500, align: opt.align || 'center',
        color: opt.color || '#f2f7ff', alpha: opt.alpha, glow: opt.glow, glowColor: opt.glowColor
      });
    }
    ctx.restore();
    return totalH;
  };

  /* 章节标题卡 */
  Ui.chapterCard = function (ctx, small, big, p) {
    /* p: 0→1 进入，1→0 退出 由调用方控制 alpha */
    var a = U.clamp01(p);
    ctx.save();
    ctx.globalAlpha = a;
    var cy = 300;
    var w = 620 * U.smoothstep(a);
    ctx.strokeStyle = U.rgba('#9ff0ff', .9);
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(640 - w / 2, cy + 46); ctx.lineTo(640 + w / 2, cy + 46); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(640 - w / 2, cy - 52); ctx.lineTo(640 + w / 2, cy - 52); ctx.stroke();
    Ui.text(ctx, small, 640, cy - 22, { size: 17, align: 'center', color: '#9ff0ff', glow: 1, glowColor: '#3aa0d0' });
    Ui.spaced(ctx, big, 640, cy + 16, { size: 46, weight: 800, align: 'center', spacing: 10,
      gradient: ['#ffffff', '#a8dcff'], glow: 1, glowColor: '#4fb8ff' });
    ctx.restore();
  };

  /* 面板标题条 */
  Ui.header = function (ctx, x, y, w, title, opt) {
    opt = opt || {};
    ctx.save();
    var accent = opt.accent || '#6fd8ff';
    ctx.strokeStyle = U.rgba(accent, .8);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y + 26); ctx.lineTo(x + w, y + 26); ctx.stroke();
    ctx.fillStyle = U.rgba(accent, .18);
    ctx.fillRect(x, y + 26, w, 3);
    Ui.text(ctx, title, x + 4, y + 18, { size: opt.size || 21, weight: 700, color: '#eaf6ff', glow: 1, glowColor: accent });
    if (opt.right) Ui.text(ctx, opt.right, x + w - 4, y + 18, { size: 14, align: 'right', color: 'rgba(180,210,235,.8)' });
    ctx.restore();
  };

})(window);
