/**
 * ApexCharts conversion utilities.
 *
 * Converts IndicatorResults → ApexCharts series arrays so callers never
 * touch the raw indicator types when building charts.
 */

import type { ApexOptions } from "apexcharts";
import type {
  IndicatorPoint,
  MACDPoint,
  BollingerPoint,
  ApexIndicatorSeries,
  ApexBollingerBundle,
  ApexMACDBundle,
  ApexXY,
} from "@/types/indicators.types";
import type { OHLCV } from "@/types/market.types";
import type { CandleInterval } from "@/lib/api/angelone/market.api";
import type { TimeFrame } from "@/types/common.types";

// ── Candle / timeframe helpers ─────────────────────────────────────────────────

export const TIMEFRAME_TO_INTERVAL: Partial<Record<TimeFrame, CandleInterval>> = {
  "1m":  "ONE_MINUTE",
  "5m":  "FIVE_MINUTE",
  "15m": "FIFTEEN_MINUTE",
  "1h":  "ONE_HOUR",
  "1d":  "ONE_DAY",
};

export const INTERVAL_MS: Record<CandleInterval, number> = {
  ONE_MINUTE:     60_000,
  THREE_MINUTE:   3  * 60_000,
  FIVE_MINUTE:    5  * 60_000,
  TEN_MINUTE:     10 * 60_000,
  FIFTEEN_MINUTE: 15 * 60_000,
  THIRTY_MINUTE:  30 * 60_000,
  ONE_HOUR:       60 * 60_000,
  ONE_DAY:        24 * 60 * 60_000,
};

// ── Single-value series ────────────────────────────────────────────────────────

function toXY(points: IndicatorPoint[]): ApexXY[] {
  return points.map((p) => ({ x: p.timestamp, y: p.value }));
}

export function toApexLine(
  points: IndicatorPoint[],
  name:   string,
): ApexIndicatorSeries {
  return { name, type: "line", data: toXY(points) };
}

// ── Candlestick series ─────────────────────────────────────────────────────────

export function toApexCandlestick(
  candles: OHLCV[],
): ApexOptions["series"] {
  return [
    {
      name: "Price",
      type: "candlestick",
      data: candles.map((c) => ({
        x: c.timestamp,
        y: [c.open, c.high, c.low, c.close] as number[],
      })),
    },
  ];
}

// ── Bollinger Bands ────────────────────────────────────────────────────────────

export function toApexBollinger(points: BollingerPoint[]): ApexBollingerBundle {
  const upper:  ApexXY[] = [];
  const middle: ApexXY[] = [];
  const lower:  ApexXY[] = [];
  for (const p of points) {
    upper.push ({ x: p.timestamp, y: p.upper  });
    middle.push({ x: p.timestamp, y: p.middle });
    lower.push ({ x: p.timestamp, y: p.lower  });
  }
  return {
    upper:  { name: "BB Upper",  type: "line", data: upper  },
    middle: { name: "BB Middle", type: "line", data: middle },
    lower:  { name: "BB Lower",  type: "line", data: lower  },
  };
}

// ── MACD ───────────────────────────────────────────────────────────────────────

export function toApexMACD(points: MACDPoint[]): ApexMACDBundle {
  const macd:      ApexXY[] = [];
  const signal:    ApexXY[] = [];
  const histogram: ApexXY[] = [];
  for (const p of points) {
    macd.push     ({ x: p.timestamp, y: p.macd      });
    signal.push   ({ x: p.timestamp, y: p.signal    });
    histogram.push({ x: p.timestamp, y: p.histogram });
  }
  return {
    macd:      { name: "MACD",      type: "line", data: macd      },
    signal:    { name: "Signal",    type: "line", data: signal    },
    histogram: { name: "Histogram", type: "bar",  data: histogram },
  };
}

// ── Main-panel overlay builder ─────────────────────────────────────────────────

/**
 * Returns all series that should be overlaid on the main candlestick panel.
 * Combine with `toApexCandlestick` output for a mixed chart.
 */
export function toApexOverlaySeries(opts: {
  sma?:       IndicatorPoint[];
  ema?:       IndicatorPoint[];
  vwap?:      IndicatorPoint[];
  bollinger?: BollingerPoint[];
}): ApexIndicatorSeries[] {
  const series: ApexIndicatorSeries[] = [];
  if (opts.sma)       series.push(toApexLine(opts.sma,  "SMA"));
  if (opts.ema)       series.push(toApexLine(opts.ema,  "EMA"));
  if (opts.vwap)      series.push(toApexLine(opts.vwap, "VWAP"));
  if (opts.bollinger) {
    const bb = toApexBollinger(opts.bollinger);
    series.push(bb.upper, bb.middle, bb.lower);
  }
  return series;
}
