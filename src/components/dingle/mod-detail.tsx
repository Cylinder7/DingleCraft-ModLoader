"use client";

import { useMemo, useState } from "react";
import { useMod } from "@/hooks/use-mods";
import { useDingle } from "@/lib/store";
import { formatCount } from "@/lib/modspec";
import { CategoryChip, ModIcon, OfficialBadge, CommunityBadge, PermissionChip } from "./bits";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Check, Download, Heart, Plus, Rocket, Copy, ShieldAlert } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function ModDetailView({ slug }: { slug: string }) {
  const { mod, loading, error } = useMod(slug);
  const navigate = useDingle((s) => s.navigate);
  const install = useDingle((s) => s.install);
  const installed = useDingle((s) => s.installed);
  const [hearted, setHearted] = useState(false);

  const isInstalled = installed.some((m) => m.slug === slug);

  const markdownComponents = useMemo(
    () => ({
      h2: (p: React.HTMLAttributes<HTMLHeadingElement>) => (
        <h2 className="mb-3 mt-7 border-b border-border pb-2 text-xl font-extrabold tracking-tight first:mt-0" {...p} />
      ),
      h3: (p: React.HTMLAttributes<HTMLHeadingElement>) => (
        <h3 className="mb-2 mt-5 text-lg font-bold" {...p} />
      ),
      p: (p: React.HTMLAttributes<HTMLParagraphElement>) => (
        <p className="mb-4 text-[15px] leading-relaxed text-muted-foreground" {...p} />
      ),
      strong: (p: React.HTMLAttributes<HTMLElement>) => (
        <strong className="font-bold text-foreground" {...p} />
      ),
      em: (p: React.HTMLAttributes<HTMLElement>) => (
        <em className="italic text-foreground/90" {...p} />
      ),
      ul: (p: React.HTMLAttributes<HTMLUListElement>) => (
        <ul className="mb-4 space-y-1.5 pl-1 text-[15px]" {...p} />
      ),
      li: ({ children, ...p }: React.LiHTMLAttributes<HTMLLIElement>) => (
        <li className="relative list-none pl-5 text-muted-foreground before:absolute before:left-1 before:top-2.5 before:h-1.5 before:w-1.5 before:rounded-full before:bg-primary/70" {...p}>
          {children}
        </li>
      ),
      code: ({ className, children, ...props }: React.HTMLAttributes<HTMLElement>) => {
        const isBlock = className?.includes("language-");
        if (isBlock) return <code className="block font-mono text-sm" {...props}>{children}</code>;
        return (
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px] text-amber-200" {...props}>
            {children}
          </code>
        );
      },
    }),
    []
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl animate-pulse px-4 py-10 sm:px-6">
        <div className="h-5 w-24 rounded bg-muted" />
        <div className="mt-4 h-40 rounded-2xl bg-muted" />
      </div>
    );
  }

  if (error || !mod) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
        <span className="text-6xl">🦗</span>
        <h2 className="mt-4 text-2xl font-bold">Mod not found</h2>
        <p className="mt-2 text-muted-foreground">{error ?? "It may have been removed."}</p>
        <Button className="mt-6 rounded-xl" onClick={() => navigate({ name: "browse" })}>
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to mods
        </Button>
      </div>
    );
  }

  const hasDangerous = mod.permissions.includes("dangerous");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <button
        onClick={() => navigate({ name: "browse" })}
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to mods
      </button>

      {/* header banner */}
      <div
        className="relative overflow-hidden rounded-2xl border border-border"
        style={{ background: `linear-gradient(120deg, ${mod.iconFrom}33, ${mod.iconTo}66, transparent)` }}
      >
        <div className="dm-grid-bg absolute inset-0 opacity-60" />
        <div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
          <ModIcon emoji={mod.iconEmoji} from={mod.iconFrom} to={mod.iconTo} size={104} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{mod.name}</h1>
              <span className="rounded-full border border-border bg-card px-2.5 py-0.5 font-mono text-xs text-muted-foreground">
                v{mod.version}
              </span>
              {mod.isOfficial ? <OfficialBadge /> : <CommunityBadge />}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              by <span className="font-semibold text-foreground">{mod.author}</span> ·{" "}
              <CategoryChip category={mod.category} />
            </p>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-foreground/90">{mod.tagline}</p>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Download className="h-4 w-4 text-emerald-400" />
                <b className="text-foreground">{formatCount(mod.downloads)}</b> downloads
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Heart className={cn("h-4 w-4", hearted ? "fill-red-400 text-red-400" : "text-red-400/70")} />
                <b className="text-foreground">{formatCount(mod.follows + (hearted ? 1 : 0))}</b> follows
              </span>
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-2.5 sm:w-48">
            <Button
              className={cn(
                "rounded-xl py-5 text-base font-bold",
                isInstalled && "bg-emerald-600 text-white hover:bg-emerald-600"
              )}
              onClick={() => {
                if (isInstalled) {
                  navigate({ name: "launch" });
                } else {
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
                  toast({ title: "Added to launcher", description: `${mod.name} is in your modpack.` });
                }
              }}
            >
              {isInstalled ? (
                <>
                  <Check className="mr-1.5 h-5 w-5" /> In modpack
                </>
              ) : (
                <>
                  <Plus className="mr-1.5 h-5 w-5" /> Add to modpack
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="rounded-xl font-semibold"
              onClick={() => {
                const a = document.createElement("a");
                a.href = `/api/mods/${mod.slug}/download`;
                a.download = `${mod.slug}.dinglemod.json`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                toast({ title: "Download started", description: `${mod.slug}.dinglemod.json` });
              }}
            >
              <Download className="mr-1.5 h-4 w-4" /> .dinglemod.json
            </Button>
            <Button
              variant="secondary"
              className="rounded-xl font-semibold"
              onClick={() => setHearted((h) => !h)}
            >
              <Heart className={cn("mr-1.5 h-4 w-4", hearted && "fill-current")} />
              {hearted ? "Following" : "Follow"}
            </Button>
          </div>
        </div>
      </div>

      {hasDangerous && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/5 p-4">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
          <p className="text-sm text-red-200/90">
            <b>This mod requests the Dangerous permission.</b> It can trigger real
            explosions in your world. Your save file&apos;s therapist has been
            notified.
          </p>
        </div>
      )}

      {/* tabs */}
      <Tabs defaultValue="overview" className="mt-6">
        <TabsList className="rounded-xl bg-secondary/60">
          <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
          <TabsTrigger value="permissions" className="rounded-lg">Permissions</TabsTrigger>
          <TabsTrigger value="code" className="rounded-lg">Code</TabsTrigger>
          <TabsTrigger value="details" className="rounded-lg">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-5">
          <article className="max-w-3xl">
            <ReactMarkdown components={markdownComponents as never}>
              {mod.description}
            </ReactMarkdown>
          </article>
        </TabsContent>

        <TabsContent value="permissions" className="mt-5">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm text-muted-foreground">
              Permissions declared in the manifest. The DingleMod loader only
              grants what is declared — transparency over trust.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {mod.permissions.map((p) => (
                <PermissionChip key={p} perm={p} />
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="code" className="mt-5">
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2.5">
              <span className="font-mono text-xs text-muted-foreground">{mod.slug}.js</span>
              <Button
                size="sm"
                variant="secondary"
                className="rounded-lg font-mono text-xs"
                onClick={() => {
                  if (mod.code) {
                    navigator.clipboard.writeText(mod.code);
                    toast({ title: "Code copied" });
                  }
                }}
              >
                <Copy className="mr-1 h-3.5 w-3.5" /> copy
              </Button>
            </div>
            <SyntaxHighlighter
              language="javascript"
              style={oneDark}
              customStyle={{ margin: 0, borderRadius: 0, fontSize: "12.5px", background: "#161614" }}
            >
              {mod.code ?? ""}
            </SyntaxHighlighter>
          </div>
        </TabsContent>

        <TabsContent value="details" className="mt-5">
          <dl className="grid max-w-2xl gap-3 text-sm">
            <DetailRow k="Mod ID" v={mod.slug} />
            <DetailRow k="Version" v={mod.version} />
            <DetailRow k="Author" v={mod.author} />
            <DetailRow k="Category" v={mod.category} />
            <DetailRow k="Format" v="dinglemod-1" />
            <DetailRow k="Game version" v="DINGLECRAFT 6.9+" />
            <DetailRow k="Published" v={new Date(mod.createdAt).toLocaleDateString()} />
            <DetailRow k="Updated" v={new Date(mod.updatedAt).toLocaleDateString()} />
            <DetailRow k="Source" v={mod.isOfficial ? "Official catalog" : "Community upload"} />
          </dl>
        </TabsContent>
      </Tabs>

      {/* cross-sell */}
      <section className="mt-12 rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/10 to-transparent p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold">Ready to play with mods?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {isInstalled
                ? `${mod.name} is in your modpack. Attach your DINGLECRAFT.html and launch.`
                : `Add ${mod.name} to your modpack, then launch it into the game.`}
            </p>
          </div>
          <Button className="rounded-xl font-bold" onClick={() => navigate({ name: "launch" })}>
            <Rocket className="mr-1.5 h-4.5 w-4.5" /> Open Launcher
          </Button>
        </div>
      </section>
    </div>
  );
}

function DetailRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="truncate font-mono text-sm font-medium">{v}</dd>
    </div>
  );
}
