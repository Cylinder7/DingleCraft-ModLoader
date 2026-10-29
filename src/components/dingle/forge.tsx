"use client";

import { useMemo, useState } from "react";
import { buildForgePrompt } from "@/lib/forge";
import { CATEGORIES, FORGE_TARGETS } from "@/lib/modspec";
import { useDingle } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Sparkles, Copy, Download, Wand2, ExternalLink, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

const FEATURES = [
  "new chat commands",
  "custom items",
  "custom mobs / companions (three.js meshes)",
  "projectiles with physics",
  "particle effects",
  "world block manipulation",
  "combat / damage effects",
  "timed or repeating behaviors (tick events)",
  "ridiculous humor and flavor text",
];

const IDEA_PRESETS = [
  {
    label: "Throwable Pizza",
    emoji: "🍕",
    idea: "A pizza you can throw like a frisbee. It deals damage, leaves grease stains (particles), and mobs that get hit become 'greased' (they slide away fast). /pizza command, /pizza feast spawns 12.",
  },
  {
    label: "Pet Wandering Salesman",
    emoji: "🧳",
    idea: "A suspicious traveling salesman companion that follows you and periodically offers one ridiculous item for dirt via chat, like a single cookie for 32 dirt. Haggling lowers the price by insulting him.",
  },
  {
    label: "Gravity Switcher",
    emoji: "🌀",
    idea: "/gravity flip flips the player's world upside down visually for 10 seconds (camera and controls go wild). All mobs nearby get launched into the air slightly.",
  },
];

export function ForgeView() {
  const navigate = useDingle((s) => s.navigate);
  const [name, setName] = useState("");
  const [idea, setIdea] = useState("");
  const [category, setCategory] = useState("fun");
  const [features, setFeatures] = useState<string[]>(["new chat commands", "ridiculous humor and flavor text"]);
  const [target, setTarget] = useState("universal");
  const [includeExample, setIncludeExample] = useState(true);
  const [tone, setTone] = useState<"silly" | "serious">("silly");
  const [prompt, setPrompt] = useState<string | null>(null);

  const canGenerate = idea.trim().length >= 10;

  const promptPreview = useMemo(
    () =>
      buildForgePrompt({
        name: name.trim(),
        idea: idea.trim(),
        category,
        features,
        target,
        includeExample,
        tone,
      }),
    [name, idea, category, features, target, includeExample, tone]
  );

  function generate() {
    if (!canGenerate) {
      toast({ title: "Describe your mod first", description: "At least 10 characters of idea, please." });
      return;
    }
    setPrompt(promptPreview);
    toast({
      title: "Prompt generated",
      description: `${promptPreview.length.toLocaleString()} characters of pure modding knowledge.`,
    });
  }

  async function copyPrompt() {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt);
      toast({ title: "Copied to clipboard", description: "Paste it into ChatGPT, Claude, Gemini, Poe — anything." });
    } catch {
      toast({ title: "Copy failed", description: "Select the text manually and copy it." });
    }
  }

  function downloadPrompt() {
    if (!prompt) return;
    const blob = new Blob([prompt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dinglemod-prompt.txt";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    toast({ title: "Downloaded", description: "dinglemod-prompt.txt" });
  }

  function openPromptTab() {
    if (!prompt) return;
    const blob = new Blob([prompt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
        <Wand2 className="h-3.5 w-3.5" /> Prompt engineering for fun and profit
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">AI Forge</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Describe the mod you want. The Forge builds a complete, self-contained
        prompt that teaches <b className="text-foreground">any external AI</b> — ChatGPT,
        Claude, Gemini, whatever — exactly how DingleCraft works, the full{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px]">.dinglemod.json</code>{" "}
        format, the entire DingleMod API, and the hard rules. It returns a ready-to-upload mod.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[5fr_7fr]">
        {/* ---------------- form ---------------- */}
        <section className="space-y-5 rounded-2xl border border-border bg-card p-5">
          <div className="space-y-1.5">
            <Label htmlFor="forge-name">Mod name <span className="text-muted-foreground">(optional — AI can invent one)</span></Label>
            <Input id="forge-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Exploding Carrots" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="forge-idea">Your mod idea *</Label>
            <Textarea
              id="forge-idea"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              rows={5}
              placeholder="Carrots that can be thrown, explode into smaller carrots, and passively insult the stock market..."
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {IDEA_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => {
                    setName(p.label);
                    setIdea(p.idea);
                  }}
                  className="rounded-full border border-border bg-secondary/60 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  {p.emoji} {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger aria-label="Category"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.key} value={c.key}>{c.emoji} {c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tone</Label>
              <RadioGroup value={tone} onValueChange={(v) => setTone(v as "silly" | "serious")} className="flex h-10 items-center gap-4">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <RadioGroupItem value="silly" /> Silly (recommended)
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <RadioGroupItem value="serious" /> Serious
                </label>
              </RadioGroup>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Must include</Label>
            <div className="grid gap-1.5">
              {FEATURES.map((f) => {
                const on = features.includes(f);
                return (
                  <button
                    key={f}
                    onClick={() => setFeatures((prev) => (on ? prev.filter((x) => x !== f) : [...prev, f]))}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                      on ? "border-primary/40 bg-primary/5 text-foreground" : "border-border text-muted-foreground hover:border-primary/25"
                    )}
                    aria-pressed={on}
                  >
                    <span className={cn("flex h-4 w-4 items-center justify-center rounded border text-[10px]", on ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40")}>
                      {on ? "✓" : ""}
                    </span>
                    {f}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Target AI</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {FORGE_TARGETS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTarget(t.key)}
                  className={cn(
                    "rounded-lg border p-2.5 text-left transition-colors",
                    target === t.key ? "border-primary/50 bg-primary/10" : "border-border hover:border-primary/25"
                  )}
                  aria-pressed={target === t.key}
                >
                  <div className="text-sm font-semibold">{t.label}</div>
                  <div className="text-[11px] text-muted-foreground">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border px-3.5 py-3">
            <div>
              <div className="text-sm font-semibold">Include worked example</div>
              <div className="text-xs text-muted-foreground">Embeds the complete Throwable Poop mod in the prompt</div>
            </div>
            <Switch checked={includeExample} onCheckedChange={setIncludeExample} aria-label="Include worked example" />
          </div>

          <Button className="w-full rounded-xl py-6 text-base font-extrabold" onClick={generate} disabled={!canGenerate}>
            <Sparkles className="mr-2 h-5 w-5" />
            Generate the prompt
          </Button>
        </section>

        {/* ---------------- output ---------------- */}
        <section className="flex flex-col gap-4">
          {prompt ? (
            <>
              <div className="flex flex-wrap gap-2">
                <Button className="rounded-xl font-bold" onClick={copyPrompt}>
                  <Copy className="mr-1.5 h-4 w-4" /> Copy prompt
                </Button>
                <Button variant="outline" className="rounded-xl" onClick={downloadPrompt}>
                  <Download className="mr-1.5 h-4 w-4" /> .txt
                </Button>
                <Button variant="outline" className="rounded-xl" onClick={openPromptTab}>
                  <ExternalLink className="mr-1.5 h-4 w-4" /> Open in tab
                </Button>
              </div>
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border">
                <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2.5">
                  <span className="font-mono text-xs text-muted-foreground">
                    dinglemod-prompt.txt — {prompt.length.toLocaleString()} chars
                  </span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                    paste into any AI
                  </span>
                </div>
                <textarea
                  readOnly
                  value={prompt}
                  className="dm-scroll flex-1 resize-none bg-[#141412] p-4 font-mono text-[12px] leading-relaxed text-foreground/90 focus:outline-none"
                  style={{ minHeight: 460 }}
                  aria-label="Generated AI prompt"
                />
              </div>
              <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4">
                <p className="flex items-center gap-2 text-sm font-bold text-primary">
                  <Lightbulb className="h-4 w-4" /> Then what?
                </p>
                <ol className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                  <li>1. Paste the prompt into ChatGPT / Claude / Gemini / Poe.</li>
                  <li>2. It replies with a single <code className="rounded bg-muted px-1 font-mono text-xs">.dinglemod.json</code> code block.</li>
                  <li>3. Save it as a file (or copy it) and head to <b className="text-foreground">Upload</b>.</li>
                  <li>4. The platform validates it, publishes it, and you can launch it immediately.</li>
                </ol>
                <Button variant="secondary" className="mt-3 rounded-xl font-semibold" onClick={() => navigate({ name: "upload" })}>
                  Go to Upload →
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border p-12 text-center">
              <span className="text-6xl dm-float">🧙</span>
              <div>
                <p className="text-lg font-bold">The Forge is cold</p>
                <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
                  Describe a mod on the left and hit <b className="text-foreground">Generate</b>. You&apos;ll
                  get a battle-tested prompt containing the complete mod spec, the
                  full API reference, the game&apos;s internals, and the hard rules —
                  everything an external AI needs to write a working mod in one shot.
                </p>
              </div>
              <div className="grid w-full max-w-md gap-2 text-left text-xs text-muted-foreground">
                <div className="rounded-lg bg-secondary/60 p-3">📦 <b className="text-foreground">The format</b> — every manifest field, with rules</div>
                <div className="rounded-lg bg-secondary/60 p-3">🔌 <b className="text-foreground">The API</b> — all 40+ DingleMod methods + 10 events</div>
                <div className="rounded-lg bg-secondary/60 p-3">🎮 <b className="text-foreground">The game</b> — how one HTML file exposes window.__vox</div>
                <div className="rounded-lg bg-secondary/60 p-3">📋 <b className="text-foreground">The contract</b> — the AI must return exactly one JSON mod</div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
