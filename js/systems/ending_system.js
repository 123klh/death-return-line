/* ===========================================================
   ending_system.js — 结局触发与演出调度
     · 解锁图鉴
     · IF 结局是三段式：觉醒演出 → 可操作决战 → 新世界结局
   =========================================================== */
(function (root) {
  'use strict';
  var G = root.G;

  var Ending = G.Ending = { current: null };

  Ending.trigger = function (id, info) {
    var e = G.Endings[id];
    if (!e) { console.warn('[ending] 未知结局 ' + id); id = 'badA'; e = G.Endings.badA; }
    Ending.current = id;
    G.Save.unlockEnding(id);
    G.Save.data.progress.loops = G.St.s.loopCount;
    G.Save.clearRun();     /* 这一轮已经有结局了，存档点不该再留着 */
    G.Save.save();
    G.Game.setTimeScale(1);
    G.Tw.killAll();

    if (id === 'if') { playIf(e); return; }

    G.Sc.go('ending', { id: id, steps: e.steps }, { trans: 'fade', ms: 1100, color: '#000' });
  };

  function playIf(e) {
    /* 第一段：主角与 TY 战死 → 正直的人觉醒 */
    G.Sc.go('ending', {
      id: 'if', steps: e.steps, noCredits: true,
      onDone: function () {
        /* 第二段：以正直的人操作最终决战 */
        G.Sc.go('danmaku', {
          id: 'boss6_if', kind: 'boss', field: 'core', bgm: 'ifline',
          asUpright: true, intro: '以我自己的名义 —— 光之雨',
          onWin: function () {
            G.Sc.go('ending', { id: 'if', steps: e.after }, { trans: 'fade', ms: 1200 });
          },
          onLose: function () {
            /* 秘密结局的决战不惩罚：重打 */
            G.Sc.go('cutscene', {
              steps: [
                { t: 'reset' },
                { t: 'bg', id: 'core', fade: 400 },
                { t: 'clear' },
                { t: 'enter', who: 'upright', slot: 'center', emo: 'pain', alt: 1, emblemGlow: 1 },
                { t: 'say', who: 'upright', emo: 'pain', text: '……还不够。' },
                { t: 'say', who: 'upright', emo: 'determined',
                  text: '他们把最后的机会交给我了。{p:600}我不能在这里躺下。' },
                { t: 'sub', text: '牺牲者的意志还没有用完。', ms: 2200, y: 640 }
              ],
              onDone: function () { playIf(e); }
            }, { trans: 'glitch', ms: 900 });
          }
        }, { trans: 'warp', ms: 1200 });
      }
    }, { trans: 'fade', ms: 1100, color: '#000' });
  }

  /* 「世界之后」的独立播放（图鉴回看用） */
  Ending.replay = function (id) {
    var e = G.Endings[id];
    if (!e) return;
    var steps = (id === 'if') ? e.after : e.steps;
    G.Sc.go('ending', { id: id, steps: steps }, { trans: 'fade', ms: 900 });
  };

})(window);
