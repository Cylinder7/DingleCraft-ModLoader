"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type View =
  | { name: "browse" }
  | { name: "mod"; slug: string }
  | { name: "launch" }
  | { name: "upload" }
  | { name: "forge" };

export interface InstalledMod {
  slug: string;
  name: string;
  version: string;
  author: string;
  iconEmoji: string;
  iconFrom: string;
  iconTo: string;
  permissions: string[];
  category: string;
  enabled: boolean;
}

interface DingleState {
  view: View;
  installed: InstalledMod[];
  gameFile: { name: string; size: number; verified: boolean } | null;
  navigate: (v: View) => void;
  install: (m: Omit<InstalledMod, "enabled">) => boolean;
  uninstall: (slug: string) => void;
  toggle: (slug: string) => void;
  reorder: (slug: string, dir: -1 | 1) => void;
  setGameFile: (f: DingleState["gameFile"]) => void;
  clearInstalled: () => void;
}

export const useDingle = create<DingleState>()(
  persist(
    (set, get) => ({
      view: { name: "browse" },
      installed: [],
      gameFile: null,
      navigate: (v) => set({ view: v }),
      install: (m) => {
        const exists = get().installed.some((x) => x.slug === m.slug);
        if (exists) return false;
        set((s) => ({ installed: [...s.installed, { ...m, enabled: true }] }));
        return true;
      },
      uninstall: (slug) =>
        set((s) => ({ installed: s.installed.filter((x) => x.slug !== slug) })),
      toggle: (slug) =>
        set((s) => ({
          installed: s.installed.map((x) =>
            x.slug === slug ? { ...x, enabled: !x.enabled } : x
          ),
        })),
      reorder: (slug, dir) =>
        set((s) => {
          const idx = s.installed.findIndex((x) => x.slug === slug);
          const target = idx + dir;
          if (idx < 0 || target < 0 || target >= s.installed.length) return s;
          const next = [...s.installed];
          const [item] = next.splice(idx, 1);
          next.splice(target, 0, item);
          return { installed: next };
        }),
      setGameFile: (f) => set({ gameFile: f }),
      clearInstalled: () => set({ installed: [] }),
    }),
    {
      name: "dingleloader-state",
      partialize: (s) => ({ installed: s.installed, gameFile: s.gameFile }),
    }
  )
);
