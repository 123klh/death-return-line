/* ===========================================================
   scene_map.js — 2.5D 俯视角探索
     45° 斜投影 + 高度挤出 + Y 轴层级排序 + 斜投影阴影
     八方向惯性移动 / AABB 碰撞 / NPC 交互 / 躲藏 / 空域入口
   =========================================================== */
(function (root) {
  'use strict';
  var G = root.G, U = G.U, Ui = G.Ui, In = G.In;

  var TILT = 0.62;           // Y 轴压缩
  var Z = 1.0;               // 缩放
  var CX = 640, CY = 400;

  var S = {
    map: null, bg: null,
    player: { x: 0, y: 0, vx: 0, vy: 0, r: 16, face: 1, moving: 0, hidden: false, breathT: 0 },
    cam: { x: 0, y: 0, tx: 0, ty: 0 },
    hint: '', target: null,
    drawables: [],
    near: null,             // 当前可交互对象
    talking: false,
    t: 0, dt: 16.7,
    fadeIn: 0,
    markerPulse: 0,
    hidePrompt: 0,
    _pendingRegion: null
  };

  /* ---------------- 投影 ---------------- */
  function px(wx) { return (wx - S.cam.x) * Z + CX; }
  function py(wy) { return (wy - S.cam.y) * TILT * Z + CY; }
  S.px = px; S.py = py;

  /* ---------------- 进入 ---------------- */
  S.enter = function (p) {
    p = p || {};
    var id = p.region || G.St.s.region || 'camp';
    S.map = G.mapOf(id);
    cleanBlockers(S.map);
    G.St.s.region = id;
    S.bg = G.Art.scene(S.map.bg);
    S.hint = p.hint || '';
    S.target = p.target || null;
    S.talking = false;
    S.locked = false;
    S.t = 0;
    S.fadeIn = 0;
    S._pendingRegion = null;
    G.Tw.to(S, 600, { fadeIn: 1, ease: 'outQuad' });

    /* 出生点 */
    var sp = p.spawn;
    if (!sp) {
      /* 默认放在天台/中央 */
      sp = { x: S.map.W * .5, y: S.map.H * .62 };
      /* 若从某出口进入，放在对应出口旁 */
      if (S._lastExitTo) {
        for (var i = 0; i < S.map.zones.length; i++) {
          var z = S.map.zones[i];
          if (z.kind === 'exit' && z.to === S._lastExitTo) { sp = { x: z.x, y: z.y + 120 }; break; }
        }
      }
    }
    S.player.x = sp.x; S.player.y = sp.y;
    /* 出生点若落在实体道具里，玩家会被永久卡住 —— 螺旋外扩找一个空位 */
    var free = findFree(sp.x, sp.y);
    S.player.x = free.x; S.player.y = free.y;
    S.player.vx = S.player.vy = 0;
    S.player.hidden = false;
    S.cam.x = S.cam.tx = S.player.x;
    S.cam.y = S.cam.ty = S.player.y;

    G.Fx.reset();
    G.Fx.setVignette(.3);
    G.Fx.grain = .45;
    G.Aud.playBgm(p.bgm || S.map.music || 'camp', { fade: 1200 });
    G.Dlg.clearStage();
    G.Save.unlockCodex('hero');
  };

  S.exit = function () {
    G.Dlg.stop();
    G.Dlg.clearStage();
  };

  /* ---------------- 碰撞 ---------------- */
  /* 清掉压在 NPC / 交互区上的实体道具，保证目标一定可达（只做一次） */
  function cleanBlockers(map) {
    if (map._cleaned) return;
    map._cleaned = true;
    var KEEP = { wall: 1, ironwall: 1, stonewall: 1, stormwall: 1, bonewall: 1 };
    var pts = [];
    for (var i = 0; i < map.npcs.length; i++) pts.push({ x: map.npcs[i].x, y: map.npcs[i].y, r: 70 });
    for (var k = 0; k < map.zones.length; k++) pts.push({ x: map.zones[k].x, y: map.zones[k].y, r: Math.max(60, map.zones[k].r * .8) });

    /* 1) 清掉压在 NPC / 交互区上的实体 */
    for (var j = map.props.length - 1; j >= 0; j--) {
      var b = map.props[j];
      if (!b.solid || KEEP[b.type]) continue;
      for (var q = 0; q < pts.length; q++) {
        if (U.circleRect(pts[q].x, pts[q].y, pts[q].r, b.x, b.y, b.w, b.d)) {
          if (b.h >= 150) b.solid = false;   /* 地标保留外观，改为可穿过 */
          else map.props.splice(j, 1);
          break;
        }
      }
    }

    /* 2) 从地图中心到每个关键点开一条走廊，保证一定走得到 */
    var cx = map.W * .5, cy = map.H * .58;
    var BAND = 62;
    for (var p2 = 0; p2 < pts.length; p2++) {
      var steps = Math.ceil(U.dist(cx, cy, pts[p2].x, pts[p2].y) / 40);
      for (var s = 0; s <= steps; s++) {
        var t = steps === 0 ? 0 : s / steps;
        var lx = U.lerp(cx, pts[p2].x, t), ly = U.lerp(cy, pts[p2].y, t);
        for (var m = map.props.length - 1; m >= 0; m--) {
          var pb = map.props[m];
          if (!pb.solid || KEEP[pb.type] || pb.h >= 150) continue;
          if (U.circleRect(lx, ly, BAND, pb.x, pb.y, pb.w, pb.d)) map.props.splice(m, 1);
        }
      }
    }
  }

  /* 螺旋搜索一个不与实体重叠的位置 */
  function findFree(x, y) {
    if (!collide(x, y)) return { x: x, y: y };
    for (var r = 24; r <= 480; r += 24) {
      for (var i = 0; i < 16; i++) {
        var a = i / 16 * U.TAU;
        var nx = x + Math.cos(a) * r, ny = y + Math.sin(a) * r;
        if (!collide(nx, ny)) return { x: nx, y: ny };
      }
    }
    return { x: S.map.W * .5, y: S.map.H * .5 };
  }
  S.findFree = findFree;

  function collide(nx, ny) {
    var props = S.map.props;
    var r = S.player.r;
    for (var i = 0; i < props.length; i++) {
      var b = props[i];
      if (!b.solid) continue;
      if (U.circleRect(nx, ny, r, b.x, b.y, b.w, b.d)) return true;
    }
    /* 地图边界 */
    if (nx < r + 20 || nx > S.map.W - r - 20 || ny < r + 20 || ny > S.map.H - r - 20) return true;
    return false;
  }

  /* ---------------- 更新 ---------------- */
  S.update = function (dt) {
    S.dt = dt;
    S.t += dt;
    S.player.breathT += dt;
    S.markerPulse += dt;
    /* 已推进剧情、正在等换场：冻结交互 */
    if (S.locked) return;

    if (G.In.hit('pause') && !S.talking) { G.Game.togglePause(); return; }

    /* 对话中 */
    if (S.talking) {
      G.Dlg.update(dt);
      if (!G.Dlg.active) {
        S.talking = false;
        G.Dlg.clearStage();
        if (S._afterTalk) { var f = S._afterTalk; S._afterTalk = null; f(); }
      }
      return;
    }

    /* 移动 */
    var ax = In.axis();
    var cfg = { acc: 0.9, fric: 0.86, max: S.player.hidden ? 0 : 3.9 };
    if (In.down('focus')) cfg.max = 1.9;
    var f = dt / 16.67;
    S.player.vx += ax.x * cfg.acc * f;
    S.player.vy += ax.y * cfg.acc * f;
    var sp = Math.sqrt(S.player.vx * S.player.vx + S.player.vy * S.player.vy);
    if (sp > cfg.max) { S.player.vx = S.player.vx / sp * cfg.max; S.player.vy = S.player.vy / sp * cfg.max; }
    if (!ax.x) S.player.vx *= Math.pow(cfg.fric, f);
    if (!ax.y) S.player.vy *= Math.pow(cfg.fric, f);
    if (Math.abs(S.player.vx) < .02) S.player.vx = 0;
    if (Math.abs(S.player.vy) < .02) S.player.vy = 0;

    /* 分轴解算 */
    var nx = S.player.x + S.player.vx * f;
    if (!collide(nx, S.player.y)) S.player.x = nx; else S.player.vx = 0;
    var ny = S.player.y + S.player.vy * f;
    if (!collide(S.player.x, ny)) S.player.y = ny; else S.player.vy = 0;

    S.player.moving = Math.min(1, Math.sqrt(S.player.vx * S.player.vx + S.player.vy * S.player.vy) / 2);
    if (S.player.vx !== 0) S.player.face = U.sign(S.player.vx);

    /* 卡死保护：每秒检查一次是否嵌在实体内 */
    S._stuckT = (S._stuckT || 0) + dt;
    if (S._stuckT > 900) {
      S._stuckT = 0;
      if (collide(S.player.x, S.player.y)) {
        var fp = findFree(S.player.x, S.player.y);
        S.player.x = fp.x; S.player.y = fp.y;
        S.player.vx = S.player.vy = 0;
      }
    }

    /* 走路尘埃 */
    if (S.player.moving > .4 && Math.random() < .18) {
      G.Fx.trail(px(S.player.x) + U.rand(-6, 6), py(S.player.y) + U.rand(-2, 4),
                 S.map.ground.accent, U.rand(2, 4), 400);
    }

    /* 相机跟随（带死区） */
    var dzx = 90, dzy = 60;
    if (S.player.x - S.cam.tx > dzx) S.cam.tx = S.player.x - dzx;
    if (S.player.x - S.cam.tx < -dzx) S.cam.tx = S.player.x + dzx;
    if (S.player.y - S.cam.ty > dzy) S.cam.ty = S.player.y - dzy;
    if (S.player.y - S.cam.ty < -dzy) S.cam.ty = S.player.y + dzy;
    /* 边界夹取 */
    var halfW = CX / Z, halfH = CY / (TILT * Z);
    S.cam.tx = U.clamp(S.cam.tx, halfW * .55, S.map.W - halfW * .55);
    S.cam.ty = U.clamp(S.cam.ty, halfH * .5, S.map.H - halfH * .5);
    S.cam.x = U.damp(S.cam.x, S.cam.tx, 8, dt / 1000);
    S.cam.y = U.damp(S.cam.y, S.cam.ty, 8, dt / 1000);

    /* 最近可交互 */
    S.near = findNear();

    /* 交互 */
    if (S.near && In.hit('interact')) doInteract(S.near);
    /* 退出躲藏 */
    if (S.player.hidden && (In.hit('cancel') || (ax.len > .5))) leaveHide();
  };

  function findNear() {
    var best = null, bestD = 1e9;
    var pxx = S.player.x, pyy = S.player.y;
    /* 当前剧情目标享有优先权：否则重叠的交互点会抢掉目标（例如机库门盖住 NPC） */
    var BIAS = 240;
    /* NPC */
    for (var i = 0; i < S.map.npcs.length; i++) {
      var n = S.map.npcs[i];
      if (n.cond && !n.cond()) continue;
      if (n.hideIf && n.hideIf()) continue;
      var d = U.dist(pxx, pyy, n.x, n.y);
      if (d >= 86) continue;
      var score = d - (isTarget({ kind: 'npc', obj: n }) ? BIAS : 0);
      if (score < bestD) { bestD = score; best = { kind: 'npc', obj: n }; }
    }
    /* 区域 */
    for (var k = 0; k < S.map.zones.length; k++) {
      var z = S.map.zones[k];
      if (z.cond && !z.cond()) continue;
      var d2 = U.dist(pxx, pyy, z.x, z.y);
      if (d2 >= z.r + 26) continue;
      var score2 = d2 - (isTarget({ kind: 'zone', obj: z }) ? BIAS : 0);
      if (score2 < bestD) { bestD = score2; best = { kind: 'zone', obj: z }; }
    }
    return best;
  }

  function isTarget(o) {
    if (!S.target) return false;
    return S.target.kind === o.kind && S.target.id === o.obj.id;
  }

  function doInteract(near) {
    var o = near.obj;
    if (near.kind === 'npc') {
      startTalk(o);
      return;
    }
    /* zone */
    if (o.kind === 'hide') { enterHide(o); return; }
    if (o.kind === 'read') { readThing(o); return; }
    if (o.kind === 'hangar') {
      G.Sc.push('hangar', { fromMap: true });
      return;
    }
    if (o.kind === 'exit') {
      if (isTarget({ kind: 'zone', obj: o })) { advanceStory(); return; }
      S._lastExitTo = S.map.id;
      G.Aud.sfx.uiOk();
      G.Sc.go('map', { region: o.to, hint: S.hint, target: S.target }, { trans: 'wipe', ms: 700 });
      return;
    }
    if (o.kind === 'sky') {
      if (isTarget({ kind: 'zone', obj: o })) { advanceStory(); return; }
      G.Aud.sfx.uiDeny();
      flash('现在没有出击任务。');
      return;
    }
    if (o.kind === 'trigger') {
      if (isTarget({ kind: 'zone', obj: o })) { advanceStory(); return; }
      G.Aud.sfx.uiDeny();
      flash('还不是时候。');
      return;
    }
  }

  function advanceStory() {
    if (S.locked) return;
    S.locked = true;              /* 防止连续按键推进多个节拍 */
    G.Aud.sfx.powerup();
    G.Story.advance();
  }

  function flash(msg) {
    G.Fx.float(640, 200, msg, '#ffd479', { size: 18, life: 1500, vy: -.2 });
  }

  /* ---------------- 对话 ---------------- */
  function startTalk(npc) {
    var lines = G.Talk.get(npc.talk, npc);
    if (!lines || !lines.length) {
      flash('……对方没有回应。');
      return;
    }
    S.talking = true;
    G.Dlg.clearStage();
    /* 主角在左，对象在右 */
    G.Dlg.addActor('hero', { slot: 'left', emo: 'fear', scale: 1.8, y: 440 });
    if (npc.char !== 'hero') {
      G.Dlg.addActor(npc.char, { slot: 'right', emo: G.charOf(npc.char).defaultEmo, flip: true, scale: 1.8, y: 440 });
    }
    G.Save.unlockCodex(npc.char);
    var isTgt = isTarget({ kind: 'npc', obj: npc });
    S._afterTalk = isTgt ? advanceStory : null;
    G.Dlg.keepBox = false;
    G.Dlg.play(lines);
  }

  function readThing(z) {
    var lines = G.Talk.get(z.read, z);
    if (!lines || !lines.length) { flash('……什么都看不清。'); return; }
    S.talking = true;
    G.Dlg.clearStage();
    G.Dlg.addActor('hero', { slot: 'center', emo: 'calm', scale: 1.8, y: 440 });
    S._afterTalk = isTarget({ kind: 'zone', obj: z }) ? advanceStory : null;
    G.Dlg.keepBox = false;
    G.Dlg.play(lines);
  }

  /* ---------------- 躲藏 ---------------- */
  function enterHide(z) {
    S.player.hidden = true;
    S.player.x = z.x; S.player.y = z.y;
    G.St.setFlag('everHid');
    G.Fx.setVignette(.72, 700);
    G.Aud.duck(99999, .35);
    G.Aud.sfx.heartbeat();
    S._hideCoro = G.Tw.coro((function* () {
      for (;;) { yield { ms: 1400 }; if (!S.player.hidden) return; G.Aud.sfx.heartbeat(); }
    })(), S);
    flash('躲起来了。抱着膝盖，数自己的呼吸。');
  }
  function leaveHide() {
    S.player.hidden = false;
    G.Fx.setVignette(.3, 700);
    G.Aud.duck(400, 1);
    if (S._hideCoro) { S._hideCoro.kill(); S._hideCoro = null; }
  }

  /* ---------------- 绘制 ---------------- */
  S.draw = function (ctx) {
    /* 天空背景（视差） */
    S.bg.draw(ctx, S.dt, { camX: S.cam.x * .12, camY: S.cam.y * .06 });

    drawGround(ctx);
    drawLights(ctx);
    drawZones(ctx);
    buildDrawables();
    drawSorted(ctx);
    drawEdgeAir(ctx);

    G.Game.updateBlurBuf();

    if (S.player.hidden) {
      /* 躲藏遮挡 */
      var pt = G.Paint.hideCorner;
      if (pt) { ctx.save(); pt(ctx, 1, {}, S.t); ctx.restore(); }
    }

    drawHud(ctx);

    if (S.talking) {
      G.Dlg.drawStage(ctx);
      G.Dlg.draw(ctx);
    } else if (S.near) {
      drawPrompt(ctx);
    }

    if (S.fadeIn < 1) {
      ctx.save();
      ctx.globalAlpha = 1 - S.fadeIn;
      ctx.fillStyle = '#04060d';
      ctx.fillRect(0, 0, 1280, 720);
      ctx.restore();
    }
  };

  /* 地面烘焙：地板纹理/砾石/裂缝/油渍/标线一次性画进离屏画布，每帧只贴一次图。
     Z 恒为 1，世界→屏幕只是平移，所以可以安全缓存。 */
  var groundCache = {};
  var groundOrder = [];
  function groundTile(m) {
    if (groundCache[m.id]) return groundCache[m.id];
    var g = m.ground;
    var TW = Math.ceil(m.W), TH = Math.ceil(m.H * TILT);
    var c = U.canvas(TW, TH), ctx = c.getContext('2d');
    var X = function (wx) { return wx; }, Y = function (wy) { return wy * TILT; };

    /* 地板底色 */
    var grad = ctx.createLinearGradient(0, 0, 0, TH);
    grad.addColorStop(0, U.shade(g.base, -.18));
    grad.addColorStop(1, U.shade(g.base, .10));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, TW, TH);

    if (g.kind === 'metal') {
      ctx.strokeStyle = U.rgba(g.grid, .22);
      ctx.lineWidth = 1;
      for (var i = 0; i <= m.W; i += 160) {
        ctx.beginPath(); ctx.moveTo(X(i), 0); ctx.lineTo(X(i), TH); ctx.stroke();
      }
      for (var j = 0; j <= m.H; j += 160) {
        ctx.beginPath(); ctx.moveTo(0, Y(j)); ctx.lineTo(TW, Y(j)); ctx.stroke();
      }
      ctx.fillStyle = U.rgba(g.accent, .5);
      for (var a = 0; a <= m.W; a += 160) for (var b = 0; b <= m.H; b += 160) {
        ctx.fillRect(X(a) - 2, Y(b) - 1, 4, 3);
      }
    } else if (g.kind === 'dirt') {
      var rr = U.rng(7);
      /* 混凝土停机坪：分块板缝 */
      ctx.strokeStyle = U.rgba(U.shade(g.base, -.42), .5);
      ctx.lineWidth = 2;
      for (var sx0 = 0; sx0 <= m.W; sx0 += 300) {
        ctx.beginPath(); ctx.moveTo(X(sx0), 0); ctx.lineTo(X(sx0), TH); ctx.stroke();
      }
      for (var sy0 = 0; sy0 <= m.H; sy0 += 300) {
        ctx.beginPath(); ctx.moveTo(0, Y(sy0)); ctx.lineTo(TW, Y(sy0)); ctx.stroke();
      }
      for (var k = 0; k < 130; k++) {
        var wx = rr() * m.W, wy = rr() * m.H;
        ctx.fillStyle = U.rgba(g.accent, rr.range(.1, .3));
        var rw = rr.range(30, 130);
        ctx.beginPath();
        ctx.ellipse(X(wx), Y(wy), rw, rw * TILT * .5, 0, 0, U.TAU);
        ctx.fill();
      }
    } else if (g.kind === 'stone') {
      ctx.strokeStyle = U.rgba(g.grid, .3);
      ctx.lineWidth = 1.4;
      for (var s = 0; s <= m.W; s += 200) {
        ctx.beginPath(); ctx.moveTo(X(s), 0); ctx.lineTo(X(s), TH); ctx.stroke();
      }
      for (var t2 = 0; t2 <= m.H; t2 += 200) {
        ctx.beginPath(); ctx.moveTo(0, Y(t2)); ctx.lineTo(TW, Y(t2)); ctx.stroke();
      }
    } else if (g.kind === 'cloud') {
      var r2 = U.rng(17);
      for (var cc = 0; cc < 60; cc++) {
        var cx = r2() * m.W, cy = r2() * m.H;
        var rad = r2.range(80, 260);
        var gg = ctx.createRadialGradient(X(cx), Y(cy), 0, X(cx), Y(cy), rad);
        gg.addColorStop(0, U.rgba(g.accent, .30));
        gg.addColorStop(1, U.rgba(g.accent, 0));
        ctx.fillStyle = gg;
        ctx.fillRect(X(cx) - rad, Y(cy) - rad, rad * 2, rad * 2);
      }
    } else if (g.kind === 'flesh') {
      var r3 = U.rng(27);
      for (var q = 0; q < 70; q++) {
        var qx = r3() * m.W, qy = r3() * m.H;
        ctx.strokeStyle = U.rgba(g.grid, r3.range(.1, .3));
        ctx.lineWidth = r3.range(1, 3);
        ctx.beginPath();
        ctx.moveTo(X(qx), Y(qy));
        ctx.lineTo(X(qx + r3.range(-90, 90)), Y(qy + r3.range(-70, 70)));
        ctx.stroke();
      }
    }
    bakeGroundDetail(ctx, m, TW, TH);
    /* 远端渐暗（浮空感） */
    var vg = ctx.createLinearGradient(0, TH - 200, 0, TH);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,.55)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, TH - 200, TW, 200);
    /* 区域环境色 */
    if (m.amb) {
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = m.amb.a * 3.2;
      ctx.fillStyle = m.amb.tint;
      ctx.fillRect(0, 0, TW, TH);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }
    groundCache[m.id] = c;
    groundOrder.push(m.id);
    /* 每张 2600×1360 的地面图约 14MB，只留最近两张 */
    while (groundOrder.length > 2) delete groundCache[groundOrder.shift()];
    return c;
  }

  /* 通用地面细节：砾石、裂缝、油渍、拖痕、褪色标线 */
  function bakeGroundDetail(ctx, m, TW, TH) {
    var g = m.ground;
    var r = U.rng(9001 + m.id.length * 37);
    var dark = U.shade(g.base, -.5);
    /* 油渍 / 水渍 */
    for (var i = 0; i < 22; i++) {
      var ox = r() * TW, oy = r() * TH, orr = r.range(26, 90);
      var og = ctx.createRadialGradient(ox, oy, 0, ox, oy, orr);
      og.addColorStop(0, U.rgba(dark, r.range(.18, .38)));
      og.addColorStop(1, U.rgba(dark, 0));
      ctx.fillStyle = og;
      ctx.beginPath();
      ctx.ellipse(ox, oy, orr, orr * .55, r() * 3, 0, U.TAU);
      ctx.fill();
    }
    /* 裂缝 */
    ctx.lineCap = 'round';
    for (var c = 0; c < 44; c++) {
      var cx = r() * TW, cy = r() * TH;
      ctx.strokeStyle = U.rgba(dark, r.range(.2, .45));
      ctx.lineWidth = r.range(.8, 2);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      for (var s = 0; s < 4; s++) {
        cx += r.range(-46, 46); cy += r.range(-16, 16);
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }
    /* 砾石 / 碎屑 */
    for (var k = 0; k < 520; k++) {
      var gx = r() * TW, gy = r() * TH, gs = r.range(.8, 2.6);
      ctx.fillStyle = U.rgba(r() < .5 ? U.shade(g.base, .34) : dark, r.range(.2, .5));
      ctx.fillRect(gx, gy, gs, gs * .7);
    }
    /* 拖痕（旧车辙） */
    for (var t = 0; t < 7; t++) {
      var ty = r() * TH, tw = r.range(240, 700), tx = r() * (TW - tw);
      ctx.strokeStyle = U.rgba(dark, .16);
      ctx.lineWidth = r.range(7, 15);
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.bezierCurveTo(tx + tw * .3, ty + r.range(-18, 18), tx + tw * .7, ty + r.range(-18, 18), tx + tw, ty);
      ctx.stroke();
    }
    /* 褪色地面标线：只在停机坪/厂区这类人造硬化地面上出现。
       祭坛（stone）不能有停车位和道路中线，那儿要的是刻蚀纹。 */
    if (g.kind === 'metal' || g.kind === 'dirt') {
      var mc = g.mark || '#e8d8a0';
      ctx.save();
      ctx.globalAlpha = .18;
      ctx.strokeStyle = mc;
      for (var bay = 0; bay < 5; bay++) {
        var bx = 200 + r() * (TW - 700), by = 120 + r() * (TH - 320);
        var bw = r.range(180, 300), bh = r.range(90, 150);
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(bx, by); ctx.lineTo(bx, by + bh);
        ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by);
        ctx.stroke();
      }
      /* 中线虚线 */
      ctx.lineWidth = 5;
      ctx.setLineDash([34, 30]);
      for (var ln = 0; ln < 3; ln++) {
        var ly = TH * (.28 + ln * .24);
        ctx.beginPath(); ctx.moveTo(40, ly); ctx.lineTo(TW - 40, ly); ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.restore();
    }
    /* 云海：涡旋丝缕 + 上升气流环 + 雷击焦痕。
       只有柔和色块的话整片地面就是一张纯色纸。 */
    if (g.kind === 'cloud') {
      ctx.save();
      ctx.lineCap = 'round';
      /* 涡旋：每个中心画几条同心弧，弧长和相位错开 */
      for (var vo = 0; vo < 14; vo++) {
        var vx2 = r() * TW, vy2 = r() * TH, ph = r() * U.TAU, dir = r() < .5 ? 1 : -1;
        for (var arc = 0; arc < 5; arc++) {
          var ar = 40 + arc * 34 + r.range(-8, 8);
          ctx.strokeStyle = U.rgba(arc % 2 ? U.shade(g.grid, .45) : U.shade(g.base, -.4),
                                   r.range(.1, .26));
          ctx.lineWidth = r.range(2, 6);
          ctx.beginPath();
          ctx.ellipse(vx2, vy2, ar, ar * .58, ph + arc * .3 * dir,
                      ph + arc * .8, ph + arc * .8 + r.range(1.6, 3.4));
          ctx.stroke();
        }
      }
      /* 上升气流环：亮边椭圆，暗示这里可以被吹起来 */
      for (var up = 0; up < 9; up++) {
        var ux = r() * TW, uy = r() * TH, ur = r.range(60, 150);
        ctx.strokeStyle = U.rgba(U.shade(g.grid, .6), .16);
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(ux, uy, ur, ur * .5, 0, 0, U.TAU); ctx.stroke();
        ctx.strokeStyle = U.rgba(U.shade(g.grid, .6), .1);
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(ux, uy - 14, ur * .72, ur * .36, 0, 0, U.TAU); ctx.stroke();
      }
      /* 雷击焦痕：分叉折线，尾端渐淡 */
      for (var lt2 = 0; lt2 < 11; lt2++) {
        var lx = r() * TW, ly = r() * TH;
        ctx.strokeStyle = U.rgba('#f0e0ff', r.range(.1, .22));
        ctx.lineWidth = r.range(1.2, 2.6);
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        for (var sg2 = 0; sg2 < 5; sg2++) {
          lx += r.range(-40, 40); ly += r.range(10, 40);
          ctx.lineTo(lx, ly);
          if (sg2 === 2 && r() < .6) {
            ctx.moveTo(lx, ly);
            ctx.lineTo(lx + r.range(-34, 34), ly + r.range(14, 34));
            ctx.moveTo(lx, ly);
          }
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    /* 祭坛石地：同心刻圈 + 放射刻线 + 石板缝，围绕地图中心。
       刻痕用暖骨白 —— 绿底上再刻绿线等于什么都看不见。 */
    if (g.kind === 'stone') {
      var mcx = TW / 2, mcy = TH / 2;
      var eng = g.mark || '#d6c9a4';
      ctx.save();
      ctx.lineCap = 'butt';
      for (var ri = 0; ri < 6; ri++) {
        var rad = 150 + ri * 128;
        ctx.strokeStyle = U.rgba(eng, .3 - ri * .028);
        ctx.lineWidth = ri % 2 ? 2 : 5;
        ctx.beginPath();
        ctx.ellipse(mcx, mcy, rad, rad * .96, 0, 0, U.TAU);
        ctx.stroke();
        /* 刻圈里侧的暗影，做出「凹陷」的错觉 */
        ctx.strokeStyle = U.rgba(dark, .34);
        ctx.lineWidth = ri % 2 ? 1.5 : 3;
        ctx.beginPath();
        ctx.ellipse(mcx, mcy + 3, rad, rad * .96, 0, 0, U.TAU);
        ctx.stroke();
      }
      for (var sp = 0; sp < 16; sp++) {
        var ang = sp / 16 * U.TAU;
        var majr = sp % 4 === 0;
        ctx.strokeStyle = U.rgba(eng, majr ? .28 : .14);
        ctx.lineWidth = majr ? 4 : 2;
        ctx.beginPath();
        ctx.moveTo(mcx + Math.cos(ang) * 150, mcy + Math.sin(ang) * 144);
        ctx.lineTo(mcx + Math.cos(ang) * 790, mcy + Math.sin(ang) * 758);
        ctx.stroke();
        /* 主轴末端刻一枚符号（三道横杠 + 一个点），凑出「无名祭坛」的碑文感 */
        if (majr) {
          var gx2 = mcx + Math.cos(ang) * 700, gy2 = mcy + Math.sin(ang) * 672;
          ctx.strokeStyle = U.rgba(eng, .34);
          ctx.lineWidth = 3;
          for (var bar = 0; bar < 3; bar++) {
            ctx.beginPath();
            ctx.moveTo(gx2 - 20, gy2 - 14 + bar * 13);
            ctx.lineTo(gx2 + 20 - bar * 9, gy2 - 14 + bar * 13);
            ctx.stroke();
          }
          ctx.fillStyle = U.rgba(eng, .34);
          ctx.beginPath(); ctx.arc(gx2 + 26, gy2 + 12, 3.4, 0, U.TAU); ctx.fill();
        }
      }
      /* 外围石板缝：不规则四边形拼接，避开中央刻圈 */
      ctx.strokeStyle = U.rgba(dark, .38);
      ctx.lineWidth = 2;
      for (var sx2 = 0; sx2 < TW; sx2 += 168) {
        for (var sy2 = 0; sy2 < TH; sy2 += 168) {
          var ddx = sx2 + 84 - mcx, ddy = sy2 + 84 - mcy;
          if (ddx * ddx + ddy * ddy < 800 * 800) continue;
          ctx.strokeRect(sx2 + r.range(-6, 6), sy2 + r.range(-6, 6),
                         168 + r.range(-10, 10), 168 + r.range(-10, 10));
          /* 板缝亮侧：石板厚度 */
          ctx.strokeStyle = U.rgba(U.shade(g.accent, .5), .12);
          ctx.beginPath();
          ctx.moveTo(sx2 + 4, sy2 + 166); ctx.lineTo(sx2 + 166, sy2 + 166);
          ctx.stroke();
          ctx.strokeStyle = U.rgba(dark, .38);
        }
      }
      ctx.restore();
    }
  }

  function drawGround(ctx) {
    var m = S.map;
    var tile = groundTile(m);
    var x0 = px(0), y0 = py(0), x1 = px(m.W), y1 = py(m.H);
    ctx.drawImage(tile, x0, y0);
    /* 地图边界霓虹 */
    ctx.strokeStyle = U.rgba(m.ground.grid, .5);
    ctx.lineWidth = 2;
    ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
  }

  function drawLights(ctx) {
    var ls = S.map.lights || [];
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < ls.length; i++) {
      var L = ls[i];
      var sx = px(L.x), sy = py(L.y);
      var flick = L.color === '#ff9a4a' ? (.85 + Math.random() * .15) : 1;
      var g = ctx.createRadialGradient(sx, sy, 0, sx, sy, L.r);
      g.addColorStop(0, U.rgba(L.color, L.a * flick));
      g.addColorStop(1, U.rgba(L.color, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(sx, sy, L.r, L.r * TILT, 0, 0, U.TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawZones(ctx) {
    var zs = S.map.zones;
    for (var i = 0; i < zs.length; i++) {
      var z = zs[i];
      if (z.cond && !z.cond()) continue;
      var sx = px(z.x), sy = py(z.y);
      if (sx < -200 || sx > 1480 || sy < -200 || sy > 920) continue;
      var isT = isTarget({ kind: 'zone', obj: z });
      var col = z.kind === 'exit' ? '#8fd4ff' : z.kind === 'sky' ? '#ffd479'
              : z.kind === 'hangar' ? '#7CE04A' : z.kind === 'hide' ? '#9a8fd0'
              : z.kind === 'read' ? '#c8dcea' : '#ff9f6a';
      var pulse = .5 + .5 * Math.sin(S.markerPulse * .003 + i);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      /* 地面光圈 */
      ctx.strokeStyle = U.rgba(col, (isT ? .85 : .38) * (.6 + pulse * .4));
      ctx.lineWidth = isT ? 3 : 1.8;
      ctx.beginPath();
      ctx.ellipse(sx, sy, z.r, z.r * TILT, 0, 0, U.TAU);
      ctx.stroke();
      var g = ctx.createRadialGradient(sx, sy, 0, sx, sy, z.r);
      g.addColorStop(0, U.rgba(col, (isT ? .30 : .12) * (.5 + pulse * .5)));
      g.addColorStop(1, U.rgba(col, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(sx, sy, z.r, z.r * TILT, 0, 0, U.TAU);
      ctx.fill();
      /* 上升光柱（目标 or 出口） */
      if (isT || z.kind === 'sky' || z.kind === 'exit') {
        var hgt = isT ? 160 : 90;
        var g2 = ctx.createLinearGradient(sx, sy, sx, sy - hgt);
        g2.addColorStop(0, U.rgba(col, (isT ? .35 : .18) * (.5 + pulse * .5)));
        g2.addColorStop(1, U.rgba(col, 0));
        ctx.fillStyle = g2;
        ctx.fillRect(sx - z.r * .5, sy - hgt, z.r, hgt);
      }
      ctx.restore();
    }
  }

  /* ---------------- 可排序物件 ---------------- */
  function buildDrawables() {
    var d = S.drawables;
    d.length = 0;
    var props = S.map.props;
    for (var i = 0; i < props.length; i++) {
      var b = props[i];
      var sx = px(b.x + b.w / 2);
      if (sx < -400 || sx > 1680) continue;
      var sy = py(b.y + b.d);
      if (sy < -500 || sy > 1200) continue;
      /* elevated 只是「无碰撞、可从下方走过」；排序仍按 Y，遮挡关系才正确 */
      d.push({ sortY: b.y + b.d, kind: 'prop', o: b });
    }
    for (var k = 0; k < S.map.npcs.length; k++) {
      var n = S.map.npcs[k];
      if (n.cond && !n.cond()) continue;
      d.push({ sortY: n.y, kind: 'npc', o: n });
    }
    d.push({ sortY: S.player.y, kind: 'player', o: S.player });
    d.sort(function (a, b2) { return a.sortY - b2.sortY; });
  }

  function drawSorted(ctx) {
    for (var i = 0; i < S.drawables.length; i++) {
      var it = S.drawables[i];
      if (it.kind === 'prop') drawProp(ctx, it.o);
      else if (it.kind === 'npc') drawNpc(ctx, it.o);
      else drawPlayer(ctx);
    }
  }

  /* ---------------- 道具（挤出立方体 + 特化） ---------------- */
  /* 每种类型混入自己的材质色，避免整张地图一片同色 */
  var TYPE_COL = {
    crate:    { tint: '#a8804a', amt: .50, l: .04 },
    barrel:   { tint: '#4a7a92', amt: .46, l: -.02 },
    rock:     { tint: '#6e6e72', amt: .52, l: -.14 },
    debris:   { tint: '#33333c', amt: .48, l: -.18 },
    pipe:     { tint: '#8a9aa4', amt: .46, l: .06 },
    tank:     { tint: '#9a8450', amt: .44, l: .02 },
    deadtree: { tint: '#4a3624', amt: .60, l: -.20 },
    pillar:   { tint: '#a0a096', amt: .44, l: .10 },
    machine:  { tint: '#586068', amt: .50, l: -.02 },
    cable:    { tint: '#242430', amt: .60, l: -.24 },
    statue:   { tint: '#b0b0a2', amt: .46, l: .12 },
    bone:     { tint: '#dcd4c4', amt: .55, l: .22 },
    spire:    { tint: '#5e4a60', amt: .44, l: -.06 },
    crystal:  { tint: '#b0a8ff', amt: .55, l: .20 },
    stairs:   { tint: '#8a8a80', amt: .35, l: .08 },
    conveyor: { tint: '#4a5158', amt: .5,  l: .02 },
    outpost:  { tint: '#6a7a8a', amt: .35, l: .06 },
    hangar:   { tint: '#7a5a42', amt: .3,  l: .04 },
    catwalk:  { tint: '#7a8288', amt: .45, l: .08 },
    wall:     { tint: '#3a3a42', amt: .40, l: -.10 },
    stormwall:{ tint: '#3a2a52', amt: .40, l: -.06 },
    ironwall: { tint: '#3a3e44', amt: .45, l: -.08 },
    stonewall:{ tint: '#2a4438', amt: .40, l: -.04 },
    bonewall: { tint: '#4a2028', amt: .40, l: -.04 }
  };
  function propColor(b, base) {
    if (b.color) return b.color;
    var t = TYPE_COL[b.type];
    if (!t) return U.shade(base, .04);
    return U.shade(U.mix(base, t.tint, t.amt), t.l);
  }

  /* 顶面细节：檐口内收 + 屋面板缝 + 按类型的屋顶设施。
     斜投影下越高的物件顶面越大，全是纯色的话整张地图会像一堆色块。 */
  function roofDetail(ctx, b, col, x0, x1, yBack, yFront, h) {
    var w = x1 - x0, dp = yFront - yBack;
    if (w < 40 || dp < 18) return;
    var ty = yBack - h;
    var dk = U.rgba(U.shade(col, -.5), .45);
    var lt = U.rgba(U.shade(col, .55), .3);
    var seed = Math.abs(Math.round(b.x * 11 + b.y * 5 + b.w * 3));
    var r = U.rng(seed);
    var t = b.type;

    ctx.save();
    ctx.beginPath();
    ctx.rect(x0, ty, w, dp);
    ctx.clip();

    /* 有机 / 天然物件不能有檐口和板缝，否则骨刺和岩石看起来像铁皮箱子 */
    var organic = t === 'bone' || t === 'spire' || t === 'rock' || t === 'rockisle' ||
                  t === 'debris' || t === 'deadtree' || t === 'fire' || t === 'anchor';
    if (organic) {
      /* 断口：不规则折面 + 一道亮脊 */
      ctx.strokeStyle = U.rgba(U.shade(col, -.55), .5);
      ctx.lineWidth = 1.4;
      var fn2 = 3 + Math.round(r() * 3);
      for (var fi2 = 0; fi2 < fn2; fi2++) {
        var ax = x0 + r() * w, ay = ty + r() * dp;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax + r.range(-w * .3, w * .3), ay + r.range(-dp * .3, dp * .3));
        ctx.lineTo(ax + r.range(-w * .2, w * .4), ay + r.range(0, dp * .4));
        ctx.stroke();
      }
      ctx.strokeStyle = U.rgba(U.shade(col, .6), .28);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x0 + w * .2, ty + dp * .7);
      ctx.lineTo(x0 + w * .5, ty + dp * .2);
      ctx.lineTo(x0 + w * .8, ty + dp * .6);
      ctx.stroke();
      ctx.restore();
      return;
    }

    /* 檐口：内收一圈，做出屋面比墙体略小的层次 */
    ctx.strokeStyle = dk; ctx.lineWidth = 1.4;
    ctx.strokeRect(x0 + 5, ty + 3, w - 10, dp - 6);
    ctx.strokeStyle = lt; ctx.lineWidth = 1;
    ctx.strokeRect(x0 + 7, ty + 5, w - 14, dp - 10);

    /* 屋面板缝 */
    ctx.strokeStyle = dk; ctx.lineWidth = 1;
    var step = w > 220 ? 56 : 34;
    for (var sx = x0 + step; sx < x1 - 6; sx += step) {
      ctx.beginPath(); ctx.moveTo(sx, ty + 5); ctx.lineTo(sx, ty + dp - 5); ctx.stroke();
    }
    if (dp > 70) {
      var my = ty + dp / 2;
      ctx.beginPath(); ctx.moveTo(x0 + 6, my); ctx.lineTo(x1 - 6, my); ctx.stroke();
    }

    if (t === 'temple' || t === 'altar' || t === 'throne') {
      /* 神殿：中脊 + 天窗（透出内部光）+ 四角基座 */
      var cx = (x0 + x1) / 2;
      ctx.strokeStyle = U.rgba(U.shade(col, .7), .38); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cx, ty + 6); ctx.lineTo(cx, ty + dp - 6); ctx.stroke();
      var gw = Math.min(w * .34, 120), gh = Math.min(dp * .4, 54);
      var gc = b.glow || '#9fd8ff';
      var sg = ctx.createLinearGradient(0, ty + dp / 2 - gh / 2, 0, ty + dp / 2 + gh / 2);
      sg.addColorStop(0, U.rgba(gc, .5));
      sg.addColorStop(1, U.rgba(gc, .16));
      ctx.fillStyle = sg;
      ctx.fillRect(cx - gw / 2, ty + dp / 2 - gh / 2, gw, gh);
      ctx.strokeStyle = U.rgba(U.shade(col, -.6), .7); ctx.lineWidth = 2;
      ctx.strokeRect(cx - gw / 2, ty + dp / 2 - gh / 2, gw, gh);
      ctx.strokeStyle = U.rgba(gc, .3); ctx.lineWidth = 1;
      for (var mz = 1; mz < 4; mz++) {
        var mx = cx - gw / 2 + gw * mz / 4;
        ctx.beginPath(); ctx.moveTo(mx, ty + dp / 2 - gh / 2); ctx.lineTo(mx, ty + dp / 2 + gh / 2); ctx.stroke();
      }
      ctx.fillStyle = U.rgba(U.shade(col, .4), .3);
      [[x0 + 14, ty + 12], [x1 - 14, ty + 12], [x0 + 14, ty + dp - 12], [x1 - 14, ty + dp - 12]]
        .forEach(function (p) { ctx.beginPath(); ctx.arc(p[0], p[1], 6, 0, U.TAU); ctx.fill(); });
    } else if (t === 'tower' || t === 'outpost' || t === 'hangar' || t === 'gate') {
      /* 塔 / 机库：屋顶风机 + 通风百叶 + 航空障碍灯 */
      var vx = x0 + w * .3, vy = ty + dp * .5;
      ctx.strokeStyle = U.rgba(U.shade(col, -.6), .6); ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(vx, vy, Math.min(16, dp * .3), 0, U.TAU); ctx.stroke();
      var spin = S.t * .002 + seed;
      for (var bl = 0; bl < 3; bl++) {
        var a2 = spin + bl / 3 * U.TAU, rr = Math.min(14, dp * .26);
        ctx.beginPath(); ctx.moveTo(vx, vy);
        ctx.lineTo(vx + Math.cos(a2) * rr, vy + Math.sin(a2) * rr * .8); ctx.stroke();
      }
      ctx.strokeStyle = dk;
      for (var lv = 0; lv < 4; lv++) {
        var ly2 = ty + dp * .28 + lv * 6;
        if (ly2 > ty + dp - 8) break;
        ctx.beginPath(); ctx.moveTo(x0 + w * .58, ly2); ctx.lineTo(x1 - 10, ly2); ctx.stroke();
      }
      var blink = Math.sin(S.t * .004 + seed) > .3;
      ctx.fillStyle = blink ? 'rgba(255,90,90,.95)' : 'rgba(120,40,40,.6)';
      ctx.beginPath(); ctx.arc(x1 - 12, ty + 10, 3.2, 0, U.TAU); ctx.fill();
    } else if (t === 'platform' || t === 'catwalk' || t === 'stairs') {
      /* 平台 / 栈道：格栅 */
      ctx.strokeStyle = dk; ctx.lineWidth = 1;
      for (var gy = ty + 8; gy < ty + dp - 6; gy += 7) {
        ctx.beginPath(); ctx.moveTo(x0 + 6, gy); ctx.lineTo(x1 - 6, gy); ctx.stroke();
      }
    } else if (t === 'crate' || t === 'tank' || t === 'wreck') {
      /* 箱顶：十字加固带 + 一块防水布的暗块 */
      ctx.strokeStyle = U.rgba(U.shade(col, .45), .35); ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo((x0 + x1) / 2, ty + 4); ctx.lineTo((x0 + x1) / 2, ty + dp - 4);
      ctx.moveTo(x0 + 4, ty + dp / 2); ctx.lineTo(x1 - 4, ty + dp / 2);
      ctx.stroke();
      ctx.fillStyle = U.rgba(U.shade(col, -.45), .3);
      ctx.fillRect(x0 + w * r.range(.1, .45), ty + dp * .2, w * .3, dp * .4);
    } else if (w > 90 && dp > 40) {
      /* 其余大顶面：几处积尘与水渍，避免整块平色 */
      for (var q = 0; q < 4; q++) {
        var qx = x0 + r.range(10, w - 10), qy = ty + r.range(8, dp - 8);
        var qr = r.range(10, Math.max(12, Math.min(w, dp) * .3));
        var qg = ctx.createRadialGradient(qx, qy, 0, qx, qy, qr);
        qg.addColorStop(0, U.rgba(U.shade(col, -.4), .22));
        qg.addColorStop(1, U.rgba(U.shade(col, -.4), 0));
        ctx.fillStyle = qg;
        ctx.beginPath(); ctx.ellipse(qx, qy, qr, qr * .6, 0, 0, U.TAU); ctx.fill();
      }
    }
    ctx.restore();
  }

  /* 立方体表面细节：板条 / 铆钉 / 面板缝 / 锈迹 / 通风口。
     按物件自身坐标做确定性伪随机，所以每帧一致、不会闪。 */
  function surfaceDetail(ctx, b, col, x0, x1, yBack, yFront, h) {
    var w = x1 - x0;
    if (w < 10 || h < 12) return;
    var top = yFront - h;
    var lite = U.rgba(U.shade(col, .45), .5);
    var dk = U.rgba(U.shade(col, -.55), .55);
    var seed = Math.abs(Math.round(b.x * 7 + b.y * 13 + b.h * 3));
    var r = U.rng(seed);
    var ty = b.type;

    ctx.save();
    ctx.beginPath();
    ctx.rect(x0, top, w, h);
    ctx.clip();

    if (ty === 'crate' || ty === 'tank') {
      /* 货箱：横板条 + 角铁 + 褪色喷漆标记 */
      ctx.strokeStyle = dk; ctx.lineWidth = 1.2;
      var rows = Math.max(2, Math.floor(h / 16));
      for (var i = 1; i < rows; i++) {
        var yy = top + h * i / rows;
        ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x1, yy); ctx.stroke();
      }
      ctx.strokeStyle = lite; ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(x0 + 2, top + 2); ctx.lineTo(x0 + 2, yFront - 2);
      ctx.moveTo(x1 - 2, top + 2); ctx.lineTo(x1 - 2, yFront - 2);
      ctx.stroke();
      if (w > 34 && h > 30) {
        ctx.strokeStyle = U.rgba('#e8d8a0', .22); ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x0 + w * .3, top + h * .35); ctx.lineTo(x0 + w * .7, top + h * .68);
        ctx.moveTo(x0 + w * .7, top + h * .35); ctx.lineTo(x0 + w * .3, top + h * .68);
        ctx.stroke();
      }
    } else if (ty === 'barrel' || ty === 'pipe') {
      /* 桶 / 管：箍圈 + 竖向高光柱 */
      ctx.strokeStyle = dk; ctx.lineWidth = 2;
      for (var k = 1; k < 3; k++) {
        var by = top + h * k / 3;
        ctx.beginPath(); ctx.moveTo(x0, by); ctx.lineTo(x1, by); ctx.stroke();
      }
      var lg = ctx.createLinearGradient(x0, 0, x1, 0);
      lg.addColorStop(0, 'rgba(255,255,255,0)');
      lg.addColorStop(.3, 'rgba(255,255,255,.16)');
      lg.addColorStop(.5, 'rgba(255,255,255,0)');
      lg.addColorStop(1, 'rgba(0,0,0,.22)');
      ctx.fillStyle = lg;
      ctx.fillRect(x0, top, w, h);
    } else if (ty === 'machine' || ty === 'conveyor' || ty === 'armbase') {
      /* 机械：面板缝 + 通风格栅 + 指示灯 */
      ctx.strokeStyle = dk; ctx.lineWidth = 1.2;
      ctx.strokeRect(x0 + 4, top + 4, w - 8, h - 8);
      ctx.strokeStyle = U.rgba(U.shade(col, -.4), .7); ctx.lineWidth = 1.6;
      var vn = Math.min(6, Math.floor(h / 10));
      for (var v = 0; v < vn; v++) {
        var vy = top + 10 + v * 8;
        ctx.beginPath(); ctx.moveTo(x0 + w * .58, vy); ctx.lineTo(x1 - 7, vy); ctx.stroke();
      }
      if (h > 26) {
        var on = Math.sin(S.t * .003 + seed) > -.2;
        ctx.fillStyle = on ? 'rgba(120,255,170,.85)' : 'rgba(255,120,120,.6)';
        ctx.beginPath(); ctx.arc(x0 + 12, top + 12, 2.6, 0, U.TAU); ctx.fill();
      }
    } else if (ty === 'wall' || ty === 'ironwall' || ty === 'hangar' || ty === 'stonewall' ||
               ty === 'stormwall' || ty === 'bonewall' || ty === 'pillar') {
      /* 墙体：分段板缝 + 铆钉列 + 顺流锈迹 */
      ctx.strokeStyle = dk; ctx.lineWidth = 1.4;
      var seg = Math.max(1, Math.round(w / 90));
      for (var s = 1; s < seg; s++) {
        var sxx = x0 + w * s / seg;
        ctx.beginPath(); ctx.moveTo(sxx, top); ctx.lineTo(sxx, yFront); ctx.stroke();
      }
      ctx.fillStyle = U.rgba(U.shade(col, .3), .55);
      for (var rv = 0; rv <= seg; rv++) {
        var rx = x0 + Math.min(w - 4, Math.max(4, w * rv / seg));
        for (var ry = top + 8; ry < yFront - 4; ry += 22) ctx.fillRect(rx - 1.5, ry, 3, 3);
      }
      ctx.save();
      ctx.globalAlpha = .3;
      for (var st2 = 0; st2 < 4; st2++) {
        var stx = x0 + r() * w, stw = r.range(3, 9);
        var sg = ctx.createLinearGradient(0, top, 0, yFront);
        sg.addColorStop(0, 'rgba(150,80,40,.55)');
        sg.addColorStop(1, 'rgba(150,80,40,0)');
        ctx.fillStyle = sg;
        ctx.fillRect(stx, top + r() * h * .3, stw, h);
      }
      ctx.restore();
    } else if (ty === 'rock' || ty === 'debris' || ty === 'bone') {
      /* 岩石 / 瓦砾：随机凿面 */
      for (var f = 0; f < 5; f++) {
        var fx = x0 + r() * w * .8, fy = top + r() * h * .8;
        ctx.fillStyle = U.rgba(r() < .5 ? U.shade(col, .3) : U.shade(col, -.4), .35);
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(fx + r.range(6, 22), fy + r.range(-6, 10));
        ctx.lineTo(fx + r.range(2, 14), fy + r.range(8, 24));
        ctx.closePath(); ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawProp(ctx, b) {
    var col = propColor(b, S.map.ground.accent);
    var x0 = px(b.x), x1 = px(b.x + b.w);
    var yBack = py(b.y), yFront = py(b.y + b.d);
    var h = b.h * Z;

    /* 阴影（斜投影，光来自左上） */
    ctx.save();
    ctx.globalAlpha = .38;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.moveTo(x0 + h * .28, yBack + 2);
    ctx.lineTo(x1 + h * .28, yBack + 2);
    ctx.lineTo(x1 + h * .05, yFront + 4);
    ctx.lineTo(x0 + h * .05, yFront + 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    if (b.h <= 2) {  /* 平面物件 */
      ctx.fillStyle = U.rgba(col, .8);
      ctx.beginPath();
      ctx.moveTo(x0, yBack); ctx.lineTo(x1, yBack); ctx.lineTo(x1, yFront); ctx.lineTo(x0, yFront);
      ctx.closePath(); ctx.fill();
      return;
    }

    /* 右侧面 */
    ctx.fillStyle = U.shade(col, -.42);
    ctx.beginPath();
    ctx.moveTo(x1, yBack); ctx.lineTo(x1, yFront);
    ctx.lineTo(x1, yFront - h); ctx.lineTo(x1, yBack - h);
    ctx.closePath(); ctx.fill();

    /* 正面 */
    var gf = ctx.createLinearGradient(0, yFront - h, 0, yFront);
    gf.addColorStop(0, U.shade(col, -.06));
    gf.addColorStop(1, U.shade(col, -.34));
    ctx.fillStyle = gf;
    ctx.beginPath();
    ctx.moveTo(x0, yFront); ctx.lineTo(x1, yFront);
    ctx.lineTo(x1, yFront - h); ctx.lineTo(x0, yFront - h);
    ctx.closePath(); ctx.fill();

    /* 顶面 */
    ctx.fillStyle = U.shade(col, .22);
    ctx.beginPath();
    ctx.moveTo(x0, yBack - h); ctx.lineTo(x1, yBack - h);
    ctx.lineTo(x1, yFront - h); ctx.lineTo(x0, yFront - h);
    ctx.closePath(); ctx.fill();

    /* 轮廓（二次元描边） */
    ctx.strokeStyle = U.rgba(U.shade(col, -.6), .8);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x0, yFront); ctx.lineTo(x1, yFront); ctx.lineTo(x1, yFront - h);
    ctx.lineTo(x1, yBack - h); ctx.lineTo(x0, yBack - h); ctx.lineTo(x0, yFront - h);
    ctx.closePath();
    ctx.moveTo(x0, yFront - h); ctx.lineTo(x1, yFront - h);
    ctx.stroke();

    /* 顶缘高光 */
    ctx.strokeStyle = U.rgba(U.shade(col, .55), .7);
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x0, yBack - h); ctx.lineTo(x1, yBack - h);
    ctx.stroke();

    /* ---- 顶面细节：高物件的屋顶是画面里最大的一块空白，必须有东西 ---- */
    roofDetail(ctx, b, col, x0, x1, yBack, yFront, h);

    /* ---- 通用表面细节：不让方块只是方块 ---- */
    surfaceDetail(ctx, b, col, x0, x1, yBack, yFront, h);

    /* ---- 特化装饰 ---- */
    var t = S.t;
    switch (b.type) {
      case 'tower':
      case 'outpost':
      case 'hangar':
        /* 窗 */
        if (b.neon || b.type === 'hangar') {
          var nc = b.neon || '#ffcf8a';
          var rows = Math.floor(h / 34);
          for (var r = 0; r < rows; r++) {
            for (var c = 0; c < 3; c++) {
              var wx = x0 + (b.w * Z) * (.18 + c * .3);
              var wy = yFront - h + 18 + r * 34;
              var on = ((r * 3 + c) % 4) !== 1;
              ctx.fillStyle = U.rgba(nc, on ? (.35 + .3 * Math.abs(Math.sin(t * .001 + r + c))) : .08);
              ctx.fillRect(wx, wy, Math.max(6, b.w * Z * .16), 8);
            }
          }
        }
        break;
      case 'neonsign':
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        var flick2 = Math.random() < .06 ? .2 : 1;
        var gg = ctx.createRadialGradient((x0 + x1) / 2, yFront - h * .6, 0, (x0 + x1) / 2, yFront - h * .6, 180);
        gg.addColorStop(0, U.rgba(b.neon, .4 * flick2));
        gg.addColorStop(1, U.rgba(b.neon, 0));
        ctx.fillStyle = gg;
        ctx.fillRect(x0 - 180, yFront - h - 180, (x1 - x0) + 360, h + 360);
        ctx.strokeStyle = U.rgba(b.neon, .9 * flick2);
        ctx.lineWidth = 3;
        ctx.strokeRect(x0 + 6, yFront - h + 10, (x1 - x0) - 12, h * .5);
        ctx.restore();
        break;
      case 'fire': {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        var cxf = (x0 + x1) / 2, cyf = yFront - h * .4;
        for (var k = 0; k < 6; k++) {
          var ph = (t * .003 + k * .17) % 1;
          var fr = 22 * (1 - ph) + 4;
          ctx.fillStyle = U.rgba(k % 2 ? '#ffd479' : '#ff7a3c', (1 - ph) * .55);
          ctx.beginPath();
          ctx.arc(cxf + Math.sin(t * .006 + k) * 8, cyf - ph * 46, fr, 0, U.TAU);
          ctx.fill();
        }
        ctx.restore();
        if (Math.random() < .3) G.Fx.spawn({ x: (x0 + x1) / 2 + U.rand(-8, 8), y: yFront - h * .5,
          vy: -U.rand(.5, 1.4), vx: U.rand(-.2, .2), life: U.rand(500, 1100),
          size: U.rand(1.5, 3), color: '#ffb15e', kind: 'mote', glow: 1 });
        break;
      }
      case 'wreckplane':
        ctx.save();
        G.Art.wreckPlane(ctx, (x0 + x1) / 2, yFront - h * .6, Math.min(1.4, b.w * Z / 180), col);
        ctx.restore();
        break;
      case 'pod':
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        var pg = ctx.createLinearGradient(0, yFront - h, 0, yFront);
        pg.addColorStop(0, U.rgba(b.glow || '#ff4a3c', .35));
        pg.addColorStop(1, U.rgba(b.glow || '#ff4a3c', .05));
        ctx.fillStyle = pg;
        ctx.fillRect(x0 + 4, yFront - h + 8, (x1 - x0) - 8, h - 12);
        ctx.restore();
        break;
      case 'armbase':
        /* 机械臂 */
        ctx.strokeStyle = U.shade(col, .3);
        ctx.lineWidth = 7;
        var axx = (x0 + x1) / 2, ayy = yFront - h;
        var swing = Math.sin(t * .0012) * .5;
        ctx.beginPath();
        ctx.moveTo(axx, ayy);
        var jx = axx + Math.cos(-1.1 + swing) * 60, jy = ayy + Math.sin(-1.1 + swing) * 60;
        ctx.lineTo(jx, jy);
        ctx.lineTo(jx + Math.cos(.4 - swing) * 54, jy + Math.sin(.4 - swing) * 54);
        ctx.stroke();
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        var eg = ctx.createRadialGradient(jx, jy, 0, jx, jy, 40);
        eg.addColorStop(0, U.rgba(b.glow || '#ff3b2f', .5));
        eg.addColorStop(1, U.rgba(b.glow || '#ff3b2f', 0));
        ctx.fillStyle = eg;
        ctx.fillRect(jx - 40, jy - 40, 80, 80);
        ctx.restore();
        break;
      case 'vane':
        ctx.strokeStyle = U.shade(col, .4);
        ctx.lineWidth = 3;
        var vx = (x0 + x1) / 2, vy = yFront - h;
        ctx.save();
        ctx.translate(vx, vy);
        ctx.rotate(t * .004);
        for (var v = 0; v < 3; v++) {
          ctx.rotate(U.TAU / 3);
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(26, 0); ctx.stroke();
        }
        ctx.restore();
        break;
      case 'altar':
      case 'temple':
      case 'throne':
        if (b.glow) {
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          var ag = ctx.createRadialGradient((x0 + x1) / 2, yFront - h * .5, 0, (x0 + x1) / 2, yFront - h * .5, 200);
          ag.addColorStop(0, U.rgba(b.glow, .22 + .08 * Math.sin(t * .002)));
          ag.addColorStop(1, U.rgba(b.glow, 0));
          ctx.fillStyle = ag;
          ctx.fillRect(x0 - 200, yFront - h - 200, (x1 - x0) + 400, h + 400);
          ctx.restore();
        }
        break;
      case 'deadtree':
        ctx.strokeStyle = U.shade(col, -.2);
        ctx.lineWidth = 5;
        var tx = (x0 + x1) / 2, ty2 = yFront - h;
        ctx.beginPath();
        ctx.moveTo(tx, yFront); ctx.lineTo(tx, ty2);
        ctx.moveTo(tx, ty2 + 12); ctx.lineTo(tx - 22, ty2 - 16);
        ctx.moveTo(tx, ty2 + 20); ctx.lineTo(tx + 24, ty2 - 10);
        ctx.stroke();
        break;
      case 'bone':
      case 'spire':
        ctx.strokeStyle = U.rgba('#d8d0c8', .5);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x0 + 4, yFront - 6); ctx.lineTo((x0 + x1) / 2, yFront - h);
        ctx.lineTo(x1 - 4, yFront - 6);
        ctx.stroke();
        break;
      case 'crystal':
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        var cg = ctx.createLinearGradient(x0, yFront, x1, yFront - h);
        cg.addColorStop(0, U.rgba('#c9a8ff', .1));
        cg.addColorStop(1, U.rgba('#e8dcff', .45));
        ctx.fillStyle = cg;
        ctx.beginPath();
        ctx.moveTo(x0, yFront); ctx.lineTo((x0 + x1) / 2, yFront - h * 1.2); ctx.lineTo(x1, yFront);
        ctx.closePath(); ctx.fill();
        ctx.restore();
        break;
      case 'bridge':
      case 'catwalk':
        /* 栏杆 + 桥墩（看得出是可以从下方走过的高架） */
        ctx.strokeStyle = U.shade(col, .34);
        ctx.lineWidth = 2;
        for (var g2 = x0 + 6; g2 < x1; g2 += 44) {
          ctx.beginPath(); ctx.moveTo(g2, yFront - h); ctx.lineTo(g2, yFront - h - 20); ctx.stroke();
        }
        ctx.beginPath(); ctx.moveTo(x0, yFront - h - 20); ctx.lineTo(x1, yFront - h - 20); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x0, yFront - h - 11); ctx.lineTo(x1, yFront - h - 11); ctx.stroke();
        /* 桥面横板 */
        ctx.strokeStyle = U.rgba(U.shade(col, -.4), .6);
        ctx.lineWidth = 1;
        for (var g3 = x0 + 10; g3 < x1; g3 += 22) {
          ctx.beginPath(); ctx.moveTo(g3, yBack - h); ctx.lineTo(g3, yFront - h); ctx.stroke();
        }
        break;
      case 'anchor':
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        var ng = ctx.createRadialGradient((x0 + x1) / 2, yFront - h, 0, (x0 + x1) / 2, yFront - h, 240);
        ng.addColorStop(0, U.rgba(b.neon || '#8fd4ff', .3));
        ng.addColorStop(1, U.rgba(b.neon || '#8fd4ff', 0));
        ctx.fillStyle = ng;
        ctx.fillRect(x0 - 240, yFront - h - 240, (x1 - x0) + 480, h + 480);
        ctx.strokeStyle = U.rgba(b.neon || '#8fd4ff', .7);
        ctx.lineWidth = 2;
        for (var ri = 0; ri < 3; ri++) {
          var rr2 = 40 + ri * 30 + Math.sin(t * .002 + ri) * 6;
          ctx.beginPath();
          ctx.ellipse((x0 + x1) / 2, yFront - h, rr2, rr2 * .35, 0, 0, U.TAU);
          ctx.stroke();
        }
        ctx.restore();
        break;
    }
  }

  /* ---------------- NPC / 玩家 ---------------- */
  function drawNpc(ctx, n) {
    var ch = G.charOf(n.char);
    var sx = px(n.x), sy = py(n.y);
    if (sx < -160 || sx > 1440) return;
    var isT = isTarget({ kind: 'npc', obj: n });
    groundShadow(ctx, sx, sy, .62);

    var decay = n.char === 'ty' ? G.St.s.tyDecay : 0;
    var alt = (n.char === 'madman' && G.St.flag('madmanRevealed')) ? 1 :
              (n.char === 'friend' && G.St.flag('friendRevealed')) ? 1 : 0;
    G.Portrait.draw(ctx, ch, sx, sy, .62, {
      emo: ch.defaultEmo, t: S.t + (n.x * 7), breathT: S.t + n.x * 7,
      flip: n.face === 1 ? false : (S.player.x < n.x),
      decay: decay, alt: alt
    });

    /* 名字 / 目标标记 */
    if (isT) {
      var bob = Math.sin(S.markerPulse * .004) * 5;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = U.rgba('#ffd479', .9);
      ctx.beginPath();
      ctx.moveTo(sx - 9, sy - 92 - bob); ctx.lineTo(sx + 9, sy - 92 - bob); ctx.lineTo(sx, sy - 78 - bob);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    if (U.dist(S.player.x, S.player.y, n.x, n.y) < 220) {
      var lbl = n.label || ch.name;
      /* 名牌垫底：名字常常正好压在别人的立绘上，没有底衬就读不出来 */
      ctx.save();
      ctx.font = '600 12px ' + G.FONT;
      var lw = ctx.measureText(lbl).width + 14;
      ctx.fillStyle = 'rgba(6,10,18,.62)';
      U.roundRect(ctx, sx - lw / 2, sy - 105, lw, 18, 7);
      ctx.fill();
      ctx.strokeStyle = U.rgba(ch.color, .45);
      ctx.lineWidth = 1;
      U.roundRect(ctx, sx - lw / 2, sy - 105, lw, 18, 7);
      ctx.stroke();
      ctx.restore();
      Ui.text(ctx, lbl, sx, sy - 96, {
        size: 12, align: 'center', color: U.rgba(ch.color, .95), glow: 1, glowColor: ch.color
      });
    }
  }

  /* 接地影：软边、贴着脚、随体型缩放。
     硬边纯黑椭圆会让角色看起来是贴在背景上的一张纸片；
     真正把人"放"到地面上的是一层中心浓、边缘化开的接触影。 */
  function groundShadow(ctx, sx, sy, sc) {
    var rx = 26 * sc / .62, ry = rx * TILT * .78;
    ctx.save();
    var g = ctx.createRadialGradient(sx, sy + 2, 0, sx, sy + 2, rx);
    g.addColorStop(0, 'rgba(0,0,0,.52)');
    g.addColorStop(.45, 'rgba(0,0,0,.34)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(sx, sy + 2, rx, ry, 0, 0, U.TAU); ctx.fill();
    /* 脚正下方一小块更实的接触影 */
    ctx.fillStyle = 'rgba(0,0,0,.34)';
    ctx.beginPath(); ctx.ellipse(sx, sy + 1, rx * .36, ry * .42, 0, 0, U.TAU); ctx.fill();
    ctx.restore();
  }

  function drawPlayer(ctx) {
    var sx = px(S.player.x), sy = py(S.player.y);
    groundShadow(ctx, sx, sy, S.player.hidden ? .58 : .74);

    var emo = S.player.hidden ? 'fear' : (S.player.moving > .3 ? 'calm' : 'fear');
    var bob = S.player.moving > .2 ? Math.abs(Math.sin(S.t * .018)) * 3.5 : 0;
    /* 脚下高亮环，避免在杂乱地形里丢失玩家 */
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    var pg = ctx.createRadialGradient(sx, sy, 0, sx, sy, 46);
    pg.addColorStop(0, 'rgba(79,195,247,.30)');
    pg.addColorStop(1, 'rgba(79,195,247,0)');
    ctx.fillStyle = pg;
    ctx.beginPath(); ctx.ellipse(sx, sy, 46, 46 * TILT, 0, 0, U.TAU); ctx.fill();
    ctx.restore();
    G.Portrait.draw(ctx, G.Chars.hero, sx, sy - bob, S.player.hidden ? .58 : .74, {
      emo: emo, t: S.t, breathT: S.player.breathT,
      flip: S.player.face < 0,
      rot: S.player.moving > .2 ? Math.sin(S.t * .018) * .04 : 0
    });
  }

  /* 地图边缘的气流 */
  function drawEdgeAir(ctx) {
    var m = S.map;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    var y1 = py(m.H);
    for (var i = 0; i < 26; i++) {
      var x = ((S.t * .05 + i * 90) % (1400)) - 60;
      var a = .06 + .06 * Math.sin(S.t * .002 + i);
      ctx.fillStyle = 'rgba(200,230,255,' + a + ')';
      ctx.fillRect(x, y1 + 10 + (i % 4) * 14, 70, 1.6);
      ctx.fillRect(x - 30, py(0) - 20 - (i % 4) * 14, 60, 1.4);
    }
    ctx.restore();
  }

  /* ---------------- HUD ---------------- */
  function drawHud(ctx) {
    var s = G.St.s;
    /* 左上：章节 + 区域 */
    Ui.glass(ctx, 20, 18, 330, 68, { r: 12, accent: '#6fd8ff', alpha: .28, glow: .8, tintColor: '#0c1830' });
    Ui.text(ctx, G.Story.hudLabel(), 38, 44, { size: 14, color: '#9fd8ff' });
    Ui.text(ctx, S.map.name, 38, 70, { size: 17, weight: 700, color: '#eaf6ff' });

    /* 右上：轮回 / 精神 */
    var bx = 1260;
    Ui.badge(ctx, bx, 20, '回归 ×' + s.loopCount, { accent: '#c9a8ff', align: 'right', size: 14 });
    /* 精神条 */
    var sanCol = s.sanity > 60 ? '#6fd8ff' : s.sanity > 30 ? '#ffd479' : '#ff5f7a';
    Ui.text(ctx, '精神', 1080, 76, { size: 12, align: 'right', color: '#9fc4dd' });
    Ui.tube(ctx, 1090, 64, 170, 15, s.sanity / 100, { color: sanCol });
    if (s.tyDecay > 0 && G.St.flag('tyAlive')) {
      Ui.text(ctx, 'TY 衰弱', 1080, 104, { size: 12, align: 'right', color: '#9fc4dd' });
      Ui.tube(ctx, 1090, 92, 170, 15, s.tyDecay / 5, { color: '#E0E6ED', segments: 5 });
    }
    /* 情报点 */
    Ui.badge(ctx, bx, 120 + (s.tyDecay > 0 ? 22 : 0), '情报 ' + Math.round(s.intelPoints),
             { accent: '#7CE04A', align: 'right', size: 13 });

    /* 底部：目标 */
    if (S.hint) {
      var w = 0;
      ctx.font = '600 16px ' + G.FONT;
      w = ctx.measureText(S.hint).width + 100;
      Ui.glass(ctx, 640 - w / 2, 634, w, 46, { r: 10, accent: '#ffd479', alpha: .3, glow: 1, tintColor: '#2a2010' });
      Ui.text(ctx, '目标', 640 - w / 2 + 20, 662, { size: 13, color: '#ffd479' });
      Ui.text(ctx, S.hint, 640 - w / 2 + 62, 663, { size: 16, weight: 600, color: '#fff6d8' });
    }

    /* 目标方向箭头 */
    drawTargetArrow(ctx);

    /* 操作提示 */
    Ui.text(ctx, 'WASD 移动    E 交互    Shift 慢走    Esc 暂停', 20, 706,
            { size: 12, color: 'rgba(180,212,235,.5)' });
  }

  function drawTargetArrow(ctx) {
    if (!S.target) return;
    var tx = null, ty = null;
    var arr = S.target.kind === 'npc' ? S.map.npcs : S.map.zones;
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].id === S.target.id) { tx = arr[i].x; ty = arr[i].y; break; }
    }
    if (tx === null) return;
    var sx = px(tx), sy = py(ty);
    if (sx > 60 && sx < 1220 && sy > 60 && sy < 620) return;   /* 已在屏内 */
    var ang = Math.atan2(sy - 360, sx - 640);
    var rx = 640 + Math.cos(ang) * 520, ry = 360 + Math.sin(ang) * 260;
    rx = U.clamp(rx, 50, 1230); ry = U.clamp(ry, 50, 630);
    var pulse = .6 + .4 * Math.sin(S.markerPulse * .005);
    ctx.save();
    ctx.translate(rx, ry);
    ctx.rotate(ang);
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = U.rgba('#ffd479', pulse);
    ctx.beginPath();
    ctx.moveTo(18, 0); ctx.lineTo(-10, -11); ctx.lineTo(-4, 0); ctx.lineTo(-10, 11);
    ctx.closePath(); ctx.fill();
    ctx.restore();
    var dist = Math.round(U.dist(S.player.x, S.player.y, tx, ty) / 10);
    Ui.text(ctx, dist + 'm', rx, ry + 26, { size: 11, align: 'center', color: '#ffd479' });
  }

  function drawPrompt(ctx) {
    var o = S.near.obj;
    var sx, sy, label;
    if (S.near.kind === 'npc') {
      sx = px(o.x); sy = py(o.y) - 104;
      label = '和' + (o.label || G.charOf(o.char).name) + '说话';
    } else {
      sx = px(o.x); sy = py(o.y) - 30;
      label = o.label || '查看';
    }
    Ui.prompt(ctx, sx, sy, 'E', label);
  }

  S.debugInfo = function () {
    return ['region ' + S.map.id, 'pos ' + Math.round(S.player.x) + ',' + Math.round(S.player.y),
            'near ' + (S.near ? S.near.obj.id : '-'), 'target ' + (S.target ? S.target.id : '-')];
  };

  G.Sc.register('map', S);

})(window);
