"use client";

import { useState } from "react";
import { CATEGORIES, formatCount } from "@/lib/modspec";
import { useMods } from "@/hooks/use-mods";
import { useDingle } from "@/lib/store";
import { ModCard, ModCardSkeleton } from "./mod-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Rocket, Sparkles, PackageSearch, Users, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "downloads", label: "Most downloaded" },
  { value: "follows", label: "Most followed" },
  { value: "newest", label: "Newest" },
  { value: "updated", label: "Recently updated" },
];

export function BrowseView() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("featured");
  const { data, loading, error } = useMods(q, category, sort);
  const navigate = useDingle((s) => s.navigate);

  const mods = data?.mods ?? [];

  return (
    <div>
      {/* ------- hero ------- */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="dm-grid-bg absolute inset-0" />
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-24 left-1/4 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <span className="pointer-events-none absolute right-[12%] top-10 hidden select-none text-5xl opacity-20 dm-float sm:block">💩</span>
          <span className="pointer-events-none absolute right-[28%] top-24 hidden select-none text-4xl opacity-15 dm-float sm:block" style={{ animationDelay: "-2s" }}>🐕</span>
          <span className="pointer-events-none absolute right-[6%] bottom-8 hidden select-none text-4xl opacity-15 dm-float sm:block" style={{ animationDelay: "-4s" }}>🐌</span>

          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              The unofficial mod platform for DINGLECRAFT
            </div>
            <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
              Mods, a modloader &amp; a launcher for the{" "}
              <span className="bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">
                one-HTML-file
              </span>{" "}
              sandbox.
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
              DINGLECRAFT ships as a single 42 MB HTML file with no mod support —
              so we bolted a loader onto it. Browse mods, build your modpack, drop
              the game file on the launcher, and play. Or ask an external AI to
              write your mod with the AI Forge prompt generator.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button size="lg" className="rounded-xl font-bold" onClick={() => navigate({ name: "launch" })}>
                <Rocket className="mr-1.5 h-4.5 w-4.5" />
                Open the Launcher
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-xl font-bold"
                onClick={() => navigate({ name: "forge" })}
              >
                <Sparkles className="mr-1.5 h-4.5 w-4.5" />
                Generate a mod with AI
              </Button>
            </div>

            {data?.stats && (
              <div className="mt-8 flex flex-wrap gap-x-8 gap-y-2 text-sm">
                <Stat value={formatCount(data.stats.mods)} label="mods" icon={<PackageSearch className="h-4 w-4" />} />
                <Stat value={formatCount(data.stats.downloads)} label="downloads" icon={<Download className="h-4 w-4" />} />
                <Stat value={formatCount(data.stats.authors)} label="authors" icon={<Users className="h-4 w-4" />} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ------- controls ------- */}
      <section className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search mods, authors, tags... (try: poop)"
              className="rounded-xl border-border bg-card pl-10 py-6 text-[15px] focus-visible:ring-primary/40"
              aria-label="Search mods"
            />
          </div>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-full rounded-xl bg-card py-6 lg:w-52" aria-label="Sort mods">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {SORTS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="dm-scroll mt-4 flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Categories">
          <CategoryPill
            active={category === "all"}
            onClick={() => setCategory("all")}
            label="All"
            emoji="✨"
          />
          {CATEGORIES.map((c) => (
            <CategoryPill
              key={c.key}
              active={category === c.key}
              onClick={() => setCategory(c.key)}
              label={c.label}
              emoji={c.emoji}
            />
          ))}
        </div>
      </section>

      {/* ------- grid ------- */}
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-4 sm:px-6">
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-300">
            Failed to load mods: {error}
          </div>
        )}
        {loading && !data ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ModCardSkeleton key={i} />
            ))}
          </div>
        ) : mods.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-20 text-center">
            <span className="text-5xl">🔍🦗</span>
            <p className="text-lg font-semibold">No mods found</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {q
                ? `Nothing matches "${q}". This platform is 100% poop-positive, so that's saying something.`
                : "No mods in this category yet — be the first to upload one!"}
            </p>
            <Button variant="outline" className="mt-2 rounded-xl" onClick={() => navigate({ name: "upload" })}>
              Upload a mod
            </Button>
          </div>
        ) : (
          <motion.div
            key={`${category}-${sort}-${q}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          >
            {mods.map((m) => (
              <ModCard key={m.slug} mod={m} />
            ))}
          </motion.div>
        )}
      </section>
    </div>
  );
}

function Stat({ value, label, icon }: { value: string; label: string; icon: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-muted-foreground">
      <span className="text-primary">{icon}</span>
      <span className="font-bold text-foreground">{value}</span>
      {label}
    </span>
  );
}

function CategoryPill({
  active,
  onClick,
  label,
  emoji,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  emoji: string;
}) {
  return (
    <button
      onClick={onClick}
      role="tab"
      aria-selected={active}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-primary/50 bg-primary/15 text-primary"
          : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
      )}
    >
      <span>{emoji}</span>
      {label}
    </button>
  );
}
