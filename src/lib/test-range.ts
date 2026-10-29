"use client";

// The DingleMod TEST RANGE — a tiny mock DINGLECRAFT (fake window.__vox over a
// real three.js scene) so mod authors can verify their mods load without
// fetching the 42 MB game file. Injected with the same DingleMod loader.
// NOTE: no backticks or "${" inside this HTML (it lives in a TS template literal).

export const TEST_RANGE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>DingleMod Test Range</title>
<style>
  html,body{margin:0;height:100%;overflow:hidden;background:#0d1420;font-family:ui-monospace,Consolas,monospace}
  #hint{position:fixed;top:10px;left:12px;color:#cfe3a8;font-size:12px;line-height:1.6;z-index:10;
    background:rgba(10,16,10,0.72);border:1px solid rgba(160,200,90,0.25);border-radius:8px;padding:8px 12px;max-width:340px}
  #log{position:fixed;left:12px;bottom:52px;color:#e8e2c8;font-size:12px;z-index:10;max-width:60vw;
    background:rgba(8,8,6,0.66);border-radius:8px;padding:6px 10px;max-height:34vh;overflow-y:auto;white-space:pre-wrap}
  #bar{position:fixed;left:0;right:0;bottom:0;display:flex;z-index:10;background:rgba(8,8,6,0.85);padding:8px}
  #bar input{flex:1;background:#14140f;color:#ffe9b8;border:1px solid rgba(255,200,90,0.3);border-radius:8px;
    padding:8px 12px;font:14px ui-monospace,monospace;outline:none}
  #bar button{margin-left:8px;background:#2c2416;color:#ffd97a;border:1px solid rgba(255,200,90,0.4);
    border-radius:8px;padding:8px 16px;font:600 13px ui-monospace,monospace;cursor:pointer}
  canvas{display:block}
</style>
</head>
<body>
<div id="hint">DINGLEMOD <b>TEST RANGE</b> — mock DingleCraft for testing mods.<br>
WASD move · drag mouse look · SPACE hop · type commands below.<br>
Try: <b>/poop 5</b> · <b>/clifford</b> · <b>/keg</b> · <b>/salt</b> · <b>/snailrace</b> · <b>/pooprain</b> · <b>/dm</b> · F8 console</div>
<div id="log"></div>
<div id="bar"><input id="chat" placeholder="Type a chat message or /command..." autocomplete="off"><button id="send">SEND</button></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script>
'use strict';
// NOTE: deliberately NOT wrapped in an IIFE. Like the real DINGLECRAFT, the
// mock exposes chatSubmit / frame / setBlock etc. as real window globals so
// the DingleMod loader can wrap them.
var T = window.THREE;
var scene = new T.Scene();
  scene.background = new T.Color(0x87b5d9);
  scene.fog = new T.Fog(0x87b5d9, 30, 90);

  var camera = new T.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 300);
  var renderer = new T.WebGLRenderer({ antialias: true });
  renderer.setSize(innerWidth, innerHeight);
  document.body.appendChild(renderer.domElement);
  window.scene = scene; // DingleMod scene detection scans window globals

  scene.add(new T.HemisphereLight(0xffffff, 0x445533, 0.9));
  var sun = new T.DirectionalLight(0xfff2cc, 0.7);
  sun.position.set(20, 40, 10);
  scene.add(sun);

  var ground = new T.Mesh(
    new T.BoxGeometry(64, 1, 64),
    new T.MeshLambertMaterial({ color: 0x6fa860 })
  );
  ground.position.y = -0.5;
  scene.add(ground);

  for (var i = 0; i < 26; i++) {
    var tree = new T.Group();
    var trunk = new T.Mesh(new T.BoxGeometry(0.6, 2.4, 0.6), new T.MeshLambertMaterial({ color: 0x7a5230 }));
    trunk.position.y = 1.2; tree.add(trunk);
    var leaf = new T.Mesh(new T.BoxGeometry(2.4, 2.2, 2.4), new T.MeshLambertMaterial({ color: 0x3d7a33 }));
    leaf.position.y = 3.4; tree.add(leaf);
    tree.position.set((Math.random() - 0.5) * 56, 0, (Math.random() - 0.5) * 56);
    scene.add(tree);
  }

  // ---- mock player ----
  var P = { x: 0, y: 1, z: 0, vx: 0, vy: 0, vz: 0, yaw: 0, pitch: 0 };
  var playerMesh = new T.Group();
  var body = new T.Mesh(new T.BoxGeometry(0.8, 1.2, 0.5), new T.MeshLambertMaterial({ color: 0x3aa0a8 }));
  body.position.y = 1.1; playerMesh.add(body);
  var head = new T.Mesh(new T.BoxGeometry(0.55, 0.55, 0.55), new T.MeshLambertMaterial({ color: 0xe0b890 }));
  head.position.y = 2.0; playerMesh.add(head);
  scene.add(playerMesh);

  // ---- mock mobs ----
  var entities = [];
  function addPig(x, z) {
    var g = new T.Group();
    var pb = new T.Mesh(new T.BoxGeometry(0.9, 0.7, 1.4), new T.MeshLambertMaterial({ color: 0xf0a8b0 }));
    pb.position.y = 0.55; g.add(pb);
    var sn = new T.Mesh(new T.BoxGeometry(0.4, 0.3, 0.3), new T.MeshLambertMaterial({ color: 0xd98890 }));
    sn.position.set(0, 0.55, 0.85); g.add(sn);
    g.position.set(x, 0, z);
    scene.add(g);
    entities.push({ t: 'pig', x: x, y: 0, z: z, vx: 0, vy: 0, vz: 0, hp: 10, dead: false, g: g });
  }
  addPig(6, 4); addPig(-7, -5); addPig(3, -9);

  // ---- input ----
  var keys = {};
  window.addEventListener('keydown', function (e) {
    keys[e.code] = true;
    if (e.code === 'Space') { P.vy = 6; }
  });
  window.addEventListener('keyup', function (e) { keys[e.code] = false; });
  var dragging = false, lx = 0, ly = 0;
  renderer.domElement.addEventListener('mousedown', function (e) { dragging = true; lx = e.clientX; ly = e.clientY; });
  window.addEventListener('mouseup', function () { dragging = false; });
  window.addEventListener('mousemove', function (e) {
    if (!dragging) return;
    P.yaw -= (e.clientX - lx) * 0.006;
    P.pitch = Math.max(-1.4, Math.min(1.4, P.pitch - (e.clientY - ly) * 0.006));
    lx = e.clientX; ly = e.clientY;
  });
  window.addEventListener('resize', function () {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  // ---- chat log ----
  var logEl = document.getElementById('log');
  function log(line) {
    var d = document.createElement('div');
    d.textContent = line;
    logEl.appendChild(d);
    while (logEl.childNodes.length > 40) logEl.removeChild(logEl.firstChild);
    logEl.scrollTop = logEl.scrollHeight;
  }
  window.chatLog = log;

  // ---- mock game API (the subset DingleMod mods rely on) ----
  var timeOfDay = 300;
  var ghostChance = 1;
  var blocks = {};
  function chatSubmit(text) { log('[you] ' + text); }
  function setBlock(x, y, z, id) {
    blocks[x + ',' + y + ',' + z] = id;
    if (id === 0) delete blocks[x + ',' + y + ',' + z];
    return true;
  }
  function getBlock(x, y, z) {
    var v = blocks[x + ',' + y + ',' + z];
    if (v !== undefined) return v;
    return y <= 0 ? 1 : 0;
  }
  function hurtMob(mob, amount) {
    if (!mob || mob.dead) return;
    mob.hp -= amount || 1;
    try { mob.g.children[0].material.color.setHex(0xff5555); setTimeout(function () { mob.g.children[0].material.color.setHex(0xf0a8b0); }, 150); } catch (e) {}
    log('[game] ' + (mob.t || 'mob') + ' takes ' + amount + ' damage (hp ' + Math.max(0, mob.hp) + ')');
    if (mob.hp <= 0) {
      mob.dead = true;
      scene.remove(mob.g);
      log('[game] ' + (mob.t || 'mob') + ' has died. You monster.');
      setTimeout(function () { entities = entities.filter(function (e2) { return e2 !== mob; }); }, 0);
    }
  }
  function damagePlayer(a) { log('[game] player takes ' + a + ' damage. The test range forgives you.'); }
  function explode(x, y, z) {
    log('[game] BOOM at ' + Math.round(x) + ',' + Math.round(y) + ',' + Math.round(z));
    for (var i = 0; i < 24; i++) {
      var m = new T.Mesh(new T.BoxGeometry(0.25, 0.25, 0.25), new T.MeshBasicMaterial({ color: i % 3 ? 0xffa030 : 0x888888 }));
      m.position.set(x, y, z);
      scene.add(m);
      var vx = (Math.random() - 0.5) * 14, vy = Math.random() * 10, vz = (Math.random() - 0.5) * 14;
      var ttl = 1.2;
      var iv = setInterval(function () {
        ttl -= 0.05;
        m.position.x += vx * 0.05; m.position.y += vy * 0.05; m.position.z += vz * 0.05;
        vy -= 0.8;
        if (ttl <= 0) { clearInterval(iv); scene.remove(m); }
      }, 50);
    }
  }
  function spawnDrop(x, y, z, id, n) { log('[game] drop spawned: ' + id + ' x' + (n || 1)); }
  function spawnMob(type, x, y, z) {
    var g = new T.Group();
    var m = new T.Mesh(new T.BoxGeometry(0.9, 0.9, 0.9), new T.MeshLambertMaterial({ color: 0xa8a8a8 }));
    g.add(m);
    g.position.set(x, y || 0, z);
    scene.add(g);
    entities.push({ t: type || 'mob', x: x, y: y || 0, z: z, vx: 0, vy: 0, vz: 0, hp: 10, dead: false, g: g });
    log('[game] spawned ' + (type || 'mob'));
  }
  window.__vox = {
    P: P,
    entities: entities,
    playing: true,
    chatSubmit: chatSubmit,
    setBlock: setBlock,
    getBlock: getBlock,
    hurtMob: hurtMob,
    damagePlayer: damagePlayer,
    explode: explode,
    spawnDrop: spawnDrop,
    spawnMob: spawnMob,
    worldSpawn: function () { return { x: 0, y: 1, z: 0 }; },
    getTime: function () { return timeOfDay; },
    setTime: function (t) { timeOfDay = t; },
    getYaw: function () { return P.yaw; },
    getPitch: function () { return P.pitch; },
    setGameSpeed: function (v) { log('[game] speed ' + v); },
    setGhostChance: function (v) { ghostChance = v; },
    getHorror: function () { return { ghosts: 0 }; },
    getSNL: function () { return null; },
    getDEMON: function () { return null; },
    openCas: function () { log('[game] the casino is closed in the test range. The house thanks you anyway.'); },
    invCount: function () { return 64; },
    invConsume: function () { return true; },
    givePlayer: function (id, n) { log('[game] given ' + id + ' x' + (n || 1)); },
    invAddTo: function (id, n) { log('[game] given ' + id + ' x' + (n || 1)); },
    IT: {},
    B: {},
    GAME_VERSION: '6.9 (test range)'
  };

  // chat bar -> ALWAYS resolve through the (possibly wrapped) global binding
  var input = document.getElementById('chat');
  function sendChat() {
    var v = input.value.trim();
    input.value = '';
    if (!v) return;
    window.chatSubmit(v); // resolves the DingleMod wrapper if installed
  }
  document.getElementById('send').addEventListener('click', sendChat);
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') sendChat(); });

  // ---- game loop (global frame() so DingleMod can wrap it) ----
  var last = 0;
  function frame(t) {
    var dt = Math.min(0.05, (t - last) / 1000 || 0.016);
    last = t;
    var sp = 7;
    if (keys.KeyW) { P.x -= Math.sin(P.yaw) * sp * dt; P.z -= Math.cos(P.yaw) * sp * dt; }
    if (keys.KeyS) { P.x += Math.sin(P.yaw) * sp * dt; P.z += Math.cos(P.yaw) * sp * dt; }
    if (keys.KeyA) { P.x -= Math.cos(P.yaw) * sp * dt; P.z += Math.sin(P.yaw) * sp * dt; }
    if (keys.KeyD) { P.x += Math.cos(P.yaw) * sp * dt; P.z -= Math.sin(P.yaw) * sp * dt; }
    P.vy -= 20 * dt;
    P.y += P.vy * dt;
    if (P.y < 1) { P.y = 1; P.vy = 0; }
    P.x = Math.max(-30, Math.min(30, P.x));
    P.z = Math.max(-30, Math.min(30, P.z));

    // wander mobs
    for (var i = 0; i < entities.length; i++) {
      var e = entities[i];
      if (e.dead) continue;
      e.x += e.vx * dt; e.z += e.vz * dt;
      e.vx *= 0.92; e.vz *= 0.92;
      if (Math.random() < 0.01) { e.vx = (Math.random() - 0.5) * 2; e.vz = (Math.random() - 0.5) * 2; }
      e.x = Math.max(-28, Math.min(28, e.x));
      e.z = Math.max(-28, Math.min(28, e.z));
      if (e.g) { e.g.position.set(e.x, e.y, e.z); }
    }

    playerMesh.position.set(P.x, P.y - 1, P.z);
    playerMesh.rotation.y = P.yaw;
    var camDist = 6, cy = P.y + 2 + Math.sin(P.pitch) * -camDist * 0.8;
    camera.position.set(
      P.x + Math.sin(P.yaw) * camDist * Math.cos(P.pitch),
      Math.max(0.5, cy),
      P.z + Math.cos(P.yaw) * camDist * Math.cos(P.pitch)
    );
    camera.lookAt(P.x, P.y + 1, P.z);
    renderer.render(scene, camera);
  }
  (function loop() { requestAnimationFrame(loop); frame(performance.now()); })();

  log('[test range] ready — fake DingleCraft API exposed. Install mods and launch to see them here.');
</script>
</body>
</html>`;
