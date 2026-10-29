import type { ModDTO } from "@/lib/modspec";

export function toDTOShared(row: any, includeCode = false): ModDTO {
  return {
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    version: row.version,
    author: row.author,
    category: row.category,
    tags: row.tags ? row.tags.split(",").filter(Boolean) : [],
    iconEmoji: row.iconEmoji,
    iconFrom: row.iconFrom,
    iconTo: row.iconTo,
    downloads: row.downloads,
    follows: row.follows,
    permissions: row.permissions ? row.permissions.split(",").filter(Boolean) : [],
    code: includeCode ? row.code : undefined,
    manifest: includeCode ? row.manifest : undefined,
    isOfficial: row.isOfficial,
    featured: row.featured,
    createdAt: row.createdAt?.toISOString?.() ?? String(row.createdAt),
    updatedAt: row.updatedAt?.toISOString?.() ?? String(row.updatedAt),
  };
}
