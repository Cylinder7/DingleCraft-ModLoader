import { z } from "zod";

// ---------------------------------------------------------------------------
// DingleMod format v1 — the mod packaging standard for DINGLECRAFT
// A .dinglemod.json is ONE self-contained JSON file: manifest + embedded code.
// ---------------------------------------------------------------------------

export const MOD_FORMAT = "dinglemod-1" as const;

export const CATEGORIES = [
  { key: "fun", label: "Fun", emoji: "🎉", desc: "Silly toys, gags and chaos" },
  { key: "mobs", label: "Mobs", emoji: "🐾", desc: "New creatures & companions" },
  { key: "items", label: "Items", emoji: "🗡️", desc: "New items, tools & weapons" },
  { key: "gameplay", label: "Gameplay", emoji: "🎮", desc: "Tweaks how the game plays" },
  { key: "utility", label: "Utility", emoji: "🔧", desc: "Quality of life helpers" },
  { key: "horror", label: "Horror", emoji: "👻", desc: "Guilt ghosts & worse" },
  { key: "silly", label: "Silly", emoji: "🤡", desc: "Absurd nonsense, as intended" },
] as const;

export type CategoryKey = (typeof CATEGORIES)[number]["key"];

export const PERMISSIONS = [
  { key: "items", label: "Items", icon: "🍖", desc: "Register new items into the game" },
  { key: "blocks", label: "Blocks", icon: "🧱", desc: "Register new blocks into the world" },
  { key: "mobs", label: "Mobs", icon: "🐝", desc: "Register and spawn new mobs" },
  { key: "entities", label: "Entities", icon: "✨", desc: "Spawn drops, particles and custom entities" },
  { key: "world", label: "World", icon: "🌍", desc: "Read and write blocks in the world" },
  { key: "combat", label: "Combat", icon: "⚔️", desc: "Damage mobs and the player" },
  { key: "chat", label: "Chat", icon: "💬", desc: "Send chat messages and register commands" },
  { key: "ui", label: "UI", icon: "🖥️", desc: "Show toasts and overlay UI" },
  { key: "time", label: "Time", icon: "🕰️", desc: "Change time of day and game speed" },
  { key: "dangerous", label: "Dangerous", icon: "☢️", desc: "Explosions, nukes, world destruction" },
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number]["key"];

export const MOD_EVENTS = [
  { key: "tick", desc: "Every game frame while playing. Handler receives approximate delta seconds." },
  { key: "second", desc: "Fired once per second of gameplay — cheap place for timers." },
  { key: "chat", desc: "When the player sends a chat message (non-command). { text }" },
  { key: "command", desc: "Any /command typed by the player. { name, args, raw }" },
  { key: "itemUse", desc: "A modded item with onUse was right-clicked (aimed at a block). { id, x, y, z, mod }" },
  { key: "blockPlace", desc: "A block was placed. { x, y, z, id }" },
  { key: "blockBreak", desc: "A block was removed. { x, y, z, lastId }" },
  { key: "mobHurt", desc: "A mob took damage. { mob, amount, byPlayer }" },
  { key: "playerHurt", desc: "The player took damage. { amount }" },
  { key: "explosion", desc: "An explosion happened. { x, y, z }" },
  { key: "gameStart", desc: "A world loaded / play began." },
] as const;

export const manifestSchema = z.object({
  format: z.literal("dinglemod-1"),
  id: z
    .string()
    .regex(/^[a-z0-9][a-z0-9-]{1,62}$/, "id must be lowercase kebab-case (2-64 chars)"),
  name: z.string().min(2).max(64),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, "version must be semver x.y.z"),
  author: z.string().min(2).max(48),
  tagline: z.string().min(8).max(140),
  description: z.string().min(20).max(4000),
  category: z.enum([
    "fun",
    "mobs",
    "items",
    "gameplay",
    "utility",
    "horror",
    "silly",
  ]),
  tags: z.array(z.string().min(1).max(24)).max(8).default([]),
  iconEmoji: z.string().min(1).max(8).default("🧩"),
  permissions: z.array(z.enum(PERMISSIONS.map((p) => p.key) as [string, ...string[]])).min(1),
  gameVersion: z.string().default("6.9"),
  code: z.string().min(20).max(120000),
});

export type DingleManifest = z.infer<typeof manifestSchema>;

// Shape returned by the API to the client
export interface ModDTO {
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
  code?: string;
  manifest?: string;
  isOfficial: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export function categoryOf(key: string) {
  return CATEGORIES.find((c) => c.key === key);
}

export function permissionOf(key: string) {
  return PERMISSIONS.find((p) => p.key === key);
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "mod";
}

export function formatCount(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

export const FORGE_TARGETS = [
  { key: "universal", label: "Universal", desc: "Works in any capable AI chat" },
  { key: "chatgpt", label: "ChatGPT", desc: "Tuned for GPT-5 / o-series" },
  { key: "claude", label: "Claude", desc: "Tuned for Claude" },
  { key: "gemini", label: "Gemini", desc: "Tuned for Gemini" },
] as const;
