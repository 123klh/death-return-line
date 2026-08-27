/* ===========================================================
   characters.js — 角色定义（立绘参数 + 哔声参数 + 图鉴档案）
   哔声规格严格对应设计：每个角色一听即分辨
   =========================================================== */
(function (root) {
  'use strict';
  var G = root.G;

  var C = G.Chars = {

    /* ---------- 主角：从异世界穿越来的普通人 ---------- */
    hero: {
      id: 'hero',
      /* 作画：深栗乱发 + 连帽衫。缩着的肩线和兜帽是「胆小」的一半 */
      art: { skin: '#ffe0c8', hair: '#4a3f52', iris: '#2f9fd8', outfit: 'hoodie',
             pants: '#3d4657', shoes: '#2a2f3a', heads: 6.3 }, name: '我', fullName: '穿越者', title: '只想回家的普通人',
      color: '#4FC3F7', eyeCol: '#1a5a80',
      head: 'round', hair: 'spiky', eyes: 'normal',
      build: { h: .92, w: .92, head: 1.02, posture: 'small', lw: 6.2 },
      breath: { rate: 1.15, amp: 1.35 },
      defaultEmo: 'fear',
      voice: { wave: 'sine', f: 430, jitter: 6, dur: .042, gain: .17, fc: 2400 },
      codex: '从另一个世界莫名穿越而来。没有战斗能力，没有勇气，只有一个「死亡回归」的诅咒。' +
             '他会在角落里抱着膝盖发抖，然后咬着牙站起来——因为他无法眼睁睁看着在乎的人死去。'
    },

    /* ---------- TY：这个世界真正的救世主 ---------- */
    ty: {
      id: 'ty',
      /* 作画：银白顺发 + 敞开的白大衣，瞳色是没有温度的灰蓝 */
      art: { skin: '#f6e2d6', hair: '#cfd8e4', iris: '#8fa4b8', outfit: 'coat',
             pants: '#4a5260', shoes: '#23272e', accent: '#aebcc9', heads: 6.6 }, name: 'TY', fullName: 'TY', title: '这个世界真正的救世主',
      color: '#E0E6ED', color2: '#9AA4AE', eyeCol: '#3a4650',
      head: 'sharp', hair: 'sleek', eyes: 'sharp',
      build: { h: 1.06, w: .9, head: .97, posture: 'straight', lw: 6 },
      breath: { rate: 1, amp: .55, metronome: true },
      decayGray: true,
      defaultEmo: 'cold',
      /* 极其规律的低频脉冲；后期由 tyDecay 注入 noise */
      voice: { wave: 'square', f: 196, jitter: 1, dur: .03, gain: .15, fc: 1100 },
      codex: '智力远超人类级别的科学家。在「注定毁灭」的那条时间线里，他找到了救世之法却死在成功之前。' +
             '主角带走了他的血肉，用死亡回归把他一同拉进了轮回。他是脑，主角是手。'
    },

    /* ---------- 老人：导师 + 能力共同发现者 ---------- */
    oldman: {
      id: 'oldman',
      /* 作画：灰白稀发 + 晒硬的皮肤 + 飞行夹克 */
      art: { skin: '#e8c0a0', hair: '#9a8f84', iris: '#6a4a28', outfit: 'jacket',
             pants: '#5a4a38', shoes: '#3a2f22', heads: 6.0 }, name: '老人', fullName: '退役王牌', title: '收留他的老飞行员',
      color: '#8D6E4A', eyeCol: '#3a2a18',
      head: 'oval', hair: 'old', eyes: 'half',
      build: { h: 1.0, w: 1.06, head: 1.04, posture: 'hunch', lw: 7.2 },
      breath: { rate: .55, amp: 1.0 },
      goggles: true, wrinkles: true,
      defaultEmo: 'calm',
      voice: { wave: 'square', f: 150, jitter: 3, dur: .055, gain: .16, fc: 620 },
      codex: '在废墟里捡到了主角。嘴硬心软，把他当成自己死去的孙子。' +
             '和主角一起触发了那处遗迹——能力却绑在了主角身上。他知道这会让主角成为全世界的公敌，' +
             '但他选择了保护。「害怕不丢人，丢人的是害怕了就跑。」'
    },

    /* ---------- 正直的人：隐藏的领袖 / IF 线核心 ---------- */
    upright: {
      id: 'upright',
      /* 作画：金短发压在军帽下，白金制服。挺直是他唯一的姿态 */
      art: { skin: '#ffdcbe', hair: '#c8a55e', iris: '#5a6270', outfit: 'uniform',
             pants: '#dfe4ec', shoes: '#2c3038', accent: '#FFE9A8', heads: 6.6 }, name: '正直的人', fullName: '守卫队长', title: '有背景却从不使用的人',
      color: '#FFFFFF', color2: '#FFE9A8', eyeCol: '#5a6270',
      head: 'square', hair: 'helmet', eyes: 'sharp',
      build: { h: 1.04, w: 1.0, head: .98, posture: 'straight', lw: 7 },
      breath: { rate: .8, amp: .35 },
      emblem: true,
      defaultEmo: 'determined',
      /* 清脆稳定的高频脉冲，像军号；IF 线加 harm 低沉和声 */
      voice: { wave: 'square', f: 660, jitter: 1, dur: .034, gain: .13, fc: 4200 },
      voiceIf: { wave: 'square', f: 660, jitter: 1, dur: .04, gain: .14, fc: 4200, harm: 1 },
      codex: '某座浮空都市的守卫队长。表面是个遵守规则的普通军人，实则出身于这座世界的创始家族，' +
             '继承着足以扭转战局的古老力量——而他从不使用。' +
             '「我有背景，但我不需要它。我要证明的是，没有背景的人也能做到。」'
    },

    /* ---------- 疯癫角色：伏笔回收型 ---------- */
    madman: {
      id: 'madman',
      /* 作画：爆炸黄发 + 破旧飞行服 */
      art: { skin: '#ffdcbe', hair: '#e0c02a', iris: '#6a5410', outfit: 'jacket',
             pants: '#6a5a30', shoes: '#4a3a20', heads: 6.3 }, name: '疯子', fullName: '流浪飞行员', title: '说的疯话全都会应验',
      color: '#FFE23A', color2: '#B8860B', eyeCol: '#6a5410',
      head: 'round', hair: 'messy', eyes: 'swirl',
      build: { h: .98, w: 1.0, head: 1.0, posture: 'tilt', lw: 6.4 },
      breath: { rate: 2.2, amp: 1.8, jitter: .6 },
      wobble: true,
      defaultEmo: 'mad',
      voice: { wave: 'sawtooth', f: 520, jitter: 40, dur: .04, gain: .13, unstable: true },
      voiceAlt: { wave: 'triangle', f: 130, jitter: 0, dur: .07, gain: .17, fc: 500 },
      altName: '正经的他',
      codex: '疯疯癫癫的情报贩子，笑声夸张，行为不可预测。' +
             '但他说的每一句疯话，最后都会应验——因为他一直在装。他知道一切。'
    },

    /* ---------- 运气好的人 ---------- */
    lucky: {
      id: 'lucky',
      /* 作画：橙色上翘卷发 + 机械师工装 */
      art: { skin: '#ffdcbe', hair: '#e07a20', iris: '#7a4410', outfit: 'overall',
             pants: '#4a6a8a', shoes: '#6a4a2a', heads: 6.2 }, name: '幸运儿', fullName: '走运的机械师', title: '死于自己好运的人',
      color: '#FFA23A', eyeCol: '#7a4410',
      head: 'round', hair: 'bounce', eyes: 'crescent',
      build: { h: .96, w: 1.0, head: 1.02, posture: 'normal', lw: 6.4 },
      breath: { rate: 1.4, amp: 1.4 },
      luckFx: true, mouth: 'smile',
      defaultEmo: 'smile',
      voice: { wave: 'triangle', f: 780, jitter: 12, dur: .026, gain: .13, glide: 1.22 },
      codex: '人生仿佛开挂，每次危机都能莫名其妙化解，连身边的人都跟着走运。' +
             '「没事没事，运气会站在我们这边的。」——他每次都选了当下最优，' +
             '而当下最优的累积，导向了全局最劣。'
    },

    /* ---------- 朋友（最终反派） ---------- */
    friend: {
      id: 'friend',
      /* 作画：绿色中长飘发，笑眼。反转后由 color2 压成暗绿 */
      art: { skin: '#ffdcbe', hair: '#5aa838', iris: '#2a5a18', outfit: 'jacket',
             pants: '#3f5a3a', shoes: '#2f3f2a', heads: 6.4 }, name: '朋友', fullName: '从一开始就在的人', title: '感情是真的，立场不同',
      color: '#7CE04A', color2: '#3E8A46', eyeCol: '#2a5a18',
      head: 'round', hair: 'flow', eyes: 'crescent',
      build: { h: 1.0, w: .98, head: 1.0, posture: 'normal', lw: 6.4 },
      breath: { rate: 1.05, amp: 1.0 },
      mouth: 'smile',
      defaultEmo: 'smile',
      voice: { wave: 'triangle', f: 470, jitter: 6, dur: .038, gain: .14, fc: 2800 },
      voiceAlt: { wave: 'sawtooth', f: 320, jitter: 4, dur: .045, gain: .15, fc: 1400 },
      altName: '朋友',
      codex: '从故事一开始就陪在主角身边的好兄弟。老人死后，他是唯一理解主角痛苦的人。' +
             '——他从一开始就是反派阵营的人。但他对主角的感情，是真的。'
    },

    /* ---------- 被操控的朋友（泪点核心） ---------- */
    puppet: {
      id: 'puppet',
      /* 作画：淡紫长发 + 单薄衬衫，体型比谁都窄 */
      art: { skin: '#f4e0da', hair: '#b49ae0', iris: '#5a3a80', outfit: 'plain',
             pants: '#5a4a70', shoes: '#3a2f4a', heads: 6.2 }, name: '他', fullName: '被操控的朋友', title: '请求主角杀了他的人',
      color: '#C7A8F0', color2: '#4A2A6A', eyeCol: '#5a3a80',
      head: 'oval', hair: 'long', eyes: 'normal',
      build: { h: .95, w: .86, head: 1.0, posture: 'small', lw: 6 },
      breath: { rate: 1.3, amp: 1.5 },
      defaultEmo: 'fear',
      voice: { wave: 'triangle', f: 380, jitter: 8, dur: .04, gain: .14, fc: 2200 },
      voiceAlt: { wave: 'sawtooth', f: 300, jitter: 26, dur: .05, gain: .15, noise: 1.1, fc: 1800 },
      altName: '被操控的他',
      codex: '原本善良、懦弱、总是依赖主角。被幕后Boss强制操控改造——意识清醒，' +
             '却无法控制自己的身体，清楚地看着自己造成伤害。' +
             '「杀了我……求你了……我不想再伤害任何人了……」'
    },

    /* ---------- 幕后Boss（操控者） ---------- */
    shadow: {
      id: 'shadow',
      /* 作画：没有五官也没有头发，整体是一团流动的暗色 */
      art: { skin: '#1a1a26', hair: '#0d0d16', iris: '#3a0a14', outfit: 'shroud',
             pants: '#0d0d16', shoes: '#08080f', heads: 6.8 }, name: '???', fullName: '操控者', title: '由流动阴影构成',
      color: '#12121C', eyeGlow: '#FF2B4E',
      head: 'void', hair: 'none', eyes: 'void',
      build: { h: 1.08, w: 1.02, head: 1.0, posture: 'straight', lw: 7 },
      breath: { rate: .4, amp: .3 },
      headFill: '#05050a',
      defaultEmo: 'calm',
      voice: { wave: 'sawtooth', f: 96, jitter: 3, dur: .055, gain: .15, noise: .5, fc: 420 },
      codex: '没有面部特征，只有一双发光的眼睛，身体由流动的阴影构成。' +
             '他在操控主角的朋友时，进行了非人的折磨与实验。'
    },

    /* ---------- 最终Boss：恶人的救世主 ---------- */
    savior: {
      id: 'savior',
      /* 作画：深红长尖发 + 铠甲披风。所有线条都朝上朝外 */
      art: { skin: '#f0d2c4', hair: '#c01a3a', iris: '#2a0a18', outfit: 'armor',
             pants: '#3a1020', shoes: '#20080f', accent: '#ffb0c0', heads: 6.8 }, name: '他', fullName: '恶人的救世主', title: '被追随者称为救世主，被敌人称为恶魔',
      color: '#E0244A', color2: '#5B2A8C', eyeCol: '#2a0a18', eyeGlow: '#ff3355',
      head: 'crown', hair: 'crownspike', eyes: 'dual',
      build: { h: 1.16, w: 1.12, head: 1.0, posture: 'straight', lw: 8 },
      breath: { rate: .7, amp: 1.6, jitter: .3 },
      cape: true, wings: true, capeEdge: '#ff2b4e',
      aura: '#8a1030',
      defaultEmo: 'calm',
      voice: { wave: 'sawtooth', f: 300, jitter: 5, dur: .05, gain: .16, dual: true },
      codex: '从小被排挤，父母早逝，无人关爱。一直活在一个比他更强的人的阴影下。' +
             '「别人不看好我，我的父母又走得早，然后，谁都不爱我……' +
             '那我只能比别人更爱我自己一点！」他成了被抛弃者们的救世主。'
    },

    /* ---------- 彩蛋结局的孩子 ---------- */
    child: {
      id: 'child',
      /* 作画：四头半身的小孩比例，头大、腿短 */
      art: { skin: '#ffe4cc', hair: '#8a6a3a', iris: '#8a6a20', outfit: 'plain',
             pants: '#7a8a5a', shoes: '#5a4a3a', heads: 4.6 }, name: '孩子', fullName: '新世界的孩子', title: '',
      color: '#FFE8A0', eyeCol: '#8a6a20',
      head: 'round', hair: 'spiky', eyes: 'normal',
      build: { h: .68, w: .82, head: 1.16, posture: 'normal', lw: 5.6 },
      breath: { rate: 1.6, amp: 1.2 },
      mouth: 'smile', defaultEmo: 'smile',
      voice: { wave: 'sine', f: 880, jitter: 10, dur: .028, gain: .13 }
    },

    /* ---------- 敌方杂兵头目（Boss1） ---------- */
    hunter: {
      id: 'hunter',
      /* 作画：面甲 + 橙红装甲，看不见眼睛只有一条光缝 */
      art: { skin: '#e8bc9c', hair: '#7a3020', iris: '#5a1a0a', outfit: 'armor',
             pants: '#6a2a18', shoes: '#3a1a10', accent: '#ffb090', heads: 6.4 }, name: '追杀者', fullName: '教团追猎队长', title: '奉命夺取「禁忌」的人',
      color: '#FF6B4A', eyeCol: '#5a1a0a',
      head: 'square', hair: 'helmet', eyes: 'line',
      build: { h: 1.02, w: 1.06, head: .96, posture: 'straight', lw: 7 },
      breath: { rate: 1.1, amp: .8 },
      defaultEmo: 'anger',
      voice: { wave: 'square', f: 240, jitter: 4, dur: .045, gain: .15, fc: 1400 }
    },

    /* ---------- 旁白（无立绘） ---------- */
    narrator: {
      id: 'narrator', name: '', fullName: '', title: '',
      color: '#9FC4DD', noPortrait: true,
      voice: { wave: 'sine', f: 340, jitter: 4, dur: .03, gain: .09, fc: 1800 }
    }
  };

  /* 立绘出场顺序中的固定色（彩蛋结局星空用） */
  G.StarColors = [
    { id: 'hero', color: '#4FC3F7', label: '从远方来的' },
    { id: 'ty', color: '#E0E6ED', label: '超级聪明的' },
    { id: 'lucky', color: '#FFA23A', label: '运气好的' },
    { id: 'puppet', color: '#C7A8F0', label: '总是道歉的' },
    { id: 'friend', color: '#7CE04A', label: '总是笑的' },
    { id: 'oldman', color: '#8D6E4A', label: '收留他的' }
  ];

  /* 取哔声（考虑反转形态 / TY 衰老 / IF 线） */
  G.voiceOf = function (id, opt) {
    opt = opt || {};
    var ch = C[id];
    if (!ch) return C.narrator.voice;
    var v = ch.voice;
    if (opt.alt && ch.voiceAlt) v = ch.voiceAlt;
    if (id === 'upright' && opt.ifline && ch.voiceIf) v = ch.voiceIf;
    /* TY 衰老：加入杂音与断续 */
    if (id === 'ty') {
      var d = opt.decay || 0;
      if (d > 0) {
        v = {
          wave: v.wave, f: v.f * (1 - d * .02), jitter: v.jitter + d * 1.6,
          dur: v.dur * (1 + d * .06), gain: v.gain, fc: v.fc,
          noise: d * .18
        };
      }
    }
    return v;
  };

  G.charOf = function (id) { return C[id] || C.narrator; };

})(window);
