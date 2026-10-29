"use client";

import { useDingle } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Home, Rocket, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

const LINKS = [
  { view: "browse", label: "Mods", icon: Home },
  { view: "launch", label: "Launcher", icon: Rocket },
  { view: "upload", label: "Upload", icon: Upload },
  { view: "forge", label: "AI Forge", icon: Sparkles },
] as const;

export function Nav() {
  const view = useDingle((s) => s.view);
  const installed = useDingle((s) => s.installed);
  const navigate = useDingle((s) => s.navigate);
  const active = view.name === "mod" ? "browse" : view.name;

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <button
          className="flex items-center gap-2.5"
          onClick={() => navigate({ name: "browse" })}
          aria-label="DingleLoader home"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 to-yellow-600 text-lg shadow-lg shadow-amber-900/30">
            💩
          </div>
          <div className="hidden sm:block text-left leading-tight">
            <div className="text-[15px] font-extrabold tracking-tight">
              DINGLE<span className="text-primary">LOADER</span>
            </div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              mods for DingleCraft
            </div>
          </div>
        </button>

        <nav className="ml-auto flex items-center gap-1 sm:gap-2" aria-label="Primary">
          {LINKS.map((l) => {
            const isActive = active === l.view;
            const Icon = l.icon;
            const badge =
              l.view === "launch" ? installed.filter((m) => m.enabled).length : 0;
            return (
              <button
                key={l.view}
                onClick={() => navigate({ name: l.view } as never)}
                className={cn(
                  "relative flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden md:inline">{l.label}</span>
                {badge > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
          <Button
            size="sm"
            className="ml-1 hidden rounded-full font-bold sm:inline-flex"
            onClick={() => navigate({ name: "launch" })}
          >
            <Rocket className="mr-1 h-4 w-4" />
            Launch
          </Button>
        </nav>
      </div>
    </header>
  );
}
