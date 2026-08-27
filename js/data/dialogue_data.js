/* ===========================================================
   dialogue_data.js — 地图 NPC / 可读物 对话
     G.Talk.get(key, ctx) → 行数组
     支持轮回变体（loopCount）与旗标条件；行内可带 choices
   =========================================================== */
(function (root) {
  'use strict';
  var G = root.G, U = G.U;

  var Talk = G.Talk = { data: {} };
  var D = Talk.data;
  var St = function () { return G.St; };

  Talk.get = function (key, ctx) {
    var v = D[key];
    if (!v) { console.warn('[talk] 缺少对话: ' + key); return null; }
    if (typeof v === 'function') return v(ctx || {});
    return v;
  };

  /* 便捷构造 */
  function L(who, text, opt) { return U.merge({ who: who, text: text }, opt || {}); }
  function loopPick(arr) {
    return arr[Math.min(arr.length - 1, G.St.s.loopCount)];
  }

  /* ============================================================
     区域1 · 锈港
     ============================================================ */
  D.camp_oldman_first = function () {
    return [
      L('oldman', '站着干嘛。{p:300}汤在锅里，自己盛。', { emo: 'calm' }),
      L('hero', '……哦。', { emo: 'fear' }),
      L('oldman', '手别抖。{p:400}抖着端汤，汤会凉得快。', { emo: 'half' }),
      L('hero', '……这是什么道理。', { emo: 'fear' }),
      L('oldman', '没道理。{p:400}但你信了，手就不抖了。', { emo: 'half' })
    ];
  };

  D.camp_oldman_before_raid = function () {
    if (G.St.s.loopCount >= 1) {
      return [
        L('hero', '老爷子……', { emo: 'sad' }),
        L('oldman', '嗯？', { emo: 'calm' }),
        L('hero', '……没事。{p:600}就是想再听你骂我一次。', { emo: 'sad' }),
        L('oldman', '……有毛病。', { emo: 'half' }),
        L('oldman', '左手。{p:300}你举错了。', { emo: 'half' }),
        L('hero', '……嗯。{p:400}我知道。', { emo: 'sad' })
      ];
    }
    return [
      L('oldman', '明天教你降落。{p:400}起飞谁都会，活着落地才算飞行员。', { emo: 'calm' }),
      L('hero', '……我大概学不会。', { emo: 'fear' }),
      L('oldman', '学不会就多摔几次。{p:400}我这架破飞机，还没被摔坏过。', { emo: 'half' }),
      L('oldman', '……好了，别站着。{p:400}过来，跟我说说你那个世界。', { emo: 'calm' })
    ];
  };

  D.camp_ty = function () {
    var d = G.St.s.tyDecay;
    var lines = [
      L('ty', '这里的风速比上一次低 0.4 米每秒。{p:400}不影响计划。', { emo: 'cold' }),
      L('hero', '你连风速都记得？', { emo: 'surprise' }),
      L('ty', '我记得一切。{p:500}这是我唯一能做的贡献。', { emo: 'cold' })
    ];
    if (d >= 2) {
      lines.push(L('ty', '……', { emo: 'cold' }));
      lines.push(L('ty', '（咳。）{p:600}……继续。我们还有时间。', { emo: 'pain' }));
      lines.push(L('hero', '你的手在抖。', { emo: 'sad' }));
      lines.push(L('ty', '误差 0.3 毫米。{p:400}在容许范围内。', { emo: 'cold' }));
    }
    if (d >= 4) {
      lines.push(L('hero', '……别再让我带你回来了。', { emo: 'broken' }));
      lines.push(L('ty', '否决。{p:500}我不是为了活着才回来的。', { emo: 'sharp' }));
      lines.push(L('ty', '我是为了{c:#9ff0ff}让这次不一样{/c}。', { emo: 'determined' }));
    }
    return lines;
  };

  D.camp_grave = function () {
    return [
      L('narrator', '一块没有名字的墓碑。刻痕很深，像是刻了很多遍才满意。'),
      L('narrator', '碑前有半瓶酒，没开封。'),
      L('hero', '……他从来没说过这是谁的。', { emo: 'sad' }),
      L('narrator', '碑底压着一张纸条，字迹歪歪扭扭：「爷爷，我明天就能飞了。」'),
      L('hero', '……', { emo: 'sad' }),
      L('hero', '（原来我不是第一个。）', { emo: 'sad' })
    ];
  };

  D.camp_soup = function () {
    return [
      L('narrator', '锅里的汤还温着。上面浮着两片没舍得多放的肉。'),
      L('hero', '（两片。{p:400}一片给我，一片给他。）', { emo: 'sad' }),
      L('hero', '（他每次都说他不爱吃肉。）', { emo: 'sad' })
    ];
  };

  /* ============================================================
     区域2 · 都市残骸
     ============================================================ */
  D.ruins_madman = function () {
    if (G.St.flag('madmanRevealed')) {
      return [
        L('madman', '……', { emo: 'cold', alt: 1 }),
        L('madman', '你还活着。{p:500}我以为你会更早放弃。', { emo: 'cold', alt: 1 }),
        L('hero', '你到底知道多少？', { emo: 'anger' }),
        L('madman', '足够多，所以才装了那么久的疯。', { emo: 'cold', alt: 1 }),
        L('madman', '疯子说真话，没人会信。{p:500}这是我唯一的自保方式。', { emo: 'cold', alt: 1 })
      ];
    }
    var v = loopPick([
      [
        L('madman', '嘿嘿！{p:200}又是你！{p:200}还是你！{p:200}永远是你！', { emo: 'mad' }),
        L('hero', '……我们只见过一次。', { emo: 'fear' }),
        L('madman', '你见过一次。{p:400}我见过很多次。{p:400}区别就在这儿呀！', { emo: 'mad' })
      ],
      [
        L('madman', '你的影子变重了。{p:300}沉了！{p:300}拖不动了！', { emo: 'mad' }),
        L('hero', '什么意思？', { emo: 'fear' }),
        L('madman', '死过的人，影子会变重。{p:400}你身上挂着好几个人的影子呢。', { emo: 'mad' }),
        L('madman', '嘿嘿嘿嘿嘿——{p:300}小心别被压弯了腰哦！', { emo: 'mad' })
      ],
      [
        L('madman', '哎哟。{p:400}你今天的眼神，比上次死的时候好看点。', { emo: 'mad' }),
        L('hero', '……你刚才说什么？', { emo: 'surprise' }),
        L('madman', '我说饺子！{p:300}我说饺子好吃！', { emo: 'mad' }),
        L('madman', '……{p:800}我还说，{p:400}有人不用救世主也能救世界。', { emo: 'mad' }),
        L('madman', '嘿嘿。{p:400}忘了忘了！我什么都没说！', { emo: 'mad' },
          { onEnter: function () { G.St.setFlag('seenIfHint3'); } })
      ]
    ]);
    return v;
  };

  D.ruins_upright = function () {
    if (!G.St.flag('metUpright')) {
      return [
        L('upright', '止步。{p:400}这里是守卫队辖区。', { emo: 'determined' }),
        L('hero', '我、我不是——', { emo: 'fear' }),
        L('upright', '身份。', { emo: 'sharp' }),
        L('hero', '……没有。', { emo: 'fear' }),
        L('upright', '那就登记。{p:400}没有身份的人在都市里出事，没人会来找。', { emo: 'determined' })
      ];
    }
    if (G.St.isDead('upright')) return null;
    var lines = [
      L('upright', '你又在发抖。', { emo: 'determined' }),
      L('hero', '……对不起。', { emo: 'fear' }),
      L('upright', '不用道歉。{p:500}发抖不是罪。', { emo: 'determined' }),
      L('upright', '{c:#ffffff}害怕不丢人。{p:500}丢人的是害怕了就什么都不做。{/c}', { emo: 'determined' }),
      L('hero', '……有人跟我说过一样的话。', { emo: 'sad' }),
      L('upright', '那他是个好人。{p:400}好人说的话，总是撞在一起。', { emo: 'determined' })
    ];
    if (G.St.s.loopCount >= 3) {
      lines.push(L('hero', '……我能问你一件事吗。', { emo: 'sad' }));
      lines.push(L('upright', '问。', { emo: 'determined' }));
      lines.push(L('hero', '如果你有一种力量，用了能救人，但会让你变成别人——你会用吗？', { emo: 'sad' }));
      lines.push(L('upright', '……', { emo: 'surprise' }));
      lines.push(L('upright', '……你为什么这么问。', { emo: 'sad' }));
      lines.push(L('hero', '直觉。', { emo: 'sad' }));
      lines.push(L('upright', '……我不会用。', { emo: 'determined' }));
      lines.push(L('upright', '因为一个人变成了神，剩下的人就永远只能是人了。', { emo: 'determined' },
        { onEnter: function () { G.St.setFlag('seenIfHint1'); G.St.learn('upright_secret_hint', '正直的人似乎在回避「力量」这个话题'); } }));
    }
    return lines;
  };

  D.ruins_lucky = function () {
    if (G.St.isDead('lucky')) return null;
    var lines = [
      L('lucky', '哟！{p:300}新面孔！', { emo: 'smile' }),
      L('lucky', '放心放心，有我在，运气不会差。', { emo: 'smile' }),
      L('hero', '……你凭什么这么说？', { emo: 'fear' }),
      L('lucky', '凭我到现在还活着呀。', { emo: 'smile' }),
      L('lucky', '我掉过三次云海，被击落过五次，有一次机身断成两半——', { emo: 'smile' }),
      L('lucky', '结果我落在一堆棉花上。{p:400}你说，这不叫运气叫什么？', { emo: 'smile' }),
      L('hero', '……那真是……厉害。', { emo: 'surprise' }),
      L('lucky', '所以你别怕啦。{p:400}怕的人容易走神，走神才会倒霉。', { emo: 'smile' }),
      L('lucky', '跟着我，运气会传染的！', { emo: 'smile' })
    ];
    if (G.St.s.loopCount >= 5) {
      lines.push(L('hero', '……你有没有想过，运气也是会用完的？', { emo: 'sad' }));
      lines.push(L('lucky', '想过呀。', { emo: 'smile' }));
      lines.push(L('lucky', '不过用完了也没关系。{p:500}我已经用它换到很多好东西了。', { emo: 'smile' }));
      lines.push(L('lucky', '朋友、饭、还有一次机会跟你说话。', { emo: 'smile' }));
      lines.push(L('hero', '……', { emo: 'sad' }));
    }
    return lines;
  };

  D.ruins_ty = function () { return D.camp_ty(); };

  /* —— 坏结局C 的入口：情报贩子 —— */
  D.ruins_broker = function () {
    if (G.St.flag('trustedBroker')) {
      return [
        L('madman', '嘿嘿。{p:400}坐标记好了吧？{p:400}第四区，东侧断层。', { emo: 'mad', nameOverride: '兜帽商人' }),
        L('madman', '别问我为什么。{p:400}问了就不灵了。', { emo: 'mad', nameOverride: '兜帽商人' })
      ];
    }
    var known = G.St.flag('readWreckLog');
    return [
      L('madman', '……买情报吗，客人。', { emo: 'cold', alt: 1, nameOverride: '兜帽商人' }),
      L('hero', '什么情报？', { emo: 'fear' }),
      L('madman', '一条捷径。{p:400}绕过风暴云域，直插工厂。{p:500}省你十七天。', { emo: 'cold', alt: 1, nameOverride: '兜帽商人' }),
      L('madman', '十七天，在这个世界够死很多人了。', { emo: 'cold', alt: 1, nameOverride: '兜帽商人' }),
      L('hero', '……代价呢？', { emo: 'fear' }),
      L('madman', '免费。{p:600}我只是……{p:400}想看看你会不会信。', { emo: 'cold', alt: 1, nameOverride: '兜帽商人' }),
      known
        ? L('narrator', '（残骸日志仪上说过：第四区东侧断层的结构支撑，早在三年前就被判定为「一触即溃」。）')
        : L('narrator', '（他的手在袖子里握着什么东西。你看不清。）'),
      {
        who: 'hero', emo: 'fear', text: '……',
        choices: [
          {
            id: 'trust', text: '（收下坐标）……好。我信你。',
            hint: known ? '你知道那里会塌' : '',
            effect: function () {
              G.St.setFlag('trustedBroker');
              G.St.learn('shortcut', '捷径坐标 —— 第四区东侧断层');
            },
            lines: [
              L('madman', '……好孩子。', { emo: 'cold', alt: 1, nameOverride: '兜帽商人' }),
              L('madman', '嘿嘿嘿。{p:600}嘿嘿嘿嘿嘿。', { emo: 'mad', nameOverride: '兜帽商人' }),
              L('narrator', '他把一枚金属片塞进你手里。冰得不正常。')
            ]
          },
          {
            id: 'refuse', text: '（后退一步）……不用了。',
            effect: function () { G.St.learn('broker_refused', '我拒绝了兜帽商人的「捷径」'); },
            lines: [
              L('madman', '……', { emo: 'cold', alt: 1, nameOverride: '兜帽商人' }),
              L('madman', '可惜。', { emo: 'cold', alt: 1, nameOverride: '兜帽商人' }),
              L('madman', '不过——{p:400}活得久的人，都是这么活下来的。', { emo: 'cold', alt: 1, nameOverride: '兜帽商人' })
            ]
          }
        ]
      }
    ];
  };

  D.ruins_wrecklog = function () {
    var first = !G.St.flag('readWreckLog');
    var lines = [
      L('narrator', '一台还亮着的残骸日志仪。屏幕裂了，但字还能认。'),
      L('narrator', '「……结构评估：第四区东侧断层，支撑残余 4%。判定：一触即溃。」'),
      L('narrator', '「……建议：永久封闭。任何飞行器不得靠近。」'),
      L('narrator', '「……记录者：TY。」'),
      L('hero', '……TY？', { emo: 'surprise' }),
      L('hero', '（三年前的记录。{p:400}他那时候还活着。）', { emo: 'sad' })
    ];
    if (first) {
      lines.push(L('hero', '（第四区东侧断层……{p:500}我记住了。）', { emo: 'determined' },
        { onEnter: function () {
            G.St.setFlag('readWreckLog');
            G.St.learn('fault_collapse', '第四区东侧断层随时会崩塌 —— 绝不能靠近');
          } }));
    }
    return lines;
  };

  D.ruins_memorial = function () {
    return [
      L('narrator', '一整面墙，密密麻麻刻满了名字。有些被划掉了，有些被划掉之后又重新刻上。'),
      L('hero', '（为什么要划掉又刻回来？）', { emo: 'fear' }),
      L('narrator', '墙角有一行小字：「以为死了，后来回来了。——所以别急着划。」'),
      L('hero', '……', { emo: 'sad' }),
      L('hero', '（这里的人，也在等他们的人回来。）', { emo: 'sad' }),
      L('hero', '（可是我知道。{p:500}大部分人，是不会回来的。）', { emo: 'sad' })
    ];
  };

  /* ============================================================
     区域3 · 风暴云域
     ============================================================ */
  D.storm_madman = function () {
    if (G.St.flag('madmanRevealed')) {
      return [
        L('madman', '这里的风……{p:500}和那天一样。', { emo: 'cold', alt: 1 }),
        L('hero', '哪一天？', { emo: 'fear' }),
        L('madman', '他死的那天。', { emo: 'cold', alt: 1 }),
        L('hero', '……谁？', { emo: 'surprise' }),
        L('madman', '……嘿嘿。{p:400}饺子！{p:300}我说饺子！', { emo: 'mad' })
      ];
    }
    return [
      L('madman', '{s}呼——！{/s}{p:300}好风！{p:300}这风我认识！', { emo: 'mad' }),
      L('hero', '风还能认识？', { emo: 'fear' }),
      L('madman', '这里的风……{p:600}和那天一样。', { emo: 'mad' }),
      L('narrator', '他忽然不笑了。只有一瞬间。'),
      L('madman', '嘿嘿嘿！{p:300}我说什么了吗？{p:300}我什么都没说！', { emo: 'mad' }),
      L('hero', '……', { emo: 'fear' })
    ];
  };

  D.storm_lucky = function () {
    if (G.St.isDead('lucky')) return null;
    return [
      L('lucky', '雷打不到我的！{p:400}我试过，真的打不到！', { emo: 'smile' }),
      L('hero', '你试过？！', { emo: 'surprise' }),
      L('lucky', '举着铁棍站在最高处，站了一整夜。', { emo: 'smile' }),
      L('lucky', '结果雷劈了旁边那棵树。{p:400}那棵树替我死了。', { emo: 'smile' }),
      L('lucky', '……', { emo: 'smile' }),
      L('lucky', '我给它立了个牌子。{p:400}上面写：谢谢你。', { emo: 'smile' })
    ];
  };

  D.storm_ty = function () {
    var lines = [
      L('ty', '风暴的周期是 14 分 20 秒。{p:400}我们在第 6 分钟穿过。', { emo: 'cold' }),
      L('hero', '为什么不等它停？', { emo: 'fear' }),
      L('ty', '因为它不会停。{p:500}它只会变强。', { emo: 'cold' }),
      L('ty', '……这个世界的每一样东西，都在朝毁灭加速。', { emo: 'cold' })
    ];
    if (G.St.s.loopCount >= 4) {
      lines.push(L('hero', '……TY。{p:400}你后悔过吗？', { emo: 'sad' }));
      lines.push(L('ty', '定义「后悔」。', { emo: 'cold' }));
      lines.push(L('hero', '就是……{p:400}希望自己当初没被我拉回来。', { emo: 'sad' }));
      lines.push(L('ty', '……', { emo: 'cold' }));
      lines.push(L('ty', '我死过的那一次，最后想的是：{p:500}「还差一步」。', { emo: 'cold' }));
      lines.push(L('ty', '现在我还在走那一步。{p:600}所以没有后悔的位置。', { emo: 'determined' }));
      lines.push(L('ty', '……不过。', { emo: 'cold' }));
      lines.push(L('ty', '我的计算里有一个变量，我一直无法预测。', { emo: 'cold' }));
      lines.push(L('hero', '什么变量？', { emo: 'fear' }));
      lines.push(L('ty', '{c:#9ff0ff}「普通人选择站起来」的概率。{/c}', { emo: 'sharp' },
        { onEnter: function () { G.St.setFlag('seenIfHint2'); G.St.learn('ty_variable', 'TY 无法预测的变量：普通人选择站起来的概率'); } }));
    }
    return lines;
  };

  D.storm_upright = function () {
    return [
      L('upright', '这种天气，我的队员会全部留在地面。', { emo: 'determined' }),
      L('hero', '那你为什么在这里？', { emo: 'fear' }),
      L('upright', '因为我是队长。', { emo: 'determined' }),
      L('upright', '不能要求别人做的事，我自己去做。', { emo: 'determined' })
    ];
  };

  D.storm_note = function () {
    return [
      L('narrator', '一块被雷击焦的木牌，字迹几乎烧没了。'),
      L('narrator', '「……不要相信第四区的捷径。那里……」'),
      L('narrator', '后面被烧掉了。'),
      L('hero', '……第四区。', { emo: 'fear' })
    ];
  };

  /* ============================================================
     区域4 · 机械工厂
     ============================================================ */
  D.factory_ty = function () {
    var lines = [
      L('ty', '这里的能耗曲线不对。', { emo: 'sharp' }),
      L('hero', '什么意思？', { emo: 'fear' }),
      L('ty', '这座工厂在生产的东西，不需要这么多能量。', { emo: 'cold' }),
      L('ty', '除非……{p:600}它在维持某个「活着的东西」。', { emo: 'cold' }),
      L('hero', '……', { emo: 'fear' })
    ];
    if (G.St.s.tyDecay >= 3) {
      lines.push(L('ty', '（咳、咳咳。）', { emo: 'pain' }));
      lines.push(L('hero', '你休息一下吧。', { emo: 'sad' }));
      lines.push(L('ty', '休息需要 17 分钟。{p:400}我们没有 17 分钟。', { emo: 'cold' }));
      lines.push(L('hero', '……那我等你 17 分钟。', { emo: 'determined' }));
      lines.push(L('ty', '……', { emo: 'surprise' }));
      lines.push(L('ty', '……好。', { emo: 'cold' }));
    }
    return lines;
  };

  D.factory_lucky = function () {
    if (G.St.isDead('lucky')) return null;
    return [
      L('lucky', '这地方我不喜欢。', { emo: 'sad' }),
      L('hero', '你也会不喜欢东西？', { emo: 'surprise' }),
      L('lucky', '会啊。{p:400}我只是不说。', { emo: 'smile' }),
      L('lucky', '你想想，一个总是很走运的人，{p:400}说「我害怕」，多难看。', { emo: 'smile' }),
      L('lucky', '大家都指望我带来好运呢。', { emo: 'smile' }),
      L('hero', '……那你害怕的时候怎么办？', { emo: 'sad' }),
      L('lucky', '笑得更大声一点。', { emo: 'smile' })
    ];
  };

  D.factory_upright = function () {
    return [
      L('upright', '这些培养舱……{p:500}里面装的是人。', { emo: 'anger' }),
      L('hero', '……', { emo: 'fear' }),
      L('upright', '我见过战争。{p:400}战争里也有规矩。', { emo: 'anger' }),
      L('upright', '这里没有规矩。{p:500}这里只有「有用」和「没用」。', { emo: 'anger' }),
      L('upright', '……我要把这里烧掉。', { emo: 'determined' })
    ];
  };

  D.factory_tape = function () {
    return [
      L('narrator', '一段循环播放的录音。杂音很重。'),
      L('narrator', '「第 41 次调试。受体意识清醒度：97%。」'),
      L('narrator', '「——注：清醒是必要的。我们需要他知道自己在做什么。」'),
      L('narrator', '录音里传来一个年轻的声音，在哭，在道歉，在说「求你了」。'),
      L('hero', '{s}……关掉。{/s}', { emo: 'broken' }),
      L('narrator', '「第 42 次调试。受体不再求饶。判定：进展良好。」'),
      L('hero', '{s}我说关掉！！{/s}', { emo: 'broken', shake: 16 }),
      L('hero', '……', { emo: 'numb' },
        { onEnter: function () { G.St.addSanity(-4); G.St.learn('puppet_torture', '幕后Boss 让他保持清醒 —— 因为「他需要知道自己在做什么」'); } })
    ];
  };

  D.factory_wall = function () {
    return [
      L('narrator', '墙上有指甲划出的字。很深，反复划了很多次。'),
      L('narrator', '「不是我」'),
      L('narrator', '「不是我」'),
      L('narrator', '「不是我做的」'),
      L('narrator', '最后一行，字迹忽然平静下来：'),
      L('narrator', '「……是我。」'),
      L('hero', '……', { emo: 'sad' }),
      L('hero', '（他一直是清醒的。）', { emo: 'broken' })
    ];
  };

  /* ============================================================
     区域5 · 高空祭坛
     ============================================================ */
  D.shrine_friend = function () {
    if (G.St.flag('friendRevealed')) {
      return [
        L('friend', '……你还愿意跟我说话？', { emo: 'sad', alt: 1 }),
        L('hero', '我不知道。', { emo: 'sad' }),
        L('friend', '那就别说。{p:500}我们在终点见。', { emo: 'numb', alt: 1 })
      ];
    }
    var lines = [
      L('friend', '你脸色好差啊。', { emo: 'smile' }),
      L('hero', '……有那么明显？', { emo: 'fear' }),
      L('friend', '我认识你多久了？{p:400}你一皱眉我就知道你在硬撑。', { emo: 'smile' }),
      L('friend', '想哭就哭吧。{p:400}这里没别人。', { emo: 'smile' }),
      L('hero', '……', { emo: 'sad' }),
      L('friend', '……', { emo: 'smile' }),
      L('friend', '你知道吗，{p:400}我最羨慕你的一点。', { emo: 'smile' }),
      L('hero', '羡慕我？', { emo: 'surprise' }),
      L('friend', '你什么都不会，什么都怕，{p:400}但每次都还是站在那儿。', { emo: 'smile' }),
      L('friend', '我做不到。{p:600}我只会选看起来最容易的那条路。', { emo: 'sad' }),
      L('hero', '……你在说什么啊。', { emo: 'fear' }),
      L('friend', '没什么。{p:400}我在说，我羡慕你。', { emo: 'smile' })
    ];
    if (G.St.s.loopCount >= 6) {
      lines.push(L('friend', '……对了。', { emo: 'smile' }));
      lines.push(L('friend', '如果有一天，{p:400}你发现我骗了你——', { emo: 'sad' }));
      lines.push(L('hero', '？', { emo: 'surprise' }));
      lines.push(L('friend', '……算了。{p:600}没什么。', { emo: 'smile' }));
    }
    return lines;
  };

  D.shrine_ty = function () {
    return [
      L('ty', '这座祭坛的年代，比浮空都市早两千年。', { emo: 'cold' }),
      L('hero', '那时候人还住在地上？', { emo: 'fear' }),
      L('ty', '是。{p:400}然后他们把地面用完了。', { emo: 'cold' }),
      L('ty', '……这个世界毁灭过一次。{p:600}这是第二次。', { emo: 'cold' }),
      L('hero', '第一次有人救吗？', { emo: 'fear' }),
      L('ty', '有。{p:500}他失败了。', { emo: 'cold' }),
      L('ty', '这座祭坛，是给他立的。', { emo: 'cold' })
    ];
  };

  D.shrine_upright = function () {
    return [
      L('upright', '……这些石柱上的纹章。', { emo: 'surprise' }),
      L('hero', '怎么了？', { emo: 'fear' }),
      L('upright', '没什么。', { emo: 'determined' }),
      L('narrator', '他把手从护目镜边缘那个小小的徽记上放了下来。'),
      L('hero', '……你认识那个纹章？', { emo: 'surprise' }),
      L('upright', '{s}我说了没什么。{/s}', { emo: 'anger' }),
      L('upright', '……抱歉。{p:600}我不该那样说话。', { emo: 'sad' }),
      L('hero', '……', { emo: 'fear' },
        { onEnter: function () { G.St.setFlag('seenIfHint1'); } })
    ];
  };

  D.shrine_lucky = function () {
    if (G.St.isDead('lucky')) return null;
    return [
      L('lucky', '这地方安静得过分。', { emo: 'smile' }),
      L('lucky', '安静的地方，运气容易睡着。', { emo: 'smile' }),
      L('hero', '……那你把它叫醒。', { emo: 'fear' }),
      L('lucky', '好主意！', { emo: 'smile' }),
      L('narrator', '他对着空气大喊了一声「喂——！」，回音在祭坛里绕了很久。'),
      L('lucky', '好，醒了。', { emo: 'smile' })
    ];
  };

  D.shrine_tablet = function () {
    return [
      L('narrator', '石板上刻着预言，字体古老，但意思清楚。'),
      L('narrator', '「天倾之时，将有二人负世而行。」'),
      L('narrator', '「一人有脑，一人有手。」'),
      L('narrator', '「二人皆非此世之子。」'),
      L('hero', '……说的是我们？', { emo: 'surprise' }),
      L('narrator', '下面还有一行，刻得很浅，像是后来补上的：'),
      L('narrator', '「若二人皆亡，则第三人起。」'),
      L('hero', '第三人……？', { emo: 'fear' }),
      L('hero', '（谁？）', { emo: 'fear' },
        { onEnter: function () { G.St.learn('prophecy', '预言：若二人皆亡，则第三人起'); G.St.setFlag('seenIfHint2'); } })
    ];
  };

  /* ============================================================
     区域6 · 核心空域
     ============================================================ */
  D.core_ty = function () {
    var d = G.St.s.tyDecay;
    var lines = [
      L('ty', '……我算完了。', { emo: 'cold', decay: d }),
      L('hero', '算完了？', { emo: 'surprise' }),
      L('ty', '所有分支。{p:400}所有可能。{p:500}一共 4,096 条。', { emo: 'cold' }),
      L('ty', '其中 4,095 条，世界毁灭。', { emo: 'cold' }),
      L('hero', '……那一条呢？', { emo: 'fear' }),
      L('ty', '那一条里，{p:600}我死。', { emo: 'cold' }),
      L('hero', '{s}那就换一条！{/s}', { emo: 'broken' }),
      L('ty', '没有别的了。', { emo: 'cold' }),
      L('hero', '{s}再算一次！你再算一次！！{/s}', { emo: 'broken', shake: 14 }),
      L('ty', '……', { emo: 'sad' }),
      L('ty', '我算了 4,096 次。{p:500}每一次，我都试着把自己放进活下来的那一栏。', { emo: 'cold' }),
      L('ty', '每一次，等式都不成立。', { emo: 'cold' }),
      L('hero', '……', { emo: 'broken' }),
      L('ty', '别哭。{p:500}你哭的时候，我的手会抖。', { emo: 'cold' })
    ];
    return lines;
  };

  D.core_madman = function () {
    if (!G.St.flag('madmanRevealed')) {
      return [
        L('madman', '嘿嘿……{p:400}到了呀。{p:400}终点到了呀。', { emo: 'mad' }),
        L('madman', '答案要交卷了。{p:400}问题也要交卷了。', { emo: 'mad' })
      ];
    }
    return [
      L('madman', '你还是来了。', { emo: 'cold', alt: 1 }),
      L('hero', '你早就知道会这样。', { emo: 'sad' }),
      L('madman', '我知道七种结局。', { emo: 'cold', alt: 1 }),
      L('madman', '其中六种，你会死。', { emo: 'cold', alt: 1 }),
      L('hero', '……第七种呢？', { emo: 'fear' }),
      L('madman', '第七种里，{p:600}你不是主角。', { emo: 'cold', alt: 1 }),
      L('hero', '……什么意思？', { emo: 'surprise' }),
      L('madman', '嘿嘿。{p:500}到时候你就知道了。', { emo: 'cold', alt: 1 },
        { onEnter: function () { G.St.setFlag('seenIfHint3'); } })
    ];
  };

  D.core_upright = function () {
    if (!G.St.flag('uprightAlive')) return null;
    return [
      L('upright', '……我们大概都活不下来。', { emo: 'determined' }),
      L('hero', '……嗯。', { emo: 'sad' }),
      L('upright', '所以我想说一件事。', { emo: 'determined' }),
      L('upright', '……我其实有背景。', { emo: 'sad' }),
      L('hero', '？', { emo: 'surprise' }),
      L('upright', '我的家族，掌握着某种力量。{p:500}足以一个人扭转战局。', { emo: 'sad' }),
      L('upright', '我从来没用过。', { emo: 'sad' }),
      L('hero', '为什么不用？', { emo: 'fear' }),
      L('upright', '……因为我害怕。', { emo: 'sad' }),
      L('upright', '害怕变成……{p:600}另一个人。', { emo: 'sad' }),
      L('hero', '……', { emo: 'sad' }),
      L('upright', '我年轻的时候，见过族里一个人用它。', { emo: 'sad' }),
      L('upright', '他救了一座城。{p:500}然后他杀光了那座城。', { emo: 'numb' }),
      L('upright', '……我把那天的自己，一起埋了。', { emo: 'sad' },
        { onEnter: function () {
            G.St.setFlag('uprightKnowsSecret');
            G.St.learn('upright_power', '正直的人的家族力量 —— 他选择不用，因为怕变成别人');
          } })
    ];
  };

  D.core_lucky = function () {
    if (G.St.isDead('lucky')) return null;
    return [
      L('lucky', '喂。', { emo: 'smile' }),
      L('hero', '……嗯？', { emo: 'fear' }),
      L('lucky', '如果我死了，你别难过太久，好不好？', { emo: 'smile' }),
      L('hero', '{s}你别说这种话！{/s}', { emo: 'broken' }),
      L('lucky', '哈哈，好好好，不说不说。', { emo: 'smile' }),
      L('lucky', '……', { emo: 'smile' }),
      L('lucky', '不过说真的。{p:500}我这辈子运气用得太爽了。', { emo: 'smile' }),
      L('lucky', '爽到我有点不好意思。', { emo: 'smile' })
    ];
  };

  D.core_creed = function () {
    return [
      L('narrator', '刻在一根巨大的骨头上。刻得很用力，有些地方刻穿了。'),
      L('narrator', '「别人不看好我。」'),
      L('narrator', '「我的父母又走得早。」'),
      L('narrator', '「然后，谁都不爱我。」'),
      L('narrator', '「那我只能比别人更爱我自己一点。」'),
      L('hero', '……', { emo: 'sad' }),
      L('hero', '（这句话，{p:500}我居然能看懂。）', { emo: 'sad' }),
      L('hero', '（……这才是最可怕的地方。）', { emo: 'fear' },
        { onEnter: function () { G.St.learn('savior_creed', '最终Boss的信条 —— 我只能比别人更爱我自己一点'); } })
    ];
  };

})(window);
