/* ===========================================================
   loop_system.js — 死亡回归核心
     · 存档点（章节+节拍+剧情状态快照）
     · 判定：可回归 vs 终结型死亡（→ 坏结局）
     · 回归演出 + 副作用累积
   =========================================================== */
(function (root) {
  'use strict';
  var G = root.G, U = G.U;

  var Loop = G.Loop = {
    cp: null,            // {ch, beat, snap}
    returning: false
  };

  Loop.setCheckpoint = function (ch, beat) {
    Loop.cp = { ch: ch, beat: beat, snap: G.St.snapshot() };
    G.St.setCheckpoint({ chapter: ch, beat: beat, region: G.St.s.region });
    /* 存档点同时落盘：关掉浏览器不该丢掉这一轮 */
    G.Save.saveRun(ch, beat, Loop.cp.snap);
  };

  /* ---------------- 终结型死亡判定 ----------------
     返回 null = 可回归；否则返回坏结局 id */
  Loop.terminalCheck = function (info) {
    info = info || {};
    var s = G.St.s;

    /* 显式指定（剧情杀） */
    if (info.terminal) return info.terminal;

    /* A：TY 的血肉丢失 —— 无法指定，能力无从触发 */
    if (s.flags.tyFleshLost) return 'badA';

    /* E：杀死了一起轮回的伙伴 —— 能力自我封印 */
    if (s.flags.killedTy) return 'badE';

    /* D：被最终 Boss 说服 */
    if (s.flags.joinedBoss) return 'badD';

    /* C：末日提前触发 */
    if (s.flags.doomEarly) return 'badC';

    /* IF：正直的人存活 + 在最终 Boss 第三阶段反复战败 → 交棒 */
    if (s.flags.uprightAlive && info.boss === 'boss6' && info.phase >= 2) {
      s.boss6Deaths++;
      if (s.boss6Deaths >= 3) return 'if';
    }

    /* B：精神崩溃 —— 不直接判死，而是给玩家「放弃回归」的选择 */
    if (s.sanity <= 20 && !s.flags.refusedReturn) return '__ask_give_up__';

    return null;
  };

  /* ---------------- 死亡入口 ---------------- */
  Loop.onDeath = function (info) {
    info = info || {};
    if (Loop.returning) return;
    Loop.returning = true;
    G.St.s.deaths++;

    var verdict = Loop.terminalCheck(info);

    if (verdict === '__ask_give_up__') {
      Loop.askGiveUp(info);
      return;
    }
    if (verdict) {
      Loop.returning = false;
      G.Ending.trigger(verdict, info);
      return;
    }
    Loop.doReturn(info);
  };

  /* ---------------- 坏结局B：给玩家选择 ---------------- */
  Loop.askGiveUp = function (info) {
    var steps = [
      { t: 'reset' },
      { t: 'stopBgm', ms: 400 },
      { t: 'black', a: 1, ms: 600 },
      { t: 'clear' },
      { t: 'bg', id: 'voidw', fade: 0 },
      { t: 'grain', a: .3 },
      { t: 'black', a: .55, ms: 1400 },
      { t: 'paint', fn: 'deadFaces', ms: 60000, keep: true, data: {}, wait: false },
      { t: 'wait', ms: 1400 },
      { t: 'sub', text: '回归的光里，所有死去的面孔都在。', ms: 2600, y: 120 },
      { t: 'sub', text: '他们不说话。只是看着你。', ms: 2600, y: 120 },
      { t: 'wind', gain: .08 },
      { t: 'enter', who: 'hero', slot: 'center', emo: 'numb', from: 'fade', ms: 1200 },
      { t: 'say', who: 'hero', emo: 'numb', text: '……又来了。' },
      { t: 'say', who: 'hero', emo: 'numb', text: '第 ' + (G.St.s.loopCount + 1) + ' 次。' },
      { t: 'say', who: 'hero', emo: 'broken',
        text: '我记得每一次。{p:500}每一张脸，{p:400}每一声惨叫，{p:400}每一滴血的温度。' },
      { t: 'say', who: 'hero', emo: 'broken', text: '{s}我快装不下了。{/s}' },
      { t: 'choice', who: 'hero', emo: 'broken',
        text: '……还要继续吗？',
        choices: [
          { id: 'go', text: '（握紧拳头）……还没完。', hint: '继续回归' },
          { id: 'stop', text: '……够了。我不想再看了。', hint: '放弃' }
        ],
        branches: {
          go: [
            { t: 'say', who: 'hero', emo: 'determined', text: '……还没完。' },
            { t: 'say', who: 'hero', emo: 'determined', text: '还有人在等我。' },
            { t: 'sanity', n: 18 },
            { t: 'unpaint', fn: 'deadFaces', ms: 900 },
            { t: 'call', fn: function () { Loop._giveUpAnswer = 'go'; } }
          ],
          stop: [
            { t: 'call', fn: function () { Loop._giveUpAnswer = 'stop'; G.St.setFlag('refusedReturn'); } }
          ]
        }
      }
    ];
    Loop._giveUpAnswer = null;
    G.Sc.go('cutscene', {
      steps: steps,
      onDone: function () {
        if (Loop._giveUpAnswer === 'stop') {
          Loop.returning = false;
          G.Ending.trigger('badB');
        } else {
          Loop.doReturn({});
        }
      }
    }, { trans: 'glitch', ms: 1200 });
  };

  /* ---------------- 执行回归 ---------------- */
  Loop.doReturn = function (info) {
    var cp = Loop.cp;
    if (!cp) {
      /* 没有存档点：回到章首 */
      cp = { ch: G.Story.ch, beat: 0, snap: G.St.snapshot() };
    }

    /* 保留跨轮回信息：情报、升级、已知旗标不回滚（这是「保留记忆」） */
    var carry = {
      intel: U.clone(G.St.s.intel),
      upgrades: U.clone(G.St.s.upgrades),
      intelPoints: G.St.s.intelPoints,
      loopCount: G.St.s.loopCount,
      deaths: G.St.s.deaths,
      sanity: G.St.s.sanity,
      tyDecay: G.St.s.tyDecay,
      tyRevived: G.St.s.tyRevived,
      boss6Deaths: G.St.s.boss6Deaths,
      bossCleared: U.clone(G.St.s.bossCleared),
      dead: U.clone(G.St.s.dead),
      /* 记忆型旗标：这些一旦知道就不会忘 */
      memFlags: {}
    };
    var MEM = ['gotPower', 'tyFound', 'tyAlive', 'tyFleshHeld', 'metUpright', 'metMadman',
               'metLucky', 'metFriend', 'madmanRevealed', 'friendRevealed',
               'readWreckLog', 'seenIfHint1', 'seenIfHint2', 'seenIfHint3', 'hangarUnlocked',
               'warnedUpright', 'fatalCoreBroken', 'uprightSurvived', 'uprightAlive',
               'oldmanDead', 'puppetDead', 'luckyDead', 'uprightKnowsSecret'];
    MEM.forEach(function (k) { carry.memFlags[k] = G.St.s.flags[k]; });

    /* 恢复存档点状态 */
    G.St.restore(cp.snap);
    U.merge(G.St.s.intel, carry.intel);
    G.St.s.upgrades = carry.upgrades;
    G.St.s.intelPoints = carry.intelPoints;
    G.St.s.loopCount = carry.loopCount;
    G.St.s.deaths = carry.deaths;
    G.St.s.sanity = carry.sanity;
    G.St.s.tyDecay = carry.tyDecay;
    G.St.s.tyRevived = carry.tyRevived;
    G.St.s.boss6Deaths = carry.boss6Deaths;
    G.St.s.bossCleared = carry.bossCleared;
    G.St.s.dead = carry.dead;
    MEM.forEach(function (k) { if (carry.memFlags[k]) G.St.s.flags[k] = true; });

    /* 副作用累积 */
    G.St.applyReturn();
    G.Save.data.progress.loops = G.St.s.loopCount;
    G.Save.data.progress.deaths = G.St.s.deaths;
    G.Save.save();

    var tyHere = G.St.flag('tyAlive');
    var steps = buildReturnCutscene(tyHere, info);

    G.Sc.go('cutscene', {
      steps: steps,
      onDone: function () {
        Loop.returning = false;
        G.Story.ch = cp.ch;
        G.Story.beat = cp.beat;
        G.Fx.reset();
        G.Story.run();
      },
      skippable: true
    }, { trans: 'glitch', ms: 1300 });
  };

  /* ---------------- 回归演出 ---------------- */
  function buildReturnCutscene(tyHere, info) {
    var n = G.St.s.loopCount;
    var decay = G.St.s.tyDecay;
    var s = [
      { t: 'reset' },
      { t: 'stopBgm', ms: 300 },
      { t: 'clear' },
      { t: 'bg', id: G.St.s.region || 'camp', fade: 0 },
      { t: 'black', a: 1, ms: 0, wait: false },
      { t: 'grain', a: .8 },

      /* 时间倒流 */
      { t: 'par', steps: [
        [{ t: 'sfx', id: 'rewind' }],
        [{ t: 'paint', fn: 'rewindRings', ms: 3000, layer: 'over', wait: false }],
        [{ t: 'glitch', ms: 2600, p: 1 }],
        [{ t: 'black', a: .35, ms: 1400 }],
        [{ t: 'shake', p: 16, ms: 2400 }]
      ] },
      /* 这行要能压在任何一张背景上 —— 回归可能落在暖色朝霞里，
         纯白细字在那种底色上会直接消失 */
      { t: 'sub', text: '第 ' + n + ' 次回归', ms: 2000, size: 28, y: 120,
        weight: 800, glow: 1.4, glowColor: '#9ff0ff', color: '#eaf8ff' },
      { t: 'wait', ms: 700 },
      { t: 'unpaint', fn: 'rewindRings', ms: 800 },
      { t: 'black', a: 0, ms: 900 },
      { t: 'enter', who: 'hero', slot: tyHere ? 'left' : 'center', emo: 'pain', from: 'fade', ms: 700 }
    ];

    if (tyHere) {
      s.push({ t: 'enter', who: 'ty', slot: 'right', emo: 'numb', decay: decay, flip: true, ms: 400 });
      /* 副作用发作 */
      s.push({ t: 'par', steps: [
        [{ t: 'scream', dur: 2.8 }],
        [{ t: 'actor', who: 'ty', emo: 'pain', tintColor: '#ff2b3e', tintAmt: .9, distort: 1, ms: 260, wait: false }],
        [{ t: 'shake', p: 18, ms: 2400 }],
        [{ t: 'redEdge', a: .9, ms: 300 }],
        [{ t: 'glitch', ms: 2200, p: .7 }]
      ] });
      s.push({ t: 'wait', ms: 1400 });
      s.push({ t: 'par', steps: [
        [{ t: 'actor', who: 'ty', tintAmt: 0, distort: 0, emo: 'pain', ms: 1400, wait: false }],
        [{ t: 'redEdge', a: 0, ms: 1200 }]
      ] });
      /* 衰老提示 */
      if (decay >= 1) {
        s.push({ t: 'sub', text: tyDecayLine(decay), ms: 2600, size: 17, y: 660 });
      }
      s.push({ t: 'say', who: 'ty', emo: 'pain', text: '……哈……{p:600}哈啊……' });
      s.push({ t: 'say', who: 'hero', emo: 'broken', text: '对不起……{p:400}又害你——' });
      s.push({ t: 'say', who: 'ty', emo: 'cold', text: '……没关系。' });
      s.push({ t: 'say', who: 'ty', emo: 'cold', text: '告诉我……{p:500}上一次……发生了什么。' });
      /* 情报总结 */
      var lastLine = info.summary || defaultSummary(info);
      s.push({ t: 'say', who: 'hero', emo: 'sad', text: lastLine });
      s.push({ t: 'say', who: 'ty', emo: 'sharp', text: tyAdvice(info) });
    } else {
      s.push({ t: 'say', who: 'hero', emo: 'pain', text: '哈……{p:400}哈啊……{p:500}又……回来了。' });
      s.push({ t: 'say', who: 'hero', emo: 'numb', text: '……只有我一个人记得。' });
    }

    /* 精神状态提示 */
    var san = G.St.s.sanity;
    if (san <= 35) {
      s.push({ t: 'redEdge', a: .35, ms: 900 });
      s.push({ t: 'say', who: 'hero', emo: 'numb', text: heroSanityLine(san) });
    }
    s.push({ t: 'grain', a: .5 });
    s.push({ t: 'reset' });
    return s;
  }

  function tyDecayLine(d) {
    return [
      '',
      '他的鬓角开始发白。',
      '他的背，比上一次更弯了一点。他自己没有察觉。',
      '他的手指开始有轻微的震颤——推演公式时会停顿半秒。',
      '他咳嗽的次数变多了。他每次都用手背挡住，然后若无其事地继续说话。',
      '他几乎撑不住自己的重量了。但他的眼神，还和第一次醒来时一模一样。'
    ][U.clamp(d, 0, 5)];
  }

  function heroSanityLine(san) {
    if (san <= 12) return '（……我是谁来着。{p:600}……哦，对。{p:400}我是那个不能死的人。）';
    if (san <= 22) return '（我已经不太记得，家里的天花板是什么颜色了。）';
    return '（好累。{p:500}真的好累。）';
  }

  function defaultSummary(info) {
    if (info.boss) return '我在' + (info.bossName || '那家伙') + '手上死了。{p:400}第' + G.St.s.loopCount + '次。';
    return '我死了。{p:500}就……又死了一次。';
  }

  function tyAdvice(info) {
    var pool = [
      '根据上一次的经验，如果我们改变接敌角度，成功率会提升到 34%。',
      '数据够了。{p:400}这次我们提前 6 秒转向。',
      '你死的位置我记下了。{p:400}那不是巧合，那是他的射击习惯。',
      '第 ' + G.St.s.loopCount + ' 组样本。{p:400}模型的置信度在上升。{p:500}……代价是你。',
      '别道歉。{p:500}道歉不会让概率变好。{p:400}情报会。'
    ];
    return pool[G.St.s.loopCount % pool.length];
  }

  /* ---------------- 剧情杀入口（供 cutscene / battle 调用） ---------------- */
  Loop.terminal = function (endingId, info) {
    Loop.returning = false;
    G.Ending.trigger(endingId, info || {});
  };

})(window);
