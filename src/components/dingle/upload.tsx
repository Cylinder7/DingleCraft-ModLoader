"use client";

import { useMemo, useRef, useState } from "react";
import { manifestSchema, CATEGORIES, PERMISSIONS, MOD_FORMAT, type DingleManifest, type CategoryKey } from "@/lib/modspec";
import { useDingle } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "@/hooks/use-toast";
import {
  UploadCloud, FileJson, CheckCircle2, XCircle, Rocket, BookOpen, FileCode2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Validation {
  ok: boolean;
  errors: { path: string; message: string }[];
  manifest: DingleManifest | null;
}

function validateManifest(obj: unknown): Validation {
  const parsed = manifestSchema.safeParse(obj);
  if (parsed.success) return { ok: true, errors: [], manifest: parsed.data };
  return {
    ok: false,
    errors: parsed.error.issues.map((i) => ({
      path: i.path.join(".") || "(root)",
      message: i.message,
    })),
    manifest: null,
  };
}

export function UploadView() {
  const navigate = useDingle((s) => s.navigate);

  // ------- file mode -------
  const [parsed, setParsed] = useState<DingleManifest | null>(null);
  const [validation, setValidation] = useState<Validation | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(f: File) {
    try {
      const text = await f.text();
      const json = JSON.parse(text);
      const v = validateManifest(json);
      setValidation(v);
      setParsed(v.manifest);
      if (v.ok) toast({ title: "Mod file looks good", description: `${v.manifest?.name} v${v.manifest?.version}` });
      else toast({ title: "Validation failed", description: `${v.errors.length} issue(s) found.` });
    } catch (e) {
      setParsed(null);
      setValidation({ ok: false, errors: [{ path: "(file)", message: `Not valid JSON: ${String(e)}` }], manifest: null });
    }
  }

  async function publish(manifest: DingleManifest) {
    setPublishing(true);
    try {
      const res = await fetch("/api/mods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(manifest),
      });
      const j = await res.json();
      if (!res.ok) {
        toast({
          title: "Publish failed",
          description: j.error === "Manifest failed validation"
            ? (j.issues ?? []).map((i: { path: string; message: string }) => `${i.path}: ${i.message}`).join(" · ")
            : (j.error ?? "Unknown error"),
        });
        return;
      }
      toast({
        title: "Published! 🎉",
        description: `${j.mod.name} is now live in the catalog.`,
      });
      if (j.warnings?.length) {
        toast({ title: "Code review notes", description: j.warnings.join(" · ") });
      }
      setParsed(null);
      setValidation(null);
      resetForm();
      navigate({ name: "mod", slug: j.mod.slug });
    } catch (e) {
      toast({ title: "Publish failed", description: String(e) });
    } finally {
      setPublishing(false);
    }
  }

  // ------- form mode -------
  const [fName, setFName] = useState("");
  const [fVersion, setFVersion] = useState("1.0.0");
  const [fAuthor, setFAuthor] = useState("");
  const [fTagline, setFTagline] = useState("");
  const [fDesc, setFDesc] = useState("");
  const [fCategory, setFCategory] = useState<CategoryKey>("fun");
  const [fTags, setFTags] = useState("");
  const [fEmoji, setFEmoji] = useState("🧩");
  const [fPerms, setFPerms] = useState<string[]>(["chat", "ui"]);
  const [fCode, setFCode] = useState(
    "// My first DingleMod!\nDingleMod.command('hello', function (args) {\n  DingleMod.toast('Hello from ' + DingleMod.meta.name + '!');\n});\n"
  );

  const EMOJIS = ["🧩", "💩", "🐕", "🐉", "🐌", "👻", "☢️", "🎰", "🪙", "🌧️", "😈", "🗡️", "🍗", "⚡", "🎯", "🐸"];

  function resetForm() {
    setFName(""); setFVersion("1.0.0"); setFAuthor(""); setFTagline(""); setFDesc("");
    setFCategory("fun"); setFTags(""); setFEmoji("🧩"); setFPerms(["chat", "ui"]);
    setFCode("// My first DingleMod!\nDingleMod.command('hello', function (args) {\n  DingleMod.toast('Hello!');\n});\n");
  }

  const formManifest = useMemo<DingleManifest>(() => ({
    format: MOD_FORMAT,
    id: (fName || "my-mod").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "my-mod",
    name: fName || "My Mod",
    version: fVersion,
    author: fAuthor || "Anonymous",
    tagline: fTagline,
    description: fDesc,
    category: fCategory,
    tags: fTags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 8),
    iconEmoji: fEmoji,
    permissions: fPerms,
    gameVersion: "6.9",
    code: fCode,
  }), [fName, fVersion, fAuthor, fTagline, fDesc, fCategory, fTags, fEmoji, fPerms, fCode]);

  const formValidation = useMemo(() => validateManifest(formManifest), [formManifest]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Publish a mod</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Upload a <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px]">.dinglemod.json</code>{" "}
        you made by hand — or one an external AI wrote for you in the{" "}
        <button className="font-semibold text-primary underline underline-offset-2" onClick={() => navigate({ name: "forge" })}>
          AI Forge
        </button>
        . Or fill out the form and paste your mod code.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[7fr_5fr]">
        <div>
          <Tabs defaultValue="file">
            <TabsList className="rounded-xl bg-secondary/60">
              <TabsTrigger value="file" className="rounded-lg gap-1.5">
                <FileJson className="h-4 w-4" /> Upload file
              </TabsTrigger>
              <TabsTrigger value="form" className="rounded-lg gap-1.5">
                <FileCode2 className="h-4 w-4" /> Fill form
              </TabsTrigger>
            </TabsList>

            {/* ============ FILE TAB ============ */}
            <TabsContent value="file" className="mt-4">
              <div
                role="button"
                tabIndex={0}
                aria-label="Drop your .dinglemod.json here"
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center transition-colors",
                  dragOver ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40"
                )}
                onClick={() => inputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    inputRef.current?.click();
                  }
                }}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) handleFile(f);
                }}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                    e.target.value = "";
                  }}
                />
                <UploadCloud className={cn("h-10 w-10", dragOver ? "text-primary" : "text-muted-foreground")} />
                <div>
                  <p className="font-semibold">Drop your .dinglemod.json here</p>
                  <p className="mt-1 text-sm text-muted-foreground">one JSON file — manifest + embedded code</p>
                </div>
              </div>

              {validation && !validation.ok && (
                <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/5 p-4">
                  <p className="flex items-center gap-2 text-sm font-bold text-red-300">
                    <XCircle className="h-4 w-4" /> Validation failed — {validation.errors.length} issue(s)
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {validation.errors.map((e, i) => (
                      <li key={i} className="font-mono text-xs text-red-200/80">
                        <span className="text-red-300">{e.path}</span> — {e.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {parsed && (
                <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
                  <p className="flex items-center gap-2 text-sm font-bold text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" /> Valid mod — ready to publish
                  </p>
                  <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    <Row k="Name" v={`${parsed.name} v${parsed.version}`} />
                    <Row k="Author" v={parsed.author} />
                    <Row k="Category" v={parsed.category} />
                    <Row k="Permissions" v={parsed.permissions.join(", ")} />
                    <Row k="Code size" v={`${parsed.code.split("\n").length} lines`} />
                    <Row k="Icon" v={parsed.iconEmoji} />
                  </dl>
                  <Button
                    className="mt-4 w-full rounded-xl font-bold"
                    disabled={publishing}
                    onClick={() => publish(parsed)}
                  >
                    <Rocket className="mr-1.5 h-4 w-4" />
                    {publishing ? "Publishing…" : "Publish to the catalog"}
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* ============ FORM TAB ============ */}
            <TabsContent value="form" className="mt-4">
              <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="f-name">Mod name *</Label>
                    <Input id="f-name" value={fName} onChange={(e) => setFName(e.target.value)} placeholder="Exploding Carrots" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="f-version">Version *</Label>
                    <Input id="f-version" value={fVersion} onChange={(e) => setFVersion(e.target.value)} placeholder="1.0.0" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="f-author">Author *</Label>
                    <Input id="f-author" value={fAuthor} onChange={(e) => setFAuthor(e.target.value)} placeholder="YourName" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Category *</Label>
                    <Select value={fCategory} onValueChange={(v) => setFCategory(v as CategoryKey)}>
                      <SelectTrigger aria-label="Category"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c.key} value={c.key}>{c.emoji} {c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="f-tagline">Tagline * <span className="text-muted-foreground">(8–140 chars, shown on the card)</span></Label>
                  <Input id="f-tagline" value={fTagline} onChange={(e) => setFTagline(e.target.value)} placeholder="Carrots that fight back. Finally." />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="f-desc">Description * <span className="text-muted-foreground">(markdown, 20+ chars — include a Commands section)</span></Label>
                  <Textarea id="f-desc" value={fDesc} onChange={(e) => setFDesc(e.target.value)} rows={6}
                    placeholder={"## What it does\n\nExplains itself, violently.\n\n### Commands\n- `/carrot` — arm the carrot"} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="f-tags">Tags <span className="text-muted-foreground">(comma separated)</span></Label>
                    <Input id="f-tags" value={fTags} onChange={(e) => setFTags(e.target.value)} placeholder="carrots, chaos, vegetables" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Icon</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {EMOJIS.map((e) => (
                        <button
                          key={e}
                          onClick={() => setFEmoji(e)}
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-lg border text-lg transition-colors",
                            fEmoji === e ? "border-primary bg-primary/15" : "border-border bg-secondary/50 hover:border-primary/40"
                          )}
                          aria-label={`Icon ${e}`}
                          aria-pressed={fEmoji === e}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Permissions * <span className="text-muted-foreground">(declare what the code actually uses)</span></Label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {PERMISSIONS.map((p) => (
                      <label
                        key={p.key}
                        className={cn(
                          "flex cursor-pointer items-center gap-2.5 rounded-lg border p-2.5 text-sm transition-colors",
                          fPerms.includes(p.key) ? "border-primary/40 bg-primary/5" : "border-border hover:border-primary/25"
                        )}
                      >
                        <Checkbox
                          checked={fPerms.includes(p.key)}
                          onCheckedChange={(c) =>
                            setFPerms((prev) => (c ? [...prev, p.key] : prev.filter((x) => x !== p.key)))
                          }
                          aria-label={p.label}
                        />
                        <span>{p.icon}</span>
                        <span className="font-medium">{p.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="f-code">Mod code * <span className="text-muted-foreground">(JavaScript — runs as new Function(&quot;DingleMod&quot;, code))</span></Label>
                  <Textarea
                    id="f-code"
                    value={fCode}
                    onChange={(e) => setFCode(e.target.value)}
                    rows={10}
                    className="font-mono text-[13px]"
                    spellCheck={false}
                  />
                  <p className="text-xs text-muted-foreground">
                    No template literals (backticks), no imports, no fetch. Everything is the{" "}
                    <code className="rounded bg-muted px-1 font-mono">DingleMod</code> API — see the reference →
                  </p>
                </div>

                {formValidation.ok ? (
                  <Button className="w-full rounded-xl font-bold" disabled={publishing} onClick={() => publish(formManifest)}>
                    <Rocket className="mr-1.5 h-4 w-4" />
                    {publishing ? "Publishing…" : "Publish to the catalog"}
                  </Button>
                ) : (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5">
                    <p className="text-sm font-semibold text-amber-300">Fix these before publishing:</p>
                    <ul className="mt-1.5 space-y-1">
                      {formValidation.errors.slice(0, 5).map((e, i) => (
                        <li key={i} className="font-mono text-xs text-amber-200/80">
                          <span className="text-amber-300">{e.path}</span> — {e.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* ============ SIDEBAR: FORMAT REFERENCE ============ */}
        <aside>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="flex items-center gap-2 text-sm font-bold">
              <BookOpen className="h-4 w-4 text-primary" /> The .dinglemod.json format
            </p>
            <Accordion type="multiple" defaultValue={["fields"]} className="mt-3">
              <AccordionItem value="fields">
                <AccordionTrigger className="text-sm">Required fields</AccordionTrigger>
                <AccordionContent className="text-xs leading-relaxed text-muted-foreground">
                  <ul className="space-y-1.5">
                    <li><code className="text-foreground">format</code>: <code>"dinglemod-1"</code></li>
                    <li><code className="text-foreground">id</code>: kebab-case, 2–64 chars</li>
                    <li><code className="text-foreground">name</code>, <code className="text-foreground">author</code>, <code className="text-foreground">version</code> (semver)</li>
                    <li><code className="text-foreground">tagline</code>: 8–140 chars</li>
                    <li><code className="text-foreground">description</code>: markdown, 20–4000 chars</li>
                    <li><code className="text-foreground">category</code>: {CATEGORIES.map((c) => c.key).join(" | ")}</li>
                    <li><code className="text-foreground">permissions</code>: ≥ 1 of {PERMISSIONS.map((p) => p.key).join(", ")}</li>
                    <li><code className="text-foreground">code</code>: the whole mod as one string</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="code-rules">
                <AccordionTrigger className="text-sm">Code rules</AccordionTrigger>
                <AccordionContent className="text-xs leading-relaxed text-muted-foreground">
                  <ul className="list-disc space-y-1.5 pl-4">
                    <li>Plain JS, strict mode — declare every variable</li>
                    <li>No imports, no fetch, no template literals</li>
                    <li>Wrap risky calls in try/catch; null-check <code className="text-foreground">DingleMod.player()</code> and <code className="text-foreground">DingleMod.scene()</code></li>
                    <li>three.js r128 via <code className="text-foreground">var T = DingleMod.THREE();</code></li>
                    <li>Expose features as chat commands</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="api">
                <AccordionTrigger className="text-sm">API cheat sheet</AccordionTrigger>
                <AccordionContent>
                  <pre className="dm-scroll max-h-72 overflow-auto rounded-lg bg-secondary/70 p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
{`DingleMod.command('verb', fn)      // /verb args
DingleMod.on('tick'|'second'|'chat'|
  'command'|'blockPlace'|'blockBreak'|
  'mobHurt'|'playerHurt'|'explosion'|
  'gameStart', fn)
DingleMod.chat/toast/title/log(text)
DingleMod.player() .position() .look()
DingleMod.teleport(x,y,z)
DingleMod.give(id,n) .hurtMob(m,n)
DingleMod.setBlock(x,y,z,id)
DingleMod.getBlock(x,y,z)
DingleMod.explode(x,y,z,power)
DingleMod.mobs(pred) .entities()
DingleMod.THREE() .scene()
DingleMod.particles({x,y,z,color,
  count,spread,speed,ttl})
DingleMod.projectile({mesh,x,y,z,vx,
  vy,vz,gravity,size,ttl,onHit})
DingleMod.companion({mesh,name,
  distance,speed,onTick})
DingleMod.time.get()/set(t)
DingleMod.vox   // raw game API
`}
                  </pre>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="mt-4 rounded-lg bg-secondary/60 p-3 text-xs leading-relaxed text-muted-foreground">
              💡 The fastest path: describe your idea in the{" "}
              <button className="font-semibold text-primary underline underline-offset-2" onClick={() => navigate({ name: "forge" })}>
                AI Forge
              </button>
              , paste the generated prompt into any capable AI, and upload the JSON it returns here.
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-secondary/50 px-3 py-2">
      <span className="text-xs text-muted-foreground">{k}</span>
      <span className="truncate text-xs font-semibold">{v}</span>
    </div>
  );
}
