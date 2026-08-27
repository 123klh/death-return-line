/* ===========================================================
   tween.js — 自写补间 / 时间轴 / 协程调度（替代 GSAP + Anime.js）
   所有时间单位为毫秒；由 game.js 每帧调用 G.Tw.tick(dtMs)
   =========================================================== */
(function (root) {
  'use strict';
  var G = root.G, U = G.U;

  var Tw = G.Tw = {};

  var tweens = [];
  var timers = [];
  var coros = [];
  Tw._tweens = tweens;

  /* ---------------- Tween ---------------- */
  function Tween(target, ms, props) {
    this.target = target;
    this.dur = Math.max(0, ms | 0);
    this.t = 0;
    this.delay = props.delay || 0;
    this.ease = U.easeOf(props.ease || 'outQuad');
    this.onUpdate = props.onUpdate || null;
    this.onComplete = props.onComplete || null;
    this.onStart = props.onStart || null;
    this.repeat = props.repeat || 0;
    this.yoyo = !!props.yoyo;
    this.dir = 1;
    this.done = false;
    this.started = false;
    this.tag = props.tag || null;
    this.keys = [];
    this.from = {};
    this.to = {};
    var skip = { delay: 1, ease: 1, onUpdate: 1, onComplete: 1, onStart: 1, repeat: 1, yoyo: 1, tag: 1, from: 1 };
    for (var k in props) {
      if (skip[k]) continue;
      if (typeof props[k] !== 'number') continue;
      this.keys.push(k);
      this.to[k] = props[k];
    }
    /* 支持显式 from */
    this._explicitFrom = props.from || null;
  }
  Tween.prototype.begin = function () {
    this.started = true;
    for (var i = 0; i < this.keys.length; i++) {
      var k = this.keys[i];
      if (this._explicitFrom && this._explicitFrom[k] !== undefined) {
        this.from[k] = this._explicitFrom[k];
        this.target[k] = this.from[k];
      } else {
        this.from[k] = this.target[k] || 0;
      }
    }
    if (this.onStart) this.onStart(this.target);
  };
  Tween.prototype.step = function (dt) {
    if (this.done) return;
    if (this.delay > 0) {
      this.delay -= dt;
      if (this.delay > 0) return;
      dt = -this.delay; this.delay = 0;
    }
    if (!this.started) this.begin();
    this.t += dt * this.dir;
    var p = this.dur === 0 ? 1 : U.clamp01(this.t / this.dur);
    var e = this.ease(p);
    for (var i = 0; i < this.keys.length; i++) {
      var k = this.keys[i];
      this.target[k] = this.from[k] + (this.to[k] - this.from[k]) * e;
    }
    if (this.onUpdate) this.onUpdate(this.target, p);
    if (this.dir > 0 && p >= 1) {
      if (this.yoyo && this.repeat !== 0) { this.dir = -1; if (this.repeat > 0) this.repeat--; }
      else if (this.repeat !== 0) { this.t = 0; if (this.repeat > 0) this.repeat--; }
      else this.finish();
    } else if (this.dir < 0 && this.t <= 0) {
      this.dir = 1; this.t = 0;
      if (this.repeat === 0) this.finish();
    }
  };
  Tween.prototype.finish = function () {
    if (this.done) return;
    this.done = true;
    if (this.onComplete) this.onComplete(this.target);
  };
  Tween.prototype.kill = function () { this.done = true; };

  Tw.to = function (target, ms, props) {
    var t = new Tween(target, ms, props || {});
    tweens.push(t);
    return t;
  };
  Tw.from = function (target, ms, props) {
    var to = {}, fr = {};
    for (var k in props) {
      if (typeof props[k] === 'number' && k !== 'delay' && k !== 'repeat') {
        fr[k] = props[k]; to[k] = target[k] || 0;
      } else to[k] = props[k];
    }
    to.from = fr;
    return Tw.to(target, ms, to);
  };
  /* 只跑一个 0→1 的进度回调，不绑定属性 */
  Tw.tick01 = function (ms, onUpdate, opt) {
    opt = opt || {};
    var o = { v: 0 };
    return Tw.to(o, ms, {
      v: 1, ease: opt.ease || 'linear', delay: opt.delay || 0,
      onUpdate: function (_, p) { onUpdate(o.v, p); },
      onComplete: opt.onComplete || null, tag: opt.tag
    });
  };
  Tw.delay = function (ms, fn) {
    var o = { ms: ms, fn: fn, done: false };
    timers.push(o);
    return o;
  };
  Tw.killOf = function (target) {
    for (var i = 0; i < tweens.length; i++) if (tweens[i].target === target) tweens[i].done = true;
  };
  Tw.killTag = function (tag) {
    for (var i = 0; i < tweens.length; i++) if (tweens[i].tag === tag) tweens[i].done = true;
  };
  Tw.killAll = function () {
    tweens.length = 0; timers.length = 0; coros.length = 0;
  };

  /* ---------------- Timeline ---------------- */
  /* 用法：
       G.Tw.line()
         .to(obj, 400, {x:100})
         .call(fn)
         .wait(200)
         .par([ [obj,300,{a:1}], [obj2,300,{a:0}] ])
         .start();
  */
  function Timeline() { this.steps = []; this.i = 0; this.cur = null; this.done = false; this.playing = false; }
  Timeline.prototype.to = function (target, ms, props) { this.steps.push({ k: 'to', target: target, ms: ms, props: props || {} }); return this; };
  Timeline.prototype.wait = function (ms) { this.steps.push({ k: 'wait', ms: ms }); return this; };
  Timeline.prototype.call = function (fn) { this.steps.push({ k: 'call', fn: fn }); return this; };
  Timeline.prototype.par = function (list) { this.steps.push({ k: 'par', list: list }); return this; };
  Timeline.prototype.tick01 = function (ms, fn, opt) { this.steps.push({ k: 'p01', ms: ms, fn: fn, opt: opt || {} }); return this; };
  Timeline.prototype.then = function (fn) { this.onDone = fn; return this; };
  Timeline.prototype.start = function () {
    this.playing = true; this._advance();
    Tw._lines.push(this);
    return this;
  };
  Timeline.prototype._advance = function () {
    var self = this;
    if (this.i >= this.steps.length) {
      this.done = true; this.playing = false;
      if (this.onDone) this.onDone();
      return;
    }
    var s = this.steps[this.i++];
    if (s.k === 'to') {
      var p = U.merge({}, s.props);
      var oc = p.onComplete;
      p.onComplete = function () { if (oc) oc(); self._advance(); };
      Tw.to(s.target, s.ms, p);
    } else if (s.k === 'wait') {
      Tw.delay(s.ms, function () { self._advance(); });
    } else if (s.k === 'call') {
      if (s.fn) s.fn();
      this._advance();
    } else if (s.k === 'p01') {
      var op = U.merge({}, s.opt);
      var oc2 = op.onComplete;
      op.onComplete = function () { if (oc2) oc2(); self._advance(); };
      Tw.tick01(s.ms, s.fn, op);
    } else if (s.k === 'par') {
      var n = s.list.length;
      if (!n) { this._advance(); return; }
      var left = n;
      var fin = function () { left--; if (left <= 0) self._advance(); };
      for (var i = 0; i < n; i++) {
        var it = s.list[i];
        var props = U.merge({}, it[2] || {});
        var pc = props.onComplete;
        props.onComplete = function (prev) { return function () { if (prev) prev(); fin(); }; }(pc);
        Tw.to(it[0], it[1], props);
      }
    }
  };
  Timeline.prototype.kill = function () { this.done = true; this.playing = false; this.i = this.steps.length; };
  Tw._lines = [];
  Tw.line = function () { return new Timeline(); };

  /* ---------------- 协程（generator）调度 ----------------
     用于弹幕脚本 / 过场：
       yield <number>   → 等待 N 帧
       yield {ms:800}   → 等待毫秒
       yield {until:fn} → 等待条件为真
       yield* other(..) → 子例程
     每个协程返回句柄 {done, kill()}
  */
  function Coro(gen, owner) {
    this.gen = gen; this.owner = owner || null;
    this.waitFrames = 0; this.waitMs = 0; this.until = null;
    this.done = false; this.killed = false;
  }
  Coro.prototype.kill = function () { this.killed = true; this.done = true; };
  Coro.prototype.step = function (dtMs, frames) {
    if (this.done) return;
    if (this.until) {
      if (!this.until()) return;
      this.until = null;
    }
    if (this.waitMs > 0) {
      this.waitMs -= dtMs;
      if (this.waitMs > 0) return;
    }
    if (this.waitFrames > 0) {
      this.waitFrames -= frames;
      if (this.waitFrames > 0) return;
    }
    /* 允许一帧内连续推进（yield 0） */
    var guard = 0;
    while (guard++ < 512) {
      var r;
      try { r = this.gen.next(); }
      catch (e) {
        console.error('[coro]', e);
        this.done = true; return;
      }
      if (r.done) { this.done = true; return; }
      var v = r.value;
      if (typeof v === 'number') {
        if (v <= 0) continue;
        this.waitFrames = v; return;
      }
      if (v && typeof v === 'object') {
        if (v.ms !== undefined) { this.waitMs = v.ms; return; }
        if (v.until) {
          this.until = v.until;
          if (this.until()) { this.until = null; continue; }
          return;
        }
        if (v.frames !== undefined) { this.waitFrames = v.frames; return; }
      }
      /* yield undefined → 等 1 帧 */
      this.waitFrames = 1; return;
    }
  };
  Tw.coro = function (gen, owner) {
    var c = new Coro(gen, owner);
    coros.push(c);
    return c;
  };
  Tw.killCoros = function (owner) {
    for (var i = 0; i < coros.length; i++) if (coros[i].owner === owner) coros[i].kill();
  };

  /* ---------------- 全局 tick ---------------- */
  Tw.tick = function (dtMs, frames) {
    frames = frames === undefined ? dtMs / (1000 / 60) : frames;
    var i;
    for (i = 0; i < tweens.length; i++) tweens[i].step(dtMs);
    for (i = tweens.length - 1; i >= 0; i--) if (tweens[i].done) tweens.splice(i, 1);

    for (i = 0; i < timers.length; i++) {
      var tm = timers[i];
      if (tm.done) continue;
      tm.ms -= dtMs;
      if (tm.ms <= 0) { tm.done = true; if (tm.fn) tm.fn(); }
    }
    for (i = timers.length - 1; i >= 0; i--) if (timers[i].done) timers.splice(i, 1);

    for (i = 0; i < coros.length; i++) coros[i].step(dtMs, frames);
    for (i = coros.length - 1; i >= 0; i--) if (coros[i].done) coros.splice(i, 1);

    for (i = Tw._lines.length - 1; i >= 0; i--) if (Tw._lines[i].done) Tw._lines.splice(i, 1);
  };

  Tw.count = function () { return tweens.length + timers.length + coros.length; };

})(window);
