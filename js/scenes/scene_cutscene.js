/* ===========================================================
   scene_cutscene.js — 过场场景壳（承载 Cut 解释器）
   =========================================================== */
(function (root) {
  'use strict';
  var G = root.G;

  var S = { steps: null, dt: 16.7, onDone: null };

  S.enter = function (p) {
    p = p || {};
    S.dt = 16.7;
    G.Fx.clearParticles();
    G.Dlg.log = G.Dlg.log || [];
    var steps = p.steps;
    if (typeof steps === 'string') steps = G.Cutscenes[steps];
    if (typeof steps === 'function') steps = steps();
    if (!steps) {
      console.warn('[scene_cutscene] 空过场: ' + p.steps);
      if (p.onDone) p.onDone();
      return;
    }
    S.onDone = p.onDone || null;
    G.Cut.start(steps, function () {
      var cb = S.onDone;
      S.onDone = null;
      if (cb) cb();
      else G.Story.advance();
    }, { bg: p.bg, skippable: p.skippable });
  };

  S.exit = function () {
    G.Cut.stop();
    G.Dlg.clearStage();
  };

  S.update = function (dt) {
    S.dt = dt;
    G.Cut.update(dt);
    /* 暂停 */
    if (G.In.hit('pause') && !G.Dlg.choiceMode) G.Game.togglePause();
  };

  S.draw = function (ctx) {
    G.Cut.draw(ctx, S.dt);
  };

  S.debugInfo = function () {
    return ['painters ' + G.Cut.painters.length, 'dlgQ ' + G.Dlg.queue.length];
  };

  G.Sc.register('cutscene', S);

})(window);
