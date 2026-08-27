/* ===========================================================
   audio.js — 全程序化音频（无素材）
     · 每角色差异化「哔声」（Undertale 式逐字发声）
     · 分层程序化 BGM（章节/Boss 主题，可抽层做变奏与静音）
     · SFX 合成
   =========================================================== */
(function (root) {
  'use strict';
  var G = root.G, U = G.U;

  var Aud = G.Aud = {
    ready: false,
    ctx: null,
    master: null,
    busBgm: null, busSfx: null, busVoice: null,
    vol: { master: 0.85, bgm: 0.55, sfx: 0.8, voice: 0.7 },
    muted: false,
    curTheme: null,
    layers: { pad: true, bass: true, arp: true, lead: true, drums: true },
    _noiseBuf: null,
    _step: 0,
    _nextTime: 0,
    _timer: null
  };

  /* ---------------- 初始化（需用户手势） ---------------- */
  Aud.init = function () {
    if (Aud.ready) return true;
    var AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return false;
    try { Aud.ctx = new AC(); } catch (e) { return false; }
    var c = Aud.ctx;
    Aud.master = c.createGain(); Aud.master.gain.value = Aud.vol.master;
    Aud.master.connect(c.destination);

    /* 轻压限，防弹幕爆音 */
    var comp = c.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 22;
    comp.ratio.value = 5; comp.attack.value = 0.004; comp.release.value = 0.2;
    comp.connect(Aud.master);
    Aud.pre = comp;

    Aud.busBgm = c.createGain(); Aud.busBgm.gain.value = Aud.vol.bgm; Aud.busBgm.connect(comp);
    Aud.busSfx = c.createGain(); Aud.busSfx.gain.value = Aud.vol.sfx; Aud.busSfx.connect(comp);
    Aud.busVoice = c.createGain(); Aud.busVoice.gain.value = Aud.vol.voice; Aud.busVoice.connect(comp);

    /* 噪声缓冲（2s 白噪） */
    var len = c.sampleRate * 2;
    var buf = c.createBuffer(1, len, c.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    Aud._noiseBuf = buf;

    Aud.ready = true;
    Aud._startSequencer();
    return true;
  };

  Aud.resume = function () {
    if (Aud.ctx && Aud.ctx.state === 'suspended') Aud.ctx.resume();
  };

  Aud.setVol = function (which, v) {
    Aud.vol[which] = U.clamp01(v);
    if (!Aud.ready) return;
    if (which === 'master') Aud.master.gain.value = Aud.muted ? 0 : v;
    if (which === 'bgm') Aud.busBgm.gain.value = v;
    if (which === 'sfx') Aud.busSfx.gain.value = v;
    if (which === 'voice') Aud.busVoice.gain.value = v;
  };
  Aud.setMuted = function (m) {
    Aud.muted = m;
    if (Aud.ready) Aud.master.gain.value = m ? 0 : Aud.vol.master;
  };

  function now() { return Aud.ctx.currentTime; }

  /* ---------------- 基础发声器 ---------------- */
  function tone(opt) {
    if (!Aud.ready) return null;
    var c = Aud.ctx, t0 = opt.at || now();
    var o = c.createOscillator();
    o.type = opt.wave || 'square';
    o.frequency.setValueAtTime(opt.f, t0);
    if (opt.f2 !== undefined) {
      if (opt.glideExp) o.frequency.exponentialRampToValueAtTime(Math.max(1, opt.f2), t0 + (opt.dur || .1));
      else o.frequency.linearRampToValueAtTime(opt.f2, t0 + (opt.dur || .1));
    }
    if (opt.detune) o.detune.value = opt.detune;
    var g = c.createGain();
    var peak = opt.gain === undefined ? 0.2 : opt.gain;
    var a = opt.attack === undefined ? 0.004 : opt.attack;
    var dur = opt.dur || 0.1;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + a);
    if (opt.sustain) {
      g.gain.setValueAtTime(peak, t0 + dur * 0.6);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    } else {
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    }
    var node = o;
    if (opt.filter) {
      var f = c.createBiquadFilter();
      f.type = opt.filter; f.frequency.value = opt.fc || 1200;
      if (opt.q !== undefined) f.Q.value = opt.q;
      if (opt.fc2) f.frequency.exponentialRampToValueAtTime(Math.max(40, opt.fc2), t0 + dur);
      node.connect(f); f.connect(g);
    } else node.connect(g);
    g.connect(opt.bus || Aud.busSfx);
    o.start(t0); o.stop(t0 + dur + 0.02);
    return { osc: o, gain: g };
  }
  Aud.tone = tone;

  function noise(opt) {
    if (!Aud.ready) return null;
    var c = Aud.ctx, t0 = opt.at || now();
    var s = c.createBufferSource();
    s.buffer = Aud._noiseBuf; s.loop = true;
    var f = c.createBiquadFilter();
    f.type = opt.filter || 'bandpass';
    f.frequency.setValueAtTime(opt.fc || 900, t0);
    if (opt.fc2) f.frequency.exponentialRampToValueAtTime(Math.max(40, opt.fc2), t0 + (opt.dur || .2));
    f.Q.value = opt.q === undefined ? 1.2 : opt.q;
    var g = c.createGain();
    var peak = opt.gain === undefined ? 0.2 : opt.gain;
    var dur = opt.dur || 0.2;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + (opt.attack || 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(opt.bus || Aud.busSfx);
    s.start(t0); s.stop(t0 + dur + 0.02);
    return { src: s, gain: g };
  }
  Aud.noise = noise;

  /* ---------------- 角色哔声 ----------------
     voice = {wave, f, jitter, dur, gain, noise, dual, fc, glide, unstable}
     idx 用于「双重音轨」交替与不规则抖动的确定性
  */
  Aud.beep = function (voice, idx, mood) {
    if (!Aud.ready || !voice) return;
    idx = idx || 0;
    var v = voice;
    var f = v.f || 440;
    var jitter = v.jitter || 0;
    /* 不规则型（疯癫初期）：大幅随机跳频 */
    if (v.unstable) f *= (0.55 + Math.random() * 1.5);
    else f *= (1 + (Math.random() * 2 - 1) * jitter * 0.01);
    /* 情绪微调 */
    if (mood === 'fear') f *= 0.94 + Math.sin(idx * 1.7) * 0.05;
    else if (mood === 'anger') f *= 1.08;
    else if (mood === 'sad') f *= 0.9;
    else if (mood === 'numb') f *= 0.82;

    var dur = v.dur || 0.045;
    var gain = (v.gain === undefined ? 0.16 : v.gain);

    if (v.dual) {
      /* 最终Boss：温柔低沉 + 尖锐刺耳 交替 */
      var soft = (idx % 2) === 0;
      tone({ wave: soft ? 'sine' : 'sawtooth', f: soft ? f * 0.5 : f * 1.5, dur: dur * (soft ? 1.6 : 1),
             gain: gain * (soft ? 1.1 : 0.62), bus: Aud.busVoice, filter: 'lowpass', fc: soft ? 900 : 5200 });
      if (!soft) noise({ fc: 3200, q: 3, dur: dur * 0.8, gain: gain * 0.16, bus: Aud.busVoice });
      return;
    }

    tone({
      wave: v.wave || 'square', f: f,
      f2: v.glide ? f * v.glide : undefined, glideExp: true,
      dur: dur, gain: gain, bus: Aud.busVoice,
      filter: v.fc ? 'lowpass' : null, fc: v.fc
    });
    /* 电流杂音（被操控的朋友 / 后期TY） */
    if (v.noise) {
      noise({ fc: 1400 + Math.random() * 2600, q: 2.2, dur: dur * 1.4,
              gain: gain * v.noise, bus: Aud.busVoice });
    }
    /* 和声（IF线正直的人） */
    if (v.harm) {
      tone({ wave: 'sine', f: f * 0.5, dur: dur * 2.4, gain: gain * 0.5,
             bus: Aud.busVoice, filter: 'lowpass', fc: 700 });
    }
  };

  /* TY 复活副作用：撕心裂肺 */
  Aud.scream = function (dur) {
    if (!Aud.ready) return;
    dur = dur || 3.2;
    var t0 = now();
    for (var i = 0; i < 26; i++) {
      var t = t0 + i * (dur / 26);
      tone({ wave: 'sawtooth', at: t, f: 260 + Math.random() * 900, f2: 120 + Math.random() * 400,
             dur: dur / 26 * 1.6, gain: 0.11, bus: Aud.busVoice, filter: 'lowpass', fc: 3600, glideExp: true });
      noise({ at: t, fc: 900 + Math.random() * 3000, q: 1.6, dur: dur / 26 * 1.8, gain: 0.075 });
    }
    tone({ wave: 'square', f: 90, f2: 40, dur: dur, gain: 0.06, glideExp: true, filter: 'lowpass', fc: 500 });
  };

  /* ---------------- SFX 库 ---------------- */
  var S = Aud.sfx = {};

  S.shoot = function () { tone({ wave: 'square', f: 880, f2: 420, dur: .055, gain: .055, glideExp: true, filter: 'highpass', fc: 300 }); };
  S.shootHeavy = function () { tone({ wave: 'sawtooth', f: 300, f2: 130, dur: .1, gain: .07, glideExp: true, filter: 'lowpass', fc: 1800 }); };
  S.enemyShoot = function () { tone({ wave: 'triangle', f: 520, f2: 300, dur: .06, gain: .035, glideExp: true }); };
  S.hit = function () { noise({ fc: 1800, fc2: 400, q: 1, dur: .09, gain: .16 }); };
  S.graze = function () { tone({ wave: 'sine', f: 2600, dur: .03, gain: .05 }); };
  S.playerHit = function () {
    noise({ fc: 900, fc2: 120, q: .8, dur: .45, gain: .3 });
    tone({ wave: 'square', f: 200, f2: 55, dur: .4, gain: .16, glideExp: true, filter: 'lowpass', fc: 900 });
  };
  S.explode = function (big) {
    var d = big ? .9 : .38;
    noise({ fc: big ? 700 : 1500, fc2: big ? 60 : 180, q: .7, dur: d, gain: big ? .38 : .2 });
    tone({ wave: 'sine', f: big ? 130 : 220, f2: big ? 32 : 70, dur: d, gain: big ? .3 : .13, glideExp: true });
    if (big) noise({ fc: 240, fc2: 40, q: .5, dur: 1.6, gain: .14, at: now() + .06 });
  };
  S.bomb = function () {
    var t0 = now();
    tone({ wave: 'sine', f: 1400, f2: 60, dur: .8, gain: .26, glideExp: true });
    noise({ fc: 4000, fc2: 100, q: .6, dur: 1.1, gain: .3 });
    for (var i = 0; i < 5; i++) tone({ at: t0 + i * .07, wave: 'triangle', f: 900 - i * 120, dur: .3, gain: .07 });
  };
  S.shield = function () {
    tone({ wave: 'sine', f: 300, f2: 900, dur: .45, gain: .16, glideExp: true });
    tone({ wave: 'sine', f: 450, f2: 1350, dur: .45, gain: .08, glideExp: true });
  };
  S.slowmo = function () {
    tone({ wave: 'sine', f: 700, f2: 90, dur: 1.1, gain: .18, glideExp: true, filter: 'lowpass', fc: 2400, fc2: 400 });
  };
  S.alarm = function () {
    var t0 = now();
    for (var i = 0; i < 4; i++) {
      tone({ at: t0 + i * .3, wave: 'square', f: 880, dur: .13, gain: .1, filter: 'lowpass', fc: 2600 });
      tone({ at: t0 + i * .3 + .14, wave: 'square', f: 660, dur: .13, gain: .1, filter: 'lowpass', fc: 2600 });
    }
  };
  S.glitch = function (n) {
    if (!Aud.ready) return;
    n = n || 8; var t0 = now();
    for (var i = 0; i < n; i++) {
      var t = t0 + Math.random() * .5;
      noise({ at: t, fc: 300 + Math.random() * 5000, q: 4, dur: .03 + Math.random() * .06, gain: .12 });
      if (Math.random() < .5) tone({ at: t, wave: 'square', f: 100 + Math.random() * 2400, dur: .04, gain: .07 });
    }
  };
  /* 时间倒流（死亡回归） */
  S.rewind = function () {
    if (!Aud.ready) return;
    var t0 = now();
    tone({ wave: 'sawtooth', f: 60, f2: 1200, dur: 2.2, gain: .14, glideExp: true, filter: 'lowpass', fc: 400, fc2: 6000 });
    tone({ wave: 'sine', f: 40, f2: 700, dur: 2.4, gain: .2, glideExp: true });
    for (var i = 0; i < 22; i++) {
      var t = t0 + i * .095;
      noise({ at: t, fc: 200 + i * 260, q: 5, dur: .1, gain: .07 });
    }
    noise({ at: t0 + 2.2, fc: 2000, fc2: 200, q: 1, dur: .7, gain: .22 });
  };
  S.heartbeat = function () {
    var t0 = now();
    tone({ at: t0, wave: 'sine', f: 62, f2: 40, dur: .2, gain: .3, glideExp: true });
    tone({ at: t0 + .22, wave: 'sine', f: 55, f2: 34, dur: .26, gain: .22, glideExp: true });
  };
  S.shatter = function () {
    var t0 = now();
    noise({ fc: 5200, fc2: 1600, q: 2, dur: .5, gain: .2 });
    for (var i = 0; i < 12; i++) {
      tone({ at: t0 + Math.random() * .35, wave: 'triangle', f: 1400 + Math.random() * 3200,
             dur: .18, gain: .045, filter: 'highpass', fc: 900 });
    }
  };
  S.uiMove = function () { tone({ wave: 'triangle', f: 620, dur: .04, gain: .06 }); };
  S.uiOk = function () {
    tone({ wave: 'triangle', f: 620, dur: .07, gain: .08 });
    tone({ at: now() + .06, wave: 'triangle', f: 930, dur: .1, gain: .07 });
  };
  S.uiBack = function () { tone({ wave: 'triangle', f: 400, f2: 260, dur: .1, gain: .07, glideExp: true }); };
  S.uiDeny = function () { tone({ wave: 'square', f: 180, dur: .14, gain: .09, filter: 'lowpass', fc: 800 }); };
  S.powerup = function () {
    var t0 = now();
    for (var i = 0; i < 4; i++) tone({ at: t0 + i * .05, wave: 'triangle', f: 520 * Math.pow(1.26, i), dur: .12, gain: .07 });
  };
  S.warn = function () { tone({ wave: 'sawtooth', f: 240, dur: .3, gain: .09, filter: 'lowpass', fc: 1200 }); };
  S.charge = function (dur) {
    tone({ wave: 'sawtooth', f: 80, f2: 900, dur: dur || 1.6, gain: .1, glideExp: true, filter: 'lowpass', fc: 600, fc2: 4000 });
  };
  S.laser = function () {
    tone({ wave: 'sawtooth', f: 1600, f2: 900, dur: .5, gain: .1, glideExp: true, filter: 'bandpass', fc: 2000, q: 6 });
    noise({ fc: 3000, q: 8, dur: .5, gain: .07 });
  };
  S.bossDown = function () {
    var t0 = now();
    for (var i = 0; i < 9; i++) {
      noise({ at: t0 + i * .16, fc: 1200 - i * 100, fc2: 60, q: .6, dur: .5, gain: .2 });
      tone({ at: t0 + i * .16, wave: 'sine', f: 180 - i * 12, f2: 40, dur: .5, gain: .12, glideExp: true });
    }
  };
  /* 风声（寂静场景铺底），返回停止函数 */
  S.wind = function (gain) {
    if (!Aud.ready) return function () {};
    var c = Aud.ctx, t0 = now();
    var s = c.createBufferSource(); s.buffer = Aud._noiseBuf; s.loop = true;
    var f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 420; f.Q.value = .6;
    var lfo = c.createOscillator(); lfo.frequency.value = .13;
    var lg = c.createGain(); lg.gain.value = 220;
    lfo.connect(lg); lg.connect(f.frequency);
    var g = c.createGain(); g.gain.value = 0;
    g.gain.linearRampToValueAtTime(gain === undefined ? .1 : gain, t0 + 1.5);
    s.connect(f); f.connect(g); g.connect(Aud.busSfx);
    s.start(t0); lfo.start(t0);
    return function (fade) {
      var t = now();
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(g.gain.value, t);
      g.gain.linearRampToValueAtTime(0.0001, t + (fade || 1));
      try { s.stop(t + (fade || 1) + .1); lfo.stop(t + (fade || 1) + .1); } catch (e) {}
    };
  };

  /* ---------------- BGM：分层步进音序器 ---------------- */
  /* 音阶（半音偏移） */
  var SCALES = {
    minor:      [0, 2, 3, 5, 7, 8, 10],
    harmMinor:  [0, 2, 3, 5, 7, 8, 11],
    dorian:     [0, 2, 3, 5, 7, 9, 10],
    phrygian:   [0, 1, 3, 5, 7, 8, 10],
    major:      [0, 2, 4, 5, 7, 9, 11],
    lydian:     [0, 2, 4, 6, 7, 9, 11],
    penta:      [0, 3, 5, 7, 10],
    whole:      [0, 2, 4, 6, 8, 10]
  };
  function midi(n) { return 440 * Math.pow(2, (n - 69) / 12); }
  function deg(root, scaleName, d, oct) {
    var sc = SCALES[scaleName] || SCALES.minor;
    var n = sc.length;
    var i = ((d % n) + n) % n;
    var o = Math.floor(d / n) + (oct || 0);
    return midi(root + sc[i] + o * 12);
  }

  /* 主题库：id → 配置 */
  var THEMES = Aud.THEMES = {
    title:    { bpm: 74,  root: 57, scale: 'minor',     prog: [0, 5, 3, 4], pad: .1,  bass: .07, arp: .055, lead: .05, drums: 0, arpFig: [0, 2, 4, 2], leadFig: [4, 3, 2, 4, 6, 4], wave: { pad: 'sine', bass: 'triangle', arp: 'triangle', lead: 'sine' } },
    camp:     { bpm: 68,  root: 55, scale: 'major',     prog: [0, 3, 5, 4], pad: .09, bass: .06, arp: .05,  lead: .045, drums: 0, arpFig: [0, 2, 4, 6], leadFig: [2, 4, 2, 0], wave: { pad: 'sine', bass: 'sine', arp: 'triangle', lead: 'triangle' } },
    grief:    { bpm: 52,  root: 53, scale: 'minor',     prog: [0, 5, 2, 5], pad: .12, bass: .05, arp: 0,    lead: .05, drums: 0, arpFig: [0], leadFig: [0, 2, 1, 0], wave: { pad: 'sine', bass: 'sine', arp: 'sine', lead: 'sine' } },
    ruins:    { bpm: 84,  root: 56, scale: 'dorian',    prog: [0, 4, 5, 2], pad: .08, bass: .07, arp: .05,  lead: .04, drums: 1, arpFig: [0, 3, 5, 3], leadFig: [5, 4, 2, 4], wave: { pad: 'sawtooth', bass: 'square', arp: 'triangle', lead: 'square' } },
    storm:    { bpm: 96,  root: 54, scale: 'phrygian',  prog: [0, 1, 0, 5], pad: .09, bass: .08, arp: .05,  lead: .045, drums: 1, arpFig: [0, 1, 4, 1], leadFig: [4, 5, 4, 1], wave: { pad: 'sawtooth', bass: 'sawtooth', arp: 'square', lead: 'sawtooth' } },
    factory:  { bpm: 104, root: 52, scale: 'minor',     prog: [0, 0, 5, 6], pad: .07, bass: .09, arp: .05,  lead: .04, drums: 1, arpFig: [0, 0, 3, 5], leadFig: [0, 3, 5, 3], wave: { pad: 'square', bass: 'square', arp: 'square', lead: 'sawtooth' } },
    shrine:   { bpm: 62,  root: 50, scale: 'harmMinor', prog: [0, 6, 4, 5], pad: .12, bass: .06, arp: .05,  lead: .05, drums: 0, arpFig: [0, 4, 6, 4], leadFig: [6, 5, 4, 2], wave: { pad: 'sine', bass: 'triangle', arp: 'sine', lead: 'triangle' } },
    core:     { bpm: 88,  root: 48, scale: 'whole',     prog: [0, 3, 1, 5], pad: .11, bass: .09, arp: .05,  lead: .05, drums: 1, arpFig: [0, 2, 4, 6], leadFig: [6, 4, 2, 0], wave: { pad: 'sawtooth', bass: 'sawtooth', arp: 'square', lead: 'sawtooth' } },

    boss1:    { bpm: 128, root: 57, scale: 'minor',     prog: [0, 0, 5, 6], pad: .06, bass: .09, arp: .055, lead: .05, drums: 1, arpFig: [0, 4, 2, 4], leadFig: [0, 2, 4, 6, 4, 2], wave: { pad: 'sawtooth', bass: 'square', arp: 'square', lead: 'sawtooth' } },
    boss2:    { bpm: 142, root: 58, scale: 'whole',     prog: [0, 2, 4, 6], pad: .05, bass: .08, arp: .06,  lead: .055, drums: 1, arpFig: [0, 3, 1, 5, 2, 6], leadFig: [6, 1, 4, 0, 5, 2], wave: { pad: 'square', bass: 'sawtooth', arp: 'square', lead: 'square' }, chaos: 1 },
    boss3:    { bpm: 134, root: 55, scale: 'phrygian',  prog: [0, 1, 5, 1], pad: .06, bass: .1,  arp: .05,  lead: .05, drums: 1, arpFig: [0, 1, 3, 1], leadFig: [3, 4, 5, 4], wave: { pad: 'sawtooth', bass: 'sawtooth', arp: 'square', lead: 'sawtooth' } },
    boss4:    { bpm: 92,  root: 53, scale: 'minor',     prog: [0, 5, 3, 4], pad: .12, bass: .07, arp: .045, lead: .06, drums: 1, arpFig: [0, 2, 4, 2], leadFig: [4, 3, 2, 0], wave: { pad: 'sine', bass: 'triangle', arp: 'sine', lead: 'triangle' }, sorrow: 1 },
    boss5:    { bpm: 120, root: 56, scale: 'dorian',    prog: [0, 4, 2, 5], pad: .08, bass: .09, arp: .055, lead: .055, drums: 1, arpFig: [0, 2, 4, 6], leadFig: [2, 4, 6, 4], wave: { pad: 'sawtooth', bass: 'square', arp: 'triangle', lead: 'square' } },
    boss6a:   { bpm: 108, root: 50, scale: 'harmMinor', prog: [0, 5, 6, 4], pad: .11, bass: .1,  arp: .05,  lead: .055, drums: 1, arpFig: [0, 4, 6, 4], leadFig: [6, 4, 2, 4], wave: { pad: 'sine', bass: 'sawtooth', arp: 'triangle', lead: 'sawtooth' } },
    boss6b:   { bpm: 138, root: 50, scale: 'phrygian',  prog: [0, 1, 6, 5], pad: .08, bass: .11, arp: .06,  lead: .06, drums: 1, arpFig: [0, 1, 4, 6], leadFig: [1, 4, 6, 4], wave: { pad: 'sawtooth', bass: 'sawtooth', arp: 'square', lead: 'sawtooth' } },
    boss6c:   { bpm: 152, root: 48, scale: 'whole',     prog: [0, 2, 4, 6], pad: .09, bass: .12, arp: .06,  lead: .065, drums: 1, arpFig: [0, 2, 4, 6, 4, 2], leadFig: [6, 4, 6, 2, 0], wave: { pad: 'sawtooth', bass: 'sawtooth', arp: 'sawtooth', lead: 'sawtooth' } },

    ifline:   { bpm: 112, root: 55, scale: 'major',     prog: [0, 4, 5, 3], pad: .12, bass: .09, arp: .055, lead: .06, drums: 1, arpFig: [0, 2, 4, 6], leadFig: [4, 6, 5, 4, 2], wave: { pad: 'sine', bass: 'triangle', arp: 'triangle', lead: 'sine' }, holy: 1 },
    hope:     { bpm: 76,  root: 57, scale: 'major',     prog: [0, 4, 5, 3], pad: .11, bass: .06, arp: .05,  lead: .05, drums: 0, arpFig: [0, 2, 4, 2], leadFig: [4, 2, 0, 2], wave: { pad: 'sine', bass: 'sine', arp: 'sine', lead: 'sine' } },
    dread:    { bpm: 58,  root: 46, scale: 'phrygian',  prog: [0, 1, 0, 1], pad: .13, bass: .07, arp: 0,    lead: 0,   drums: 0, arpFig: [0], leadFig: [0], wave: { pad: 'sawtooth', bass: 'sine', arp: 'sine', lead: 'sine' } },
    /* 坏结局D「秩序的恐怖」：机械重复的进行曲，压抑、扭曲 */
    tyrant:   { bpm: 72,  root: 45, scale: 'phrygian',  prog: [0, 0, 1, 1], pad: .12, bass: .11, arp: .04,  lead: .045, drums: 1, arpFig: [0, 0, 1, 0], leadFig: [1, 0, 1, 0], wave: { pad: 'sawtooth', bass: 'square', arp: 'square', lead: 'sawtooth' } },
    void:     { bpm: 44,  root: 43, scale: 'minor',     prog: [0, 0, 0, 0], pad: .1,  bass: .05, arp: 0,    lead: 0,   drums: 0, arpFig: [0], leadFig: [0], wave: { pad: 'sine', bass: 'sine', arp: 'sine', lead: 'sine' } }
  };

  var seq = {
    theme: null, bar: 0, step: 0, nextT: 0, intensity: 1, running: false
  };
  Aud._seq = seq;

  function schedStep(th, step, t) {
    var bar = Math.floor(step / 16) % th.prog.length;
    var s = step % 16;
    var chord = th.prog[bar];
    var W = th.wave || {};
    var I = seq.intensity;
    var L = Aud.layers;

    /* Pad：每小节头，长音三和弦 */
    if (L.pad && s === 0 && th.pad) {
      var spb = 60 / th.bpm;
      var barLen = spb * 4;
      [0, 2, 4].forEach(function (d, k) {
        tone({ at: t, wave: W.pad || 'sine', f: deg(th.root, th.scale, chord + d, k === 0 ? 0 : 0),
               dur: barLen * 1.05, gain: th.pad * I * (k === 0 ? 1 : .62), attack: barLen * .25,
               sustain: true, bus: Aud.busBgm, filter: 'lowpass', fc: th.holy ? 3000 : 1500 });
      });
    }
    /* Bass：1、3 拍 + 切分 */
    if (L.bass && th.bass && (s === 0 || s === 6 || s === 8 || s === 11)) {
      tone({ at: t, wave: W.bass || 'triangle', f: deg(th.root, th.scale, chord, -1),
             dur: .3, gain: th.bass * I, bus: Aud.busBgm, filter: 'lowpass', fc: 620 });
    }
    /* Arp：八分音符 */
    if (L.arp && th.arp && s % 2 === 0) {
      var fig = th.arpFig || [0, 2, 4, 2];
      var d2 = fig[(s / 2) % fig.length];
      if (th.chaos && Math.random() < .35) d2 += U.randInt(-2, 3);
      tone({ at: t, wave: W.arp || 'triangle', f: deg(th.root, th.scale, chord + d2, 1),
             dur: .14, gain: th.arp * I, bus: Aud.busBgm, filter: 'lowpass', fc: 4200 });
    }
    /* Lead：每两拍一个动机音 */
    if (L.lead && th.lead && s % 4 === 2) {
      var lf = th.leadFig || [4, 2];
      var d3 = lf[(Math.floor(step / 4)) % lf.length];
      tone({ at: t, wave: W.lead || 'square', f: deg(th.root, th.scale, chord + d3, 2),
             dur: .34, gain: th.lead * I * (th.sorrow ? .8 : 1), bus: Aud.busBgm,
             filter: 'lowpass', fc: 5000 });
      if (th.holy) tone({ at: t, wave: 'sine', f: deg(th.root, th.scale, chord + d3, 3), dur: .5, gain: th.lead * .35 * I, bus: Aud.busBgm });
    }
    /* 鼓 */
    if (L.drums && th.drums) {
      if (s === 0 || s === 8 || (s === 6 && th.bpm > 120)) {
        tone({ at: t, wave: 'sine', f: 110, f2: 44, dur: .17, gain: .3 * I, glideExp: true, bus: Aud.busBgm });
      }
      if (s === 4 || s === 12) {
        noise({ at: t, fc: 1500, fc2: 600, q: .8, dur: .13, gain: .12 * I, bus: Aud.busBgm });
      }
      if (s % 2 === 0) {
        noise({ at: t, fc: 7000, q: 1.5, dur: .035, gain: .045 * I, bus: Aud.busBgm });
      }
    }
  }

  Aud._startSequencer = function () {
    if (seq.running) return;
    seq.running = true;
    seq.nextT = now();
    Aud._timer = setInterval(function () {
      if (!Aud.ready || !seq.theme) return;
      var th = seq.theme;
      var spb = 60 / th.bpm;
      var stepDur = spb / 4;              // 16 分音符
      var horizon = now() + 0.18;
      var guard = 0;
      while (seq.nextT < horizon && guard++ < 64) {
        schedStep(th, seq.step, seq.nextT);
        seq.step++;
        seq.nextT += stepDur;
      }
      if (seq.nextT < now()) seq.nextT = now() + 0.02;
    }, 45);
  };

  Aud.playBgm = function (id, opt) {
    opt = opt || {};
    if (!Aud.ready) { Aud.curTheme = id; return; }
    if (Aud.curTheme === id && seq.theme && !opt.restart) return;
    Aud.curTheme = id;
    var th = THEMES[id];
    if (!th) { seq.theme = null; return; }
    seq.theme = th;
    if (opt.restart !== false) { seq.step = 0; seq.nextT = now() + .05; }
    seq.intensity = opt.intensity === undefined ? 1 : opt.intensity;
    Aud.layers = { pad: true, bass: true, arp: true, lead: true, drums: true };
    if (opt.layers) U.merge(Aud.layers, opt.layers);
    /* 淡入 */
    var g = Aud.busBgm.gain, t = now();
    g.cancelScheduledValues(t);
    g.setValueAtTime(opt.fade === 0 ? Aud.vol.bgm : 0.0001, t);
    if (opt.fade !== 0) g.linearRampToValueAtTime(Aud.vol.bgm, t + (opt.fade || 900) / 1000);
  };

  Aud.stopBgm = function (fadeMs) {
    if (!Aud.ready) { Aud.curTheme = null; return; }
    var g = Aud.busBgm.gain, t = now();
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(0.0001, t + (fadeMs || 600) / 1000);
    var id = Aud.curTheme;
    Aud.curTheme = null;
    setTimeout(function () { if (Aud.curTheme === null || Aud.curTheme === id) seq.theme = null; }, (fadeMs || 600) + 60);
  };

  /* 抽层做「变奏」：角色死亡时只留 pad+bass */
  Aud.setLayers = function (obj) { U.merge(Aud.layers, obj); };
  Aud.setIntensity = function (v) { seq.intensity = U.clamp(v, 0, 2); };
  /* 短暂压低 BGM（对话/演出突出） */
  Aud.duck = function (ms, amount) {
    if (!Aud.ready) return;
    var g = Aud.busBgm.gain, t = now();
    var lo = Aud.vol.bgm * (amount === undefined ? .35 : amount);
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(lo, t + .12);
    g.linearRampToValueAtTime(Aud.vol.bgm, t + (ms || 900) / 1000);
  };

})(window);
