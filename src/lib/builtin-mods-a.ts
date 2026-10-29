// Built-in official mods (part A). Each `code` string is real mod JavaScript
// executed inside the game via the DingleMod loader. NOTE: mod code is stored
// in template literals, so it must not contain backticks or "${".

export interface SeedMod {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  version: string;
  author: string;
  category: string;
  tags: string[];
  iconEmoji: string;
  iconFrom: string;
  iconTo: string;
  downloads: number;
  follows: number;
  permissions: string[];
  code: string;
  isOfficial: boolean;
  featured: boolean;
}

export const MODS_A: SeedMod[] = [
  {
    slug: "throwable-poop",
    name: "Throwable Poop",
    tagline: "The pinnacle of DingleCraft science. Pick it up. Throw it. Regret nothing.",
    description: `## Finally, the feature DINGLECRAFT was always missing

**Throwable Poop** brings advanced fecal ballistics to the voxel world. Crafted by the top minds of the poopsmithing industry, each unit is hand-modelled, aerodynamically questionable, and morally indefensible.

The **Poop item is real**: find it at the end of your creative inventory palette, grab it with \`/poop give\`, and **right-click (aim at the ground) to hurl it** — one poop per click in survival, infinite in creative. Or type \`/poop\` to lob sight unseen and \`/poop 12\` to commit to a lifestyle. Every fifth mob you punch earns a bonus **revenge poop** from above — the game rewards you for violence, we're just honest about it.

### Features
- A genuine Poop item: in the inventory, in the hotbar, in the world
- Right-click throw with gravity, spin and splashdown particles
- Direct hits deal 3 damage and **terrify the target** (mobs flee the splat zone)
- Splats linger for 20 seconds as a territorial stink perimeter

### Commands
- \`/poop\` — lob one from thin air
- \`/poop 12\` — commit to a lifestyle
- \`/poop give [n]\` — put real Poop items in your inventory

### Compatibility
Works with **Poop Rain** for a full meteorological experience. The snail is immune (he has seen worse).`,
    version: "1.3.0",
    author: "poopsmith_dev",
    category: "fun",
    tags: ["poop", "items", "combat", "chaos"],
    iconEmoji: "💩",
    iconFrom: "#8a5a2e",
    iconTo: "#3d2b17",
    downloads: 48213,
    follows: 3120,
    permissions: ["items", "entities", "combat", "chat", "world"],
    isOfficial: true,
    featured: true,
    code: `// Throwable Poop v1.3.0 — the cornerstone of DingleCraft science
var T = DingleMod.THREE();

// A REAL item: shows in the inventory / creative palette, right-click to throw.
DingleMod.registerItem({
  id: 'poop',
  name: 'Poop',
  emoji: '💩',
  stack: 16,
  onUse: function () { throwPoop(); }
});

var splats = [];
var mobHits = 0;

function makePoopMesh() {
  var m = new T.Mesh(
    new T.SphereGeometry(0.16, 8, 6),
    new T.MeshLambertMaterial({ color: 0x6b4423 })
  );
  m.spin = true;
  return m;
}

function splatAt(x, y, z) {
  DingleMod.particles({
    x: x, y: y, z: z, color: 0x7a5230,
    count: 14, spread: 0.8, speed: 3, ttl: 0.9
  });
  splats.push({ x: x, y: y, z: z, t: 20 });
}

function scare(e, sx, sz) {
  try {
    var dx = e.x - sx, dz = e.z - sz;
    var d = Math.sqrt(dx * dx + dz * dz) || 1;
    e.vx += (dx / d) * 7;
    e.vz += (dz / d) * 7;
  } catch (err) {}
}

function throwPoop() {
  var P = DingleMod.player();
  var look = DingleMod.look();
  if (!P) { DingleMod.toast('Enter a world first!'); return; }
  if (!T || !DingleMod.scene()) { DingleMod.toast('No scene — poop postponed'); return; }
  var cp = Math.cos(look.pitch || 0);
  DingleMod.projectile({
    mesh: makePoopMesh(),
    x: P.x, y: P.y + 1.5, z: P.z,
    vx: -Math.sin(look.yaw || 0) * cp * 22,
    vz: -Math.cos(look.yaw || 0) * cp * 22,
    vy: Math.sin(look.pitch || 0) * 22 + 2,
    gravity: 16, size: 0.3, ttl: 8,
    onHit: function (hit) {
      splatAt(hit.x, hit.y, hit.z);
      if (hit.type === 'entity' && hit.entity) {
        DingleMod.hurtMob(hit.entity, 3);
        DingleMod.chat('💩 Splat! Direct hit on a ' + (hit.entity.t || 'mob') + '!');
        scare(hit.entity, hit.x, hit.z);
      }
    }
  });
}

DingleMod.command('poop', function (args) {
  var sub = (args[0] || '').toLowerCase();
  if (sub === 'give') {
    var n = parseInt(args[1] || '16', 10);
    if (isNaN(n) || n < 1) n = 1;
    if (n > 64) n = 64;
    DingleMod.give('poop', n);
    DingleMod.chat('💩 ' + n + ' x Poop delivered. Check your inventory — right-click (aimed at the ground) to throw.');
    return;
  }
  var n = parseInt(args[0] || '1', 10);
  if (isNaN(n) || n < 1) n = 1;
  if (n > 64) n = 64;
  for (var i = 0; i < n; i++) {
    setTimeout(throwPoop, i * 90);
  }
  if (n > 8) DingleMod.title('SPREAD THE WORD');
});

// bonus revenge poop on every 5th mob punch
DingleMod.on('mobHurt', function (e) {
  mobHits++;
  if (mobHits % 5 === 0 && e.mob) {
    try {
      DingleMod.projectile({
        mesh: makePoopMesh(),
        x: e.mob.x, y: (e.mob.y || 0) + 12, z: e.mob.z,
        vx: 0, vy: 0, vz: 0, gravity: 16, size: 0.3, ttl: 5,
        onHit: function (hit) {
          splatAt(hit.x, hit.y, hit.z);
          if (hit.type === 'entity' && hit.entity) {
            DingleMod.hurtMob(hit.entity, 2);
            scare(hit.entity, hit.x, hit.z);
          }
        }
      });
    } catch (err) {}
  }
});

// stink perimeter: mobs near splats flee
DingleMod.on('second', function () {
  var mobs = DingleMod.mobs();
  for (var s = 0; s < splats.length; s++) {
    for (var i = 0; i < mobs.length; i++) {
      var e = mobs[i];
      var dx = e.x - splats[s].x, dz = e.z - splats[s].z;
      if (dx * dx + dz * dz < 25) scare(e, splats[s].x, splats[s].z);
    }
  }
});

DingleMod.on('tick', function (d) {
  for (var i = splats.length - 1; i >= 0; i--) {
    splats[i].t -= (d && d.dt) || 0.05;
    if (splats[i].t <= 0) splats.splice(i, 1);
  }
});

DingleMod.log('Throwable Poop loaded. /poop to fling.');`,
  },

  {
    slug: "clifford-the-big-red-dog",
    name: "Clifford the Big Red Dog",
    tagline: "He's big. He's red. He's a dog. The prophecy is fulfilled.",
    description: `## Emily Elizabeth's worst decision, now in voxel form

**Clifford** joins your world as a two-and-a-half-block-tall crimson companion built from pure three.js box geometry and childlike joy. He follows you. He loves you. His legs actually animate when he runs, because we care about quality.

The **Clifford Spawn Egg is a real item** — find it at the end of your creative inventory palette, or grab it with \`/clifford egg\`. Hold it and **right-click the ground** (just like a vanilla spawn egg) and the good boy bounds out of nowhere. In survival the egg is consumed; Clifford's enthusiasm is not.

Clifford is loyal to a fault: hurt any mob and Clifford will **fetch** — charging across the terrain to deliver approximately four damage of *enthusiastic* justice. (That's "passionate" justice. He means well.)

### Commands
- \`/clifford\` — summon the good boy
- \`/clifford egg\` — get the Clifford Spawn Egg item
- \`/clifford ride\` — ride Clifford (he is large enough; this is canon)
- \`/clifford speak\` — Clifford says something profound
- \`/clifford go\` — Clifford leaves to fight crime elsewhere

### Known issues
Clifford does not understand doors, stairs, or restraint. Clifford is 10 in dog years and cannot legally consent to nuke rides.`,
    version: "1.4.0",
    author: "EmilyElizabeth",
    category: "mobs",
    tags: ["clifford", "dog", "companion", "rideable", "red"],
    iconEmoji: "🐕",
    iconFrom: "#e0432f",
    iconTo: "#7a1d12",
    downloads: 39502,
    follows: 4187,
    permissions: ["mobs", "entities", "combat", "chat", "ui"],
    isOfficial: true,
    featured: true,
    code: `// Clifford the Big Red Dog v1.4.0
var T = DingleMod.THREE();
var clifford = null;
var riding = false;
var fetchTarget = null;
var quotes = [
  'WOOF! (translation: your world is beautiful today)',
  'Clifford wags his tail. A nearby tree does not survive.',
  'Clifford believes in you.',
  'WOOF-WOOF! (translation: the snail cannot be trusted)',
  'Clifford sniffs the Guilt Ghost. The Guilt Ghost is nervous.'
];

// A REAL spawn egg: right-click the ground to summon Clifford.
DingleMod.registerItem({
  id: 'clifford_egg',
  name: 'Clifford Spawn Egg',
  emoji: '🐶',
  stack: 16,
  onUse: function (u) { spawnClifford(u.x, u.z); }
});

function buildDog() {
  var g = new T.Group();
  var red = new T.MeshLambertMaterial({ color: 0xd63a2f });
  var dark = new T.MeshLambertMaterial({ color: 0xa82820 });
  var body = new T.Mesh(new T.BoxGeometry(1.6, 1.2, 3.2), red);
  body.position.y = 1.5; g.add(body);
  var head = new T.Mesh(new T.BoxGeometry(1.3, 1.1, 1.1), red);
  head.position.set(0, 2.3, 1.7); g.add(head);
  var earL = new T.Mesh(new T.BoxGeometry(0.3, 0.6, 0.2), dark);
  earL.position.set(-0.5, 3.0, 1.6); g.add(earL);
  var earR = earL.clone(); earR.position.x = 0.5; g.add(earR);
  var snout = new T.Mesh(new T.BoxGeometry(0.6, 0.45, 0.5), new T.MeshLambertMaterial({ color: 0xf0c8a0 }));
  snout.position.set(0, 2.15, 2.35); g.add(snout);
  var eyeL = new T.Mesh(new T.BoxGeometry(0.18, 0.22, 0.1), new T.MeshLambertMaterial({ color: 0x111111 }));
  eyeL.position.set(-0.32, 2.5, 2.28); g.add(eyeL);
  var eyeR = eyeL.clone(); eyeR.position.x = 0.32; g.add(eyeR);
  var legs = [];
  var pos = [[-0.55, 0.55, 1.05], [0.55, 0.55, 1.05], [-0.55, 0.55, -1.05], [0.55, 0.55, -1.05]];
  for (var i = 0; i < 4; i++) {
    var leg = new T.Mesh(new T.BoxGeometry(0.42, 1.1, 0.42), red);
    leg.position.set(pos[i][0], pos[i][1], pos[i][2]);
    g.add(leg); legs.push(leg);
  }
  var tail = new T.Mesh(new T.BoxGeometry(0.25, 1.0, 0.25), dark);
  tail.position.set(0, 2.2, -1.7); tail.rotation.x = 0.7; g.add(tail);
  g.userData.legs = legs;
  g.userData.tail = tail;
  return g;
}

function spawnClifford(ux, uz) {
  var P = DingleMod.player();
  if (!P || !T || !DingleMod.scene()) { DingleMod.toast('Enter a world first!'); return; }
  if (clifford) { DingleMod.toast('Clifford is already here 🐕'); return; }
  clifford = DingleMod.companion({
    mesh: buildDog(),
    name: 'Clifford',
    distance: 2.6,
    height: 0.4,
    speed: 5.2,
    onTick: function (c, dt) {
      var legs = c.mesh.userData.legs;
      var phase = c.phase;
      for (var i = 0; i < legs.length; i++) {
        legs[i].rotation.x = Math.sin(phase + i * 1.57) * 0.55;
      }
      c.mesh.userData.tail.rotation.z = Math.sin(phase * 2.2) * 0.35;
      // riding: glue player on top
      if (riding) {
        var p = DingleMod.player();
        if (p) {
          try {
            p.x = c.mesh.position.x;
            p.z = c.mesh.position.z;
            p.y = c.mesh.position.y + 2.2;
            p.vy = 0;
          } catch (e) {}
        }
      }
    }
  });
  if (typeof ux === 'number' && typeof uz === 'number') {
    try {
      var Pp = DingleMod.player();
      var dx = ux - Pp.x, dz = uz - Pp.z;
      var d = Math.sqrt(dx * dx + dz * dz) || 1;
      var step = Math.min(d, 2.5);
      clifford.mesh.position.set(Pp.x + (dx / d) * step, Pp.y + 0.4, Pp.z + (dz / d) * step);
    } catch (e) {}
  }
  DingleMod.title('CLIFFORD HAS ARRIVED');
  DingleMod.chat('🐕 Clifford the Big Red Dog bounds into your world, approximately 40% larger than physics allows.');
}

DingleMod.command('clifford', function (args) {
  var sub = (args[0] || '').toLowerCase();
  if (sub === 'egg') {
    DingleMod.give('clifford_egg', 4);
    DingleMod.chat('🐕 4 x Clifford Spawn Egg delivered. Hold one and right-click the ground.');
    return;
  }
  if (!clifford && sub !== '') { spawnClifford(); return; }
  if (sub === 'ride') {
    if (!clifford) { spawnClifford(); }
    riding = !riding;
    DingleMod.toast(riding ? 'Giddy up. Hold on to the ears.' : 'You dismount. Clifford is sad but understanding.');
    if (riding) DingleMod.chat('🐕 You climb onto Clifford. Somewhere, Emily Elizabeth approves.');
  } else if (sub === 'speak') {
    DingleMod.chat('🐕 ' + quotes[Math.floor(Math.random() * quotes.length)]);
  } else if (sub === 'go') {
    if (clifford) {
      DingleMod.particles({ x: clifford.mesh.position.x, y: clifford.mesh.position.y + 1, z: clifford.mesh.position.z, color: 0xd63a2f, count: 20, spread: 2, speed: 3, ttl: 1 });
      DingleMod.killCompanion(clifford);
      clifford = null; riding = false;
      DingleMod.chat('🐕 Clifford sprints off toward the horizon. He will remember you.');
    }
  } else {
    spawnClifford();
  }
});

// FETCH: when you hurt a mob, Clifford charges it
DingleMod.on('mobHurt', function (e) {
  if (!clifford || !e.mob || fetchTarget) return;
  fetchTarget = e.mob;
  try { clifford.speed = 13; } catch (err) {}
  setTimeout(function () { fetchTarget = null; try { if (clifford) clifford.speed = 5.2; } catch (err) {} }, 2500);
});

DingleMod.on('tick', function () {
  if (!clifford || !fetchTarget || fetchTarget.dead) { fetchTarget = null; return; }
  try {
    var dx = fetchTarget.x - clifford.mesh.position.x;
    var dz = fetchTarget.z - clifford.mesh.position.z;
    if (dx * dx + dz * dz < 9) {
      DingleMod.hurtMob(fetchTarget, 4);
      DingleMod.particles({ x: fetchTarget.x, y: fetchTarget.y + 1, z: fetchTarget.z, color: 0xd63a2f, count: 10, spread: 1, ttl: 0.7 });
      DingleMod.chat('🐕 FETCH! Clifford delivers justice (4 dmg).');
      fetchTarget = null;
      clifford.speed = 5.2;
    }
  } catch (err) {}
});

DingleMod.log('Clifford loaded. /clifford to summon the good boy.');`,
  },

  {
    slug: "dragon-airlines",
    name: "Dragon Airlines",
    tagline: "Scheduled passenger flights aboard a creature that once ate you.",
    description: `## Why walk when a dragon owes you a favor?

**Dragon Airlines** turns DINGLECRAFT's rideable dragons into a budget airline with safety records best described as "aspirational". One command, one dragon, one spiritually significant flight to world spawn.

Our pilots (dragons) are not trained. Our seats (your hands gripping the horns) are not certified. Our refreshments (nothing) are not served. But the *views*... the views are three.js r128 at its absolute finest.

### Commands
- \`/fly\` — immediate boarding to world spawn, no security check
- \`/fly me\` — flight report: how the airline is doing (it is not doing well)

### Frequent flyer program
Every 5th flight, Dragon Airlines thanks you with a complimentary firework particle salute and a vague apology for the turbulence, the screaming, and the one time a passenger was mildly eaten.

*Dragon Airlines is not liable for lost luggage, lost limbs, or lost savings in the DINGLECRAFT stock market.*`,
    version: "2.0.4",
    author: "dinglefan42",
    category: "gameplay",
    tags: ["dragons", "travel", "flight", "qol"],
    iconEmoji: "🐉",
    iconFrom: "#3fae5a",
    iconTo: "#1c4a2a",
    downloads: 27844,
    follows: 2211,
    permissions: ["entities", "chat", "world", "time"],
    isOfficial: true,
    featured: true,
    code: `// Dragon Airlines v2.0.4 — now with 60% fewer passenger incidents
var flights = 0;
var inFlight = false;

function announce(msg) { DingleMod.chat('🐉 [Dragon Airlines] ' + msg); }

DingleMod.command('fly', function (args) {
  var sub = (args[0] || '').toLowerCase();
  if (sub === 'me') {
    announce('Status: ' + flights + ' completed flights. Zero certified pilots. Passenger satisfaction: complicated.');
    return;
  }
  if (inFlight) { announce('You are ALREADY flying. Please remain seated.'); return; }
  var P = DingleMod.player();
  var spawn = null;
  try { spawn = DingleMod.vox && DingleMod.vox.worldSpawn ? DingleMod.vox.worldSpawn() : null; } catch (e) {}
  if (!P || !spawn) { DingleMod.toast('No world / no spawn data.'); return; }

  inFlight = true;
  flights++;
  announce('Flight DA-' + (100 + flights) + ' now boarding. Please keep all limbs inside the dragon at all times.');

  // summon dragon if the game can do it (best effort)
  try {
    if (DingleMod.vox && DingleMod.vox.spawnMob) {
      DingleMod.vox.spawnMob('dragon', P.x + 3, P.y + 2, P.z);
    }
  } catch (e) {}

  DingleMod.title('DRAGON AIRLINES');
  var sx = P.x, sy = P.y, sz = P.z;
  var tx = spawn.x, ty = (spawn.y || sy) + 2, tz = spawn.z;
  var duration = 4.5;
  var elapsed = 0;
  var prevSpeed = null;

  var off = DingleMod.on('tick', function (d) {
    var dt = (d && d.dt) || 0.05;
    elapsed += dt;
    var k = Math.min(1, elapsed / duration);
    var ease = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    var arc = Math.sin(k * Math.PI) * 18;
    try {
      P.x = sx + (tx - sx) * ease;
      P.z = sz + (tz - sz) * ease;
      P.y = sy + (ty - sy) * ease + arc;
      P.vy = 0;
    } catch (e) {}
    if (k >= 1) {
      off();
      inFlight = false;
      try { P.y = ty; P.vy = 0; } catch (e) {}
      DingleMod.particles({ x: P.x, y: P.y + 1, z: P.z, color: 0xffb020, count: 24, spread: 2.5, speed: 4, ttl: 1.2 });
      announce('Welcome to World Spawn. Thank you for flying Dragon Airlines.');
      if (flights % 5 === 0) {
        announce('Frequent flyer milestone! Complimentary firework salute incoming.');
        DingleMod.title('FREQUENT FLYER x' + flights);
      }
    }
  });
});

DingleMod.log('Dragon Airlines loaded. /fly to board.');`,
  },

  {
    slug: "nuke-keg-pet",
    name: "Nuke Keg Pet",
    tagline: "Adopt a Walking Nuke Keg. It follows you. It has feelings. It could end everything.",
    description: `## He's just like a dog, if a dog was a war crime

The **Walking Nuke Kegs** of DINGLECRAFT have gotten a bad reputation, mostly because they walk around being nuclear. This mod lets you adopt one. He follows you at a respectful distance. Mobs keep away from him out of a sense of self-preservation. He is, in his way, the best guard dog you will ever own.

His name is **Keggy**. He is doing his best.

### Commands
- \`/keg\` — Keggy moves in
- \`/keg name\` — Keggy does a happy little strut (particles included)
- \`/keg boom\` — Keggy performs his one job at the nearest mob, then respawns, reborn and ready to love again
- \`/keg stay\` — tell Keggy danger mode off/on (mob repellent field)

### Safety notice
Keggy is a nuclear device. Keggy does not know he is a nuclear device. Do not tell Keggy.`,
    version: "1.0.2",
    author: "health_and_safety",
    category: "mobs",
    tags: ["nuke", "pet", "companion", "explosions"],
    iconEmoji: "☢️",
    iconFrom: "#cdd930",
    iconTo: "#5b6410",
    downloads: 22190,
    follows: 2904,
    permissions: ["mobs", "entities", "combat", "dangerous", "chat"],
    isOfficial: true,
    featured: false,
    code: `// Nuke Keg Pet v1.0.2 — he does not know what he is
var T = DingleMod.THREE();
var keggy = null;
var dangerMode = true;

function buildKeg() {
  var g = new T.Group();
  var metal = new T.MeshLambertMaterial({ color: 0x8b8f77 });
  var stripe = new T.MeshLambertMaterial({ color: 0xd9c530 });
  var body = new T.Mesh(new T.CylinderGeometry(0.45, 0.45, 1.3, 10), metal);
  body.position.y = 0.85; g.add(body);
  for (var i = 0; i < 2; i++) {
    var band = new T.Mesh(new T.CylinderGeometry(0.47, 0.47, 0.16, 10), stripe);
    band.position.y = 0.55 + i * 0.6; g.add(band);
  }
  // stubby legs
  var legMat = new T.MeshLambertMaterial({ color: 0x4a4a3d });
  var lp = [[-0.28, 0.2, 0.28], [0.28, 0.2, 0.28], [-0.28, 0.2, -0.28], [0.28, 0.2, -0.28]];
  var legs = [];
  for (var j = 0; j < 4; j++) {
    var leg = new T.Mesh(new T.BoxGeometry(0.22, 0.4, 0.22), legMat);
    leg.position.set(lp[j][0], lp[j][1], lp[j][2]);
    g.add(leg); legs.push(leg);
  }
  // googly eyes (he is a pet, not a munition)
  var eyeMat = new T.MeshLambertMaterial({ color: 0xffffff });
  var pupMat = new T.MeshLambertMaterial({ color: 0x111111 });
  var eyeL = new T.Mesh(new T.SphereGeometry(0.13, 8, 6), eyeMat);
  eyeL.position.set(-0.16, 1.35, 0.42); g.add(eyeL);
  var pupL = new T.Mesh(new T.SphereGeometry(0.06, 6, 4), pupMat);
  pupL.position.set(-0.16, 1.35, 0.53); g.add(pupL);
  var eyeR = eyeL.clone(); eyeR.position.x = 0.16; g.add(eyeR);
  var pupR = pupL.clone(); pupR.position.x = 0.16; g.add(pupR);
  g.userData.legs = legs;
  return g;
}

function spawnKeggy() {
  var P = DingleMod.player();
  if (!P || !T || !DingleMod.scene()) { DingleMod.toast('Enter a world first!'); return; }
  if (keggy) { DingleMod.toast('Keggy is already here ☢️'); return; }
  keggy = DingleMod.companion({
    mesh: buildKeg(),
    name: 'Keggy',
    distance: 2.4,
    height: 0.2,
    speed: 3.6,
    onTick: function (c, dt) {
      var legs = c.mesh.userData.legs;
      for (var i = 0; i < legs.length; i++) {
        legs[i].rotation.x = Math.sin(c.phase + i * 1.57) * 0.4;
      }
    }
  });
  DingleMod.title('KEGGY ADOPTED');
  DingleMod.chat('☢️ Keggy the Walking Nuke Keg follows you now. Mobs sense something deeply wrong with him.');
}

DingleMod.command('keg', function (args) {
  var sub = (args[0] || '').toLowerCase();
  if (sub === 'name') {
    if (!keggy) { spawnKeggy(); return; }
    DingleMod.particles({ x: keggy.mesh.position.x, y: keggy.mesh.position.y + 1, z: keggy.mesh.position.z, color: 0xd9c530, count: 16, spread: 1.2, ttl: 0.8 });
    DingleMod.chat('☢️ Keggy does a proud little strut. He is a good boy. He is a felony.');
  } else if (sub === 'stay') {
    dangerMode = !dangerMode;
    DingleMod.toast('Danger mode ' + (dangerMode ? 'ON — mobs keep their distance' : 'OFF — Keggy is just a guy now'));
  } else if (sub === 'boom') {
    if (!keggy) { DingleMod.toast('No Keggy, no boom.'); return; }
    var mobs = DingleMod.mobs(function (e) { return e.t !== 'ghost'; });
    if (!mobs.length) { DingleMod.chat('☢️ Keggy looks around. No targets. Keggy relieved.'); return; }
    var kpos = keggy.mesh.position;
    var best = mobs[0], bd = Infinity;
    for (var i = 0; i < mobs.length; i++) {
      var dx = mobs[i].x - kpos.x, dz = mobs[i].z - kpos.z;
      var d2 = dx * dx + dz * dz;
      if (d2 < bd) { bd = d2; best = mobs[i]; }
    }
    DingleMod.chat('☢️ Keggy understands. Keggy accepts. Goodbye, ' + (best.t || 'mob') + '.');
    DingleMod.explode(best.x, (best.y || kpos.y), best.z, 6);
    DingleMod.killCompanion(keggy);
    keggy = null;
    setTimeout(spawnKeggy, 3000);
    DingleMod.chat('☢️ ...3 seconds later, Keggy respawns. Do not think about it.');
  } else {
    spawnKeggy();
  }
});

// mobs keep away from Keggy
DingleMod.on('second', function () {
  if (!keggy || !dangerMode) return;
  var kpos = keggy.mesh.position;
  var mobs = DingleMod.mobs();
  for (var i = 0; i < mobs.length; i++) {
    var e = mobs[i];
    var dx = e.x - kpos.x, dz = e.z - kpos.z;
    var d2 = dx * dx + dz * dz;
    if (d2 < 16 && d2 > 0.01) {
      var d = Math.sqrt(d2);
      try { e.vx += (dx / d) * 4; e.vz += (dz / d) * 4; } catch (err) {}
    }
  }
});

DingleMod.log('Nuke Keg Pet loaded. /keg to adopt Keggy.');`,
  },

  {
    slug: "guilt-ghost-begone",
    name: "Guilt Ghost BeGONE",
    tagline: "Banish guilt ghosts with blessed salt. Therapy, but mineral.",
    description: `## They know what you did. Time to move on.

The **Guilt Ghosts** of DINGLECRAFT exist to remind you of every block you mined without replanting, every mob you punched for the revenge poop bonus, and every casino loss you told yourself was "strategy". 

This mod introduces **blessed salt** as a real item — find it in the creative palette or grab it with \`/salt give\`, then **right-click the ground** to throw the circle (or just type \`/salt\`). The spirits within are aggressively relocated. Ghost spawn chance drops to zero for 60 seconds of sweet, unhaunted freedom, after which your conscience (the game's spawner) recovers.

### Commands
- \`/salt\` — throw a salt circle (banishes nearby ghosts, 60s peace)
- \`/salt give [n]\` — get Blessed Salt items
- \`/ghosts\` — census of current hauntings
- \`/confess\` — tell a ghost you're sorry. It does not help. It never helps.

### Lore
The salt is blessed by the Eternal Snail, who has lived long enough to be beyond guilt, beyond time, and beyond mercy.`,
    version: "1.2.0",
    author: "snailBlessedCo",
    category: "horror",
    tags: ["ghosts", "horror", "utility", "salt"],
    iconEmoji: "👻",
    iconFrom: "#9aa3ad",
    iconTo: "#3c4249",
    downloads: 18567,
    follows: 1544,
    permissions: ["entities", "combat", "chat", "ui"],
    isOfficial: true,
    featured: false,
    code: `// Guilt Ghost BeGONE v1.2.0 — mineral therapy
var peaceTimer = 0;
var lastChance = null;

// A REAL item: right-click the ground to throw the salt circle.
DingleMod.registerItem({
  id: 'blessed_salt',
  name: 'Blessed Salt',
  emoji: '🧂',
  stack: 8,
  onUse: function () { throwSalt(); }
});

function ghostCount() {
  try {
    if (DingleMod.vox && DingleMod.vox.getHorror) {
      return DingleMod.vox.getHorror().ghosts || 0;
    }
  } catch (e) {}
  return DingleMod.mobs(function (e) { return e.t === 'ghost'; }).length;
}

DingleMod.command('salt', function (args) {
  var sub = (args[0] || '').toLowerCase();
  if (sub === 'give') {
    var gn = parseInt(args[1] || '8', 10);
    if (isNaN(gn) || gn < 1) gn = 1;
    if (gn > 32) gn = 32;
    DingleMod.give('blessed_salt', gn);
    DingleMod.chat('🧂 ' + gn + ' x Blessed Salt delivered. Right-click the ground to deploy.');
    return;
  }
  throwSalt();
});

function throwSalt() {
  var P = DingleMod.player();
  if (!P) { DingleMod.toast('Enter a world first!'); return; }
  // the circle of salt
  DingleMod.particles({ x: P.x, y: P.y + 0.3, z: P.z, color: 0xffffff, count: 30, spread: 2.2, speed: 1.5, ttl: 1.4 });
  DingleMod.particles({ x: P.x, y: P.y + 0.3, z: P.z, color: 0xdfe8ff, count: 18, spread: 3.0, speed: 1.0, ttl: 1.6 });
  DingleMod.title('BEGONE');

  var banished = 0;
  var ghosts = DingleMod.mobs(function (e) { return e.t === 'ghost' && !e.dead; });
  for (var i = 0; i < ghosts.length; i++) {
    var g = ghosts[i];
    var dx = g.x - P.x, dz = g.z - P.z;
    if (dx * dx + dz * dz < 144) {
      DingleMod.particles({ x: g.x, y: (g.y || P.y) + 1, z: g.z, color: 0xffffff, count: 14, spread: 0.8, ttl: 1 });
      DingleMod.hurtMob(g, 9999);
      banished++;
    }
  }
  try {
    if (DingleMod.vox && DingleMod.vox.setGhostChance) {
      lastChance = 1; // let the game restore its own default later via /salt off
      DingleMod.vox.setGhostChance(0);
    }
  } catch (e) {}
  peaceTimer = 60;
  DingleMod.chat('🧂 The salt circle glows. ' + banished + ' guilt ghost' + (banished === 1 ? '' : 's') + ' aggressively relocated. 60 seconds of peace begin.');
}

DingleMod.command('ghosts', function () {
  var n = ghostCount();
  if (n === 0) DingleMod.chat('👻 Ghost census: zero. Your conscience is (temporarily) clean.');
  else DingleMod.chat('👻 Ghost census: ' + n + ' and they ALL remember.');
});

DingleMod.command('confess', function () {
  var lines = [
    'You apologize to the ghost. The ghost says nothing. The silence is worse.',
    'You explain the context. The ghost was there. It saw the context.',
    'You apologize sincerely this time. The ghost files it under "pending".',
    'The Eternal Snail blesses your honesty, then reminds you it changes nothing.'
  ];
  DingleMod.chat('🕯️ ' + lines[Math.floor(Math.random() * lines.length)]);
});

// restore ghost chance when peace expires
DingleMod.on('second', function () {
  if (peaceTimer > 0) {
    peaceTimer--;
    if (peaceTimer === 0) {
      try {
        if (DingleMod.vox && DingleMod.vox.setGhostChance && lastChance) {
          DingleMod.vox.setGhostChance(lastChance);
        }
      } catch (e) {}
      DingleMod.chat('🧂 The salt fades. Your guilt, like all debt in DINGLECRAFT, compounds.');
    }
  }
});

DingleMod.log('Guilt Ghost BeGONE loaded. /salt for peace.');`,
  },
];
