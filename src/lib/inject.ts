"use client";

import { RUNTIME_JS, LOADER_VERSION } from "./loader-runtime";

export interface LaunchMod {
  id: string;
  name: string;
  version: string;
  author: string;
  permissions: string[];
  code: string;
}

// The <script> payload injected into the game HTML.
export function buildInjectionScript(mods: LaunchMod[]): string {
  const payload = JSON.stringify(mods).replace(/<\/script/gi, "<\\/script");
  return (
    "<script>\n/* DingleMod Loader " +
    LOADER_VERSION +
    " */\nwindow.__DINGLE_MODS__=" +
    payload +
    ";\n" +
    RUNTIME_JS +
    "\n</script>\n"
  );
}

export interface InjectResult {
  blob: Blob;
  size: number;
  modCount: number;
}

export async function buildModdedHtml(
  html: string,
  mods: LaunchMod[]
): Promise<InjectResult> {
  const script = buildInjectionScript(mods);
  const lower = html.toLowerCase();
  const idx = lower.lastIndexOf("</body>");
  const out =
    idx >= 0
      ? html.slice(0, idx) + script + html.slice(idx)
      : html + "\n" + script;
  const blob = new Blob([out], { type: "text/html" });
  return { blob, size: blob.size, modCount: mods.length };
}

// Quick sanity check that a dropped file looks like DINGLECRAFT.
export function verifyGameHtml(html: string, size: number) {
  const lower = html.slice(0, 400_000).toLowerCase();
  const hasVox = lower.includes("__vox");
  const hasName = lower.includes("dinglecraft");
  const big = size > 1_000_000;
  return {
    verified: hasVox || hasName,
    big,
    reason: hasVox
      ? "window.__vox API detected — this is the real thing."
      : hasName
        ? "DINGLECRAFT marker found."
        : big
          ? "Large HTML file, but the __vox API was not found near the top. It may still work."
          : "This file looks too small to be DINGLECRAFT (~42 MB).",
  };
}

export function openBlob(blob: Blob): Window | null {
  const url = URL.createObjectURL(blob);
  const w = window.open(url, "_blank");
  if (!w) {
    // popup blocked — leave the URL revocation to the caller
    return null;
  }
  // revoke after a generous delay; the tab has loaded by then
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return w;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

// ---------------------------------------------------------------------------
// The bundled game: DINGLECRAFT.html ships with the launcher in
// public/game/, so it loads by default — no file drop needed. A custom file
// dropped by the user still overrides it.
// ---------------------------------------------------------------------------
export const BUNDLED_GAME_URL = "/game/DINGLECRAFT.html";

let cachedGameHtml: string | null = null;

export function isGameCached(): boolean {
  return cachedGameHtml !== null;
}

export function clearGameCache() {
  cachedGameHtml = null;
}

/** HEAD the bundled game — cheap presence + size check. */
export async function headBundledGame(): Promise<{ ok: boolean; size: number }> {
  try {
    const res = await fetch(BUNDLED_GAME_URL, { method: "HEAD" });
    return { ok: res.ok, size: Number(res.headers.get("content-length") || 0) };
  } catch {
    return { ok: false, size: 0 };
  }
}

/**
 * Fetch the ~42 MB bundled game as text with progress reporting. The result is
 * cached in memory for the session, so repeat launches are instant.
 */
export async function fetchBundledGame(
  onProgress?: (loaded: number, total: number) => void
): Promise<string> {
  if (cachedGameHtml) return cachedGameHtml;
  const res = await fetch(BUNDLED_GAME_URL);
  if (!res.ok) throw new Error(`Could not fetch the bundled game (${res.status})`);
  const total = Number(res.headers.get("content-length") || 0);
  if (!res.body || !total) {
    const text = await res.text();
    cachedGameHtml = text;
    return text;
  }
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      loaded += value.length;
      onProgress?.(loaded, total);
    }
  }
  const blob = new Blob(chunks as unknown as BlobPart[], { type: "text/html" });
  const text = await blob.text();
  cachedGameHtml = text;
  return text;
}
