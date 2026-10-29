// Built-in official mods (part B).
import type { SeedMod } from "./builtin-mods-a";

export const MODS_B: SeedMod[] = [
  {
    slug: "eternal-snail-racing",
    name: "Eternal Snail Racing",
    tagline: "Race the Eternal Snail. You will lose. He has all of time.",
    description: `## The oldest race in DINGLECRAFT

The **Eternal Snail** has crossed this world since before the first chunk was generated. It cannot be killed. It cannot be reasoned with. It can — technically — be raced.

Type \`/snailrace\` and the Eternal Snail warps beside you for a sprint to a finish line of your choosing (default 40 blocks). Beat him and earn the eternal respect of... well, nobody, actually. The snail doesn't respect you. But you get confetti.

### The truth about the snail
In standard mode, when you are about to win, the snail will simply *be ahead*. This is not a bug. The snail refuses to lose, and the snail has seniority. Use \`/snailrace fair\` for a race without the snail's little "adjustments", or \`/snailrace 100\` for a marathon you definitely cannot finish.

### Commands
- \`/snailrace\` — standard race (40 blocks, snail cheats)
- \`/snailrace fair\` — honest race (the snail disapproves)
- \`/snailrace 100\` — set custom distance

*The snail is not affiliated with this mod. The snail is not affiliated with anything.*`,
    version: "1.4.0",
    author: "the_snail_itself",
    category: "fun",
    tags: ["snail", "racing", "minigame", "eternal"],
    iconEmoji: "🐌",
    iconFrom: "#7fb069",
    iconTo: "#2f4a2c",
    downloads: 31008,
    follows: 3876,
    permissions: ["entities", "chat", "ui", "world"],
    isOfficial: true,
    featured: true,
    code: `// Eternal Snail Racing v1.4.0 — he has all of time
var race = null;

function snail() {
  try {
    if (DingleMod.vox && DingleMod.vox.getSNL) {
      var s = DingleMod.vox.getSNL();
      if (s && s.on) return s;
    }
  } catch (e) {}
  return null;
}

DingleMod.command('snailrace', function (args) {
  var fair = false;
  var dist = 40;
  for (var i = 0; i < args.length; i++) {
    var a = args[i].toLowerCase();
    if (a === 'fair') fair = true;
    else if (parseInt(a, 10) > 10) dist = Math.min(500, parseInt(a, 10));
  }
  var P = DingleMod.player();
  if (!P) { DingleMod.toast('Enter a world first!'); return; }
  if (race) { DingleMod.chat('🐌 The snail is already racing. One race at a time. He insists.'); return; }

  // warp the snail next to the player
  try {
    if (DingleMod.vox && DingleMod.vox.snailWarp) {
      DingleMod.vox.snailWarp(P.x + 2, P.y, P.z);
    }
  } catch (e) {}
  if (!snail()) { DingleMod.chat('🐌 The Eternal Snail is elsewhere today. It respects your enthusiasm and will race you never.'); return; }

  race = {
    fair: fair,
    dist: dist,
    sx: P.x, sz: P.z,
    snailStartX: 0, snailStartZ: 0,
    countdown: 3,
    running: false,
    finished: false
  };
  var s = snail();
  if (s) { race.snailStartX = s.x; race.snailStartZ = s.z; }

  DingleMod.title('THE ETERNAL RACE');
  DingleMod.chat('🐌 The Eternal Snail accepts your challenge. ' + dist + ' blocks. ' + (fair ? 'Fair mode. The snail is insulted.' : 'Standard rules. The snail always wins. Try anyway.'));
});

DingleMod.on('second', function () {
  if (!race || race.running || race.finished) return;
  race.countdown--;
  if (race.countdown > 0) {
    DingleMod.title(String(race.countdown));
    DingleMod.chat('🐌 ' + race.countdown + '...');
  } else {
    race.running = true;
    DingleMod.title('RUN.');
    DingleMod.chat('🐌 GO! The snail begins. Slowly. Menacingly. Eternally.');
  }
});

DingleMod.on('tick', function () {
  if (!race || !race.running || race.finished) return;
  var P = DingleMod.player();
  var s = snail();
  if (!P || !s) { race = null; return; }

  var pDist = Math.sqrt((P.x - race.sx) * (P.x - race.sx) + (P.z - race.sz) * (P.z - race.sz));
  var sDist = Math.sqrt((s.x - race.snailStartX) * (s.x - race.snailStartX) + (s.z - race.snailStartZ) * (s.z - race.snailStartZ));

  // the snail's little "adjustments"
  if (!race.fair && pDist > race.dist * 0.82 && pDist > sDist) {
    try {
      if (DingleMod.vox.snailWarp) {
        DingleMod.vox.snailWarp(P.x + 1.5, P.y, P.z);
        DingleMod.chat('🐌 The snail is suddenly... ahead. The snail does not explain itself.');
      }
    } catch (e) {}
  }

  if (pDist >= race.dist && sDist < race.dist) {
    race.finished = true;
    DingleMod.title('YOU... WON?');
    DingleMod.particles({ x: P.x, y: P.y + 1, z: P.z, color: 0xffd700, count: 34, spread: 2.4, speed: 5, ttl: 1.4 });
    DingleMod.chat('🏁 IMPOSSIBLE. You beat the Eternal Snail' + (race.fair ? ' (fair mode, as if that matters)' : '') + '. The universe files an anomaly report.');
    setTimeout(function () { race = null; }, 4000);
  } else if (sDist >= race.dist) {
    race.finished = true;
    DingleMod.title('THE SNAIL WINS');
    DingleMod.chat('🏁 The Eternal Snail crosses the line first, at its own pace, as it always has, as it always will.');
    setTimeout(function () { race = null; }, 4000);
  }
});

DingleMod.log('Eternal Snail Racing loaded. /snailrace to challenge the inevitable.');`,
  },

  {
    slug: "casino-vip-pass",
    name: "Casino VIP Pass",
    tagline: "The high rollers room. The house is still winning, but now it's polite about it.",
    description: `## Welcome to the VIP room

DINGLECRAFT's casino is fine, we suppose, for *regular* people. But you are not regular people. You are the kind of person who installs a casino VIP mod for a game about punching trees. You deserve **the treatment**.

One command opens the high rollers room: bigger blackjack, better ambiance (particles), and a lucky aura the dealer absolutely cannot prove we installed.

### Commands
- \`/vip\` — enter the high rollers room
- \`/tip\` — a stock market tip of genuinely questionable legality
- \`/luck\` — activate the VIP lucky aura (purely cosmetic, like the entire economy)

### Fine print
The house edge is a concept, not a number. Past performance does not guarantee future results. The stock market tip is sourced from a pig. All debts are payable to the sixteen-metre demon, who is patient.`,
    version: "1.0.7",
    author: "houseAlwaysWins",
    category: "gameplay",
    tags: ["casino", "stocks", "vip", "economy"],
    iconEmoji: "🎰",
    iconFrom: "#e8b93e",
    iconTo: "#7a3512",
    downloads: 15221,
    follows: 988,
    permissions: ["chat", "ui", "entities"],
    isOfficial: true,
    featured: false,
    code: `// Casino VIP Pass v1.0.7 — the house missed you
var auraActive = false;
var tipLines = [
  'GRAVEL is up 12% on rumors it is "basically free real estate".',
  'Analysts agree: DIRT remains a safe long-term hold. Analysts own a lot of dirt.',
  'WOOL futures are tangled. Nobody can explain wool futures. Not even the pig.',
  'The pig says BUY. The pig has never been wrong. The pig has also never spoken.',
  'SNAIL index flat, as expected, for the eleven-thousandth consecutive session.',
  'Insider tip: the casino always wins. That is the tip. That is the whole tip.'
];

DingleMod.command('vip', function () {
  try {
    if (DingleMod.vox && DingleMod.vox.openCas) DingleMod.vox.openCas();
  } catch (e) {}
  var P = DingleMod.player();
  if (P) {
    DingleMod.particles({ x: P.x, y: P.y + 1.5, z: P.z, color: 0xe8b93e, count: 26, spread: 2, speed: 3, ttl: 1.1 });
  }
  DingleMod.title('VIP ROOM');
  DingleMod.chat('🎴 The velvet rope lifts. The dealer nods respectfully. The house is still winning, but tonight it wins *politely*.');
});

DingleMod.command('tip', function () {
  DingleMod.chat('📈 ' + tipLines[Math.floor(Math.random() * tipLines.length)]);
});

DingleMod.command('luck', function () {
  auraActive = !auraActive;
  if (auraActive) {
    var P = DingleMod.player();
    if (P) DingleMod.particles({ x: P.x, y: P.y + 1, z: P.z, color: 0xffd700, count: 18, spread: 1.4, ttl: 1 });
    DingleMod.chat('🧿 VIP lucky aura ACTIVE. Absolutely nothing about the odds has changed. Everything about your confidence has.');
  } else {
    DingleMod.chat('🧿 Lucky aura dispelled. Reality resumes.');
  }
});

// blackjack flavor: celebrate big dealer busts
DingleMod.on('mobHurt', function () { /* reserved: VIP room security does not intervene */ });

DingleMod.log('Casino VIP Pass loaded. /vip to enter.');`,
  },

  {
    slug: "microtransactions-that-work",
    name: "Microtransactions That Work",
    tagline: "The in-game store sells 'Remove Ads'. We pay in dirt. Everyone wins.",
    description: `## The economy, fixed, by making it worse

DINGLECRAFT contains a microtransaction store that sells **"Remove Ads"** — in a game with no ads. It is a perfect commentary on modern gaming and we refuse to let it stay a joke.

This mod introduces **Dirt Economy**: a fully functional* store where every microtransaction is payable in **dirt**, the only currency with real value. Remove the ads that don't exist. Buy the golden name tag nobody sees. Purchase a mood.

### The catalog
- **Remove Ads** — 64 dirt (the ads continue to not exist, but now it's *official*)
- **Golden Name Tag** — 16 dirt (renders in spirit)
- **VIP Mood** — 8 dirt (90 seconds of ambient confidence)

### Why dirt?
Gold requires mining. Diamonds require effort. Dirt requires *being alive near the ground*. It is the people's currency, and the people's currency shall fund the people's pointless cosmetics.

*\*Functional in the emotional sense.*`,
    version: "2.1.0",
    author: "dirtStandard",
    category: "silly",
    tags: ["economy", "dirt", "store", "parody"],
    iconEmoji: "🪙",
    iconFrom: "#d9a441",
    iconTo: "#6b4a1f",
    downloads: 26340,
    follows: 2755,
    permissions: ["chat", "ui", "items"],
    isOfficial: true,
    featured: false,
    code: `// Microtransactions That Work v2.1.0 — the dirt standard
var vipMood = 0;

function dirtCount() {
  try {
    if (DingleMod.vox && DingleMod.vox.invCount) {
      var n = DingleMod.vox.invCount('dirt');
      if (typeof n === 'number') return n;
      n = DingleMod.vox.invCount(3);
      if (typeof n === 'number') return n;
    }
  } catch (e) {}
  return null; // unverifiable dirt
}

function payDirt(n) {
  try {
    if (DingleMod.vox && DingleMod.vox.invCount && DingleMod.vox.invConsume) {
      var have = DingleMod.vox.invCount('dirt');
      if (typeof have !== 'number') have = DingleMod.vox.invCount(3);
      if (typeof have === 'number' && have >= n) {
        var ok = DingleMod.vox.invConsume('dirt', n);
        if (ok === undefined || ok === null || ok === true) return true;
        ok = DingleMod.vox.invConsume(3, n);
        if (ok === undefined || ok === null || ok === true) return true;
      }
      return false;
    }
  } catch (e) {}
  return null; // payment system down (classic dinglecraft)
}

function shop(msg) { DingleMod.chat('🪙 [Dirt Store] ' + msg); }

DingleMod.command('dirtshop', function (args) {
  var item = (args[0] || '').toLowerCase();
  if (item === 'ads') {
    var r = payDirt(64);
    if (r === null) { shop('The register cannot verify your dirt right now. Classic DingleCraft. Try believing harder.'); return; }
    if (!r) { shop('Insufficient dirt. Remove Ads costs 64 dirt. The ads remain (there are no ads).'); return; }
    DingleMod.title('ADS REMOVED');
    shop('Transaction complete. The ads (0) have been removed. You are now 64 dirt poorer and infinitely more free.');
    var P = DingleMod.player();
    if (P) DingleMod.particles({ x: P.x, y: P.y + 1, z: P.z, color: 0xff5f5f, count: 20, spread: 1.5, ttl: 1 });
  } else if (item === 'tag') {
    var r2 = payDirt(16);
    if (r2 === null) { shop('Name tag kiosk offline. It was always offline. It will always be offline.'); return; }
    if (!r2) { shop('Golden Name Tag costs 16 dirt. You have dreams and ' + (dirtCount() || 0) + ' dirt.'); return; }
    DingleMod.title('✨ ' + 'GOLDEN TAG ✨');
    shop('Golden Name Tag acquired! It renders exclusively in spirit, visible only to those who already believed in you.');
  } else if (item === 'mood') {
    var r3 = payDirt(8);
    if (r3 === null) { shop('Mood dispenser jammed with actual mud. Ironic. Try again never, or later.'); return; }
    if (!r3) { shop('VIP Mood costs 8 dirt. Cannot put a price on confidence. Turns out we did: 8 dirt.'); return; }
    vipMood = 90;
    DingleMod.title('VIP MOOD');
    shop('VIP Mood activated: 90 seconds of ambient confidence. No gameplay effects. That is what makes it premium.');
  } else {
    shop('Catalog — /dirtshop ads (64 dirt): remove the ads that do not exist | /dirtshop tag (16 dirt): golden name tag (spiritual) | /dirtshop mood (8 dirt): VIP mood (90s)');
  }
});

DingleMod.on('second', function () {
  if (vipMood > 0) {
    vipMood--;
    if (vipMood === 0) shop('Your VIP Mood has expired. Confidence reverts to market rate.');
  }
});

DingleMod.log('Dirt Economy loaded. /dirtshop to browse.');`,
  },

  {
    slug: "poop-rain",
    name: "Poop Rain",
    tagline: "A weather system nobody asked for and nobody can stop.",
    description: `## The forecast is brown

**Poop Rain** adds DINGLECRAFT's first fully custom weather event. Toggle it on and the sky generously redistributes wealth from above: physics-simulated poop falling around you, splattering on impact, terrifying mobs, and occasionally landing as collectible pickups.

Walk over a fresh delivery to bank it in your **Poop Collector** score. Collect 25 and achieve GOLD TIER — a title, a salute, and a permanent sense of accomplishment that no therapist can take away.

### Commands
- \`/pooprain\` — toggle the weather event
- \`/pooprain status\` — current forecast and collection stats

### Synergy
Install with **Throwable Poop** to live the full circular economy: the sky gives, you throw back. The snail remains immune (he has seen worse).

### Technical
Falling units use the loader's projectile physics (gravity 16, terminal dignity 0). Mobs hit by a delivery are shoved aside in panic. The rain respects no biome.`,
    version: "1.0.0",
    author: "the_forecast",
    category: "fun",
    tags: ["weather", "poop", "chaos", "collecting"],
    iconEmoji: "🌧️",
    iconFrom: "#8d99a6",
    iconTo: "#454d56",
    downloads: 19733,
    follows: 1602,
    permissions: ["entities", "world", "chat", "ui", "items"],
    isOfficial: true,
    featured: true,
    code: `// Poop Rain v1.0.0 — the forecast is brown
var T = DingleMod.THREE();
var raining = false;
var dropTimer = 0;
var collected = 0;
var pickups = [];
var TIERS = [
  { n: 5, name: 'BRONZE', color: 0xb08d57 },
  { n: 15, name: 'SILVER', color: 0xc0c0c0 },
  { n: 25, name: 'GOLD', color: 0xffd700 }
];
var tierReached = 0;

function makeDropMesh() {
  var m = new T.Mesh(
    new T.SphereGeometry(0.15, 7, 5),
    new T.MeshLambertMaterial({ color: 0x6b4423 })
  );
  m.spin = true;
  return m;
}

function makePickupMesh() {
  var g = new T.Group();
  var m = new T.Mesh(
    new T.SphereGeometry(0.22, 8, 6),
    new T.MeshLambertMaterial({ color: 0x7a5230 })
  );
  g.add(m);
  var glow = new T.Mesh(
    new T.SphereGeometry(0.3, 8, 6),
    new T.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.25 })
  );
  g.add(glow);
  return g;
}

DingleMod.command('pooprain', function (args) {
  if ((args[0] || '').toLowerCase() === 'status') {
    DingleMod.chat('🌧️ Forecast: ' + (raining ? 'BROWN, all afternoon' : 'clear (temporary)') + ' | Collected: ' + collected + ' | Tier: ' + (tierReached ? TIERS[tierReached - 1].name : 'NONE'));
    return;
  }
  raining = !raining;
  if (raining) {
    DingleMod.title('WEATHER EVENT');
    DingleMod.chat('🌧️ The sky darkens. The sky has made a decision. Poop rain begins.');
  } else {
    DingleMod.chat('🌤️ The rain stops. The ground remembers. The ground always remembers.');
  }
});

DingleMod.on('tick', function (d) {
  var dt = (d && d.dt) || 0.05;
  if (!raining) return;
  var P = DingleMod.player();
  if (!P || !T || !DingleMod.scene()) return;

  dropTimer -= dt;
  if (dropTimer <= 0) {
    dropTimer = 0.35;
    var ang = Math.random() * Math.PI * 2;
    var rad = Math.random() * 12;
    var px = P.x + Math.cos(ang) * rad;
    var pz = P.z + Math.sin(ang) * rad;
    DingleMod.projectile({
      mesh: makeDropMesh(),
      x: px, y: P.y + 24, z: pz,
      vx: (Math.random() - 0.5) * 2, vy: -2, vz: (Math.random() - 0.5) * 2,
      gravity: 16, size: 0.28, ttl: 8,
      onHit: function (hit) {
        DingleMod.particles({ x: hit.x, y: hit.y, z: hit.z, color: 0x7a5230, count: 8, spread: 0.6, speed: 2, ttl: 0.7 });
        if (hit.type === 'entity' && hit.entity) {
          try {
            var dx = hit.entity.x - hit.x, dz = hit.entity.z - hit.z;
            var dd = Math.sqrt(dx * dx + dz * dz) || 1;
            hit.entity.vx += (dx / dd) * 5;
            hit.entity.vz += (dz / dd) * 5;
          } catch (e) {}
        }
        // 22% become collectible pickups
        if (Math.random() < 0.22 && pickups.length < 14) {
          var mesh = makePickupMesh();
          mesh.position.set(hit.x, hit.y + 0.3, hit.z);
          if (DingleMod.addMesh(mesh)) {
            pickups.push({ mesh: mesh, ttl: 60 });
          }
        }
      }
    });
  }

  // pickup collection
  for (var i = pickups.length - 1; i >= 0; i--) {
    var pk = pickups[i];
    pk.ttl -= dt;
    pk.mesh.rotation.y += dt * 2;
    pk.mesh.position.y += Math.sin(performance.now() / 400) * 0.003;
    var dxp = P.x - pk.mesh.position.x;
    var dzp = P.z - pk.mesh.position.z;
    if (dxp * dxp + dzp * dzp < 2.25) {
      collected++;
      DingleMod.removeMesh(pk.mesh);
      pickups.splice(i, 1);
      DingleMod.particles({ x: P.x, y: P.y + 1, z: P.z, color: 0xffe08a, count: 10, spread: 0.8, ttl: 0.6 });
      DingleMod.toast('Collected a poop (' + collected + ')');
      for (var t = tierReached; t < TIERS.length; t++) {
        if (collected === TIERS[t].n) {
          tierReached = t + 1;
          DingleMod.title('POOP COLLECTOR — ' + TIERS[t].name + ' TIER');
          DingleMod.particles({ x: P.x, y: P.y + 1.5, z: P.z, color: TIERS[t].color, count: 30, spread: 2, speed: 4, ttl: 1.3 });
          DingleMod.chat('🏆 POOP COLLECTOR ' + TIERS[t].name + ' TIER achieved at ' + collected + ' units. Your family has been notified.');
        }
      }
    } else if (pk.ttl <= 0) {
      DingleMod.removeMesh(pk.mesh);
      pickups.splice(i, 1);
    }
  }
});

DingleMod.log('Poop Rain loaded. /pooprain to change the weather.');`,
  },

  {
    slug: "malgorath-pacifier",
    name: "Malgorath Pacifier",
    tagline: "The sixteen-metre demon took a bite out of the world. Give him a time-out instead.",
    description: `## Discipline for ancient evils

**Malgorath** is a sixteen-metre demon who has taken a bite out of the world, which — credit where due — is a very demon thing to do. This mod offers an alternative to the traditional solution (screaming, running, more screaming): you **pacify** him.

One command shrinks the demon to sixteen *centimetres*. At this scale he retains all of his rage and precisely none of his reach. He will follow you, tiny and furious, like the world's most threatening keychain.

### Commands
- \`/pacify\` — shrink the nearest manifestation of Malgorath into a pocket demon
- \`/free\` — restore him to full size (he will remember this — positively, weirdly)

### Ethics
The pacified Malgorath is not a pet. He is a war criminal undergoing community service. He walks at your heel because the alternative is being sixteen centimetres tall alone.`,
    version: "1.2.0",
    author: "demonHR",
    category: "horror",
    tags: ["malgorath", "demon", "companion", "horror"],
    iconEmoji: "😈",
    iconFrom: "#c0392b",
    iconTo: "#2c0e0a",
    downloads: 14388,
    follows: 1821,
    permissions: ["entities", "mobs", "chat", "ui"],
    isOfficial: true,
    featured: false,
    code: `// Malgorath Pacifier v1.2.0 — community service for ancient evils
var T = DingleMod.THREE();
var pocket = null;
var freed = 0;

function demon() {
  try {
    if (DingleMod.vox && DingleMod.vox.getDEMON) {
      var d = DingleMod.vox.getDEMON();
      if (d) return d;
    }
  } catch (e) {}
  return null;
}

function findDemonMesh() {
  var d = demon();
  if (d) {
    var keys = ['g', 'mesh', 'm', 'root', 'obj', 'body'];
    for (var i = 0; i < keys.length; i++) {
      var node = d[keys[i]];
      if (node && node.scale) return node;
    }
  }
  return null;
}

DingleMod.command('pacify', function () {
  var P = DingleMod.player();
  if (!P || !T || !DingleMod.scene()) { DingleMod.toast('Enter a world first!'); return; }
  if (pocket) { DingleMod.toast('Malgorath is already in the program.'); return; }

  // try to shrink the real demon if present
  var dm = findDemonMesh();
  if (dm) {
    try {
      dm.userData.__dm_scale = { x: dm.scale.x, y: dm.scale.y, z: dm.scale.z };
      dm.scale.set(0.01, 0.01, 0.01);
    } catch (e) {}
  }

  // the pocket demon companion
  var g = new T.Group();
  var skin = new T.MeshLambertMaterial({ color: 0x8e1f14 });
  var body = new T.Mesh(new T.BoxGeometry(0.3, 0.4, 0.22), skin);
  body.position.y = 0.26; g.add(body);
  var head = new T.Mesh(new T.BoxGeometry(0.26, 0.24, 0.22), skin);
  head.position.y = 0.58; g.add(head);
  var hornL = new T.Mesh(new T.ConeGeometry(0.06, 0.16, 5), new T.MeshLambertMaterial({ color: 0x2c1210 }));
  hornL.position.set(-0.08, 0.74, 0); g.add(hornL);
  var hornR = hornL.clone(); hornR.position.x = 0.08; g.add(hornR);
  var eyeMat = new T.MeshBasicMaterial({ color: 0xffb020 });
  var eyeL = new T.Mesh(new T.SphereGeometry(0.045, 6, 4), eyeMat);
  eyeL.position.set(-0.06, 0.6, 0.12); g.add(eyeL);
  var eyeR = eyeL.clone(); eyeR.position.x = 0.06; g.add(eyeR);
  var wing = new T.Mesh(new T.ConeGeometry(0.1, 0.3, 4), new T.MeshLambertMaterial({ color: 0x501510 }));
  wing.position.set(0, 0.42, -0.14); wing.rotation.x = -0.8; g.add(wing);

  pocket = DingleMod.companion({
    mesh: g,
    name: 'Pocket Malgorath',
    distance: 1.6,
    height: 0.1,
    speed: 3.2,
    onTick: function (c, dt) {
      c.mesh.rotation.y += Math.sin(c.phase) * 0.04;
    }
  });

  DingleMod.title('PACIFIED');
  DingleMod.chat('😈 The sixteen-metre demon is now sixteen centimetres. He retains all of his rage and precisely none of his reach. He walks at your heel, tiny and furious, the world\u2019s most threatening keychain.');
});

DingleMod.command('free', function () {
  if (!pocket) { DingleMod.toast('No demon is currently in the program.'); return; }
  DingleMod.particles({ x: pocket.mesh.position.x, y: pocket.mesh.position.y + 0.5, z: pocket.mesh.position.z, color: 0xc0392b, count: 24, spread: 1.6, speed: 4, ttl: 1.1 });
  DingleMod.killCompanion(pocket);
  pocket = null;
  freed++;
  var dm = findDemonMesh();
  if (dm && dm.userData && dm.userData.__dm_scale) {
    try { dm.scale.copy(dm.userData.__dm_scale); } catch (e) {}
  }
  DingleMod.title('HE IS FREE');
  DingleMod.chat('😈 Malgorath swells back to full size. He looks at you. He nods, once, with what might be respect. (' + freed + ' rehabilitation' + (freed === 1 ? '' : 's') + ' completed.)');
});

DingleMod.log('Malgorath Pacifier loaded. /pacify to begin community service.');`,
  },
];
