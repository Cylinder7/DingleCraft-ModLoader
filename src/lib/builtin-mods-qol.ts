// Built-in official mods (part C) — Quality of Life.
// NOTE: mod code is stored in template literals, so it must not contain
// backticks or "${".
import type { SeedMod } from "./builtin-mods-a";

export const MODS_QOL: SeedMod[] = [
  {
    slug: "inventory-search-tooltips",
    name: "Inventory Search & Tooltips",
    tagline: "A search bar for your creative inventory and name tooltips on every item.",
    description: `## The quality-of-life update DINGLECRAFT refused to ship

Stop scrolling through 200+ items hunting for one block. **Inventory Search & Tooltips** bolts two civilized features onto the game:

**1. Search bar.** Open your inventory (E) — a search box sits above the palette. Type "dia" and the palette shows only diamonds (and diamond-adjacent items). Type nothing to see everything again. It shows a live match count so you know exactly how many things you are ignoring.

**2. Tooltips.** Hover any item — in the palette, in your inventory grid, or in the hotbar — and its name floats next to your cursor. Items added by DingleMod mods are tagged with the mod that registered them, so you always know whose poop you are holding.

### Commands
- \`/qol\` — a reminder of what this mod does (you will forget)

### Notes
Works in the inventory and creative palette. Tooltips also work on the hotbar while in a world. Degrades gracefully in the Test Range (no inventory there — the search bar simply never appears).`,
    version: "1.0.0",
    author: "dingle_welfare_dept",
    category: "utility",
    tags: ["qol", "inventory", "search", "tooltips", "ui"],
    iconEmoji: "🔍",
    iconFrom: "#4ac7e8",
    iconTo: "#1c4a6a",
    downloads: 51440,
    follows: 4102,
    permissions: ["ui", "items"],
    isOfficial: true,
    featured: true,
    code: `// Inventory Search & Tooltips v1.0.0 — civilization, finally
var MODAL = null, DEFS = null;

function refreshGlobals() {
  try {
    MODAL = DingleMod.gameGlobal ? DingleMod.gameGlobal('MODAL') : null;
    DEFS = DingleMod.gameGlobal ? DingleMod.gameGlobal('DEFS') : null;
  } catch (e) {}
}
refreshGlobals();
if (!DEFS) {
  DingleMod.log('QOL: no native item table found (test range?) — search bar off, tooltips on.');
}

// ---------------- tooltips ----------------
var tip = null;
function tipEl() {
  if (tip) return tip;
  tip = document.createElement('div');
  tip.id = '__qol_tip';
  tip.style.cssText = 'position:fixed;left:0;top:0;z-index:99997;pointer-events:none;display:none;' +
    'background:rgba(18,14,8,.94);color:#ffe9b8;border:1px solid rgba(255,200,90,.4);' +
    'border-radius:6px;padding:5px 10px;font:600 13px system-ui,sans-serif;' +
    'box-shadow:0 4px 14px rgba(0,0,0,.5);white-space:nowrap;max-width:280px;' +
    'overflow:hidden;text-overflow:ellipsis';
  document.body.appendChild(tip);
  return tip;
}
function nameOfStack(st) {
  if (!st || !DEFS) return null;
  var d = DEFS[st.id];
  if (!d) return null;
  var n = d.name || String(st.id);
  if (st.count && st.count > 1) n = n + ' x' + st.count;
  if (d.dm_mod) n = n + '  [' + d.dm_mod + ']';
  return n;
}
function slotName(el) {
  refreshGlobals();
  if (MODAL && MODAL.slots) {
    for (var i = 0; i < MODAL.slots.length; i++) {
      var s = MODAL.slots[i];
      if (s && s.el === el) {
        var st = null;
        try { st = s.get(); } catch (e) {}
        return nameOfStack(st);
      }
    }
  }
  if (el && el.parentNode && el.parentNode.id === 'hotbar') {
    var P = DingleMod.player();
    if (P && P.inv) {
      var idx = Array.prototype.indexOf.call(el.parentNode.children, el);
      if (idx >= 0 && idx < 9) return nameOfStack(P.inv[idx]);
    }
  }
  return null;
}
function moveTip(ev) {
  var t = tipEl();
  var x = ev.clientX + 14, y = ev.clientY + 18;
  try {
    if (x + t.offsetWidth > window.innerWidth - 8) x = ev.clientX - t.offsetWidth - 10;
    if (y + t.offsetHeight > window.innerHeight - 8) y = ev.clientY - t.offsetHeight - 10;
  } catch (e) {}
  t.style.left = Math.max(4, x) + 'px';
  t.style.top = Math.max(4, y) + 'px';
}
function closestSlot(target) {
  try {
    if (target && target.closest) return target.closest('.slot,.hslot,.pslot');
  } catch (e) {}
  return null;
}
document.addEventListener('mouseover', function (ev) {
  var el = closestSlot(ev.target);
  if (!el) return;
  var name = slotName(el);
  if (!name) return;
  var t = tipEl();
  t.textContent = name;
  t.style.display = 'block';
  moveTip(ev);
}, true);
document.addEventListener('mousemove', function (ev) {
  if (tip && tip.style.display === 'block') moveTip(ev);
}, true);
document.addEventListener('mouseout', function (ev) {
  var el = closestSlot(ev.target);
  if (el && tip) tip.style.display = 'none';
}, true);
document.addEventListener('pointerdown', function () {
  if (tip) tip.style.display = 'none';
}, true);

// ---------------- search bar ----------------
var SEARCH_ID = '__qol_search';

function applyFilter(q) {
  refreshGlobals();
  if (!MODAL || !MODAL.slots) return 0;
  var ql = String(q || '').toLowerCase();
  var shown = 0, total = 0;
  for (var i = 0; i < MODAL.slots.length; i++) {
    var s = MODAL.slots[i];
    if (!s || !s.el || !s.el.classList || !s.el.classList.contains('pslot')) continue;
    total++;
    var st = null;
    try { st = s.get(); } catch (e) {}
    var name = '';
    if (st && DEFS && DEFS[st.id]) {
      var d = DEFS[st.id];
      name = ((d.name || '') + ' ' + (d.dm_mod || '')).toLowerCase();
    }
    var hit = !ql || name.indexOf(ql) !== -1;
    s.el.style.display = hit ? '' : 'none';
    if (hit) shown++;
  }
  var lab = document.getElementById('__qol_count');
  if (lab) lab.textContent = total + ' item' + (total === 1 ? '' : 's') + (ql ? ' — ' + shown + ' match' + (shown === 1 ? '' : 'es') : '');
  return shown;
}

function injectSearch() {
  var mbody = document.getElementById('mbody');
  if (!mbody || !mbody.querySelector) return;
  var pal = mbody.querySelector('.palette');
  if (!pal) return;
  if (document.getElementById(SEARCH_ID)) return;
  var wrap = document.createElement('div');
  wrap.id = SEARCH_ID;
  var inp = document.createElement('input');
  inp.type = 'text';
  inp.id = SEARCH_ID + '_i';
  inp.placeholder = 'Search items...';
  inp.className = 'mc-in';
  inp.style.margin = '0 0 4px';
  inp.autocomplete = 'off';
  inp.spellcheck = false;
  inp.addEventListener('input', function () { applyFilter(inp.value); });
  wrap.appendChild(inp);
  var lab = document.createElement('div');
  lab.id = '__qol_count';
  lab.className = 'mlabel';
  lab.style.margin = '0 0 4px';
  lab.textContent = 'items';
  wrap.appendChild(lab);
  mbody.insertBefore(wrap, pal);
  applyFilter('');
  DingleMod.log('QOL: search bar injected into inventory.');
}

if (typeof MutationObserver !== 'undefined') {
  var qolTarget = document.getElementById('mbody') || document.body;
  try {
    var obs = new MutationObserver(function () {
      if (DEFS && document.querySelector && document.querySelector('#mbody .palette')) injectSearch();
    });
    obs.observe(qolTarget, { childList: true, subtree: true });
  } catch (e) {
    DingleMod.log('QOL: observer failed — ' + (e && e.message));
  }
} else {
  // no MutationObserver (headless test): retry lazily a few times
  var tries = 0;
  var iv = setInterval(function () {
    tries++;
    if (DEFS && document.querySelector && document.querySelector('#mbody .palette')) { injectSearch(); clearInterval(iv); }
    if (tries > 200) clearInterval(iv);
  }, 250);
}

DingleMod.command('qol', function () {
  DingleMod.chat('🔍 QOL: open your inventory (E) and use the search box above the palette. Hover any item for its name.');
});

DingleMod.log('Inventory Search & Tooltips loaded. /qol for a reminder.');
DingleMod.on('gameStart', function () {
  DingleMod.log('QOL active: search bar in inventory, tooltips everywhere.');
});
`,
  },
];
