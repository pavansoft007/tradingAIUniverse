"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { searchScrip } from "@/lib/api/angelone/scrip.api";
import type { ScripSearchResult } from "@/lib/api/angelone/scrip.api";
import type { AngelExchange } from "@/types/angel-order.types";

const DEBOUNCE_MS  = 400;
const MIN_QUERY    = 2;
const CACHE        = new Map<string, ScripSearchResult[]>();

export interface UseScripSearchReturn {
  results:    ScripSearchResult[];
  isLoading:  boolean;
  error:      string | null;
  query:      string;
  setQuery:   (q: string) => void;
  clear:      () => void;
}

export function useScripSearch(
  exchange: AngelExchange = "NSE",
): UseScripSearchReturn {
  const [query,     setQueryState] = useState("");
  const [results,   setResults]   = useState<ScripSearchResult[]>([]);
  const [isLoading, setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setQuery = useCallback((q: string) => {
    setQueryState(q);
  }, []);

  const clear = useCallback(() => {
    setQueryState("");
    setResults([]);
    setError(null);
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY) {
      setResults([]);
      setError(null);
      return;
    }

    const cacheKey = `${exchange}:${trimmed.toUpperCase()}`;
    if (CACHE.has(cacheKey)) {
      setResults(CACHE.get(cacheKey)!);
      return;
    }

    timerRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await searchScrip({ exchange, searchscrip: trimmed });
        CACHE.set(cacheKey, data);
        setResults(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Search failed");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, exchange]);

  return { results, isLoading, error, query, setQuery, clear };
}
