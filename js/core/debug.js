/* ===========================================================
   debug.js — 自验证用跳转工具（?debug=1 显示 HUD；?jump=xxx 直达）
   jump 目标：
     title            标题
     map:<region>     指定区域地图
     cut:<id>         指定过场
     boss:<id>        指定 Boss 战（?diff= 控制难度）
     stage:<field>    道中战
     hangar           机库
     end:<id>         结局演出
     ch:<n>           从第 n 章开头
     ret              死亡回归演出
   =========================================================== */
(function (root) {
  'use strict';
  var G = root.G;

  var Debug = G.Debug = {};

  function prep(chapter) {
    G.St.reset();
    if (chapter !== undefined) G.Story.startAtChapter(chapter);
  }

  /* 给「中段跳转」补一份合理的剧情状态 */
  function midState(opt) {
    opt = opt || {};
    var s = G.St.s;
    s.flags.gotPower = true;
    s.flags.oldmanDead = true;
    G.St.kill('oldman');
    s.flags.tyFound = s.flags.tyAlive = s.flags.tyFleshHeld = true;
    s.flags.metMadman = s.flags.metUpright = s.flags.metLucky = s.flags.metFriend = true;
    s.loopCount = opt.loop === undefined ? 7 : opt.loop;
    s.sanity = opt.sanity === undefined ? 62 : opt.sanity;
    s.tyDecay = opt.decay === undefined ? 2 : opt.decay;
    s.intelPoints = 1500;
    s.intel = {
      doomsday: '世界将在约 471 天后毁灭',
      ty_alive: 'TY 与我一同轮回、一同保留记忆',
      oldman_creed: '老人的话 —— 害怕不丢人，丢人的是害怕了就跑',
      fixed_death: '有些死亡无法改变'
    };
    if (opt.uprightAlive) { s.flags.uprightAlive = true; s.flags.uprightSurvived = true; s.flags.warnedUpright = true; s.flags.fatalCoreBroken = true; }
    else G.St.kill('upright');
    if (opt.dead) opt.dead.forEach(function (d) { G.St.kill(d); });
    ['hero', 'ty', 'oldman', 'upright', 'madman', 'lucky', 'friend', 'puppet', 'savior', 'shadow']
      .forEach(function (id) { G.Save.unlockCodex(id); });
  }
  Debug.midState = midState;

  Debug.jump = function (spec) {
    var parts = String(spec).split(':');
    var kind = parts[0], arg = parts[1];
    G.Fx.reset();

    switch (kind) {
      case 'title':
        G.Sc.set('title', {});
        return;

      case 'ch':
        G.Story.startAtChapter(parseInt(arg, 10) || 0);
        return;

      case 'map':
        prep();
        midState();
        G.St.s.region = arg || 'camp';
        G.Story.ch = 2; G.Story.beat = 1;
        G.Sc.set('map', { region: arg || 'camp', hint: '（调试模式）自由探索', target: null });
        return;

      case 'cut':
        prep();
        midState();
        G.Sc.set('cutscene', {
          steps: arg,
          onDone: function () { G.Sc.go('title', {}, { trans: 'fade' }); }
        });
        return;

      case 'boss': {
        prep();
        midState({ uprightAlive: root.location.search.indexOf('upright=1') >= 0 });
        var id = arg || 'boss1';
        var bd = G.Bosses[id];
        var fieldMap = { boss1: 'ruins', boss2: 'storm', boss3: 'ruins', boss4: 'factory',
                         boss5: 'shrine', boss6: 'core', boss6_if: 'core' };
        G.Sc.set('danmaku', {
          id: id, kind: 'boss', field: fieldMap[id] || 'ruins',
          bgm: bd ? bd.bgm : 'boss1',
          escort: id === 'boss5',
          asUpright: id === 'boss6_if',
          intro: bd ? bd.name : id,
          onWin: function () { G.Sc.go('title', {}, { trans: 'fade' }); },
          onLose: function () { G.Sc.go('title', {}, { trans: 'fade' }); }
        });
        return;
      }

      /* 单一小怪试验场：?jump=enemy:blocker —— 逐个核对 12 种小怪 */
      case 'enemy': {
        prep();
        midState();
        var eid = arg || G.Enemies.list[0];
        G.Sc.set('danmaku', {
          id: 'enemy_debug', kind: 'stage', field: parts[2] || 'ruins', bgm: 'ruins',
          onlyEnemy: eid, waves: 3,
          intro: '小怪试验场 —— ' + eid,
          onWin: function () { G.Sc.go('title', {}, { trans: 'fade' }); },
          onLose: function () { G.Sc.go('title', {}, { trans: 'fade' }); }
        });
        return;
      }

      case 'stage':
        prep();
        midState();
        G.Sc.set('danmaku', {
          id: 'stage_debug', kind: 'stage', field: arg || 'ruins', bgm: arg || 'ruins',
          intro: '调试道中战 —— ' + (arg || 'ruins'),
          onWin: function () { G.Sc.go('title', {}, { trans: 'fade' }); },
          onLose: function () { G.Sc.go('title', {}, { trans: 'fade' }); }
        });
        return;

      case 'hangar':
        prep();
        midState();
        G.Sc.set('hangar', { fromMap: false });
        return;

      case 'end':
        prep();
        midState({ dead: ['oldman', 'lucky', 'puppet'], sanity: 18, decay: 5, loop: 14,
                   uprightAlive: arg === 'if' });
        if (arg === 'if') { G.St.setFlag('uprightAlive'); G.St.setFlag('uprightSurvived'); }
        G.Ending.trigger(arg || 'good');
        return;

      case 'ret':
        prep();
        midState();
        G.Loop.setCheckpoint(1, 1);
        G.Loop.onDeath({ boss: 'boss1', bossName: '追猎队长', phase: 0 });
        return;

      default:
        console.warn('[debug] 未知跳转: ' + spec);
        G.Sc.set('title', {});
    }
  };

  /* 控制台便捷方法 */
  Debug.god = function () {
    var d = G.Sc.get('danmaku');
    if (d && d.player) { d.player.inv = 1e9; d.player.lives = 99; d.player.bombs = 99; }
    console.log('无敌已开启');
  };
  Debug.kill = function () {
    var d = G.Sc.get('danmaku');
    if (d && d.damageBoss) d.damageBoss(1e9);
  };
  Debug.win = function () { G.Story.advance(); };
  Debug.flags = function () { console.table(G.St.s.flags); };
  Debug.endings = function () { console.log(G.Save.data.endings); };
  Debug.setDiff = function (k) { G.Save.settings().difficulty = k; G.Save.save(); };

})(window);
