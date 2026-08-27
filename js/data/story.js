/* ===========================================================
   story.js — 剧情导演：章节 → 节拍推进、分支求值、存档点
   节拍类型：
     cut       播放过场
     map       2.5D 探索，直到达成目标
     battle    弹幕战（道中 or Boss）
     hangar    机库整备
     ending    进入结局
     save      设置存档点
     call      执行逻辑
     branch    条件跳转（jump 到本章某 beat id 或下一章）
   =========================================================== */
(function (root) {
  'use strict';
  var G = root.G, U = G.U;

  var Story = G.Story = {
    ch: 0, beat: 0,
    chapters: null,
    busy: false
  };

  function C(id, title, subtitle, beats) {
    return { id: id, title: title, subtitle: subtitle, beats: beats };
  }

  /* ============================================================
     章节表
     ============================================================ */
  function build() {
    Story.chapters = [

      /* ---------------- 序章 ---------------- */
      C(0, '序章', '坠落与相遇', [
        { k: 'save' },
        { k: 'cut', id: 'p_open' },
        { k: 'map', region: 'camp', hint: '走向那个叫住你的人', target: { kind: 'npc', id: 'oldman' },
          spawn: { x: 1180, y: 900 }, bgm: 'camp' },
        { k: 'cut', id: 'p_meet_oldman' },
        { k: 'save' },
        { k: 'map', region: 'camp', hint: '跟着老人去废墟（东侧出口）', target: { kind: 'zone', id: 'to_ruins' } },
        { k: 'cut', id: 'p_get_power' },
        { k: 'cut', id: 'p_daily' },
        { k: 'save' },
        { k: 'map', region: 'camp', hint: '回到营地中央，和老人说话', target: { kind: 'npc', id: 'oldman2' } },
        { k: 'cut', id: 'p_oldman_death' },
        { k: 'cut', id: 'p_first_return' },
        { k: 'cut', id: 'p_again' },
        { k: 'cut', id: 'p_resolve' },
        { k: 'call', fn: function () { G.Save.reachChapter(1); } }
      ]),

      /* ---------------- 第一章 ---------------- */
      C(1, '第一章', '轮回与TY', [
        { k: 'save' },
        { k: 'cut', id: 'c1_open' },
        { k: 'battle', id: 'stage_intro', kind: 'stage', field: 'ruins', bgm: 'ruins',
          intro: '起飞训练 —— 击落侦察机', waves: 3 },
        { k: 'map', region: 'camp', hint: '离开营地，前往浮空都市残骸', target: { kind: 'zone', id: 'to_ruins' } },
        { k: 'map', region: 'ruins', hint: '探索残骸，找到那个疯疯癫癫的人', target: { kind: 'npc', id: 'madman' },
          spawn: { x: 300, y: 1200 } },
        { k: 'cut', id: 'c1_madman' },
        { k: 'save' },
        { k: 'map', region: 'ruins', hint: '前往第七区老锚点', target: { kind: 'zone', id: 'anchor7' } },
        { k: 'cut', id: 'c1_find_ty' },
        { k: 'cut', id: 'c1_revive_ty' },
        { k: 'save' },
        { k: 'hangar', first: true },
        { k: 'cut', id: 'c1_boss1_pre' },
        { k: 'battle', id: 'boss1', kind: 'boss', field: 'ruins', bgm: 'boss1' },
        { k: 'cut', id: 'c1_boss1_post' },
        { k: 'call', fn: function () { G.Save.reachChapter(2); } }
      ]),

      /* ---------------- 第二章 ---------------- */
      C(2, '第二章', '浮空都市与正直的人', [
        { k: 'save' },
        { k: 'cut', id: 'c2_open' },
        { k: 'map', region: 'ruins', hint: '进入都市上层，与守卫队交涉',
          target: { kind: 'npc', id: 'upright' }, spawn: { x: 1400, y: 1300 } },
        { k: 'cut', id: 'c2_meet_upright' },
        { k: 'battle', id: 'stage_ruins', kind: 'stage', field: 'ruins', bgm: 'ruins',
          intro: '联手防卫 —— 清空来袭编队', waves: 4 },
        { k: 'cut', id: 'c2_cooperate' },
        { k: 'save' },
        { k: 'map', region: 'ruins', hint: '在机库遇见那个总在笑的人', target: { kind: 'npc', id: 'lucky' } },
        { k: 'cut', id: 'c2_lucky_intro' },
        { k: 'hangar' },
        /* —— 分支点：Boss3 —— */
        { k: 'cut', id: 'c2_boss3_pre' },
        { k: 'battle', id: 'boss3', kind: 'boss', field: 'ruins', bgm: 'boss3' },
        { k: 'branch', fn: function () {
            return (G.St.flag('warnedUpright') && G.St.flag('fatalCoreBroken')) ? 'survive' : 'death';
          },
          map: { survive: 'b3_survive', death: 'b3_death' } },
        { k: 'cut', id: 'c2_upright_death', bid: 'b3_death' },
        { k: 'cut', id: 'c2_after_death' },
        { k: 'branch', fn: function () { return 'next'; }, map: { next: 'ch2_end' } },
        { k: 'cut', id: 'c2_upright_survive', bid: 'b3_survive' },
        { k: 'cut', id: 'c2_after_survive' },
        { k: 'call', bid: 'ch2_end', fn: function () { G.Save.reachChapter(3); } }
      ]),

      /* ---------------- 第三章 ---------------- */
      C(3, '第三章', '风暴与真相', [
        { k: 'save' },
        { k: 'cut', id: 'c3_open' },
        { k: 'map', region: 'storm', hint: '穿过风暴云域，注意那个情报贩子',
          target: { kind: 'zone', id: 'storm_deep' }, spawn: { x: 640, y: 1400 } },
        { k: 'cut', id: 'c3_madman_hint' },
        { k: 'battle', id: 'stage_storm', kind: 'stage', field: 'storm', bgm: 'storm',
          intro: '雷云突破 —— 能见度极低', waves: 4 },
        { k: 'cut', id: 'c3_ty_past' },
        { k: 'save' },
        { k: 'map', region: 'storm', hint: '主角躲起来了。找到他', target: { kind: 'zone', id: 'hide_spot' } },
        { k: 'cut', id: 'c3_hero_fear' },
        { k: 'hangar' },
        { k: 'cut', id: 'c3_boss2_pre' },
        { k: 'battle', id: 'boss2', kind: 'boss', field: 'storm', bgm: 'boss2' },
        { k: 'cut', id: 'c3_boss2_post' },
        { k: 'call', fn: function () { G.Save.reachChapter(4); } }
      ]),

      /* ---------------- 第四章 ---------------- */
      C(4, '第四章', '机械牢笼与被操控的朋友', [
        { k: 'save' },
        { k: 'cut', id: 'c4_open' },
        { k: 'map', region: 'factory', hint: '深入工厂，查看那些实验记录',
          target: { kind: 'zone', id: 'lab_records' }, spawn: { x: 300, y: 1300 } },
        { k: 'cut', id: 'c4_env_story' },
        { k: 'battle', id: 'stage_factory', kind: 'stage', field: 'factory', bgm: 'factory',
          intro: '工厂空域 —— 突破防线', waves: 4 },
        { k: 'map', region: 'factory', hint: '前往核心车间', target: { kind: 'zone', id: 'core_bay' } },
        { k: 'cut', id: 'c4_meet_puppet' },
        { k: 'save' },
        { k: 'cut', id: 'c4_boss4_pre' },
        { k: 'battle', id: 'boss4', kind: 'boss', field: 'factory', bgm: 'boss4' },
        { k: 'cut', id: 'c4_puppet_beg' },
        { k: 'cut', id: 'c4_tear_shot' },
        { k: 'cut', id: 'c4_ptsd' },
        { k: 'branch', fn: function () {
            return G.St.flag('uprightAlive') ? 'if1' : 'skip';
          }, map: { if1: 'if_reflect', skip: 'ch4_end' } },
        { k: 'cut', id: 'if_reflect', bid: 'if_reflect' },
        { k: 'call', bid: 'ch4_end', fn: function () { G.Save.reachChapter(5); } }
      ]),

      /* ---------------- 第五章 ---------------- */
      C(5, '第五章', '背叛与最终反派朋友', [
        { k: 'save' },
        { k: 'cut', id: 'c5_open' },
        { k: 'map', region: 'shrine', hint: '登上高空祭坛', target: { kind: 'zone', id: 'shrine_top' },
          spawn: { x: 640, y: 1400 } },
        { k: 'cut', id: 'c5_friend_reveal' },
        { k: 'cut', id: 'c5_ty_analysis' },
        { k: 'save' },
        { k: 'hangar' },
        { k: 'cut', id: 'c5_boss5_pre' },
        { k: 'battle', id: 'boss5', kind: 'boss', field: 'shrine', bgm: 'boss5', escort: true },
        { k: 'cut', id: 'c5_boss5_post' },
        { k: 'branch', fn: function () {
            return G.St.flag('uprightAlive') ? 'if2' : 'skip';
          }, map: { if2: 'if_waver', skip: 'ch5_end' } },
        { k: 'cut', id: 'if_waver', bid: 'if_waver' },
        { k: 'call', bid: 'ch5_end', fn: function () { G.Save.reachChapter(6); } }
      ]),

      /* ---------------- 第六章 ---------------- */
      C(6, '第六章', '恶人的救世主与最终决战', [
        { k: 'save' },
        { k: 'cut', id: 'c6_open' },
        { k: 'map', region: 'core', hint: '深入核心空域', target: { kind: 'zone', id: 'core_gate' },
          spawn: { x: 640, y: 1400 } },
        { k: 'cut', id: 'c6_lucky_death' },
        { k: 'battle', id: 'stage_core', kind: 'stage', field: 'core', bgm: 'core',
          intro: '核心空域 —— 最后的道路', waves: 5 },
        { k: 'cut', id: 'c6_madman_turn' },
        { k: 'save' },
        { k: 'hangar', last: true },
        { k: 'cut', id: 'c6_boss6_pre' },
        { k: 'battle', id: 'boss6', kind: 'boss', field: 'core', bgm: 'boss6a', final: true },
        { k: 'cut', id: 'c6_win' },
        { k: 'ending', id: 'good' }
      ])
    ];
  }
  build();

  /* ============================================================
     导航
     ============================================================ */
  Story.chapterTitle = function (n) {
    var c = Story.chapters[n];
    return c ? c.subtitle : '';
  };
  Story.curChapter = function () { return Story.chapters[Story.ch]; };
  Story.curBeat = function () {
    var c = Story.curChapter();
    return c ? c.beats[Story.beat] : null;
  };
  Story.curBeatId = function () {
    var b = Story.curBeat();
    if (!b) return '-';
    return Story.ch + ':' + Story.beat + ':' + b.k + (b.id ? '/' + b.id : '');
  };

  Story.startNewGame = function () {
    G.St.reset();
    G.St.s.chapter = 0;
    Story.ch = 0; Story.beat = 0;
    G.Save.clearRun();
    G.Fx.reset();
    Story.run();
  };

  /* 从落盘的存档点继续。存档点 = 章节 + 节拍 + 扁平剧情状态，
     恢复就是把状态装回去再从该节拍重跑，和死亡回归走的是同一套机制。 */
  Story.continueRun = function () {
    var r = G.Save.loadRun();
    if (!r) { Story.startNewGame(); return false; }
    G.St.restore(r.st);
    Story.ch = r.ch | 0;
    Story.beat = r.beat | 0;
    G.St.s.chapter = Story.ch;
    G.St.s.beat = Story.beat;
    G.Loop.cp = { ch: Story.ch, beat: Story.beat, snap: G.St.snapshot() };
    G.Fx.reset();
    Story.run();
    return true;
  };

  Story.startAtChapter = function (n) {
    G.St.reset();
    /* 按章节补齐必要的剧情状态，保证从中段开始也自洽 */
    var s = G.St.s;
    if (n >= 1) { s.flags.gotPower = true; s.flags.oldmanDead = true; G.St.kill('oldman'); s.loopCount = 12; s.sanity = 76; }
    if (n >= 2) {
      s.flags.tyFound = s.flags.tyAlive = s.flags.tyFleshHeld = true;
      s.flags.metMadman = true; s.tyDecay = 1; s.tyRevived = 1;
      s.bossCleared.boss1 = true; s.intelPoints = 260;
      s.intel = { doomsday: '世界将在约 471 天后毁灭', ty_alive: 'TY 与我一同轮回' };
    }
    if (n >= 3) {
      s.flags.metUpright = true; s.flags.metLucky = true;
      /* 正直的人默认存活：他活着才通得到好结局与 IF 线。
         以前这里写死 uprightAlive=false 并 kill('upright')，
         等于从章节选择进入就永久掐死了两条路线。 */
      s.flags.uprightAlive = true;
      s.bossCleared.boss3 = true;
      s.sanity = 64; s.intelPoints = 520;
    }
    if (n >= 4) { s.flags.madmanRevealed = false; s.bossCleared.boss2 = true; s.sanity = 58; s.intelPoints = 780; }
    if (n >= 5) { G.St.kill('puppet'); s.flags.puppetDead = true; s.bossCleared.boss4 = true; s.sanity = 44; s.intelPoints = 1040; }
    if (n >= 6) { s.flags.friendRevealed = true; s.bossCleared.boss5 = true; s.sanity = 36; s.intelPoints = 1320; }
    s.chapter = n;
    Story.ch = n; Story.beat = 0;
    G.Fx.reset();
    Story.run();
  };

  /* 跳到本章某个 bid 标记的 beat */
  Story.jumpBid = function (bid) {
    var c = Story.curChapter();
    if (!c) return false;
    for (var i = 0; i < c.beats.length; i++) {
      if (c.beats[i].bid === bid) { Story.beat = i; return true; }
    }
    console.warn('[story] 找不到 bid: ' + bid);
    return false;
  };

  Story.advance = function () {
    Story.beat++;
    var c = Story.curChapter();
    if (!c || Story.beat >= c.beats.length) {
      /* 进入下一章 */
      Story.ch++;
      Story.beat = 0;
      if (Story.ch >= Story.chapters.length) {
        /* 理论上第六章末会走 ending，这里兜底 */
        G.Ending.trigger('good');
        return;
      }
      G.St.s.chapter = Story.ch;
    }
    Story.run();
  };

  /* 执行当前节拍 */
  Story.run = function () {
    var b = Story.curBeat();
    if (!b) { Story.advance(); return; }
    G.St.s.chapter = Story.ch;
    G.St.s.beat = Story.beat;

    switch (b.k) {

      case 'save':
        G.Loop.setCheckpoint(Story.ch, Story.beat);
        Story.advance();
        break;

      case 'call':
        if (b.fn) b.fn();
        Story.advance();
        break;

      case 'branch': {
        var r = b.fn ? b.fn() : null;
        var bid = b.map ? b.map[r] : null;
        if (bid && Story.jumpBid(bid)) Story.run();
        else Story.advance();
        break;
      }

      case 'cut':
        G.Sc.go('cutscene', { steps: b.id }, { trans: b.trans || 'fade', ms: b.ms || 560 });
        break;

      case 'map':
        if (b.region) G.St.s.region = b.region;
        G.Sc.go('map', {
          region: b.region, hint: b.hint, target: b.target, spawn: b.spawn, bgm: b.bgm
        }, { trans: b.trans || 'fade', ms: 620 });
        break;

      case 'battle':
        G.Sc.go('danmaku', {
          id: b.id, kind: b.kind, field: b.field, bgm: b.bgm,
          intro: b.intro, escort: b.escort, final: b.final, waves: b.waves
        }, { trans: 'warp', ms: 1100 });
        break;

      case 'hangar':
        G.Sc.go('hangar', { first: b.first, last: b.last }, { trans: 'iris', ms: 700 });
        break;

      case 'ending':
        G.Ending.trigger(b.id);
        break;

      default:
        console.warn('[story] 未知节拍类型 ' + b.k);
        Story.advance();
    }
  };

  /* 战斗结束回调（由 scene_danmaku 调用） */
  Story.onBattleWin = function () {
    Story.advance();
  };
  /* 战斗失败 → 交给 LoopSystem 判定 */
  Story.onBattleLose = function (info) {
    G.Loop.onDeath(info || {});
  };

  /* 当前章节的 HUD 文本 */
  Story.hudLabel = function () {
    var c = Story.curChapter();
    if (!c) return '';
    return c.title + ' · ' + c.subtitle;
  };

})(window);
