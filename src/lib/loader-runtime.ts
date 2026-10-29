// ---------------------------------------------------------------------------
// DingleMod Loader Runtime v1.1
// This JS is injected into DINGLECRAFT.html right before </body> together with
// the enabled mods. It detects the game's window.__vox API, wraps the real
// global functions into an event bus, and exposes the DingleMod modding API
// to every mod.
//
// v1.1 — NATIVE ITEM BRIDGE:
//   registerItem() now writes a real definition into the game's DEFS table
//   (numeric id, custom 16x16 emoji icon via def.ipaint), so modded items show
//   up in the inventory, the creative palette, the hotbar and as world drops.
//   `onUse` turns an item into a spawn-egg-style item: right-click (aimed at a
//   block) fires the handler and consumes one item in survival. `egg:'pig'`
//   makes a genuine native spawn egg. spawnMob is wrapped to intercept those
//   synthetic egg types. give()/spawnDrop() translate mod item ids to the
//   native numeric ids. A gameGlobal() accessor exposes the game's top-level
//   lexical bindings (MODAL, DEFS, ...) to mods.
//
// NOTE: this source is embedded inside a TS template literal, so it must not
// contain backticks or "${" sequences. Use string concatenation instead.
// ---------------------------------------------------------------------------

export const LOADER_VERSION = "1.1.0";

export const RUNTIME_JS = `
/* DingleMod Loader ` + LOADER_VERSION + ` — community modloader for DINGLECRAFT */
(function () {
  'use strict';
  var VERSION = '` + LOADER_VERSION + `';
  var MODS = window.__DINGLE_MODS__ || [];
  var started = false;

  // ---------------- logging ----------------
  var LOG = [];
  function log(msg, level) {
    LOG.push({ t: new Date(), msg: String(msg), level: level || 'info' });
    if (LOG.length > 400) LOG.shift();
    if (window.__DM_DEBUG__) console.log('[DingleMod] ' + msg);
    renderConsole();
  }

  // ---------------- event bus ----------------
  var bus = {};
  function on(ev, fn) {
    (bus[ev] = bus[ev] || []).push(fn);
    var arr = bus[ev];
    return function () {
      var i = arr.indexOf(fn);
      if (i >= 0) arr.splice(i, 1);
    };
  }
  function once(ev, fn) {
    var off = on(ev, function (d) { off(); fn(d); });
    return off;
  }
  function emit(ev, d) {
    var arr = bus[ev];
    if (!arr) return;
    for (var i = 0; i < arr.length; i++) {
      try { arr[i](d); }
      catch (e) { log('handler error on "' + ev + '": ' + (e && e.message), 'error'); }
    }
  }

  // ---------------- compat tracking ----------------
  var compat = {};
  function report(name, ok, note) {
    compat[name] = { ok: !!ok, note: note || '' };
  }

  // ---------------- game bridge ----------------
  var vox = null;

  // v1.1: safe read access to the game's top-level lexical bindings (const/let
  // like DEFS, MODAL, P are NOT on window, but they live in the global lexical
  // environment, which indirect eval can see).
  function gg(name) {
    try {
      return (0, eval)('(typeof ' + name + '==="undefined")?null:' + name);
    } catch (e) { return null; }
  }

  function wrapGlobal(name, instead) {
    var orig = window[name];
    if (typeof orig !== 'function') { report(name, false, 'global not found'); return null; }
    var wrapper = instead(orig);
    try {
      window[name] = wrapper;
      report(name, true, 'wrapped');
      return wrapper;
    } catch (e) { report(name, false, 'not writable'); return null; }
  }

  // ---- tick engine (frame wrap with rAF fallback) ----
  var lastT = 0, secAcc = 0, playing = false;
  function tick(t) {
    var dt = 0;
    if (typeof t === 'number' && lastT) dt = Math.min(0.25, (t - lastT) / 1000);
    lastT = t;
    try {
      var p = vox && vox.playing;
      if (p === undefined || p === null) p = gg('playing');
      if (p && !playing) emit('gameStart', {});
      playing = !!p;
    } catch (e) { /* getter failed */ }
    if (!playing) return;
    secAcc += dt;
    if (secAcc >= 1) { secAcc -= 1; emit('second', { dt: secAcc + dt }); }
    emit('tick', { dt: dt });
    tickProjectiles(dt);
    tickParticles(dt);
    tickCompanions(dt);
  }

  // ---------------- commands & chat ----------------
  var commands = {};
  function registerCommand(name, fn) {
    commands[String(name).toLowerCase()] = fn;
  }
  wrapGlobal('chatSubmit', function (orig) {
    return function (text) {
      try {
        if (typeof text === 'string' && text.length > 1 && text.charAt(0) === '/') {
          var parts = text.slice(1).split(/\\s+/);
          var cname = (parts[0] || '').toLowerCase();
          var args = parts.slice(1);
          var handler = commands[cname];
          if (handler) {
            try { handler(args, text); }
            catch (e) { log('command /' + cname + ' failed: ' + (e && e.message), 'error'); }
            emit('command', { name: cname, args: args, raw: text, handled: true });
            return;
          }
          emit('command', { name: cname, args: args, raw: text, handled: false });
        } else if (typeof text === 'string' && text.length) {
          emit('chat', { text: text });
        }
      } catch (e) { log('chat wrap error: ' + (e && e.message), 'error'); }
      return orig.apply(window, arguments);
    };
  });

  // ---- block events ----
  wrapGlobal('setBlock', function (orig) {
    return function (x, y, z, id) {
      var last = 0;
      try { last = (vox && vox.getBlock) ? vox.getBlock(x, y, z) : 0; } catch (e) {}
      var r = orig.apply(window, arguments);
      try {
        if (id === 0) emit('blockBreak', { x: x, y: y, z: z, lastId: last });
        else emit('blockPlace', { x: x, y: y, z: z, id: id });
      } catch (e) {}
      return r;
    };
  });

  // ---- combat events ----
  wrapGlobal('hurtMob', function (orig) {
    return function () {
      var r = orig.apply(window, arguments);
      try { emit('mobHurt', { mob: arguments[0], amount: arguments[1], byPlayer: true }); } catch (e) {}
      return r;
    };
  });
  wrapGlobal('damagePlayer', function (orig) {
    return function () {
      var r = orig.apply(window, arguments);
      try { emit('playerHurt', { amount: arguments[0] }); } catch (e) {}
      return r;
    };
  });
  wrapGlobal('explode', function (orig) {
    return function () {
      var r = orig.apply(window, arguments);
      try { emit('explosion', { x: arguments[0], y: arguments[1], z: arguments[2] }); } catch (e) {}
      return r;
    };
  });

  // ---------------- native item bridge (v1.1) ----------------
  // Mod item ids ("poop") -> real numeric ids in the game's DEFS table.
  var NATIVE = { items: {}, eggHandlers: {} };
  var EGG_PREFIX = 'dm_';

  function nativeDEFS() { return gg('DEFS') || (vox && vox.DEFS) || null; }

  function allocNativeId() {
    var D = nativeDEFS();
    if (!D) return null;
    var max = 499;
    for (var k in D) {
      var n = parseInt(k, 10);
      if (!isNaN(n) && n > max && n < 9000) max = n;
    }
    return max + 1;
  }

  // 16x16 painter for the game's getIcon() -> shows in palette, hotbar, drops.
  function paintItemIcon(o) {
    return function (c) {
      try {
        c.clearRect(0, 0, 16, 16);
        if (o.color) { c.fillStyle = o.color; c.fillRect(0, 0, 16, 16); }
        if (o.emoji) {
          c.font = '13px system-ui,"Segoe UI Emoji","Noto Color Emoji",sans-serif';
          c.textAlign = 'center';
          c.textBaseline = 'middle';
          c.fillText(o.emoji, 8, 9);
        }
      } catch (e) {}
    };
  }

  function registerNativeItem(meta, def) {
    var D = nativeDEFS();
    if (!D) return null;
    var numId = allocNativeId();
    if (numId === null) return null;
    var real = {
      item: true,
      name: def.name || String(def.id || 'Modded Item'),
      stack: def.stack || 64,
      ipaint: paintItemIcon(def),
      dm_mod: meta.id,
      dm_id: def.id
    };
    if (def.egg && typeof def.egg === 'string' && !def.onUse) real.egg = def.egg;
    if (def.onUse) {
      var tag = EGG_PREFIX + numId;
      real.egg = tag;
      NATIVE.eggHandlers[tag] = { mod: meta.id, fn: def.onUse };
    }
    try { D[numId] = real; } catch (e) { return null; }
    try { var IC = gg('ICONS'); if (IC && IC[numId]) delete IC[numId]; } catch (e) {}
    NATIVE.items[String(def.id)] = { numId: numId, def: real };
    return numId;
  }

  function itemNumId(id) {
    if (id === null || id === undefined) return null;
    var rec = NATIVE.items[String(id)];
    return rec ? rec.numId : null;
  }

  // ---- item use: spawn eggs (native + modded) route through spawnMob ----
  wrapGlobal('spawnMob', function (orig) {
    return function (mt, x, y, z) {
      var tag = (typeof mt === 'string') ? mt : '';
      var h = tag.indexOf(EGG_PREFIX) === 0 ? NATIVE.eggHandlers[tag] : null;
      if (h) {
        try { emit('itemUse', { id: tag.slice(EGG_PREFIX.length), x: x, y: y, z: z, mod: h.mod }); } catch (e) {}
        try { h.fn({ x: x, y: y, z: z, mod: h.mod }); }
        catch (e) { log('[' + h.mod + '] item use failed: ' + (e && e.message), 'error'); }
        return null;
      }
      return orig.apply(window, arguments);
    };
  });

  // ---- frame wrap / rAF fallback ----
  var frameWrapped = wrapGlobal('frame', function (orig) {
    return function (t) {
      var r = orig.apply(window, arguments);
      try { tick(typeof t === 'number' ? t : performance.now()); } catch (e) {}
      return r;
    };
  });
  if (!frameWrapped) {
    report('frame', false, 'using requestAnimationFrame fallback');
    (function loop() { requestAnimationFrame(loop); tick(performance.now()); })();
  }

  // ---------------- THREE helpers ----------------
  function THREE() { return window.THREE || (vox && vox.THREE) || null; }

  var sceneCache = null;
  function scene() {
    if (sceneCache) return sceneCache;
    var T = THREE();
    if (!T || !T.Scene) return null;
    try {
      var i, k;
      if (vox) {
        for (k in vox) {
          try { if (vox[k] instanceof T.Scene) { sceneCache = vox[k]; return sceneCache; } } catch (e) {}
        }
      }
      var globals = ['scene', 'SCENE', 'sceneRoot', 'three_scene'];
      for (i = 0; i < globals.length; i++) {
        try { if (window[globals[i]] instanceof T.Scene) { sceneCache = window[globals[i]]; return sceneCache; } } catch (e) {}
      }
      var ents = (vox && vox.entities) || gg('entities');
      if (ents && ents.length) {
        var e0 = ents[0], keys = ['g', 'mesh', 'm', 'obj', 'root', 'body'], node;
        for (i = 0; i < keys.length; i++) {
          node = e0 ? e0[keys[i]] : null;
          if (node && node.parent) {
            var up = node;
            while (up && up.parent) up = up.parent;
            if (up instanceof T.Scene || up.type === 'Scene') { sceneCache = up; return sceneCache; }
          }
        }
      }
    } catch (e) {}
    return null;
  }

  // ---------------- particles ----------------
  var particles = [];
  function spawnParticles(o) {
    var T = THREE(), sc = scene();
    if (!T || !sc || !T.Mesh) { log('particles unavailable (no scene access)', 'warn'); return 0; }
    o = o || {};
    var n = Math.min(40, o.count || 10);
    var color = o.color || 0x8b5a2b;
    var size = o.size || 0.12;
    var made = 0;
    for (var i = 0; i < n; i++) {
      try {
        var geo = new T.BoxGeometry(size, size, size);
        var mat = new T.MeshBasicMaterial({ color: color, transparent: true });
        var m = new T.Mesh(geo, mat);
        m.position.set(
          (o.x || 0) + (Math.random() - 0.5) * (o.spread || 1),
          (o.y || 0) + (Math.random() - 0.5) * (o.spread || 1),
          (o.z || 0) + (Math.random() - 0.5) * (o.spread || 1)
        );
        sc.add(m);
        particles.push({
          m: m, ttl: o.ttl || 0.8,
          vx: (Math.random() - 0.5) * (o.speed || 2),
          vy: (Math.random() * 0.9 + 0.2) * (o.speed || 2),
          vz: (Math.random() - 0.5) * (o.speed || 2),
          g: (o.gravity !== undefined) ? o.gravity : 6
        });
        made++;
      } catch (e) {}
    }
    return made;
  }
  function tickParticles(dt) {
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.ttl -= dt;
      try {
        p.m.position.x += p.vx * dt;
        p.m.position.y += p.vy * dt;
        p.m.position.z += p.vz * dt;
        p.vy -= p.g * dt;
        p.m.material.opacity = Math.max(0, Math.min(1, p.ttl * 1.6));
      } catch (e) {}
      if (p.ttl <= 0) {
        try { var sc = scene(); if (sc) sc.remove(p.m); } catch (e) {}
        particles.splice(i, 1);
      }
    }
  }

  // ---------------- projectiles ----------------
  var projectiles = [];
  function throwProjectile(o) {
    if (!o || !o.mesh) return null;
    var p = {
      mesh: o.mesh,
      x: o.x, y: o.y, z: o.z,
      vx: o.vx || 0, vy: o.vy || 0, vz: o.vz || 0,
      gravity: (o.gravity !== undefined) ? o.gravity : 18,
      ttl: o.ttl || 6,
      size: o.size || 0.2,
      onHit: o.onHit || null,
      onTick: o.onTick || null,
      data: o.data || null
    };
    var sc = scene();
    if (sc) { try { sc.add(p.mesh); } catch (e) {} }
    projectiles.push(p);
    return p;
  }
  function tickProjectiles(dt) {
    for (var i = projectiles.length - 1; i >= 0; i--) {
      var p = projectiles[i];
      var hit = null;
      try {
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
        p.vy -= p.gravity * dt;
        p.mesh.position.set(p.x, p.y, p.z);
        if (p.mesh.spin) { p.mesh.rotation.x += dt * 6; p.mesh.rotation.z += dt * 4; }
        if (p.onTick) p.onTick(p);
        // block collision
        var solid = false;
        try {
          var id = vox && vox.getBlock ? vox.getBlock(Math.floor(p.x), Math.floor(p.y), Math.floor(p.z)) : 0;
          solid = (id !== 0 && id !== undefined && id !== null);
        } catch (e) {}
        if (solid) hit = { type: 'block', x: p.x, y: p.y, z: p.z };
        // entity proximity
        var ents = (vox && vox.entities) || gg('entities') || [];
        if (!hit && ents && ents.length) {
          for (var j = 0; j < ents.length; j++) {
            var e = ents[j];
            if (e && !e.dead && e !== (vox && vox.P)) {
              var dx = e.x - p.x, dy = (e.y || 0) - p.y, dz = e.z - p.z;
              if (dx * dx + dy * dy + dz * dz < (p.size + 0.9) * (p.size + 0.9)) {
                hit = { type: 'entity', entity: e, x: p.x, y: p.y, z: p.z };
                break;
              }
            }
          }
        }
        if (!hit && p.y < -5) hit = { type: 'void', x: p.x, y: p.y, z: p.z };
      } catch (e) { log('projectile error: ' + (e && e.message), 'error'); }
      p.ttl -= dt;
      if (hit || p.ttl <= 0) {
        try { var sc2 = scene(); if (sc2) sc2.remove(p.mesh); } catch (e) {}
        projectiles.splice(i, 1);
        if (p.onHit && (hit || p.ttl > 0)) { try { p.onHit(hit || { type: 'timeout' }, p); } catch (e) { log('onHit error: ' + (e && e.message), 'error'); } }
      }
    }
  }

  // ---------------- companions (mesh pets that follow the player) ----------
  var companions = [];
  function addCompanion(o) {
    if (!o || !o.mesh) return null;
    var c = {
      mesh: o.mesh,
      name: o.name || 'companion',
      dist: o.distance || 2.2,
      height: o.height || 1,
      speed: o.speed || 4.5,
      bob: o.bob !== false,
      phase: Math.random() * 6.28,
      onTick: o.onTick || null,
      dead: false
    };
    var sc = scene();
    if (sc) { try { sc.add(c.mesh); } catch (e) {} }
    companions.push(c);
    return c;
  }
  function killCompanion(c) {
    c.dead = true;
    try { var sc = scene(); if (sc) sc.remove(c.mesh); } catch (e) {}
    var i = companions.indexOf(c);
    if (i >= 0) companions.splice(i, 1);
  }
  function tickCompanions(dt) {
    var P = (vox && vox.P) || gg('P');
    if (!P) return;
    for (var i = 0; i < companions.length; i++) {
      var c = companions[i];
      try {
        var dx = P.x - c.mesh.position.x;
        var dz = P.z - c.mesh.position.z;
        var d2 = dx * dx + dz * dz;
        if (d2 > 1600) { // tele-catch-up
          c.mesh.position.set(P.x - 1, P.y + c.height, P.z - 1);
        } else if (d2 > c.dist * c.dist) {
          var d = Math.sqrt(d2);
          var step = Math.min(d, c.speed * dt);
          c.mesh.position.x += (dx / d) * step;
          c.mesh.position.z += (dz / d) * step;
          c.mesh.rotation.y = Math.atan2(dx, dz);
        }
        var groundY = P.y;
        c.phase += dt * 8;
        c.mesh.position.y = groundY + c.height + (c.bob ? Math.abs(Math.sin(c.phase)) * 0.25 : 0);
        if (c.onTick) c.onTick(c, dt);
      } catch (e) {}
    }
  }

  // ---------------- toasts & titles ----------------
  function ensureCss() {
    if (document.getElementById('__dm_css')) return;
    var css = document.createElement('style');
    css.id = '__dm_css';
    css.textContent = [
      '#__dm_toast{position:fixed;left:50%;bottom:88px;transform:translateX(-50%);z-index:99998;',
      'background:rgba(20,16,8,0.92);color:#ffd97a;border:1px solid rgba(255,200,90,0.35);',
      'border-radius:10px;padding:8px 16px;font:600 14px system-ui,sans-serif;pointer-events:none;',
      'transition:opacity .3s;max-width:70vw;text-align:center}',
      '#__dm_title{position:fixed;left:50%;top:26%;transform:translateX(-50%);z-index:99998;',
      'color:#ffe9b8;text-shadow:0 2px 12px rgba(0,0,0,.8);font:800 34px system-ui,sans-serif;',
      'pointer-events:none;transition:opacity .4s;letter-spacing:1px}',
      '#__dm_console{position:fixed;right:12px;top:12px;width:340px;max-height:46vh;z-index:99999;',
      'background:rgba(12,10,6,0.95);border:1px solid rgba(255,200,90,0.3);border-radius:12px;',
      'color:#e8dcc0;font:12px/1.5 ui-monospace,monospace;display:none;flex-direction:column;overflow:hidden}',
      '#__dm_console .hd{padding:8px 10px;background:rgba(255,190,60,0.12);cursor:move;user-select:none;',
      'font-weight:700;color:#ffd97a;display:flex;justify-content:space-between;align-items:center}',
      '#__dm_console .bd{overflow-y:auto;padding:6px 10px;max-height:38vh}',
      '#__dm_console .bd div{border-bottom:1px solid rgba(255,255,255,0.04);padding:2px 0;white-space:pre-wrap}',
      '#__dm_console .er{color:#ff9076}#__dm_console .wa{color:#ffd97a}',
      '#__dm_console button{background:none;border:1px solid rgba(255,200,90,.4);color:#ffd97a;',
      'border-radius:6px;padding:2px 8px;cursor:pointer;font:inherit}'
    ].join('');
    document.head.appendChild(css);
  }
  var toastEl = null, toastTimer = null;
  function toast(text, ms) {
    ensureCss();
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.id = '__dm_toast'; document.body.appendChild(toastEl); }
    toastEl.textContent = String(text);
    toastEl.style.opacity = '1';
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.style.opacity = '0'; }, ms || 2600);
  }
  var titleEl = null, titleTimer = null;
  function bigTitle(text, ms) {
    ensureCss();
    if (!titleEl) { titleEl = document.createElement('div'); titleEl.id = '__dm_title'; document.body.appendChild(titleEl); }
    titleEl.textContent = String(text);
    titleEl.style.opacity = '1';
    if (titleTimer) clearTimeout(titleTimer);
    titleTimer = setTimeout(function () { titleEl.style.opacity = '0'; }, ms || 2200);
  }

  // ---------------- console overlay ----------------
  var conEl = null, conBody = null;
  function ensureConsole() {
    ensureCss();
    if (conEl) return;
    conEl = document.createElement('div');
    conEl.id = '__dm_console';
    var hd = document.createElement('div');
    hd.className = 'hd';
    hd.innerHTML = '<span>DingleMod ' + VERSION + '</span>';
    var btn = document.createElement('button');
    btn.textContent = 'x';
    btn.onclick = function () { conEl.style.display = 'none'; };
    hd.appendChild(btn);
    conBody = document.createElement('div');
    conBody.className = 'bd';
    conEl.appendChild(hd);
    conEl.appendChild(conBody);
    document.body.appendChild(conEl);
    // drag
    var dragging = false, ox = 0, oy = 0;
    hd.addEventListener('mousedown', function (e) { dragging = true; ox = e.clientX - conEl.offsetLeft; oy = e.clientY - conEl.offsetTop; });
    window.addEventListener('mousemove', function (e) { if (dragging) { conEl.style.left = (e.clientX - ox) + 'px'; conEl.style.top = (e.clientY - oy) + 'px'; conEl.style.right = 'auto'; } });
    window.addEventListener('mouseup', function () { dragging = false; });
    renderConsole();
  }
  function renderConsole() {
    if (!conBody) return;
    var html = '';
    for (var i = Math.max(0, LOG.length - 120); i < LOG.length; i++) {
      var l = LOG[i];
      var cls = l.level === 'error' ? 'er' : (l.level === 'warn' ? 'wa' : '');
      html += '<div class="' + cls + '">[' + (l.t.getSeconds() < 10 ? '0' : '') + l.t.getSeconds() + 's] ' + l.msg.replace(/</g, '&lt;') + '</div>';
    }
    conBody.innerHTML = html;
    conBody.scrollTop = conBody.scrollHeight;
  }
  function toggleConsole() { ensureConsole(); conEl.style.display = conEl.style.display === 'flex' ? 'none' : 'flex'; }
  window.addEventListener('keydown', function (e) {
    if (e.key === 'F8') { e.preventDefault(); toggleConsole(); }
  });

  // ---------------- per-mod API factory ----------------
  function makeApi(meta) {
    var meshBag = [];
    var api = {
      meta: meta,
      version: VERSION,
      // logging / ui
      log: function (m) { log('[' + meta.id + '] ' + m); },
      toast: toast,
      title: bigTitle,
      // events
      on: on,
      once: once,
      // commands
      command: registerCommand,
      // registries: native (real items in DEFS) + virtual fallback
      registerItem: function (def) {
        def = def || {};
        def.mod = meta.id;
        VIRTUAL.items[def.id || 'item'] = def;
        var numId = registerNativeItem(meta, def);
        log('[' + meta.id + '] item registered: ' + (def.id || 'item') +
          (numId ? ' (native #' + numId + ' — visible in inventory)' : ' (virtual only — no DEFS table found)'));
        return def.id;
      },
      registerBlock: function (def) {
        def = def || {};
        def.mod = meta.id;
        VIRTUAL.blocks[def.id || 'block'] = def;
        try {
          if (vox && vox.B) {
            if (typeof vox.B === 'object') vox.B[def.id] = def;
          }
        } catch (e) {}
        log('[' + meta.id + '] block registered (virtual): ' + def.id);
        return def.id;
      },
      // world
      setBlock: function (x, y, z, id) { try { return vox && vox.setBlock ? vox.setBlock(x, y, z, id) : undefined; } catch (e) {} },
      getBlock: function (x, y, z) { try { return vox && vox.getBlock ? vox.getBlock(x, y, z) : 0; } catch (e) { return 0; } },
      explode: function (x, y, z, power) { try { if (vox && vox.explode) return vox.explode(x, y, z, power); } catch (e) {} },
      // entities
      entities: function () {
        var ents = (vox && vox.entities) || gg('entities');
        try { return ents || []; } catch (e) { return []; }
      },
      mobs: function (pred) {
        var out = [];
        try {
          var ents = (vox && vox.entities) || gg('entities') || [];
          for (var i = 0; i < ents.length; i++) {
            var e = ents[i];
            if (!e || e.dead) continue;
            if (!pred || pred(e)) out.push(e);
          }
        } catch (e) {}
        return out;
      },
      hurtMob: function (mob, amount) { try { if (window.hurtMob) window.hurtMob(mob, amount); } catch (e) {} },
      spawnDrop: function (x, y, z, id, n) {
        var f = gg('spawnDrop');
        var rec = NATIVE.items[String(id)];
        if (f && (rec || typeof id === 'number')) {
          try { f(x, y, z, { id: rec ? rec.numId : id, count: n || 1 }, 0, 2, 0); return; } catch (e) {}
        }
        try { if (vox && vox.spawnDrop) vox.spawnDrop(x, y, z, id, n); } catch (e) {}
      },
      // player
      player: function () {
        var P = gg('P');
        if (!P && vox) P = vox.P;
        return P || null;
      },
      position: function () {
        var P = api.player();
        return P ? { x: P.x, y: P.y, z: P.z } : null;
      },
      look: function () {
        try {
          if (vox && vox.getYaw) return { yaw: vox.getYaw(), pitch: vox.getPitch() };
        } catch (e) {}
        var P = api.player();
        return P ? { yaw: P.yaw || 0, pitch: P.pitch || 0 } : { yaw: 0, pitch: 0 };
      },
      teleport: function (x, y, z) {
        var P = api.player();
        if (P) { try { P.x = x; P.y = y; P.z = z; P.vx = 0; P.vy = 0; P.vz = 0; } catch (e) {} }
      },
      give: function (id, n) {
        var count = n || 1;
        var rec = NATIVE.items[String(id)];
        var gp = gg('givePlayer') || (vox && vox.givePlayer);
        if (rec && gp) {
          try { gp(rec.numId, count); return true; } catch (e) {}
        }
        if (typeof id === 'number' && gp) { try { gp(id, count); return true; } catch (e) {} }
        try {
          if (vox && vox.givePlayer) { vox.givePlayer(id, count); return true; }
          if (vox && vox.invAddTo) { vox.invAddTo(id, count); return true; }
        } catch (e) {}
        toast('Received ' + count + ' x ' + String(id).replace(/_/g, ' ') + ' (virtual)');
        return false;
      },
      // item helpers (v1.1)
      nativeId: function (id) {
        var rec = NATIVE.items[String(id)];
        return rec ? rec.numId : (typeof id === 'number' ? id : null);
      },
      itemName: function (id) {
        var D = nativeDEFS();
        var num = itemNumId(id);
        if (num === null && typeof id === 'number') num = id;
        if (D && num !== null && D[num]) return D[num].name || String(id);
        var v = VIRTUAL.items[String(id)];
        return (v && v.name) ? v.name : String(id);
      },
      inventory: function () {
        var P = api.player();
        try { return (P && P.inv) ? P.inv.slice() : null; } catch (e) { return null; }
      },
      // raw access to the game's top-level bindings (MODAL, DEFS, ...)
      gameGlobal: gg,
      damagePlayer: function (a) { try { if (window.damagePlayer) window.damagePlayer(a); } catch (e) {} },
      // chat
      chat: function (t) {
        try { if (vox && vox.chatSubmit) { vox.chatSubmit(String(t)); return; } } catch (e) {}
        toast(t);
      },
      // time
      time: {
        get: function () { try { return vox ? vox.getTime() : 0; } catch (e) { return 0; } },
        set: function (t) { try { if (vox) vox.setTime(t); } catch (e) {} },
        speed: function (x) { try { if (vox && vox.setGameSpeed) vox.setGameSpeed(x); } catch (e) {} }
      },
      // visuals
      THREE: THREE,
      scene: scene,
      addMesh: function (m) { var sc = scene(); if (sc && m) { try { sc.add(m); meshBag.push(m); return true; } catch (e) {} } return false; },
      removeMesh: function (m) {
        var sc = scene();
        if (sc && m) { try { sc.remove(m); } catch (e) {} }
        var i = meshBag.indexOf(m);
        if (i >= 0) meshBag.splice(i, 1);
      },
      particles: spawnParticles,
      projectile: throwProjectile,
      companion: addCompanion,
      killCompanion: killCompanion,
      // util
      rand: function (min, max) { return min + Math.random() * (max - min); },
      // raw access (advanced)
      vox: vox,
      blocks: function () { try { return (vox && vox.B) || {}; } catch (e) { return {}; } },
      items: function () { return nativeDEFS() || {}; },
      compat: compat
    };
    return api;
  }

  var VIRTUAL = { items: {}, blocks: {}, recipes: [] };

  // ---------------- boot sequence ----------------
  function findVox(tries) {
    if (window.__vox) return boot();
    if ((tries || 0) > 120) {
      log('window.__vox never appeared — is this really DINGLECRAFT.html?', 'error');
      ensureConsole(); toggleConsole();
      return;
    }
    setTimeout(function () { findVox((tries || 0) + 1); }, 100);
  }

  function boot() {
    if (started) return;
    started = true;
    vox = window.__vox;
    log('DingleMod ' + VERSION + ' loaded — game API detected');
    // patch per-mod api raw references
    var sceneOk = !!scene();
    report('scene', sceneOk, sceneOk ? 'visual mods active' : 'no scene — logic only');
    var defsOk = !!nativeDEFS();
    report('nativeItems', defsOk, defsOk ? 'modded items appear in the inventory' : 'no DEFS table — items are virtual');
    log(defsOk ? 'native item bridge active — registered items appear in the inventory' : 'DEFS table not found — items degrade to virtual', defsOk ? 'info' : 'warn');
    log(sceneOk ? 'THREE scene detected — visuals enabled' : 'THREE scene not found — visual features degrade to toasts', 'warn');

    registerCommand('dm', function (args) {
      var sub = (args[0] || '').toLowerCase();
      if (sub === 'list') {
        var names = [];
        for (var i = 0; i < MODS.length; i++) names.push(MODS[i].name + ' v' + MODS[i].version);
        bigTitle('DingleMod', 900);
        toast(names.join(' | ') || 'no mods installed', 5000);
      } else if (sub === 'status') {
        toggleConsole();
        var ok = 0, total = 0;
        for (var k in compat) { total++; if (compat[k].ok) ok++; }
        var nitems = 0;
        for (var key in NATIVE.items) nitems++;
        log('compat: ' + ok + '/' + total + ' hooks active · ' + nitems + ' native mod item' + (nitems === 1 ? '' : 's'));
      } else {
        toggleConsole();
      }
    });

    // run mods in load order
    var okCount = 0;
    for (var i = 0; i < MODS.length; i++) {
      var m = MODS[i];
      try {
        var fn = new Function('DingleMod', '"use strict";\\n' + m.code + '\\n');
        fn(makeApi(m));
        okCount++;
        log('mod loaded: ' + m.name + ' v' + m.version + ' by ' + m.author);
      } catch (e) {
        log('mod FAILED: ' + m.name + ' — ' + (e && e.message), 'error');
      }
    }
    log(okCount + '/' + MODS.length + ' mods loaded. Press F8 or type /dm for the DingleMod console.');
    if (MODS.length) {
      bigTitle('DingleMod — ' + MODS.length + ' mod' + (MODS.length > 1 ? 's' : '') + ' loaded', 2600);
    }
    emit('loaderReady', { mods: MODS });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { findVox(0); });
  } else {
    findVox(0);
  }
})();
`;
