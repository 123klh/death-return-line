/* ===========================================================
   input.js — 键盘 / 鼠标 / 触屏，坐标反变换到 1280×720 逻辑空间
   =========================================================== */
(function (root) {
  'use strict';
  var G = root.G, U = G.U;

  var In = G.In = {
    keys: {},          // 按住
    pressed: {},       // 本帧按下
    released: {},      // 本帧抬起
    mx: 0, my: 0,      // 逻辑坐标
    mdown: false, mclick: false, mup: false,
    wheel: 0,
    anyKey: false,
    touch: false,
    stick: { x: 0, y: 0, active: false },   // 虚拟摇杆输出 (-1..1)
    _raw: { mx: 0, my: 0 },
    enabled: true
  };

  /* 逻辑动作 → 物理按键 */
  var MAP = In.MAP = {
    up:      ['ArrowUp', 'KeyW'],
    down:    ['ArrowDown', 'KeyS'],
    left:    ['ArrowLeft', 'KeyA'],
    right:   ['ArrowRight', 'KeyD'],
    fire:    ['KeyZ', 'KeyJ', 'Space'],
    skill1:  ['KeyX', 'KeyK'],
    skill2:  ['KeyC', 'KeyL'],
    focus:   ['ShiftLeft', 'ShiftRight'],
    interact:['KeyE', 'Enter', 'KeyZ', 'Space'],
    confirm: ['Enter', 'KeyZ', 'Space', 'KeyJ'],
    cancel:  ['Escape', 'KeyX', 'Backspace'],
    pause:   ['Escape', 'KeyP'],
    skip:    ['ControlLeft', 'ControlRight'],
    log:     ['Tab'],
    debug:   ['Backquote']
  };

  In.down = function (act) {
    if (!In.enabled) return false;
    var a = MAP[act]; if (!a) return !!In.keys[act];
    for (var i = 0; i < a.length; i++) if (In.keys[a[i]]) return true;
    return false;
  };
  In.hit = function (act) {
    if (!In.enabled) return false;
    var a = MAP[act]; if (!a) return !!In.pressed[act];
    for (var i = 0; i < a.length; i++) if (In.pressed[a[i]]) return true;
    return false;
  };
  In.up = function (act) {
    var a = MAP[act]; if (!a) return !!In.released[act];
    for (var i = 0; i < a.length; i++) if (In.released[a[i]]) return true;
    return false;
  };

  /* 八方向输入向量（含虚拟摇杆） */
  In.axis = function () {
    var x = 0, y = 0;
    if (In.down('left')) x -= 1;
    if (In.down('right')) x += 1;
    if (In.down('up')) y -= 1;
    if (In.down('down')) y += 1;
    if (In.stick.active) { x += In.stick.x; y += In.stick.y; }
    var m = Math.sqrt(x * x + y * y);
    if (m > 1) { x /= m; y /= m; }
    return { x: x, y: y, len: Math.min(1, m) };
  };

  /* 每帧末清理 */
  In.endFrame = function () {
    In.pressed = {};
    In.released = {};
    In.mclick = false;
    In.mup = false;
    In.wheel = 0;
    In.anyKey = false;
  };

  var PREVENT = {
    ArrowUp: 1, ArrowDown: 1, ArrowLeft: 1, ArrowRight: 1, Space: 1, Tab: 1,
    KeyW: 1, KeyA: 1, KeyS: 1, KeyD: 1, Backquote: 1, Backspace: 1
  };

  In.install = function (el) {
    root.addEventListener('keydown', function (e) {
      if (PREVENT[e.code]) e.preventDefault();
      if (e.repeat) return;
      In.keys[e.code] = true;
      In.pressed[e.code] = true;
      In.anyKey = true;
    });
    root.addEventListener('keyup', function (e) {
      In.keys[e.code] = false;
      In.released[e.code] = true;
    });
    root.addEventListener('blur', function () { In.keys = {}; In.stick.active = false; });

    function setMouse(cx, cy) {
      In._raw.mx = cx; In._raw.my = cy;
      var p = G.Game ? G.Game.toLogical(cx, cy) : { x: cx, y: cy };
      In.mx = p.x; In.my = p.y;
    }
    el.addEventListener('mousemove', function (e) {
      var r = el.getBoundingClientRect();
      setMouse(e.clientX - r.left, e.clientY - r.top);
    });
    el.addEventListener('mousedown', function (e) {
      var r = el.getBoundingClientRect();
      setMouse(e.clientX - r.left, e.clientY - r.top);
      In.mdown = true; In.mclick = true; In.anyKey = true;
      e.preventDefault();
    });
    root.addEventListener('mouseup', function () { In.mdown = false; In.mup = true; });
    el.addEventListener('wheel', function (e) { In.wheel = U.sign(e.deltaY); e.preventDefault(); }, { passive: false });

    /* ---- 触屏：左半屏虚拟摇杆，右半屏射击/确认 ---- */
    var tOrigin = null, tId = null;
    el.addEventListener('touchstart', function (e) {
      In.touch = true; In.anyKey = true;
      var r = el.getBoundingClientRect();
      for (var i = 0; i < e.changedTouches.length; i++) {
        var t = e.changedTouches[i];
        var lx = t.clientX - r.left, ly = t.clientY - r.top;
        if (lx < r.width * 0.5 && tId === null) {
          tId = t.identifier; tOrigin = { x: lx, y: ly };
          In.stick.active = true; In.stick.x = 0; In.stick.y = 0;
        } else {
          In.keys.KeyZ = true; In.pressed.KeyZ = true;
          setMouse(lx, ly); In.mdown = true; In.mclick = true;
        }
      }
      e.preventDefault();
    }, { passive: false });
    el.addEventListener('touchmove', function (e) {
      var r = el.getBoundingClientRect();
      for (var i = 0; i < e.changedTouches.length; i++) {
        var t = e.changedTouches[i];
        if (t.identifier === tId && tOrigin) {
          var dx = (t.clientX - r.left) - tOrigin.x, dy = (t.clientY - r.top) - tOrigin.y;
          var R = Math.max(28, r.width * 0.06);
          var m = Math.sqrt(dx * dx + dy * dy) || 1;
          var k = Math.min(1, m / R);
          In.stick.x = dx / m * k; In.stick.y = dy / m * k;
        }
      }
      e.preventDefault();
    }, { passive: false });
    function touchEnd(e) {
      for (var i = 0; i < e.changedTouches.length; i++) {
        var t = e.changedTouches[i];
        if (t.identifier === tId) { tId = null; tOrigin = null; In.stick.active = false; In.stick.x = In.stick.y = 0; }
        else { In.keys.KeyZ = false; In.released.KeyZ = true; In.mdown = false; In.mup = true; }
      }
      e.preventDefault();
    }
    el.addEventListener('touchend', touchEnd, { passive: false });
    el.addEventListener('touchcancel', touchEnd, { passive: false });

    /* 阻止右键菜单 */
    el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  };

})(window);
