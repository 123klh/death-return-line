/* ===========================================================
   difficulty.js — 三档难度的全部数值集中配置
   =========================================================== */
(function (root) {
  'use strict';
  var G = root.G;

  var D = G.Diff = {
    easy: {
      key: 'easy', label: '简单', desc: '弹幕稀疏、轨迹直来直去、有明显安全区',
      color: '#7CE04A',
      /* 玩家 */
      playerHp: 8, playerLives: 5, bombs: 4, invMs: 2200, playerSpd: 4.6, playerPower: 1.25,
      /* 小怪 */
      mobDensity: .55, mobHp: .6, mobSpd: .78, mobKinds: 1, mobFireRate: .55,
      /* Boss */
      bossHp: .62, bossFireRate: .6, bossBulletSpd: .74, bossPattern: 'easy',
      telegraph: 1.7,          // 预警时间倍率
      /* 奖励 */
      reward: 1,
      /* 弹幕上限 */
      maxBullets: 900,
      grazeBonus: 1
    },
    normal: {
      key: 'normal', label: '普通', desc: '中等密度、加入追踪与反弹、安全区缩小',
      color: '#6FD8FF',
      playerHp: 6, playerLives: 3, bombs: 3, invMs: 1700, playerSpd: 4.3, playerPower: 1,
      mobDensity: 1, mobHp: 1, mobSpd: 1, mobKinds: 3, mobFireRate: 1,
      bossHp: 1, bossFireRate: 1, bossBulletSpd: 1, bossPattern: 'normal',
      telegraph: 1,
      reward: 1.5,
      maxBullets: 1400,
      grazeBonus: 1.4
    },
    hard: {
      key: 'hard', label: '困难', desc: '密集复合弹幕、高速随机变向、几乎无安全区',
      color: '#FF5F7A',
      playerHp: 4, playerLives: 2, bombs: 2, invMs: 1300, playerSpd: 4.1, playerPower: .9,
      mobDensity: 1.7, mobHp: 1.7, mobSpd: 1.3, mobKinds: 5, mobFireRate: 1.6,
      bossHp: 1.65, bossFireRate: 1.55, bossBulletSpd: 1.28, bossPattern: 'hard',
      telegraph: .55,
      reward: 2.5,
      maxBullets: 2000,
      grazeBonus: 2
    }
  };

  G.diffCfg = function () { return D[G.Save.settings().difficulty] || D.normal; };
  G.diffList = ['easy', 'normal', 'hard'];

})(window);
