"use client";

import { categoryOf, permissionOf, formatCount } from "@/lib/modspec";
import { Download, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export function ModIcon({
  emoji,
  from,
  to,
  size = 64,
  className,
}: {
  emoji: string;
  from: string;
  to: string;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-xl border border-white/10 shadow-inner",
        className
      )}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${from}, ${to})`,
      }}
      aria-hidden
    >
      <span style={{ fontSize: size * 0.48, lineHeight: 1 }}>{emoji}</span>
      <span
        className="pointer-events-none absolute inset-0 rounded-xl"
        style={{
          background:
            "linear-gradient(160deg, rgba(255,255,255,0.14), rgba(255,255,255,0) 46%)",
        }}
      />
    </div>
  );
}

export function CategoryChip({ category }: { category: string }) {
  const c = categoryOf(category);
  if (!c) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/60 px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
      <span>{c.emoji}</span>
      {c.label}
    </span>
  );
}

export function TagPill({ tag }: { tag: string }) {
  return (
    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
      #{tag}
    </span>
  );
}

export function StatIcon({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 text-muted-foreground"
      title={label}
    >
      <Icon className="h-3.5 w-3.5 text-emerald-400/90" />
      <span className="text-xs font-medium">{formatCount(value)}</span>
    </span>
  );
}

export function PermissionChip({ perm }: { perm: string }) {
  const p = permissionOf(perm);
  if (!p) return null;
  const danger = p.key === "dangerous";
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-lg border p-3",
        danger ? "border-red-500/30 bg-red-500/5" : "border-border bg-card"
      )}
    >
      <span className="text-lg leading-none">{p.icon}</span>
      <div>
        <div
          className={cn(
            "text-sm font-semibold",
            danger ? "text-red-300" : "text-foreground"
          )}
        >
          {p.label}
        </div>
        <div className="text-xs text-muted-foreground">{p.desc}</div>
      </div>
    </div>
  );
}

export function OfficialBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
      ★ Official
    </span>
  );
}

export function CommunityBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-400">
      ⬆ Community
    </span>
  );
}

export function DownloadStat({ n }: { n: number }) {
  return <StatIcon icon={Download} value={n} label={`${n} downloads`} />;
}

export function FollowStat({ n }: { n: number }) {
  return <StatIcon icon={Heart} value={n} label={`${n} follows`} />;
}
