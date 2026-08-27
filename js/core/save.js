/* ===========================================================
   save.js — localStorage：设置 / 结局图鉴 / 进度
   =========================================================== */
(function (root) {
  'use strict';
  var G = root.G, U = G.U;
  var KEY = 'drl_save_v1';

  var Save = G.Save = {
    data: null
  };

  var DEFAULT = {
    v: 2,                        // 存档结构版本，用于将来迁移
    settings: {
      difficulty: 'normal',      // easy / normal / hard
      volMaster: 0.85, volBgm: 0.5, volSfx: 0.8, volVoice: 0.7,
      textSpeed: 1,              // 0.5 慢 / 1 普通 / 2 快
      shake: 1,                  // 0 关闭震屏（晕动症友好）
      flash: 1,                  // 0 削弱全屏闪光与故障撕裂（光敏友好）
      autoFire: true,
      showHitbox: true
    },
    endings: {},                 // id → {count, firstAt}
    progress: { maxChapter: 0, cleared: false, ifSeen: false, loops: 0, deaths: 0 },
    codex: {},                   // 角色/情报解锁
    stats: { playTime: 0, bossKills: 0 },
    run: null                    // 进行中的一轮：{ch, beat, st, at, chapter} —— 见 saveRun
  };

  /* 只接受对象，挡掉被改坏或截断的存档值 */
  function obj(v) { return (v && typeof v === 'object' && !Array.isArray(v)) ? v : {}; }

  Save.load = function () {
    var raw = null;
    try { raw = root.localStorage.getItem(KEY); } catch (e) { raw = null; }
    var d = U.clone(DEFAULT);
    if (raw) {
      try {
        var p = JSON.parse(raw);
        if (p && typeof p === 'object') {
          U.merge(d.settings, obj(p.settings));
          d.endings = obj(p.endings);
          U.merge(d.progress, obj(p.progress));
          d.codex = obj(p.codex);
          U.merge(d.stats, obj(p.stats));
          if (p.run && typeof p.run === 'object' && p.run.st) d.run = p.run;
        }
      } catch (e) { /* 损坏则用默认 */ }
    }
    Save.data = d;
    return d;
  };

  Save.save = function () {
    if (!Save.data) return true;
    try {
      root.localStorage.setItem(KEY, JSON.stringify(Save.data));
      Save.quotaFull = false;
      return true;
    } catch (e) {
      /* 配额满或隐私模式：以前是静默失败，玩家会以为存上了 */
      Save.quotaFull = true;
      return false;
    }
  };

  /* ---------- 进行中的一轮 ----------
     README 里写的「存档点 = 章节 + 节拍 + 一份扁平可克隆的剧情状态」本来就是
     为了这件事设计的，之前只是没有落盘。 */
  Save.saveRun = function (ch, beat, st) {
    if (!Save.data || !st) return false;
    Save.data.run = {
      ch: ch, beat: beat,
      st: st,
      at: Date.now(),
      chapter: st.chapter,
      loops: st.loopCount,
      sanity: Math.round(st.sanity)
    };
    return Save.save();
  };
  Save.hasRun = function () { return !!(Save.data && Save.data.run && Save.data.run.st); };
  Save.loadRun = function () { return Save.hasRun() ? Save.data.run : null; };
  Save.clearRun = function () {
    if (!Save.data) return;
    Save.data.run = null;
    Save.save();
  };

  Save.settings = function () { return Save.data.settings; };

  Save.unlockEnding = function (id) {
    var e = Save.data.endings[id];
    if (e) e.count++;
    else Save.data.endings[id] = { count: 1, firstAt: Date.now() };
    if (id === 'if') Save.data.progress.ifSeen = true;
    if (id === 'good') Save.data.progress.cleared = true;
    Save.save();
  };
  Save.hasEnding = function (id) { return !!Save.data.endings[id]; };
  Save.endingCount = function () {
    var n = 0; for (var k in Save.data.endings) n++; return n;
  };
  Save.unlockCodex = function (id) {
    if (!Save.data.codex[id]) { Save.data.codex[id] = 1; Save.save(); }
  };
  Save.reachChapter = function (n) {
    if (n > Save.data.progress.maxChapter) { Save.data.progress.maxChapter = n; Save.save(); }
  };
  Save.wipe = function () {
    try { root.localStorage.removeItem(KEY); } catch (e) {}
    Save.load();
  };

})(window);
