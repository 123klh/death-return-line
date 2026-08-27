/* ===========================================================
   endings.js — 好结局 / 坏结局 A–E / 彩蛋 IF 结局
     每个结局 = death（死亡/终局演出）+ after（世界之后的演出）
     每个「世界之后」的画面与节奏都不同，与结局主题呼应
   =========================================================== */
(function (root) {
  'use strict';
  var G = root.G;
  var E = G.Endings = {};

  /* ============================================================
     好结局 · 晚安，我的救世主
     ============================================================ */
  E.good = {
    id: 'good', title: '晚安，我的救世主', tag: 'TRUE ENDING', color: '#E0E6ED',
    sub: '救世主也是人……也是要休息的……',
    steps: [
      { t: 'reset' },
      { t: 'clear' },
      { t: 'bg', id: 'newcity', fade: 1600 },
      { t: 'bgm', id: 'hope', fade: 2200 },
      { t: 'card', small: 'ENDING  ·  好结局', big: '世 界 被 拯 救 了', ms: 2800 },
      { t: 'sub', text: '第 471 天。什么都没有发生。', ms: 2800, y: 640 },
      { t: 'sub', text: '天空还在那里。浮空都市还在那里。', ms: 2800, y: 640 },
      { t: 'sub', text: '所有人都活着——除了那些已经死掉的人。', ms: 3200, y: 640 },

      /* —— 庆功宴（远处） —— */
      { t: 'bg', id: 'underground', fade: 1800 },
      { t: 'paint', fn: 'undergroundRoom', ms: 999999, keep: true, wait: false },
      { t: 'paint', fn: 'emergencyLight', ms: 999999, keep: true, wait: false },
      { t: 'grain', a: .7 },
      { t: 'vignette', a: .55, ms: 1200 },
      { t: 'sub', text: '庆功宴在上面。灯很亮，笑声隔着几十米的岩层传下来，模糊得像另一个世界。', ms: 4200, y: 660 },
      { t: 'wait', ms: 600 },

      /* —— 地下空间：TY —— */
      { t: 'enter', who: 'ty', slot: 'center', from: 'fade', ms: 2200,
        emo: 'numb', decay: 5, scale: 1.6, y: 477, x: 670, sit: 1 },
      { t: 'wait', ms: 1200 },
      { t: 'say', who: 'ty', emo: 'numb', decay: 5, text: '（咳。）' },
      { t: 'say', who: 'ty', emo: 'numb', decay: 5, text: '……算完了。{p:900}全部算完了。' },
      { t: 'wait', ms: 700 },

      /* 主角从阴影中走出 */
      { t: 'sfx', id: 'uiMove' },
      { t: 'enter', who: 'hero', slot: 'left', from: 'left', emo: 'sad', ms: 1600, scale: 1.6, y: 540, x: 408 },
      { t: 'actor', who: 'ty', emo: 'surprise', ms: 300 },
      { t: 'say', who: 'ty', emo: 'surprise', decay: 5, text: '……？' },
      { t: 'say', who: 'ty', emo: 'numb', decay: 5,
        text: '我本就想去一个没有任何人知道的地方，{p:500}就那样安安静静地死在里面。' },
      { t: 'say', who: 'ty', emo: 'numb', decay: 5, text: '这便是我最后的愿望了。' },
      { t: 'say', who: 'ty', emo: 'sad', decay: 5, text: '……没想到你居然还在这里。' },
      { t: 'say', who: 'hero', emo: 'sad', text: '……我等了六个小时。' },
      { t: 'say', who: 'ty', emo: 'surprise', decay: 5, text: '你怎么知道我会来这里？' },
      { t: 'say', who: 'hero', emo: 'sad', text: '……因为我认识你。' },
      { t: 'wait', ms: 900 },
      { t: 'say', who: 'ty', emo: 'sad', decay: 5,
        text: '……不过也好。{p:700}或许也就只有你，{p:500}能够知道我和你一起经历了什么吧。' },
      { t: 'wait', ms: 800 },

      /* —— 拥抱 → 副作用立刻生效 —— */
      { t: 'closebox' },
      { t: 'par', steps: [
        [{ t: 'zoom', z: 1.16, ms: 3000, cx: 600, cy: 400, wait: false }],
        [{ t: 'actor', who: 'hero', x: 560, ms: 2400, wait: false }],
        [{ t: 'wait', ms: 1400 }]
      ] },
      { t: 'sub', text: '主角沉默地走过去，伸出手，想要紧紧抱住他。', ms: 2600, y: 650 },
      { t: 'wait', ms: 400 },
      { t: 'par', steps: [
        [{ t: 'sfx', id: 'glitch', arg: 5 }],
        [{ t: 'shake', p: 10, ms: 900 }],
        [{ t: 'flash', color: '#ffffff', ms: 400, a: .5 }],
        /* 迅速衰老、干瘪、萎缩 */
        [{ t: 'actor', who: 'ty', scale: 1.18, y: 510, emo: 'numb',
           tintColor: '#e8e4dc', tintAmt: .8, ms: 2600, wait: false }]
      ] },
      { t: 'wait', ms: 1600 },
      { t: 'sub', text: '副作用立刻生效。他的身体在被触碰的瞬间，迅速衰老、干瘪、萎缩。', ms: 3400, y: 650 },
      { t: 'wait', ms: 700 },
      { t: 'sub', text: '只剩下一具老瘦骨嶙峋、骨瘦如柴的躯壳。', ms: 3000, y: 650 },
      { t: 'stopBgm', ms: 1600 },
      { t: 'wind', gain: .07 },
      { t: 'wait', ms: 900 },

      { t: 'say', who: 'ty', emo: 'numb', decay: 5, text: '……辛苦你了，{p:800}救世主……' },
      { t: 'say', who: 'hero', emo: 'broken', text: '{s}……我不是救世主。{/s}' },
      { t: 'say', who: 'hero', emo: 'broken', text: '{s}你才是。{p:400}一直都是你。{/s}' },
      { t: 'say', who: 'ty', emo: 'sad', decay: 5, text: '……不。' },
      { t: 'par', steps: [
        [{ t: 'zoom', z: 1.26, ms: 3200, cx: 660, cy: 420, wait: false }],
        [{ t: 'lines', list: [
          { who: 'ty', emo: 'sad', decay: 5, text: '救世主……{p:600}也是人……' },
          { who: 'ty', emo: 'numb', decay: 5, text: '……也是要休息的……' }
        ] }]
      ] },
      { t: 'wait', ms: 1000 },

      /* —— 消散 —— */
      { t: 'closebox' },
      { t: 'par', steps: [
        [{ t: 'actor', who: 'ty', emo: 'numb', tintColor: '#ffffff', tintAmt: 1, ms: 2400, wait: false }],
        [{ t: 'motes', who: 'ty', color: '#ffffff', n: 46 }],
        [{ t: 'sfx', id: 'shatter' }]
      ] },
      { t: 'wait', ms: 1400 },
      { t: 'par', steps: [
        [{ t: 'actor', who: 'ty', alpha: 0, ms: 3000, wait: false }],
        [{ t: 'motes', who: 'ty', color: '#eaf6ff', n: 40 }]
      ] },
      { t: 'wait', ms: 2200 },
      { t: 'zoom', z: 1, ms: 2000, wait: false },
      { t: 'actor', who: 'hero', emo: 'broken', x: 600, y: 500, scale: 1.55, ms: 1600 },
      { t: 'wait', ms: 1400 },
      { t: 'say', who: 'hero', emo: 'sad', text: '……晚安。' },
      { t: 'say', who: 'hero', emo: 'sad', text: '晚安，{p:900}我的救世主。' },

      /* —— 定格 10-15 秒 —— */
      { t: 'closebox' },
      { t: 'letterbox', a: 1, ms: 1400 },
      { t: 'vignette', a: .8, ms: 3000 },
      { t: 'hold', ms: 9000, keepBox: true },
      { t: 'par', steps: [
        [{ t: 'black', a: .82, ms: 5000 }],
        [{ t: 'desat', a: .9, ms: 5000, wait: false }]
      ] },
      { t: 'sub', text: '远处，庆功宴的笑声还在继续。', ms: 3600, y: 400 },
      { t: 'sub', text: '没有人知道，这个世界真正的救世主，刚刚在地下三十米的黑暗里，安静地下班了。',
        ms: 5000, y: 400 },
      { t: 'wind', off: true, ms: 2600 },
      { t: 'black', a: 1, ms: 2600 },
      { t: 'clear' },
      { t: 'unpaint' },

      /* —— 后记 —— */
      { t: 'bg', id: 'newcity', fade: 0 },
      { t: 'black', a: 0, ms: 2600 },
      { t: 'bgm', id: 'hope', fade: 3000 },
      { t: 'sub', text: '主角摆脱了「死亡回归」——它在世界得救的那一刻，从他身上消失了。', ms: 4000, y: 640 },
      { t: 'sub', text: '他可以回家了。', ms: 3000, y: 640 },
      { t: 'sub', text: '……但他在这个世界，又多留了四十年。', ms: 4000, y: 640 },
      { t: 'sub', text: '他把每一个人的名字，都刻在了那面墙上。一个都没有划掉。', ms: 4600, y: 640 },
      { t: 'wait', ms: 800 }
    ]
  };

  /* ============================================================
     坏结局A · TY 先死，主角无法回归
     ============================================================ */
  E.badA = {
    id: 'badA', title: '没有救世主的世界', tag: 'BAD END  A', color: '#FF6B4A',
    sub: '没有救世主的世界，连轮回的资格都没有。',
    steps: [
      { t: 'reset' },
      { t: 'clear' },
      { t: 'stopBgm', ms: 400 },
      { t: 'bg', id: 'bone', fade: 1200 },
      { t: 'grain', a: .9 }, { t: 'vignette', a: .55, ms: 800 },
      { t: 'wind', gain: .12 },
      { t: 'card', small: 'BAD  END  A', big: '无 法 指 定', ms: 2600 },

      { t: 'enter', who: 'hero', slot: 'center', emo: 'broken', from: 'fade', ms: 1400 },
      { t: 'say', who: 'hero', emo: 'broken', text: '{s}TY——！！{/s}' },
      { t: 'sub', text: '护航舱在他眼前化成了火球。连一块可以带走的东西都没有留下。', ms: 3600, y: 650 },
      { t: 'say', who: 'hero', emo: 'broken', text: '不……{p:300}不不不不不——' },
      { t: 'say', who: 'hero', emo: 'broken', text: '{s}回来！{p:300}给我回来！！{/s}' },
      { t: 'closebox' },

      /* 疯狂自杀，但时间没有倒流 */
      { t: 'sub', text: '他撞向岩壁。', ms: 1600, y: 130 },
      { t: 'par', steps: [
        [{ t: 'shake', p: 22, ms: 600 }], [{ t: 'sfx', id: 'hit' }],
        [{ t: 'flash', color: '#ff2b3e', ms: 300, a: .5 }]
      ] },
      { t: 'sub', text: '……时间没有倒流。', ms: 2200, y: 130 },
      { t: 'sub', text: '他把枪口对准自己。', ms: 1800, y: 130 },
      { t: 'par', steps: [
        [{ t: 'shake', p: 26, ms: 500 }], [{ t: 'sfx', id: 'explode' }],
        [{ t: 'flash', color: '#ffffff', ms: 400, a: .8 }]
      ] },
      { t: 'sub', text: '……时间没有倒流。', ms: 2200, y: 130 },
      { t: 'sub', text: '他站在断层边缘，跳了下去。', ms: 2000, y: 130 },
      { t: 'par', steps: [
        [{ t: 'black', a: .9, ms: 900 }], [{ t: 'sfx', id: 'explode', arg: true }]
      ] },
      { t: 'wait', ms: 1400 },
      { t: 'sub', text: '……时间。{p:800}没有。{p:800}倒流。', ms: 3400, y: 340 },
      { t: 'wait', ms: 900 },
      { t: 'black', a: 0, ms: 1800 },
      { t: 'sub', text: '能力还在。它只是没有对象了——你无法「指定」一个已经彻底消失的人。', ms: 4400, y: 650 },

      { t: 'actor', who: 'hero', emo: 'numb', y: 520, scale: 1.6, rot: .2, ms: 2600 },
      { t: 'par', steps: [
        [{ t: 'desat', a: .95, ms: 4000, wait: false }],
        [{ t: 'vignette', a: .8, ms: 4000 }]
      ] },
      { t: 'sub', text: '他倒在地上，眼神空洞，嘴角带着一丝苦笑。', ms: 3600, y: 650 },
      { t: 'hold', ms: 4000, letterbox: true, keepBox: true },
      { t: 'black', a: 1, ms: 2600 },
      { t: 'clear' },

      /* —— 世界之后：缓慢、绝望、漫长的坠落 —— */
      { t: 'bg', id: 'fall', fade: 0 },
      { t: 'black', a: 0, ms: 2600 },
      { t: 'bgm', id: 'dread', fade: 2600 },
      { t: 'sub', text: '—— 世 界 之 后 ——', ms: 2600, size: 26, y: 120 },
      { t: 'paint', fn: 'cityFall', ms: 26000, keep: true, wait: false },
      { t: 'sub', text: '没有 TY 的智慧，世界按照「注定毁灭」的命运线走向终结。', ms: 4400, y: 650 },
      { t: 'wait', ms: 2000 },
      { t: 'par', steps: [
        [{ t: 'shake', p: 8, ms: 3000 }], [{ t: 'sfx', id: 'explode', arg: true }]
      ] },
      { t: 'sub', text: '浮空都市一个接一个坠落。天空被火焰染红，烧了整整十一天。', ms: 4800, y: 650 },
      { t: 'wait', ms: 2400 },
      { t: 'paint', fn: 'survivorFight', ms: 14000, keep: true, layer: 'over', wait: false },
      { t: 'sub', text: '最后的幸存者在废墟中互相残杀，争夺最后一罐水。', ms: 4600, y: 650 },
      { t: 'wait', ms: 2600 },
      { t: 'unpaint', ms: 2400 },
      { t: 'bg', id: 'bone', fade: 3000 },
      { t: 'paint', fn: 'boneScene', ms: 999999, keep: true, wait: false },
      { t: 'wind', gain: .14 },
      { t: 'sub', text: '画面最后定格在他们曾经相遇的那片废墟。', ms: 4000, y: 650 },
      { t: 'sub', text: '一架锈迹斑斑的战机骨架。两具靠在一起的白骨。', ms: 4600, y: 650 },
      { t: 'hold', ms: 3600, letterbox: true, keepBox: true },
      { t: 'stopBgm', ms: 3000 },
      { t: 'sub', text: '没有救世主的世界，连轮回的资格都没有。',
        ms: 6000, size: 27, y: 380, glow: 1, glowColor: '#FF6B4A' },
      { t: 'wind', off: true, ms: 2600 },
      { t: 'black', a: 1, ms: 3000 }
    ]
  };

  /* ============================================================
     坏结局B · 主角精神崩溃，主动放弃回归
     ============================================================ */
  E.badB = {
    id: 'badB', title: '他选择了永远的休息', tag: 'BAD END  B', color: '#C9A8FF',
    sub: '他太累了。他选择了永远的休息。',
    steps: [
      { t: 'reset' },
      { t: 'clear' },
      { t: 'stopBgm', ms: 600 },
      { t: 'bg', id: 'voidw', fade: 1800 },
      { t: 'grain', a: .25 },
      { t: 'vignette', a: .12, ms: 1200 },
      { t: 'card', small: 'BAD  END  B', big: '够 了', ms: 2600 },

      { t: 'paint', fn: 'deadFaces', ms: 26000, keep: true, data: { all: true }, wait: false },
      { t: 'enter', who: 'hero', slot: 'center', emo: 'numb', from: 'fade', ms: 2000, scale: 1.8, y: 470 },
      { t: 'wait', ms: 1200 },
      { t: 'say', who: 'hero', emo: 'numb', text: '……你们都在。' },
      { t: 'say', who: 'hero', emo: 'numb', text: '每一次都在。{p:600}每一次我闭上眼，你们就都在。' },
      { t: 'say', who: 'hero', emo: 'broken', text: '我记得每一张脸。{p:500}我记得你们死时候的温度。' },
      { t: 'say', who: 'hero', emo: 'numb', text: '……' },
      { t: 'say', who: 'hero', emo: 'numb', text: '……够了。' },
      { t: 'say', who: 'hero', emo: 'numb', text: '我不想……{p:900}再看了。' },
      { t: 'closebox' },

      /* 溶解 */
      { t: 'unpaint', fn: 'deadFaces', ms: 2600 },
      { t: 'actor', who: 'hero', alpha: 0, ms: 200 },
      { t: 'par', steps: [
        [{ t: 'paint', fn: 'dissolve', ms: 6000, data: { who: 'hero', x: 640, y: 470, scale: 1.8 }, wait: false }],
        [{ t: 'sfx', id: 'shatter' }],
        [{ t: 'wait', ms: 6000 }]
      ] },
      { t: 'sub', text: '他的轮廓像被水浸泡的纸一样模糊、褪色、散开。', ms: 3600, y: 640 },
      { t: 'wait', ms: 1200 },
      { t: 'paint', fn: 'whiteVoid', ms: 999999, keep: true, wait: false },
      { t: 'wait', ms: 2400 },
      { t: 'sub', text: '他太累了。他选择了永远的休息。',
        ms: 6000, size: 26, y: 360, color: '#3a4450', box: false },
      { t: 'wait', ms: 1400 },
      { t: 'unpaint', ms: 2600 },
      { t: 'clear' },

      /* —— 世界之后：孤独、冷静、理性的崩溃 —— */
      { t: 'bg', id: 'underground', fade: 3000 },
      { t: 'bgm', id: 'void', fade: 3000 },
      { t: 'sub', text: '—— 世 界 之 后 ——', ms: 2600, size: 26, y: 120 },
      { t: 'paint', fn: 'emergencyLight', ms: 999999, keep: true, wait: false },
      { t: 'paint', fn: 'tyAlone', ms: 999999, keep: true, wait: false },
      { t: 'enter', who: 'ty', slot: 'center', emo: 'cold', decay: 4, from: 'fade', ms: 2400, scale: 1.7, y: 480 },
      { t: 'sub', text: 'TY 独自醒来。他记得一切——他是被指定的人。', ms: 4000, y: 650 },
      { t: 'say', who: 'ty', emo: 'cold', decay: 4, text: '……时间。{p:400}位置。{p:400}温度。' },
      { t: 'say', who: 'ty', emo: 'cold', decay: 4, text: '一切参数都对。{p:600}只有一个变量不见了。' },
      { t: 'sub', text: '他在废墟中找了十九天。', ms: 3400, y: 650 },
      { t: 'say', who: 'ty', emo: 'numb', decay: 4, text: '……推论：{p:700}他主动放弃了存在。' },
      { t: 'say', who: 'ty', emo: 'sad', decay: 4, text: '……这个推论，我不接受。' },
      { t: 'sub', text: '但他还是接受了。因为数据不会说谎。', ms: 3800, y: 650 },
      { t: 'wait', ms: 900 },
      { t: 'sub', text: 'TY 独自继续。他的计划一次又一次失败——因为没有了那双「手」。', ms: 4600, y: 650 },
      { t: 'actor', who: 'ty', decay: 5, scale: 1.5, y: 500, emo: 'numb', ms: 3000 },
      { t: 'sub', text: '第七次失败之后，他不再站起来了。', ms: 3600, y: 650 },
      { t: 'wait', ms: 1200 },
      { t: 'say', who: 'ty', emo: 'numb', decay: 5, text: '……你骗了我。' },
      { t: 'say', who: 'ty', emo: 'sad', decay: 5, text: '你说要一起找到那条路的。' },
      { t: 'closebox' },
      { t: 'par', steps: [
        [{ t: 'actor', who: 'ty', alpha: .18, ms: 6000, wait: false }],
        [{ t: 'desat', a: 1, ms: 6000, wait: false }],
        [{ t: 'vignette', a: .85, ms: 6000 }]
      ] },
      { t: 'sub', text: '他坐在黑暗中，手指在虚空里继续推演。', ms: 4000, y: 650 },
      { t: 'sub', text: '但推演的对象，已经不存在了。', ms: 4400, y: 650 },
      { t: 'hold', ms: 4000, letterbox: true, keepBox: true },
      { t: 'stopBgm', ms: 3000 },
      { t: 'black', a: 1, ms: 3400 }
    ]
  };

  /* ============================================================
     坏结局C · 选择错误，世界提前毁灭
     ============================================================ */
  E.badC = {
    id: 'badC', title: '他甚至没来得及知道', tag: 'BAD END  C', color: '#FFB15E',
    sub: '他甚至没来得及知道，自己做了什么。',
    steps: [
      { t: 'reset' },
      { t: 'clear' },
      { t: 'bg', id: 'ruins', fade: 600 },
      { t: 'bgm', id: 'camp', fade: 800 },
      { t: 'enter', who: 'hero', slot: 'left', emo: 'calm' },
      { t: 'enter', who: 'ty', slot: 'right', emo: 'cold', flip: true },
      { t: 'say', who: 'ty', emo: 'cold', text: '……你走了那条捷径。' },
      { t: 'say', who: 'hero', emo: 'calm', text: '省了十七天。{p:400}这不是好事吗？' },
      { t: 'say', who: 'ty', emo: 'sharp', text: '第四区东侧断层的支撑残余是——' },

      /* 突然、混乱、来不及反应 */
      { t: 'par', steps: [
        [{ t: 'flash', color: '#ff2b3e', ms: 200, a: 1 }],
        [{ t: 'shake', p: 34, ms: 2600 }],
        [{ t: 'sfx', id: 'explode', arg: true }],
        /* 红色染屏是全屏叠加，会一起洗掉对话框和立绘。
           这段要持续好几句台词，所以强度交给 redEdge（只压边缘），tint 只留一点底色。 */
        [{ t: 'tint', color: '#ff2b3e', a: .26, ms: 300 }],
        [{ t: 'redEdge', a: 1, ms: 200 }],
        [{ t: 'stopBgm', ms: 200 }],
        [{ t: 'glitch', ms: 1400, p: 1 }]
      ] },
      { t: 'actor', who: 'hero', emo: 'surprise', ms: 100 },
      { t: 'actor', who: 'ty', emo: 'surprise', ms: 100 },
      { t: 'say', who: 'hero', emo: 'surprise', text: '……？' },
      { t: 'sub', text: '天空变红了。地面在震。', ms: 1800, y: 130 },
      { t: 'say', who: 'hero', emo: 'fear', text: '……什么声音？' },
      { t: 'sub', text: '远处的浮空都市正在崩塌。不是一座——是全部。', ms: 2600, y: 130 },
      { t: 'say', who: 'ty', emo: 'numb', text: '……末日提前了。' },
      { t: 'say', who: 'hero', emo: 'fear', text: '什、什么？为什么——' },
      { t: 'say', who: 'ty', emo: 'numb', text: '因为那道断层，是压着核心的最后一块石头。' },
      { t: 'par', steps: [
        [{ t: 'shake', p: 40, ms: 3400 }],
        [{ t: 'paint', fn: 'cityFall', ms: 9000, keep: true, wait: false }]
      ] },
      { t: 'say', who: 'hero', emo: 'broken', text: '{s}那我们回去！我死一次就能回去！{/s}' },
      { t: 'say', who: 'ty', emo: 'numb', text: '存档点在断层的另一边。' },
      { t: 'say', who: 'hero', emo: 'broken', text: '{s}……什么？{/s}' },
      { t: 'say', who: 'ty', emo: 'numb', text: '它已经不存在了。' },
      { t: 'closebox' },
      { t: 'par', steps: [
        [{ t: 'zoom', z: 1.35, ms: 1400, cx: 300, cy: 300, wait: false }],
        [{ t: 'sfx', id: 'warn' }]
      ] },
      { t: 'sub', text: '主角抬起头。', ms: 1400, y: 130 },
      { t: 'par', steps: [
        [{ t: 'flash', color: '#ffffff', ms: 260, a: 1 }],
        [{ t: 'shake', p: 44, ms: 900 }],
        [{ t: 'sfx', id: 'explode', arg: true }],
        [{ t: 'black', a: 1, ms: 400 }]
      ] },
      { t: 'wait', ms: 2600 },
      { t: 'clear' }, { t: 'unpaint' }, { t: 'reset' },

      /* —— 世界之后：监控录像风格 —— */
      { t: 'bg', id: 'bone', fade: 0 },
      { t: 'paint', fn: 'surveil', ms: 999999, keep: true, wait: false },
      { t: 'scanlines', a: 1 },
      { t: 'grain', a: 1 },
      { t: 'black', a: 0, ms: 2200 },
      { t: 'bgm', id: 'void', fade: 2600 },
      { t: 'sub', text: '—— 世 界 之 后 ——', ms: 2600, size: 26, y: 120 },
      { t: 'sub', text: '由于末日提前触发，连「抵抗」的机会都没有。', ms: 4000, y: 650 },
      { t: 'sub', text: '所有浮空都市在四小时内全部坠落。', ms: 3600, y: 650 },
      { t: 'sub', text: '没有幸存者。没有反抗。没有英雄。', ms: 4000, y: 650 },
      { t: 'wait', ms: 1400 },
      { t: 'sub', text: '某个幸存者在废墟中找到了他的尸体——保持着抬头看天的姿势。', ms: 4600, y: 650 },
      { t: 'sub', text: '表情是困惑，而不是恐惧。', ms: 3600, y: 650 },
      { t: 'sub', text: '他直到死，都没明白发生了什么。', ms: 4200, y: 650 },
      { t: 'wait', ms: 1200 },
      { t: 'unpaint', ms: 1800 },
      { t: 'bg', id: 'fall', fade: 2600 },
      { t: 'scanlines', a: 0 },
      { t: 'sub', text: '一片死寂的云海。偶尔飘过几块残骸。', ms: 3800, y: 650 },
      { t: 'sub', text: '一只鸟飞过——然后也坠落了。这个世界的空气，已经不适合生命了。', ms: 5000, y: 650 },
      { t: 'hold', ms: 3000, letterbox: true, keepBox: true },
      { t: 'stopBgm', ms: 2600 },
      { t: 'sub', text: '他甚至没来得及知道，自己做了什么。',
        ms: 6000, size: 27, y: 380, glow: 1, glowColor: '#FFB15E' },
      { t: 'black', a: 1, ms: 3000 }
    ]
  };

  /* ============================================================
     坏结局D · 被最终Boss说服，主角加入反派
     ============================================================ */
  E.badD = {
    id: 'badD', title: '他成为了他最不想成为的人', tag: 'BAD END  D', color: '#E0244A',
    sub: '他成为了他最不想成为的人。',
    steps: [
      { t: 'reset' },
      { t: 'clear' },
      { t: 'bg', id: 'core', fade: 900 },
      { t: 'bgm', id: 'boss6a', fade: 900, layers: { drums: false, arp: false } },
      { t: 'card', small: 'BAD  END  D', big: '你 说 得 对', ms: 2600 },
      { t: 'enter', who: 'savior', slot: 'right', emo: 'calm', flip: true, scale: 1.9 },
      { t: 'enter', who: 'hero', slot: 'left', emo: 'numb' },
      { t: 'say', who: 'savior', emo: 'calm', text: '你和我，{p:600}有什么不同？' },
      { t: 'say', who: 'savior', emo: 'calm', text: '你也失去了所有。' },
      { t: 'say', who: 'savior', emo: 'calm', text: '你也充满了恨。' },
      { t: 'say', who: 'savior', emo: 'anger', text: '你也{s}杀了你的朋友{/s}——' },
      { t: 'say', who: 'savior', emo: 'calm', text: '你凭什么审判我？' },
      { t: 'wait', ms: 1200 },
      { t: 'say', who: 'hero', emo: 'numb', text: '……' },
      { t: 'say', who: 'hero', emo: 'numb', text: '……我没有要审判你。' },
      { t: 'say', who: 'hero', emo: 'numb', text: '我只是……{p:900}好累。' },
      { t: 'closebox' },
      { t: 'par', steps: [
        [{ t: 'desat', a: .6, ms: 3000, wait: false }],
        [{ t: 'actor', who: 'hero', tintColor: '#1a3a5c', tintAmt: .7, ms: 3000, wait: false }]
      ] },
      { t: 'sub', text: '他放下了武器。', ms: 2600, y: 650 },
      { t: 'say', who: 'hero', emo: 'numb', text: '……你说得对。' },
      { t: 'say', who: 'hero', emo: 'numb', text: '这个世界……{p:800}不值得我救。' },
      { t: 'par', steps: [
        [{ t: 'actor', who: 'savior', emo: 'smile', ms: 600, wait: false }],
        [{ t: 'flash', color: '#E0244A', ms: 500, a: .4 }],
        [{ t: 'bgm', id: 'tyrant', fade: 1400 }]
      ] },
      { t: 'say', who: 'savior', emo: 'calm', text: '……欢迎回家。' },
      { t: 'closebox' },
      { t: 'par', steps: [
        [{ t: 'actor', who: 'hero', x: 780, ms: 3000, wait: false }],
        [{ t: 'actor', who: 'savior', x: 900, ms: 3000, wait: false }]
      ] },
      { t: 'sub', text: '两人的立绘并排。他的眼神从疲惫变为空洞，颜色从天蓝变为暗蓝。', ms: 4200, y: 650 },
      { t: 'hold', ms: 3000, letterbox: true, keepBox: true },
      { t: 'black', a: 1, ms: 2600 },
      { t: 'clear' },

      /* —— 世界之后：压抑、扭曲、「秩序」的恐怖 —— */
      { t: 'bg', id: 'tyrant', fade: 0 },
      { t: 'black', a: 0, ms: 2600 },
      { t: 'bgm', id: 'tyrant', fade: 2600 },
      { t: 'sub', text: '—— 世 界 之 后 ——', ms: 2600, size: 26, y: 120 },
      { t: 'paint', fn: 'tyrantScene', ms: 999999, keep: true, wait: false },
      { t: 'sub', text: '他们一起统治了残存的世界。一个「只有被抛弃者才能生存」的世界。', ms: 4800, y: 650 },
      { t: 'sub', text: '规则很简单：证明你被抛弃过，就能活下去。', ms: 4200, y: 650 },
      { t: 'sub', text: '于是所有人都开始伤害自己，好让自己看起来更可怜一点。', ms: 5000, y: 650 },
      { t: 'wait', ms: 1600 },
      { t: 'sub', text: 'TY 试图阻止他们。他失败了。', ms: 3600, y: 650 },
      { t: 'sub', text: '他被囚禁在核心的最底层，那里没有光，也没有纸笔。', ms: 4400, y: 650 },
      { t: 'sub', text: '他用指甲在墙上推演了整整三年。第四年，他停了。', ms: 4800, y: 650 },
      { t: 'wait', ms: 1800 },
      { t: 'sub', text: '他偶尔会想起老人，想起 TY，想起自己最初只想回家的愿望。', ms: 4800, y: 650 },
      { t: 'sub', text: '——但他已经不想起来了。', ms: 4000, y: 650 },
      { t: 'wait', ms: 1400 },
      { t: 'sub', text: '他独自站在浮空都市的最高点，看着脚下的云海。', ms: 4000, y: 650 },
      { t: 'sub', text: '他轻声说：「……晚安，我的救世主。」', ms: 4400, y: 650 },
      { t: 'sub', text: '这句话已经没有了感情。只是机械地重复。', ms: 4600, y: 650 },
      { t: 'hold', ms: 3000, letterbox: true, keepBox: true },
      { t: 'stopBgm', ms: 2600 },
      { t: 'sub', text: '他成为了他最不想成为的人。',
        ms: 6000, size: 27, y: 380, glow: 1, glowColor: '#E0244A' },
      { t: 'black', a: 1, ms: 3000 }
    ]
  };

  /* ============================================================
     坏结局E · 主角误杀 TY
     ============================================================ */
  E.badE = {
    id: 'badE', title: '他杀了他唯一的朋友', tag: 'BAD END  E', color: '#8FA8C0',
    sub: '他杀了他唯一的朋友。然后，他杀了自己。',
    steps: [
      { t: 'reset' },
      { t: 'clear' },
      { t: 'stopBgm', ms: 300 },
      { t: 'bg', id: 'core', fade: 500 },
      { t: 'grain', a: .8 },
      { t: 'card', small: 'BAD  END  E', big: '下 次 记 得 看 清', ms: 2600 },

      { t: 'enter', who: 'hero', slot: 'left', emo: 'broken' },
      { t: 'enter', who: 'ty', slot: 'right', emo: 'surprise', flip: true, decay: 4 },
      { t: 'par', steps: [
        [{ t: 'slowmo', scale: .1, ms: 3600 }],
        [{ t: 'letterbox', a: 1, ms: 500 }],
        [{ t: 'sfx', id: 'shoot' }]
      ] },
      { t: 'sub', text: '子弹穿透了他的胸口。', ms: 2600, y: 130, wait: false },
      /* 中弹反应必须和这句字幕同时发生。原先字幕是阻塞的，
         在 timeScale=.1 的慢放里等于「宣告他被打穿」之后 20 多秒他还站着没事。 */
      { t: 'par', steps: [
        [{ t: 'actor', who: 'ty', emo: 'pain', tintColor: '#ff2b3e', tintAmt: .5, ms: 500, wait: false }],
        [{ t: 'burst', x: 980, y: 392, color: '#ff2b3e', n: 30, spdMin: 1.2, spdMax: 5, gravity: .04, life: 520 }],
        [{ t: 'flash', color: '#ffffff', ms: 400, a: .8 }],
        [{ t: 'shake', p: 24, ms: 1000 }]
      ] },
      { t: 'wait', ms: 1200 },
      { t: 'actor', who: 'ty', y: 520, scale: 1.6, rot: .18, emo: 'numb', ms: 2200 },
      { t: 'sub', text: '他的眼神不是愤怒，而是困惑。', ms: 3000, y: 650 },
      { t: 'sub', text: '他推演了所有可能性——唯独没有推导出「他会杀我」。', ms: 4400, y: 650 },
      { t: 'actor', who: 'hero', x: 780, emo: 'broken', ms: 1400 },
      { t: 'say', who: 'hero', emo: 'broken', text: '{s}对不起……{p:300}对不起……{p:300}我不是故意的……{/s}' },
      { t: 'say', who: 'hero', emo: 'broken', text: '{s}我没看清！{p:300}我真的没看清！！{/s}' },
      { t: 'say', who: 'ty', emo: 'numb', decay: 4, text: '……没关系。' },
      { t: 'wait', ms: 900 },
      { t: 'say', who: 'ty', emo: 'sad', decay: 4, text: '……下次……{p:900}记得……{p:900}看清……' },
      { t: 'closebox' },
      { t: 'par', steps: [
        [{ t: 'motes', who: 'ty', color: '#E0E6ED', n: 34 }],
        [{ t: 'actor', who: 'ty', alpha: .3, ms: 3000, wait: false }],
        [{ t: 'stopBgm', ms: 1200 }]
      ] },
      { t: 'wait', ms: 1600 },
      { t: 'say', who: 'hero', emo: 'broken', text: '……回归。{p:400}回归。{p:400}我要回归——' },
      { t: 'par', steps: [
        [{ t: 'sfx', id: 'uiDeny' }],
        [{ t: 'glitch', ms: 800, p: .6 }]
      ] },
      { t: 'sub', text: '能力没有反应。', ms: 2600, y: 130 },
      { t: 'sub', text: '杀死「一起轮回的伙伴」，是能力的禁忌。它自我封印了。', ms: 4400, y: 650 },
      { t: 'say', who: 'hero', emo: 'numb', text: '……' },
      { t: 'closebox' },
      { t: 'par', steps: [
        [{ t: 'desat', a: 1, ms: 5000, wait: false }],
        [{ t: 'vignette', a: .8, ms: 5000 }],
        [{ t: 'actor', who: 'hero', emo: 'numb', y: 510, scale: 1.6, ms: 3000, wait: false }]
      ] },
      { t: 'wind', gain: .1 },
      { t: 'sub', text: '画面从彩色变为黑白。', ms: 3000, y: 650 },
      { t: 'hold', ms: 4000, letterbox: true, keepBox: true },
      { t: 'black', a: 1, ms: 3000 },
      { t: 'clear' }, { t: 'unpaint' },

      /* —— 世界之后：寂静、空白、什么都没有 —— */
      { t: 'bg', id: 'bone', fade: 0 },
      { t: 'desat', a: 1, ms: 0 },
      { t: 'black', a: 0, ms: 3000 },
      { t: 'sub', text: '—— 世 界 之 后 ——', ms: 2600, size: 26, y: 120 },
      { t: 'sub', text: '他抱着他的尸体，在废墟中游荡了九天。', ms: 4200, y: 650 },
      { t: 'sub', text: '他不吃饭。不喝水。不说话。', ms: 3800, y: 650 },
      { t: 'sub', text: '第十天，他在某个角落坐了下来，把他靠在自己肩上。', ms: 4600, y: 650 },
      { t: 'wait', ms: 1600 },
      { t: 'paint', fn: 'boneScene', ms: 999999, keep: true, wait: false },
      { t: 'sub', text: '世界毁灭。没有人来救他们。', ms: 4000, y: 650 },
      { t: 'wait', ms: 2200 },
      { t: 'sub', text: '两具靠在一起的白骨。一架锈迹斑斑的战机。', ms: 4400, y: 650 },
      { t: 'sub', text: '风吹过，带来远处浮空都市崩塌的声音。', ms: 4400, y: 650 },
      { t: 'hold', ms: 5000, letterbox: true, keepBox: true, wind: true },
      { t: 'sub', text: '他杀了他唯一的朋友。然后，他杀了自己。',
        ms: 6000, size: 27, y: 380, color: '#dfe6ee' },
      { t: 'wind', off: true, ms: 3000 },
      { t: 'black', a: 1, ms: 3400 }
    ]
  };

  /* ============================================================
     彩蛋 IF 结局 · 没有救世主的世界
     分三段：awaken（觉醒）→ 可操作决战 → after（新世界 + 星星 + 孩子）
     ============================================================ */
  E['if'] = {
    id: 'if', title: '愿意成为普通人的人', tag: 'SECRET  ·  IF LINE', color: '#FFE9A8',
    sub: '世界不需要救世主。世界需要的是，愿意成为普通人的人。',
    /* 第一段：主角与 TY 双双战死 → 正直的人觉醒 */
    steps: [
      { t: 'reset' },
      { t: 'clear' },
      { t: 'stopBgm', ms: 400 },
      { t: 'bg', id: 'core', fade: 900 },
      { t: 'grain', a: .8 },
      { t: 'vignette', a: .6, ms: 900 },
      { t: 'card', small: 'IF  LINE', big: '交 给 你 了', ms: 2800 },

      /* 主角与 TY 倒下 */
      { t: 'enter', who: 'hero', slot: 'left', emo: 'numb', ms: 1200, y: 500, scale: 1.6, rot: .12 },
      { t: 'enter', who: 'ty', slot: 'center', emo: 'numb', decay: 5, ms: 800, y: 510, scale: 1.5, rot: -.14 },
      { t: 'enter', who: 'upright', slot: 'right', emo: 'broken', flip: true, ms: 900 },
      { t: 'wind', gain: .1 },
      { t: 'sub', text: '主角和 TY 并肩作战。他们打到了最后一刻。', ms: 3800, y: 650 },
      { t: 'sub', text: '然后，两个人都倒下了。', ms: 3200, y: 650 },
      { t: 'say', who: 'upright', emo: 'broken', text: '{s}起来！{p:300}你们两个给我起来！！{/s}' },
      { t: 'say', who: 'hero', emo: 'numb', text: '……不行了。' },
      { t: 'say', who: 'hero', emo: 'sad', text: '这次……{p:600}回不去了。' },
      { t: 'say', who: 'upright', emo: 'broken', text: '你不是有那个能力吗！你不是——' },
      { t: 'say', who: 'hero', emo: 'sad', text: '存档点……{p:500}在他手里。' },
      { t: 'say', who: 'hero', emo: 'sad', text: '他把它……{p:600}捏碎了。' },
      { t: 'wait', ms: 1000 },
      { t: 'par', steps: [
        [{ t: 'zoom', z: 1.2, ms: 3000, cx: 320, cy: 420, wait: false }],
        [{ t: 'lines', list: [
          { who: 'hero', emo: 'determined', text: '……喂。' },
          { who: 'upright', emo: 'broken', text: '……' },
          { who: 'hero', emo: 'determined', text: '我从来没觉得自己是个英雄。' },
          { who: 'hero', emo: 'determined', text: '我怕高，怕疼，怕死，怕所有东西。' },
          { who: 'hero', emo: 'determined', text: '……但我一直在做我觉得对的事。' },
          { who: 'hero', emo: 'determined', text: '{c:#9ff0ff}……交给你了。{/c}' }
        ] }]
      ] },
      { t: 'par', steps: [
        [{ t: 'motes', who: 'hero', color: '#4FC3F7', n: 40 }],
        [{ t: 'actor', who: 'hero', alpha: 0, ms: 3000, wait: false }],
        [{ t: 'sfx', id: 'shatter' }]
      ] },
      { t: 'kill', who: 'hero' },
      { t: 'zoom', z: 1, ms: 1400, wait: false },
      { t: 'wait', ms: 1200 },

      /* TY 的最后一个公式 */
      { t: 'par', steps: [
        [{ t: 'zoom', z: 1.2, ms: 3000, cx: 640, cy: 430, wait: false }],
        [{ t: 'paint', fn: 'tyAlone', ms: 8000, wait: false }],
        [{ t: 'lines', list: [
          { who: 'ty', emo: 'cold', decay: 5, text: '……听着。' },
          { who: 'ty', emo: 'cold', decay: 5, text: '他的核心在第三节律的第七拍打开 0.4 秒。' },
          { who: 'ty', emo: 'sharp', decay: 5, text: '这个……{p:500}可以打败他。' },
          { who: 'ty', emo: 'cold', decay: 5, text: '但你需要……{p:800}力量。' },
          { who: 'upright', emo: 'broken', text: '……我没有力量。' },
          { who: 'ty', emo: 'sad', decay: 5, text: '……你有。' },
          { who: 'ty', emo: 'cold', decay: 5, text: '我算过。{p:600}4,096 条分支里，有一条不需要我们。' },
          { who: 'ty', emo: 'determined', decay: 5, text: '那一条里……{p:700}是你。' }
        ] }]
      ] },
      { t: 'par', steps: [
        [{ t: 'motes', who: 'ty', color: '#E0E6ED', n: 40 }],
        [{ t: 'actor', who: 'ty', alpha: 0, ms: 3400, wait: false }],
        [{ t: 'sfx', id: 'shatter' }],
        [{ t: 'stopBgm', ms: 1600 }]
      ] },
      { t: 'kill', who: 'ty' },
      { t: 'zoom', z: 1, ms: 1400, wait: false },
      { t: 'hold', ms: 3400, letterbox: true, keepBox: true },
      { t: 'wind', off: true, ms: 1800 },

      /* Boss 嘲笑 */
      { t: 'clear' },
      { t: 'enter', who: 'savior', slot: 'right', emo: 'smile', flip: true, scale: 1.9 },
      { t: 'enter', who: 'upright', slot: 'left', emo: 'numb' },
      { t: 'bgm', id: 'boss6c', fade: 900, layers: { lead: false } },
      { t: 'say', who: 'savior', emo: 'smile', text: '你？' },
      { t: 'say', who: 'savior', emo: 'anger',
        text: '一个没有背景的普通人？{p:500}你以为你能做什么？' },
      { t: 'say', who: 'upright', emo: 'numb', text: '……' },
      { t: 'wait', ms: 1200 },

      /* —— 觉醒 —— */
      { t: 'closebox' },
      { t: 'par', steps: [
        [{ t: 'zoom', z: 1.16, ms: 4000, cx: 300, cy: 340, wait: false }],
        [{ t: 'actor', who: 'upright', emo: 'determined', ms: 900, wait: false }]
      ] },
      { t: 'sub', text: '他抬起手，摘下了护目镜边缘那个被磨损、被遮挡了二十年的配饰。', ms: 4400, y: 650 },
      { t: 'par', steps: [
        [{ t: 'paint', fn: 'emblemAwake', ms: 4000, data: { x: 300, y: 300 }, layer: 'over', wait: false }],
        [{ t: 'actor', who: 'upright', emblemGlow: 1, ms: 2000, wait: false }],
        [{ t: 'sfx', id: 'charge' }],
        [{ t: 'flash', color: '#ffe9a8', ms: 900, a: .7 }]
      ] },
      { t: 'say', who: 'savior', emo: 'surprise', text: '这股力量……{p:600}你是……{p:400}那个家族的人？！' },
      { t: 'say', who: 'upright', emo: 'determined', text: '我不是没有背景。' },
      { t: 'say', who: 'upright', emo: 'determined', text: '我是{c:#ffe9a8}选择不用{/c}背景。' },
      { t: 'say', who: 'upright', emo: 'determined',
        text: '但今天……{p:800}为了那些已经死去的人……{p:600}我破例。' },
      { t: 'closebox' },
      { t: 'par', steps: [
        [{ t: 'zoom', z: 1, ms: 2000, wait: false }],
        [{ t: 'actor', who: 'upright', alt: 1, auraColor: '#FFE9A8', auraPower: 1.6,
           emblemGlow: 1, ms: 2600, wait: false }],
        [{ t: 'bgm', id: 'ifline', fade: 1800 }],
        [{ t: 'paint', fn: 'lightRain', ms: 6000, keep: true, layer: 'over', a: .8, wait: false }]
      ] },
      { t: 'say', who: 'upright', emo: 'determined',
        text: '我今天不是以家族的名义战斗。{p:600}我是以{c:#ffe9a8}我自己的名义{/c}——' },
      { t: 'say', who: 'upright', emo: 'determined', text: '以一个想要保护朋友的名义。' },
      { t: 'wait', ms: 900 },
      { t: 'sub', text: '他的战机被金色的能量包裹。弹幕变成了纯白色的光之雨。', ms: 4000, y: 650 },
      { t: 'sub', text: '每一发子弹，都代表着一个牺牲者的意志。', ms: 4000, y: 650 },
      { t: 'unpaint', ms: 1400 }
    ],

    /* 第三段：战后 —— 新世界 + 星星 + 孩子 */
    after: [
      { t: 'reset' },
      { t: 'clear' },
      { t: 'bg', id: 'core', fade: 600 },
      { t: 'bgm', id: 'ifline', fade: 1200, layers: { drums: false, arp: false } },
      { t: 'enter', who: 'upright', slot: 'center', emo: 'pain', alt: 1,
        auraColor: '#FFE9A8', auraPower: .6, emblemGlow: 1, ms: 1200 },
      { t: 'sub', text: '最终Boss 被击败了。', ms: 2800, y: 650 },
      { t: 'sub', text: '但他也付出了代价——他的身体开始崩解。', ms: 3800, y: 650 },
      { t: 'par', steps: [
        [{ t: 'actor', who: 'upright', crack: 1, ms: 2400, wait: false }],
        [{ t: 'glitch', ms: 1400, p: .5 }],
        [{ t: 'shake', p: 12, ms: 1800 }]
      ] },
      { t: 'say', who: 'upright', emo: 'pain', text: '……原来是这个感觉。' },
      { t: 'say', who: 'upright', emo: 'pain', text: '难怪族里那个人会疯。{p:600}这股力量……{p:500}它在吃我。' },
      { t: 'say', who: 'upright', emo: 'determined', text: '……不行。{p:600}我还不能变成别人。' },
      { t: 'par', steps: [
        [{ t: 'sfx', id: 'shatter' }],
        [{ t: 'flash', color: '#ffe9a8', ms: 900, a: .8 }],
        [{ t: 'actor', who: 'upright', alt: 0, auraPower: 0, emblemGlow: 0, crack: 0, ms: 2600, wait: false }]
      ] },
      { t: 'sub', text: '他把力量全部推了出去。一次性、彻底、永远地。', ms: 4200, y: 650 },
      { t: 'say', who: 'upright', emo: 'numb', text: '……我把它扔掉了。' },
      { t: 'say', who: 'upright', emo: 'sad', text: '这样，就没有第二个我，会被它吃掉了。' },
      { t: 'hold', ms: 3000, letterbox: true, keepBox: true },
      { t: 'black', a: 1, ms: 2600 },
      { t: 'clear' },

      /* —— 新世界 —— */
      { t: 'bg', id: 'newcity', fade: 0 },
      { t: 'paint', fn: 'newPlaza', ms: 999999, keep: true, wait: false },
      { t: 'black', a: 0, ms: 3000 },
      { t: 'bgm', id: 'hope', fade: 3000 },
      { t: 'grain', a: .3 }, { t: 'vignette', a: .2, ms: 1400 },
      { t: 'sub', text: '—— 很 多 年 后 ——', ms: 3000, size: 26, y: 120 },
      { t: 'sub', text: '一片崭新的浮空都市。没有霓虹的奢靡，没有废墟的破败。', ms: 4400, y: 650 },
      { t: 'sub', text: '只是朴素，但充满希望的建筑。', ms: 3600, y: 650 },
      { t: 'wait', ms: 1200 },
      { t: 'sub', text: '他站在广场上，身边围绕着普通人——士兵、工匠、孩子。', ms: 4400, y: 650 },
      { t: 'sub', text: '他没有坐在王座上。他站在人群中间。', ms: 4000, y: 650 },
      { t: 'enter', who: 'upright', slot: 'left', emo: 'calm', from: 'fade', ms: 2000, scale: 1.7, y: 500 },
      { t: 'enter', who: 'child', slot: 'right', emo: 'smile', flip: true, from: 'below', ms: 1400, scale: 1.7, y: 500 },
      { t: 'wait', ms: 900 },

      { t: 'say', who: 'child', emo: 'smile', text: '爷爷，听说以前有个救世主？' },
      { t: 'say', who: 'upright', emo: 'calm', text: '有。' },
      { t: 'say', who: 'upright', emo: 'calm', text: '不止一个。' },
      { t: 'say', who: 'upright', emo: 'sad',
        text: '有从远方来的，{p:400}有超级聪明的，{p:400}有运气好的，{p:400}有总是笑的……' },
      { t: 'say', who: 'child', emo: 'smile', text: '那他们现在在哪里？' },
      { t: 'wait', ms: 1600 },
      { t: 'say', who: 'upright', emo: 'sad', text: '……' },
      { t: 'wait', ms: 1400 },

      /* —— 拉升到星空 —— */
      { t: 'par', steps: [
        [{ t: 'say', who: 'upright', emo: 'calm', text: '……他们变成了星星。' }],
        [{ t: 'cam', y: -180, ms: 5000, wait: false }]
      ] },
      { t: 'closebox' },
      { t: 'par', steps: [
        [{ t: 'bg', id: 'starry', fade: 5000 }],
        [{ t: 'actor', who: 'upright', alpha: 0, ms: 3400, wait: false }],
        [{ t: 'actor', who: 'child', alpha: 0, ms: 3400, wait: false }],
        [{ t: 'unpaint', fn: 'newPlaza', ms: 3400, wait: false }]
      ] },
      { t: 'clear' },
      { t: 'paint', fn: 'starsSky', ms: 999999, keep: true, wait: false },
      { t: 'wait', ms: 3400 },
      { t: 'sub', text: '天空中有几颗特别亮的星星。', ms: 3600, y: 640 },
      { t: 'sub', text: '每一颗的颜色，都对应着一个再也回不来的人。', ms: 4400, y: 640 },
      { t: 'wait', ms: 3000 },
      { t: 'sub', text: '……还有最后一颗。', ms: 3000, y: 640 },
      { t: 'sub', text: '它在闪烁。', ms: 3000, y: 640 },
      { t: 'sub', text: '因为它还活着，还在守护。', ms: 4000, y: 640 },
      { t: 'wait', ms: 2400 },
      { t: 'sub', text: '他偶尔会想——「他们本可以活下来的。」', ms: 4200, y: 640 },
      { t: 'sub', text: '「如果他们知道，即使没有他们，世界也能得救……他们会不会不那么拼命？」', ms: 5400, y: 640 },
      { t: 'sub', text: '但他也知道：正是因为他们拼命了，他才有机会站在这里。', ms: 5200, y: 640 },
      { t: 'wait', ms: 2600 },
      { t: 'letterbox', a: 1, ms: 2600 },
      { t: 'sub', text: '世界不需要救世主。',
        ms: 4400, size: 30, y: 330, glow: 1, glowColor: '#FFE9A8', box: false },
      { t: 'sub', text: '世界需要的是，愿意成为普通人的人。',
        ms: 7000, size: 30, y: 380, glow: 1, glowColor: '#FFE9A8', box: false },
      { t: 'wait', ms: 1800 },
      { t: 'stopBgm', ms: 4000 },
      { t: 'black', a: 1, ms: 4000 }
    ]
  };

  E.order = ['good', 'if', 'badA', 'badB', 'badC', 'badD', 'badE'];

})(window);
