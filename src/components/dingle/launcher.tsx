"use client";

import { useEffect, useRef, useState } from "react";
import { useDingle } from "@/lib/store";
import type { ModDTO } from "@/lib/modspec";
import { permissionOf } from "@/lib/modspec";
import {
  buildModdedHtml, openBlob, downloadBlob, verifyGameHtml, type LaunchMod,
  fetchBundledGame, headBundledGame, isGameCached, BUNDLED_GAME_URL,
} from "@/lib/inject";
import { TEST_RANGE_HTML } from "@/lib/test-range";
import { LOADER_VERSION } from "@/lib/loader-runtime";
import { ModIcon } from "./bits";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import {
  Rocket, UploadCloud, FileVideo, ChevronUp, ChevronDown, Trash2,
  ShieldAlert, FlaskConical, Download, MousePointerClick, Puzzle, Zap, Info,
  PackageCheck, Globe2, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LaunchOutcome {
  modCount: number;
  sizeMb: string;
  mode: "game" | "test";
}

const REPO_URL = "https://github.com/Cylinder7/dinglecraftMODS";

export function LauncherView() {
  const installed = useDingle((s) => s.installed);
  const toggle = useDingle((s) => s.toggle);
  const uninstall = useDingle((s) => s.uninstall);
  const reorder = useDingle((s) => s.reorder);
  const navigate = useDingle((s) => s.navigate);
  const gameFileMeta = useDingle((s) => s.gameFile);
  const setGameFileMeta = useDingle((s) => s.setGameFile);

  const [file, setFile] = useState<File | null>(null);
  const [verify, setVerify] = useState<{ verified: boolean; reason: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<LaunchOutcome | null>(null);
  const [manualUrl, setManualUrl] = useState<string | null>(null);
  const [bundled, setBundled] = useState<{ ok: boolean; size: number } | null>(null);
  const [progress, setProgress] = useState<{ pct: number; mb: string } | null>(null);
  const [cached, setCached] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const enabled = installed.filter((m) => m.enabled);
  const hasDangerous = enabled.some((m) => m.permissions.includes("dangerous"));
  const usingBundled = !file;
  const gameReady = usingBundled ? !!bundled?.ok : true;

  // probe the bundled game on mount (cheap HEAD request)
  useEffect(() => {
    let alive = true;
    setCached(isGameCached());
    headBundledGame().then((r) => {
      if (alive) setBundled(r);
    });
    return () => { alive = false; };
  }, []);

  async function attachFile(f: File) {
    if (!/\.html?$/i.test(f.name)) {
      toast({ title: "That's not an HTML file", description: "DINGLECRAFT ships as a single .html file (~42 MB)." });
      return;
    }
    setFile(f);
    setOutcome(null);
    setManualUrl(null);
    setBusy(true);
    try {
      const head = await f.slice(0, 400_000).text();
      const v = verifyGameHtml(head, f.size);
      setVerify(v);
      setGameFileMeta({ name: f.name, size: f.size, verified: v.verified });
      if (v.verified) {
        toast({ title: "Using your copy of the game", description: v.reason });
      } else {
        toast({ title: "Attached, with doubts", description: v.reason });
      }
    } catch (e) {
      setVerify({ verified: false, reason: "Could not read the file." });
    } finally {
      setBusy(false);
    }
  }

  function clearCustomFile() {
    setFile(null);
    setVerify(null);
    setGameFileMeta(null);
    setOutcome(null);
    setCached(isGameCached());
    toast({ title: "Back to the bundled game", description: "The launcher's own copy of DINGLECRAFT v6.9 will be used." });
  }

  async function gatherMods(): Promise<LaunchMod[]> {
    const results = await Promise.all(
      enabled.map((m) =>
        fetch(`/api/mods/${m.slug}`)
          .then((r) => r.json())
          .catch(() => null)
      )
    );
    const mods: LaunchMod[] = [];
    for (const r of results) {
      const mod: ModDTO | undefined = r?.mod;
      if (mod?.code) {
        mods.push({
          id: mod.slug,
          name: mod.name,
          version: mod.version,
          author: mod.author,
          permissions: mod.permissions,
          code: mod.code,
        });
      }
    }
    return mods;
  }

  async function loadGameHtml(): Promise<string> {
    if (file) return await file.text();
    // bundled game — stream with progress
    setProgress({ pct: 0, mb: "0 MB" });
    try {
      const html = await fetchBundledGame((loaded, total) => {
        const pct = total ? Math.min(100, Math.round((loaded / total) * 100)) : 0;
        setProgress({
          pct,
          mb: (loaded / 1024 / 1024).toFixed(1) + " / " + (total / 1024 / 1024).toFixed(1) + " MB",
        });
      });
      setCached(true);
      if (!verify) {
        const v = verifyGameHtml(html.slice(0, 400_000), html.length);
        setVerify(v);
      }
      return html;
    } finally {
      setProgress(null);
    }
  }

  async function launch(mode: "game" | "test") {
    if (mode === "game" && !gameReady) {
      toast({ title: "No game available", description: "The bundled game file could not be found — drop your own DINGLECRAFT.html instead." });
      return;
    }
    if (enabled.length === 0) {
      toast({ title: "No mods enabled", description: "Add at least one mod to your modpack first." });
      return;
    }
    setBusy(true);
    try {
      const mods = await gatherMods();
      const html = mode === "game" ? await loadGameHtml() : TEST_RANGE_HTML;
      const result = await buildModdedHtml(html, mods);
      const w = openBlob(result.blob);
      setOutcome({
        modCount: result.modCount,
        sizeMb: (result.size / 1024 / 1024).toFixed(1),
        mode,
      });
      if (w) {
        toast({
          title: `Launched with ${result.modCount} mod${result.modCount === 1 ? "" : "s"}`,
          description: mode === "test" ? "Test Range opened in a new tab." : "Modded game opened in a new tab.",
        });
        setManualUrl(null);
      } else {
        const url = URL.createObjectURL(result.blob);
        setManualUrl(url);
        toast({
          title: "Pop-up blocked",
          description: "Click the manual link below the launch button to open your modded game.",
        });
      }
    } catch (e) {
      toast({ title: "Launch failed", description: String(e) });
    } finally {
      setBusy(false);
    }
  }

  async function downloadModded(mode: "game" | "test") {
    if (mode === "game" && !gameReady) return;
    if (enabled.length === 0) return;
    setBusy(true);
    try {
      const mods = await gatherMods();
      const html = mode === "game" ? await loadGameHtml() : TEST_RANGE_HTML;
      const result = await buildModdedHtml(html, mods);
      downloadBlob(
        result.blob,
        mode === "game"
          ? "DINGLECRAFT-modded.html"
          : "dinglemod-test-range.html"
      );
      toast({ title: "Download started", description: "A self-contained modded HTML file." });
    } catch (e) {
      toast({ title: "Export failed", description: String(e) });
    } finally {
      setBusy(false);
    }
  }

  const bundledMb = bundled?.size ? (bundled.size / 1024 / 1024).toFixed(1) : "42";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
        <Rocket className="h-3.5 w-3.5" /> DingleMod Loader v{LOADER_VERSION}
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Launcher</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Build your modpack and launch a modded game.{" "}
        <b className="text-foreground">DINGLECRAFT v6.9 is bundled with this launcher</b>{" "}
        and loads by default — drop your own copy only if you want to override it.
        Everything happens locally in your browser.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[5fr_7fr]">
        {/* ---------------- modpack ---------------- */}
        <section aria-labelledby="modpack-h">
          <h2 id="modpack-h" className="mb-3 flex items-center gap-2 text-lg font-bold">
            <Puzzle className="h-5 w-5 text-primary" />
            Your modpack
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {enabled.length}/{installed.length} on
            </span>
          </h2>

          {installed.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border p-10 text-center">
              <span className="text-4xl">🧩</span>
              <p className="font-semibold">No mods installed yet</p>
              <p className="text-sm text-muted-foreground">
                Browse the catalog and hit <b>+</b> on anything you like.
              </p>
              <Button variant="outline" className="mt-1 rounded-xl" onClick={() => navigate({ name: "browse" })}>
                Browse mods
              </Button>
            </div>
          ) : (
            <ol className="dm-scroll max-h-[560px] space-y-2.5 overflow-y-auto pr-1">
              {installed.map((m, i) => {
                const p = m.permissions
                  .map((k) => permissionOf(k)?.icon)
                  .filter(Boolean)
                  .slice(0, 6);
                return (
                  <li
                    key={m.slug}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border bg-card p-3 transition-opacity",
                      m.enabled ? "border-border" : "border-border/50 opacity-50"
                    )}
                  >
                    <ModIcon emoji={m.iconEmoji} from={m.iconFrom} to={m.iconTo} size={44} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-bold">{m.name}</span>
                        <span className="shrink-0 font-mono text-[10px] text-muted-foreground">v{m.version}</span>
                        {m.permissions.includes("dangerous") && (
                          <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-red-400" aria-label="dangerous permission" />
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1 text-sm" title={m.permissions.join(", ")}>
                        {p.map((icon, idx) => (
                          <span key={idx} className="text-[11px] opacity-80">{icon}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-center gap-1">
                      <button
                        className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20"
                        disabled={i === 0}
                        onClick={() => reorder(m.slug, -1)}
                        aria-label={`Move ${m.name} up`}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20"
                        disabled={i === installed.length - 1}
                        onClick={() => reorder(m.slug, 1)}
                        aria-label={`Move ${m.name} down`}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>
                    <Switch checked={m.enabled} onCheckedChange={() => toggle(m.slug)} aria-label={`Toggle ${m.name}`} />
                    <button
                      className="rounded p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-400"
                      onClick={() => uninstall(m.slug)}
                      aria-label={`Remove ${m.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ol>
          )}

          {hasDangerous && (
            <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/5 p-3.5">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <p className="text-xs leading-relaxed text-red-200/90">
                Your modpack contains a <b>Dangerous</b> mod — real explosions are
                possible. Back up your save file (the game saves to browser
                storage).
              </p>
            </div>
          )}

          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5" />
            Load order matters: mods run top to bottom, later mods see earlier mods&apos; registrations.
          </p>
        </section>

        {/* ---------------- game + launch ---------------- */}
        <section aria-labelledby="launch-h">
          <h2 id="launch-h" className="mb-3 flex items-center gap-2 text-lg font-bold">
            <FileVideo className="h-5 w-5 text-primary" />
            The game file
          </h2>

          {/* bundled / custom source card */}
          {usingBundled ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
              <div className="flex items-start gap-3">
                <PackageCheck className="mt-0.5 h-8 w-8 shrink-0 text-emerald-400" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    DINGLECRAFT <span className="font-mono text-xs text-muted-foreground">v6.9 · Release 1.0</span>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Bundled with this launcher ({bundledMb} MB)
                    {bundled === null ? " — checking…" : bundled.ok ? " · ✓ ready" : " · ⚠ not found"}
                    {cached && " · cached in memory"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a
                      href={BUNDLED_GAME_URL}
                      download="DINGLECRAFT.html"
                      className="text-xs font-medium text-primary underline underline-offset-2 hover:text-amber-300"
                    >
                      Download the vanilla game ↧
                    </a>
                    <button
                      className="text-xs font-medium text-primary underline underline-offset-2 hover:text-amber-300"
                      onClick={() => inputRef.current?.click()}
                    >
                      Use my own copy instead ↥
                    </button>
                  </div>
                </div>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept=".html,.htm"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) attachFile(f);
                  e.target.value = "";
                }}
              />
            </div>
          ) : (
            <div
              role="button"
              tabIndex={0}
              aria-label="Drop your DINGLECRAFT.html here"
              className={cn(
                "group relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 text-center transition-colors",
                dragOver
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/40"
              )}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  inputRef.current?.click();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files?.[0];
                if (f) attachFile(f);
              }}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".html,.htm"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) attachFile(f);
                  e.target.value = "";
                }}
              />
              <FileVideo className="h-10 w-10 text-primary" />
              <div>
                <p className="font-mono text-sm font-semibold">{gameFileMeta?.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {gameFileMeta ? (gameFileMeta.size / 1024 / 1024).toFixed(1) : "?"} MB
                  {verify && (
                    <>
                      {" · "}
                      <span className={verify.verified ? "text-emerald-400" : "text-amber-400"}>
                        {verify.verified ? "✓ DINGLECRAFT detected" : "⚠ unrecognized"}
                      </span>
                    </>
                  )}
                </p>
                {verify && !verify.verified && (
                  <p className="mt-1 max-w-xs text-xs text-muted-foreground">{verify.reason}</p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  clearCustomFile();
                }}
              >
                <PackageCheck className="mr-1.5 h-3.5 w-3.5" /> Use the bundled game instead
              </Button>
            </div>
          )}

          {/* fetch progress */}
          {progress && (
            <div className="mt-3 rounded-xl border border-primary/40 bg-primary/10 p-4">
              <p className="text-sm font-semibold text-primary">
                Fetching the bundled game… {progress.pct}%
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-background/60">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progress.pct}%` }}
                />
              </div>
              <p className="mt-1.5 font-mono text-xs text-muted-foreground">{progress.mb}</p>
            </div>
          )}

          {/* launch panel */}
          <div className="mt-4 rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Injection preview</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  DingleMod loader v{LOADER_VERSION} +{" "}
                  <b className="text-foreground">{enabled.length}</b> mod
                  {enabled.length === 1 ? "" : "s"} ·{" "}
                  {enabled.map((m) => m.iconEmoji).join(" ") || "—"}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              <Button
                size="lg"
                className="h-auto flex-col gap-1 rounded-xl py-4 text-base font-extrabold"
                disabled={busy || !gameReady || enabled.length === 0}
                onClick={() => launch("game")}
              >
                <Rocket className="h-6 w-6" />
                LAUNCH MODDED GAME
                <span className="text-[10px] font-medium opacity-70">
                  {usingBundled ? "bundled DINGLECRAFT · new tab" : "your game file · new tab"}
                </span>
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="h-auto flex-col gap-1 rounded-xl py-4 text-base font-bold"
                disabled={busy || enabled.length === 0}
                onClick={() => launch("test")}
              >
                <FlaskConical className="h-6 w-6" />
                Launch Test Range
                <span className="text-[10px] font-medium opacity-70">mock game, no download</span>
              </Button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                disabled={busy || !gameReady || enabled.length === 0}
                onClick={() => downloadModded("game")}
              >
                <Download className="mr-1.5 h-3.5 w-3.5" /> Download modded .html
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                disabled={busy || enabled.length === 0}
                onClick={() => downloadModded("test")}
              >
                <Download className="mr-1.5 h-3.5 w-3.5" /> Download Test Range
              </Button>
            </div>

            {manualUrl && (
              <a
                href={manualUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 block rounded-lg border border-primary/40 bg-primary/10 p-3 text-center text-sm font-semibold text-primary"
              >
                ← Pop-up was blocked. Click here to open your modded game manually →
              </a>
            )}

            {outcome && (
              <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                <p className="text-sm font-bold text-emerald-300">
                  🚀 Launched {outcome.mode === "test" ? "the Test Range" : "your game"} with{" "}
                  {outcome.modCount} mod{outcome.modCount === 1 ? "" : "s"} ({outcome.sizeMb} MB)
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  In-game: press <b className="text-foreground">F8</b> or type{" "}
                  <code className="rounded bg-muted px-1 font-mono">/dm</code> for the DingleMod
                  console. Mod items appear at the <b className="text-foreground">end of the inventory
                  palette</b> — grab them with{" "}
                  <code className="rounded bg-muted px-1 font-mono">/poop give</code> or{" "}
                  <code className="rounded bg-muted px-1 font-mono">/clifford egg</code>, then
                  <b className="text-foreground"> right-click (aimed at the ground)</b> to use them.
                </p>
              </div>
            )}
          </div>

          {/* how it works */}
          <div className="mt-4 rounded-2xl border border-border bg-card p-5">
            <p className="mb-3 flex items-center gap-2 text-sm font-bold">
              <MousePointerClick className="h-4 w-4 text-primary" /> How the modloader works
            </p>
            <ol className="space-y-3">
              <Step n={1} title="Get the game (already done)">
                The launcher ships with{" "}
                <code className="rounded bg-muted px-1 font-mono text-xs">DINGLECRAFT.html</code> in{" "}
                <code className="rounded bg-muted px-1 font-mono text-xs">public/game/</code> and
                fetches it locally — or reads your own dropped copy.
              </Step>
              <Step n={2} title="Inject the DingleMod loader">
                A <code className="rounded bg-muted px-1 font-mono text-xs">&lt;script&gt;</code> with the loader
                runtime and your enabled mods is inserted right before{" "}
                <code className="rounded bg-muted px-1 font-mono text-xs">&lt;/body&gt;</code>, after the
                game&apos;s own code.
              </Step>
              <Step n={3} title="Wrap the game's real API">
                The loader detects <code className="rounded bg-muted px-1 font-mono text-xs">window.__vox</code> and
                wraps the game&apos;s global functions (<code className="rounded bg-muted px-1 font-mono text-xs">chatSubmit</code>,{" "}
                <code className="rounded bg-muted px-1 font-mono text-xs">setBlock</code>,{" "}
                <code className="rounded bg-muted px-1 font-mono text-xs">hurtMob</code>,{" "}
                <code className="rounded bg-muted px-1 font-mono text-xs">spawnMob</code>…) into an event bus,
                then runs every mod with a defensive <code className="rounded bg-muted px-1 font-mono text-xs">DingleMod</code> API.
                Registered items are written into the game&apos;s real{" "}
                <code className="rounded bg-muted px-1 font-mono text-xs">DEFS</code> table, so they appear in
                the inventory and creative palette.
              </Step>
              <Step n={4} title="Play the modded game in a new tab">
                The modded HTML becomes a Blob URL and opens in a new tab — a complete,
                self-contained, offline modded DINGLECRAFT.
              </Step>
            </ol>
            <p className="mt-4 flex items-start gap-2 rounded-lg bg-secondary/60 p-3 text-xs leading-relaxed text-muted-foreground">
              <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <span>
                <b className="text-foreground">Test Range</b> is a 300 KB mock of the game (fake{" "}
                <code className="font-mono">__vox</code> + three.js CDN) — perfect for testing whether a mod
                loads and its commands work, without touching your 42 MB file or your saves.
              </span>
            </p>
          </div>

          {/* host on render */}
          <div className="mt-4 rounded-2xl border border-sky-500/25 bg-sky-500/5 p-5">
            <p className="mb-2 flex items-center gap-2 text-sm font-bold">
              <Globe2 className="h-4 w-4 text-sky-400" /> Host this launcher on Render
            </p>
            <ol className="space-y-2 text-xs leading-relaxed text-muted-foreground">
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-400" />
                <span>
                  Push this project (including <code className="rounded bg-muted px-1 font-mono">public/game/DINGLECRAFT.html</code>)
                  to <a className="text-sky-300 underline underline-offset-2" href={REPO_URL} target="_blank" rel="noreferrer">GitHub ↗</a>.
                </span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-400" />
                <span>
                  Render → <b className="text-foreground">New +</b> → <b className="text-foreground">Blueprint</b> → pick the repo —
                  the included <code className="rounded bg-muted px-1 font-mono">render.yaml</code> configures everything.
                </span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-400" />
                <span>
                  Free plan works out of the box (SQLite is ephemeral — uploaded community mods reset on
                  restart; official mods re-seed automatically). Full guide:{" "}
                  <code className="rounded bg-muted px-1 font-mono">DEPLOY-RENDER.md</code> in the repo.
                </span>
              </li>
            </ol>
          </div>
        </section>
      </div>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 font-mono text-xs font-bold text-primary">
        {n}
      </span>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{children}</p>
      </div>
    </li>
  );
}
