import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { MODS_A } from "@/lib/builtin-mods-a";
import { MODS_B } from "@/lib/builtin-mods-b";
import { MODS_QOL } from "@/lib/builtin-mods-qol";
import { manifestSchema, MOD_FORMAT, slugify } from "@/lib/modspec";
import { toDTOShared } from "@/lib/mod-dto";
import type { SeedMod } from "@/lib/builtin-mods-a";

const ALL_SEEDS: SeedMod[] = [...MODS_A, ...MODS_B, ...MODS_QOL];

function tagsToString(tags: string[]) {
  return tags.join(",");
}

function manifestFor(m: SeedMod) {
  return JSON.stringify(
    {
      format: MOD_FORMAT,
      id: m.slug,
      name: m.name,
      version: m.version,
      author: m.author,
      tagline: m.tagline,
      description: m.description,
      category: m.category,
      tags: m.tags,
      iconEmoji: m.iconEmoji,
      permissions: m.permissions,
      gameVersion: "6.9",
      code: m.code,
    },
    null,
    2
  );
}

// Idempotent seed of the official catalog. Runs on every request, but the
// fast path is a single query: if every official mod already matches its
// seed version (and none are missing), nothing is written. When a builtin is
// updated (version bump), it is refreshed in place — community mods are never
// touched.
async function ensureSeeded() {
  const officials = await db.mod.findMany({
    where: { isOfficial: true },
    select: { slug: true, version: true },
  });
  const bySlug = new Map(officials.map((o) => [o.slug, o.version]));
  let dirty = officials.length < ALL_SEEDS.length;
  if (!dirty) {
    for (const m of ALL_SEEDS) {
      if (bySlug.get(m.slug) !== m.version) { dirty = true; break; }
    }
  }
  if (!dirty) return;
  for (const m of ALL_SEEDS) {
    if (bySlug.get(m.slug) === m.version) continue;
    await db.mod.upsert({
      where: { slug: m.slug },
      update: {
        name: m.name,
        tagline: m.tagline,
        description: m.description,
        version: m.version,
        author: m.author,
        category: m.category,
        tags: tagsToString(m.tags),
        iconEmoji: m.iconEmoji,
        iconFrom: m.iconFrom,
        iconTo: m.iconTo,
        downloads: m.downloads,
        follows: m.follows,
        permissions: m.permissions.join(","),
        manifest: manifestFor(m),
        code: m.code,
        isOfficial: m.isOfficial,
        featured: m.featured,
      },
      create: {
        slug: m.slug,
        name: m.name,
        tagline: m.tagline,
        description: m.description,
        version: m.version,
        author: m.author,
        category: m.category,
        tags: tagsToString(m.tags),
        iconEmoji: m.iconEmoji,
        iconFrom: m.iconFrom,
        iconTo: m.iconTo,
        downloads: m.downloads,
        follows: m.follows,
        permissions: m.permissions.join(","),
        manifest: manifestFor(m),
        code: m.code,
        isOfficial: m.isOfficial,
        featured: m.featured,
      },
    });
  }
}

export async function GET(req: NextRequest) {
  try {
    await ensureSeeded();
    const sp = req.nextUrl.searchParams;
    const q = (sp.get("q") || "").toLowerCase().trim();
    const category = sp.get("category") || "";
    const sort = sp.get("sort") || "featured";

    const rows = await db.mod.findMany();

    let list = rows.map((r) => toDTOShared(r));
    if (q) {
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.tagline.toLowerCase().includes(q) ||
          m.author.toLowerCase().includes(q) ||
          m.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (category && category !== "all") {
      list = list.filter((m) => m.category === category);
    }

    list.sort((a, b) => {
      switch (sort) {
        case "downloads":
          return b.downloads - a.downloads;
        case "follows":
          return b.follows - a.follows;
        case "newest":
          return b.createdAt.localeCompare(a.createdAt);
        case "updated":
          return b.updatedAt.localeCompare(a.updatedAt);
        default: {
          const fa = a.featured ? 1 : 0;
          const fb = b.featured ? 1 : 0;
          if (fa !== fb) return fb - fa;
          if (a.isOfficial !== b.isOfficial) return a.isOfficial ? -1 : 1;
          return b.downloads - a.downloads;
        }
      }
    });

    const stats = {
      mods: rows.length,
      downloads: rows.reduce((s, r) => s + r.downloads, 0),
      authors: new Set(rows.map((r) => r.author)).size,
    };

    return NextResponse.json({ mods: list, stats });
  } catch (e) {
    console.error("GET /api/mods failed", e);
    return NextResponse.json({ error: "Failed to list mods" }, { status: 500 });
  }
}

// Publish a community mod. Body: a parsed .dinglemod.json manifest.
export async function POST(req: NextRequest) {
  try {
    await ensureSeeded();
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Body must be valid JSON" }, { status: 400 });
    }
    const parsed = manifestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Manifest failed validation",
          issues: parsed.error.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        },
        { status: 400 }
      );
    }
    const m = parsed.data;

    // forbid overwriting official mods
    const slug = slugify(m.name);
    const existing = await db.mod.findUnique({ where: { slug } });
    if (existing?.isOfficial) {
      return NextResponse.json(
        { error: "An official mod already owns that name. Pick another name." },
        { status: 409 }
      );
    }

    // safe static analysis of the code
    const codeWarnings: string[] = [];
    if (/fetch\(|XMLHttpRequest|import\s|WebSocket/i.test(m.code)) {
      codeWarnings.push("Code references networking (fetch/XHR/WebSocket/import). It will be flagged for review.");
    }
    if (/document\.cookie|localStorage\.setItem/i.test(m.code)) {
      codeWarnings.push("Code touches cookies/localStorage.");
    }

    const palette = pickPalette(m.category, m.iconEmoji);

    const row = await db.mod.upsert({
      where: { slug },
      update: {
        name: m.name,
        tagline: m.tagline,
        description: m.description,
        version: m.version,
        author: m.author,
        category: m.category,
        tags: m.tags.join(","),
        iconEmoji: m.iconEmoji,
        permissions: m.permissions.join(","),
        manifest: JSON.stringify(m, null, 2),
        code: m.code,
        isOfficial: false,
        featured: false,
      },
      create: {
        slug,
        name: m.name,
        tagline: m.tagline,
        description: m.description,
        version: m.version,
        author: m.author,
        category: m.category,
        tags: m.tags.join(","),
        iconEmoji: m.iconEmoji,
        iconFrom: palette.from,
        iconTo: palette.to,
        downloads: 0,
        follows: 0,
        permissions: m.permissions.join(","),
        manifest: JSON.stringify(m, null, 2),
        code: m.code,
        isOfficial: false,
        featured: false,
      },
    });

    return NextResponse.json({ mod: toDTOShared(row, true), warnings: codeWarnings }, { status: 201 });
  } catch (e) {
    console.error("POST /api/mods failed", e);
    return NextResponse.json({ error: "Failed to publish mod" }, { status: 500 });
  }
}

function pickPalette(category: string, _emoji: string) {
  switch (category) {
    case "fun":
      return { from: "#b06f2e", to: "#4a2c12" };
    case "mobs":
      return { from: "#9c3d2e", to: "#3c1409" };
    case "items":
      return { from: "#7a6a3a", to: "#33291a" };
    case "gameplay":
      return { from: "#3f7a4e", to: "#16301f" };
    case "utility":
      return { from: "#6a7a5a", to: "#26301f" };
    case "horror":
      return { from: "#5a5a66", to: "#1f1f26" };
    default:
      return { from: "#8a6a3a", to: "#33291a" };
  }
}
