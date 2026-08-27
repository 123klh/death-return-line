/* ===========================================================
   state.js — 全局剧情状态（扁平、可克隆 → 死亡回归的存档点基础）
   =========================================================== */
(function (root) {
  'use strict';
  var G = root.G, U = G.U;

  var St = G.St = { s: null };

  function fresh() {
    return {
      /* 进度 */
      chapter: 0,            // 0=序章, 1..6
      beat: 0,               // 章内节拍索引
      region: 'camp',        // 当前区域

      /* 轮回 */
      loopCount: 0,
      deaths: 0,             // 累计死亡次数（含回归）
      sanity: 100,           // 精神值，回归会掉
      tyDecay: 0,            // TY 复活副作用累积 0..5
      tyRevived: 0,          // TY 被复活次数

      /* 旗标 */
      flags: {
        /* 序章 */
        gotPower: false, oldmanDead: false, triedSaveOldman: false,
        /* TY */
        tyFound: false, tyAlive: false, tyFleshHeld: false, tyFleshLost: false,
        /* 正直的人 */
        metUpright: false, warnedUpright: false, fatalCoreBroken: false,
        uprightAlive: false, uprightSurvived: false, uprightKnowsSecret: false,
        /* 其他角色 */
        metMadman: false, madmanRevealed: false,
        metLucky: false, luckyDead: false,
        metFriend: false, friendRevealed: false,
        puppetDead: false,
        /* 坏结局线索 */
        trustedBroker: false, readWreckLog: false, doomEarly: false,
        refusedReturn: false, killedTy: false, joinedBoss: false,
        /* 其他 */
        seenIfHint1: false, seenIfHint2: false, seenIfHint3: false,
        hangarUnlocked: false, everHid: false
      },

      /* 情报：解锁后对话/选项发生变化（「根据上一次的经验……」） */
      intel: {},

      /* 死亡名册（彩蛋结局星空 / 绝望值） */
      dead: {},

      /* 战斗数值 */
      upgrades: { power: 0, shield: 0, bombs: 0, speed: 0, buffer: 0 },
      intelPoints: 0,

      /* Boss 记录 */
      bossCleared: {},
      boss6Deaths: 0,        // 在 Boss6 阶段3 的战败次数 → IF 触发
      lastCheckpoint: null   // {chapter, beat, region}
    };
  }

  St.reset = function () {
    St.s = fresh();
    St.s.flags.uprightAlive = false;
    return St.s;
  };

  /* ---------- 快照 / 恢复（死亡回归） ---------- */
  St.snapshot = function () { return U.clone(St.s); };
  St.restore = function (snap) { St.s = U.clone(snap); };

  /* ---------- 旗标 ---------- */
  St.flag = function (k) { return !!St.s.flags[k]; };
  St.setFlag = function (k, v) { St.s.flags[k] = (v === undefined ? true : v); };

  /* ---------- 情报 ---------- */
  St.knows = function (k) { return !!St.s.intel[k]; };
  St.learn = function (k, label) {
    if (St.s.intel[k]) return false;
    St.s.intel[k] = label || true;
    if (G.Fx) G.Fx.float(640, 140, '获得情报：' + (label || k), '#9ff0ff', { size: 17, life: 1900, vy: -.25 });
    if (G.Aud.ready) G.Aud.sfx.powerup();
    return true;
  };
  St.intelList = function () {
    var a = [];
    for (var k in St.s.intel) a.push({ id: k, label: St.s.intel[k] === true ? k : St.s.intel[k] });
    return a;
  };

  /* ---------- 死亡名册 ---------- */
  St.kill = function (id) {
    if (!St.s.dead[id]) St.s.dead[id] = St.s.loopCount + 1;
    if (id === 'upright') St.s.flags.uprightAlive = false;
    if (id === 'ty') St.s.flags.tyAlive = false;
    if (id === 'lucky') St.s.flags.luckyDead = true;
    if (id === 'puppet') St.s.flags.puppetDead = true;
  };
  St.isDead = function (id) { return !!St.s.dead[id]; };
  St.deadCount = function () { var n = 0; for (var k in St.s.dead) n++; return n; };

  /* ---------- 精神 / 绝望 ---------- */
  St.addSanity = function (n) {
    St.s.sanity = U.clamp(St.s.sanity + n, 0, 100);
  };
  /* 绝望值：决定坏结局D 选项是否出现 */
  St.despair = function () {
    var d = 0;
    if (St.isDead('oldman')) d += 14;
    if (St.isDead('upright')) d += 14;
    if (St.isDead('puppet')) d += 22;
    if (St.isDead('lucky')) d += 16;
    if (St.s.flags.friendRevealed) d += 12;
    d += St.s.loopCount * 4;
    d += (100 - St.s.sanity) * .55;
    return d;
  };

  /* ---------- 一次回归的副作用 ---------- */
  St.applyReturn = function () {
    var s = St.s;
    s.loopCount++;
    /* deaths 由 Loop.onDeath 统一累加——以前这里也加一次，导致结局卡上的数字翻倍 */
    var loss = 6 - s.upgrades.buffer * 1.2;
    St.addSanity(-Math.max(1.5, loss));
    if (s.flags.tyAlive) {
      s.tyDecay = U.clamp(s.tyDecay + 1, 0, 5);
      s.tyRevived++;
    }
  };

  /* ---------- 升级 ---------- */
  St.upgradeCost = function (key) {
    var lv = St.s.upgrades[key] || 0;
    return 120 + lv * 110;
  };
  St.canUpgrade = function (key) {
    return (St.s.upgrades[key] || 0) < 5 && St.s.intelPoints >= St.upgradeCost(key);
  };
  St.doUpgrade = function (key) {
    if (!St.canUpgrade(key)) return false;
    St.s.intelPoints -= St.upgradeCost(key);
    St.s.upgrades[key]++;
    return true;
  };
  St.addPoints = function (n) {
    St.s.intelPoints += Math.round(n);
  };

  /* ---------- 存档点 ---------- */
  St.setCheckpoint = function (cp) {
    St.s.lastCheckpoint = cp;
  };

  /* ---------- 难度 ---------- */
  St.diff = function () { return G.Save.settings().difficulty; };

  St.reset();

})(window);
