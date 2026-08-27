/* ===========================================================
   scene_hangar.js — 机库整备：升级 / 情报日志 / 角色档案
   =========================================================== */
(function (root) {
  'use strict';
  var G = root.G, U = G.U, Ui = G.Ui, In = G.In;

  var UPS = [
    { key: 'power',  name: '火力强化', desc: '增加弹道数量与单发伤害', color: '#FF6B4A' },
    { key: 'shield', name: '装甲强化', desc: '提升机体耐久上限', color: '#5AD8C8' },
    { key: 'bombs',  name: '弹药扩容', desc: '每两级增加一枚清屏炸弹', color: '#FFC83A' },
    { key: 'speed',  name: '推进优化', desc: '提升机动性与闪避余量', color: '#6FD8FF' },
    { key: 'buffer', name: '回归缓冲', desc: '减少每次死亡回归的精神损耗', color: '#C9A8FF' }
  ];

  var S = {
    tab: 0, sel: 0, t: 0, dt: 16.7,
    fromMap: false, first: false, last: false,
    logIdx: 0, codexIdx: 0, bg: null, flashT: 0, flashMsg: ''
  };
  var TABS = ['整 备', '情 报', '档 案'];

  S.enter = function (p) {
    p = p || {};
    S.fromMap = !!p.fromMap;
    S.first = !!p.first;
    S.last = !!p.last;
    S.tab = 0; S.sel = 0; S.t = 0;
    S.locked = false;
    S.logIdx = 0; S.codexIdx = 0;
    S.bg = G.Art.scene(G.mapOf(G.St.s.region).bg);
    G.St.setFlag('hangarUnlocked');
    G.Fx.reset();
    G.Fx.setVignette(.36);
    G.Fx.grain = .4;
    G.Aud.playBgm('camp', { fade: 1000, layers: { drums: false, lead: false } });
    if (S.first) {
      S.flashMsg = 'TY 用三个小时把这架破飞机重构了一遍。';
      S.flashT = 4000;
    }
  };

  S.update = function (dt) {
    S.dt = dt; S.t += dt;
    if (S.flashT > 0) S.flashT -= dt;
    if (S.locked) return;

    /* 切页 */
    if (In.hit('left') && S.tab > 0 && S.tab !== undefined) {}
    if (In.hit('log')) { S.tab = (S.tab + 1) % TABS.length; S.sel = 0; G.Aud.sfx.uiMove(); }
    if (In.wheel) { S.tab = U.clamp(S.tab + In.wheel, 0, TABS.length - 1); }

    if (S.tab === 0) updUpgrades();
    else if (S.tab === 1) updLog();
    else updCodex();

    /* 出击 / 返回 */
    if (In.hit('cancel')) leave();
  };

  function updUpgrades() {
    var n = UPS.length + 1;   /* +1 = 出击 */
    if (In.hit('up')) { S.sel = (S.sel + n - 1) % n; G.Aud.sfx.uiMove(); }
    if (In.hit('down')) { S.sel = (S.sel + 1) % n; G.Aud.sfx.uiMove(); }
    /* 鼠标 */
    for (var i = 0; i < n; i++) {
      var r = rowRect(i);
      if (U.pointInRect(In.mx, In.my, r.x, r.y, r.w, r.h)) {
        if (S.sel !== i) { S.sel = i; G.Aud.sfx.uiMove(); }
        if (In.mclick) doSelect();
      }
    }
    if (In.hit('confirm')) doSelect();
    if (In.hit('left') || In.hit('right')) {
      if (S.sel < UPS.length) doSelect();
    }
  }
  function rowRect(i) {
    if (i >= UPS.length) return { x: 760, y: 560, w: 300, h: 54 };
    return { x: 210, y: 210 + i * 62, w: 500, h: 54 };
  }
  function doSelect() {
    if (S.sel >= UPS.length) { leave(); return; }
    var u = UPS[S.sel];
    if (G.St.canUpgrade(u.key)) {
      G.St.doUpgrade(u.key);
      G.Aud.sfx.powerup();
      G.Fx.float(460, 200, u.name + ' → Lv.' + G.St.s.upgrades[u.key], u.color,
                 { size: 18, life: 1400, vy: -.2 });
    } else {
      G.Aud.sfx.uiDeny();
      S.flashMsg = (G.St.s.upgrades[u.key] >= 5) ? '已达上限。' : '情报点不足。';
      S.flashT = 1800;
    }
  }
  function leave() {
    if (S.locked) return;
    S.locked = true;
    G.Aud.sfx.uiBack();
    if (S.fromMap) G.Sc.pop();
    else G.Story.advance();
  }

  function updLog() {
    var list = G.St.intelList();
    if (In.hit('up')) { S.logIdx = Math.max(0, S.logIdx - 1); G.Aud.sfx.uiMove(); }
    if (In.hit('down')) { S.logIdx = Math.min(Math.max(0, list.length - 1), S.logIdx + 1); G.Aud.sfx.uiMove(); }
    if (In.hit('confirm')) leave();
  }

  var CODEX = ['hero', 'ty', 'oldman', 'upright', 'madman', 'lucky', 'friend', 'puppet', 'shadow', 'savior'];
  function updCodex() {
    if (In.hit('up')) { S.codexIdx = (S.codexIdx + CODEX.length - 1) % CODEX.length; G.Aud.sfx.uiMove(); }
    if (In.hit('down')) { S.codexIdx = (S.codexIdx + 1) % CODEX.length; G.Aud.sfx.uiMove(); }
    if (In.hit('confirm')) leave();
  }

  /* ---------------- 绘制 ---------------- */
  S.draw = function (ctx) {
    S.bg.draw(ctx, S.dt, { camX: Math.sin(S.t * .0002) * 40 });
    /* 机库前景剪影 */
    ctx.save();
    ctx.fillStyle = 'rgba(6,10,18,.7)';
    ctx.fillRect(0, 0, 1280, 720);
    ctx.restore();
    G.Game.updateBlurBuf();

    /* 主面板 */
    Ui.glass(ctx, 120, 70, 1040, 580, {
      r: 22, accent: '#6fd8ff', alpha: .3, glow: 1.1, corners: true, tintColor: '#0b1728'
    });

    /* 页签 */
    for (var i = 0; i < TABS.length; i++) {
      var tx = 160 + i * 170;
      var on = i === S.tab;
      Ui.glass(ctx, tx, 92, 150, 42, {
        r: 10, accent: on ? '#9ff0ff' : '#4a6a84', alpha: on ? .38 : .2,
        glow: on ? 1.4 : .3, noise: false, tintColor: on ? '#17324f' : '#101c2c'
      });
      Ui.text(ctx, TABS[i], tx + 75, 118, {
        size: 16, weight: on ? 700 : 400, align: 'center', baseline: 'middle',
        color: on ? '#ffffff' : '#8fb0c8'
      });
    }
    Ui.text(ctx, 'Tab 切换页签', 160, 158, { size: 12, color: 'rgba(160,195,220,.65)' });

    /* 情报点 */
    Ui.badge(ctx, 1120, 96, '情报点  ' + Math.round(G.St.s.intelPoints), { accent: '#7CE04A', align: 'right', size: 15 });

    if (S.tab === 0) drawUpgrades(ctx);
    else if (S.tab === 1) drawLog(ctx);
    else drawCodex(ctx);

    if (S.flashT > 0) {
      Ui.text(ctx, S.flashMsg, 640, 674, {
        size: 15, align: 'center', color: '#ffd479', alpha: U.clamp01(S.flashT / 500)
      });
    }
    Ui.text(ctx, S.fromMap ? 'Esc 返回地图' : 'Esc / 选择「出击」继续', 1140, 676,
            { size: 12, align: 'right', color: 'rgba(180,212,235,.55)' });
  };

  function drawUpgrades(ctx) {
    Ui.header(ctx, 210, 168, 500, '机 体 整 备', { right: 'Lv. 上限 5' });
    for (var i = 0; i < UPS.length; i++) {
      var u = UPS[i];
      var lv = G.St.s.upgrades[u.key] || 0;
      var r = rowRect(i);
      var on = S.sel === i;
      var can = G.St.canUpgrade(u.key);
      Ui.glass(ctx, r.x, r.y, r.w, r.h, {
        r: 10, accent: on ? '#9ff0ff' : u.color, alpha: on ? .34 : .2,
        glow: on ? 1.3 : .4, noise: false, tintColor: U.shade(u.color, -.78)
      });
      Ui.text(ctx, u.name, r.x + 18, r.y + 24, { size: 16, weight: 600, color: on ? '#fff' : '#dbeef8' });
      Ui.text(ctx, u.desc, r.x + 18, r.y + 44, { size: 11.5, color: 'rgba(170,200,222,.8)' });
      /* 等级格 */
      for (var k = 0; k < 5; k++) {
        var bx = r.x + 300 + k * 22;
        ctx.save();
        ctx.fillStyle = k < lv ? u.color : 'rgba(255,255,255,.12)';
        U.roundRect(ctx, bx, r.y + 16, 16, 20, 3);
        ctx.fill();
        if (k < lv) {
          ctx.strokeStyle = U.rgba('#ffffff', .5); ctx.lineWidth = 1;
          U.roundRect(ctx, bx, r.y + 16, 16, 20, 3); ctx.stroke();
        }
        ctx.restore();
      }
      var cost = lv >= 5 ? '—' : G.St.upgradeCost(u.key);
      Ui.text(ctx, lv >= 5 ? 'MAX' : (cost + ' pt'), r.x + r.w - 16, r.y + 32, {
        size: 14, align: 'right', baseline: 'middle',
        color: lv >= 5 ? '#7CE04A' : (can ? '#ffd479' : '#7a8a98'), weight: 600
      });
    }

    /* 右侧：机体预览 */
    Ui.glass(ctx, 750, 206, 320, 328, { r: 14, accent: '#6fd8ff', alpha: .22, glow: .7, tintColor: '#0e1c34' });
    Ui.text(ctx, '当前机体', 770, 234, { size: 13, color: '#9fd8ff' });
    drawShipPreview(ctx, 910, 348);
    var up = G.St.s.upgrades;
    var cfg = G.diffCfg();
    var stats = [
      ['弹道', String(Math.min(3, 1 + Math.floor(up.power / 2)) * 2 + (up.power >= 4 ? 1 : 0))],
      ['耐久', String(cfg.playerHp + up.shield)],
      ['炸弹', String(cfg.bombs + Math.floor(up.bombs / 2))],
      ['机动', (cfg.playerSpd * (1 + up.speed * .06)).toFixed(1)],
      ['回归损耗', Math.max(1.5, 6 - up.buffer * 1.2).toFixed(1) + ' / 次']
    ];
    for (var w2 = 0; w2 < stats.length; w2++) {
      var ry = 424 + w2 * 21;
      Ui.text(ctx, stats[w2][0], 772, ry, { size: 13, color: '#9fc4dd' });
      Ui.text(ctx, stats[w2][1], 1050, ry, { size: 14, weight: 600, align: 'right', color: '#eaf6ff' });
    }

    /* 出击按钮 */
    var br = rowRect(UPS.length);
    Ui.button(ctx, br, S.fromMap ? '返 回 地 图' : '出 击',
              { hover: S.sel === UPS.length }, { size: 20, accent: '#ffd479' });
  }

  function drawShipPreview(ctx, x, y) {
    var up = G.St.s.upgrades;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(2.2, 2.2);
    /* 机体 */
    var g = ctx.createLinearGradient(0, -22, 0, 20);
    g.addColorStop(0, '#dff4ff'); g.addColorStop(.45, '#4FC3F7'); g.addColorStop(1, '#1a6a9a');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, -24);
    ctx.lineTo(9, -6); ctx.lineTo(24, 10); ctx.lineTo(10, 8);
    ctx.lineTo(6, 18); ctx.lineTo(-6, 18); ctx.lineTo(-10, 8);
    ctx.lineTo(-24, 10); ctx.lineTo(-9, -6);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(10,40,70,.9)'; ctx.lineWidth = 1.4; ctx.stroke();
    /* 装甲分割线与铆钉，别让机体只是一个纯色箭头 */
    ctx.strokeStyle = 'rgba(10,40,70,.55)'; ctx.lineWidth = .9;
    ctx.beginPath();
    ctx.moveTo(-9, -6); ctx.lineTo(9, -6);
    ctx.moveTo(-10, 8); ctx.lineTo(10, 8);
    ctx.moveTo(0, -24); ctx.lineTo(0, 18);
    ctx.moveTo(-16, 9.2); ctx.lineTo(-11, 2);
    ctx.moveTo(16, 9.2); ctx.lineTo(11, 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    for (var rv = 0; rv < 4; rv++) {
      ctx.fillRect(-1 - 7, -2 + rv * 5, 1.4, 1.4);
      ctx.fillRect(1 + 6, -2 + rv * 5, 1.4, 1.4);
    }
    /* 机翼上缘高光 */
    ctx.strokeStyle = 'rgba(230,250,255,.7)'; ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(-9, -6); ctx.lineTo(-24, 10);
    ctx.moveTo(9, -6); ctx.lineTo(24, 10);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.beginPath(); ctx.ellipse(0, -8, 4, 7, 0, 0, U.TAU); ctx.fill();
    /* 强化件 */
    if (up.power > 0) {
      ctx.fillStyle = '#FF6B4A';
      for (var i = 0; i < Math.min(3, up.power); i++) {
        ctx.fillRect(-26 - i * 4, 2, 6, 3);
        ctx.fillRect(20 + i * 4, 2, 6, 3);
      }
    }
    if (up.shield > 0) {
      ctx.strokeStyle = U.rgba('#5AD8C8', .5 + up.shield * .08);
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(0, 0, 30, 0, U.TAU); ctx.stroke();
    }
    if (up.speed > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      var fg = ctx.createLinearGradient(0, 16, 0, 16 + 12 + up.speed * 4);
      fg.addColorStop(0, 'rgba(200,245,255,.9)');
      fg.addColorStop(1, 'rgba(80,190,255,0)');
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.moveTo(-5, 16); ctx.lineTo(5, 16); ctx.lineTo(0, 16 + 14 + up.speed * 5);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawLog(ctx) {
    var list = G.St.intelList();
    Ui.header(ctx, 210, 168, 850, '情 报 日 志', { right: list.length + ' 条  ·  跨轮回保留' });
    if (!list.length) {
      Ui.text(ctx, '还没有情报。多和人说话，多看那些没人看的东西。', 640, 380,
              { size: 16, align: 'center', color: 'rgba(190,215,235,.7)' });
      return;
    }
    var start = U.clamp(S.logIdx - 5, 0, Math.max(0, list.length - 12));
    for (var i = 0; i < Math.min(12, list.length - start); i++) {
      var it = list[start + i];
      var y = 214 + i * 34;
      var on = (start + i) === S.logIdx;
      if (on) Ui.glass(ctx, 210, y - 4, 850, 30, { r: 6, accent: '#9ff0ff', alpha: .28, glow: 1, noise: false, tintColor: '#16304e' });
      Ui.text(ctx, '◆', 224, y + 16, { size: 11, baseline: 'middle', color: '#7CE04A' });
      Ui.text(ctx, it.label, 246, y + 16, {
        size: 14.5, baseline: 'middle', color: on ? '#ffffff' : '#d3e6f2'
      });
    }
    Ui.text(ctx, '这些记忆不会因为回归而消失 —— 这是「负世」唯一的好处。', 640, 630,
            { size: 13, align: 'center', color: 'rgba(180,210,232,.6)' });
  }

  function drawCodex(ctx) {
    Ui.header(ctx, 210, 168, 850, '角 色 档 案', { right: '↑↓ 选择' });
    for (var i = 0; i < CODEX.length; i++) {
      var ch = G.charOf(CODEX[i]);
      var known = G.Save.data.codex[CODEX[i]] || i < 2;
      var y = 212 + i * 38;
      var on = i === S.codexIdx;
      if (on) Ui.glass(ctx, 210, y - 6, 330, 34, { r: 6, accent: ch.color, alpha: .3, glow: 1, noise: false, tintColor: U.shade(ch.color, -.75) });
      G.Portrait.thumb(ctx, ch, 232, y + 11, 26, { emo: ch.defaultEmo });
      Ui.text(ctx, known ? ch.name : '？？？', 256, y + 16, {
        size: 14.5, baseline: 'middle', color: on ? '#fff' : (known ? '#cfe6f7' : 'rgba(150,175,195,.5)')
      });
      if (G.St.isDead(CODEX[i])) {
        Ui.text(ctx, '已故', 528, y + 16, { size: 11, align: 'right', baseline: 'middle', color: '#ff8a9a' });
      }
    }
    var cid = CODEX[S.codexIdx];
    var cch = G.charOf(cid);
    var kn = G.Save.data.codex[cid] || S.codexIdx < 2;
    Ui.glass(ctx, 560, 206, 500, 400, { r: 14, accent: cch.color, alpha: .24, glow: .8, tintColor: U.shade(cch.color, -.8) });
    if (kn) {
      G.Portrait.draw(ctx, cch, 665, 452, 1.80, {
        emo: cch.defaultEmo, t: S.t, breathT: S.t,
        decay: cid === 'ty' ? G.St.s.tyDecay : 0,
        alt: (cid === 'madman' && G.St.flag('madmanRevealed')) || (cid === 'friend' && G.St.flag('friendRevealed')) ? 1 : 0
      });
      Ui.text(ctx, cch.name, 790, 250, { size: 26, weight: 800, color: cch.color, glow: 1, glowColor: cch.color });
      Ui.text(ctx, cch.title || '', 790, 276, { size: 12, color: '#a8c8dd' });
      ctx.font = '400 13.5px ' + G.FONT;
      var ls = U.wrapText(ctx, cch.codex || '（还不了解这个人。）', 250);
      for (var k = 0; k < ls.length; k++) {
        Ui.text(ctx, ls[k], 790, 312 + k * 23, { size: 13.5, color: '#dbeef8' });
      }
      if (cid === 'ty' && G.St.s.tyDecay > 0) {
        Ui.text(ctx, '副作用累积：' + G.St.s.tyDecay + ' / 5', 790, 560, { size: 13, color: '#ff9f9f' });
      }
    } else {
      Ui.text(ctx, '尚未遭遇', 810, 400, { size: 22, weight: 700, align: 'center', color: 'rgba(150,175,195,.5)' });
    }
  }

  S.debugInfo = function () { return ['hangar tab ' + S.tab]; };

  G.Sc.register('hangar', S);

})(window);
