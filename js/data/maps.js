/* ===========================================================
   maps.js — 6 个 2.5D 区域：地形 / 道具 / 碰撞 / NPC / 触发 / 躲藏
   坐标为世界坐标（像素），Y 轴向下；渲染时压缩 Y 并向上挤出高度
   =========================================================== */
(function (root) {
  'use strict';
  var G = root.G, U = G.U;

  /* ---------- 生成辅助 ---------- */
  function box(x, y, w, d, h, type, opt) {
    return U.merge({ x: x, y: y, w: w, d: d, h: h, type: type || 'crate', solid: true }, opt || {});
  }
  /* 沿线摆一排 */
  function row(x1, y1, x2, y2, n, fn) {
    var a = [];
    for (var i = 0; i < n; i++) {
      var t = n === 1 ? 0 : i / (n - 1);
      a.push(fn(U.lerp(x1, x2, t), U.lerp(y1, y2, t), i, t));
    }
    return a;
  }
  /* 随机散布（种子固定，保证每次一致） */
  function scatter(seed, n, x1, y1, x2, y2, fn) {
    var r = U.rng(seed), a = [];
    for (var i = 0; i < n; i++) a.push(fn(r.range(x1, x2), r.range(y1, y2), i, r));
    return a;
  }
  /* 围墙（四边） */
  function walls(w, h, th, type) {
    th = th || 60;
    return [
      box(0, -th, w, th, 90, type || 'wall'),
      box(0, h, w, th, 90, type || 'wall'),
      box(-th, 0, th, h, 90, type || 'wall'),
      box(w, 0, th, h, 90, type || 'wall')
    ];
  }

  var M = G.Maps = {};

  /* ============================================================
     区域1 · 废弃机库 / 营地 —— 暖黄 + 锈迹
     ============================================================ */
  M.camp = {
    id: 'camp', name: '锈港 · 废弃机库', bg: 'camp',
    W: 2200, H: 1700,
    ground: { base: '#4a3226', accent: '#6b4632', grid: '#7d5238', kind: 'dirt' },
    amb: { tint: '#ffb15e', a: .10 },
    music: 'camp',
    props: []
      .concat(walls(2200, 1700, 60, 'wall'))
      /* 机库主体 */
      .concat([
        box(180, 200, 520, 300, 210, 'hangar', { color: '#7a4a34' }),
        box(760, 240, 120, 120, 70, 'tank', { color: '#8a5a3a' }),
        box(920, 230, 90, 90, 130, 'pipe', { color: '#6a4630' }),
        /* 老人的破飞机 */
        box(1250, 380, 240, 150, 60, 'wreckplane', { color: '#8D6E4A', solid: true }),
        /* 营地中央的火堆 */
        box(1080, 850, 70, 70, 26, 'fire', { solid: false, glow: '#ff9a4a' }),
        box(980, 830, 60, 60, 40, 'crate'),
        box(1180, 900, 60, 60, 40, 'crate'),
        box(1060, 960, 74, 60, 34, 'crate'),
        /* 观景台 */
        box(1700, 1200, 300, 220, 40, 'platform', { color: '#6b4632' }),
        /* 桥（可从下方走过） */
        box(600, 1100, 460, 44, 34, 'catwalk', { solid: false, elevated: true })
      ])
      .concat(row(140, 620, 140, 1500, 6, function (x, y, i) { return box(x, y, 70, 70, 60, 'barrel'); }))
      .concat(row(300, 1560, 1900, 1560, 9, function (x, y, i) {
        return box(x, y, 90, 50, i % 2 ? 40 : 70, i % 2 ? 'crate' : 'rock');
      }))
      .concat(scatter(11, 22, 300, 500, 2050, 1450, function (x, y, i, r) {
        var t = ['debris', 'rock', 'crate', 'barrel', 'deadtree'][i % 5];
        return box(x, y, r.range(40, 90), r.range(36, 70), r.range(26, 90), t,
                   { solid: t !== 'debris' });
      })),
    npcs: [
      /* 序章前段的老人（获得能力前） */
      { id: 'oldman', char: 'oldman', x: 1100, y: 700, talk: 'camp_oldman_first', label: '老人', face: 1,
        cond: function () { return !G.St.flag('gotPower') && !G.St.flag('oldmanDead'); } },
      /* 空袭前的老人（获得能力后） */
      { id: 'oldman2', char: 'oldman', x: 1090, y: 830, talk: 'camp_oldman_before_raid', label: '老人', face: 1,
        cond: function () { return G.St.flag('gotPower') && !G.St.flag('oldmanDead'); } },
      { id: 'ty', char: 'ty', x: 1300, y: 620, talk: 'camp_ty', label: 'TY', cond: function () { return G.St.flag('tyAlive'); } }
    ],
    zones: [
      { id: 'to_ruins', x: 2080, y: 850, r: 90, kind: 'exit', label: '前往浮空都市残骸', to: 'ruins' },
      { id: 'hangar_door', x: 440, y: 520, r: 80, kind: 'hangar', label: '机库整备' },
      { id: 'sky_pad', x: 1370, y: 470, r: 90, kind: 'sky', label: '登机 · 起飞' },
      { id: 'hide1', x: 250, y: 1000, r: 70, kind: 'hide', label: '躲在桶后面' },
      { id: 'grave', x: 1780, y: 1300, r: 70, kind: 'read', label: '一块没有名字的墓碑', read: 'camp_grave' },
      { id: 'soup', x: 1000, y: 900, r: 60, kind: 'read', label: '还温着的汤', read: 'camp_soup' }
    ],
    lights: [
      { x: 1085, y: 855, r: 300, color: '#ff9a4a', a: .34 },
      { x: 440, y: 400, r: 260, color: '#ffcf8a', a: .18 }
    ]
  };

  /* ============================================================
     区域2 · 浮空都市残骸 —— 灰蓝 + 霓虹残光
     ============================================================ */
  M.ruins = {
    id: 'ruins', name: '第七区 · 都市残骸', bg: 'ruins',
    W: 2600, H: 2000,
    ground: { base: '#1e2a3c', accent: '#2c3d54', grid: '#3a5170', kind: 'metal' },
    amb: { tint: '#5ce1ff', a: .07 },
    music: 'ruins',
    props: []
      .concat(walls(2600, 2000, 60, 'wall'))
      .concat([
        /* 倾倒的摩天楼 */
        box(200, 300, 640, 200, 260, 'tower', { color: '#26374e', neon: '#4fd8ff' }),
        box(900, 260, 200, 200, 400, 'tower', { color: '#1d2c40', neon: '#ff5f9e' }),
        box(1200, 340, 160, 160, 300, 'tower', { color: '#22334a', neon: '#5ce1ff' }),
        /* 广告牌 */
        box(1600, 300, 320, 40, 240, 'neonsign', { color: '#16233a', neon: '#ff5f9e' }),
        /* 老锚点 */
        box(2150, 1500, 300, 260, 180, 'anchor', { color: '#2a3c54', neon: '#8fd4ff' }),
        /* 高架管道（可从下方过） */
        box(430, 1180, 860, 50, 38, 'catwalk', { solid: false, elevated: true }),
        /* 守卫队哨站 */
        box(1300, 1250, 260, 200, 110, 'outpost', { color: '#33465e', neon: '#ffffff' }),
        /* 机库 */
        box(300, 1550, 380, 260, 160, 'hangar', { color: '#26374e' })
      ])
      .concat(row(140, 700, 140, 1900, 7, function (x, y) { return box(x, y, 80, 80, 90, 'debris'); }))
      .concat(row(600, 700, 2400, 700, 10, function (x, y, i) {
        return box(x, y, 100, 60, i % 3 === 0 ? 140 : 60, i % 3 === 0 ? 'pillar' : 'debris');
      }))
      .concat(scatter(22, 34, 300, 850, 2450, 1900, function (x, y, i, r) {
        var t = ['debris', 'rock', 'crate', 'cable', 'wreckplane', 'pillar'][i % 6];
        return box(x, y, r.range(50, 120), r.range(40, 90), r.range(30, 130), t, { solid: t !== 'cable' });
      })),
    npcs: [
      { id: 'madman', char: 'madman', x: 700, y: 1000, talk: 'ruins_madman', label: '疯疯癫癫的人' },
      { id: 'upright', char: 'upright', x: 1420, y: 1420, talk: 'ruins_upright', label: '守卫队长' },
      { id: 'lucky', char: 'lucky', x: 760, y: 1620, talk: 'ruins_lucky', label: '笑嘻嘻的机械师' },
      { id: 'ty', char: 'ty', x: 900, y: 1500, talk: 'ruins_ty', label: 'TY',
        cond: function () { return G.St.flag('tyAlive'); } },
      { id: 'broker', char: 'madman', x: 2000, y: 900, talk: 'ruins_broker', label: '兜帽商人' }
    ],
    zones: [
      { id: 'anchor7', x: 2280, y: 1620, r: 110, kind: 'trigger', label: '第七区老锚点下方' },
      { id: 'to_camp', x: 120, y: 1000, r: 90, kind: 'exit', label: '返回锈港', to: 'camp' },
      { id: 'to_storm', x: 2500, y: 400, r: 90, kind: 'exit', label: '前往风暴云域', to: 'storm' },
      { id: 'hangar_door', x: 480, y: 1700, r: 90, kind: 'hangar', label: '机库整备' },
      { id: 'sky_pad', x: 1700, y: 1700, r: 100, kind: 'sky', label: '发射台 · 出击' },
      { id: 'wreck_log', x: 1000, y: 1750, r: 80, kind: 'read', label: '一台还亮着的残骸日志仪', read: 'ruins_wrecklog' },
      { id: 'hide1', x: 250, y: 1150, r: 70, kind: 'hide', label: '躲进管道阴影' },
      { id: 'memorial', x: 1650, y: 1150, r: 80, kind: 'read', label: '墙上密密麻麻的名字', read: 'ruins_memorial' }
    ],
    lights: [
      { x: 1000, y: 400, r: 340, color: '#ff5f9e', a: .22 },
      { x: 1760, y: 380, r: 300, color: '#ff5f9e', a: .2 },
      { x: 2280, y: 1600, r: 380, color: '#8fd4ff', a: .28 },
      { x: 1430, y: 1330, r: 260, color: '#ffffff', a: .14 }
    ]
  };

  /* ============================================================
     区域3 · 风暴云域 —— 暗紫 + 闪电
     ============================================================ */
  M.storm = {
    id: 'storm', name: '雷云走廊', bg: 'storm',
    W: 2000, H: 2200,
    ground: { base: '#241243', accent: '#3d1c5c', grid: '#5a2a6e', kind: 'cloud' },
    amb: { tint: '#c9a8ff', a: .12 },
    music: 'storm',
    props: []
      .concat(walls(2000, 2200, 60, 'stormwall'))
      .concat([
        box(300, 400, 300, 260, 120, 'rockisle', { color: '#1b0f2e' }),
        box(1400, 500, 340, 280, 140, 'rockisle', { color: '#170d28' }),
        box(700, 1100, 600, 320, 90, 'rockisle', { color: '#1b0f2e' }),
        box(1500, 1600, 380, 300, 130, 'rockisle', { color: '#170d28' }),
        box(250, 1700, 320, 260, 110, 'rockisle', { color: '#1b0f2e' }),
        /* 风向标 */
        box(980, 980, 50, 50, 170, 'vane', { color: '#4a2a6a', glow: '#c9a8ff' })
      ])
      .concat(scatter(33, 26, 200, 300, 1800, 2050, function (x, y, i, r) {
        var t = ['rock', 'debris', 'crystal'][i % 3];
        return box(x, y, r.range(40, 100), r.range(36, 80), r.range(40, 150), t);
      })),
    npcs: [
      { id: 'madman', char: 'madman', x: 1000, y: 1500, talk: 'storm_madman', label: '疯疯癫癫的人' },
      { id: 'lucky', char: 'lucky', x: 620, y: 1230, talk: 'storm_lucky', label: '幸运儿',
        cond: function () { return !G.St.isDead('lucky'); } },
      { id: 'ty', char: 'ty', x: 1120, y: 1200, talk: 'storm_ty', label: 'TY',
        cond: function () { return G.St.flag('tyAlive'); } },
      { id: 'upright', char: 'upright', x: 1400, y: 1830, talk: 'storm_upright', label: '正直的人',
        cond: function () { return G.St.flag('uprightAlive'); } }
    ],
    zones: [
      { id: 'storm_deep', x: 1000, y: 700, r: 110, kind: 'trigger', label: '云层最深处' },
      { id: 'hide_spot', x: 330, y: 1780, r: 90, kind: 'trigger', label: '岩缝里有人' },
      { id: 'to_ruins', x: 120, y: 1100, r: 90, kind: 'exit', label: '返回都市残骸', to: 'ruins' },
      { id: 'to_factory', x: 1900, y: 300, r: 90, kind: 'exit', label: '前往机械工厂', to: 'factory' },
      { id: 'sky_pad', x: 780, y: 1180, r: 100, kind: 'sky', label: '风口 · 出击' },
      { id: 'hide1', x: 320, y: 480, r: 70, kind: 'hide', label: '躲进岩缝' },
      { id: 'shrine_note', x: 1560, y: 1680, r: 80, kind: 'read', label: '被雷击焦的木牌', read: 'storm_note' }
    ],
    lights: [
      { x: 1000, y: 1000, r: 300, color: '#c9a8ff', a: .2 }
    ]
  };

  /* ============================================================
     区域4 · 机械工厂 —— 铁灰 + 红光
     ============================================================ */
  M.factory = {
    id: 'factory', name: '第九车间', bg: 'factory',
    W: 2400, H: 1900,
    ground: { base: '#22272c', accent: '#32393f', grid: '#4a4038', kind: 'metal' },
    amb: { tint: '#ff5a3c', a: .10 },
    music: 'factory',
    props: []
      .concat(walls(2400, 1900, 60, 'ironwall'))
      .concat([
        /* 流水线 */
        box(200, 500, 1900, 90, 60, 'conveyor', { color: '#3a4147', solid: false }),
        box(200, 1000, 1900, 90, 60, 'conveyor', { color: '#3a4147', solid: false }),
        /* 机械臂 */
        box(500, 620, 90, 90, 220, 'armbase', { color: '#454d54', glow: '#ff3b2f' }),
        box(1100, 620, 90, 90, 220, 'armbase', { color: '#454d54', glow: '#ff3b2f' }),
        box(1700, 620, 90, 90, 220, 'armbase', { color: '#454d54', glow: '#ff3b2f' }),
        /* 培养舱 */
        box(400, 1400, 120, 120, 200, 'pod', { color: '#2a3138', glow: '#ff4a3c' }),
        box(600, 1400, 120, 120, 200, 'pod', { color: '#2a3138', glow: '#ff4a3c' }),
        box(800, 1400, 120, 120, 200, 'pod', { color: '#2a3138', glow: '#ff4a3c' }),
        /* 核心车间门 */
        box(1900, 1400, 320, 240, 260, 'gate', { color: '#3a2018', glow: '#ff3b2f' }),
        /* 管道桥 */
        box(340, 790, 900, 48, 36, 'catwalk', { solid: false, elevated: true })
      ])
      .concat(row(180, 1700, 2200, 1700, 12, function (x, y, i) {
        return box(x, y, 90, 60, i % 3 === 0 ? 150 : 70, i % 3 === 0 ? 'pipe' : 'crate');
      }))
      .concat(scatter(44, 24, 250, 1100, 2200, 1650, function (x, y, i, r) {
        var t = ['crate', 'barrel', 'debris', 'machine'][i % 4];
        return box(x, y, r.range(50, 100), r.range(40, 80), r.range(40, 120), t);
      })),
    npcs: [
      { id: 'ty', char: 'ty', x: 1000, y: 1200, talk: 'factory_ty', label: 'TY',
        cond: function () { return G.St.flag('tyAlive'); } },
      { id: 'lucky', char: 'lucky', x: 1400, y: 1100, talk: 'factory_lucky', label: '幸运儿',
        cond: function () { return !G.St.isDead('lucky'); } },
      { id: 'upright', char: 'upright', x: 700, y: 1150, talk: 'factory_upright', label: '正直的人',
        cond: function () { return G.St.flag('uprightAlive'); } }
    ],
    zones: [
      { id: 'lab_records', x: 700, y: 1520, r: 110, kind: 'trigger', label: '散落的实验记录' },
      { id: 'core_bay', x: 2060, y: 1520, r: 110, kind: 'trigger', label: '核心车间' },
      { id: 'to_storm', x: 120, y: 900, r: 90, kind: 'exit', label: '返回风暴云域', to: 'storm' },
      { id: 'to_shrine', x: 2300, y: 400, r: 90, kind: 'exit', label: '前往高空祭坛', to: 'shrine' },
      { id: 'sky_pad', x: 1500, y: 1650, r: 100, kind: 'sky', label: '升降台 · 出击' },
      { id: 'hangar_door', x: 260, y: 1200, r: 90, kind: 'hangar', label: '机库整备' },
      { id: 'hide1', x: 300, y: 1750, r: 70, kind: 'hide', label: '躲进管道后' },
      { id: 'scream_tape', x: 1000, y: 1600, r: 80, kind: 'read', label: '一段循环播放的录音', read: 'factory_tape' },
      { id: 'blood_wall', x: 1500, y: 1450, r: 80, kind: 'read', label: '墙上有指甲划出的字', read: 'factory_wall' }
    ],
    lights: [
      { x: 2060, y: 1500, r: 400, color: '#ff3b2f', a: .3 },
      { x: 600, y: 1400, r: 300, color: '#ff4a3c', a: .22 }
    ]
  };

  /* ============================================================
     区域5 · 高空祭坛 / 神殿 —— 暗绿 + 诡异静谧
     ============================================================ */
  M.shrine = {
    id: 'shrine', name: '无名祭坛', bg: 'shrine',
    W: 2000, H: 2000,
    ground: { base: '#14342a', accent: '#1e4a38', grid: '#2c6a4e', kind: 'stone' },
    amb: { tint: '#5fffb0', a: .10 },
    music: 'shrine',
    props: []
      .concat(walls(2000, 2000, 60, 'stonewall'))
      .concat([
        /* 主殿 */
        box(700, 300, 600, 340, 300, 'temple', { color: '#0c2018', glow: '#5fffb0' }),
        /* 阶梯（不挡路） */
        box(820, 660, 360, 300, 30, 'stairs', { solid: false, color: '#1a3a2c' })
      ])
      /* 列柱 */
      .concat(row(500, 1000, 500, 1800, 5, function (x, y) { return box(x, y, 90, 90, 260, 'pillar', { color: '#153025' }); }))
      .concat(row(1420, 1000, 1420, 1800, 5, function (x, y) { return box(x, y, 90, 90, 260, 'pillar', { color: '#153025' }); }))
      .concat([
        box(940, 1400, 130, 130, 60, 'altar', { color: '#1a3a2c', glow: '#4fe0a0' }),
        box(300, 500, 200, 200, 90, 'rockisle', { color: '#0a1a14' }),
        box(1600, 520, 200, 200, 90, 'rockisle', { color: '#0a1a14' })
      ])
      .concat(scatter(55, 20, 250, 900, 1750, 1900, function (x, y, i, r) {
        var t = ['rock', 'debris', 'statue', 'deadtree'][i % 4];
        return box(x, y, r.range(50, 90), r.range(40, 80), r.range(50, 140), t);
      })),
    npcs: [
      { id: 'friend', char: 'friend', x: 1000, y: 900, talk: 'shrine_friend', label: '朋友' },
      { id: 'ty', char: 'ty', x: 800, y: 1600, talk: 'shrine_ty', label: 'TY',
        cond: function () { return G.St.flag('tyAlive'); } },
      { id: 'upright', char: 'upright', x: 1200, y: 1650, talk: 'shrine_upright', label: '正直的人',
        cond: function () { return G.St.flag('uprightAlive'); } },
      { id: 'lucky', char: 'lucky', x: 640, y: 1350, talk: 'shrine_lucky', label: '幸运儿',
        cond: function () { return !G.St.isDead('lucky'); } }
    ],
    zones: [
      { id: 'shrine_top', x: 1000, y: 700, r: 120, kind: 'trigger', label: '祭坛顶层' },
      { id: 'to_factory', x: 120, y: 1000, r: 90, kind: 'exit', label: '返回机械工厂', to: 'factory' },
      { id: 'to_core', x: 1900, y: 1900, r: 90, kind: 'exit', label: '前往核心空域', to: 'core' },
      { id: 'sky_pad', x: 1000, y: 1800, r: 100, kind: 'sky', label: '祭坛平台 · 出击' },
      { id: 'hangar_door', x: 400, y: 1750, r: 90, kind: 'hangar', label: '机库整备' },
      { id: 'hide1', x: 280, y: 1500, r: 70, kind: 'hide', label: '躲到石像后' },
      { id: 'tablet', x: 950, y: 1300, r: 80, kind: 'read', label: '石板上刻着预言', read: 'shrine_tablet' }
    ],
    lights: [
      { x: 1000, y: 400, r: 380, color: '#5fffb0', a: .2 },
      { x: 950, y: 1380, r: 240, color: '#4fe0a0', a: .24 }
    ]
  };

  /* ============================================================
     区域6 · 核心空域 —— 血红 + 深紫 + 压迫感
     ============================================================ */
  M.core = {
    id: 'core', name: '核心空域 · 巢', bg: 'core',
    W: 2200, H: 2000,
    ground: { base: '#2a0414', accent: '#4a0a20', grid: '#8a1030', kind: 'flesh' },
    amb: { tint: '#ff2b4e', a: .12 },
    music: 'core',
    props: []
      .concat(walls(2200, 2000, 60, 'bonewall'))
      .concat([
        /* 王座结构 */
        box(800, 200, 600, 340, 380, 'throne', { color: '#1a0410', glow: '#ff2b4e' }),
        box(1000, 560, 200, 180, 40, 'stairs', { solid: false, color: '#3a0a20' }),
        /* 悬浮碎块 */
        box(300, 700, 260, 240, 150, 'rockisle', { color: '#16040e' }),
        box(1700, 760, 240, 220, 140, 'rockisle', { color: '#16040e' }),
        box(900, 1200, 400, 300, 80, 'rockisle', { color: '#1a0410' })
      ])
      .concat(row(400, 1600, 1800, 1600, 8, function (x, y, i) {
        return box(x, y, 80, 80, i % 2 ? 90 : 200, i % 2 ? 'bone' : 'spire', { color: '#2a0618' });
      }))
      .concat(scatter(66, 26, 250, 900, 1950, 1900, function (x, y, i, r) {
        var t = ['bone', 'debris', 'spire', 'rock'][i % 4];
        return box(x, y, r.range(50, 100), r.range(40, 80), r.range(50, 180), t, { color: '#2a0618' });
      })),
    npcs: [
      { id: 'ty', char: 'ty', x: 900, y: 1500, talk: 'core_ty', label: 'TY',
        cond: function () { return G.St.flag('tyAlive'); } },
      { id: 'madman', char: 'madman', x: 1500, y: 1300, talk: 'core_madman', label: '？？？' },
      { id: 'upright', char: 'upright', x: 700, y: 1400, talk: 'core_upright', label: '正直的人',
        cond: function () { return G.St.flag('uprightAlive'); } },
      { id: 'lucky', char: 'lucky', x: 1100, y: 1650, talk: 'core_lucky', label: '幸运儿',
        cond: function () { return !G.St.isDead('lucky'); } }
    ],
    zones: [
      { id: 'core_gate', x: 1100, y: 780, r: 130, kind: 'trigger', label: '巢的入口' },
      { id: 'to_shrine', x: 120, y: 1200, r: 90, kind: 'exit', label: '返回高空祭坛', to: 'shrine' },
      { id: 'sky_pad', x: 1100, y: 1800, r: 110, kind: 'sky', label: '最后的起飞点' },
      { id: 'hangar_door', x: 400, y: 1750, r: 90, kind: 'hangar', label: '机库整备' },
      { id: 'hide1', x: 300, y: 1550, r: 70, kind: 'hide', label: '躲进骨堆阴影' },
      { id: 'creed', x: 1600, y: 1650, r: 80, kind: 'read', label: '刻在骨头上的信条', read: 'core_creed' }
    ],
    lights: [
      { x: 1100, y: 300, r: 480, color: '#ff2b4e', a: .32 },
      { x: 1100, y: 1780, r: 300, color: '#ff5a7a', a: .2 }
    ]
  };

  G.mapOf = function (id) { return M[id] || M.camp; };

})(window);
