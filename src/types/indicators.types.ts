// ── Indicator output types ─────────────────────────────────────────────────────

/** Single-value indicator output (RSI, SMA, EMA, VWAP) */
export interface IndicatorPoint {
  timestamp: number;
  value:     number;
}

/** MACD output — three series in one */
export interface MACDPoint {
  timestamp: number;
  macd:      number;
  signal:    number;
  histogram: number;
}

/** Bollinger Bands output — three series in one */
export interface BollingerPoint {
  timestamp:  number;
  upper:      number;
  middle:     number;
  lower:      number;
}

// ── Per-indicator configuration ────────────────────────────────────────────────

export interface SMAConfig       { period?: number }
export interface EMAConfig       { period?: number }
export interface RSIConfig       { period?: number }
export interface VWAPConfig      { resetDaily?: boolean }
export interface MACDConfig      { fast?: number; slow?: number; signal?: number }
export interface BollingerConfig { period?: number; multiplier?: number }

// ── Combined config (false = disable, omit = enable with defaults) ─────────────

export interface IndicatorsConfig {
  sma?:       SMAConfig       | false;
  ema?:       EMAConfig       | false;
  rsi?:       RSIConfig       | false;
  vwap?:      VWAPConfig      | false;
  macd?:      MACDConfig      | false;
  bollinger?: BollingerConfig | false;
}

// ── Combined results ───────────────────────────────────────────────────────────

export interface IndicatorResults {
  sma?:       IndicatorPoint[];
  ema?:       IndicatorPoint[];
  rsi?:       IndicatorPoint[];
  vwap?:      IndicatorPoint[];
  macd?:      MACDPoint[];
  bollinger?: BollingerPoint[];
}

// ── ApexCharts integration ─────────────────────────────────────────────────────

/** Generic ApexCharts {x,y} point */
export type ApexXY = { x: number; y: number | null };

export interface ApexIndicatorSeries {
  name: string;
  type: "line" | "area" | "bar";
  data: ApexXY[];
}

export interface ApexBollingerBundle {
  upper:  ApexIndicatorSeries;
  middle: ApexIndicatorSeries;
  lower:  ApexIndicatorSeries;
}

export interface ApexMACDBundle {
  macd:      ApexIndicatorSeries;
  signal:    ApexIndicatorSeries;
  histogram: ApexIndicatorSeries;
}
