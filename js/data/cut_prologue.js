/* ===========================================================
   cut_prologue.js — 序章「坠落与相遇」+ 第一章「轮回与TY」
   =========================================================== */
(function (root) {
  'use strict';
  var G = root.G;
  var CS = G.Cutscenes = G.Cutscenes || {};

  /* ============================================================
     序章 · 节拍1  穿越
     ============================================================ */
  CS.p_open = [
    { t: 'reset' },
    { t: 'bg', id: 'camp', fade: 0 },
    { t: 'black', a: 1, ms: 0, wait: false },
    { t: 'bgm', id: 'grief', fade: 2600 },
    { t: 'vignette', a: .5, ms: 0 },
    { t: 'grain', a: .7 },
    { t: 'wait', ms: 700 },
    { t: 'sub', text: '——不知道是哪一天。也不知道，这是哪里。', ms: 2600 },
    { t: 'black', a: 0, ms: 2400 },
    { t: 'wait', ms: 300 },

    { t: 'card', small: 'PROLOGUE  ·  序章', big: '坠落与相遇', ms: 2400 },

    { t: 'enter', who: 'hero', slot: 'center', from: 'below', emo: 'fear', ms: 900 },
    { t: 'wait', ms: 500 },
    { t: 'say', who: 'hero', emo: 'surprise', text: '……这、这是哪里？' },
    { t: 'par', steps: [
      [{ t: 'cam', x: -90, ms: 2600, wait: false }],
      [{ t: 'say', who: 'hero', emo: 'fear', text: '天上……有岛？{p:400}地面呢？{p:300}地面在哪里？！' }]
    ] },
    { t: 'say', who: 'hero', emo: 'fear',
      text: '我记得……我昨天还在加班。{p:500}我记得我坐了末班车。{p:600}我记得……我躺下了……' },
    { t: 'shake', p: 8, ms: 400 },
    { t: 'say', who: 'hero', emo: 'broken', text: '{s}这是什么鬼地方啊！！{/s}' },
    { t: 'wait', ms: 400 },
    { t: 'say', who: 'hero', emo: 'fear', text: '……不行不行，冷静，冷静。{p:400}肯定是梦。{p:300}捏一下就……' },
    { t: 'sfx', id: 'uiDeny' },
    { t: 'say', who: 'hero', emo: 'pain', text: '{s}疼！！{/s}' },
    { t: 'say', who: 'hero', emo: 'sad', text: '……疼。{p:800}真的疼。' },
    { t: 'wait', ms: 600 },
    /* 远处引擎声 */
    { t: 'sfx', id: 'warn' },
    { t: 'say', who: 'hero', emo: 'surprise', text: '……有声音？' },
    { t: 'par', steps: [
      [{ t: 'paint', fn: 'raidPlanes', ms: 4200, a: .5, wait: false }],
      [{ t: 'say', who: 'hero', emo: 'fear', text: '有人！{p:300}不对……{p:300}那是飞机？' },
       { t: 'say', who: 'hero', emo: 'fear', text: '……我该躲起来。{p:400}对，躲起来最安全。' }]
    ] },
    { t: 'closebox' },
    { t: 'paint', fn: 'hideCorner', ms: 2000, keep: true, layer: 'over' },
    { t: 'actor', who: 'hero', emo: 'fear', scale: 1.6, y: 470, ms: 700 },
    { t: 'wait', ms: 1200 },
    { t: 'unpaint', fn: 'hideCorner', ms: 900 },
    { t: 'actor', who: 'hero', scale: 1.95, y: 432, ms: 600 }
  ];

  /* ============================================================
     序章 · 节拍2  遇见老人
     ============================================================ */
  CS.p_meet_oldman = [
    { t: 'bg', id: 'camp', fade: 500 },
    { t: 'bgm', id: 'camp', fade: 1400 },
    { t: 'clear' },
    { t: 'enter', who: 'hero', slot: 'right', emo: 'fear', flip: true },
    { t: 'wait', ms: 300 },
    { t: 'enter', who: 'oldman', slot: 'left', from: 'left', emo: 'calm' },
    { t: 'say', who: 'oldman', emo: 'calm', text: '喂。{p:600}箱子后面那个。' },
    { t: 'say', who: 'hero', emo: 'surprise', text: '！！' },
    { t: 'say', who: 'oldman', emo: 'calm', text: '抖成那样，还不如站出来。{p:400}我这把年纪，眼神差，但耳朵好。' },
    { t: 'say', who: 'hero', emo: 'fear', text: '我、我不是坏人！我什么都没做！我只是……只是……' },
    { t: 'say', who: 'oldman', emo: 'calm', text: '哪来的？' },
    { t: 'say', who: 'hero', emo: 'fear', text: '……说了你也不信。' },
    { t: 'say', who: 'oldman', emo: 'half', text: '试试。' },
    { t: 'say', who: 'hero', emo: 'sad', text: '……另一个世界。{p:600}我不知道怎么来的。{p:400}我只想回去。' },
    { t: 'wait', ms: 700 },
    { t: 'say', who: 'oldman', emo: 'calm', text: '……' },
    { t: 'say', who: 'oldman', emo: 'calm', text: '（这小子的鞋。{p:300}这世上没人做这种鞋。）', nameOverride: '' },
    { t: 'say', who: 'oldman', emo: 'calm', text: '行了。跟我走。' },
    { t: 'say', who: 'hero', emo: 'surprise', text: '……你信？' },
    { t: 'say', who: 'oldman', emo: 'half',
      text: '我不信。{p:500}但你饿着肚子在我地盘上抖，看着晦气。' },
    { t: 'say', who: 'oldman', emo: 'calm', text: '这地方叫「锈港」。{p:400}我这有汤，有床，有一架不会飞的破飞机。' },
    { t: 'say', who: 'hero', emo: 'fear', text: '……谢、谢谢……' },
    { t: 'say', who: 'oldman', emo: 'calm', text: '别谢。{p:400}谢来谢去的，最后都要还。' },
    { t: 'codex', id: 'oldman' },
    { t: 'codex', id: 'hero' },
    { t: 'learn', k: 'rustport', label: '锈港 —— 老人的营地' }
  ];

  /* ============================================================
     序章 · 节拍3  意外获得能力
     ============================================================ */
  CS.p_get_power = [
    { t: 'bg', id: 'ruins', fade: 900 },
    { t: 'bgm', id: 'ruins', fade: 1200, layers: { lead: false, drums: false } },
    { t: 'clear' },
    { t: 'enter', who: 'oldman', slot: 'left', emo: 'calm' },
    { t: 'enter', who: 'hero', slot: 'right', emo: 'fear', flip: true },
    { t: 'say', who: 'oldman', emo: 'calm', text: '别磨蹭。{p:300}这片废墟底下有旧时代的东西，能换饭钱。' },
    { t: 'say', who: 'hero', emo: 'fear', text: '这里……看着不太安全……' },
    { t: 'say', who: 'oldman', emo: 'half', text: '哪里安全？{p:400}天上掉岛的世界，你告诉我哪里安全。' },
    { t: 'wait', ms: 400 },
    { t: 'say', who: 'hero', emo: 'surprise', text: '……那是什么？' },
    { t: 'closebox' },
    { t: 'par', steps: [
      [{ t: 'actor', who: 'hero', dim: .3, ms: 600, wait: false },
       { t: 'actor', who: 'oldman', dim: .3, ms: 600, wait: false }],
      [{ t: 'paint', fn: 'runeAwaken', ms: 3600, keep: true, wait: false },
       { t: 'sfx', id: 'charge' },
       { t: 'wait', ms: 1800 }]
    ] },
    { t: 'say', who: 'oldman', emo: 'surprise', text: '……退后。{p:300}那东西还醒着。' },
    { t: 'say', who: 'hero', emo: 'fear', text: '我、我没碰它！我发誓我没——' },
    { t: 'par', steps: [
      [{ t: 'flash', color: '#dff4ff', ms: 500, a: 1 }],
      [{ t: 'shake', p: 22, ms: 900 }],
      [{ t: 'sfx', id: 'bomb' }],
      [{ t: 'glitch', ms: 900, p: 1 }]
    ] },
    { t: 'actor', who: 'hero', distort: 1, ms: 200 },
    { t: 'actor', who: 'oldman', distort: 1, ms: 200 },
    { t: 'wait', ms: 800 },
    { t: 'unpaint', fn: 'runeAwaken', ms: 1200 },
    { t: 'actor', who: 'hero', distort: 0, dim: 0, ms: 900 },
    { t: 'actor', who: 'oldman', distort: 0, dim: 0, ms: 900 },
    { t: 'say', who: 'hero', emo: 'pain', text: '……唔……{p:500}头、头好痛……' },
    { t: 'say', who: 'oldman', emo: 'surprise', text: '你还站着？' },
    { t: 'say', who: 'oldman', emo: 'calm', text: '刚才那一下，{p:300}我看见了。' },
    { t: 'say', who: 'hero', emo: 'fear', text: '看见什么？' },
    { t: 'say', who: 'oldman', emo: 'calm',
      text: '看见我自己死了。{p:700}然后又活了。{p:700}……然后又死了。' },
    { t: 'say', who: 'oldman', emo: 'calm', text: '一共十七次。' },
    { t: 'say', who: 'hero', emo: 'surprise', text: '什、什么？！' },
    { t: 'say', who: 'oldman', emo: 'half', text: '而你，一次都没死。' },
    { t: 'wait', ms: 500 },
    { t: 'say', who: 'oldman', emo: 'calm',
      text: '……这东西选了你，小子。{p:600}它把「回头」的钥匙，挂在了你脖子上。' },
    { t: 'say', who: 'hero', emo: 'fear', text: '我不要！{p:300}我什么都不要！我只想回家！' },
    { t: 'say', who: 'oldman', emo: 'sad', text: '我知道。{p:800}我知道。' },
    { t: 'flag', k: 'gotPower' },
    { t: 'learn', k: 'power_origin', label: '死亡回归 —— 来自遗迹，绑定在我身上' },
    { t: 'sub', text: '「死亡回归」：死亡后，时间回溯到存档点。你可以指定一个人——只要你带走了他的一部分血肉——与你一同保留记忆。',
      ms: 4600, size: 18, y: 660 }
  ];

  /* ============================================================
     序章 · 节拍4  日常
     ============================================================ */
  CS.p_daily = [
    { t: 'bg', id: 'camp', fade: 700 },
    { t: 'bgm', id: 'camp', fade: 1200 },
    { t: 'clear' },
    { t: 'enter', who: 'oldman', slot: 'left', emo: 'anger' },
    { t: 'enter', who: 'hero', slot: 'right', emo: 'fear', flip: true },
    { t: 'say', who: 'oldman', emo: 'anger', text: '手！{p:200}左手！{p:200}我说左手！' },
    { t: 'say', who: 'hero', emo: 'fear', text: '这、这是左手啊——' },
    { t: 'say', who: 'oldman', emo: 'anger', text: '那是右手！{p:400}你连左右都分不清，还想开飞机？' },
    { t: 'say', who: 'hero', emo: 'sad', text: '我又没想开飞机……' },
    { t: 'say', who: 'oldman', emo: 'anger',
      text: '这世上没有「不想」这回事。{p:400}天塌下来的时候，飞机是唯一的地面。' },
    { t: 'say', who: 'hero', emo: 'fear', text: '……我怕高。' },
    { t: 'say', who: 'oldman', emo: 'calm', text: '……' },
    { t: 'say', who: 'oldman', emo: 'half', text: '怕高的人开飞机，飞得最稳。' },
    { t: 'say', who: 'hero', emo: 'surprise', text: '为什么？' },
    { t: 'say', who: 'oldman', emo: 'calm', text: '因为他不敢乱动。' },
    { t: 'wait', ms: 600 },
    { t: 'say', who: 'oldman', emo: 'calm', text: '听着，小子。我只教你一句话。' },
    { t: 'par', steps: [
      [{ t: 'zoom', z: 1.12, ms: 1400, cx: 300, cy: 340, wait: false }],
      [{ t: 'say', who: 'oldman', emo: 'determined',
         text: '{c:#ffd479}害怕不丢人。{p:600}丢人的是害怕了就跑。{/c}' }]
    ] },
    { t: 'zoom', z: 1, ms: 900 },
    { t: 'say', who: 'hero', emo: 'sad', text: '……那如果，跑了才能活呢？' },
    { t: 'say', who: 'oldman', emo: 'half',
      text: '那就跑。{p:600}然后活着回来，把该做的事做完。' },
    { t: 'say', who: 'oldman', emo: 'calm', text: '……你不需要变成英雄。' },
    { t: 'learn', k: 'oldman_creed', label: '老人的话 —— 害怕不丢人，丢人的是害怕了就跑' },
    { t: 'say', who: 'hero', emo: 'calm', text: '……嗯。' }
  ];

  /* ============================================================
     序章 · 节拍5-6  异变 + 老人之死（核心演出）
     ============================================================ */
  CS.p_oldman_death = [
    { t: 'bg', id: 'camp', fade: 400 },
    { t: 'clear' },
    { t: 'enter', who: 'oldman', slot: 'left', emo: 'calm' },
    { t: 'enter', who: 'hero', slot: 'right', emo: 'calm', flip: true },
    { t: 'say', who: 'hero', emo: 'calm', text: '……老爷子。{p:400}那个能力，我是不是不该有？' },
    { t: 'say', who: 'oldman', emo: 'calm', text: '该不该，不是你说了算的。' },

    /* —— 警报 —— */
    { t: 'par', steps: [
      [{ t: 'sfx', id: 'alarm' }],
      [{ t: 'redEdge', a: 1, ms: 600 }],
      [{ t: 'paint', fn: 'alarmLights', ms: 20000, keep: true, wait: false }],
      [{ t: 'paint', fn: 'raidPlanes', ms: 20000, keep: true, wait: false }],
      [{ t: 'bgm', id: 'dread', fade: 300 }],
      [{ t: 'shake', p: 14, ms: 800 }]
    ] },
    { t: 'say', who: 'oldman', emo: 'surprise', text: '——趴下！' },
    { t: 'say', who: 'hero', emo: 'fear', text: '什、什么？！那是什么？！' },
    { t: 'say', who: 'oldman', emo: 'anger', text: '教团的追猎队。{p:400}他们来得比我算的早。' },
    { t: 'say', who: 'hero', emo: 'fear', text: '他们、他们来抓谁？' },
    { t: 'say', who: 'oldman', emo: 'sad', text: '……你说呢。' },
    { t: 'shake', p: 18, ms: 600 },
    { t: 'say', who: 'hero', emo: 'broken', text: '{s}是因为我？！{p:400}是因为我对不对？！{/s}' },
    { t: 'say', who: 'oldman', emo: 'calm', text: '闭嘴。{p:400}往机库跑。' },
    { t: 'say', who: 'hero', emo: 'fear', text: '你呢？！' },
    { t: 'say', who: 'oldman', emo: 'half', text: '我年纪大了，跑不快。' },

    /* —— 致命一击：超慢镜头 —— */
    { t: 'closebox' },
    { t: 'par', steps: [
      [{ t: 'sfx', id: 'warn' }],
      [{ t: 'slowmo', scale: .12, ms: 3800 }],
      [{ t: 'letterbox', a: 1, ms: 400 }],
      [{ t: 'zoom', z: 1.22, ms: 2400, cx: 400, cy: 340, wait: false }]
    ] },
    { t: 'wait', ms: 400 },
    /* 老人推开主角 */
    { t: 'par', steps: [
      [{ t: 'actor', who: 'oldman', x: 470, emo: 'determined', ms: 500, wait: false }],
      [{ t: 'actor', who: 'hero', x: 1080, emo: 'surprise', ms: 700, wait: false }]
    ] },
    { t: 'wait', ms: 500 },
    { t: 'par', steps: [
      [{ t: 'paint', fn: 'pierceBeam', ms: 2400, data: { x: 470, y: 330 }, layer: 'over', wait: false }],
      [{ t: 'flash', color: '#ffe9c0', ms: 700, a: .9 }],
      [{ t: 'sfx', id: 'laser' }],
      [{ t: 'shake', p: 26, ms: 1200 }],
      [{ t: 'actor', who: 'oldman', emo: 'pain', tintColor: '#e8e4dc', tintAmt: .85, ms: 1600, wait: false }]
    ] },
    { t: 'wait', ms: 1400 },
    { t: 'zoom', z: 1, ms: 1200, wait: false },
    { t: 'stopBgm', ms: 600 },
    { t: 'par', steps: [
      [{ t: 'actor', who: 'oldman', y: 520, scale: 1.6, rot: .12, emo: 'numb', ms: 1600, wait: false }],
      [{ t: 'paint', fn: 'bloodPool', ms: 3000, keep: true, data: { x: 470, y: 545 }, wait: false }]
    ] },
    { t: 'actor', who: 'hero', x: 640, emo: 'broken', ms: 900 },
    { t: 'wind' },
    { t: 'say', who: 'hero', emo: 'broken', text: '{s}老爷子——！！{/s}' },
    { t: 'say', who: 'oldman', emo: 'numb', text: '……吵。' },
    { t: 'say', who: 'hero', emo: 'broken', text: '{s}我去找药！这里肯定有药！你等我——{/s}' },
    { t: 'say', who: 'oldman', emo: 'sad', text: '……小子。' },
    { t: 'par', steps: [
      [{ t: 'zoom', z: 1.18, ms: 2000, cx: 470, cy: 420, wait: false }],
      [{ t: 'lines', list: [
        { who: 'oldman', emo: 'calm', text: '你不需要变成英雄……' },
        { who: 'oldman', emo: 'calm', text: '你只需要……{p:900}做你自己觉得对的事……' }
      ] }]
    ] },
    { t: 'say', who: 'hero', emo: 'broken', text: '{s}我觉得对的事就是你活着！！{/s}' },
    { t: 'say', who: 'oldman', emo: 'half', text: '……那你，{p:600}可有的忙了。' },
    { t: 'wait', ms: 900 },
    /* 碎裂成光点 */
    { t: 'par', steps: [
      [{ t: 'shatter', who: 'oldman', color: '#c8c4bc', n: 64, ms: 1400, wait: false }],
      [{ t: 'motes', who: 'oldman', color: '#e8e4dc', n: 40 }],
      [{ t: 'sfx', id: 'shatter' }]
    ] },
    { t: 'kill', who: 'oldman' },
    { t: 'sanity', n: -10 },
    { t: 'flag', k: 'oldmanDead' },
    { t: 'wait', ms: 800 },

    /* 暖黄 → 冷蓝，持续3秒 */
    { t: 'par', steps: [
      [{ t: 'tint', color: '#1a3a6a', a: .34, ms: 900 }],
      [{ t: 'desat', a: .55, ms: 1200, wait: false }],
      [{ t: 'redEdge', a: 0, ms: 900 }],
      [{ t: 'unpaint', fn: 'alarmLights', ms: 1400, wait: false }],
      [{ t: 'unpaint', fn: 'raidPlanes', ms: 1400, wait: false }]
    ] },
    { t: 'wait', ms: 3000 },

    /* 主角低头，肩膀颤抖，无声5秒 */
    { t: 'closebox' },
    { t: 'actor', who: 'hero', emo: 'sad', x: 640, scale: 1.8, ms: 900 },
    { t: 'hold', ms: 5000, letterbox: true, keepBox: true },
    { t: 'wind', off: true, ms: 1400 }
  ];

  /* ============================================================
     序章 · 节拍6b-7  第一次主动使用死亡回归
     ============================================================ */
  CS.p_first_return = [
    { t: 'say', who: 'hero', emo: 'numb', text: '……' },
    { t: 'say', who: 'hero', emo: 'numb', text: '……回头的钥匙。' },
    { t: 'say', who: 'hero', emo: 'fear', text: '他说……它把回头的钥匙挂在我脖子上。' },
    { t: 'say', who: 'hero', emo: 'broken', text: '{s}那就回头啊！！{/s}' },
    { t: 'closebox' },
    /* 颤抖着伸手，触碰血迹 */
    { t: 'par', steps: [
      [{ t: 'zoom', z: 1.3, ms: 1800, cx: 500, cy: 520, wait: false }],
      [{ t: 'actor', who: 'hero', emo: 'pain', ms: 600, wait: false }],
      [{ t: 'sfx', id: 'heartbeat' }],
      [{ t: 'wait', ms: 900 }, { t: 'sfx', id: 'heartbeat' }]
    ] },
    { t: 'wait', ms: 700 },
    /* 触碰 → 时间倒流 */
    { t: 'par', steps: [
      [{ t: 'sfx', id: 'rewind' }],
      [{ t: 'flash', color: '#dff4ff', ms: 400, a: 1 }],
      [{ t: 'glitch', ms: 2600, p: 1 }],
      [{ t: 'paint', fn: 'rewindRings', ms: 3400, layer: 'over', wait: false }],
      [{ t: 'actor', who: 'hero', distort: 1, crack: 1, ms: 500, wait: false }],
      [{ t: 'shake', p: 20, ms: 2600 }],
      [{ t: 'desat', a: 0, ms: 1400, wait: false }],
      [{ t: 'tint', color: '#9fd8ff', a: .5, ms: 1200 }]
    ] },
    { t: 'wait', ms: 900 },
    /* 立绘碎裂成无数碎片，每片反射老人死去的画面 */
    { t: 'par', steps: [
      [{ t: 'shatter', who: 'hero', color: '#4FC3F7', n: 90, ms: 1200, keep: true, wait: false }],
      [{ t: 'zoom', z: 1.5, ms: 1400, wait: false }]
    ] },
    { t: 'wait', ms: 1200 },
    { t: 'black', a: 1, ms: 600 },
    { t: 'clear' },
    { t: 'unpaint' },
    { t: 'reset' },
    { t: 'wait', ms: 900 },
    /* 重组 */
    { t: 'bg', id: 'camp', fade: 0 },
    { t: 'zoom', z: 1, ms: 0 },
    { t: 'enter', who: 'hero', slot: 'center', emo: 'fear', from: 'fade', ms: 300, wait: false },
    { t: 'par', steps: [
      [{ t: 'black', a: 0, ms: 1400 }],
      [{ t: 'flash', color: '#ffffff', ms: 700, a: .8 }],
      [{ t: 'sfx', id: 'glitch', arg: 6 }]
    ] },
    { t: 'bgm', id: 'camp', fade: 2200 },
    { t: 'wait', ms: 600 },
    { t: 'say', who: 'hero', emo: 'pain', text: '哈……{p:300}哈啊……{p:400}呼……' },
    { t: 'say', who: 'hero', emo: 'surprise', text: '我……{p:800}回来了？' },
    { t: 'closebox' },
    { t: 'par', steps: [
      [{ t: 'zoom', z: 1.2, ms: 1600, cx: 640, cy: 320, wait: false }],
      [{ t: 'actor', who: 'hero', emo: 'broken', ms: 800, wait: false }],
      [{ t: 'wait', ms: 1000 }]
    ] },
    { t: 'say', who: 'hero', emo: 'broken', text: '{s}我回来了……！{/s}' },
    { t: 'say', who: 'hero', emo: 'fear', text: '还有时间！{p:300}还有时间！这次我一定——' },
    { t: 'zoom', z: 1, ms: 900 },
    { t: 'call', fn: function () { G.St.applyReturn(); } },
    { t: 'learn', k: 'return_works', label: '死亡回归确实有效 —— 我回到了几分钟前' }
  ];

  /* ============================================================
     序章 · 节拍8  再次面对 —— 注定的悲剧
     ============================================================ */
  CS.p_again = [
    { t: 'bg', id: 'camp', fade: 300 },
    { t: 'clear' },
    { t: 'enter', who: 'oldman', slot: 'left', emo: 'calm' },
    { t: 'enter', who: 'hero', slot: 'right', emo: 'fear', flip: true },
    { t: 'say', who: 'hero', emo: 'broken', text: '老爷子！{p:300}三分钟后有追猎队来袭！往东边跑！快！' },
    { t: 'say', who: 'oldman', emo: 'surprise', text: '……你怎么知道？' },
    { t: 'say', who: 'hero', emo: 'fear', text: '我知道！我就是知道！信我一次！' },
    { t: 'say', who: 'oldman', emo: 'calm', text: '……' },
    { t: 'say', who: 'oldman', emo: 'half', text: '好。' },
    { t: 'wait', ms: 500 },
    { t: 'sub', text: '第 2 次轮回', ms: 1800, size: 20, y: 130 },
    /* 依然死去 */
    { t: 'par', steps: [
      [{ t: 'sfx', id: 'alarm' }],
      [{ t: 'redEdge', a: 1, ms: 500 }],
      [{ t: 'paint', fn: 'alarmLights', ms: 9000, keep: true, wait: false }],
      [{ t: 'bgm', id: 'dread', fade: 300 }]
    ] },
    { t: 'say', who: 'oldman', emo: 'surprise', text: '……东边也有。' },
    { t: 'say', who: 'hero', emo: 'broken', text: '不、不可能——' },
    { t: 'par', steps: [
      [{ t: 'slowmo', scale: .15, ms: 2200 }],
      [{ t: 'paint', fn: 'pierceBeam', ms: 1800, data: { x: 300, y: 330 }, layer: 'over', wait: false }],
      [{ t: 'flash', color: '#ffe9c0', ms: 500, a: .9 }],
      [{ t: 'shake', p: 22, ms: 900 }],
      [{ t: 'sfx', id: 'laser' }]
    ] },
    { t: 'shatter', who: 'oldman', color: '#c8c4bc', n: 50, ms: 1000 },
    { t: 'stopBgm', ms: 500 },
    { t: 'unpaint', fn: 'alarmLights', ms: 800 },
    { t: 'redEdge', a: 0, ms: 900 },
    { t: 'wait', ms: 700 },
    { t: 'actor', who: 'hero', x: 640, emo: 'numb', ms: 800 },

    { t: 'sub', text: '第 3 次。第 4 次。第 7 次。第 11 次。', ms: 3000, size: 20, y: 130 },
    { t: 'par', steps: [
      [{ t: 'repeat', n: 4, steps: [
        { t: 'glitch', ms: 260, p: .8 },
        { t: 'sfx', id: 'glitch', arg: 4 },
        { t: 'wait', ms: 420 }
      ] }],
      [{ t: 'desat', a: .7, ms: 2400, wait: false }]
    ] },
    { t: 'call', fn: function () { G.St.s.loopCount = 11; G.St.addSanity(-14); } },
    { t: 'wait', ms: 500 },
    { t: 'say', who: 'hero', emo: 'numb', text: '……' },
    { t: 'say', who: 'hero', emo: 'numb', text: '往东，死。{p:300}往西，死。{p:300}藏进机库，死。' },
    { t: 'say', who: 'hero', emo: 'numb',
      text: '我把他绑在椅子上，{p:300}我替他挡，{p:300}我提前一小时叫他走——' },
    { t: 'say', who: 'hero', emo: 'broken', text: '{s}他都死了。{/s}' },
    { t: 'wait', ms: 800 },
    { t: 'desat', a: 0, ms: 1600 },
    { t: 'clear' },
    { t: 'enter', who: 'oldman', slot: 'left', emo: 'calm', alpha: .75 },
    { t: 'enter', who: 'hero', slot: 'right', emo: 'sad', flip: true },
    { t: 'sub', text: '第 12 次轮回', ms: 1600, size: 20, y: 130 },
    { t: 'say', who: 'hero', emo: 'sad', text: '……老爷子。' },
    { t: 'say', who: 'oldman', emo: 'calm', text: '嗯。' },
    { t: 'say', who: 'hero', emo: 'sad', text: '我救不了你，是不是。' },
    { t: 'say', who: 'oldman', emo: 'calm', text: '……' },
    { t: 'say', who: 'oldman', emo: 'half', text: '你这话，说得像是已经试过很多次了。' },
    { t: 'say', who: 'hero', emo: 'broken', text: '{s}十一次。{/s}' },
    { t: 'wait', ms: 900 },
    { t: 'say', who: 'oldman', emo: 'sad', text: '……傻小子。' },
    { t: 'par', steps: [
      [{ t: 'zoom', z: 1.15, ms: 2200, cx: 300, cy: 340, wait: false }],
      [{ t: 'lines', list: [
        { who: 'oldman', emo: 'calm', text: '别为我浪费你的命。' },
        { who: 'oldman', emo: 'determined', text: '去救那些……{p:700}还能被救的人。' }
      ] }]
    ] },
    { t: 'zoom', z: 1, ms: 900, wait: false },
    { t: 'say', who: 'hero', emo: 'broken', text: '{s}……凭什么！{p:400}凭什么你说了就算！{/s}' },
    { t: 'say', who: 'oldman', emo: 'half',
      text: '因为我死了十二次，{p:400}你才哭了一次。' },
    { t: 'say', who: 'oldman', emo: 'calm', text: '……哭完了，就去做事。' },
    { t: 'learn', k: 'fixed_death', label: '有些死亡无法改变 —— 老人的死是「注定」的' },
    { t: 'codex', id: 'oldman' }
  ];

  /* ============================================================
     序章 · 节拍9  决心
     ============================================================ */
  CS.p_resolve = [
    { t: 'bg', id: 'camp', fade: 700 },
    { t: 'bgm', id: 'grief', fade: 1600 },
    { t: 'clear' },
    { t: 'enter', who: 'hero', slot: 'center', emo: 'numb' },
    { t: 'wait', ms: 700 },
    { t: 'say', who: 'hero', emo: 'sad', text: '……' },
    { t: 'say', who: 'hero', emo: 'sad', text: '汤还是温的。' },
    { t: 'say', who: 'hero', emo: 'sad', text: '他每次都在同一分钟把火关掉。{p:600}十二次，一次不差。' },
    { t: 'wait', ms: 700 },
    { t: 'say', who: 'hero', emo: 'fear',
      text: '我好害怕。{p:500}我怕疼，我怕死，我怕那些飞机，我怕这个世界。' },
    { t: 'say', who: 'hero', emo: 'fear', text: '我现在最想做的事，是躲进箱子后面，{p:400}一辈子不出来。' },
    { t: 'wait', ms: 900 },
    { t: 'par', steps: [
      [{ t: 'actor', who: 'hero', emo: 'determined', ms: 1400, wait: false }],
      [{ t: 'tint', color: '#4FC3F7', a: .16, ms: 1200 }],
      [{ t: 'bgm', id: 'hope', fade: 1800 }]
    ] },
    { t: 'say', who: 'hero', emo: 'determined', text: '……但我做不到。' },
    { t: 'say', who: 'hero', emo: 'determined',
      text: '我不敢……{p:500}但我必须。' },
    { t: 'closebox' },
    { t: 'par', steps: [
      [{ t: 'cam', x: 120, ms: 2600, wait: false }],
      [{ t: 'actor', who: 'hero', x: 900, ms: 2600, wait: false }],
      [{ t: 'wait', ms: 1600 }]
    ] },
    { t: 'sub', text: '他走向那架不会飞的破飞机。', ms: 2600, y: 640 },
    { t: 'tint', color: '#000', a: 0, ms: 600 },
    { t: 'wait', ms: 400 }
  ];

  /* ============================================================
     第一章 · 开场 + 遇见疯癫角色
     ============================================================ */
  CS.c1_open = [
    { t: 'reset' },
    { t: 'bg', id: 'camp', fade: 800 },
    { t: 'bgm', id: 'camp', fade: 1400, layers: { lead: false } },
    { t: 'clear' },
    { t: 'card', small: 'CHAPTER  1', big: '轮回与TY', ms: 2400 },
    { t: 'enter', who: 'hero', slot: 'center', emo: 'fear' },
    { t: 'say', who: 'hero', emo: 'fear', text: '（左手……不，这是右手。{p:400}这是左手。）' },
    { t: 'say', who: 'hero', emo: 'fear', text: '（推杆前进，拉杆爬升。{p:300}老爷子说过一百遍。）' },
    { t: 'par', steps: [
      [{ t: 'sfx', id: 'shootHeavy' }],
      [{ t: 'shake', p: 10, ms: 600 }]
    ] },
    { t: 'say', who: 'hero', emo: 'pain', text: '{s}哇啊啊啊啊——！{/s}' },
    { t: 'wait', ms: 600 },
    { t: 'say', who: 'hero', emo: 'numb', text: '……' },
    { t: 'say', who: 'hero', emo: 'numb', text: '……飞起来了。' },
    { t: 'say', who: 'hero', emo: 'sad', text: '老爷子，我飞起来了。' },
    { t: 'wait', ms: 900 },
    { t: 'say', who: 'hero', emo: 'sad', text: '……你怎么不骂我了。' },
    { t: 'clearsub' }
  ];

  CS.c1_madman = [
    { t: 'bg', id: 'ruins', fade: 800 },
    { t: 'bgm', id: 'ruins', fade: 1200 },
    { t: 'clear' },
    { t: 'enter', who: 'hero', slot: 'right', emo: 'fear', flip: true },
    { t: 'enter', who: 'madman', slot: 'left', from: 'left', emo: 'mad' },
    { t: 'sfx', id: 'uiDeny' },
    { t: 'say', who: 'madman', emo: 'mad', text: '嘿嘿嘿嘿！{p:200}嘿！{p:200}新来的味道！生的！还带着别的天空的土！' },
    { t: 'say', who: 'hero', emo: 'fear', text: '……你、你是谁？' },
    { t: 'say', who: 'madman', emo: 'mad',
      text: '我是谁？{p:300}我是问题。{p:300}你是答案。{p:300}答案不认识问题，{p:300}问题可认识答案哟！' },
    { t: 'say', who: 'hero', emo: 'fear', text: '（听不懂……）' },
    { t: 'say', who: 'madman', emo: 'mad', text: '{s}死了几次啦？{/s}' },
    { t: 'par', steps: [
      [{ t: 'shake', p: 12, ms: 400 }],
      [{ t: 'actor', who: 'hero', emo: 'surprise', ms: 200, wait: false }]
    ] },
    { t: 'say', who: 'hero', emo: 'surprise', text: '……你说什么？' },
    { t: 'say', who: 'madman', emo: 'mad',
      text: '没说没说！{p:200}我说饺子！{p:200}我说饺子好吃！{p:200}嘿嘿嘿嘿嘿嘿！' },
    { t: 'say', who: 'hero', emo: 'fear', text: '……' },
    { t: 'say', who: 'madman', emo: 'mad', text: '哎——{p:400}你以为只有你和那个科学家能救世界？' },
    { t: 'say', who: 'hero', emo: 'surprise', text: '什么科学家？' },
    { t: 'par', steps: [
      [{ t: 'tint', color: '#B8860B', a: .2, ms: 500 }],
      [{ t: 'say', who: 'madman', emo: 'mad',
         text: '{c:#ffe23a}嘿嘿……{p:600}等着瞧吧。{/c}' }]
    ] },
    { t: 'tint', color: '#000', a: 0, ms: 600 },
    { t: 'say', who: 'madman', emo: 'mad',
      text: '那个本该拯救世界、{p:300}结果已经死掉了的科学家呀！{p:400}死透了！凉了！' },
    { t: 'say', who: 'madman', emo: 'mad',
      text: '躺在第七区的老锚点下面，{p:300}左手朝天，{p:300}像在指路。{p:300}嘿嘿。' },
    { t: 'say', who: 'hero', emo: 'surprise', text: '第七区……老锚点？' },
    { t: 'say', who: 'madman', emo: 'mad', text: '再见啦，答案！{p:300}下次见面，我可能不认识你了！' },
    { t: 'say', who: 'madman', emo: 'mad', text: '……{p:600}也可能，{p:400}太认识你了。' },
    { t: 'exit', who: 'madman', to: 'left' },
    { t: 'say', who: 'hero', emo: 'fear', text: '喂！{p:400}喂——！' },
    { t: 'learn', k: 'ty_location', label: 'TY 的遗体 —— 第七区老锚点下方' },
    { t: 'flag', k: 'metMadman' },
    { t: 'codex', id: 'madman' },
    { t: 'if', cond: function () { return !G.St.flag('seenIfHint3'); }, then: [
      { t: 'flag', k: 'seenIfHint3' }
    ] }
  ];

  /* ============================================================
     第一章 · 找到 TY + 复活 TY（含副作用演出）
     ============================================================ */
  CS.c1_find_ty = [
    { t: 'bg', id: 'ruins', fade: 900 },
    { t: 'bgm', id: 'grief', fade: 1600 },
    { t: 'clear' },
    { t: 'vignette', a: .5, ms: 800 },
    { t: 'paint', fn: 'tyCorpse', ms: 30000, keep: true, data: { x: 760, y: 540, color: '#8f98a4' }, wait: false },
    { t: 'enter', who: 'hero', slot: 'left', emo: 'fear' },
    { t: 'wait', ms: 900 },
    { t: 'say', who: 'hero', emo: 'fear', text: '……真的有。' },
    { t: 'say', who: 'hero', emo: 'sad', text: '左手朝天。{p:500}像在指路。' },
    { t: 'wait', ms: 600 },
    { t: 'say', who: 'narrator', text: '尸体保存得出奇地好。云端的冷，把他冻在了失败的那一刻。' },
    { t: 'say', who: 'narrator', text: '他的另一只手里，攥着半张烧焦的图纸。上面画着某种……钥匙？' },
    { t: 'say', who: 'hero', emo: 'sad', text: '（这个人，本来是要救世界的。）' },
    { t: 'say', who: 'hero', emo: 'sad', text: '（然后他死了。{p:500}世界也就没救了。）' },
    { t: 'wait', ms: 700 },
    { t: 'say', who: 'hero', emo: 'fear', text: '（那……如果他没死呢？）' },
    { t: 'wait', ms: 900 },
    { t: 'say', who: 'hero', emo: 'broken', text: '（我在想什么啊。{p:400}我在想什么啊！）' },
    { t: 'say', who: 'hero', emo: 'fear',
      text: '（可是……{p:600}老爷子说，去救那些还能被救的人。）' },
    { t: 'say', who: 'hero', emo: 'determined', text: '（这个人，还能被救吗？）' },
    { t: 'closebox' },
    { t: 'par', steps: [
      [{ t: 'zoom', z: 1.28, ms: 2200, cx: 740, cy: 520, wait: false }],
      [{ t: 'sfx', id: 'heartbeat' }],
      [{ t: 'wait', ms: 1000 }, { t: 'sfx', id: 'heartbeat' }]
    ] },
    { t: 'sub', text: '他割下了那只指路的手上的一小块皮肤，用衣角包好，塞进胸口。', ms: 3400, y: 650 },
    { t: 'zoom', z: 1, ms: 1000 },
    { t: 'say', who: 'hero', emo: 'pain', text: '（对不起。{p:500}对不起，我不知道该怎么做才对。）' },
    { t: 'flag', k: 'tyFound' },
    { t: 'flag', k: 'tyFleshHeld' },
    { t: 'learn', k: 'ty_flesh', label: '我带着 TY 的一块皮肤 —— 复活的凭证' },
    { t: 'unpaint', fn: 'tyCorpse', ms: 900 }
  ];

  CS.c1_revive_ty = [
    { t: 'bg', id: 'ruins', fade: 400 },
    { t: 'clear' },
    { t: 'enter', who: 'hero', slot: 'center', emo: 'determined' },
    { t: 'say', who: 'hero', emo: 'fear', text: '（要死一次。{p:500}主动的。）' },
    { t: 'say', who: 'hero', emo: 'fear', text: '（第十三次了。{p:400}可这一次，是我自己选的。）' },
    { t: 'say', who: 'hero', emo: 'broken', text: '（好痛啊。{p:400}每一次都好痛啊。）' },
    { t: 'closebox' },
    { t: 'par', steps: [
      [{ t: 'sfx', id: 'rewind' }],
      [{ t: 'glitch', ms: 2400, p: 1 }],
      [{ t: 'paint', fn: 'rewindRings', ms: 3000, layer: 'over', wait: false }],
      [{ t: 'shake', p: 18, ms: 2400 }],
      [{ t: 'actor', who: 'hero', distort: 1, crack: 1, ms: 400, wait: false }],
      [{ t: 'flash', color: '#dff4ff', ms: 500, a: 1 }]
    ] },
    { t: 'wait', ms: 1400 },
    { t: 'shatter', who: 'hero', color: '#4FC3F7', n: 80, ms: 1000 },
    { t: 'black', a: 1, ms: 700 },
    { t: 'unpaint' },
    { t: 'reset' },
    { t: 'wait', ms: 1000 },
    { t: 'call', fn: function () { G.St.applyReturn(); G.St.setFlag('tyAlive'); G.St.s.tyRevived = 1; } },

    /* —— 存档点，TY 复活 —— */
    { t: 'bg', id: 'camp', fade: 0 },
    { t: 'clear' },
    { t: 'enter', who: 'hero', slot: 'left', emo: 'pain', ms: 200, wait: false },
    { t: 'enter', who: 'ty', slot: 'right', emo: 'numb', ms: 200, decay: 0, flip: true, wait: false },
    { t: 'par', steps: [
      [{ t: 'black', a: 0, ms: 1200 }],
      [{ t: 'flash', color: '#ffffff', ms: 600, a: .9 }]
    ] },
    { t: 'wait', ms: 400 },

    /* —— 副作用发作：撕心裂肺 —— */
    { t: 'par', steps: [
      [{ t: 'scream', dur: 3.6 }],
      [{ t: 'actor', who: 'ty', emo: 'pain', tintColor: '#ff2b3e', tintAmt: .9, distort: 1, ms: 300, wait: false }],
      [{ t: 'shake', p: 22, ms: 3200 }],
      [{ t: 'redEdge', a: 1, ms: 400 }],
      [{ t: 'glitch', ms: 3000, p: .9 }],
      [{ t: 'actor', who: 'hero', emo: 'broken', ms: 400, wait: false }]
    ] },
    { t: 'wait', ms: 1600 },
    { t: 'sub', text: '他继承了死前几秒的一切 —— 那道贯穿胸腔的痛，那一刻的窒息，那句没能说完的话。',
      ms: 3200, size: 18, y: 660 },
    { t: 'wait', ms: 900 },
    { t: 'par', steps: [
      [{ t: 'actor', who: 'ty', tintAmt: 0, distort: 0, emo: 'pain', ms: 1600, wait: false }],
      [{ t: 'redEdge', a: 0, ms: 1400 }]
    ] },
    { t: 'wait', ms: 700 },
    { t: 'say', who: 'ty', emo: 'pain', text: '……哈。{p:600}哈……' },
    { t: 'say', who: 'hero', emo: 'broken', text: '对不起对不起对不起——我不知道会这样——我——' },
    { t: 'say', who: 'ty', emo: 'cold', text: '……没关系。' },
    { t: 'wait', ms: 600 },
    { t: 'say', who: 'ty', emo: 'cold', text: '告诉我，{p:500}现在是什么时间。' },
    { t: 'say', who: 'hero', emo: 'surprise', text: '……啊？' },
    { t: 'say', who: 'ty', emo: 'cold', text: '时间。{p:300}年、月、日、时。{p:400}精确到分更好。' },
    { t: 'say', who: 'hero', emo: 'fear', text: '呃、呃……我不知道这个世界怎么算——' },
    { t: 'say', who: 'ty', emo: 'cold', text: '天空的颜色是几号灰？' },
    { t: 'say', who: 'hero', emo: 'fear', text: '啊？' },
    { t: 'say', who: 'ty', emo: 'cold', text: '……算了。' },
    { t: 'par', steps: [
      [{ t: 'zoom', z: 1.14, ms: 2000, cx: 980, cy: 320, wait: false }],
      [{ t: 'lines', list: [
        { who: 'ty', emo: 'cold', text: '我死了。这是确定的。' },
        { who: 'ty', emo: 'cold', text: '我现在没死。这也是确定的。' },
        { who: 'ty', emo: 'sharp', text: '你身上有一样不属于这个世界的东西。' },
        { who: 'ty', emo: 'cold', text: '推论：你把我拉回来了。' }
      ] }]
    ] },
    { t: 'zoom', z: 1, ms: 900 },
    { t: 'say', who: 'hero', emo: 'surprise', text: '……你、你怎么一下就——' },
    { t: 'say', who: 'ty', emo: 'cold', text: '这是最短的解释路径。{p:400}走别的路要多花四十秒。' },
    { t: 'wait', ms: 500 },
    { t: 'say', who: 'ty', emo: 'cold', text: '你叫什么？' },
    { t: 'say', who: 'hero', emo: 'fear', text: '……我。{p:400}就……我。' },
    { t: 'say', who: 'ty', emo: 'cold', text: '好。「你」。{p:400}我是 TY。' },
    { t: 'say', who: 'ty', emo: 'sharp', text: '现在，把你知道的全部说出来。{p:400}一个字都不要漏。' },
    { t: 'say', who: 'ty', emo: 'sharp', text: '因为这个世界，{p:600}会在四百七十一天后毁灭。' },
    { t: 'par', steps: [
      [{ t: 'shake', p: 14, ms: 700 }],
      [{ t: 'flash', color: '#E0E6ED', ms: 400, a: .5 }],
      [{ t: 'bgm', id: 'ruins', fade: 1200 }]
    ] },
    { t: 'say', who: 'hero', emo: 'broken', text: '{s}四、四百七十一天？！{/s}' },
    { t: 'say', who: 'ty', emo: 'cold', text: '上一次是四百七十一天。{p:500}这一次，我们有了变量。' },
    { t: 'say', who: 'ty', emo: 'cold', text: '……你。' },
    { t: 'codex', id: 'ty' },
    { t: 'learn', k: 'doomsday', label: '世界将在约 471 天后毁灭' },
    { t: 'learn', k: 'ty_alive', label: 'TY 与我一同轮回、一同保留记忆' }
  ];

  /* ============================================================
     第一章 · Boss1 战前 / 战后
     ============================================================ */
  CS.c1_boss1_pre = [
    { t: 'bg', id: 'ruins', fade: 500 },
    { t: 'bgm', id: 'dread', fade: 500 },
    { t: 'clear' },
    { t: 'enter', who: 'hero', slot: 'left', emo: 'fear' },
    { t: 'enter', who: 'ty', slot: 'center', emo: 'cold', scale: 1.7, y: 420, z: -1 },
    { t: 'sfx', id: 'alarm' },
    { t: 'redEdge', a: .8, ms: 500 },
    { t: 'say', who: 'ty', emo: 'sharp', text: '来了。{p:300}三点方向，四架。{p:300}领队那架的引擎音高了 2%。' },
    { t: 'say', who: 'hero', emo: 'fear', text: '那、那是什么意思？' },
    { t: 'say', who: 'ty', emo: 'cold', text: '意思是他改装过。{p:400}意思是他会先冲你。' },
    { t: 'enter', who: 'hunter', slot: 'right', from: 'right', emo: 'anger', flip: true },
    { t: 'say', who: 'hunter', emo: 'anger', text: '禁忌之物。{p:400}交出来，可以少受点苦。' },
    { t: 'say', who: 'hero', emo: 'fear', text: '我、我没有什么禁忌之物！' },
    { t: 'say', who: 'hunter', emo: 'anger', text: '你就是。' },
    { t: 'par', steps: [
      [{ t: 'shake', p: 12, ms: 500 }],
      [{ t: 'say', who: 'hero', emo: 'broken', text: '……' }]
    ] },
    { t: 'say', who: 'ty', emo: 'cold', text: '听我的口令。{p:400}我不会让你死。' },
    { t: 'say', who: 'hero', emo: 'fear', text: '你、你怎么保证——' },
    { t: 'say', who: 'ty', emo: 'sharp', text: '我不保证。{p:400}我计算。' },
    { t: 'codex', id: 'hunter' },
    { t: 'exit', who: 'hunter', to: 'right', ms: 300 },
    { t: 'redEdge', a: 0, ms: 600 }
  ];

  CS.c1_boss1_post = [
    { t: 'bg', id: 'ruins', fade: 600 },
    { t: 'bgm', id: 'hope', fade: 1400 },
    { t: 'clear' },
    { t: 'enter', who: 'hero', slot: 'left', emo: 'pain' },
    { t: 'enter', who: 'ty', slot: 'right', emo: 'cold', flip: true },
    { t: 'say', who: 'hero', emo: 'pain', text: '哈……{p:300}哈……{p:400}我、我还活着？' },
    { t: 'say', who: 'ty', emo: 'cold', text: '你活着。{p:400}偏差 1.2 秒，在容许范围内。' },
    { t: 'say', who: 'hero', emo: 'broken', text: '{s}容许范围？！我差点被打成两半！{/s}' },
    { t: 'say', who: 'ty', emo: 'cold', text: '「差点」的意思，就是没有。' },
    { t: 'wait', ms: 500 },
    { t: 'say', who: 'ty', emo: 'cold', text: '……不过。' },
    { t: 'say', who: 'ty', emo: 'sharp', text: '你怕得手在抖，却没有一次松开操纵杆。' },
    { t: 'say', who: 'hero', emo: 'fear', text: '……因为松开就会死。' },
    { t: 'say', who: 'ty', emo: 'cold',
      text: '知道松手会死，还是害怕——{p:500}然后依然握着。{p:600}这在我的模型里，叫做「不可计算项」。' },
    { t: 'say', who: 'hero', emo: 'surprise', text: '……那是好话还是坏话？' },
    { t: 'say', who: 'ty', emo: 'cold', text: '是我唯一没法预测的东西。' },
    { t: 'say', who: 'ty', emo: 'cold', text: '所以，是好话。' },
    { t: 'call', fn: function () { G.St.s.bossCleared.boss1 = true; } }
  ];

})(window);
