/* ===========================================================
   pause.js — 暂停覆盖层：继续 / 设置 / 对话回顾 / 返回标题
   由 game.js 在 paused 时调用 Game.pauseOverlay(ctx)
   =========================================================== */
(function (root) {
  'use strict';
  var G = root.G, U = G.U, Ui = G.Ui, In = G.In;

  var P = {
    mode: 'menu',        // menu / settings / log
    menu: null,
    setIdx: 0,
    logScroll: 0,
    t: 0,
    a: 0
  };

  var SET_ROWS = [
    { id: 'volMaster', label: '主音量', type: 'slider' },
    { id: 'volBgm', label: 'BGM', type: 'slider' },
    { id: 'volSfx', label: '音效', type: 'slider' },
    { id: 'volVoice', label: '角色哔声', type: 'slider' },
    { id: 'textSpeed', label: '文本速度', type: 'enum', vals: [0.6, 1, 1.8], names: ['慢', '普通', '快'] },
    { id: 'shake', label: '画面震动', type: 'enum', vals: [0, 1], names: ['关闭', '开启'] },
    { id: 'showHitbox', label: '显示判定点', type: 'enum', vals: [false, true], names: ['隐藏', '显示'] },
    { id: 'autoFire', label: '自动射击', type: 'enum', vals: [false, true], names: ['关闭', '开启'] },
    { id: '_back', label: '返回', type: 'action' }
  ];

  function buildMenu() {
    var items = [
      { label: '继 续', id: 'resume' },
      { label: '对 话 回 顾', id: 'log' },
      { label: '难 度', id: 'diff', hint: G.Diff[G.Save.settings().difficulty].label },
      { label: '设 置', id: 'settings' },
      { label: '返 回 标 题', id: 'title', hint: '进度不保存' }
    ];
    P.menu = new Ui.Menu(items, { size: 19 });
  }

  G.Pause = P;

  /* 进入暂停时重置 */
  P.open = function () {
    P.mode = 'menu';
    P.setIdx = 0;
    P.logScroll = 0;
    P.a = 0;
    /* 触发暂停的那一帧，Escape 仍在 pressed 里 —— 必须跳过一帧，否则立刻自关 */
    P.guard = 2;
    buildMenu();
  };

  /* game.js 每帧在 paused 时调用（用真实时间，不受 timeScale / tween 影响） */
  G.Game.pauseOverlay = function (ctx) {
    P.t += 16.7;
    if (!P.menu) P.open();
    /* 暂停时 Tw.tick(0) 不推进补间，淡入必须自己算 */
    P.a = Math.min(1, P.a + 0.09);
    update();
    draw(ctx);
  };

  function close() {
    G.Game.paused = false;
    G.Aud.duck(300, 1);
    G.Aud.sfx.uiOk();
    G.Save.save();
  }

  function update() {
    if (P.guard > 0) { P.guard--; return; }
    if (P.mode === 'menu') {
      var pick = P.menu.update();
      if (In.hit('pause') || In.hit('cancel')) { close(); return; }
      if (!pick) return;
      if (pick.id === 'resume') close();
      else if (pick.id === 'settings') { P.mode = 'settings'; P.setIdx = 0; }
      else if (pick.id === 'log') { P.mode = 'log'; P.logScroll = 0; }
      else if (pick.id === 'diff') {
        /* 中途切难度：立刻生效于下一场战斗 */
        var list = G.diffList;
        var i = (list.indexOf(G.Save.settings().difficulty) + 1) % list.length;
        G.Save.settings().difficulty = list[i];
        G.Save.save();
        G.Aud.sfx.powerup();
        buildMenu();
        P.menu.i = 2;
      }
      else if (pick.id === 'title') {
        G.Game.paused = false;
        G.Aud.duck(300, 1);
        G.Save.save();
        G.Sc.go('title', {}, { trans: 'fade', ms: 800 });
      }
      return;
    }

    if (P.mode === 'log') {
      var n = G.Dlg.log.length;
      if (In.hit('up')) P.logScroll = Math.max(0, P.logScroll - 1);
      if (In.hit('down')) P.logScroll = Math.min(Math.max(0, n - 14), P.logScroll + 1);
      if (In.wheel) P.logScroll = U.clamp(P.logScroll + In.wheel * 2, 0, Math.max(0, n - 14));
      if (In.hit('cancel') || In.hit('confirm') || In.hit('pause')) { P.mode = 'menu'; G.Aud.sfx.uiBack(); }
      return;
    }

    /* settings */
    var st = G.Save.settings();
    if (In.hit('up')) { P.setIdx = (P.setIdx + SET_ROWS.length - 1) % SET_ROWS.length; G.Aud.sfx.uiMove(); }
    if (In.hit('down')) { P.setIdx = (P.setIdx + 1) % SET_ROWS.length; G.Aud.sfx.uiMove(); }
    var row = SET_ROWS[P.setIdx];
    var dir = 0;
    if (In.hit('right')) dir = 1;
    if (In.hit('left')) dir = -1;
    if (row.type === 'slider') {
      if (In.down('right')) dir = 1;
      if (In.down('left')) dir = -1;
      if (dir) {
        st[row.id] = U.clamp01(st[row.id] + dir * 0.02);
        G.Aud.setVol(row.id === 'volMaster' ? 'master' : row.id === 'volBgm' ? 'bgm'
                     : row.id === 'volSfx' ? 'sfx' : 'voice', st[row.id]);
      }
    } else if (row.type === 'enum' && dir) {
      var i = row.vals.indexOf(st[row.id]);
      if (i < 0) i = 0;
      i = U.clamp(i + dir, 0, row.vals.length - 1);
      st[row.id] = row.vals[i];
      G.Aud.sfx.uiOk();
    } else if (row.type === 'action' && In.hit('confirm')) {
      P.mode = 'menu'; G.Aud.sfx.uiBack(); G.Save.save(); return;
    }
    if (In.hit('cancel') || In.hit('pause')) { P.mode = 'menu'; G.Aud.sfx.uiBack(); G.Save.save(); }
  }

  function draw(ctx) {
    var a = P.a;
    ctx.save();
    /* 压得足够暗：暂停是模态层，底下的对话框边框和霓虹会从 .72 的幕布里穿出来，
       看起来像两层界面叠在一起 */
    ctx.globalAlpha = a * .86;
    ctx.fillStyle = '#04060d';
    ctx.fillRect(0, 0, 1280, 720);
    ctx.restore();
    G.Game.updateBlurBuf();

    ctx.save();
    ctx.globalAlpha = a;

    if (P.mode === 'menu') {
      var mw = 360, mh = 52, gap = 12;
      var n = P.menu.items.length;
      var bx = 640 - mw / 2 - 40, by = 190;
      Ui.glass(ctx, bx, by, mw + 80, n * (mh + gap) + 132, {
        r: 20, accent: '#6fd8ff', alpha: .3, glow: 1, corners: true, tintColor: '#0c1830'
      });
      Ui.spaced(ctx, '暂 停', 640, by + 48, {
        size: 32, weight: 800, align: 'center', spacing: 10,
        gradient: ['#ffffff', '#8fd8ff'], glow: 1, glowColor: '#4fa8ff'
      });
      P.menu.draw(ctx, 640 - mw / 2, by + 86, mw, mh, gap);
      /* 当前进度摘要 */
      var s = G.St.s;
      var line = G.Story.hudLabel() + '    回归 ×' + s.loopCount + '    精神 ' + Math.round(s.sanity);
      Ui.text(ctx, line, 640, by + 86 + n * (mh + gap) + 24, {
        size: 13, align: 'center', color: 'rgba(180,212,235,.75)'
      });

    } else if (P.mode === 'settings') {
      Ui.glass(ctx, 200, 110, 880, 500, { r: 20, accent: '#6fd8ff', alpha: .3, glow: 1, corners: true, tintColor: '#0c1830' });
      Ui.header(ctx, 236, 128, 808, '设 置', { right: 'Esc 返回' });
      var st = G.Save.settings();
      for (var i = 0; i < SET_ROWS.length; i++) {
        var r = SET_ROWS[i];
        var y = 220 + i * 42;
        var sel = i === P.setIdx;
        if (sel) Ui.glass(ctx, 250, y - 17, 780, 36, { r: 8, accent: '#9ff0ff', alpha: .3, glow: 1.3, noise: false, tintColor: '#16304e' });
        Ui.text(ctx, r.label, 272, y + 1, {
          size: 16, baseline: 'middle', color: sel ? '#fff' : '#bcd8ea', weight: sel ? 600 : 400
        });
        if (r.type === 'slider') {
          Ui.tube(ctx, 520, y - 8, 320, 16, st[r.id], { color: sel ? '#9ff0ff' : '#6fd8ff' });
          Ui.text(ctx, Math.round(st[r.id] * 100) + '%', 1010, y + 1, { size: 14, align: 'right', baseline: 'middle', color: '#9fc4dd' });
        } else if (r.type === 'enum') {
          var idx = r.vals.indexOf(st[r.id]);
          if (idx < 0) idx = 0;
          Ui.text(ctx, '‹ ' + r.names[idx] + ' ›', 700, y + 1, {
            size: 16, align: 'center', baseline: 'middle', color: sel ? '#9ff0ff' : '#bcd8ea', weight: 600
          });
        } else {
          Ui.text(ctx, sel ? '按 Enter' : '', 1010, y + 1, { size: 13, align: 'right', baseline: 'middle', color: '#9fc4dd' });
        }
      }
      Ui.text(ctx, '← → 调整    ↑ ↓ 选择', 640, 592, { size: 13, align: 'center', color: 'rgba(180,212,235,.6)' });

    } else {
      /* 对话回顾 */
      Ui.glass(ctx, 150, 80, 980, 560, { r: 20, accent: '#6fd8ff', alpha: .3, glow: 1, corners: true, tintColor: '#0c1830' });
      Ui.header(ctx, 186, 98, 908, '对 话 回 顾', { right: G.Dlg.log.length + ' 条  ·  ↑↓ 滚动' });
      var log = G.Dlg.log;
      var start = U.clamp(log.length - 14 - P.logScroll, 0, Math.max(0, log.length - 1));
      var shown = log.slice(start, start + 14);
      for (var k = 0; k < shown.length; k++) {
        var e = shown[k];
        var ch = G.charOf(e.who);
        var ly = 168 + k * 33;
        var nm = ch.name || '';
        ctx.font = '600 13px ' + G.FONT;
        var nwd = nm ? ctx.measureText(nm).width + 10 : 0;
        if (nm) Ui.text(ctx, nm, 200, ly, { size: 13, weight: 600, color: ch.color });
        ctx.font = '400 15px ' + G.FONT;
        var txt = e.text;
        while (ctx.measureText(txt).width > 860 - nwd && txt.length > 4) txt = txt.slice(0, -2);
        if (txt !== e.text) txt += '…';
        Ui.text(ctx, txt, 200 + nwd + 8, ly, { size: 15, color: e.who === 'narrator' ? '#a8c8dd' : '#e4f0fa' });
      }
      if (!log.length) {
        Ui.text(ctx, '还没有对话记录。', 640, 360, { size: 16, align: 'center', color: 'rgba(190,215,235,.7)' });
      }
      /* 滚动条 */
      if (log.length > 14) {
        var trackH = 460;
        var ratio = 14 / log.length;
        var hh = Math.max(30, trackH * ratio);
        var maxScroll = Math.max(1, log.length - 14);
        var pos = (1 - P.logScroll / maxScroll) * (trackH - hh);
        ctx.fillStyle = 'rgba(255,255,255,.08)';
        U.roundRect(ctx, 1096, 150, 6, trackH, 3); ctx.fill();
        ctx.fillStyle = 'rgba(150,220,255,.6)';
        U.roundRect(ctx, 1096, 150 + pos, 6, hh, 3); ctx.fill();
      }
    }
    ctx.restore();
  }

})(window);
