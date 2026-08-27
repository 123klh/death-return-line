/* ===========================================================
   cut_mid.js — 第二章 / 第三章 / 第四章 过场
     含：Boss3 分支点（正直的人生死）、含泪一枪、坏结局C 引爆
   =========================================================== */
(function (root) {
  'use strict';
  var G = root.G;
  var CS = G.Cutscenes = G.Cutscenes || {};

  /* ============================================================
     第二章 · 浮空都市与正直的人
     ============================================================ */
  CS.c2_open = [
    { t: 'reset' },
    { t: 'bg', id: 'ruins', fade: 900 },
    { t: 'bgm', id: 'ruins', fade: 1400 },
    { t: 'clear' },
    { t: 'card', small: 'CHAPTER  2', big: '浮空都市与正直的人', ms: 2400 },
    { t: 'enter', who: 'hero', slot: 'left', emo: 'fear' },
    { t: 'enter', who: 'ty', slot: 'right', emo: 'cold', flip: true },
    { t: 'say', who: 'ty', emo: 'cold', text: '第七区上层还有活人。{p:400}守卫队，编制约六十。' },
    { t: 'say', who: 'hero', emo: 'fear', text: '他们会不会……也想抓我？' },
    { t: 'say', who: 'ty', emo: 'cold', text: '会。{p:500}如果他们知道你是谁。' },
    { t: 'say', who: 'hero', emo: 'broken', text: '{s}那我们为什么还要去！{/s}' },
    { t: 'say', who: 'ty', emo: 'cold', text: '因为他们有我们需要的东西。' },
    { t: 'say', who: 'ty', emo: 'sharp', text: '还因为——{p:500}上一次轮回里，这里的人全死了。' },
    { t: 'say', who: 'hero', emo: 'surprise', text: '……全部？' },
    { t: 'say', who: 'ty', emo: 'cold', text: '六十一个。{p:400}多的那一个是个孩子。' },
    { t: 'wait', ms: 700 },
    { t: 'say', who: 'hero', emo: 'sad', text: '……' },
    { t: 'say', who: 'hero', emo: 'determined', text: '……走吧。' }
  ];

  CS.c2_meet_upright = [
    { t: 'bg', id: 'ruins', fade: 500 },
    { t: 'clear' },
    { t: 'enter', who: 'upright', slot: 'right', emo: 'determined', from: 'right', flip: true },
    { t: 'enter', who: 'hero', slot: 'left', emo: 'fear' },
    { t: 'sfx', id: 'warn' },
    { t: 'say', who: 'upright', emo: 'sharp', text: '止步。{p:300}报上身份。' },
    { t: 'say', who: 'hero', emo: 'fear', text: '我、我们不是敌人！我们是来——' },
    { t: 'say', who: 'upright', emo: 'sharp', text: '身份。' },
    { t: 'say', who: 'hero', emo: 'fear', text: '……没有。' },
    { t: 'say', who: 'upright', emo: 'anger', text: '没有身份，还带着一架来路不明的战机。' },
    { t: 'say', who: 'upright', emo: 'anger', text: '……你在发抖。' },
    { t: 'say', who: 'hero', emo: 'fear', text: '对、对不起……' },
    { t: 'say', who: 'upright', emo: 'anger',
      text: '道歉？{p:500}在我的辖区里，害怕的人比敌人更危险。' },
    { t: 'say', who: 'upright', emo: 'anger',
      text: '因为害怕的人，会在关键时刻{s}跑掉{/s}。' },
    { t: 'wait', ms: 600 },
    { t: 'enter', who: 'ty', slot: 'center', emo: 'cold', z: -1, scale: 1.7, y: 420 },
    { t: 'say', who: 'ty', emo: 'cold',
      text: '你的左侧防线有一个 4.2 米的盲区。{p:400}三号哨塔的探照灯每 47 秒会照到它一次。' },
    { t: 'say', who: 'upright', emo: 'surprise', text: '……你是谁。' },
    { t: 'say', who: 'ty', emo: 'cold',
      text: '一个能告诉你，今晚 21:40 会有十四架敌机从那个盲区进来的人。' },
    { t: 'say', who: 'upright', emo: 'sharp', text: '……凭什么信你？' },
    { t: 'say', who: 'ty', emo: 'cold', text: '21:40。{p:600}你只需要等 26 分钟。' },
    { t: 'flag', k: 'metUpright' },
    { t: 'flag', k: 'uprightAlive' },
    { t: 'codex', id: 'upright' },
    { t: 'sub', text: '—— 26 分钟后 ——', ms: 2400, size: 22, y: 130 },
    { t: 'par', steps: [
      [{ t: 'sfx', id: 'alarm' }],
      [{ t: 'redEdge', a: .8, ms: 400 }],
      [{ t: 'shake', p: 12, ms: 600 }]
    ] },
    { t: 'say', who: 'upright', emo: 'surprise', text: '……十四架。{p:400}一架不多，一架不少。' },
    { t: 'say', who: 'upright', emo: 'determined', text: '全体听令——盲区布防！' },
    { t: 'redEdge', a: 0, ms: 800 }
  ];

  CS.c2_cooperate = [
    { t: 'bg', id: 'ruins', fade: 600 },
    { t: 'bgm', id: 'hope', fade: 1200 },
    { t: 'clear' },
    { t: 'enter', who: 'upright', slot: 'right', emo: 'determined', flip: true },
    { t: 'enter', who: 'hero', slot: 'left', emo: 'pain' },
    { t: 'say', who: 'upright', emo: 'determined', text: '……你没跑。' },
    { t: 'say', who: 'hero', emo: 'fear', text: '我想跑。{p:400}我一直在想跑。' },
    { t: 'say', who: 'upright', emo: 'surprise', text: '那你为什么没跑？' },
    { t: 'say', who: 'hero', emo: 'sad', text: '……因为你们站在前面。' },
    { t: 'wait', ms: 800 },
    { t: 'say', who: 'upright', emo: 'determined', text: '……' },
    { t: 'say', who: 'upright', emo: 'determined',
      text: '我收回之前的话。{p:600}{c:#ffffff}害怕不丢人。{p:500}丢人的是害怕了就什么都不做。{/c}' },
    { t: 'say', who: 'hero', emo: 'surprise', text: '……有人跟我说过一样的话。' },
    { t: 'say', who: 'upright', emo: 'determined', text: '那他是个好人。{p:500}他现在在哪？' },
    { t: 'say', who: 'hero', emo: 'sad', text: '……死了。' },
    { t: 'say', who: 'upright', emo: 'sad', text: '……' },
    { t: 'say', who: 'upright', emo: 'determined', text: '那我替他说完剩下的部分。' },
    { t: 'say', who: 'upright', emo: 'determined',
      text: '别一个人扛。{p:500}这是队长的命令。' },
    { t: 'learn', k: 'upright_creed', label: '正直的人：别一个人扛。这是队长的命令' }
  ];

  CS.c2_lucky_intro = [
    { t: 'bg', id: 'ruins', fade: 500 },
    { t: 'bgm', id: 'camp', fade: 1000 },
    { t: 'clear' },
    { t: 'enter', who: 'hero', slot: 'left', emo: 'calm' },
    { t: 'enter', who: 'lucky', slot: 'right', emo: 'smile', from: 'right', flip: true },
    { t: 'sfx', id: 'powerup' },
    { t: 'say', who: 'lucky', emo: 'smile', text: '哟——！{p:300}新面孔！' },
    { t: 'say', who: 'lucky', emo: 'smile', text: '放心放心，有我在，{p:400}运气不会差。' },
    { t: 'say', who: 'hero', emo: 'fear', text: '……你是？' },
    { t: 'say', who: 'lucky', emo: 'smile', text: '机械师！{p:300}兼飞行员！{p:300}兼这一带最走运的男人！' },
    { t: 'say', who: 'lucky', emo: 'smile',
      text: '我掉过三次云海，被击落过五次，有一次机身断成两半——' },
    { t: 'say', who: 'lucky', emo: 'smile', text: '结果我落在一堆棉花上。' },
    { t: 'say', who: 'hero', emo: 'surprise', text: '……棉花？在天上？' },
    { t: 'say', who: 'lucky', emo: 'smile', text: '对呀！{p:400}你说这是不是运气？' },
    { t: 'say', who: 'ty', emo: 'cold', text: '那是货运飞艇的缓冲填充舱。{p:400}概率约 0.03%。',
      onEnter: function () { G.Dlg.addActor('ty', { slot: 'center', z: -1, scale: 1.6, y: 415 }); } },
    { t: 'say', who: 'lucky', emo: 'smile', text: '零点零三！{p:300}那也是有嘛！' },
    { t: 'say', who: 'hero', emo: 'calm', text: '……哈。' },
    { t: 'say', who: 'lucky', emo: 'smile', text: '哎，你笑了。' },
    { t: 'say', who: 'hero', emo: 'surprise', text: '……啊？' },
    { t: 'say', who: 'lucky', emo: 'smile',
      text: '第一次见你笑。{p:600}这就叫运气传染啦。' },
    { t: 'flag', k: 'metLucky' },
    { t: 'codex', id: 'lucky' }
  ];

  /* ---- Boss3 战前：分支点（是否警告正直的人） ---- */
  CS.c2_boss3_pre = [
    { t: 'bg', id: 'ruins', fade: 600 },
    { t: 'bgm', id: 'dread', fade: 700 },
    { t: 'clear' },
    { t: 'sfx', id: 'alarm' },
    { t: 'redEdge', a: .7, ms: 500 },
    { t: 'enter', who: 'upright', slot: 'right', emo: 'determined', flip: true },
    { t: 'enter', who: 'hero', slot: 'left', emo: 'fear' },
    { t: 'say', who: 'ty', emo: 'sharp',
      text: '大型封锁兵器。{p:400}教团的「裁决机」。{p:500}它会在血量过半后蓄力一次全宽度齐射。',
      onEnter: function () { G.Dlg.addActor('ty', { slot: 'center', z: -1, scale: 1.6, y: 415 }); } },
    { t: 'say', who: 'upright', emo: 'determined', text: '全宽度？{p:400}那躲不掉。' },
    { t: 'say', who: 'ty', emo: 'cold', text: '躲不掉。{p:500}但它蓄力时会露出核心。' },
    { t: 'say', who: 'ty', emo: 'cold', text: '在核心闭合前打掉它，齐射就不会发生。' },
    { t: 'say', who: 'upright', emo: 'determined',
      text: '……如果打不掉呢？' },
    { t: 'say', who: 'ty', emo: 'cold', text: '那就需要有人挡在弹道上。' },
    { t: 'say', who: 'upright', emo: 'determined', text: '明白了。' },
    { t: 'say', who: 'hero', emo: 'fear', text: '……你「明白」什么了？' },
    { t: 'say', who: 'upright', emo: 'determined', text: '明白我该站在哪儿。' },

    /* —— 关键选择 —— */
    { t: 'choice', who: 'hero', emo: 'fear',
      text: '（他会挡在我前面。{p:400}……我知道，因为我见过太多人挡在我前面。）',
      choices: [
        {
          id: 'warn',
          text: '……别挡在我前面。求你了。',
          hint: '',
          effect: function () {
            G.St.setFlag('warnedUpright');
            G.St.learn('warned_upright', '我告诉过他：别挡在我前面');
          },
          lines: [
            { who: 'upright', emo: 'surprise', text: '……什么？' },
            { who: 'hero', emo: 'broken', text: '{s}别挡在我前面！{/s}' },
            { who: 'hero', emo: 'sad',
              text: '已经有人挡在我前面死掉了。{p:600}我不想再看第二次。' },
            { who: 'upright', emo: 'sad', text: '……' },
            { who: 'upright', emo: 'determined',
              text: '那你就把那个核心打掉。' },
            { who: 'upright', emo: 'determined',
              text: '你打掉它，我就不用冲。{p:600}——这是交易，不是请求。' },
            { who: 'hero', emo: 'determined', text: '……好。' },
            { who: 'ty', emo: 'cold', text: '记住：{c:#9ff0ff}它蓄力时，核心在正下方。{/c}' }
          ]
        },
        {
          id: 'silent',
          text: '……（说不出口）',
          lines: [
            { who: 'hero', emo: 'fear', text: '（……说不出口。）' },
            { who: 'hero', emo: 'fear', text: '（我连「别死」两个字都说不出口。）' },
            { who: 'upright', emo: 'determined', text: '愣着干什么。{p:400}上机。' }
          ]
        },
        {
          id: 'trust',
          text: '……你会没事的，对吧？',
          lines: [
            { who: 'upright', emo: 'determined', text: '当然。' },
            { who: 'upright', emo: 'sad', text: '……我会尽力。' },
            { who: 'hero', emo: 'fear', text: '（他改口了。）' }
          ]
        }
      ]
    },
    { t: 'redEdge', a: 0, ms: 600 },
    { t: 'if', cond: function () { return G.St.s.loopCount >= 1 && !G.St.flag('warnedUpright'); }, then: [
      { t: 'say', who: 'ty', emo: 'cold',
        text: '……（低声）你上一次也是这样。{p:500}然后他死了。' },
      { t: 'say', who: 'hero', emo: 'broken', text: '{s}……我知道！{/s}' }
    ] }
  ];

  /* ---- 标准路线：正直的人战死 ---- */
  CS.c2_upright_death = [
    { t: 'reset' },
    { t: 'bg', id: 'ruins', fade: 300 },
    { t: 'clear' },
    { t: 'stopBgm', ms: 300 },
    { t: 'par', steps: [
      [{ t: 'slowmo', scale: .1, ms: 4200 }],
      [{ t: 'letterbox', a: 1, ms: 400 }],
      [{ t: 'paint', fn: 'shieldDive', ms: 4200, layer: 'over', wait: false }],
      [{ t: 'sfx', id: 'warn' }]
    ] },
    { t: 'wait', ms: 900 },
    { t: 'sub', text: '一道白色的机影从侧翼冲了过来。', ms: 2400, y: 640 },
    { t: 'wait', ms: 700 },
    { t: 'say', who: 'hero', emo: 'broken', text: '{s}——不要！！{/s}', hideBox: false,
      onEnter: function () { G.Dlg.addActor('hero', { slot: 'left', emo: 'broken', scale: 1.6, y: 450 }); } },
    { t: 'par', steps: [
      [{ t: 'flash', color: '#ffffff', ms: 600, a: 1 }],
      [{ t: 'shake', p: 30, ms: 1200 }],
      [{ t: 'sfx', id: 'explode', arg: true }]
    ] },
    { t: 'wait', ms: 1200 },
    { t: 'unpaint', ms: 900 },
    { t: 'clear' },
    { t: 'bg', id: 'ruins', fade: 600 },
    { t: 'wind', gain: .1 },
    { t: 'enter', who: 'upright', slot: 'center', emo: 'pain', ms: 900,
      tintColor: '#c8ccd4', tintAmt: .5, scale: 1.75, y: 460 },
    { t: 'sub', text: '通讯频道里只剩下电流声。然后，是他的声音。', ms: 3000, y: 640 },
    { t: 'par', steps: [
      [{ t: 'zoom', z: 1.16, ms: 4200, cx: 640, cy: 340, wait: false }],
      [{ t: 'lines', list: [
        { who: 'upright', emo: 'pain', text: '……正义……' },
        { who: 'upright', emo: 'determined', text: '不是不付出代价……' },
        { who: 'upright', emo: 'determined', text: '而是知道代价后……{p:900}依然选择……' }
      ] }]
    ] },
    { t: 'say', who: 'hero', emo: 'broken', text: '{s}我不需要！！{p:300}我不需要你替我死！！{/s}' },
    { t: 'say', who: 'upright', emo: 'sad', text: '……这不是替你。' },
    { t: 'say', who: 'upright', emo: 'determined', text: '这是我自己……{p:800}觉得对的事。' },
    { t: 'wait', ms: 900 },
    { t: 'par', steps: [
      [{ t: 'shatter', who: 'upright', color: '#ffffff', n: 70, ms: 1600, wait: false }],
      [{ t: 'motes', who: 'upright', color: '#eaf6ff', n: 40 }],
      [{ t: 'sfx', id: 'shatter' }]
    ] },
    { t: 'kill', who: 'upright' },
    { t: 'flag', k: 'uprightAlive', v: false },
    { t: 'sanity', n: -12 },
    { t: 'zoom', z: 1, ms: 1600, wait: false },
    { t: 'sub', text: '他的哔哔声从清晰变为断断续续，最后消失。', ms: 3400, y: 640 },
    { t: 'hold', ms: 4200, letterbox: true, keepBox: true },
    { t: 'wind', off: true, ms: 1600 }
  ];

  CS.c2_after_death = [
    { t: 'bg', id: 'ruins', fade: 700 },
    { t: 'bgm', id: 'grief', fade: 1600 },
    { t: 'clear' },
    { t: 'enter', who: 'hero', slot: 'left', emo: 'broken' },
    { t: 'enter', who: 'ty', slot: 'right', emo: 'cold', flip: true },
    { t: 'say', who: 'hero', emo: 'broken', text: '{s}我要回归！{p:300}现在！马上！{/s}' },
    { t: 'say', who: 'ty', emo: 'cold', text: '否决。' },
    { t: 'say', who: 'hero', emo: 'broken', text: '{s}为什么！！{/s}' },
    { t: 'say', who: 'ty', emo: 'cold', text: '他的血肉不在你这里。' },
    { t: 'wait', ms: 800 },
    { t: 'say', who: 'ty', emo: 'cold',
      text: '你能救回来的，只有你自己，和我。{p:600}其他人——{p:500}只是重演。' },
    { t: 'say', who: 'hero', emo: 'broken', text: '{s}那就重演！我重演一百次！{/s}' },
    { t: 'say', who: 'ty', emo: 'sharp',
      text: '你重演一百次，他就死一百次。{p:600}而他每一次，都会记不得前面九十九次。' },
    { t: 'say', who: 'ty', emo: 'cold', text: '只有你会记得。' },
    { t: 'wait', ms: 1000 },
    { t: 'say', who: 'hero', emo: 'numb', text: '……' },
    { t: 'say', who: 'hero', emo: 'numb', text: '……那我记得，有什么用。' },
    { t: 'say', who: 'ty', emo: 'cold', text: '……' },
    { t: 'say', who: 'ty', emo: 'sad',
      text: '至少，{p:700}有人记得他挡在那里的样子。' },
    { t: 'learn', k: 'flesh_rule', label: '死亡回归只能带走血肉在我手上的人 —— 其他人只是重演' },
    { t: 'sanity', n: -4 }
  ];

  /* ---- IF 前提：正直的人存活 ---- */
  CS.c2_upright_survive = [
    { t: 'reset' },
    { t: 'bg', id: 'ruins', fade: 400 },
    { t: 'clear' },
    { t: 'par', steps: [
      [{ t: 'paint', fn: 'coreBreak', ms: 2200, layer: 'over', wait: false }],
      [{ t: 'flash', color: '#ffe9a8', ms: 700, a: .9 }],
      [{ t: 'shake', p: 20, ms: 900 }],
      [{ t: 'sfx', id: 'bomb' }],
      [{ t: 'bgm', id: 'hope', fade: 1200 }]
    ] },
    { t: 'wait', ms: 1400 },
    { t: 'enter', who: 'upright', slot: 'right', emo: 'surprise', flip: true },
    { t: 'enter', who: 'hero', slot: 'left', emo: 'pain' },
    { t: 'say', who: 'upright', emo: 'surprise', text: '……齐射没有来。' },
    { t: 'say', who: 'ty', emo: 'cold', text: '核心在闭合前 0.8 秒被击穿。{p:400}齐射条件不成立。',
      onEnter: function () { G.Dlg.addActor('ty', { slot: 'center', z: -1, scale: 1.6, y: 415 }); } },
    { t: 'say', who: 'upright', emo: 'determined', text: '……我已经把机头对准弹道了。' },
    { t: 'say', who: 'upright', emo: 'determined', text: '我已经准备好了。' },
    { t: 'wait', ms: 900 },
    { t: 'say', who: 'hero', emo: 'broken', text: '{s}……我说了别挡在我前面。{/s}' },
    { t: 'say', who: 'upright', emo: 'surprise', text: '……' },
    { t: 'say', who: 'upright', emo: 'determined', text: '……你做到了。' },
    { t: 'say', who: 'upright', emo: 'sad',
      text: '我准备了二十年，怎么替别人去死。{p:800}从来没人跟我说过——' },
    { t: 'say', who: 'upright', emo: 'sad', text: '「你可以不用死」。' },
    { t: 'wait', ms: 1000 },
    { t: 'say', who: 'hero', emo: 'sad', text: '……那现在有人说了。' },
    { t: 'closebox' },
    { t: 'par', steps: [
      [{ t: 'actor', who: 'upright', emblemGlow: .25, ms: 2200, wait: false }],
      [{ t: 'wait', ms: 1400 }]
    ] },
    { t: 'sub', text: '他护目镜边缘那个被磨损的徽记，极其微弱地亮了一下。', ms: 3600, y: 640 },
    { t: 'sub', text: '——他自己没有注意到。', ms: 2800, y: 640 },
    { t: 'flag', k: 'uprightSurvived' },
    { t: 'flag', k: 'uprightAlive' },
    { t: 'learn', k: 'upright_lives', label: '正直的人活下来了 —— 这条时间线和以往都不一样' }
  ];

  CS.c2_after_survive = [
    { t: 'bg', id: 'ruins', fade: 700 },
    { t: 'bgm', id: 'hope', fade: 1400 },
    { t: 'clear' },
    { t: 'enter', who: 'hero', slot: 'left', emo: 'calm' },
    { t: 'enter', who: 'ty', slot: 'right', emo: 'cold', flip: true },
    { t: 'say', who: 'ty', emo: 'cold', text: '……我需要重新计算。' },
    { t: 'say', who: 'hero', emo: 'surprise', text: '怎么了？' },
    { t: 'say', who: 'ty', emo: 'cold',
      text: '在我推演过的每一条分支里，{p:500}那个人都死在刚才那一秒。' },
    { t: 'say', who: 'ty', emo: 'sharp', text: '现在他活着。' },
    { t: 'say', who: 'ty', emo: 'cold', text: '……我的模型出现了一个我没放进去的变量。' },
    { t: 'say', who: 'hero', emo: 'fear', text: '这是坏事吗？' },
    { t: 'say', who: 'ty', emo: 'cold', text: '不知道。' },
    { t: 'wait', ms: 700 },
    { t: 'say', who: 'ty', emo: 'determined', text: '……这是第一次，我说「不知道」而不觉得那是失败。' },
    { t: 'sanity', n: 6 }
  ];

  /* ============================================================
     第三章 · 风暴与真相
     ============================================================ */
  CS.c3_open = [
    { t: 'reset' },
    { t: 'bg', id: 'storm', fade: 1200 },
    { t: 'bgm', id: 'storm', fade: 1600 },
    { t: 'clear' },
    { t: 'card', small: 'CHAPTER  3', big: '风暴与真相', ms: 2400 },
    { t: 'enter', who: 'hero', slot: 'left', emo: 'fear' },
    { t: 'enter', who: 'lucky', slot: 'right', emo: 'smile', flip: true,
      cond: function () { return !G.St.isDead('lucky'); } },
    { t: 'say', who: 'lucky', emo: 'smile', text: '哇——！{p:300}这风好大！' },
    { t: 'say', who: 'hero', emo: 'fear', text: '你、你怎么还笑得出来……' },
    { t: 'say', who: 'lucky', emo: 'smile', text: '因为笑不出来的时候，就更该笑呀。' },
    { t: 'par', steps: [
      [{ t: 'shake', p: 14, ms: 900 }],
      [{ t: 'flash', color: '#e8dcff', ms: 400, a: .6 }],
      [{ t: 'sfx', id: 'explode' }]
    ] },
    { t: 'say', who: 'hero', emo: 'broken', text: '{s}哇啊啊啊！！{/s}' },
    { t: 'say', who: 'lucky', emo: 'smile', text: '你看，雷打的是旁边那块石头。' },
    { t: 'say', who: 'lucky', emo: 'smile', text: '运气传染啦。' }
  ];

  CS.c3_madman_hint = [
    { t: 'bg', id: 'storm', fade: 500 },
    { t: 'clear' },
    { t: 'enter', who: 'madman', slot: 'right', emo: 'mad', flip: true },
    { t: 'enter', who: 'hero', slot: 'left', emo: 'fear' },
    { t: 'say', who: 'madman', emo: 'mad', text: '{s}呼——！{/s}{p:300}好风！好风好风好风！' },
    { t: 'say', who: 'hero', emo: 'fear', text: '你怎么在这里……' },
    { t: 'say', who: 'madman', emo: 'mad', text: '我在等风。{p:400}风来了，我就想起来了。' },
    { t: 'say', who: 'hero', emo: 'fear', text: '想起什么？' },
    { t: 'closebox' },
    { t: 'par', steps: [
      [{ t: 'actor', who: 'madman', emo: 'cold', alt: .55, ms: 1400, wait: false }],
      [{ t: 'tint', color: '#241243', a: .35, ms: 1200 }],
      [{ t: 'stopBgm', ms: 900 }]
    ] },
    { t: 'say', who: 'madman', emo: 'cold', alt: .55, text: '这里的风……{p:900}和那天一样。' },
    { t: 'wait', ms: 1400 },
    { t: 'say', who: 'hero', emo: 'surprise', text: '……哪一天？' },
    { t: 'par', steps: [
      [{ t: 'actor', who: 'madman', emo: 'mad', alt: 0, ms: 500, wait: false }],
      [{ t: 'tint', color: '#000', a: 0, ms: 700 }],
      [{ t: 'bgm', id: 'storm', fade: 900 }],
      [{ t: 'sfx', id: 'uiDeny' }]
    ] },
    { t: 'say', who: 'madman', emo: 'mad', text: '嘿嘿嘿嘿嘿嘿！{p:300}我说什么了吗？' },
    { t: 'say', who: 'madman', emo: 'mad', text: '我说饺子！{p:300}我说饺子好吃！' },
    { t: 'say', who: 'hero', emo: 'fear', text: '……' },
    { t: 'learn', k: 'madman_slip', label: '疯子说漏了嘴：「这里的风，和那天一样」' }
  ];

  CS.c3_ty_past = [
    { t: 'bg', id: 'storm', fade: 700 },
    { t: 'bgm', id: 'grief', fade: 1400 },
    { t: 'clear' },
    { t: 'enter', who: 'ty', slot: 'center', emo: 'cold', scale: 1.85 },
    { t: 'say', who: 'ty', emo: 'cold', text: '……我该告诉你一件事。' },
    { t: 'say', who: 'hero', emo: 'fear', text: '？',
      onEnter: function () { G.Dlg.addActor('hero', { slot: 'left', emo: 'fear', scale: 1.75, y: 445 }); } },
    { t: 'say', who: 'ty', emo: 'cold', text: '上一次轮回——{p:400}我说的不是「你」的上一次。' },
    { t: 'say', who: 'ty', emo: 'cold', text: '是这个世界的上一次。' },
    { t: 'say', who: 'ty', emo: 'cold',
      text: '在那条时间线里，我没有死在第七区。{p:500}我活到了最后。' },
    { t: 'say', who: 'hero', emo: 'surprise', text: '那——' },
    { t: 'say', who: 'ty', emo: 'cold', text: '我找到了方法。' },
    { t: 'wait', ms: 900 },
    { t: 'say', who: 'ty', emo: 'sad', text: '然后我死在了执行它的前一天。' },
    { t: 'par', steps: [
      [{ t: 'zoom', z: 1.18, ms: 3000, cx: 640, cy: 330, wait: false }],
      [{ t: 'lines', list: [
        { who: 'ty', emo: 'sad', text: '不是被杀。{p:400}不是被背叛。' },
        { who: 'ty', emo: 'numb', text: '是我的身体，先一步用完了。' },
        { who: 'ty', emo: 'numb', text: '我算得出所有人的死。{p:700}唯独算不出自己的。' }
      ] }]
    ] },
    { t: 'zoom', z: 1, ms: 1200, wait: false },
    { t: 'say', who: 'hero', emo: 'sad', text: '……所以你现在……' },
    { t: 'say', who: 'ty', emo: 'cold', text: '现在我有一双手了。' },
    { t: 'say', who: 'ty', emo: 'determined', text: '一双会抖，但从不松开的手。' },
    { t: 'learn', k: 'ty_past', label: 'TY 在上一条时间线里找到过方法 —— 他死在执行的前一天' },
    { t: 'sanity', n: 4 }
  ];

  CS.c3_hero_fear = [
    { t: 'bg', id: 'storm', fade: 700 },
    { t: 'stopBgm', ms: 800 },
    { t: 'clear' },
    { t: 'paint', fn: 'hideCorner', ms: 999999, keep: true, layer: 'over', wait: false },
    { t: 'wind', gain: .1 },
    { t: 'enter', who: 'hero', slot: 'center', emo: 'broken', scale: 1.6, y: 470 },
    { t: 'vignette', a: .72, ms: 1200 },
    { t: 'sfx', id: 'heartbeat' },
    { t: 'wait', ms: 900 },
    { t: 'say', who: 'hero', emo: 'broken', text: '（呼……{p:300}呼……{p:400}冷静。{p:300}冷静。）' },
    { t: 'say', who: 'hero', emo: 'broken', text: '（……为什么每次都是我。）' },
    { t: 'sfx', id: 'heartbeat' },
    { t: 'say', who: 'hero', emo: 'broken',
      text: '（我又不是英雄。{p:400}我连、我连蟑螂都不敢打。）' },
    { t: 'say', who: 'hero', emo: 'broken', text: '（我想回家。{p:600}我真的好想回家。）' },
    { t: 'wait', ms: 1200 },
    { t: 'sfx', id: 'uiMove' },
    { t: 'enter', who: 'ty', slot: 'right', emo: 'cold', from: 'right', flip: true, scale: 1.6, y: 470 },
    { t: 'say', who: 'hero', emo: 'surprise', text: '！{p:400}……你怎么找到的。' },
    { t: 'say', who: 'ty', emo: 'cold',
      text: '你每次都躲在离出口 12 到 15 米、有遮挡、背风的地方。{p:500}这是第 9 次。' },
    { t: 'say', who: 'hero', emo: 'sad', text: '……你连这个都记。' },
    { t: 'say', who: 'ty', emo: 'cold', text: '我记一切。' },
    { t: 'wait', ms: 900 },
    { t: 'closebox' },
    { t: 'par', steps: [
      [{ t: 'actor', who: 'ty', x: 700, ms: 1800, wait: false }],
      [{ t: 'wait', ms: 1400 }]
    ] },
    { t: 'sub', text: '他没有安慰。他只是在旁边坐了下来。', ms: 3000, y: 640 },
    { t: 'say', who: 'ty', emo: 'cold', text: '根据计算，{p:400}你现在的状态需要休息 12 分钟。' },
    { t: 'say', who: 'ty', emo: 'cold', text: '我陪你。' },
    { t: 'wait', ms: 1400 },
    { t: 'say', who: 'hero', emo: 'sad', text: '……' },
    { t: 'say', who: 'hero', emo: 'sad', text: '……12 分钟够吗。' },
    { t: 'say', who: 'ty', emo: 'cold', text: '不够就 24 分钟。' },
    { t: 'say', who: 'ty', emo: 'cold', text: '……我把今天的日程全部推掉了。' },
    { t: 'wait', ms: 1400 },
    { t: 'say', who: 'hero', emo: 'sad', text: '……谢谢。' },
    { t: 'say', who: 'ty', emo: 'cold', text: '不客气。这是最优解。' },
    { t: 'wait', ms: 900 },
    { t: 'say', who: 'ty', emo: 'cold', text: '……也是我想做的事。' },
    { t: 'closebox' },
    { t: 'hold', ms: 3600, keepBox: true },
    { t: 'wind', off: true, ms: 1600 },
    { t: 'unpaint', fn: 'hideCorner', ms: 1400 },
    { t: 'vignette', a: .34, ms: 1400 },
    { t: 'sanity', n: 14 },
    { t: 'learn', k: 'ty_kindness', label: 'TY 会用「计算」的形式，把陪伴说出口' }
  ];

  CS.c3_boss2_pre = [
    { t: 'bg', id: 'storm', fade: 500 },
    { t: 'bgm', id: 'dread', fade: 600 },
    { t: 'clear' },
    { t: 'enter', who: 'madman', slot: 'right', emo: 'mad', flip: true, scale: 1.9 },
    { t: 'enter', who: 'hero', slot: 'left', emo: 'fear' },
    { t: 'say', who: 'madman', emo: 'mad',
      text: '来啦来啦来啦！{p:300}答案来找问题啦！' },
    { t: 'say', who: 'hero', emo: 'fear', text: '你要干什么？！' },
    { t: 'say', who: 'madman', emo: 'mad',
      text: '测一测！{p:300}称一称！{p:300}看看这一次的你，够不够重！' },
    { t: 'say', who: 'hero', emo: 'fear', text: '够不够重？' },
    { t: 'say', who: 'madman', emo: 'mad',
      text: '扛得动几个人的份量呀！{p:400}嘿嘿嘿嘿嘿！' },
    { t: 'shake', p: 12, ms: 500 },
    { t: 'say', who: 'madman', emo: 'mad', text: '来吧来吧！{p:300}让我看看！' }
  ];

  CS.c3_boss2_post = [
    { t: 'bg', id: 'storm', fade: 600 },
    { t: 'bgm', id: 'storm', fade: 1200, layers: { lead: false } },
    { t: 'clear' },
    { t: 'enter', who: 'madman', slot: 'right', emo: 'mad', flip: true },
    { t: 'enter', who: 'hero', slot: 'left', emo: 'pain' },
    { t: 'say', who: 'madman', emo: 'mad', text: '哈哈哈哈！{p:300}够重！{p:300}真够重！' },
    { t: 'say', who: 'hero', emo: 'pain', text: '哈……哈……{p:400}你到底……' },
    { t: 'say', who: 'madman', emo: 'mad', text: '再见啦！' },
    { t: 'say', who: 'madman', emo: 'mad', text: '——{p:600}你会后悔的。' },
    { t: 'say', who: 'hero', emo: 'surprise', text: '后悔什么？！' },
    { t: 'par', steps: [
      [{ t: 'exit', who: 'madman', to: 'right', ms: 900 }],
      [{ t: 'sfx', id: 'uiBack' }]
    ] },
    { t: 'say', who: 'hero', emo: 'fear', text: '……喂！' },
    { t: 'call', fn: function () { G.St.s.bossCleared.boss2 = true; } }
  ];

  /* ============================================================
     第四章 · 机械牢笼与被操控的朋友
     ============================================================ */
  CS.c4_open = [
    { t: 'reset' },
    /* 坏结局C 引爆点：相信了兜帽商人且没读过残骸日志 */
    { t: 'if',
      cond: function () { return G.St.flag('trustedBroker') && !G.St.flag('readWreckLog'); },
      then: [
        { t: 'call', fn: function () {
            G.St.setFlag('doomEarly');
            G.Ending.trigger('badC');
          } },
        { t: 'wait', ms: 999999 }
      ]
    },
    { t: 'bg', id: 'factory', fade: 1200 },
    { t: 'bgm', id: 'factory', fade: 1600 },
    { t: 'clear' },
    { t: 'card', small: 'CHAPTER  4', big: '机械牢笼', ms: 2400 },
    { t: 'enter', who: 'hero', slot: 'left', emo: 'fear' },
    { t: 'enter', who: 'ty', slot: 'right', emo: 'cold', flip: true },
    { t: 'redEdge', a: .3, ms: 1400 },
    { t: 'say', who: 'ty', emo: 'sharp', text: '这里的能耗曲线不对。' },
    { t: 'say', who: 'hero', emo: 'fear', text: '……什么味道？' },
    { t: 'say', who: 'ty', emo: 'cold', text: '蛋白质高温碳化。' },
    { t: 'say', who: 'hero', emo: 'surprise', text: '……什、什么？' },
    { t: 'say', who: 'ty', emo: 'cold', text: '……换个说法：{p:600}是人。' },
    { t: 'par', steps: [
      [{ t: 'shake', p: 8, ms: 600 }],
      [{ t: 'actor', who: 'hero', emo: 'broken', ms: 300, wait: false }]
    ] },
    { t: 'say', who: 'hero', emo: 'broken', text: '……' },
    { t: 'sanity', n: -3 }
  ];

  CS.c4_env_story = [
    { t: 'bg', id: 'factory', fade: 500 },
    { t: 'clear' },
    { t: 'paint', fn: 'mechLab', ms: 999999, keep: true, wait: false },
    { t: 'grain', a: .9 },
    { t: 'wait', ms: 1400 },
    { t: 'say', who: 'narrator', text: '培养舱里泡着的东西，还保持着人的形状。' },
    { t: 'say', who: 'narrator', text: '地上散落着实验记录。字迹工整得可怕。' },
    { t: 'say', who: 'narrator', text: '「受体 07：意识清醒度需维持在 90% 以上。」' },
    { t: 'say', who: 'narrator', text: '「——理由：无意识的执行体缺乏创造性。而且，」' },
    { t: 'say', who: 'narrator', text: '「而且，看着自己伤害别人，会加速人格崩解。这有利于控制。」' },
    { t: 'enter', who: 'hero', slot: 'left', emo: 'broken', scale: 1.7, y: 450 },
    { t: 'say', who: 'hero', emo: 'broken', text: '{s}……什么叫「有利于控制」。{/s}' },
    { t: 'say', who: 'narrator', text: '最后一页只有一行字，笔迹和前面完全一样：' },
    { t: 'say', who: 'narrator', text: '「受体 07 今天问我，他做错了什么。我告诉他：什么都没做错。」' },
    { t: 'say', who: 'narrator', text: '「他哭了 41 分钟。数据很好。」' },
    { t: 'par', steps: [
      [{ t: 'shake', p: 14, ms: 800 }],
      [{ t: 'redEdge', a: .8, ms: 500 }],
      [{ t: 'sfx', id: 'glitch', arg: 8 }]
    ] },
    { t: 'say', who: 'hero', emo: 'broken', text: '{s}……我要杀了他。{/s}' },
    { t: 'wait', ms: 900 },
    { t: 'say', who: 'hero', emo: 'fear', text: '（……我刚才说什么了？）' },
    { t: 'redEdge', a: .3, ms: 900 },
    { t: 'unpaint', fn: 'mechLab', ms: 1200 },
    { t: 'sanity', n: -6 },
    { t: 'learn', k: 'lab_records', label: '幕后Boss 刻意让受体保持清醒 —— 因为「有利于控制」' },
    { t: 'codex', id: 'shadow' }
  ];

  CS.c4_meet_puppet = [
    { t: 'bg', id: 'factory', fade: 600 },
    { t: 'stopBgm', ms: 600 },
    { t: 'clear' },
    { t: 'enter', who: 'puppet', slot: 'right', emo: 'numb', flip: true, alt: 1,
      mechHalf: 1, scale: 1.9, from: 'fade', ms: 2200 },
    { t: 'enter', who: 'hero', slot: 'left', emo: 'surprise' },
    { t: 'wait', ms: 900 },
    { t: 'say', who: 'hero', emo: 'surprise', text: '……' },
    { t: 'say', who: 'hero', emo: 'broken', text: '{s}……是你？{/s}' },
    { t: 'say', who: 'hero', emo: 'broken', text: '{s}这是你吗？！{/s}' },
    { t: 'say', who: 'puppet', emo: 'numb', alt: 1, text: '……' },
    { t: 'say', who: 'puppet', emo: 'pain', alt: 1, text: '……别、{p:500}别过来。' },
    { t: 'say', who: 'hero', emo: 'broken', text: '{s}我带你走！我们现在就走！{/s}' },
    { t: 'par', steps: [
      [{ t: 'sfx', id: 'glitch', arg: 6 }],
      [{ t: 'actor', who: 'puppet', distort: 1, emo: 'pain', ms: 300, wait: false }],
      [{ t: 'shake', p: 16, ms: 700 }]
    ] },
    { t: 'say', who: 'puppet', emo: 'pain', alt: 1, text: '{s}呃啊啊啊——！{/s}' },
    { t: 'say', who: 'shadow', emo: 'calm', text: '——起来。',
      onEnter: function () { G.Dlg.addActor('shadow', { slot: 'farRight', scale: 1.5, z: -2, alpha: .8, y: 420 }); } },
    { t: 'say', who: 'hero', emo: 'anger', text: '{s}你是谁！！{/s}' },
    { t: 'say', who: 'shadow', emo: 'calm', text: '一个把废物变成有用之物的人。' },
    { t: 'say', who: 'shadow', emo: 'calm', text: '他很配合。{p:500}他哭的时候尤其配合。' },
    { t: 'par', steps: [
      [{ t: 'exit', who: 'shadow', to: 'right', ms: 700 }],
      [{ t: 'actor', who: 'puppet', distort: 0, emo: 'anger', ms: 600, wait: false }],
      [{ t: 'bgm', id: 'boss4', fade: 700 }],
      [{ t: 'redEdge', a: .7, ms: 500 }]
    ] },
    { t: 'say', who: 'puppet', emo: 'anger', alt: 1, text: '……快跑。' },
    { t: 'say', who: 'puppet', emo: 'pain', alt: 1, text: '{s}快跑啊！！{/s}' },
    { t: 'codex', id: 'puppet' },
    { t: 'redEdge', a: .3, ms: 700 }
  ];

  CS.c4_boss4_pre = [
    { t: 'bg', id: 'factory', fade: 400 },
    { t: 'clear' },
    { t: 'enter', who: 'hero', slot: 'left', emo: 'broken' },
    { t: 'enter', who: 'ty', slot: 'right', emo: 'cold', flip: true },
    { t: 'say', who: 'hero', emo: 'broken', text: '{s}TY！有办法吗！{p:300}解除控制的办法！{/s}' },
    { t: 'say', who: 'ty', emo: 'cold', text: '……' },
    { t: 'say', who: 'hero', emo: 'broken', text: '{s}说话啊！！{/s}' },
    { t: 'say', who: 'ty', emo: 'sad', text: '控制装置和他的中枢神经已经{c:#ff5f7a}长在一起{/c}了。' },
    { t: 'say', who: 'ty', emo: 'cold', text: '分离手术的成功率是 0.0%。{p:500}不是接近零。{p:400}是零。' },
    { t: 'say', who: 'hero', emo: 'broken', text: '{s}那就带回去！关起来！绑起来！{/s}' },
    { t: 'say', who: 'ty', emo: 'cold', text: '他的机体正在朝居住区移动。' },
    { t: 'say', who: 'ty', emo: 'cold', text: '预计伤亡：{p:400}三百到四百人。' },
    { t: 'wait', ms: 1000 },
    { t: 'say', who: 'hero', emo: 'numb', text: '……' },
    { t: 'say', who: 'ty', emo: 'sad', text: '……对不起。' },
    { t: 'say', who: 'hero', emo: 'surprise', text: '你从来不道歉的。' },
    { t: 'say', who: 'ty', emo: 'sad', text: '……我知道。' },
    { t: 'sanity', n: -5 }
  ];

  CS.c4_puppet_beg = [
    { t: 'bg', id: 'factory', fade: 400 },
    { t: 'stopBgm', ms: 800 },
    { t: 'clear' },
    { t: 'wind', gain: .1 },
    { t: 'enter', who: 'puppet', slot: 'right', emo: 'pain', flip: true, alt: .6,
      mechHalf: .7, scale: 1.85, tintColor: '#8a7aa0', tintAmt: .3 },
    { t: 'enter', who: 'hero', slot: 'left', emo: 'broken' },
    { t: 'sub', text: '他的战机残破不堪，悬浮在主角面前。主角的弹药耗尽，能量见底。', ms: 4000, y: 650 },
    { t: 'wait', ms: 700 },
    { t: 'say', who: 'puppet', emo: 'pain', alt: .6, text: '……回来了。' },
    { t: 'say', who: 'puppet', emo: 'sad', alt: .3, text: '我……{p:500}回来了一会儿。' },
    { t: 'say', who: 'hero', emo: 'broken', text: '{s}你撑住！{p:300}我带你回去！{/s}' },
    { t: 'say', who: 'puppet', emo: 'sad', alt: .3, text: '……我数过。' },
    { t: 'say', who: 'puppet', emo: 'sad', alt: .3, text: '一百一十三个。' },
    { t: 'say', who: 'hero', emo: 'fear', text: '……什么？' },
    { t: 'say', who: 'puppet', emo: 'numb', alt: .3,
      text: '我杀掉的人。{p:600}我一个一个数过。{p:500}我全都记得。' },
    { t: 'say', who: 'puppet', emo: 'broken', alt: .3,
      text: '我一直是醒的。{p:800}我一直看着自己的手。' },
    { t: 'wait', ms: 1200 },
    { t: 'par', steps: [
      [{ t: 'zoom', z: 1.15, ms: 4200, cx: 900, cy: 340, wait: false }],
      [{ t: 'lines', list: [
        { who: 'puppet', emo: 'sad', alt: .3, text: '杀了我。' },
        { who: 'hero', emo: 'broken', text: '{s}……什么？{/s}' },
        { who: 'puppet', emo: 'sad', alt: .3, text: '杀了我……{p:700}求你了……' },
        { who: 'puppet', emo: 'broken', alt: .3, text: '我不想再伤害任何人了……' }
      ] }]
    ] },
    { t: 'say', who: 'hero', emo: 'broken', text: '{s}一定还有别的办法！{/s}' },
    { t: 'say', who: 'puppet', emo: 'sad', alt: .3, text: '没有别的办法了。' },
    { t: 'say', who: 'hero', emo: 'broken', text: '{s}我下不了手！{p:300}你让我怎么下手！！{/s}' },
    { t: 'say', who: 'puppet', emo: 'sad', alt: .3, text: '我已经……{p:800}没救了。' },
    { t: 'wait', ms: 1400 },
    { t: 'zoom', z: 1, ms: 1600, wait: false },
    { t: 'closebox' },
    { t: 'par', steps: [
      [{ t: 'sfx', id: 'shield' }],
      [{ t: 'actor', who: 'puppet', mechHalf: .3, ms: 2200, wait: false }]
    ] },
    { t: 'sub', text: '他主动解除了战机护盾。驾驶舱暴露在主角的炮口下。', ms: 4000, y: 650 },
    { t: 'wait', ms: 800 },
    { t: 'say', who: 'puppet', emo: 'smile', alt: .2, text: '……你还记得吗。' },
    { t: 'say', who: 'puppet', emo: 'smile', alt: .2,
      text: '小时候我总躲在你后面。{p:600}你也怕，但你总是站在前面。' },
    { t: 'say', who: 'puppet', emo: 'sad', alt: .2, text: '这次换我。' },
    { t: 'wait', ms: 900 },
    { t: 'say', who: 'puppet', emo: 'smile', alt: .2,
      text: '带着我的那份……{p:800}活下去……' },
    { t: 'say', who: 'puppet', emo: 'smile', alt: .2, text: '替我……{p:900}弥补……' },
    { t: 'wait', ms: 1600 }
  ];

  /* —— 含泪一枪：整个游戏的心脏之一 —— */
  CS.c4_tear_shot = [
    { t: 'clear' },
    { t: 'bg', id: 'factory', fade: 300 },
    { t: 'stopBgm', ms: 200 },
    { t: 'par', steps: [
      [{ t: 'slowmo', scale: .06, ms: 8000 }],
      [{ t: 'letterbox', a: 1, ms: 600 }],
      [{ t: 'desat', a: .5, ms: 2000, wait: false }],
      [{ t: 'paint', fn: 'standoff', ms: 999999, keep: true, layer: 'over', wait: false }]
    ] },
    { t: 'wait', ms: 1200 },
    { t: 'sub', text: '主角的手指，停在扳机上。', ms: 3000, y: 620 },
    { t: 'wait', ms: 800 },
    { t: 'sfx', id: 'heartbeat' },
    { t: 'sub', text: '停了很久。', ms: 2600, y: 620 },
    { t: 'wait', ms: 900 },
    { t: 'sfx', id: 'heartbeat' },
    { t: 'sub', text: '对面那架战机，把护盾解除了。它在等。', ms: 3200, y: 620 },
    { t: 'sfx', id: 'heartbeat' },
    { t: 'wait', ms: 900 },
    { t: 'sub', text: '准星在抖。抖得瞄不准。', ms: 3000, y: 620 },
    { t: 'sfx', id: 'heartbeat' },
    { t: 'wait', ms: 1200 },
    { t: 'sub', text: '……然后它停了下来。', ms: 2800, y: 620 },
    { t: 'wait', ms: 1400 },
    { t: 'unpaint', fn: 'standoff', ms: 600 },
    /* 超慢镜头的子弹 */
    { t: 'par', steps: [
      [{ t: 'paint', fn: 'slowBullet', ms: 7000, layer: 'over', wait: false }],
      [{ t: 'sfx', id: 'shoot' }],
      [{ t: 'wait', ms: 7000 }]
    ] },
    { t: 'par', steps: [
      [{ t: 'paint', fn: 'silentBoom', ms: 3400, layer: 'over', data: { x: 880, y: 250 }, wait: false }],
      [{ t: 'flash', color: '#ffffff', ms: 900, a: 1 }],
      [{ t: 'shake', p: 26, ms: 1600 }]
    ] },
    { t: 'wait', ms: 1600 },
    { t: 'sub', text: '战机在寂静中爆炸。听不见声音。', ms: 3400, y: 130 },
    { t: 'kill', who: 'puppet' },
    { t: 'flag', k: 'puppetDead' },
    { t: 'sanity', n: -14 },
    { t: 'unpaint', ms: 1400 },

    /* 主角崩溃 —— 定格 */
    { t: 'clear' },
    { t: 'enter', who: 'hero', slot: 'center', emo: 'broken', from: 'fade', ms: 900, scale: 1.9, y: 470 },
    { t: 'par', steps: [
      [{ t: 'redEdge', a: 1, ms: 700 }],
      [{ t: 'shake', p: 10, ms: 3000 }],
      [{ t: 'stopBgm', ms: 100 }],
      [{ t: 'wind', gain: .16 }]
    ] },
    { t: 'wait', ms: 1400 },
    { t: 'sub', text: '眼泪涌了出来。身体剧烈颤抖。双手抱住了头。', ms: 3600, y: 640 },
    { t: 'hold', ms: 8000, letterbox: true, keepBox: true },
    { t: 'wait', ms: 1400 },
    { t: 'redEdge', a: .4, ms: 2600 },
    { t: 'say', who: 'hero', emo: 'broken', text: '……' },
    { t: 'say', who: 'hero', emo: 'broken', text: '……对不起。' },
    { t: 'say', who: 'hero', emo: 'broken', text: '对不起。{p:800}对不起。{p:800}对不起。' },
    { t: 'wait', ms: 1800 },
    { t: 'desat', a: 0, ms: 3000 },
    { t: 'wind', off: true, ms: 2600 },
    { t: 'redEdge', a: 0, ms: 2000 },
    { t: 'call', fn: function () { G.St.s.bossCleared.boss4 = true; } }
  ];

  CS.c4_ptsd = [
    { t: 'bg', id: 'factory', fade: 900 },
    { t: 'bgm', id: 'grief', fade: 2000 },
    { t: 'clear' },
    { t: 'enter', who: 'hero', slot: 'left', emo: 'numb' },
    { t: 'enter', who: 'ty', slot: 'right', emo: 'cold', flip: true },
    { t: 'wait', ms: 900 },
    { t: 'say', who: 'ty', emo: 'cold', text: '……你的手还在抖。' },
    { t: 'say', who: 'hero', emo: 'numb', text: '嗯。' },
    { t: 'say', who: 'ty', emo: 'cold', text: '需要休息多久？' },
    { t: 'say', who: 'hero', emo: 'numb', text: '……不知道。' },
    { t: 'wait', ms: 900 },
    { t: 'say', who: 'hero', emo: 'numb',
      text: '我刚才在弹幕里，{p:500}看见他了。' },
    { t: 'say', who: 'ty', emo: 'surprise', text: '……幻觉？' },
    { t: 'say', who: 'hero', emo: 'numb',
      text: '他在笑。{p:600}和小时候一样。' },
    { t: 'par', steps: [
      [{ t: 'glitch', ms: 700, p: .4 }],
      [{ t: 'sfx', id: 'glitch', arg: 4 }]
    ] },
    { t: 'say', who: 'hero', emo: 'broken', text: '……我是不是也快坏掉了。' },
    { t: 'say', who: 'ty', emo: 'cold', text: '……' },
    { t: 'say', who: 'ty', emo: 'sad',
      text: '如果你坏掉了，{p:600}我会告诉你。' },
    { t: 'say', who: 'ty', emo: 'determined',
      text: '在那之前——{p:500}你还没坏。' },
    { t: 'learn', k: 'hero_ptsd', label: '我开始在弹幕里看见他的幻影' }
  ];

  /* ---- IF 第一阶段：自省（第四章后，正直的人存活） ---- */
  CS.if_reflect = [
    { t: 'bg', id: 'factory', fade: 800 },
    { t: 'bgm', id: 'grief', fade: 1400 },
    { t: 'clear' },
    { t: 'enter', who: 'upright', slot: 'center', emo: 'sad', scale: 1.85 },
    { t: 'sub', text: '他站在那堆残骸前，站了很久。', ms: 3200, y: 640 },
    { t: 'say', who: 'upright', emo: 'sad', text: '……' },
    { t: 'say', who: 'upright', emo: 'sad', text: '（如果我当时用了那份力量……）' },
    { t: 'say', who: 'upright', emo: 'broken', text: '（他是不是就不用死？）' },
    { t: 'wait', ms: 1400 },
    { t: 'par', steps: [
      [{ t: 'actor', who: 'upright', emblemGlow: .4, ms: 1600, wait: false }],
      [{ t: 'paint', fn: 'emblemAwake', ms: 2200, data: { x: 700, y: 330 }, a: .35, wait: false }]
    ] },
    { t: 'say', who: 'upright', emo: 'determined', text: '……不。' },
    { t: 'actor', who: 'upright', emblemGlow: 0, ms: 1400 },
    { t: 'say', who: 'upright', emo: 'sad',
      text: '（那样我会变成另一个人。{p:600}而那个人，救不了任何人。）' },
    { t: 'closebox' },
    { t: 'sub', text: '他沉默地把残骸收好，一片一片，收得很整齐。', ms: 4000, y: 640 },
    { t: 'sub', text: '然后他继续战斗。', ms: 3000, y: 640 },
    { t: 'flag', k: 'seenIfHint1' }
  ];

})(window);
