"use client";

import { useDingle } from "@/lib/store";

export function Footer() {
  const navigate = useDingle((s) => s.navigate);
  return (
    <footer className="mt-auto border-t border-border/70 bg-card/40">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-300 to-yellow-600 text-sm">
                💩
              </div>
              <span className="text-sm font-extrabold tracking-tight">
                DINGLE<span className="text-primary">LOADER</span>
              </span>
            </div>
            <p className="mt-3 max-w-xs text-xs leading-relaxed text-muted-foreground">
              A fan-made community mod platform, modloader and launcher for
              DINGLECRAFT — the one-HTML-file voxel sandbox. All mod injection
              happens locally in your browser.
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Platform</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li><button className="text-muted-foreground hover:text-primary" onClick={() => navigate({ name: "browse" })}>Browse mods</button></li>
              <li><button className="text-muted-foreground hover:text-primary" onClick={() => navigate({ name: "launch" })}>Launcher</button></li>
              <li><button className="text-muted-foreground hover:text-primary" onClick={() => navigate({ name: "upload" })}>Publish a mod</button></li>
              <li><button className="text-muted-foreground hover:text-primary" onClick={() => navigate({ name: "forge" })}>AI Forge prompt generator</button></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sources</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a
                  href="https://github.com/Cylinder7/dinglecraftMODS"
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-primary"
                >
                  DINGLECRAFT on GitHub ↗
                </a>
              </li>
              <li className="text-muted-foreground">DingleMod format v1 · loader v1.0.0</li>
              <li className="text-muted-foreground">Built for game version 6.9+</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-border/60 pt-6 text-[11px] leading-relaxed text-muted-foreground">
          DINGLELOADER is an unofficial fan tool. DINGLECRAFT is an independent
          fan-made game and is NOT AN OFFICIAL MINECRAFT PRODUCT; NOT APPROVED BY
          OR ASSOCIATED WITH MOJANG OR MICROSOFT. Clifford the Big Red Dog
          belongs to his owners; the demon belongs to no one. The Eternal Snail
          was never here.
        </div>
      </div>
    </footer>
  );
}
