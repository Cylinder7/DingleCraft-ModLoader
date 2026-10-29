"use client";

import { useEffect, useState, useCallback } from "react";
import type { ModDTO } from "@/lib/modspec";

export interface ModsResponse {
  mods: ModDTO[];
  stats: { mods: number; downloads: number; authors: number };
}

export function useMods(q: string, category: string, sort: string) {
  const [data, setData] = useState<ModsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const t = setTimeout(() => {
      if (!alive) return;
      setLoading(true);
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (category) params.set("category", category);
      if (sort) params.set("sort", sort);
      fetch(`/api/mods?${params.toString()}`)
        .then((r) => r.json())
        .then((j) => {
          if (!alive) return;
          if (j.error) setError(j.error);
          else setData(j);
          setLoading(false);
        })
        .catch((e) => {
          if (!alive) return;
          setError(String(e));
          setLoading(false);
        });
    }, 220);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [q, category, sort]);

  return { data, loading, error };
}

export function useMod(slug: string | null) {
  const [mod, setMod] = useState<ModDTO | null>(null);
  const [loading, setLoading] = useState(!!slug);
  const [error, setError] = useState<string | null>(null);

  const fetchMod = useCallback(() => {
    if (!slug) return;
    fetch(`/api/mods/${slug}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.error) setError(j.error);
        else setMod(j.mod);
        setLoading(false);
      })
      .catch((e) => {
        setError(String(e));
        setLoading(false);
      });
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    let alive = true;
    const t = setTimeout(() => {
      if (!alive) return;
      setLoading(true);
      fetchMod();
    }, 0);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [slug, fetchMod]);

  return { mod, loading, error, reload: fetchMod };
}
