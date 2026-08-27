/* ===========================================================
   scene_title.js — 标题 / 难度 / 设置 / 结局图鉴 / 角色档案
   =========================================================== */
(function (root) {
  'use strict';
  var G = root.G, U = G.U, Ui = G.Ui, In = G.In;

  var S = {
    mode: 'main',
    bg: null,
    t: 0,
    menu: null,
    diffMenu: null,
    galIdx: 0,
    codexIdx: 0,
    setIdx: 0,
    wipeArm: 0,
    newGameArm: 0,
    titleT: 0,
    hero: null, ty: null
  };

  var ENDING_ORDER = ['good', 'if', 'badA', 'badB', 'badC', 'badD', 'badE'];

  function buildMain() {
    var items = [];
    /* 有进行中的一轮就把「继续」放在第一位，并且默认选中它 */
    if (G.Save.hasRun()) {
      var r = G.Save.loadRun();
      items.push({ label: '继 续', id: 'continue',
                   hint: chapName(r.chapter || 0) + ' · 回归 ×' + (r.loops || 0) + ' · 精神 ' + (r.sanity === undefined ? '—' : r.sanity) });
    }
    items.push({ label: '开 始 新 的 轮 回', id: 'start' });
    if (G.Save.data.progress.maxChapter > 0) {
      items.push({ label: '章 节 选 择', id: 'chapters', hint: '最高 ' + chapName(G.Save.data.progress.maxChapter) });
    }
    items.push({ label: '难 度', id: 'diff', hint: G.Diff[G.Save.settings().difficulty].label });
    items.push({ label: '设 置', id: 'settings' });
    items.push({ label: '结 局 图 鉴', id: 'gallery', hint: G.Save.endingCount() + ' / 7' });
    items.push({ label: '角 色 档 案', id: 'codex' });
    S.menu = new Ui.Menu(items, { size: 19 });
    S.newGameArm = 0;
  }

  function chapName(n) {
    return ['序章', '第一章', '第二章', '第三章', '第四章', '第五章', '第六章'][n] || ('第' + n + '章');
  }

  S.enter = function () {
    S.bg = G.Art.scene('title');
    S.mode = 'main';
    S.t = 0; S.titleT = 0;
    buildMain();
    G.Fx.reset();
    G.Fx.setVignette(.3);
    G.Fx.grain = .5;
    G.Aud.playBgm('title', { fade: 1600 });
    G.Dlg.clearStage();
    /* 主视觉：主角在右侧压住画面（脚被画面下缘裁掉），TY 只在最左边留一个远景剪影 */
    S.hero = { x: 958, y: 512, scale: 5.0, t: 0 };
    S.ty = { x: 1214, y: 548, scale: 2.55, t: 900 };
  };

  S.exit = function () {
    G.Tw.killTag('title');
  };

  /* ---------------- 更新 ---------------- */
  S.update = function (dt) {
    S.t += dt;
    S.titleT += dt;
    if (S.newGameArm > 0) S.newGameArm -= dt;
    if (S.mode === 'main') updMain();
    else if (S.mode === 'diff') updDiff();
    else if (S.mode === 'settings') updSettings(dt);
    else if (S.mode === 'gallery') updGallery();
    else if (S.mode === 'codex') updCodex();
    else if (S.mode === 'chapters') updChapters();
  };

  function updMain() {
    var pick = S.menu.update();
    if (!pick) return;
    if (pick.id === 'continue') {
      G.Aud.stopBgm(700);
      G.Story.continueRun();
    } else if (pick.id === 'start') {
      /* 有存档在跑的时候，「开始新的轮回」会覆盖它——要先问一声 */
      if (G.Save.hasRun() && S.newGameArm <= 0) {
        S.newGameArm = 3200;
        G.Aud.sfx.uiDeny();
        return;
      }
      S.newGameArm = 0;
      G.Aud.stopBgm(700);
      G.St.reset();
      G.Story.startNewGame();
    } else if (pick.id === 'diff') {
      S.mode = 'diff';
      S.diffMenu = new Ui.Menu(G.diffList.map(function (k) {
        /* 不带 sub：说明会画在按钮右侧，正好被右边那张详情卡切掉半句 */
        return { label: G.Diff[k].label, id: k };
      }), { size: 20 });
      S.diffMenu.i = G.diffList.indexOf(G.Save.settings().difficulty);
    } else if (pick.id === 'settings') { S.mode = 'settings'; S.setIdx = 0; }
    else if (pick.id === 'gallery') { S.mode = 'gallery'; S.galIdx = 0; }
    else if (pick.id === 'codex') { S.mode = 'codex'; S.codexIdx = 0; }
    else if (pick.id === 'chapters') { S.mode = 'chapters'; buildChapters(); }
  }

  function updDiff() {
    var pick = S.diffMenu.update();
    if (pick) {
      G.Save.settings().difficulty = pick.id;
      G.Save.save();
      S.mode = 'main'; buildMain();
      G.Aud.sfx.powerup();
    }
    if (In.hit('cancel')) { S.mode = 'main'; buildMain(); G.Aud.sfx.uiBack(); }
  }

  var SET_ROWS = [
    { id: 'volMaster', label: '主音量', type: 'slider' },
    { id: 'volBgm', label: 'BGM', type: 'slider' },
    { id: 'volSfx', label: '音效', type: 'slider' },
    { id: 'volVoice', label: '角色哔声', type: 'slider' },
    { id: 'textSpeed', label: '文本速度', type: 'enum', vals: [0.6, 1, 1.8], names: ['慢', '普通', '快'] },
    { id: 'shake', label: '画面震动', type: 'enum', vals: [0, 1], names: ['关闭', '开启'] },
    { id: 'flash', label: '闪光与故障特效', type: 'enum', vals: [0, 1], names: ['削弱', '开启'] },
    { id: 'showHitbox', label: '显示判定点', type: 'enum', vals: [false, true], names: ['隐藏', '显示'] },
    { id: 'autoFire', label: '自动射击', type: 'enum', vals: [false, true], names: ['关闭', '开启'] },
    { id: '_wipe', label: '清除所有存档数据', type: 'action' },
    { id: '_back', label: '返回', type: 'action' }
  ];

  /* 行距按行数算，加一项不会顶出面板底边 */
  function setRowY(i) { return 196 + i * Math.min(40, Math.floor(376 / SET_ROWS.length)); }

  var SET_HELP = {
    textSpeed: '对话逐字显示的速度。按住 Ctrl 可临时加速。',
    shake: '关闭后不再有镜头震动——晕动症友好。',
    flash: '「削弱」会把全屏白闪与故障撕裂压到安全亮度并放慢过渡，演出仍然保留。光敏性癫痫请选此项。',
    showHitbox: '战斗中始终显示机体正中央的受击判定点。',
    autoFire: '开启后无需连按射击键。',
    _wipe: '清空结局图鉴、角色档案与全部进度。此操作不可撤销。'
  };

  function updSettings(dt) {
    var st = G.Save.settings();
    if (S.wipeArm > 0) S.wipeArm -= dt;
    if (In.hit('up')) { S.setIdx = (S.setIdx + SET_ROWS.length - 1) % SET_ROWS.length; G.Aud.sfx.uiMove(); S.wipeArm = 0; }
    if (In.hit('down')) { S.setIdx = (S.setIdx + 1) % SET_ROWS.length; G.Aud.sfx.uiMove(); S.wipeArm = 0; }
    var row = SET_ROWS[S.setIdx];
    var dir = 0;
    if (In.hit('right')) dir = 1;
    if (In.hit('left')) dir = -1;
    if (row.type === 'slider') {
      if (In.down('right')) dir = 1;
      if (In.down('left')) dir = -1;
      if (dir) {
        st[row.id] = U.clamp01(st[row.id] + dir * dt * 0.0012);
        G.Aud.setVol(row.id.replace('vol', '').toLowerCase() === 'master' ? 'master' :
                     row.id === 'volBgm' ? 'bgm' : row.id === 'volSfx' ? 'sfx' : 'voice', st[row.id]);
        if (Math.random() < .1) G.Aud.sfx.uiMove();
      }
    } else if (row.type === 'enum' && dir) {
      var i = row.vals.indexOf(st[row.id]);
      if (i < 0) i = 0;
      i = U.clamp(i + dir, 0, row.vals.length - 1);
      st[row.id] = row.vals[i];
      G.Aud.sfx.uiOk();
      if (row.id === 'volMaster') G.Aud.setVol('master', st[row.id]);
    } else if (row.type === 'action' && In.hit('confirm')) {
      if (row.id === '_back') { save(); S.mode = 'main'; buildMain(); G.Aud.sfx.uiBack(); }
      else if (row.id === '_wipe') {
        /* 两段确认：结局图鉴和角色档案是全部 meta 进度，不能一键抹掉 */
        if (S.wipeArm > 0) { S.wipeArm = 0; G.Save.wipe(); G.Aud.sfx.glitch ? G.Aud.sfx.glitch(6) : G.Aud.sfx.uiDeny(); buildMain(); }
        else { S.wipeArm = 3000; G.Aud.sfx.uiDeny(); }
      }
      return;
    }
    if (In.hit('cancel')) { save(); S.wipeArm = 0; S.mode = 'main'; buildMain(); G.Aud.sfx.uiBack(); }
    /* 鼠标点击行 */
    if (In.mclick) {
      for (var k = 0; k < SET_ROWS.length; k++) {
        var y = setRowY(k);
        if (U.pointInRect(In.mx, In.my, 350, y - 17, 600, 34)) {
          if (S.setIdx !== k) S.wipeArm = 0;
          S.setIdx = k;
          var r = SET_ROWS[k];
          if (r.type === 'slider') {
            st[r.id] = U.clamp01((In.mx - 560) / 300);
            G.Aud.setVol(r.id === 'volMaster' ? 'master' : r.id === 'volBgm' ? 'bgm' : r.id === 'volSfx' ? 'sfx' : 'voice', st[r.id]);
          } else if (r.type === 'enum') {
            var ii = r.vals.indexOf(st[r.id]); ii = (ii + 1) % r.vals.length;
            st[r.id] = r.vals[ii]; G.Aud.sfx.uiOk();
          } else if (r.id === '_back') { save(); S.mode = 'main'; buildMain(); }
          else if (r.id === '_wipe') {
            if (S.wipeArm > 0) { S.wipeArm = 0; G.Save.wipe(); buildMain(); }
            else { S.wipeArm = 3000; G.Aud.sfx.uiDeny(); }
          }
        }
      }
    }
    function save() { G.Save.save(); }
  }

  function updGallery() {
    if (In.hit('left')) { S.galIdx = (S.galIdx + ENDING_ORDER.length - 1) % ENDING_ORDER.length; G.Aud.sfx.uiMove(); }
    if (In.hit('right')) { S.galIdx = (S.galIdx + 1) % ENDING_ORDER.length; G.Aud.sfx.uiMove(); }
    if (In.hit('up')) { S.galIdx = (S.galIdx + ENDING_ORDER.length - 1) % ENDING_ORDER.length; G.Aud.sfx.uiMove(); }
    if (In.hit('down')) { S.galIdx = (S.galIdx + 1) % ENDING_ORDER.length; G.Aud.sfx.uiMove(); }
    if (In.hit('cancel') || In.hit('confirm')) { S.mode = 'main'; buildMain(); G.Aud.sfx.uiBack(); }
  }

  var CODEX_IDS = ['hero', 'ty', 'oldman', 'upright', 'madman', 'lucky', 'friend', 'puppet', 'shadow', 'savior'];
  function updCodex() {
    if (In.hit('up')) { S.codexIdx = (S.codexIdx + CODEX_IDS.length - 1) % CODEX_IDS.length; G.Aud.sfx.uiMove(); }
    if (In.hit('down')) { S.codexIdx = (S.codexIdx + 1) % CODEX_IDS.length; G.Aud.sfx.uiMove(); }
    if (In.wheel) { S.codexIdx = U.clamp(S.codexIdx + In.wheel, 0, CODEX_IDS.length - 1); }
    if (In.hit('cancel')) { S.mode = 'main'; buildMain(); G.Aud.sfx.uiBack(); }
  }

  var chapMenu = null;
  function buildChapters() {
    var max = G.Save.data.progress.maxChapter;
    var items = [];
    for (var i = 0; i <= max; i++) {
      items.push({ label: chapName(i), id: 'ch' + i, sub: G.Story.chapterTitle(i) });
    }
    items.push({ label: '返回', id: 'back' });
    chapMenu = new Ui.Menu(items, { size: 19 });
  }
  function updChapters() {
    var pick = chapMenu.update();
    if (pick) {
      if (pick.id === 'back') { S.mode = 'main'; buildMain(); return; }
      var n = parseInt(pick.id.substring(2), 10);
      G.Aud.stopBgm(500);
      G.St.reset();
      G.Story.startAtChapter(n);
      return;
    }
    if (In.hit('cancel')) { S.mode = 'main'; buildMain(); G.Aud.sfx.uiBack(); }
  }

  /* ---------------- 绘制 ---------------- */
  S.draw = function (ctx) {
    S.bg.draw(ctx, 16.7, { camX: Math.sin(S.t * .00013) * 60 });
    G.Game.updateBlurBuf();

    /* 两侧剪影 */
    drawSilhouettes(ctx);

    if (S.mode === 'main') drawMain(ctx);
    else if (S.mode === 'diff') drawDiff(ctx);
    else if (S.mode === 'settings') drawSettings(ctx);
    else if (S.mode === 'gallery') drawGallery(ctx);
    else if (S.mode === 'codex') drawCodex(ctx);
    else if (S.mode === 'chapters') drawChapters(ctx);
  };

  /* 日系标题构成：右侧一张大立绘压住画面，左上细体标题，
     菜单沿斜线向右下错位排开。斜切角统一由 Ui.SKEW 控制。 */
  function drawSilhouettes(ctx) {
    var main = S.mode === 'main';
    ctx.save();
    /* TY：远景剪影，站在最左边，只是一个「另一个人也在」的暗示 */
    ctx.globalAlpha = main ? .55 : .18;
    G.Portrait.draw(ctx, G.Chars.ty, S.ty.x, S.ty.y, S.ty.scale, {
      emo: 'cold', t: S.t + S.ty.t, breathT: S.t + S.ty.t,
      turn: .30, tintColor: '#0a1428', tintAmt: .72
    });
    ctx.restore();

    /* 主角：右侧主视觉。入场时从右下滑入并淡出遮罩。 */
    var p = U.smootherstep(U.clamp01(S.titleT / 1100));
    ctx.save();
    ctx.globalAlpha = main ? p : .22;
    G.Portrait.draw(ctx, G.Chars.hero, S.hero.x + (1 - p) * 46, S.hero.y + (1 - p) * 30,
                    S.hero.scale, {
      emo: 'fear', t: S.t + S.hero.t, breathT: S.t + S.hero.t,
      turn: -.34,
      tintColor: main ? '#16243c' : '#0a1428', tintAmt: main ? .14 : .6
    });
    ctx.restore();
  }

  function drawMain(ctx) {
    var tp = U.clamp01(S.titleT / 900);
    var a = U.smootherstep(tp);

    /* 左侧压暗：一条斜向的暗色，把文字从背景和立绘里托出来。
       没有这层，细体标题压在云上完全读不出来。 */
    ctx.save();
    var g = ctx.createLinearGradient(0, 720, 900, 0);
    g.addColorStop(0, 'rgba(4,8,18,.86)');
    g.addColorStop(.55, 'rgba(5,10,22,.60)');
    g.addColorStop(1, 'rgba(6,12,24,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(700, 0); ctx.lineTo(860, 720); ctx.lineTo(0, 720);
    ctx.closePath();
    ctx.fill();
    /* 分界斜线：一根亮线 + 一条极窄的高光 */
    ctx.globalAlpha = a * .5;
    ctx.strokeStyle = 'rgba(140,215,255,.55)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(700, 0); ctx.lineTo(860, 720); ctx.stroke();
    ctx.restore();

    /* 标题 */
    var slide = (1 - a) * -30;
    Ui.titleBlock(ctx, 96 + slide, 116, '死亡回归线',
                  'D E A T H   R E T U R N   L I N E',
                  '2.5D RPG × 弹幕飞机大战',
                  { alpha: a, size: 56, spacing: 12, accent: '#7fe0ff', rule: 1.06 });

    /* 菜单 */
    S.menu.drawSlash(ctx, {
      x: 100, y: 286, w: 252, h: 46, gap: 10, step: 22,
      size: 19, accent: '#7fe0ff', t: S.titleT
    });

    /* 覆盖存档的二次确认提示 */
    if (S.newGameArm > 0) {
      var wa = U.clamp01(S.newGameArm / 400);
      ctx.save();
      ctx.globalAlpha = wa;
      Ui.badge(ctx, 104, 596, '再按一次 —— 这会覆盖进行中的那一轮',
               { accent: '#ff9f9f', color: '#ffe0e0', size: 13 });
      ctx.restore();
    }

    /* 底部提示 + 解锁徽标，都贴着左下角，不再居中 */
    ctx.save();
    ctx.globalAlpha = U.clamp01((S.titleT - 900) / 500);
    Ui.text(ctx, '↑↓ 选择    Enter / Z 确认    Esc 返回', 104, 676,
            { size: 12, color: 'rgba(180,212,235,.55)' });
    if (G.Save.data.progress.ifSeen) {
      Ui.badge(ctx, 104, 636, '★ 你已见过那个没有救世主的世界',
               { accent: '#ffe9a8', color: '#fff6d8', size: 12 });
    } else if (G.Save.data.progress.cleared) {
      Ui.badge(ctx, 104, 636, '晚安……我的救世主。',
               { accent: '#E0E6ED', color: '#eef4fa', size: 12 });
    }
    ctx.restore();
  }

  function panel(ctx, title, right) {
    /* 压暗整屏：不然标题立绘的腿会从面板下缘露出来，像画错了。
       斜向渐变保持和主菜单同一套构成语言。 */
    ctx.save();
    var g = ctx.createLinearGradient(0, 720, 1100, 0);
    g.addColorStop(0, 'rgba(3,6,14,.90)');
    g.addColorStop(1, 'rgba(5,10,22,.72)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1280, 720);
    ctx.restore();
    /* 切角面板：和圆角框相比，切角是这一套 UI 的识别符 */
    Ui.glass(ctx, 150, 90, 980, 540, {
      cut: 24, accent: '#7fe0ff', alpha: .26, glow: 1, corners: true, tintColor: '#0b1526'
    });
    /* 标题：细体 + 左侧一根粗端条，和主菜单选中项同构 */
    ctx.save();
    ctx.fillStyle = 'rgba(127,224,255,.85)';
    Ui.paraPath(ctx, 178, 106, 6, 30, 5);
    ctx.fill();
    ctx.restore();
    Ui.text(ctx, title, 200, 130, {
      size: 25, weight: 300, baseline: 'middle', color: '#eaf6ff', sx: 1, sy: 2
    });
    if (right) {
      Ui.text(ctx, right, 1096, 130, {
        size: 12, align: 'right', baseline: 'middle', color: 'rgba(180,212,235,.6)'
      });
    }
    /* 标题下的分隔线，右端收细 */
    var gl = ctx.createLinearGradient(178, 0, 1100, 0);
    gl.addColorStop(0, 'rgba(127,224,255,.55)');
    gl.addColorStop(.8, 'rgba(127,224,255,.16)');
    gl.addColorStop(1, 'rgba(127,224,255,0)');
    ctx.fillStyle = gl;
    ctx.fillRect(178, 150, 922, 1);
  }

  function drawDiff(ctx) {
    panel(ctx, '难 度 选 择', 'Esc 返回');
    Ui.text(ctx, '难度决定小怪出怪量、血量速度、Boss 弹幕设计与奖励倍率。', 190, 178, { size: 14, color: '#a8c8dd' });
    S.diffMenu.draw(ctx, 210, 210, 300, 58, 20);
    /* 详情 */
    var k = G.diffList[S.diffMenu.i];
    var d = G.Diff[k];
    var bx = 560, by = 210;
    Ui.glass(ctx, bx, by, 530, 300, { r: 14, accent: d.color, alpha: .26, glow: 1, tintColor: U.shade(d.color, -.78) });
    Ui.text(ctx, d.label, bx + 26, by + 44, { size: 30, weight: 800, color: d.color, glow: 1, glowColor: d.color });
    Ui.text(ctx, d.desc, bx + 26, by + 76, { size: 14, color: '#d8ecf8' });
    var rows = [
      ['小怪出怪量', k === 'easy' ? '稀疏 · 单一种类' : k === 'normal' ? '中等 · 2–3 种混合' : '密集 · 4 种以上混合编队'],
      ['小怪血量 / 速度', k === 'easy' ? '低 / 慢' : k === 'normal' ? '中 / 中' : '高 / 快'],
      ['Boss 血量', k === 'easy' ? '低' : k === 'normal' ? '中' : '高'],
      ['Boss 弹幕', k === 'easy' ? '稀疏规律型' : k === 'normal' ? '中等复合型' : '密集混沌型'],
      ['预警时间', k === 'easy' ? '很长' : k === 'normal' ? '正常' : '极短'],
      ['奖励倍率', d.reward + '×'],
      ['生命 / 炸弹', d.playerLives + ' / ' + d.bombs]
    ];
    for (var i = 0; i < rows.length; i++) {
      var ry = by + 112 + i * 26;
      Ui.text(ctx, rows[i][0], bx + 26, ry, { size: 14, color: '#93b6cc' });
      Ui.text(ctx, rows[i][1], bx + 504, ry, { size: 14, align: 'right', color: '#eaf6ff', weight: 600 });
    }
  }

  function drawSettings(ctx) {
    panel(ctx, '设 置', 'Esc 返回');
    var st = G.Save.settings();
    for (var i = 0; i < SET_ROWS.length; i++) {
      var r = SET_ROWS[i];
      var y = setRowY(i);
      var sel = i === S.setIdx;
      if (sel) {
        Ui.glass(ctx, 350, y - 17, 600, 34, { r: 8, accent: '#9ff0ff', alpha: .3, glow: 1.4, noise: false, tintColor: '#16304e' });
      }
      var armed = r.id === '_wipe' && S.wipeArm > 0;
      Ui.text(ctx, armed ? '清除所有存档数据 —— 再按一次确认' : r.label, 372, y + 1,
              { size: 16, baseline: 'middle', color: armed ? '#ffd0d0' : (sel ? '#ffffff' : '#bcd8ea'), weight: sel ? 600 : 400 });
      if (r.type === 'slider') {
        Ui.tube(ctx, 560, y - 8, 300, 16, st[r.id], { color: sel ? '#9ff0ff' : '#6fd8ff' });
        Ui.text(ctx, Math.round(st[r.id] * 100) + '%', 930, y + 1, { size: 14, align: 'right', baseline: 'middle', color: '#9fc4dd' });
      } else if (r.type === 'enum') {
        var idx = r.vals.indexOf(st[r.id]);
        if (idx < 0) idx = 0;
        Ui.text(ctx, '‹ ' + r.names[idx] + ' ›', 750, y + 1, { size: 16, align: 'center', baseline: 'middle', color: sel ? '#9ff0ff' : '#bcd8ea', weight: 600 });
      } else {
        Ui.text(ctx, armed ? '不可撤销' : (sel ? '按 Enter 执行' : ''), 930, y + 1,
                { size: 13, align: 'right', baseline: 'middle', color: '#ff9f9f' });
      }
    }
    /* 当前选中项的说明——设置项光靠标签说不清 */
    var cur = SET_ROWS[S.setIdx];
    if (cur && SET_HELP[cur.id]) {
      Ui.text(ctx, SET_HELP[cur.id], 640, 578, { size: 13, align: 'center', color: 'rgba(159,240,255,.72)' });
    }
    Ui.text(ctx, '← → 调整    ↑ ↓ 选择    Alt+F 全屏    Alt+M 静音', 640, 604, { size: 13, align: 'center', color: 'rgba(180,212,235,.6)' });
  }

  function drawGallery(ctx) {
    panel(ctx, '结 局 图 鉴', G.Save.endingCount() + ' / 7  ·  Esc 返回');
    var cols = 4, cw = 216, chh = 132, gap = 14;
    var ox = 190, oy = 176;
    for (var i = 0; i < ENDING_ORDER.length; i++) {
      var id = ENDING_ORDER[i];
      var e = G.Endings ? G.Endings[id] : null;
      var got = G.Save.hasEnding(id);
      var cx2 = ox + (i % cols) * (cw + gap);
      var cy2 = oy + Math.floor(i / cols) * (chh + gap);
      var sel = i === S.galIdx;
      var acc = got ? (e && e.color || '#6fd8ff') : '#4a5a68';
      Ui.glass(ctx, cx2, cy2, cw, chh, {
        r: 12, accent: sel ? '#ffffff' : acc, alpha: sel ? .36 : .24,
        glow: sel ? 1.6 : .6, tintColor: got ? U.shade(acc, -.74) : '#151a20'
      });
      if (got) {
        Ui.text(ctx, e ? e.tag : '', cx2 + 14, cy2 + 28, { size: 12, color: acc });
        var nm = e ? e.title : id;
        Ui.text(ctx, nm, cx2 + 14, cy2 + 58, { size: 19, weight: 700, color: '#ffffff', glow: 1, glowColor: acc });
        Ui.text(ctx, '已达成 ' + G.Save.data.endings[id].count + ' 次', cx2 + 14, cy2 + 112, { size: 12, color: '#9fc4dd' });
      } else {
        Ui.text(ctx, '？ ？ ？', cx2 + cw / 2, cy2 + chh / 2 + 6, {
          size: 24, weight: 800, align: 'center', color: 'rgba(150,175,195,.5)'
        });
        Ui.text(ctx, '未解锁', cx2 + cw / 2, cy2 + chh - 18, { size: 12, align: 'center', color: 'rgba(140,165,185,.5)' });
      }
    }
    /* 详情 */
    var sid = ENDING_ORDER[S.galIdx];
    var se = G.Endings ? G.Endings[sid] : null;
    var got2 = G.Save.hasEnding(sid);
    var dy = 470;
    Ui.glass(ctx, 190, dy, 900, 132, { r: 12, accent: '#6fd8ff', alpha: .22, glow: .7, tintColor: '#0e1c34' });
    if (got2 && se) {
      Ui.text(ctx, se.title, 212, dy + 34, { size: 22, weight: 700, color: se.color, glow: 1, glowColor: se.color });
      var lines = U.wrapText(setFont(ctx, 14), se.sub || '', 856);
      for (var k = 0; k < lines.length; k++) {
        Ui.text(ctx, lines[k], 212, dy + 66 + k * 24, { size: 14, color: '#d8ecf8' });
      }
    } else {
      Ui.text(ctx, '达成后在此显示这个结局的字幕。', 212, dy + 40, { size: 15, color: 'rgba(170,200,222,.7)' });
      Ui.text(ctx, '提示：有些死亡是可以重来的，有些不是。而这个世界，也许并不需要救世主。',
              212, dy + 74, { size: 13, color: 'rgba(150,180,205,.6)' });
    }
  }
  function setFont(ctx, size) { ctx.font = '400 ' + size + 'px ' + G.FONT; return ctx; }

  function drawCodex(ctx) {
    panel(ctx, '角 色 档 案', 'Esc 返回');
    /* 左列表 */
    for (var i = 0; i < CODEX_IDS.length; i++) {
      var ch = G.Chars[CODEX_IDS[i]];
      var y = 176 + i * 44;
      var sel = i === S.codexIdx;
      var known = G.Save.data.codex[CODEX_IDS[i]] || i < 3;
      if (sel) Ui.glass(ctx, 184, y - 4, 300, 40, { r: 8, accent: ch.color, alpha: .32, glow: 1.3, noise: false, tintColor: U.shade(ch.color, -.75) });
      G.Portrait.thumb(ctx, ch, 208, y + 16, 30, { emo: ch.defaultEmo, silhouette: !known });
      Ui.text(ctx, known ? ch.name : '？？？', 236, y + 21, {
        size: 16, baseline: 'middle', color: sel ? '#fff' : (known ? '#cfe6f7' : 'rgba(150,175,195,.5)'), weight: sel ? 600 : 400
      });
      if (known && ch.title) {
        Ui.text(ctx, ch.title, 476, y + 21, { size: 11, align: 'right', baseline: 'middle', color: 'rgba(160,190,212,.7)' });
      }
    }
    /* 右详情 */
    var cid = CODEX_IDS[S.codexIdx];
    var cch = G.Chars[cid];
    var kn = G.Save.data.codex[cid] || S.codexIdx < 3;
    Ui.glass(ctx, 512, 176, 578, 424, { r: 14, accent: cch.color, alpha: .24, glow: .9, tintColor: U.shade(cch.color, -.78) });
    if (kn) {
      /* 立绘 */
      G.Portrait.draw(ctx, cch, 632, 452, 1.95, { emo: cch.defaultEmo, t: S.t, breathT: S.t });
      Ui.text(ctx, cch.name, 760, 226, { size: 30, weight: 800, color: cch.color, glow: 1, glowColor: cch.color });
      Ui.text(ctx, cch.title || '', 760, 254, { size: 13, color: '#a8c8dd' });
      /* 主色块 */
      Ui.text(ctx, '专属色', 760, 292, { size: 12, color: '#8fb0c8' });
      ctx.fillStyle = cch.color;
      U.roundRect(ctx, 812, 282, 40, 12, 6); ctx.fill();
      if (cch.color2) {
        ctx.fillStyle = cch.color2;
        U.roundRect(ctx, 858, 282, 40, 12, 6); ctx.fill();
        Ui.text(ctx, '（反转 / IF）', 904, 292, { size: 11, color: '#8fb0c8' });
      }
      ctx.font = '400 14px ' + G.FONT;
      var ls = U.wrapText(ctx, cch.codex || '', 300);
      for (var k = 0; k < ls.length; k++) {
        Ui.text(ctx, ls[k], 760, 330 + k * 25, { size: 14, color: '#dbeef8' });
      }
    } else {
      Ui.text(ctx, '尚未遭遇', 800, 380, { size: 24, weight: 700, align: 'center', color: 'rgba(150,175,195,.55)' });
    }
  }

  function drawChapters(ctx) {
    panel(ctx, '章 节 选 择', 'Esc 返回');
    Ui.text(ctx, '从任一已抵达的章节重新开始。剧情状态会按该章起点重建。', 190, 176, { size: 14, color: '#a8c8dd' });
    chapMenu.draw(ctx, 240, 212, 300, 48, 12);
  }

  S.debugInfo = function () { return ['mode ' + S.mode]; };

  G.Sc.register('title', S);

})(window);
