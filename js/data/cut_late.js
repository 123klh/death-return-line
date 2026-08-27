/* ===========================================================
   cut_late.js — 第五章 / 第六章 过场
     含：背叛揭示、运气好的人之死、疯癫反转、
         最终对峙分屏 + 坏结局D 选项、好结局前的胜利演出
   =========================================================== */
(function (root) {
  'use strict';
  var G = root.G;
  var CS = G.Cutscenes = G.Cutscenes || {};

  /* ============================================================
     第五章 · 背叛与最终反派朋友
     ============================================================ */
  CS.c5_open = [
    { t: 'reset' },
    { t: 'bg', id: 'shrine', fade: 1400 },
    { t: 'bgm', id: 'shrine', fade: 1800 },
    { t: 'clear' },
    { t: 'card', small: 'CHAPTER  5', big: '背叛', ms: 2400 },
    { t: 'enter', who: 'hero', slot: 'center', emo: 'numb', scale: 1.85 },
    { t: 'wait', ms: 1200 },
    { t: 'say', who: 'hero', emo: 'numb', text: '……' },
    { t: 'if', cond: function () { return !G.St.isDead('lucky'); }, then: [
      { t: 'enter', who: 'lucky', slot: 'right', emo: 'smile', flip: true, from: 'right' },
      { t: 'say', who: 'lucky', emo: 'smile', text: '喂。' },
      { t: 'say', who: 'hero', emo: 'numb', text: '……' },
      { t: 'say', who: 'lucky', emo: 'smile', text: '你已经三天没吃东西了。' },
      { t: 'say', who: 'hero', emo: 'numb', text: '不饿。' },
      { t: 'say', who: 'lucky', emo: 'smile', text: '我也不饿。{p:400}但我带了两份。' },
      { t: 'wait', ms: 900 },
      { t: 'say', who: 'lucky', emo: 'sad', text: '……我知道你在想什么。' },
      { t: 'say', who: 'lucky', emo: 'sad', text: '你在想，如果没有你，他们是不是都还活着。' },
      { t: 'say', who: 'hero', emo: 'broken', text: '{s}……你怎么知道。{/s}' },
      { t: 'say', who: 'lucky', emo: 'smile', text: '因为我每次躲过一颗子弹，' },
      { t: 'say', who: 'lucky', emo: 'sad', text: '那颗子弹都会打到别人身上。' },
      { t: 'wait', ms: 1200 },
      { t: 'say', who: 'lucky', emo: 'smile',
        text: '我这个「运气好」，从来就不是白来的。' },
      { t: 'say', who: 'lucky', emo: 'smile', text: '所以，吃饭。' },
      { t: 'say', who: 'lucky', emo: 'smile', text: '活着的人得吃饭，{p:400}这是规矩。' },
      { t: 'sanity', n: 8 },
      { t: 'learn', k: 'lucky_truth', label: '幸运儿：我每次躲过的子弹，都会打到别人身上' }
    ] },
    { t: 'closebox' },
    { t: 'sub', text: 'TY 独自在黑暗中推演。他已经三十九个小时没有合眼。', ms: 4000, y: 640 }
  ];

  CS.c5_friend_reveal = [
    { t: 'bg', id: 'shrine', fade: 700 },
    { t: 'bgm', id: 'shrine', fade: 1000, layers: { drums: false } },
    { t: 'clear' },
    { t: 'enter', who: 'friend', slot: 'right', emo: 'smile', flip: true, scale: 1.9 },
    { t: 'enter', who: 'hero', slot: 'left', emo: 'sad' },
    { t: 'say', who: 'friend', emo: 'smile', text: '找到你了。' },
    { t: 'say', who: 'hero', emo: 'sad', text: '……你怎么在祭坛顶上？' },
    { t: 'say', who: 'friend', emo: 'smile', text: '因为这里视野最好。' },
    { t: 'wait', ms: 800 },
    { t: 'say', who: 'friend', emo: 'smile', text: '……也因为这里是我的地盘。' },
    { t: 'wait', ms: 1200 },
    { t: 'say', who: 'hero', emo: 'surprise', text: '……什么？' },
    { t: 'closebox' },
    /* 情绪转折：色调突变 + 立绘变色 */
    { t: 'par', steps: [
      [{ t: 'tint', color: '#0a2a10', a: .26, ms: 700 }],
      [{ t: 'shake', p: 16, ms: 800 }],
      [{ t: 'actor', who: 'friend', alt: 1, emo: 'numb', ms: 1600, wait: false }],
      [{ t: 'stopBgm', ms: 400 }],
      [{ t: 'sfx', id: 'glitch', arg: 6 }],
      [{ t: 'glitch', ms: 900, p: .7 }]
    ] },
    { t: 'wait', ms: 1200 },
    { t: 'say', who: 'friend', emo: 'numb', alt: 1, text: '我一直在骗你。' },
    { t: 'say', who: 'hero', emo: 'broken', text: '{s}……你说什么？{/s}' },
    { t: 'say', who: 'friend', emo: 'numb', alt: 1,
      text: '从老人捡到我们那天开始。{p:600}我是被派去的。' },
    { t: 'say', who: 'friend', emo: 'numb', alt: 1,
      text: '任务：监视那个「回头的钥匙」，{p:400}以及它选中的人。' },
    { t: 'say', who: 'hero', emo: 'broken', text: '{s}老人呢？！{p:300}老人的死也是你——{/s}' },
    { t: 'say', who: 'friend', emo: 'sad', alt: 1, text: '……坐标是我给的。' },
    { t: 'par', steps: [
      [{ t: 'shake', p: 26, ms: 1200 }],
      [{ t: 'flash', color: '#ff2b3e', ms: 400, a: .6 }],
      [{ t: 'actor', who: 'hero', emo: 'broken', ms: 200, wait: false }],
      [{ t: 'redEdge', a: 1, ms: 400 }]
    ] },
    { t: 'say', who: 'hero', emo: 'broken', text: '{s}你——！！{/s}' },
    { t: 'wait', ms: 1200 },
    { t: 'say', who: 'friend', emo: 'sad', alt: 1, text: '你打我吧。' },
    { t: 'say', who: 'friend', emo: 'sad', alt: 1, text: '真的。{p:400}我不躲。' },
    { t: 'wait', ms: 1400 },
    { t: 'say', who: 'hero', emo: 'broken', text: '……为什么。' },
    { t: 'say', who: 'hero', emo: 'broken', text: '{s}为什么！！{/s}' },
    { t: 'par', steps: [
      [{ t: 'zoom', z: 1.16, ms: 5000, cx: 980, cy: 340, wait: false }],
      [{ t: 'lines', list: [
        { who: 'friend', emo: 'numb', alt: 1, text: '因为我也想活。' },
        { who: 'friend', emo: 'sad', alt: 1, text: '因为他们说，只要我看着你，他们就不动我妹妹。' },
        { who: 'friend', emo: 'numb', alt: 1, text: '……她三年前就死了。' },
        { who: 'friend', emo: 'numb', alt: 1, text: '他们没告诉我。我还继续看了三年。' },
        { who: 'hero', emo: 'broken', text: '{s}那你现在为什么还站在他们那边！！{/s}' },
        { who: 'friend', emo: 'sad', alt: 1, text: '……因为我不知道还能站在哪边。' }
      ] }]
    ] },
    { t: 'zoom', z: 1, ms: 1600, wait: false },
    { t: 'redEdge', a: .3, ms: 1200 },
    { t: 'wait', ms: 900 },
    { t: 'say', who: 'friend', emo: 'sad', alt: 1, text: '……有一件事是真的。' },
    { t: 'par', steps: [
      [{ t: 'zoom', z: 1.12, ms: 3000, cx: 980, cy: 330, wait: false }],
      [{ t: 'lines', list: [
        { who: 'friend', emo: 'sad', alt: 1, text: '我把你当朋友。' },
        { who: 'friend', emo: 'sad', alt: 1, text: '这一件，{p:800}从来没有骗过你。' }
      ] }]
    ] },
    { t: 'zoom', z: 1, ms: 1200, wait: false },
    { t: 'flag', k: 'friendRevealed' },
    { t: 'codex', id: 'friend' },
    { t: 'sanity', n: -10 },
    { t: 'tint', color: '#000', a: 0, ms: 1400 },
    { t: 'learn', k: 'friend_betray', label: '朋友是反派阵营的人 —— 但「把你当朋友」这句是真的' }
  ];

  CS.c5_ty_analysis = [
    { t: 'bg', id: 'shrine', fade: 700 },
    { t: 'bgm', id: 'grief', fade: 1400 },
    { t: 'clear' },
    { t: 'enter', who: 'ty', slot: 'right', emo: 'cold', flip: true },
    { t: 'enter', who: 'hero', slot: 'left', emo: 'numb' },
    { t: 'say', who: 'ty', emo: 'cold', text: '他给了我们三个信息。' },
    { t: 'say', who: 'hero', emo: 'broken', text: '{s}他刚说他害死了老人！{/s}' },
    { t: 'say', who: 'ty', emo: 'cold', text: '是。{p:400}这是第一个信息。' },
    { t: 'say', who: 'ty', emo: 'cold',
      text: '第二：他妹妹三年前就死了，而他们隐瞒了。{p:500}说明对方内部有信息壁垒。' },
    { t: 'say', who: 'ty', emo: 'sharp',
      text: '第三：他告诉了你这一切。{p:600}没有人会向敌人交底——除非他在求一个出口。' },
    { t: 'say', who: 'hero', emo: 'anger', text: '……你就只会分析吗？' },
    { t: 'say', who: 'ty', emo: 'cold', text: '……' },
    { t: 'wait', ms: 1000 },
    { t: 'say', who: 'ty', emo: 'sad', text: '我也想砸东西。' },
    { t: 'say', who: 'hero', emo: 'surprise', text: '……啊？' },
    { t: 'say', who: 'ty', emo: 'sad',
      text: '我在上一条时间线里，砸过。{p:500}砸了整整一间实验室。' },
    { t: 'say', who: 'ty', emo: 'cold',
      text: '然后我用了十一天才把那些数据重新算出来。{p:500}那十一天里，死了两千人。' },
    { t: 'say', who: 'ty', emo: 'determined',
      text: '所以现在我先分析。{p:600}砸东西，等世界得救之后再说。' },
    { t: 'wait', ms: 900 },
    { t: 'say', who: 'hero', emo: 'sad', text: '……那我陪你砸。' },
    { t: 'say', who: 'ty', emo: 'cold', text: '记下了。' }
  ];

  CS.c5_boss5_pre = [
    { t: 'bg', id: 'shrine', fade: 500 },
    { t: 'bgm', id: 'dread', fade: 600 },
    { t: 'clear' },
    { t: 'enter', who: 'friend', slot: 'right', emo: 'numb', alt: 1, flip: true, scale: 1.9 },
    { t: 'enter', who: 'hero', slot: 'left', emo: 'determined' },
    { t: 'say', who: 'friend', emo: 'numb', alt: 1, text: '上机吧。' },
    { t: 'say', who: 'hero', emo: 'determined', text: '……你真要打？' },
    { t: 'say', who: 'friend', emo: 'sad', alt: 1, text: '我得让他们看到我在打。' },
    { t: 'say', who: 'friend', emo: 'numb', alt: 1, text: '……而且我想知道一件事。' },
    { t: 'say', who: 'hero', emo: 'fear', text: '什么？' },
    { t: 'say', who: 'friend', emo: 'sad', alt: 1,
      text: '我想知道，{p:500}我看了你八年，{p:400}到底看懂了多少。' },
    { t: 'say', who: 'ty', emo: 'sharp',
      text: '注意：他会把我的护航舱当目标。{p:400}那里有我全部的推演结果。',
      onEnter: function () { G.Dlg.addActor('ty', { slot: 'center', z: -1, scale: 1.6, y: 415 }); } },
    { t: 'say', who: 'ty', emo: 'cold', text: '如果它被击毁——{p:500}我这一次轮回的一切都归零。' },
    { t: 'say', who: 'hero', emo: 'determined', text: '……我会守住它。' },
    { t: 'say', who: 'ty', emo: 'cold', text: '不是「会」。{p:400}是「必须」。' },
    { t: 'sub', text: '⚠ 护航舱被击毁将导致无法挽回的后果。', ms: 3400, y: 660, size: 17 }
  ];

  CS.c5_boss5_post = [
    { t: 'bg', id: 'shrine', fade: 700 },
    { t: 'bgm', id: 'grief', fade: 1400 },
    { t: 'clear' },
    { t: 'enter', who: 'friend', slot: 'right', emo: 'pain', alt: 1, flip: true },
    { t: 'enter', who: 'hero', slot: 'left', emo: 'pain' },
    { t: 'say', who: 'friend', emo: 'pain', alt: 1, text: '哈……{p:400}你变强了。' },
    { t: 'say', who: 'hero', emo: 'pain', text: '……我死了很多次。' },
    { t: 'say', who: 'friend', emo: 'sad', alt: 1, text: '我知道。' },
    { t: 'say', who: 'friend', emo: 'sad', alt: 1,
      text: '我每次都看着你回来。{p:600}然后装作什么都不知道。' },
    { t: 'say', who: 'friend', emo: 'broken', alt: 1,
      text: '你知道最难的是什么吗？{p:600}是每次都要重新和你打第一次招呼。' },
    { t: 'wait', ms: 1200 },
    { t: 'say', who: 'hero', emo: 'sad', text: '……' },
    { t: 'say', who: 'friend', emo: 'numb', alt: 1, text: '我走了。' },
    { t: 'say', who: 'hero', emo: 'broken', text: '{s}站住！{/s}' },
    { t: 'say', who: 'friend', emo: 'sad', alt: 1, text: '我们在终点见。' },
    { t: 'wait', ms: 700 },
    { t: 'say', who: 'friend', emo: 'sad', alt: 1,
      text: '……到时候，{p:600}你要是还愿意，{p:500}就叫我一声名字吧。' },
    { t: 'say', who: 'hero', emo: 'surprise', text: '……你叫什么？' },
    { t: 'wait', ms: 1400 },
    { t: 'say', who: 'friend', emo: 'smile', alt: 1, text: '……你想想。' },
    { t: 'exit', who: 'friend', to: 'right', ms: 1400 },
    { t: 'wait', ms: 1000 },
    { t: 'say', who: 'hero', emo: 'sad', text: '……' },
    { t: 'say', who: 'hero', emo: 'broken', text: '（……我想不起来。）' },
    { t: 'say', who: 'hero', emo: 'broken', text: '（八年了。{p:600}我居然想不起来。）' },
    { t: 'sanity', n: -6 },
    { t: 'call', fn: function () { G.St.s.bossCleared.boss5 = true; } }
  ];

  /* ---- IF 第二阶段：动摇（第五章后） ---- */
  CS.if_waver = [
    { t: 'bg', id: 'shrine', fade: 800 },
    { t: 'bgm', id: 'grief', fade: 1400 },
    { t: 'clear' },
    { t: 'enter', who: 'upright', slot: 'right', emo: 'sad', flip: true },
    { t: 'enter', who: 'hero', slot: 'left', emo: 'numb' },
    { t: 'say', who: 'upright', emo: 'sad', text: '……我一直坚持不用那份力量。' },
    { t: 'say', who: 'hero', emo: 'surprise', text: '什么力量？' },
    { t: 'wait', ms: 900 },
    { t: 'say', who: 'upright', emo: 'sad', text: '我……{p:600}其实有背景。' },
    { t: 'say', who: 'upright', emo: 'sad',
      text: '我的家族……{p:500}掌握着某种力量。{p:600}但我从没用过。' },
    { t: 'say', who: 'hero', emo: 'fear', text: '为什么不用？' },
    { t: 'par', steps: [
      [{ t: 'zoom', z: 1.14, ms: 4000, cx: 980, cy: 330, wait: false }],
      [{ t: 'lines', list: [
        { who: 'upright', emo: 'sad', text: '因为我害怕。' },
        { who: 'upright', emo: 'sad', text: '害怕变成……{p:900}另一个人。' },
        { who: 'upright', emo: 'sad', text: '我年轻的时候，见过族里一个人用它。' },
        { who: 'upright', emo: 'numb', text: '他救了一座城。{p:700}然后他杀光了那座城。' },
        { who: 'upright', emo: 'sad', text: '他到最后都以为自己在救人。' }
      ] }]
    ] },
    { t: 'zoom', z: 1, ms: 1400, wait: false },
    { t: 'wait', ms: 900 },
    { t: 'say', who: 'upright', emo: 'broken',
      text: '……但如果我早点站出来，{p:600}是不是能救更多人？' },
    { t: 'say', who: 'hero', emo: 'sad', text: '……' },
    { t: 'say', who: 'hero', emo: 'determined', text: '我不知道。' },
    { t: 'say', who: 'hero', emo: 'determined',
      text: '但我知道，{p:500}你到现在都还是你。' },
    { t: 'say', who: 'hero', emo: 'determined', text: '这已经很难了。' },
    { t: 'wait', ms: 1200 },
    { t: 'say', who: 'upright', emo: 'sad', text: '……' },
    { t: 'say', who: 'upright', emo: 'determined', text: '……谢谢。' },
    { t: 'flag', k: 'uprightKnowsSecret' },
    { t: 'flag', k: 'seenIfHint2' },
    { t: 'learn', k: 'upright_power', label: '正直的人的家族力量 —— 他选择不用，因为怕变成别人' }
  ];

  /* ============================================================
     第六章 · 恶人的救世主与最终决战
     ============================================================ */
  CS.c6_open = [
    { t: 'reset' },
    { t: 'bg', id: 'core', fade: 1600 },
    { t: 'bgm', id: 'core', fade: 2000 },
    { t: 'clear' },
    { t: 'card', small: 'CHAPTER  6', big: '恶人的救世主', ms: 2600 },
    { t: 'redEdge', a: .35, ms: 1600 },
    { t: 'enter', who: 'hero', slot: 'left', emo: 'determined' },
    { t: 'enter', who: 'ty', slot: 'right', emo: 'cold', flip: true },
    { t: 'say', who: 'ty', emo: 'cold', text: '核心空域。{p:500}这里是他的巢。' },
    { t: 'say', who: 'hero', emo: 'fear', text: '……为什么这里的骨头这么多。' },
    { t: 'say', who: 'ty', emo: 'cold', text: '因为他从不掩埋追随者。' },
    { t: 'say', who: 'ty', emo: 'cold', text: '他说，{p:400}「被抛弃的人，死后也该被看见」。' },
    { t: 'wait', ms: 900 },
    { t: 'say', who: 'hero', emo: 'sad', text: '……这句话，我居然听得懂。' },
    { t: 'say', who: 'ty', emo: 'sharp', text: '这是他最危险的地方。' },
    { t: 'say', who: 'ty', emo: 'cold',
      text: '他不会试图打败你。{p:600}他会试图{c:#ff5f7a}说服{/c}你。' },
    { t: 'say', who: 'ty', emo: 'cold',
      text: '记住：{p:400}你可以理解他。{p:500}但你不能认同他。' },
    { t: 'learn', k: 'boss_warning', label: 'TY 的警告：你可以理解他，但不能认同他' }
  ];

  CS.c6_lucky_death = [
    { t: 'bg', id: 'core', fade: 600 },
    { t: 'clear' },
    { t: 'if', cond: function () { return G.St.isDead('lucky'); }, then: [
      { t: 'sub', text: '（幸运儿已经不在了。）', ms: 2000, y: 640 }
    ], else: [
      { t: 'bgm', id: 'core', fade: 500, layers: { lead: false } },
      { t: 'enter', who: 'lucky', slot: 'right', emo: 'smile', flip: true },
      { t: 'enter', who: 'hero', slot: 'left', emo: 'determined' },
      { t: 'say', who: 'lucky', emo: 'smile', text: '哎呀，前面好像有埋伏。' },
      { t: 'say', who: 'hero', emo: 'fear', text: '你怎么知道？' },
      { t: 'say', who: 'lucky', emo: 'smile', text: '直觉！{p:300}我的直觉从来没错过。' },
      { t: 'par', steps: [
        [{ t: 'sfx', id: 'alarm' }],
        [{ t: 'redEdge', a: .9, ms: 400 }],
        [{ t: 'shake', p: 18, ms: 800 }]
      ] },
      { t: 'say', who: 'lucky', emo: 'surprise', text: '——来了！' },
      { t: 'closebox' },
      /* 他的好运让他躲开，代价却更大 */
      { t: 'par', steps: [
        [{ t: 'slowmo', scale: .12, ms: 5000 }],
        [{ t: 'letterbox', a: 1, ms: 500 }],
        /* 时长要覆盖后面四句旁白：原来 5000ms 一到画面就空了，
           剩下三句「导弹偏了 / 击中了核心」放在空背景上 */
        [{ t: 'paint', fn: 'planeDuel', ms: 16000, keep: true,
           data: { n: 2, c1: '#FFA23A', c2: '#4FC3F7' }, layer: 'over', wait: false }]
      ] },
      { t: 'sub', text: '一发导弹朝主角飞来。', ms: 2200, y: 130 },
      { t: 'sub', text: '幸运儿的机身横切过来——不是挡，是撞开。', ms: 3000, y: 130 },
      { t: 'sub', text: '导弹偏了。它擦着他的机翼飞过去，一点都没碰到他。', ms: 3600, y: 130 },
      { t: 'sub', text: '……他的运气，一次都没有失效过。', ms: 3400, y: 130 },
      { t: 'wait', ms: 900 },
      { t: 'sub', text: '偏了的导弹，击中了他身后那座平台的能源核心。', ms: 3600, y: 130 },
      { t: 'par', steps: [
        [{ t: 'flash', color: '#ffb15e', ms: 700, a: 1 }],
        [{ t: 'shake', p: 34, ms: 1800 }],
        [{ t: 'sfx', id: 'explode', arg: true }],
        [{ t: 'unpaint', ms: 900, wait: false }]
      ] },
      { t: 'wait', ms: 1600 },
      { t: 'stopBgm', ms: 600 },
      { t: 'wind', gain: .1 },
      { t: 'clear' },
      { t: 'bg', id: 'core', fade: 400 },
      { t: 'paint', fn: 'featherFall', ms: 999999, keep: true, layer: 'over', wait: false },
      { t: 'enter', who: 'lucky', slot: 'left', emo: 'smile', scale: 1.7, y: 470,
        tintColor: '#6a6a72', tintAmt: .55, luckOff: true },
      { t: 'wait', ms: 1400 },
      { t: 'sub', text: '战机没有爆炸。它像羽毛一样，缓缓地往下飘。', ms: 3600, y: 640 },
      { t: 'say', who: 'lucky', emo: 'smile', text: '……啊。' },
      { t: 'say', who: 'lucky', emo: 'smile', text: '看来……{p:700}我的运气……{p:800}终于用完了……' },
      { t: 'say', who: 'hero', emo: 'broken', text: '{s}不！！{p:300}你的运气最好！你说过的！{/s}' },
      { t: 'say', who: 'lucky', emo: 'smile',
        text: '是啊……{p:500}我每次都躲开了……' },
      { t: 'say', who: 'lucky', emo: 'sad',
        text: '躲开的那些，{p:700}总得有个地方去……' },
      { t: 'wait', ms: 1400 },
      { t: 'say', who: 'lucky', emo: 'smile', text: '……喂。' },
      { t: 'say', who: 'lucky', emo: 'smile', text: '这次换我传染给你。' },
      { t: 'say', who: 'lucky', emo: 'smile', text: '……拿好啊。' },
      { t: 'wait', ms: 1600 },
      { t: 'par', steps: [
        [{ t: 'motes', who: 'lucky', color: '#ffd8a8', n: 40 }],
        [{ t: 'actor', who: 'lucky', alpha: 0, tintAmt: .9, ms: 3400, wait: false }],
        [{ t: 'sfx', id: 'shatter' }]
      ] },
      { t: 'kill', who: 'lucky' },
      { t: 'flag', k: 'luckyDead' },
      { t: 'sanity', n: -12 },
      { t: 'sub', text: '战机消失在云层中，留下一片发光的羽毛，缓缓落下。', ms: 4200, y: 640 },
      { t: 'sub', text: '——他的嘴角，一直是上扬的。', ms: 3600, y: 640 },
      { t: 'hold', ms: 4200, letterbox: true, keepBox: true },
      { t: 'wind', off: true, ms: 2200 },
      { t: 'unpaint', ms: 1600 }
    ] }
  ];

  CS.c6_madman_turn = [
    { t: 'bg', id: 'core', fade: 700 },
    { t: 'bgm', id: 'core', fade: 900, layers: { lead: false, arp: false } },
    { t: 'clear' },
    { t: 'enter', who: 'madman', slot: 'right', emo: 'mad', flip: true, scale: 1.9 },
    { t: 'enter', who: 'hero', slot: 'left', emo: 'numb' },
    { t: 'say', who: 'madman', emo: 'mad', text: '嘿嘿！{p:300}到啦到啦！' },
    { t: 'say', who: 'hero', emo: 'anger', text: '……你又来干什么。' },
    { t: 'say', who: 'madman', emo: 'mad', text: '来收尾呀！{p:300}疯子的活儿，做完就得——' },
    /* —— 反转 —— */
    { t: 'closebox' },
    { t: 'par', steps: [
      [{ t: 'stopBgm', ms: 300 }],
      [{ t: 'actor', who: 'madman', alt: 1, emo: 'cold', ms: 2200, wait: false }],
      [{ t: 'tint', color: '#1a1200', a: .3, ms: 1400 }],
      [{ t: 'paint', fn: 'madSerious', ms: 999999, keep: true, wait: false }],
      [{ t: 'sfx', id: 'charge' }]
    ] },
    { t: 'wait', ms: 2200 },
    { t: 'sub', text: '他停止了所有晃动。身体挺直。', ms: 2800, y: 640 },
    { t: 'sub', text: '亮黄色褪成了暗金。漩涡状的眼睛，变成了两条笔直的细线。', ms: 4000, y: 640 },
    { t: 'wait', ms: 900 },
    { t: 'say', who: 'madman', emo: 'cold', alt: 1, text: '——测试开始。' },
    { t: 'say', who: 'hero', emo: 'surprise', text: '……什么？' },
    { t: 'par', steps: [
      [{ t: 'flash', color: '#B8860B', ms: 400, a: .7 }],
      [{ t: 'shake', p: 24, ms: 1400 }],
      [{ t: 'sfx', id: 'laser' }],
      [{ t: 'actor', who: 'hero', emo: 'pain', ms: 200, wait: false }]
    ] },
    { t: 'sub', text: '三秒。他用了三秒。', ms: 2400, y: 130 },
    { t: 'sub', text: '主角的机体被打穿了四处非致命部位——精准到像是量过的。', ms: 4000, y: 640 },
    { t: 'say', who: 'hero', emo: 'pain', text: '呃啊……！' },
    { t: 'say', who: 'madman', emo: 'cold', alt: 1, text: '第五处是心脏。' },
    { t: 'say', who: 'madman', emo: 'cold', alt: 1, text: '……我停手了。' },
    { t: 'wait', ms: 1200 },
    { t: 'say', who: 'hero', emo: 'broken', text: '{s}你到底是谁！！{/s}' },
    { t: 'par', steps: [
      [{ t: 'zoom', z: 1.16, ms: 6000, cx: 980, cy: 330, wait: false }],
      [{ t: 'lines', list: [
        { who: 'madman', emo: 'cold', alt: 1, text: '我曾经和他是同事。' },
        { who: 'hero', emo: 'surprise', text: '……TY？' },
        { who: 'madman', emo: 'cold', alt: 1, text: '在他死之前，我们一起算了十一年。' },
        { who: 'madman', emo: 'cold', alt: 1, text: '第十一年，我算出了结论：这个世界救不了。' },
        { who: 'madman', emo: 'numb', alt: 1, text: '他不接受。{p:600}我接受了。' },
        { who: 'madman', emo: 'numb', alt: 1, text: '于是我疯了。{p:600}——是我自己选的。' },
        { who: 'madman', emo: 'cold', alt: 1, text: '疯子说的话没人信。{p:500}这样我就不用负责了。' }
      ] }]
    ] },
    { t: 'zoom', z: 1, ms: 1600, wait: false },
    { t: 'wait', ms: 900 },
    { t: 'say', who: 'hero', emo: 'sad', text: '……那你现在为什么停手。' },
    { t: 'wait', ms: 1400 },
    { t: 'par', steps: [
      [{ t: 'zoom', z: 1.2, ms: 5000, cx: 980, cy: 330, wait: false }],
      [{ t: 'lines', list: [
        { who: 'madman', emo: 'cold', alt: 1, text: '因为我算错了一件事。' },
        { who: 'madman', emo: 'sad', alt: 1, text: '我以为救世界需要的是最强的人。' },
        { who: 'madman', emo: 'determined', alt: 1,
          text: '……{c:#ffe23a}不是。{p:700}需要的是最不想放弃的那个。{/c}' },
        { who: 'madman', emo: 'sad', alt: 1, text: '而那个人，一直在发抖。' },
        { who: 'madman', emo: 'determined', alt: 1, text: '——那个人是你。' }
      ] }]
    ] },
    { t: 'zoom', z: 1, ms: 1400, wait: false },
    { t: 'wait', ms: 1000 },
    { t: 'say', who: 'madman', emo: 'cold', alt: 1, text: '……还有一句。' },
    { t: 'say', who: 'madman', emo: 'cold', alt: 1,
      text: '如果你和他都倒下了——{p:800}别以为一切就结束了。' },
    { t: 'say', who: 'hero', emo: 'surprise', text: '……什么意思？' },
    { t: 'say', who: 'madman', emo: 'determined', alt: 1,
      text: '{c:#ffe23a}这个世界里，还有第三个人没有出手。{/c}' },
    { t: 'say', who: 'hero', emo: 'surprise', text: '……谁？' },
    { t: 'say', who: 'madman', emo: 'cold', alt: 1, text: '……到时候你就知道了。' },
    { t: 'exit', who: 'madman', to: 'right', ms: 1600 },
    { t: 'unpaint', fn: 'madSerious', ms: 1600 },
    { t: 'tint', color: '#000', a: 0, ms: 1400 },
    { t: 'flag', k: 'madmanRevealed' },
    { t: 'flag', k: 'seenIfHint3' },
    { t: 'learn', k: 'third_person', label: '疯子说：这个世界里还有第三个人没有出手' },
    { t: 'learn', k: 'madman_truth', label: '疯子曾是 TY 的同事 —— 他算出了「救不了」，然后主动疯了' }
  ];

  /* ---- 最终对峙：分屏 + 核心台词 + 坏结局D 选项 ---- */
  CS.c6_boss6_pre = [
    { t: 'reset' },
    { t: 'bg', id: 'core', fade: 900 },
    { t: 'bgm', id: 'boss6a', fade: 1200, layers: { drums: false, arp: false } },
    { t: 'clear' },
    { t: 'redEdge', a: .4, ms: 1400 },
    { t: 'enter', who: 'savior', slot: 'right', emo: 'calm', flip: true, scale: 2.0, from: 'right', ms: 2200 },
    { t: 'enter', who: 'hero', slot: 'left', emo: 'determined' },
    { t: 'wait', ms: 900 },
    { t: 'say', who: 'savior', emo: 'calm', text: '你来了。' },
    { t: 'say', who: 'savior', emo: 'calm', text: '我等了很久。{p:500}不是等你来杀我。' },
    { t: 'say', who: 'savior', emo: 'calm', text: '是等一个能听懂我说话的人。' },
    { t: 'say', who: 'hero', emo: 'anger', text: '……我不想听。' },
    { t: 'say', who: 'savior', emo: 'smile', text: '你会听的。' },

    /* 分屏：两个过去 */
    { t: 'closebox' },
    { t: 'par', steps: [
      [{ t: 'paint', fn: 'splitPast', ms: 14000, keep: true, wait: false }],
      [{ t: 'actor', who: 'savior', alpha: .12, ms: 1400, wait: false }],
      [{ t: 'actor', who: 'hero', alpha: .12, ms: 1400, wait: false }],
      [{ t: 'wait', ms: 1800 }]
    ] },
    { t: 'sub', text: '从小被排挤。被人看不起。父母早逝。无人关爱。', ms: 4000, y: 640 },
    { t: 'sub', text: '还有一个比他更强的人，一直压着他一头——那个人曾经是他的挚友。', ms: 4800, y: 640 },
    { t: 'sub', text: '无论他怎么努力，人们总是说：「你不如他。」', ms: 4400, y: 640 },
    { t: 'wait', ms: 1200 },
    { t: 'sub', text: '……而在屏幕的另一边，是你失去的每一个人。', ms: 4400, y: 640 },
    { t: 'wait', ms: 1400 },
    { t: 'unpaint', fn: 'splitPast', ms: 2000 },
    { t: 'par', steps: [
      [{ t: 'actor', who: 'savior', alpha: 1, ms: 1400, wait: false }],
      [{ t: 'actor', who: 'hero', alpha: 1, ms: 1400, wait: false }]
    ] },

    /* 核心台词 */
    { t: 'par', steps: [
      [{ t: 'zoom', z: 1.12, ms: 9000, cx: 960, cy: 340, wait: false }],
      [{ t: 'lines', list: [
        { who: 'savior', emo: 'sad', text: '别人不看好我。' },
        { who: 'savior', emo: 'sad', text: '我的父母又走得早。' },
        { who: 'savior', emo: 'numb', text: '然后，{p:700}谁都不爱我……' }
      ] }]
    ] },
    { t: 'par', steps: [
      [{ t: 'paint', fn: 'impactText', ms: 4200, layer: 'over',
         data: { text: '那我只能比别人更爱我自己一点！', size: 34, y: 250 }, wait: false }],
      [{ t: 'flash', color: '#E0244A', ms: 600, a: .7 }],
      [{ t: 'shake', p: 22, ms: 1400 }],
      [{ t: 'actor', who: 'savior', emo: 'anger', ms: 300, wait: false }],
      [{ t: 'bgm', id: 'boss6a', fade: 600 }],
      [{ t: 'wait', ms: 4200 }]
    ] },
    { t: 'zoom', z: 1, ms: 1600, wait: false },
    { t: 'wait', ms: 900 },

    { t: 'say', who: 'savior', emo: 'calm', text: '你和我，{p:800}有什么不同？' },
    { t: 'say', who: 'savior', emo: 'calm', text: '你也失去了所有。' },
    { t: 'say', who: 'savior', emo: 'calm', text: '你也充满了恨。' },
    { t: 'say', who: 'savior', emo: 'anger', text: '你也{s}杀了你的朋友{/s}——' },
    { t: 'say', who: 'savior', emo: 'calm', text: '你凭什么审判我？' },
    { t: 'wait', ms: 1400 },

    /* —— 关键选择：坏结局 D —— */
    { t: 'choice', who: 'hero', emo: 'numb',
      text: '（……我该说什么。）',
      choices: [
        {
          id: 'refuse',
          text: '我不审判你。{p:300}我只是不让你继续。',
          lines: [
            { who: 'hero', emo: 'determined', text: '我不审判你。' },
            { who: 'hero', emo: 'determined', text: '我没资格。{p:500}我也做过没资格的事。' },
            { who: 'hero', emo: 'determined',
              text: '但我不会让你继续。{p:600}因为{c:#9ff0ff}后面还有人{/c}。' },
            { who: 'savior', emo: 'anger', text: '……「后面还有人」？' },
            { who: 'savior', emo: 'smile', text: '我后面从来没有人。' },
            { who: 'hero', emo: 'sad', text: '……我知道。' },
            { who: 'hero', emo: 'determined', text: '这就是我们的不同。' }
          ]
        },
        {
          id: 'understand',
          text: '……我懂你。{p:300}但我还是要打。',
          lines: [
            { who: 'hero', emo: 'sad', text: '……我懂你。' },
            { who: 'hero', emo: 'sad', text: '我真的懂。{p:600}这才是最难受的地方。' },
            { who: 'savior', emo: 'surprise', text: '……' },
            { who: 'hero', emo: 'determined',
              text: '但懂了，不等于要跟你走。{p:600}我还是要打。' },
            { who: 'savior', emo: 'sad', text: '……为什么。' },
            { who: 'hero', emo: 'determined',
              text: '因为有人跟我说过：{p:500}做你自己觉得对的事。' },
            { who: 'savior', emo: 'anger', text: '……真让人羡慕。' },
            { who: 'savior', emo: 'anger', text: '有人跟你说过话。' }
          ],
          effect: function () { G.St.addSanity(4); }
        },
        {
          id: 'join',
          text: '……你说得对。这个世界不值得我救。',
          cond: function () { return G.St.despair() >= 70; },
          hint: '危险',
          effect: function () { G.St.setFlag('joinedBoss'); },
          jump: function () { G.Ending.trigger('badD'); }
        }
      ]
    },
    { t: 'redEdge', a: .5, ms: 900 },
    { t: 'say', who: 'savior', emo: 'anger', text: '……那就没什么好说的了。' },
    { t: 'say', who: 'savior', emo: 'calm', text: '来吧。{p:500}让我看看，' },
    { t: 'say', who: 'savior', emo: 'anger', text: '「被爱过的人」，{p:400}到底能有多强。' },
    { t: 'if', cond: function () { return G.St.flag('tyAlive'); }, then: [
      { t: 'say', who: 'ty', emo: 'determined',
        text: '我会在你的通讯频道里。{p:500}从头到尾。',
        onEnter: function () { G.Dlg.addActor('ty', { slot: 'center', z: -1, scale: 1.6, y: 415 }); } },
      { t: 'say', who: 'ty', emo: 'sharp',
        text: '战斗中如果我出现在你的射线上——{p:400}{c:#ff5f7a}立刻停火{/c}。' },
      { t: 'say', who: 'hero', emo: 'determined', text: '……知道了。' }
    ] },
    { t: 'codex', id: 'savior' },
    { t: 'learn', k: 'boss_creed', label: '最终Boss 的核心：我只能比别人更爱我自己一点' }
  ];

  /* ---- 胜利（→ 好结局） ---- */
  CS.c6_win = [
    { t: 'reset' },
    { t: 'bg', id: 'core', fade: 800 },
    { t: 'stopBgm', ms: 900 },
    { t: 'clear' },
    { t: 'enter', who: 'savior', slot: 'right', emo: 'pain', flip: true, scale: 1.85,
      y: 500, rot: .14 },
    { t: 'enter', who: 'hero', slot: 'left', emo: 'pain' },
    { t: 'wind', gain: .1 },
    { t: 'say', who: 'savior', emo: 'pain', text: '哈……{p:500}哈啊……' },
    { t: 'say', who: 'savior', emo: 'numb', text: '……真的输了。' },
    { t: 'wait', ms: 900 },
    { t: 'say', who: 'savior', emo: 'numb', text: '喂。' },
    { t: 'say', who: 'hero', emo: 'pain', text: '……' },
    { t: 'say', who: 'savior', emo: 'numb', text: '你会记得我吗。' },
    { t: 'wait', ms: 1400 },
    { t: 'say', who: 'hero', emo: 'sad', text: '……会。' },
    { t: 'say', who: 'savior', emo: 'surprise', text: '……为什么。' },
    { t: 'say', who: 'hero', emo: 'sad',
      text: '因为你说的每一句话，{p:600}我都差一点就相信了。' },
    { t: 'wait', ms: 1200 },
    { t: 'say', who: 'savior', emo: 'sad', text: '……' },
    { t: 'say', who: 'savior', emo: 'smile', text: '……那就够了。' },
    { t: 'say', who: 'savior', emo: 'smile', text: '被记住一次，就够了。' },
    { t: 'par', steps: [
      [{ t: 'motes', who: 'savior', color: '#E0244A', n: 44 }],
      [{ t: 'actor', who: 'savior', alpha: 0, tintColor: '#5B2A8C', tintAmt: .8, ms: 4000, wait: false }],
      [{ t: 'sfx', id: 'shatter' }]
    ] },
    { t: 'kill', who: 'savior' },
    { t: 'wait', ms: 2200 },
    { t: 'wind', off: true, ms: 1800 },
    { t: 'redEdge', a: 0, ms: 2000 },
    { t: 'par', steps: [
      [{ t: 'bg', id: 'newcity', fade: 4000 }],
      [{ t: 'bgm', id: 'hope', fade: 4000 }],
      [{ t: 'desat', a: 0, ms: 3000, wait: false }]
    ] },
    { t: 'wait', ms: 1400 },
    { t: 'say', who: 'hero', emo: 'numb', text: '……' },
    { t: 'if', cond: function () { return G.St.flag('tyAlive'); }, then: [
      { t: 'enter', who: 'ty', slot: 'right', emo: 'cold', flip: true, decay: 5 },
      { t: 'say', who: 'ty', emo: 'cold', decay: 5, text: '……成功了。' },
      { t: 'say', who: 'ty', emo: 'cold', decay: 5, text: '命运线偏移量：{p:400}正无穷。' },
      { t: 'say', who: 'hero', emo: 'surprise', text: '什么意思？' },
      { t: 'say', who: 'ty', emo: 'determined', decay: 5,
        text: '意思是：{p:600}这个世界，{p:500}从现在开始，{p:500}没有既定结局了。' },
      { t: 'wait', ms: 1200 },
      { t: 'say', who: 'hero', emo: 'sad', text: '……那我可以回家了？' },
      { t: 'say', who: 'ty', emo: 'cold', decay: 5, text: '能力已经开始消退。{p:500}明天之内。' },
      { t: 'wait', ms: 1400 },
      { t: 'say', who: 'hero', emo: 'sad', text: '……TY。' },
      { t: 'say', who: 'ty', emo: 'cold', decay: 5, text: '嗯。' },
      { t: 'say', who: 'hero', emo: 'sad', text: '你的身体……' },
      { t: 'say', who: 'ty', emo: 'cold', decay: 5, text: '……（咳。）' },
      { t: 'say', who: 'ty', emo: 'cold', decay: 5, text: '我去参加庆功宴。' },
      { t: 'say', who: 'hero', emo: 'surprise', text: '你从来不参加那种东西。' },
      { t: 'say', who: 'ty', emo: 'cold', decay: 5, text: '……这次是最后一次机会。' },
      { t: 'wait', ms: 1200 },
      { t: 'say', who: 'hero', emo: 'sad', text: '……' },
      { t: 'say', who: 'hero', emo: 'sad', text: '（他在撒谎。）' },
      { t: 'say', who: 'hero', emo: 'determined', text: '（他这辈子第一次撒谎，撒得这么烂。）' }
    ] },
    { t: 'closebox' },
    { t: 'wait', ms: 900 }
  ];

})(window);
