"use client";

import { MOD_EVENTS, PERMISSIONS, CATEGORIES } from "./modspec";

export interface ForgeInput {
  name: string;
  idea: string;
  category: string;
  features: string[];
  target: string; // universal | chatgpt | claude | gemini
  includeExample: boolean;
  tone: "silly" | "serious";
}

const TARGET_HEADERS: Record<string, string> = {
  universal:
    "You are an expert game-mod engineer. You write single-file mods for DINGLECRAFT in the DingleMod format. You never deviate from the spec below.",
  chatgpt:
    "You are ChatGPT acting as an expert game-mod engineer. You write single-file mods for DINGLECRAFT in the DingleMod format. You never deviate from the spec below.",
  claude:
    "You are Claude acting as an expert game-mod engineer. You write single-file mods for DINGLECRAFT in the DingleMod format. You never deviate from the spec below.",
  gemini:
    "You are Gemini acting as an expert game-mod engineer. You write single-file mods for DINGLECRAFT in the DingleMod format. You never deviate from the spec below.",
};

export function buildForgePrompt(input: ForgeInput): string {
  const lines: string[] = [];

  lines.push("# TASK: WRITE A DINGLECRAFT MOD (.dinglemod.json)");
  lines.push("");
  lines.push(TARGET_HEADERS[input.target] || TARGET_HEADERS.universal);
  lines.push("");
  lines.push("## 1. ABOUT THE GAME");
  lines.push(
    "DINGLECRAFT is a fan-made Minecraft-style voxel sandbox that ships as ONE self-contained HTML file (~42 MB). It is built on three.js r128 bundled inside the file, plus about 41,000 lines of plain JavaScript with no framework, no bundler and no modules."
  );
  lines.push(
    "The game exposes an internal API on the global object `window.__vox` (functions like setBlock, getBlock, spawnMob, hurtMob, damagePlayer, explode, givePlayer, chatSubmit, getTime/setTime, and data tables B = blocks, DEFS = item/block definitions, MOBT = mob types, P = player object via getters, entities = live entity array)."
  );
  lines.push(
    "There is no official modding API. The community DingleMod loader v1.1 is injected into the HTML right before </body>; it wraps the game's real global functions (chatSubmit, setBlock, hurtMob, damagePlayer, explode, spawnMob, frame) to create an event bus, writes modded items into the game's real DEFS table (so they appear in the inventory and creative palette), and hands every mod a `DingleMod` API object."
  );
  lines.push("");
  lines.push("## 2. THE MOD FILE FORMAT (STRICT)");
  lines.push(
    "A mod is ONE self-contained JSON file named `<mod-id>.dinglemod.json`. It contains the manifest AND the embedded code:"
  );
  lines.push("");
  lines.push("```json");
  lines.push(JSON.stringify(exampleSkeleton(input), null, 2));
  lines.push("```");
  lines.push("");
  lines.push("### Manifest field rules");
  lines.push("- `format`: must be exactly `\"dinglemod-1\"`.");
  lines.push(
    "- `id`: lowercase kebab-case, 2-64 chars, letters/digits/hyphens only (e.g. `throwable-poop`)."
  );
  lines.push("- `name`: display name, 2-64 chars.");
  lines.push("- `version`: semver `x.y.z` (e.g. `1.0.0`).");
  lines.push("- `author`: 2-48 chars.");
  lines.push("- `tagline`: one-line pitch, 8-140 chars.");
  lines.push(
    "- `description`: markdown, 20-4000 chars. Use `##` headers, `-` bullet lists, **bold**. Include a Commands section listing every command the mod adds."
  );
  lines.push("- `category`: one of: " + CATEGORIES.map((c) => `"${c.key}"`).join(", ") + ".");
  lines.push("- `tags`: up to 8 short strings.");
  lines.push("- `iconEmoji`: a single emoji used as the mod icon.");
  lines.push(
    "- `permissions`: array with at least one of: " +
      PERMISSIONS.map((p) => `"${p.key}"`).join(", ") +
      ". Declare everything the code actually uses. Use `\"dangerous\"` only if the mod explodes/destroys."
  );
  lines.push("- `code`: ONE string field containing the entire mod JavaScript.");
  lines.push("");
  lines.push("## 3. THE `code` FIELD — HARD RULES");
  lines.push("- Plain JavaScript only. NO import/export, NO require, NO fetch/XHR/WebSocket, NO ES modules, NO external libraries.");
  lines.push("- The code runs inside `new Function('DingleMod', code)` in STRICT MODE: declare every variable (`var`), no undeclared assignments, no `with`, no octal literals.");
  lines.push(
    "- The single parameter `DingleMod` is the entire API. `window`, `document`, `Math`, `JSON`, `setTimeout` etc. are available. three.js is available as `window.THREE` (r128) INSIDE THE REAL GAME (grab it with `var T = DingleMod.THREE();` and null-check it)."
  );
  lines.push(
    "- Write defensively: the loader is best-effort. Wrap risky calls in try/catch. Null-check `DingleMod.player()` before using it, check `DingleMod.scene()` before creating meshes, and make every feature degrade to `DingleMod.toast(...)` instead of crashing."
  );
  lines.push(
    "- NEVER use template literals (backticks) or `${}` inside the code string — the code is embedded in JSON and in loader payloads. Use string concatenation with `+`."
  );
  lines.push(
    "- Register commands for user interaction (the chat is the primary UI): `DingleMod.command('name', function(args){ ... })`. Players type `/name arg1 arg2` in the in-game chat."
  );
  lines.push("- Target 40-150 lines of code. Quality over quantity. Comment the top of the file with the mod name and version.");
  lines.push("- The tone of chat messages and descriptions should be " + (input.tone === "silly" ? "funny and deadpan-absurdist, matching DINGLECRAFT's comedy (the game has a casino, an Eternal Snail, and a microtransaction store that sells Remove Ads in a game with no ads)" : "clear and useful") + ".");
  lines.push("");
  lines.push("## 4. THE DingleMod API (complete reference)");
  lines.push("");
  lines.push("### Meta & UI");
  lines.push("- `DingleMod.meta` — this mod's manifest.");
  lines.push("- `DingleMod.log(msg)` — write to the in-game DingleMod console (F8).");
  lines.push("- `DingleMod.toast(text, ms?)` — small on-screen toast.");
  lines.push("- `DingleMod.title(text, ms?)` — big centered title announcement.");
  lines.push("- `DingleMod.chat(text)` — send a system-style chat message.");
  lines.push("");
  lines.push("### Events — `DingleMod.on(event, handler)` (returns an off() function)");
  for (const e of MOD_EVENTS) {
    lines.push(`- \`"${e.key}"\` — ${e.desc}`);
  }
  lines.push("");
  lines.push("### Commands");
  lines.push("- `DingleMod.command('verb', function(args, rawText))` — players run `/verb a b c` in chat. `args` is the space-split argument array.");
  lines.push("");
  lines.push("### Items & blocks (NATIVE: real items in the inventory)");
  lines.push(
    "- `DingleMod.registerItem({ id, name, emoji, stack, onUse })` — registers a REAL item. It gets a numeric id in the game's DEFS table, shows up at the END of the creative inventory palette, works in the hotbar, can be dropped as a world item, and its 16x16 icon is the `emoji`. `id` is your string id ('poop'), `stack` defaults to 64."
  );
  lines.push(
    "- `onUse: function(u)` — OPTIONAL. Makes the item usable: the player holds it and RIGHT-CLICKS while aiming at a block (exactly like a vanilla spawn egg). `u` = { x, y, z } where they aimed. One item is consumed in survival; nothing in creative. Use this instead of commands when an item should DO something."
  );
  lines.push(
    "- `egg: 'pig'` — OPTIONAL alternative to onUse: turns the item into a genuine spawn egg for a real game mob type (pig, cow, sheep, zombie, skel, boomer, spider, alien, dragon, creep, nuker, boss, dking, titan, demon)."
  );
  lines.push("- `DingleMod.registerBlock({ id, name })` — virtual only (no native block support yet).");
  lines.push(
    "- Give items to the player with `DingleMod.give(id, count)` — real items into the real inventory. Expose a `/yourmod give` command for it."
  );
  lines.push("");
  lines.push("### World");
  lines.push("- `DingleMod.setBlock(x, y, z, id)` / `DingleMod.getBlock(x, y, z)` — block ids are integers; 0 = air.");
  lines.push("- `DingleMod.explode(x, y, z, power)` — real game explosion.");
  lines.push("");
  lines.push("### Entities & mobs");
  lines.push("- `DingleMod.entities()` — live entity array (each has x/y/z, vx/vy/vz, t = type string, dead flag).");
  lines.push("- `DingleMod.mobs(predicateFn?)` — non-dead entities, optionally filtered.");
  lines.push("- `DingleMod.hurtMob(mob, amount)`.");
  lines.push("- `DingleMod.spawnDrop(x, y, z, itemId, count)` — drops a real item entity (works with mod item ids and vanilla numeric ids).");
  lines.push("");
  lines.push("### Player");
  lines.push("- `DingleMod.player()` — the player object P (x/y/z/yaw/pitch, vx/vy/vz) or null on the title screen.");
  lines.push("- `DingleMod.position()` — safe copy `{x,y,z}` or null.");
  lines.push("- `DingleMod.look()` — `{yaw, pitch}` in radians.");
  lines.push("- `DingleMod.teleport(x, y, z)`.");
  lines.push("- `DingleMod.give(itemId, count)` — puts real items in the player's inventory (mod item ids or vanilla numeric ids); degrades to a toast outside a world.");
  lines.push("- `DingleMod.damagePlayer(amount)`.");
  lines.push("");
  lines.push("### Time");
  lines.push("- `DingleMod.time.get()` / `.set(t)` — time of day (0-600 seconds per game day).");
  lines.push("- `DingleMod.time.speed(x)` — game speed multiplier.");
  lines.push("");
  lines.push("### Visuals (three.js — require a scene, always null-check)");
  lines.push("- `var T = DingleMod.THREE();` — grab three.js (r128) or null.");
  lines.push("- `DingleMod.scene()` — the active THREE.Scene or null (title screen / headless).");
  lines.push("- `DingleMod.addMesh(mesh)` / `DingleMod.removeMesh(mesh)` — scene management.");
  lines.push(
    "- `DingleMod.particles({ x, y, z, color, count, spread, speed, ttl })` — colored particle burst (color as hex int like 0xffd700)."
  );
  lines.push(
    "- `DingleMod.projectile({ mesh, x, y, z, vx, vy, vz, gravity, size, ttl, onHit })` — physics projectile. `onHit(hit)` receives `{type:'block'|'entity'|'void', x, y, z, entity?}`. Build meshes from three.js primitives (BoxGeometry, SphereGeometry, ConeGeometry) and set `mesh.spin = true` for spin."
  );
  lines.push(
    "- `DingleMod.companion({ mesh, name, distance, height, speed, bob, onTick })` — a mesh pet that follows the player; legs/tail can be animated in `onTick(c, dt)` via `c.mesh.userData`. Returns the companion; kill it with `DingleMod.killCompanion(c)`."
  );
  lines.push("");
  lines.push("### Advanced raw access");
  lines.push(
    "- `DingleMod.vox` — the raw `window.__vox` game API (spawnMob, worldSpawn, openCas, getSNL, setGhostChance, getHorror, getDEMON, snailWarp, invCount, invConsume, DEFS, MOBT, sortInv, ...). Null-check everything; exact shapes are best-effort."
  );
  lines.push(
    "- `DingleMod.gameGlobal(name)` — safe read access to the game's top-level bindings that are NOT on window: `DingleMod.gameGlobal('MODAL')` (the open inventory modal, has .slots), `'DEFS'`, `'MOBT'`, ... Returns null if absent."
  );
  lines.push(
    "- `DingleMod.nativeId(itemId)` / `DingleMod.itemName(id)` / `DingleMod.inventory()` — numeric id lookup, display name lookup, and a copy of the 36-slot inventory (or null)."
  );
  lines.push("- `DingleMod.blocks()` / `DingleMod.items()` — raw B / DEFS tables.");
  lines.push("- `DingleMod.compat` — which loader hooks are active.");
  lines.push("");
  lines.push("## 5. PLAYER INPUT CONVENTIONS");
  lines.push(
    "Chat commands (`/verb` via `DingleMod.command`) are the primary UI. For ITEMS, prefer the native right-click path: register the item with `onUse` and hand it out with a `/yourmod give` command — that makes the mod feel like part of the game. Announce commands and items with `DingleMod.chat(...)` when the mod loads, and list every command in the manifest description's Commands section."
  );
  lines.push("");
  lines.push("## 6. WORKED EXAMPLE");

  if (input.includeExample) {
    lines.push("Study this complete, canonical mod (Throwable Poop). Your output must be the same shape — a JSON object with the same fields, code of similar style:");
    lines.push("");
    lines.push("```json");
    lines.push(EXAMPLE_POOP_JSON);
    lines.push("```");
  } else {
    lines.push("(Example omitted by the user — rely strictly on the spec above.)");
  }

  lines.push("");
  lines.push("## 7. THE MOD I WANT YOU TO WRITE");
  lines.push("- **Name**: " + (input.name || "(invent a fitting name)"));
  lines.push("- **Category**: " + input.category);
  if (input.features.length) {
    lines.push("- **Must include**: " + input.features.join("; "));
  }
  lines.push("- **The idea**: " + (input.idea || "(invent something fitting the game's absurdist tone)"));
  lines.push("");
  lines.push("## 8. OUTPUT CONTRACT (CRITICAL)");
  lines.push("1. Output EXACTLY ONE code block containing ONE valid JSON object: the complete `.dinglemod.json`.");
  lines.push("2. No prose before or after the code block. No explanations. The JSON is the entire deliverable.");
  lines.push("3. The `code` field must be a valid JSON string (escape newlines as \\n, quotes as \\\", no raw backticks).");
  lines.push("4. Double-check: `format` is `\"dinglemod-1\"`, `id` is kebab-case, `version` is semver, permissions match what the code uses, code is strict-mode-safe with all variables declared.");
  lines.push("5. The mod must work in the DingleMod Test Range (mock game) as well as the real game: degrade gracefully when three.js or scene access is unavailable.");

  return lines.join("\n");
}

function exampleSkeleton(input: ForgeInput) {
  return {
    format: "dinglemod-1",
    id: (input.name || "my-mod")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, ""),
    name: input.name || "My Mod",
    version: "1.0.0",
    author: "YourName",
    tagline: "One-line pitch for the mod card (8-140 chars).",
    description:
      "## What it does\n\n2-3 paragraphs of markdown.\n\n### Commands\n- `/verb` — what it does\n- `/verb arg` — what the arg does",
    category: input.category || "fun",
    tags: ["example", "tags"],
    iconEmoji: "🧩",
    permissions: ["chat", "ui"],
    gameVersion: "6.9",
    code: "// The entire mod JavaScript as ONE JSON string.\n// var counter = 0;\n// DingleMod.command('verb', function(args){ ... });\n// DingleMod.on('tick', function(d){ ... });",
  };
}

const EXAMPLE_POOP_JSON = JSON.stringify(
  {
    format: "dinglemod-1",
    id: "throwable-poop",
    name: "Throwable Poop",
    version: "1.3.0",
    author: "poopsmith_dev",
    tagline: "The pinnacle of DingleCraft science. Pick it up. Throw it. Regret nothing.",
    description:
      "## Finally, the feature DINGLECRAFT was always missing\n\n**Throwable Poop** is a real item: find it at the end of the creative palette or run `/poop give`.\n\n### Commands\n- `/poop` — lob one from thin air\n- `/poop give [n]` — put Poop items in your inventory\n\nRight-click (aimed at the ground) with a Poop item to throw it.",
    category: "fun",
    tags: ["poop", "items", "chaos"],
    iconEmoji: "💩",
    permissions: ["items", "entities", "combat", "chat", "world"],
    gameVersion: "6.9",
    code: [
      "// Throwable Poop v1.3.0 — the cornerstone of DingleCraft science",
      "var T = DingleMod.THREE();",
      "",
      "// A REAL item: in the inventory, and right-click = throw (like a spawn egg).",
      "DingleMod.registerItem({",
      "  id: 'poop',",
      "  name: 'Poop',",
      "  emoji: '💩',",
      "  stack: 16,",
      "  onUse: function (u) { throwPoop(); }",
      "});",
      "",
      "function makePoopMesh() {",
      "  if (!T) return null;",
      "  var m = new T.Mesh(new T.SphereGeometry(0.16, 8, 6), new T.MeshLambertMaterial({ color: 0x6b4423 }));",
      "  m.spin = true;",
      "  return m;",
      "}",
      "",
      "function throwPoop() {",
      "  var P = DingleMod.player();",
      "  var look = DingleMod.look();",
      "  if (!P || !T || !DingleMod.scene()) { DingleMod.toast('Enter a world first!'); return; }",
      "  var cp = Math.cos(look.pitch || 0);",
      "  DingleMod.projectile({",
      "    mesh: makePoopMesh(),",
      "    x: P.x, y: P.y + 1.5, z: P.z,",
      "    vx: -Math.sin(look.yaw || 0) * cp * 22,",
      "    vz: -Math.cos(look.yaw || 0) * cp * 22,",
      "    vy: Math.sin(look.pitch || 0) * 22 + 2,",
      "    gravity: 16, size: 0.3, ttl: 8,",
      "    onHit: function (hit) {",
      "      DingleMod.particles({ x: hit.x, y: hit.y, z: hit.z, color: 0x7a5230, count: 14, spread: 0.8, speed: 3, ttl: 0.9 });",
      "      if (hit.type === 'entity' && hit.entity) {",
      "        DingleMod.hurtMob(hit.entity, 3);",
      "        DingleMod.chat('💩 Splat! Direct hit!');",
      "      }",
      "    }",
      "  });",
      "}",
      "",
      "DingleMod.command('poop', function (args) {",
      "  if ((args[0] || '').toLowerCase() === 'give') {",
      "    DingleMod.give('poop', parseInt(args[1] || '16', 10) || 16);",
      "    DingleMod.chat('💩 Poop delivered. Right-click the ground to throw.');",
      "    return;",
      "  }",
      "  throwPoop();",
      "});",
      "",
      "DingleMod.log('Throwable Poop loaded. /poop to fling.');",
    ].join("\n"),
  },
  null,
  2
);
