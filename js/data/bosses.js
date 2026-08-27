/* ===========================================================
   bosses.js — 6 场 Boss，每场 3 档难度各一套弹幕 + 多阶段形态
   弹幕脚本为 generator：yield 帧数
   =========================================================== */
(function (root) {
  'use strict';
  var G = root.G, U = G.U;

  var B = G.Bosses = {};
  var PI = Math.PI, TAU = U.TAU;

  /* ---------- 绘制辅助 ---------- */
  function glowAt(ctx, x, y, r, color, a) {
    var s = G.Fx.glowSprite(color);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = a === undefined ? .6 : a;
    ctx.drawImage(s, x - r, y - r, r * 2, r * 2);
    ctx.restore();
  }
  function wingPair(ctx, r, t, col, form) {
    var flap = Math.sin(t * .0016) * .18 + (form || 0) * .12;
    [-1, 1].forEach(function (s) {
      ctx.save();
      ctx.scale(s, 1);
      ctx.rotate(flap);
      var g = ctx.createLinearGradient(r * .4, 0, r * 2.2, r * .6);
      g.addColorStop(0, U.shade(col, -.1));
      g.addColorStop(1, U.shade(col, -.55));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(r * .4, -r * .3);
      ctx.lineTo(r * 2.3, r * .1);
      ctx.lineTo(r * 2.0, r * .55);
      ctx.lineTo(r * .4, r * .5);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = U.rgba(U.shade(col, -.7), .8);
      ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
    });
  }

  /* ============================================================
     Boss 1 · 追杀者 —— 教学 Boss，简单规律型
     ============================================================ */
  B.boss1 = {
    id: 'boss1', name: '追猎队长', title: '奉命夺取「禁忌」的人', who: 'hunter',
    color: '#FF6B4A', r: 44, bgm: 'boss1',
    hp: { easy: 1700, normal: 2800, hard: 4400 },
    draw: function (ctx, b, t) {
      var c = this.color;
      glowAt(ctx, 0, 0, b.r * 2.6, c, .42);
      wingPair(ctx, b.r, t, c, b.form);
      /* 机身 */
      var g = ctx.createLinearGradient(0, -b.r, 0, b.r);
      g.addColorStop(0, U.shade(c, .45));
      g.addColorStop(.5, c);
      g.addColorStop(1, U.shade(c, -.45));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, b.r * 1.15);
      ctx.lineTo(b.r * .55, b.r * .2);
      ctx.lineTo(b.r * .34, -b.r * 1.0);
      ctx.lineTo(0, -b.r * 1.25);
      ctx.lineTo(-b.r * .34, -b.r * 1.0);
      ctx.lineTo(-b.r * .55, b.r * .2);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = U.rgba(U.shade(c, -.65), .9); ctx.lineWidth = 2.4; ctx.stroke();
      /* 驾驶舱（单眼） */
      glowAt(ctx, 0, -b.r * .35, b.r * 1.1, '#ffd479', .7);
      ctx.fillStyle = '#fff2c8';
      ctx.beginPath(); ctx.ellipse(0, -b.r * .35, b.r * .2, b.r * .3, 0, 0, TAU); ctx.fill();
      /* 二阶段：加装炮塔 */
      if (b.form >= 1) {
        [-1, 1].forEach(function (s) {
          ctx.save();
          ctx.translate(s * b.r * .8, b.r * .3);
          ctx.rotate(Math.sin(t * .003) * .3 * s);
          ctx.fillStyle = U.shade(c, -.3);
          ctx.fillRect(-5, 0, 10, b.r * .8);
          ctx.restore();
        });
        glowAt(ctx, 0, b.r * .9, b.r * 1.4, '#ff2b3e', .5 + .2 * Math.sin(t * .008));
      }
      /* 引擎焰 */
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      var fl = .7 + Math.random() * .3;
      var fg = ctx.createLinearGradient(0, -b.r * 1.0, 0, -b.r * (1.0 + fl));
      fg.addColorStop(0, 'rgba(255,220,160,.9)');
      fg.addColorStop(1, 'rgba(255,90,40,0)');
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.moveTo(-b.r * .22, -b.r * 1.0); ctx.lineTo(b.r * .22, -b.r * 1.0);
      ctx.lineTo(0, -b.r * (1.0 + fl * 1.4));
      ctx.closePath(); ctx.fill();
      ctx.restore();
    },
    move: function (b, api, f) {
      if (b.phase === 0) b.ux = 640 + Math.sin(b.t * .0009) * 260;
      else b.ux = 640 + Math.sin(b.t * .0016) * 320;
      b.uy = 160 + Math.sin(b.t * .0012) * 30;
    },
    phases: [
      {
        hpFrom: 1, form: 0,
        pattern: {
          easy: function* (api, b) {
            for (;;) {
              yield* nWait(30);
              api.fan({ x: b.x, y: b.y, n: 5, spread: .7, spd: 2.0, r: 8, color: '#ff8a5a' });
              G.Aud.sfx.enemyShoot();
              yield 70;
              api.ring({ x: b.x, y: b.y, n: 8, spd: 1.8, r: 8, color: '#ffb15e' });
              yield 90;
            }
          },
          normal: function* (api, b) {
            for (;;) {
              api.fan({ x: b.x, y: b.y, n: 9, spread: 1.0, spd: 2.6, r: 7, color: '#ff8a5a' });
              G.Aud.sfx.enemyShoot();
              yield 44;
              api.ring({ x: b.x, y: b.y, n: 14, spd: 2.2, r: 7, color: '#ffb15e', off: b.t * .001 });
              yield 46;
              api.wall({ y: -20, n: 11, spd: 2.6, r: 8, color: '#ff6a4a' });
              yield 60;
              api.homing({ x: b.x, y: b.y, n: 2, spd: 2.0, r: 6.5, color: '#ff5f7a', turn: .026, life: 300 });
              yield 54;
            }
          },
          hard: function* (api, b) {
            var ang = 0;
            for (;;) {
              for (var i = 0; i < 6; i++) {
                api.spiral({ x: b.x, y: b.y, arms: 4, a0: ang, spd: 3.0, r: 6.5, color: '#ff8a5a' });
                ang += .42;
                yield 6;
              }
              api.fan({ x: b.x, y: b.y, n: 13, spread: 1.3, spd: 3.2, r: 7, color: '#ff4a3c' });
              G.Aud.sfx.enemyShoot();
              yield 30;
              api.wall({ y: -20, n: 15, spd: 3.2, r: 8, color: '#ff6a4a' });
              yield 26;
              api.homing({ x: b.x, y: b.y, n: 3, spd: 2.4, r: 6.5, color: '#ff5f7a', turn: .04, life: 340 });
              yield 40;
            }
          }
        }
      },
      {
        hpFrom: .5, form: 1, title: '追猎形态 · 解放', bark: '禁忌之物……不需要活着交出来！',
        pattern: {
          easy: function* (api, b) {
            for (;;) {
              api.fan({ x: b.x, y: b.y, n: 7, spread: .9, spd: 2.2, r: 8, color: '#ff6a4a' });
              yield 60;
              api.aimed({ x: b.x, y: b.y, n: 3, spread: .3, spd: 2.6, r: 7, color: '#ffb15e' });
              yield 70;
              api.laser({ x: b.x, y: b.y, a: api.aimA(b.x, b.y), w: 14, len: 900, ms: 400, color: '#ff5a3c' });
              G.Aud.sfx.laser();
              yield 90;
            }
          },
          normal: function* (api, b) {
            for (;;) {
              api.ring({ x: b.x, y: b.y, n: 18, spd: 2.4, r: 7, color: '#ffb15e', off: b.t * .002 });
              yield 34;
              api.fan({ x: b.x, y: b.y, n: 11, spread: 1.1, spd: 3.0, r: 7, color: '#ff6a4a' });
              yield 34;
              /* 双激光扫射 */
              var a0 = api.aimA(b.x, b.y);
              api.warnLine(b, a0 - .5, 34);
              api.warnLine(b, a0 + .5, 34);
              yield 34;
              api.laser({ x: b.x, y: b.y, a: a0 - .5, w: 12, len: 1000, ms: 480, color: '#ff5a3c', rotate: .004 });
              api.laser({ x: b.x, y: b.y, a: a0 + .5, w: 12, len: 1000, ms: 480, color: '#ff5a3c', rotate: -.004 });
              G.Aud.sfx.laser();
              yield 66;
              api.homing({ x: b.x, y: b.y, n: 4, spd: 2.2, r: 6.5, color: '#ff5f7a', turn: .03, life: 320 });
              yield 50;
            }
          },
          hard: function* (api, b) {
            var ang = 0;
            for (;;) {
              for (var i = 0; i < 10; i++) {
                api.spiral({ x: b.x, y: b.y, arms: 5, a0: ang, spd: 3.4, r: 6, color: '#ff8a5a' });
                ang += .5;
                yield 4;
              }
              var a0 = api.aimA(b.x, b.y);
              for (var k = -2; k <= 2; k++) api.warnLine(b, a0 + k * .34, 24);
              yield 24;
              for (var k2 = -2; k2 <= 2; k2++) {
                api.laser({ x: b.x, y: b.y, a: a0 + k2 * .34, w: 10, len: 1100, ms: 420, color: '#ff2b3e' });
              }
              G.Aud.sfx.laser();
              yield 44;
              api.wall({ y: -20, n: 17, spd: 3.6, r: 8, color: '#ff6a4a', gapW: 1 });
              yield 22;
              api.wall({ y: -20, n: 17, spd: 3.6, r: 8, color: '#ff6a4a', gapW: 1 });
              yield 30;
              api.homing({ x: b.x, y: b.y, n: 5, spd: 2.6, r: 6.5, color: '#ff5f7a', turn: .045, life: 360 });
              yield 36;
            }
          }
        }
      }
    ]
  };
  function* nWait(n) { yield n; }

  /* ============================================================
     Boss 2 · 疯癫角色（疯癫态） —— 混乱无序型
     ============================================================ */
  B.boss2 = {
    id: 'boss2', name: '疯子', title: '嘿嘿嘿嘿嘿嘿嘿嘿', who: 'madman',
    color: '#FFE23A', r: 42, bgm: 'boss2',
    hp: { easy: 2000, normal: 3300, hard: 5200 },
    draw: function (ctx, b, t) {
      var c = this.color;
      var wob = Math.sin(t * .005) * .22 + Math.sin(t * .013) * .1;
      ctx.save();
      ctx.rotate(wob);
      glowAt(ctx, 0, 0, b.r * 3, c, .4 + .12 * Math.sin(t * .01));
      /* 不规则机体：多边形抖动 */
      var n = 9;
      ctx.beginPath();
      for (var i = 0; i < n; i++) {
        var a = i / n * TAU;
        var rr = b.r * (1 + Math.sin(t * .006 + i * 2.1) * .22);
        var x = Math.cos(a) * rr, y = Math.sin(a) * rr * 1.05;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      var g = ctx.createRadialGradient(-b.r * .2, -b.r * .3, 2, 0, 0, b.r * 1.2);
      g.addColorStop(0, '#fff6c0');
      g.addColorStop(.55, c);
      g.addColorStop(1, U.shade(c, -.5));
      ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = U.rgba(U.shade(c, -.7), .9); ctx.lineWidth = 2.6; ctx.stroke();
      /* 漩涡眼 */
      [-1, 1].forEach(function (s) {
        ctx.save();
        ctx.translate(s * b.r * .36, -b.r * .18);
        ctx.strokeStyle = '#3a2a00';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        for (var k = 0; k < 22; k++) {
          var aa = k * .5 + t * .006 * s;
          var r2 = 1 + k * .55;
          var px = Math.cos(aa) * r2, py = Math.sin(aa) * r2;
          if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.restore();
      });
      /* 咧嘴 */
      ctx.strokeStyle = '#3a2a00'; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-b.r * .4, b.r * .34);
      for (var m = 0; m <= 6; m++) {
        ctx.lineTo(-b.r * .4 + b.r * .8 * m / 6, b.r * (.34 + (m % 2 ? .14 : -.02)));
      }
      ctx.stroke();
      /* 三阶段：正经化 */
      if (b.form >= 2) {
        ctx.restore();
        ctx.save();
        glowAt(ctx, 0, 0, b.r * 2.4, '#B8860B', .6);
        ctx.strokeStyle = '#B8860B'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, 0, b.r * 1.15, 0, TAU); ctx.stroke();
        /* 直线眼 */
        ctx.strokeStyle = '#241a00'; ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-b.r * .6, -b.r * .18); ctx.lineTo(-b.r * .14, -b.r * .18);
        ctx.moveTo(b.r * .14, -b.r * .18); ctx.lineTo(b.r * .6, -b.r * .18);
        ctx.stroke();
      }
      ctx.restore();
    },
    move: function (b, api, f) {
      /* 瞬移式乱窜 */
      if (b.t - (b.lastTp || 0) > (b.form >= 2 ? 2200 : 1200)) {
        b.lastTp = b.t;
        b.ux = U.rand(320, 960);
        b.uy = U.rand(110, 260);
        G.Fx.ring(b.x, b.y, { color: '#FFE23A', r: 8, r2: 140, life: 400 });
      }
    },
    phases: [
      {
        hpFrom: 1, form: 0,
        pattern: {
          easy: function* (api, b) {
            for (;;) {
              api.ring({ x: b.x, y: b.y, n: 7, spd: 1.9, r: 9, color: '#ffe23a', off: Math.random() * TAU });
              yield 76;
              api.aimed({ x: b.x, y: b.y, n: 2, spread: .5, spd: 2.2, r: 8, color: '#ffcf5a' });
              yield 80;
            }
          },
          normal: function* (api, b) {
            for (;;) {
              /* 随机方向乱撒 */
              for (var i = 0; i < 8; i++) {
                api.shoot({ x: b.x, y: b.y, a: Math.random() * TAU, spd: U.rand(1.6, 3.4),
                            r: U.rand(6, 10), color: U.pick(['#ffe23a', '#ffcf5a', '#ffb15e']),
                            kind: U.pick(['orb', 'petal']), wobble: U.rand(0, 1.2) });
                yield 3;
              }
              yield 24;
              api.ring({ x: b.x, y: b.y, n: 16, spd: 2.4, r: 8, color: '#ffe23a', off: Math.random() * TAU });
              G.Aud.sfx.enemyShoot();
              yield 32;
              /* 反弹弹 */
              for (var k = 0; k < 5; k++) {
                api.shoot({ x: b.x, y: b.y, a: Math.random() * TAU, spd: 2.8, r: 8,
                            color: '#fff0a0', kind: 'shard', bounce: 3, life: 900 });
              }
              yield 46;
            }
          },
          hard: function* (api, b) {
            for (;;) {
              for (var i = 0; i < 14; i++) {
                api.shoot({ x: b.x, y: b.y, a: Math.random() * TAU, spd: U.rand(2, 4.2),
                            r: U.rand(5, 9), color: U.pick(['#ffe23a', '#ffcf5a', '#ff9a3c']),
                            kind: U.pick(['orb', 'petal', 'shard']), wobble: U.rand(0, 2),
                            bounce: Math.random() < .4 ? 2 : 0 });
                yield 2;
              }
              api.ring({ x: b.x, y: b.y, n: 26, spd: 3.0, r: 7, color: '#ffe23a', off: Math.random() * TAU });
              yield 20;
              api.ring({ x: b.x, y: b.y, n: 26, spd: 2.2, r: 7, color: '#ffb15e', off: Math.random() * TAU });
              yield 22;
              api.homing({ x: b.x, y: b.y, n: 4, spd: 2.4, r: 7, color: '#ffcf5a', turn: .05, life: 400 });
              yield 30;
            }
          }
        }
      },
      {
        hpFrom: .62, form: 1, title: '疯笑 · 加速', bark: '嘿嘿嘿！打不到！打不到！你打不到我呀！',
        pattern: {
          easy: function* (api, b) {
            for (;;) {
              api.ring({ x: b.x, y: b.y, n: 10, spd: 2.1, r: 9, color: '#ffe23a', off: Math.random() * TAU });
              yield 64;
              api.fan({ x: b.x, y: b.y, n: 5, spread: 1.0, spd: 2.4, r: 8, color: '#ffb15e' });
              yield 70;
            }
          },
          normal: function* (api, b) {
            for (;;) {
              /* 双螺旋反向 */
              for (var i = 0; i < 24; i++) {
                api.shoot({ x: b.x, y: b.y, a: i * .52, spd: 2.6, r: 7, color: '#ffe23a', kind: 'petal' });
                api.shoot({ x: b.x, y: b.y, a: -i * .52, spd: 2.2, r: 7, color: '#ffb15e', kind: 'petal' });
                yield 3;
              }
              yield 30;
              for (var k = 0; k < 8; k++) {
                api.shoot({ x: b.x, y: b.y, a: Math.random() * TAU, spd: 3.2, r: 9,
                            color: '#fff0a0', kind: 'shard', bounce: 4, life: 1000 });
              }
              yield 44;
            }
          },
          hard: function* (api, b) {
            var ang = 0;
            for (;;) {
              for (var i = 0; i < 30; i++) {
                ang += .77;
                api.spiral({ x: b.x, y: b.y, arms: 3, a0: ang, spd: 3.2, r: 6.5, color: '#ffe23a', kind: 'petal' });
                api.spiral({ x: b.x, y: b.y, arms: 3, a0: -ang * 1.3, spd: 2.6, r: 6.5, color: '#ffb15e', kind: 'petal' });
                yield 2;
              }
              yield 16;
              for (var k = 0; k < 14; k++) {
                api.shoot({ x: b.x, y: b.y, a: Math.random() * TAU, spd: 3.6, r: 8,
                            color: '#fff0a0', kind: 'shard', bounce: 5, life: 1100 });
              }
              yield 30;
              api.homing({ x: b.x, y: b.y, n: 6, spd: 2.8, r: 7, color: '#ffcf5a', turn: .055, life: 420 });
              yield 26;
            }
          }
        }
      },
      {
        hpFrom: .26, form: 2, title: '……收起笑容', bark: '……你比上一次强了。{记录完毕}', bgm: 'boss2',
        pattern: {
          easy: function* (api, b) {
            for (;;) {
              /* 极其规整的几何弹 —— 与前面的混乱形成对照 */
              api.ring({ x: b.x, y: b.y, n: 8, spd: 2.0, r: 8, color: '#B8860B', kind: 'square' });
              yield 80;
              api.wall({ y: -20, n: 9, spd: 2.2, r: 8, color: '#d0a020', gapW: 2 });
              yield 84;
            }
          },
          normal: function* (api, b) {
            var ang = 0;
            for (;;) {
              for (var i = 0; i < 12; i++) {
                api.spiral({ x: b.x, y: b.y, arms: 6, a0: ang, spd: 2.6, r: 7, color: '#B8860B', kind: 'square' });
                ang += TAU / 6 / 12;
                yield 5;
              }
              yield 26;
              api.wall({ y: -20, n: 13, spd: 2.8, r: 8, color: '#d0a020', gapW: 1 });
              yield 30;
              api.aimed({ x: b.x, y: b.y, n: 7, spread: .5, spd: 3.2, r: 6.5, color: '#fff0a0', kind: 'needle' });
              yield 46;
            }
          },
          hard: function* (api, b) {
            var ang = 0;
            for (;;) {
              /* 几何完美：无浪费的密网 */
              for (var i = 0; i < 20; i++) {
                api.spiral({ x: b.x, y: b.y, arms: 8, a0: ang, spd: 3.0, r: 6, color: '#B8860B', kind: 'square' });
                ang += TAU / 8 / 20;
                yield 3;
              }
              api.wall({ y: -20, n: 17, spd: 3.4, r: 8, color: '#d0a020', gapW: 1 });
              yield 20;
              api.wall({ y: -20, n: 17, spd: 3.4, r: 8, color: '#d0a020', gapW: 1 });
              yield 20;
              api.aimed({ x: b.x, y: b.y, n: 11, spread: .7, spd: 3.8, r: 6, color: '#fff0a0', kind: 'needle' });
              yield 34;
              var a0 = api.aimA(b.x, b.y);
              api.warnLine(b, a0, 20);
              yield 20;
              api.laser({ x: b.x, y: b.y, a: a0, w: 16, len: 1100, ms: 500, color: '#d0a020', rotate: .006 });
              G.Aud.sfx.laser();
              yield 40;
            }
          }
        }
      }
    ]
  };

  /* ============================================================
     Boss 3 · 封锁者·裁决 —— 高密度封锁型（IF 线分支点）
     ============================================================ */
  B.boss3 = {
    id: 'boss3', name: '裁决封锁机', title: '教团 · 空域封锁兵器', who: 'hunter',
    color: '#4FA8FF', r: 52, bgm: 'boss3',
    hp: { easy: 2600, normal: 4200, hard: 6600 },
    draw: function (ctx, b, t) {
      var c = this.color;
      glowAt(ctx, 0, 0, b.r * 3, c, .4);
      /* 三段式机体 */
      ctx.save();
      ctx.rotate(Math.sin(t * .0008) * .06);
      /* 侧翼封锁臂 */
      [-1, 1].forEach(function (s) {
        ctx.save();
        ctx.scale(s, 1);
        /* 挂架：机体与封锁臂之间必须有连接结构，
           否则两块侧翼看起来是浮在旁边的两张卡片，而不是同一台机器 */
        ctx.fillStyle = U.shade(c, -.44);
        ctx.fillRect(b.r * .5, -b.r * .19, b.r * .52, b.r * .38);
        ctx.strokeStyle = U.rgba(U.shade(c, -.72), .9); ctx.lineWidth = 2;
        ctx.strokeRect(b.r * .5, -b.r * .19, b.r * .52, b.r * .38);
        ctx.fillStyle = U.rgba(U.shade(c, .35), .5);
        ctx.fillRect(b.r * .5, -b.r * .19, b.r * .52, 3);
        ctx.translate(b.r * .88, 0);
        ctx.rotate(Math.sin(t * .0014) * .16 * s);
        var g2 = ctx.createLinearGradient(0, -b.r * .6, 0, b.r * .6);
        g2.addColorStop(0, U.shade(c, .3));
        g2.addColorStop(1, U.shade(c, -.5));
        ctx.fillStyle = g2;
        U.roundRect(ctx, 0, -b.r * .55, b.r * 1.5, b.r * 1.1, 8);
        ctx.fill();
        ctx.strokeStyle = U.rgba(U.shade(c, -.7), .9); ctx.lineWidth = 2; ctx.stroke();
        /* 发射口 */
        for (var i = 0; i < 4; i++) {
          ctx.fillStyle = U.rgba('#bfe8ff', .5 + .4 * Math.abs(Math.sin(t * .004 + i)));
          ctx.fillRect(b.r * 1.2, -b.r * .4 + i * b.r * .26, b.r * .3, 5);
        }
        ctx.restore();
      });
      /* 主体 */
      var g = ctx.createLinearGradient(0, -b.r, 0, b.r);
      g.addColorStop(0, '#dff4ff');
      g.addColorStop(.4, c);
      g.addColorStop(1, U.shade(c, -.5));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, -b.r * 1.15);
      ctx.lineTo(b.r * .7, -b.r * .3);
      ctx.lineTo(b.r * .5, b.r * 1.0);
      ctx.lineTo(-b.r * .5, b.r * 1.0);
      ctx.lineTo(-b.r * .7, -b.r * .3);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = U.rgba(U.shade(c, -.7), .95); ctx.lineWidth = 3; ctx.stroke();
      /* 核心 */
      glowAt(ctx, 0, 0, b.r * 1.6, b.form >= 1 ? '#ffe9a8' : '#bfe8ff', .7);
      ctx.fillStyle = b.form >= 1 ? '#fff6d0' : '#eaf8ff';
      ctx.beginPath(); ctx.arc(0, 0, b.r * .3, 0, TAU); ctx.fill();
      /* 二阶段：展开的裁决环 */
      if (b.form >= 1) {
        ctx.save();
        ctx.rotate(t * .0016);
        ctx.strokeStyle = U.rgba('#ffe9a8', .8);
        ctx.lineWidth = 3;
        for (var k = 0; k < 2; k++) {
          ctx.beginPath();
          ctx.ellipse(0, 0, b.r * (1.5 + k * .3), b.r * (.55 + k * .2), k * .9, 0, TAU);
          ctx.stroke();
        }
        ctx.restore();
      }
      ctx.restore();
    },
    move: function (b, api, f) {
      b.ux = 640 + Math.sin(b.t * .0007) * 280;
      b.uy = 170;
    },
    onCoreBreak: function (api, b) {
      /* 击破蓄力核心 → 致命一击被取消 → IF 线前提之一 */
      api.flagSet('fatalCoreBroken');
      api.say('upright', '……好判断！我不用冲了！', 3200);
      G.Fx.float(640, 300, '致命一击已被瓦解', '#ffe9a8', { size: 26, life: 2200, vy: -.1 });
      G.St.learn('core_break', '裁决机的蓄力核心可以被击破 —— 那道致命弹幕不是必然的');
    },
    phases: [
      {
        hpFrom: 1, form: 0,
        pattern: {
          easy: function* (api, b) {
            for (;;) {
              api.wall({ y: -20, n: 9, spd: 2.0, r: 9, color: '#ff9a5e', gapW: 3 });
              yield 80;
              api.fan({ x: b.x, y: b.y, n: 5, spread: .8, spd: 2.2, r: 8, color: '#ffd08a' });
              yield 80;
            }
          },
          normal: function* (api, b) {
            for (;;) {
              api.wall({ y: -20, n: 13, spd: 2.6, r: 8, color: '#ff9a5e', gapW: 2 });
              yield 40;
              api.wall({ y: -20, n: 13, spd: 2.6, r: 8, color: '#ff9a5e', gapW: 2 });
              yield 44;
              api.ring({ x: b.x, y: b.y, n: 20, spd: 2.4, r: 7, color: '#ffd08a', kind: 'ringlet' });
              yield 40;
              /* 左右封锁臂交叉射线 */
              api.laser({ x: b.x - 90, y: b.y, a: PI / 2 + .3, w: 11, len: 900, ms: 460, color: '#ff6a3c' });
              api.laser({ x: b.x + 90, y: b.y, a: PI / 2 - .3, w: 11, len: 900, ms: 460, color: '#ff6a3c' });
              G.Aud.sfx.laser();
              yield 60;
            }
          },
          hard: function* (api, b) {
            var ang = 0;
            for (;;) {
              api.wall({ y: -20, n: 17, spd: 3.2, r: 8, color: '#ff9a5e', gapW: 1 });
              yield 24;
              api.wall({ y: -20, n: 17, spd: 3.2, r: 8, color: '#ff9a5e', gapW: 1 });
              yield 24;
              for (var i = 0; i < 10; i++) {
                api.spiral({ x: b.x, y: b.y, arms: 6, a0: ang, spd: 3.0, r: 6.5, color: '#ffd08a', kind: 'ringlet' });
                ang += .38;
                yield 4;
              }
              for (var k = -1; k <= 1; k++) {
                api.laser({ x: b.x + k * 90, y: b.y, a: PI / 2 + k * .35, w: 10, len: 1000, ms: 520, color: '#ff6a3c', rotate: k * .003 });
              }
              G.Aud.sfx.laser();
              yield 56;
              api.homing({ x: b.x, y: b.y, n: 4, spd: 2.4, r: 6.5, color: '#ff9a5e', turn: .04, life: 340 });
              yield 30;
            }
          }
        }
      },
      {
        hpFrom: .55, form: 1, title: '裁决模式', bark: '——判定：清除。',
        pattern: {
          easy: function* (api, b) { yield* fatalCycle(api, b, 'easy'); },
          normal: function* (api, b) { yield* fatalCycle(api, b, 'normal'); },
          hard: function* (api, b) { yield* fatalCycle(api, b, 'hard'); }
        }
      }
    ]
  };

  /* Boss3 阶段2：周期性蓄力「致命一击」，可击破核心 */
  function* fatalCycle(api, b, diff) {
    var n = diff === 'easy' ? 9 : diff === 'normal' ? 13 : 17;
    var spd = diff === 'easy' ? 2.2 : diff === 'normal' ? 2.8 : 3.4;
    var gapW = diff === 'easy' ? 3 : diff === 'normal' ? 2 : 1;
    var firstFatal = true;
    for (;;) {
      /* 常规封锁 */
      api.wall({ y: -20, n: n, spd: spd, r: 8, color: '#ff9a5e', gapW: gapW });
      yield diff === 'hard' ? 26 : 48;
      api.ring({ x: b.x, y: b.y, n: diff === 'hard' ? 26 : 18, spd: spd - .2, r: 7, color: '#ffd08a', kind: 'ringlet' });
      yield diff === 'hard' ? 30 : 54;

      /* —— 蓄力：致命一击 —— */
      api.say('hunter', '装填……裁决弹幕。', 2200);
      var core = api.spawnCore({ hp: diff === 'easy' ? 260 : diff === 'normal' ? 420 : 640,
                                 warnMs: Math.round(2000 * api.tele) });
      G.Aud.sfx.charge(2.0);
      G.Fx.setRedEdge(.5, 500);
      if (firstFatal) {
        G.Fx.float(640, 400, '打掉那个核心！', '#ffe9a8', { size: 22, life: 2400, vy: -.1 });
        firstFatal = false;
      }
      var frames = Math.round(120 * api.tele);
      var waited = 0;
      while (waited < frames) {
        if (!b.core || b.core.broken) break;
        /* 蓄力期间的压制弹 */
        if (waited % 26 === 0) {
          api.ring({ x: b.x, y: b.y, n: 8, spd: 1.6, r: 7, color: '#ffab6a' });
        }
        yield 4; waited += 4;
      }
      G.Fx.setRedEdge(0, 600);

      if (b.core && !b.core.broken) {
        /* 未击破 → 致命弹幕（正直的人会挡） */
        api.say('hunter', '——判定：清除。', 1800);
        G.Aud.sfx.laser();
        G.Fx.flash('#ffffff', 400, .8);
        G.Game.shake(24, 700);
        var cnt = diff === 'hard' ? 21 : diff === 'normal' ? 15 : 11;
        for (var i = 0; i < cnt; i++) {
          api.shoot({ x: 200 + (880) * i / (cnt - 1), y: b.y + 30, a: PI / 2,
                      spd: 4.2, r: 11, color: '#ff4a5e', kind: 'orb', dmg: 2 });
        }
        for (var k = 0; k < 3; k++) {
          api.laser({ x: 320 + k * 320, y: b.y, a: PI / 2, w: 20, len: 900, ms: 620, color: '#ff2b4e', dmg: 2 });
        }
        b.core = null;
        yield 80;
      } else {
        api.say('upright', '好！核心塌了！', 2000);
        yield 40;
      }
      yield diff === 'hard' ? 40 : 70;
    }
  }

  /* ============================================================
     Boss 4 · 被操控的朋友 —— 悲情型（边攻击边发求救信号）
     ============================================================ */
  B.boss4 = {
    id: 'boss4', name: '被操控的他', title: '一半身体已经不是他的了', who: 'puppet',
    color: '#C7A8F0', r: 46, bgm: 'boss4',
    hp: { easy: 2400, normal: 3900, hard: 6000 },
    draw: function (ctx, b, t) {
      var c = this.color;
      glowAt(ctx, 0, 0, b.r * 2.8, c, .35);
      /* 左半：原本的机体（淡紫） */
      ctx.save();
      ctx.beginPath();
      ctx.rect(-b.r * 3, -b.r * 3, b.r * 3, b.r * 6);
      ctx.clip();
      var g = ctx.createLinearGradient(0, -b.r, 0, b.r);
      g.addColorStop(0, '#e8dcff');
      g.addColorStop(.5, c);
      g.addColorStop(1, U.shade(c, -.4));
      ctx.fillStyle = g;
      body(ctx, b);
      ctx.strokeStyle = U.rgba(U.shade(c, -.6), .9); ctx.lineWidth = 2.4; ctx.stroke();
      ctx.restore();
      /* 右半：机械侵蚀（紫黑） */
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, -b.r * 3, b.r * 3, b.r * 6);
      ctx.clip();
      ctx.fillStyle = '#1a1024';
      body(ctx, b);
      ctx.strokeStyle = 'rgba(180,120,255,.75)'; ctx.lineWidth = 2.4; ctx.stroke();
      /* 机械纹路 */
      ctx.strokeStyle = 'rgba(200,140,255,.6)'; ctx.lineWidth = 1.4;
      for (var i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(2, -b.r + i * b.r * .35);
        ctx.lineTo(b.r * .9, -b.r + i * b.r * .35 + 8);
        ctx.stroke();
      }
      /* 侵蚀触须 */
      ctx.strokeStyle = 'rgba(140,80,220,.8)'; ctx.lineWidth = 3;
      for (var k = 0; k < 4; k++) {
        var a = -.6 + k * .45;
        ctx.beginPath();
        ctx.moveTo(b.r * .4, 0);
        var wob = Math.sin(t * .004 + k) * 12;
        ctx.quadraticCurveTo(b.r * 1.1 + wob, a * b.r, b.r * 1.7, a * b.r * 1.6 + wob * .5);
        ctx.stroke();
      }
      ctx.restore();
      /* 驾驶舱：一只眼发光一只流泪 */
      glowAt(ctx, b.r * .22, -b.r * .3, b.r * 1.2, '#c07aff', .8);
      ctx.fillStyle = '#e8d0ff';
      ctx.beginPath(); ctx.arc(b.r * .22, -b.r * .3, b.r * .16, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(200,235,255,.9)';
      ctx.beginPath(); ctx.ellipse(-b.r * .22, -b.r * .3, b.r * .13, b.r * .18, 0, 0, TAU); ctx.fill();
      /* 泪 */
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      var flow = (t * .0012) % 1;
      glowAt(ctx, -b.r * .22, -b.r * .3 + flow * b.r * 1.4, 22, '#a8e8ff', .6);
      ctx.restore();
      /* 求救信号环 */
      if (b.sos) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        var ph = (t * .0009) % 1;
        ctx.strokeStyle = U.rgba('#C7A8F0', (1 - ph) * .6);
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, 0, b.r + ph * 260, 0, TAU); ctx.stroke();
        ctx.restore();
      }
      function body(ctx2, bb) {
        ctx2.beginPath();
        ctx2.moveTo(0, -bb.r * 1.2);
        ctx2.lineTo(bb.r * .8, -bb.r * .2);
        ctx2.lineTo(bb.r * 1.5, bb.r * .5);
        ctx2.lineTo(bb.r * .5, bb.r * .4);
        ctx2.lineTo(bb.r * .4, bb.r * 1.1);
        ctx2.lineTo(-bb.r * .4, bb.r * 1.1);
        ctx2.lineTo(-bb.r * .5, bb.r * .4);
        ctx2.lineTo(-bb.r * 1.5, bb.r * .5);
        ctx2.lineTo(-bb.r * .8, -bb.r * .2);
        ctx2.closePath(); ctx2.fill();
      }
    },
    move: function (b, api, f) {
      b.ux = 640 + Math.sin(b.t * .0011) * 250;
      b.uy = 175 + Math.sin(b.t * .0017) * 26;
    },
    phases: [
      {
        hpFrom: 1, form: 0,
        pattern: {
          easy: function* (api, b) { yield* puppetP1(api, b, 'easy'); },
          normal: function* (api, b) { yield* puppetP1(api, b, 'normal'); },
          hard: function* (api, b) { yield* puppetP1(api, b, 'hard'); }
        }
      },
      {
        hpFrom: .45, form: 1, title: '侵蚀加深', bark: '快……跑……！',
        pattern: {
          easy: function* (api, b) { yield* puppetP2(api, b, 'easy'); },
          normal: function* (api, b) { yield* puppetP2(api, b, 'normal'); },
          hard: function* (api, b) { yield* puppetP2(api, b, 'hard'); }
        }
      }
    ]
  };

  var SOS = ['……对不起……', '别过来……！', '停不下来……身体停不下来……',
             '快跑……求你了……', '我还清醒着……这才是最糟的……', '别看我……'];

  function* puppetP1(api, b, diff) {
    var i = 0;
    for (;;) {
      /* 求救信号 */
      b.sos = true;
      if (i % 3 === 0) api.say('puppet', SOS[i % SOS.length], 2600);
      i++;
      var n = diff === 'easy' ? 8 : diff === 'normal' ? 16 : 24;
      api.ring({ x: b.x, y: b.y, n: n, spd: 2.2, r: 8, color: '#f09ad8', kind: 'petal', off: b.t * .001 });
      yield diff === 'easy' ? 76 : diff === 'normal' ? 44 : 28;
      /* 「犹豫的子弹」——飞一段后减速停住再坠落（他在挣扎） */
      var m = diff === 'easy' ? 4 : diff === 'normal' ? 8 : 12;
      for (var k = 0; k < m; k++) {
        api.shoot({ x: b.x, y: b.y, a: api.aimA(b.x, b.y) + (k - m / 2) * .18,
                    spd: 4.0, r: 8, color: '#d8b8ff', kind: 'orb', drag: .955, ay: .022, life: 800 });
      }
      G.Aud.sfx.enemyShoot();
      yield diff === 'easy' ? 70 : diff === 'normal' ? 42 : 26;
      if (diff !== 'easy') {
        api.wall({ y: -20, n: diff === 'hard' ? 15 : 11, spd: 2.6, r: 8, color: '#e07ac0', gapW: diff === 'hard' ? 1 : 2 });
        yield diff === 'hard' ? 26 : 44;
      }
    }
  }
  function* puppetP2(api, b, diff) {
    var ang = 0;
    for (;;) {
      /* 机械侧强制射击：精准、冷酷 */
      api.say('shadow', '——继续。', 1500);
      var arms = diff === 'easy' ? 3 : diff === 'normal' ? 5 : 7;
      for (var i = 0; i < (diff === 'easy' ? 8 : diff === 'normal' ? 16 : 24); i++) {
        api.spiral({ x: b.x, y: b.y, arms: arms, a0: ang, spd: 2.8, r: 6.5, color: '#c85aa8', kind: 'shard' });
        ang += .3;
        yield diff === 'hard' ? 3 : 5;
      }
      yield 20;
      /* 他自己的抵抗：弹幕突然朝上（打偏） */
      b.sos = true;
      api.say('puppet', '不……我不……！', 2200);
      var cnt = diff === 'easy' ? 6 : diff === 'normal' ? 10 : 14;
      for (var k = 0; k < cnt; k++) {
        api.shoot({ x: b.x, y: b.y, a: -PI / 2 + (k - cnt / 2) * .12, spd: 3.4, r: 8,
                    color: '#C7A8F0', kind: 'petal', ay: .05, life: 900 });
      }
      yield 34;
      /* 交叉激光 */
      var a0 = api.aimA(b.x, b.y);
      var ln = diff === 'easy' ? 1 : diff === 'normal' ? 2 : 3;
      for (var q = 0; q < ln; q++) api.warnLine(b, a0 + (q - (ln - 1) / 2) * .4, Math.round(30 * api.tele));
      yield Math.round(30 * api.tele);
      for (var q2 = 0; q2 < ln; q2++) {
        api.laser({ x: b.x, y: b.y, a: a0 + (q2 - (ln - 1) / 2) * .4, w: 14, len: 1000, ms: 480, color: '#d86ab8' });
      }
      G.Aud.sfx.laser();
      yield diff === 'hard' ? 40 : 66;
      if (diff === 'hard') {
        api.homing({ x: b.x, y: b.y, n: 5, spd: 2.6, r: 7, color: '#f090d8', turn: .05, life: 400 });
        yield 34;
      }
    }
  }

  /* ============================================================
     Boss 5 · 朋友（最终反派） —— 背叛型，弹幕像「曾经的回忆」
     ============================================================ */
  B.boss5 = {
    id: 'boss5', name: '朋友', title: '感情是真的，立场不同', who: 'friend',
    color: '#7CE04A', r: 46, bgm: 'boss5',
    hp: { easy: 2800, normal: 4600, hard: 7200 },
    draw: function (ctx, b, t) {
      var c = b.form >= 1 ? '#2E6B2E' : this.color;
      glowAt(ctx, 0, 0, b.r * 2.8, c, .4);
      ctx.save();
      ctx.rotate(Math.sin(t * .001) * .05);
      /* 双翼（对称，像伸出的手） */
      [-1, 1].forEach(function (s) {
        ctx.save();
        ctx.scale(s, 1);
        var g2 = ctx.createLinearGradient(b.r * .4, 0, b.r * 2.4, 0);
        g2.addColorStop(0, U.shade(c, .2));
        g2.addColorStop(1, U.shade(c, -.6));
        ctx.fillStyle = g2;
        ctx.beginPath();
        ctx.moveTo(b.r * .4, -b.r * .4);
        ctx.quadraticCurveTo(b.r * 2.0, -b.r * .8, b.r * 2.4, b.r * .2);
        ctx.quadraticCurveTo(b.r * 1.6, b.r * .3, b.r * .5, b.r * .5);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = U.rgba(U.shade(c, -.75), .9); ctx.lineWidth = 2; ctx.stroke();
        ctx.restore();
      });
      /* 机身 */
      var g = ctx.createLinearGradient(0, -b.r, 0, b.r);
      g.addColorStop(0, U.shade(c, .5));
      g.addColorStop(.45, c);
      g.addColorStop(1, U.shade(c, -.5));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, -b.r * 1.3);
      ctx.lineTo(b.r * .55, -b.r * .2);
      ctx.lineTo(b.r * .4, b.r * 1.1);
      ctx.lineTo(-b.r * .4, b.r * 1.1);
      ctx.lineTo(-b.r * .55, -b.r * .2);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = U.rgba(U.shade(c, -.75), .95); ctx.lineWidth = 2.6; ctx.stroke();
      /* 驾驶舱：一只眼流泪一只冷漠 */
      ctx.fillStyle = 'rgba(240,255,230,.9)';
      ctx.beginPath(); ctx.ellipse(-b.r * .2, -b.r * .4, b.r * .13, b.r * .17, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(20,40,20,.9)';
      ctx.beginPath(); ctx.ellipse(b.r * .2, -b.r * .4, b.r * .13, b.r * .17, 0, 0, TAU); ctx.fill();
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      var flow = (t * .0011) % 1;
      glowAt(ctx, -b.r * .2, -b.r * .4 + flow * b.r * 1.3, 20, '#a8ffd0', .5);
      ctx.restore();
      ctx.restore();
    },
    move: function (b, api, f) {
      b.ux = 640 + Math.sin(b.t * .0009) * 300;
      b.uy = 170 + Math.cos(b.t * .0013) * 24;
    },
    phases: [
      {
        hpFrom: 1, form: 0,
        pattern: {
          easy: function* (api, b) { yield* memory(api, b, 'easy'); },
          normal: function* (api, b) { yield* memory(api, b, 'normal'); },
          hard: function* (api, b) { yield* memory(api, b, 'hard'); }
        }
      },
      {
        hpFrom: .4, form: 1, title: '不再伪装', bark: '我一直在骗你。{p:400}但我从没骗过你我把你当朋友。',
        pattern: {
          easy: function* (api, b) { yield* betray(api, b, 'easy'); },
          normal: function* (api, b) { yield* betray(api, b, 'normal'); },
          hard: function* (api, b) { yield* betray(api, b, 'hard'); }
        }
      }
    ]
  };

  /* 弹幕「像曾经的回忆」：复现前面 Boss 的招式 */
  function* memory(api, b, diff) {
    var lines = ['还记得吗？{p:300}老人教你的第一课。', '这个角度……{p:300}你以前最怕这个角度。',
                 '你躲的方向，我全都知道。'];
    var i = 0;
    for (;;) {
      api.say('friend', lines[i % lines.length], 2600); i++;
      /* Boss1 的扇形 */
      api.fan({ x: b.x, y: b.y, n: diff === 'easy' ? 5 : diff === 'normal' ? 11 : 15,
                spread: 1.1, spd: 2.6, r: 7, color: '#a8ff6a' });
      yield diff === 'easy' ? 74 : diff === 'normal' ? 42 : 28;
      /* Boss2 的乱弹（但整齐） */
      var n = diff === 'easy' ? 8 : diff === 'normal' ? 16 : 24;
      api.ring({ x: b.x, y: b.y, n: n, spd: 2.4, r: 7, color: '#7CE04A', kind: 'petal', off: b.t * .0015 });
      yield diff === 'easy' ? 70 : diff === 'normal' ? 40 : 26;
      /* Boss3 的封锁墙 */
      api.wall({ y: -20, n: diff === 'easy' ? 9 : diff === 'normal' ? 13 : 17, spd: 2.8, r: 8,
                 color: '#5abf3a', gapW: diff === 'easy' ? 3 : diff === 'normal' ? 2 : 1 });
      yield diff === 'easy' ? 72 : diff === 'normal' ? 42 : 26;
      /* Boss4 的犹豫弹 */
      var m = diff === 'easy' ? 4 : diff === 'normal' ? 8 : 12;
      for (var k = 0; k < m; k++) {
        api.shoot({ x: b.x, y: b.y, a: api.aimA(b.x, b.y) + (k - m / 2) * .16,
                    spd: 3.8, r: 8, color: '#c8ff9a', drag: .96, ay: .02 });
      }
      yield diff === 'easy' ? 66 : diff === 'normal' ? 38 : 24;
      /* 锁定 TY 的护航舱：预警 → 慢速导弹 → 玩家必须拦下 */
      api.escortMissiles({ n: diff === 'easy' ? 2 : diff === 'normal' ? 3 : 4,
                           spd: diff === 'hard' ? 1.9 : 1.4,
                           khp: diff === 'easy' ? 8 : 12 });
      yield diff === 'easy' ? 150 : diff === 'normal' ? 120 : 96;
    }
  }
  function* betray(api, b, diff) {
    var ang = 0;
    for (;;) {
      /* 「把你逼进角落」：双向压缩墙 */
      var n = diff === 'easy' ? 11 : diff === 'normal' ? 15 : 19;
      for (var s = 0; s < (diff === 'hard' ? 3 : 2); s++) {
        api.wall({ y: -20, n: n, spd: 3.0, r: 8, color: '#2E6B2E', gap: s === 0 ? 2 : n - 4,
                   gapW: diff === 'easy' ? 3 : 2 });
        yield diff === 'hard' ? 20 : 32;
      }
      yield 20;
      /* 追踪弹雨 */
      api.homing({ x: b.x, y: b.y, n: diff === 'easy' ? 2 : diff === 'normal' ? 4 : 7,
                   spd: 2.4, r: 7, color: '#4a9a2a', turn: diff === 'hard' ? .055 : .034, life: 420 });
      yield diff === 'easy' ? 64 : 38;
      /* 反向螺旋（回忆的错乱） */
      for (var i = 0; i < (diff === 'easy' ? 10 : diff === 'normal' ? 18 : 26); i++) {
        api.spiral({ x: b.x, y: b.y, arms: diff === 'hard' ? 6 : 4, a0: ang, spd: 2.8, r: 6.5,
                     color: '#7CE04A', kind: 'petal' });
        api.spiral({ x: b.x, y: b.y, arms: diff === 'hard' ? 6 : 4, a0: -ang * 1.4, spd: 2.2, r: 6.5,
                     color: '#2E6B2E', kind: 'petal' });
        ang += .34;
        yield diff === 'hard' ? 3 : 5;
      }
      yield 26;
      /* 扫射激光 */
      var a0 = api.aimA(b.x, b.y);
      api.warnLine(b, a0, Math.round(30 * api.tele));
      yield Math.round(30 * api.tele);
      api.laser({ x: b.x, y: b.y, a: a0 - .6, w: 16, len: 1100, ms: 900, color: '#5abf3a', rotate: .0075 });
      G.Aud.sfx.laser();
      yield diff === 'hard' ? 60 : 90;
      /* 「先拆掉你的救世主」：再来一轮护航舱导弹 */
      api.escortMissiles({ n: diff === 'easy' ? 2 : diff === 'normal' ? 4 : 5,
                           spd: diff === 'hard' ? 2.1 : 1.6,
                           khp: diff === 'easy' ? 8 : 12 });
      yield diff === 'easy' ? 140 : diff === 'normal' ? 110 : 88;
    }
  }

  /* ============================================================
     Boss 6 · 最终Boss「恶人的救世主」 —— 三阶段：拥抱 / 审判 / 自爱
     ============================================================ */
  B.boss6 = {
    id: 'boss6', name: '恶人的救世主', title: '你和我，有什么不同？', who: 'savior',
    color: '#E0244A', r: 58, bgm: 'boss6a',
    hp: { easy: 4200, normal: 7000, hard: 11000 },
    draw: function (ctx, b, t) {
      var c = b.form >= 2 ? '#5B2A8C' : this.color;
      glowAt(ctx, 0, 0, b.r * 3.4, c, .45 + .12 * Math.sin(t * .002));
      ctx.save();
      /* 能量翼（阶段递增） */
      var wings = 2 + b.form * 2;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      [-1, 1].forEach(function (s) {
        for (var k = 0; k < wings; k++) {
          ctx.strokeStyle = U.rgba(k % 2 ? '#ff2b4e' : '#a05aff', .35 + .2 * Math.sin(t * .003 + k));
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(s * b.r * .5, 0);
          ctx.quadraticCurveTo(s * (b.r * 1.6 + k * 22), -b.r * (.8 + k * .3),
                               s * (b.r * 1.2 + k * 30), b.r * (1.0 + k * .35));
          ctx.stroke();
        }
      });
      ctx.restore();
      /* 破碎披风 */
      ctx.fillStyle = U.rgba(U.shade(c, -.6), .7);
      ctx.beginPath();
      ctx.moveTo(-b.r * .7, -b.r * .3);
      for (var i = 0; i <= 8; i++) {
        var tt = i / 8;
        ctx.lineTo(-b.r * .7 + b.r * 1.4 * tt,
                   b.r * (1.4 + Math.sin(t * .003 + tt * 6) * .3 * tt));
      }
      ctx.lineTo(b.r * .7, -b.r * .3);
      ctx.closePath(); ctx.fill();
      /* 机身：高大、压迫 */
      var g = ctx.createLinearGradient(0, -b.r * 1.4, 0, b.r * 1.2);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(.25, U.shade(c, .3));
      g.addColorStop(.6, c);
      g.addColorStop(1, U.shade(c, -.6));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, -b.r * 1.45);
      ctx.lineTo(b.r * .42, -b.r * .8);
      ctx.lineTo(b.r * .78, b.r * .3);
      ctx.lineTo(b.r * .44, b.r * 1.2);
      ctx.lineTo(-b.r * .44, b.r * 1.2);
      ctx.lineTo(-b.r * .78, b.r * .3);
      ctx.lineTo(-b.r * .42, -b.r * .8);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = U.rgba('#2a0410', .95); ctx.lineWidth = 3; ctx.stroke();
      /* 尖冠 */
      ctx.fillStyle = U.shade(c, -.25);
      ctx.beginPath();
      ctx.moveTo(-b.r * .42, -b.r * .8);
      ctx.lineTo(-b.r * .3, -b.r * 1.7);
      ctx.lineTo(-b.r * .1, -b.r * 1.0);
      ctx.lineTo(0, -b.r * 2.0);
      ctx.lineTo(b.r * .12, -b.r * 1.0);
      ctx.lineTo(b.r * .32, -b.r * 1.75);
      ctx.lineTo(b.r * .42, -b.r * .8);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = U.rgba('#2a0410', .9); ctx.lineWidth = 2; ctx.stroke();
      /* 双眼：一温柔一机械 */
      ctx.fillStyle = 'rgba(255,235,240,.95)';
      ctx.beginPath(); ctx.ellipse(-b.r * .18, -b.r * .5, b.r * .1, b.r * .15, 0, 0, TAU); ctx.fill();
      glowAt(ctx, b.r * .18, -b.r * .5, b.r * 1.0, '#ff3355', .85);
      ctx.fillStyle = '#ff6a8a';
      ctx.beginPath(); ctx.arc(b.r * .18, -b.r * .5, b.r * .09, 0, TAU); ctx.fill();
      /* 核心 */
      glowAt(ctx, 0, b.r * .2, b.r * 1.8, b.form >= 2 ? '#a05aff' : '#ff2b4e', .7);
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(0, b.r * .2, b.r * .16, 0, TAU); ctx.fill();
      ctx.restore();
    },
    move: function (b, api, f) {
      if (b.phase === 0) { b.ux = 640 + Math.sin(b.t * .0007) * 230; b.uy = 180; }
      else if (b.phase === 1) { b.ux = 640 + Math.sin(b.t * .0013) * 320; b.uy = 170 + Math.cos(b.t * .0017) * 40; }
      else { b.ux = 640 + Math.sin(b.t * .0019) * 350; b.uy = 165 + Math.cos(b.t * .0023) * 55; }
    },
    phases: [
      {
        hpFrom: 1, form: 0, bgm: 'boss6a',
        pattern: {
          easy: function* (api, b) { yield* embrace(api, b, 'easy'); },
          normal: function* (api, b) { yield* embrace(api, b, 'normal'); },
          hard: function* (api, b) { yield* embrace(api, b, 'hard'); }
        }
      },
      {
        hpFrom: .66, form: 1, title: '第二形态 · 审判', bgm: 'boss6b',
        bark: '你也失去了所有。{p:300}你也充满了恨。{p:300}你也杀了你的朋友——',
        pattern: {
          easy: function* (api, b) { yield* judgement(api, b, 'easy'); },
          normal: function* (api, b) { yield* judgement(api, b, 'normal'); },
          hard: function* (api, b) { yield* judgement(api, b, 'hard'); }
        }
      },
      {
        hpFrom: .32, form: 2, title: '最终形态 · 自爱', bgm: 'boss6c',
        bark: '那我只能……{p:400}比别人更爱我自己一点！！',
        pattern: {
          easy: function* (api, b) { yield* selfLove(api, b, 'easy'); },
          normal: function* (api, b) { yield* selfLove(api, b, 'normal'); },
          hard: function* (api, b) { yield* selfLove(api, b, 'hard'); }
        }
      }
    ]
  };

  /* 阶段1「拥抱」：弹幕从四周向内合拢，像伸开的双臂 */
  function* embrace(api, b, diff) {
    var talk = ['过来。{p:300}我不会伤害像你这样的人。',
                '这个世界抛弃过你吗？{p:400}抛弃过吧。',
                '我也一样。{p:500}所以我们是一样的。'];
    var i = 0;
    for (;;) {
      api.say('savior', talk[i % talk.length], 3000); i++;
      /* 环形从外向内收拢 */
      var n = diff === 'easy' ? 12 : diff === 'normal' ? 22 : 32;
      for (var k = 0; k < n; k++) {
        var a = k / n * TAU;
        var R = 460;
        api.shoot({ x: 640 + Math.cos(a) * R, y: 300 + Math.sin(a) * R * .7,
                    a: a + PI, spd: diff === 'easy' ? 1.4 : diff === 'normal' ? 1.9 : 2.5,
                    r: 8, color: '#ff6a8a', kind: 'petal', life: 700 });
      }
      yield diff === 'easy' ? 78 : diff === 'normal' ? 48 : 32;
      /* 双臂扇形 */
      [-1, 1].forEach(function (s) {
        api.fan({ x: b.x + s * 70, y: b.y + 20, n: diff === 'easy' ? 5 : diff === 'normal' ? 9 : 13,
                  spread: .9, a: PI / 2 + s * .35, spd: 2.6, r: 7, color: '#E0244A' });
      });
      yield diff === 'easy' ? 74 : diff === 'normal' ? 44 : 28;
      /* 心形弹（拥抱的形状） */
      var m = diff === 'easy' ? 16 : diff === 'normal' ? 28 : 40;
      for (var q = 0; q < m; q++) {
        var tt = q / m * TAU;
        var hx = 16 * Math.pow(Math.sin(tt), 3);
        var hy = -(13 * Math.cos(tt) - 5 * Math.cos(2 * tt) - 2 * Math.cos(3 * tt) - Math.cos(4 * tt));
        var aa = Math.atan2(hy, hx);
        api.shoot({ x: b.x, y: b.y, a: aa, spd: 2.2 + Math.abs(hy) * .04, r: 7,
                    color: '#ff9ab0', kind: 'petal', life: 720 });
      }
      G.Aud.sfx.enemyShoot();
      yield diff === 'easy' ? 80 : diff === 'normal' ? 50 : 32;
    }
  }

  /* 阶段2「审判」：垂直光柱 + 十字压制；期间 TY 剪影穿越射线（坏结局E 触发点） */
  function* judgement(api, b, diff) {
    var cyc = 0;
    for (;;) {
      cyc++;
      /* 审判光柱：预警后落下 */
      var cols = diff === 'easy' ? 3 : diff === 'normal' ? 5 : 7;
      var xs = [];
      for (var i = 0; i < cols; i++) xs.push(200 + Math.random() * 880);
      for (var k = 0; k < cols; k++) {
        api.warnLine({ x: xs[k], y: -10 }, PI / 2, Math.round(34 * api.tele));
      }
      G.Aud.sfx.charge(.9);
      yield Math.round(34 * api.tele);
      for (var q = 0; q < cols; q++) {
        api.laser({ x: xs[q], y: -10, a: PI / 2, w: 26, len: 900, ms: 620, color: '#ff2b4e', dmg: 1 });
      }
      G.Aud.sfx.laser();
      G.Game.shake(12, 400);
      yield diff === 'hard' ? 40 : 60;

      /* 十字弹网 */
      var arms = diff === 'easy' ? 4 : diff === 'normal' ? 8 : 12;
      var ang = 0;
      for (var w = 0; w < (diff === 'easy' ? 8 : diff === 'normal' ? 14 : 20); w++) {
        api.spiral({ x: b.x, y: b.y, arms: arms, a0: ang, spd: 3.0, r: 6.5, color: '#e05ac0', kind: 'shard' });
        ang += .26;
        yield diff === 'hard' ? 3 : 5;
      }
      yield 24;

      /* —— TY 剪影穿越射线（每 2 循环一次） —— */
      if (cyc % 2 === 0 && G.St.flag('tyAlive') && !G.St.flag('killedTy')) {
        api.say('ty', '停火！{p:300}我在你的射线上！', 2600);
        G.Aud.sfx.alarm();
        api.spawnAlly && api.spawnAlly();
        yield 150;
      }

      /* 追踪审判弹 */
      api.homing({ x: b.x, y: b.y, n: diff === 'easy' ? 3 : diff === 'normal' ? 6 : 9,
                   spd: 2.4, r: 7, color: '#ff5f7a', turn: diff === 'hard' ? .055 : .035, life: 460 });
      yield diff === 'easy' ? 70 : 42;
    }
  }

  /* 阶段3「自爱」：以自身为中心的自我保护壳 + 全屏爆发 */
  function* selfLove(api, b, diff) {
    var talk = ['别人不看好我。', '我的父母又走得早。', '然后，谁都不爱我……',
                '那我只能比别人更爱我自己一点！'];
    var i = 0;
    for (;;) {
      api.say('savior', talk[i % talk.length], 2400); i++;
      /* 自我护壳：绕自身旋转的弹环 */
      var shell = diff === 'easy' ? 10 : diff === 'normal' ? 18 : 26;
      for (var k = 0; k < shell; k++) {
        var a = k / shell * TAU;
        api.shoot({ x: b.x + Math.cos(a) * 90, y: b.y + Math.sin(a) * 90,
                    a: a, spd: diff === 'easy' ? 1.6 : 2.4, r: 8,
                    color: '#a05aff', kind: 'ringlet', life: 700, spin: .05 });
      }
      yield diff === 'easy' ? 66 : diff === 'normal' ? 40 : 26;

      /* 全屏爆发（多层环，留缝） */
      var layers = diff === 'easy' ? 2 : diff === 'normal' ? 4 : 6;
      for (var L = 0; L < layers; L++) {
        var n = diff === 'easy' ? 14 : diff === 'normal' ? 24 : 34;
        var off = L * .18 + b.t * .001;
        for (var q = 0; q < n; q++) {
          if (diff !== 'hard' && q % 7 === 0) continue;
          api.shoot({ x: b.x, y: b.y, a: off + q / n * TAU,
                      spd: 2.0 + L * .35, r: 7,
                      color: L % 2 ? '#E0244A' : '#5B2A8C', kind: 'orb', life: 760 });
        }
        yield diff === 'hard' ? 10 : 16;
      }
      G.Aud.sfx.enemyShoot();
      yield diff === 'easy' ? 70 : diff === 'normal' ? 42 : 26;

      /* 旋转激光十字 */
      var ln = diff === 'easy' ? 2 : diff === 'normal' ? 3 : 4;
      for (var m = 0; m < ln; m++) {
        api.laser({ x: b.x, y: b.y, a: m / ln * TAU, w: 18, len: 1200, ms: 1400,
                    color: '#ff2b4e', rotate: (diff === 'hard' ? .009 : .005) * (m % 2 ? 1 : -1),
                    follow: b });
      }
      G.Aud.sfx.laser();
      yield diff === 'easy' ? 100 : diff === 'normal' ? 80 : 60;

      /* 密集针雨 */
      var rain = diff === 'easy' ? 8 : diff === 'normal' ? 16 : 26;
      for (var r = 0; r < rain; r++) {
        api.shoot({ x: U.rand(200, 1080), y: -20, a: PI / 2 + U.rand(-.16, .16),
                    spd: U.rand(3, 4.6), r: 6, color: '#ff9ab0', kind: 'needle', life: 900 });
        yield 2;
      }
      yield diff === 'easy' ? 60 : 34;
    }
  }

  /* ============================================================
     IF 线 Boss6（操控「正直的人」）—— 纯白光之雨
     ============================================================ */
  B.boss6_if = {
    id: 'boss6_if', name: '恶人的救世主', title: '这股力量……你是……那个家族的人？！', who: 'savior',
    color: '#E0244A', r: 58, bgm: 'ifline',
    hp: { easy: 3000, normal: 4600, hard: 6600 },
    draw: B.boss6.draw,
    move: B.boss6.move,
    phases: [
      {
        hpFrom: 1, form: 2,
        pattern: {
          easy: function* (api, b) { yield* selfLove(api, b, 'easy'); },
          normal: function* (api, b) { yield* selfLove(api, b, 'normal'); },
          hard: function* (api, b) { yield* selfLove(api, b, 'hard'); }
        }
      },
      {
        hpFrom: .45, form: 2, title: '不可能……！', bark: '不可能！{p:300}你只是个普通人！！',
        pattern: {
          easy: function* (api, b) { yield* judgement(api, b, 'easy'); },
          normal: function* (api, b) { yield* judgement(api, b, 'normal'); },
          hard: function* (api, b) { yield* judgement(api, b, 'hard'); }
        }
      }
    ]
  };

  B.list = ['boss1', 'boss2', 'boss3', 'boss4', 'boss5', 'boss6', 'boss6_if'];

})(window);
