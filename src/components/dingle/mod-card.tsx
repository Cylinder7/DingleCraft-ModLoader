"use client";

import type { ModDTO } from "@/lib/modspec";
import { useDingle } from "@/lib/store";
import { CategoryChip, DownloadStat, FollowStat, ModIcon, OfficialBadge, TagPill } from "./bits";
import { Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function ModCard({ mod }: { mod: ModDTO }) {
  const navigate = useDingle((s) => s.navigate);
  const install = useDingle((s) => s.install);
  const installed = useDingle((s) => s.installed);
  const isInstalled = installed.some((m) => m.slug === mod.slug);

  return (
    <article
      className="group relative cursor-pointer rounded-2xl border border-border/80 bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-black/30"
      onClick={() => navigate({ name: "mod", slug: mod.slug })}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate({ name: "mod", slug: mod.slug });
        }
      }}
      aria-label={`View ${mod.name} mod details`}
    >
      <div className="flex gap-3.5">
        <ModIcon
          emoji={mod.iconEmoji}
          from={mod.iconFrom}
          to={mod.iconTo}
          size={68}
          className="transition-transform duration-200 group-hover:scale-105"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-[15px] font-bold leading-tight text-foreground">
                {mod.name}
              </h3>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                by <span className="font-medium">{mod.author}</span>
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!isInstalled) {
                  install({
                    slug: mod.slug,
                    name: mod.name,
                    version: mod.version,
                    author: mod.author,
                    iconEmoji: mod.iconEmoji,
                    iconFrom: mod.iconFrom,
                    iconTo: mod.iconTo,
                    permissions: mod.permissions,
                    category: mod.category,
                  });
                }
              }}
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors",
                isInstalled
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                  : "border-border bg-secondary text-muted-foreground hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
              )}
              aria-label={isInstalled ? `${mod.name} added to launcher` : `Add ${mod.name} to launcher`}
              title={isInstalled ? "Added to launcher" : "Add to launcher"}
            >
              {isInstalled ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug text-muted-foreground">
            {mod.tagline}
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {mod.isOfficial ? <OfficialBadge /> : null}
            <CategoryChip category={mod.category} />
            <DownloadStat n={mod.downloads} />
            <FollowStat n={mod.follows} />
          </div>
          {mod.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {mod.tags.slice(0, 3).map((t) => (
                <TagPill key={t} tag={t} />
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export function ModCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/80 bg-card p-4">
      <div className="flex gap-3.5">
        <div className="h-[68px] w-[68px] animate-pulse rounded-xl bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/5 animate-pulse rounded bg-muted" />
          <div className="h-3 w-2/5 animate-pulse rounded bg-muted" />
          <div className="h-3 w-full animate-pulse rounded bg-muted" />
          <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}
