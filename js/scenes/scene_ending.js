/* ===========================================================
   scene_ending.js — 结局演出壳 + 结算卡（结局名 / 统计 / 图鉴进度）
   =========================================================== */
(function (root) {
  'use strict';
  var G = root.G, U = G.U, Ui = G.Ui, In = G.In;

  var S = {
    id: 'good', dt: 16.7, phase: 'play',
    cardA: 0, t: 0, onDone: null, noCredits: false, menu: null
  };

  S.enter = function (p) {
    p = p || {};
    S.id = p.id || 'good';
    S.onDone = p.onDone || null;
    S.noCredits = !!p.noCredits;
    S.phase = 'play';
    S.cardA = 0;
    S.t = 0;
    S.menu = null;
    G.Fx.clearParticles();
    var steps = p.steps || (G.Endings[S.id] && G.Endings[S.id].steps) || [];
    G.Cut.start(steps, function () {
      if (S.onDone) { var f = S.onDone; S.onDone = null; f(); return; }
      if (S.noCredits) return;
      S.phase = 'card';
      G.Tw.to(S, 1400, { cardA: 1, ease: 'outQuad' });
      G.Aud.playBgm(S.id === 'good' || S.id === 'if' ? 'hope' : 'void', { fade: 2600 });
      S.menu = new Ui.Menu([
        { label: '返 回 标 题', id: 'title' },
        { label: '重 新 开 始', id: 'restart' }
      ], { size: 18 });
    }, { skippable: true });
  };

  S.exit = function () { G.Cut.stop(); G.Dlg.clearStage(); };

  S.update = function (dt) {
    S.dt = dt;
    S.t += dt;
    if (S.phase === 'play') { G.Cut.update(dt); return; }
    if (S.menu && S.cardA > .8) {
      var pick = S.menu.update();
      if (pick) {
        if (pick.id === 'title') G.Sc.go('title', {}, { trans: 'fade', ms: 900 });
        else { G.St.reset(); G.Story.startNewGame(); }
      }
    }
  };

  S.draw = function (ctx) {
    if (S.phase === 'play') { G.Cut.draw(ctx, S.dt); return; }
    /* 结算卡：星空底 */
    var bg = G.Art.scene(S.id === 'good' || S.id === 'if' ? 'starry' : 'bone');
    bg.draw(ctx, S.dt, {});
    G.Game.updateBlurBuf();

    var e = G.Endings[S.id];
    var a = S.cardA;
    ctx.save();
    ctx.globalAlpha = a;
    Ui.glass(ctx, 200, 104, 880, 542, {
      r: 20, accent: e.color, alpha: .32, glow: 1.2, corners: true,
      tintColor: U.shade(e.color, -.8)
    });
    Ui.text(ctx, e.tag, 640, 168, { size: 14, align: 'center', color: e.color });
    Ui.spaced(ctx, e.title, 640, 214, {
      size: 40, weight: 900, align: 'center', spacing: 6,
      gradient: ['#ffffff', e.color], glow: 1, glowColor: e.color
    });
    /* 字幕 */
    ctx.font = '400 17px ' + G.FONT;
    var lines = U.wrapText(ctx, e.sub || '', 700);
    for (var i = 0; i < lines.length; i++) {
      Ui.text(ctx, lines[i], 640, 268 + i * 28, { size: 17, align: 'center', color: '#dfeaf5' });
    }
    /* 统计 */
    var s = G.St.s;
    var rows = [
      ['轮回次数', '' + s.loopCount],
      ['累计死亡', '' + s.deaths],
      ['精神值', Math.round(s.sanity) + ' / 100'],
      ['TY 衰弱', s.tyDecay + ' / 5'],
      ['难度', G.diffCfg().label],
      ['已解锁结局', G.Save.endingCount() + ' / 7']
    ];
    for (var k = 0; k < rows.length; k++) {
      var rx = 300 + (k % 2) * 380, ry = 352 + Math.floor(k / 2) * 32;
      Ui.text(ctx, rows[k][0], rx, ry, { size: 14, color: '#9fc4dd' });
      Ui.text(ctx, rows[k][1], rx + 300, ry, { size: 15, weight: 700, align: 'right', color: '#eaf6ff' });
    }
    /* 死者名单 */
    var dead = [];
    ['oldman', 'upright', 'lucky', 'puppet', 'friend', 'ty', 'hero'].forEach(function (id) {
      if (G.St.isDead(id)) dead.push(G.charOf(id).name);
    });
    if (dead.length) {
      Ui.text(ctx, '在这条时间线上没有活下来的人：', 300, 474, { size: 13, color: '#8fb0c8' });
      Ui.text(ctx, dead.join('   ·   '), 300, 499, { size: 15, color: '#dfeaf5' });
    }
    if (S.menu) S.menu.draw(ctx, 470, 526, 340, 44, 8);
    ctx.restore();

    /* 隐藏提示：还没解锁 IF */
    if (!G.Save.hasEnding('if') && a > .9) {
      Ui.text(ctx, '……有些结局，需要一个不是主角的人来完成。', 640, 664, {
        size: 13, align: 'center', color: 'rgba(200,225,245,' + (.4 + .2 * Math.sin(S.t * .002)) + ')'
      });
    }
  };

  S.debugInfo = function () { return ['ending ' + S.id, 'phase ' + S.phase]; };

  G.Sc.register('ending', S);

})(window);
