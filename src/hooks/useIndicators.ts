/**
 * useIndicators — React hooks for the technical indicator engine.
 *
 * Three layers:
 *   useIndicators(candles, config)      — pure memoized batch computation
 *   useAngelOneCandles(options)         — fetches historical candles from Angel One
 *   useSymbolIndicators(options)        — full pipeline: fetch + compute + real-time ticks
 */

"use client";

import { useMemo, useEffect, useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCandleData, candleDateRange, type CandleBar, type CandleInterval } from "@/lib/api/angelone/market.api";
import { IndicatorEngine, INTERVAL_MS } from "@/lib/indicators";
import { calcSMA, calcEMA, calcRSI, calcVWAP, calcMACD, calcBollinger } from "@/lib/indicators";
import type { OHLCV } from "@/types/market.types";
import type { ExchangeType, Tick } from "@/types/smartws.types";
import type {
  IndicatorsConfig,
  IndicatorResults,
  SMAConfig,
  EMAConfig,
  RSIConfig,
  VWAPConfig,
  MACDConfig,
  BollingerConfig,
} from "@/types/indicators.types";
import { useMarketDataStore, selectTick } from "@/store/useMarketDataStore";
import { WS_MODE } from "@/types/smartws.types";

// ── 1. Pure memoized computation ───────────────────────────────────────────────

/**
 * Computes all enabled indicators over a static candle array.
 * Memoized — only recomputes when `candles` or `config` reference changes.
 *
 * @example
 * const { data: candles } = useOHLCV("RELIANCE", "5m");
 * const indicators = useIndicators(candles?.data, { rsi: { period: 14 }, macd: false });
 */
export function useIndicators(
  candles: OHLCV[] | CandleBar[] | undefined,
  config:  IndicatorsConfig = {},
): IndicatorResults {
  return useMemo(() => {
    if (!candles?.length) return {};
    const c = candles as OHLCV[];
    const result: IndicatorResults = {};

    if (config.sma !== false)
      result.sma = calcSMA(c, (config.sma as SMAConfig)?.period);
    if (config.ema !== false)
      result.ema = calcEMA(c, (config.ema as EMAConfig)?.period);
    if (config.rsi !== false)
      result.rsi = calcRSI(c, (config.rsi as RSIConfig)?.period);
    if (config.vwap !== false)
      result.vwap = calcVWAP(c, (config.vwap as VWAPConfig)?.resetDaily);
    if (config.macd !== false) {
      const m = config.macd as MACDConfig | undefined;
      result.macd = calcMACD(c, m?.fast, m?.slow, m?.signal);
    }
    if (config.bollinger !== false) {
      const b = config.bollinger as BollingerConfig | undefined;
      result.bollinger = calcBollinger(c, b?.period, b?.multiplier);
    }
    return result;
  }, [candles, config]);
}

// ── 2. Angel One candle fetcher ────────────────────────────────────────────────

export interface UseAngelOneCandlesOptions {
  exchange:    string;      // "NSE" | "BSE"
  symboltoken: string;
  interval:    CandleInterval;
  daysBack?:   number;      // default 30 (1m) — caller should pick based on interval
  enabled?:    boolean;
}

export function useAngelOneCandles({
  exchange,
  symboltoken,
  interval,
  daysBack = 30,
  enabled  = true,
}: UseAngelOneCandlesOptions) {
  return useQuery<CandleBar[]>({
    queryKey:       ["candles", exchange, symboltoken, interval, daysBack],
    queryFn:        () => getCandleData({ exchange, symboltoken, interval, ...candleDateRange(daysBack) }),
    enabled:        enabled && !!symboltoken,
    staleTime:      60_000,   // treat as fresh for 1 minute
    refetchInterval: 5 * 60_000, // re-fetch every 5 minutes for new completed candles
    retry:          1,
    refetchOnWindowFocus: false,
  });
}

// ── 3. Full real-time pipeline ─────────────────────────────────────────────────

export interface UseSymbolIndicatorsOptions {
  exchange:     string;       // "NSE" | "BSE" (for candle API)
  symboltoken:  string;       // Angel One token (for candle API + WS)
  exchangeType: ExchangeType; // numeric type for WebSocket subscription
  interval:     CandleInterval;
  daysBack?:    number;
  config?:      IndicatorsConfig;
  realtime?:    boolean;      // enable WS tick subscription (default true)
}

export interface SymbolIndicatorsResult {
  candles:    CandleBar[];
  indicators: IndicatorResults;
  isLoading:  boolean;
  error:      Error | null;
}

/**
 * Full indicator pipeline:
 *   1. Fetches historical candles from Angel One
 *   2. Computes all indicators via IndicatorEngine
 *   3. Subscribes to live WebSocket ticks
 *   4. Aggregates ticks into the current forming candle
 *   5. Updates the last indicator point in O(1) per tick
 *
 * @example
 * const { candles, indicators } = useSymbolIndicators({
 *   exchange: "NSE", symboltoken: "2885", exchangeType: EXCHANGE_TYPE.NSE_CM,
 *   interval: "FIVE_MINUTE",
 *   config: { bollinger: { period: 20 }, rsi: { period: 14 }, macd: {} },
 * });
 */
export function useSymbolIndicators({
  exchange,
  symboltoken,
  exchangeType,
  interval,
  daysBack  = 60,
  config    = {},
  realtime  = true,
}: UseSymbolIndicatorsOptions): SymbolIndicatorsResult {
  // ── Historical candles ─────────────────────────────────────────────────────
  const { data: candles = [], isLoading, error } = useAngelOneCandles({
    exchange, symboltoken, interval, daysBack,
  });

  // ── Streaming engine (persists between renders) ────────────────────────────
  const engineRef         = useRef<IndicatorEngine | null>(null);
  const [indicators, setIndicators] = useState<IndicatorResults>({});

  // (Re)initialize engine whenever historical candles change
  useEffect(() => {
    if (!candles.length) return;
    engineRef.current = new IndicatorEngine(candles as OHLCV[], config);
    setIndicators({ ...engineRef.current.getResults() });
    // config intentionally excluded: avoid re-creating on every config object identity change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candles]);

  // ── Real-time tick aggregation ─────────────────────────────────────────────
  const subscribe   = useMarketDataStore((s) => s.subscribe);
  const unsubscribe = useMarketDataStore((s) => s.unsubscribe);
  const tick        = useMarketDataStore((s) => selectTick(s, symboltoken, exchangeType));

  useEffect(() => {
    if (!realtime) return;
    subscribe(symboltoken, exchangeType, WS_MODE.QUOTE);
    return () => unsubscribe(symboltoken, exchangeType);
  }, [realtime, symboltoken, exchangeType, subscribe, unsubscribe]);

  // Live-candle tracking refs (avoid state — we don't want a render on every tick)
  const liveOpen    = useRef<number>(0);
  const liveHigh    = useRef<number>(0);
  const liveLow     = useRef<number>(Infinity);
  const liveStart   = useRef<number>(-1);
  const prevVolume  = useRef<number>(0);
  const liveVolume  = useRef<number>(0);
  const isFirstTick = useRef<boolean>(true);

  const applyTick = useCallback((t: Tick) => {
    const engine = engineRef.current;
    if (!engine) return;

    const intervalMs  = INTERVAL_MS[interval];
    const candleStart = Math.floor(t.exchangeTimestamp / intervalMs) * intervalMs;
    const volToday    = t.volumeTradedToday ?? 0;

    if (candleStart !== liveStart.current || isFirstTick.current) {
      // New candle period — seal the previous live candle (engine.addCandle was
      // already called when this period opened), then open a new one.
      const volDelta = isFirstTick.current ? 0 : Math.max(0, volToday - prevVolume.current);
      prevVolume.current = volToday;
      isFirstTick.current = false;

      liveStart.current  = candleStart;
      liveOpen.current   = t.ltp;
      liveHigh.current   = t.ltp;
      liveLow.current    = t.ltp;
      liveVolume.current = volDelta;

      // Add the opening tick as a new candle seed
      engine.addCandle({
        timestamp: candleStart,
        open:      t.ltp,
        high:      t.ltp,
        low:       t.ltp,
        close:     t.ltp,
        volume:    volDelta,
      });
    } else {
      // Update current live candle
      const volDelta = Math.max(0, volToday - prevVolume.current);
      prevVolume.current = volToday;

      liveHigh.current   = Math.max(liveHigh.current,  t.ltp);
      liveLow.current    = Math.min(liveLow.current,   t.ltp);
      liveVolume.current += volDelta;

      engine.updateLastCandle(
        t.ltp,
        liveHigh.current,
        liveLow.current,
        liveVolume.current,
      );
    }

    setIndicators({ ...engine.getResults() });
  }, [interval]);

  // Drive applyTick whenever a new tick arrives
  useEffect(() => {
    if (tick) applyTick(tick);
  }, [tick, applyTick]);

  return {
    candles,
    indicators,
    isLoading,
    error: error as Error | null,
  };
}
