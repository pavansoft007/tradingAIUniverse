"use client";

import {
  useEffect, useRef, useState, useMemo, useCallback,
} from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  CrosshairMode,
  LineStyle,
  LineType,
  type IChartApi,
  type ISeriesApi,
  type SeriesType,
  type IPaneApi,
  type Time,
  type UTCTimestamp,
  type MouseEventParams,
  type OhlcData,
} from "lightweight-charts";
import { useSymbolIndicators } from "@/hooks/useIndicators";
import type { CandleBar } from "@/lib/api/angelone/market.api";
import type { OHLCV } from "@/types/market.types";
import { ChartToolbar }  from "./ChartToolbar";
import { ChartLegend }   from "./ChartLegend";
import {
  CHART_COLORS,
  RSI_PANE_HEIGHT,
  MACD_PANE_HEIGHT,
  TIMEFRAME_OPTIONS,
  type TradingChartProps,
  type LegendData,
} from "./types";
import type { CandleInterval } from "@/lib/api/angelone/market.api";

// ── Time helper (ms → UTC seconds) ────────────────────────────────────────────

const toTime = (ms: number): UTCTimestamp =>
  Math.floor(ms / 1000) as UTCTimestamp;

// ── Series ref types (use base SeriesType to avoid complex generic constraints) ─

type S = ISeriesApi<SeriesType>;

interface SeriesRefs {
  candle:    S | null;
  volume:    S | null;
  sma:       S | null;
  ema:       S | null;
  vwap:      S | null;
  bbUpper:   S | null;
  bbMiddle:  S | null;
  bbLower:   S | null;
  rsi:       S | null;
  rsiPane:   IPaneApi<Time> | null;
  macdLine:  S | null;
  macdSig:   S | null;
  macdHist:  S | null;
  macdPane:  IPaneApi<Time> | null;
}

function emptyRefs(): SeriesRefs {
  return {
    candle: null, volume: null,
    sma: null, ema: null, vwap: null,
    bbUpper: null, bbMiddle: null, bbLower: null,
    rsi: null, rsiPane: null,
    macdLine: null, macdSig: null, macdHist: null, macdPane: null,
  };
}

// ── Main component ─────────────────────────────────────────────────────────────

export function TradingChart({
  title,
  exchange,
  symboltoken,
  exchangeType,
  mainHeight = 400,
  realtime   = true,
}: TradingChartProps) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";

  // ── UI toggles ───────────────────────────────────────────────────────────
  const [interval,    setInterval]    = useState<CandleInterval>("FIVE_MINUTE");
  const [showSMA,     setShowSMA]     = useState(true);
  const [showEMA,     setShowEMA]     = useState(false);
  const [showBB,      setShowBB]      = useState(false);
  const [showVWAP,    setShowVWAP]    = useState(true);
  const [showRSI,     setShowRSI]     = useState(true);
  const [showMACD,    setShowMACD]    = useState(false);
  const [legendData,  setLegendData]  = useState<LegendData | null>(null);
  const [chartReady,  setChartReady]  = useState(false);

  const daysBack = useMemo(
    () => TIMEFRAME_OPTIONS.find((t) => t.interval === interval)?.daysBack ?? 30,
    [interval],
  );

  // ── Imperative chart refs ─────────────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef     = useRef<IChartApi | null>(null);
  const srRef        = useRef<SeriesRefs>(emptyRefs());

  // ── Data from indicator engine ────────────────────────────────────────────
  const { candles, indicators, isLoading } = useSymbolIndicators({
    exchange,
    symboltoken,
    exchangeType,
    interval,
    daysBack,
    config:   {},
    realtime,
  });

  const indicatorsRef = useRef(indicators);
  useEffect(() => { indicatorsRef.current = indicators; }, [indicators]);

  const prevCandlesRef = useRef<CandleBar[]>([]);

  // Container total height adapts as panes are added/removed
  const totalHeight = mainHeight + (showRSI ? RSI_PANE_HEIGHT : 0) + (showMACD ? MACD_PANE_HEIGHT : 0);

  // ── ① Chart initialization (re-runs only on theme change) ─────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const bg   = theme.palette.background.paper;
    const fg   = theme.palette.text.secondary;
    const grid = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
    const bdr  = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)";

    const c = createChart(el, {
      autoSize: true,
      layout: {
        background:  { color: bg },
        textColor:   fg,
        fontFamily:  theme.typography.fontFamily ?? "Inter, sans-serif",
        fontSize:    11,
      },
      grid: {
        vertLines: { color: grid, style: LineStyle.Dotted },
        horzLines: { color: grid, style: LineStyle.Dotted },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          width:  1,
          color:  isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.25)",
          style:  LineStyle.Dashed,
          labelBackgroundColor: theme.palette.primary.main,
        },
        horzLine: {
          width:  1,
          color:  isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.25)",
          style:  LineStyle.Dashed,
          labelBackgroundColor: theme.palette.primary.main,
        },
      },
      timeScale: {
        borderColor:               bdr,
        timeVisible:               true,
        secondsVisible:            false,
        rightOffset:               12,
        minBarSpacing:             2,
        shiftVisibleRangeOnNewBar: true,
      },
      rightPriceScale: {
        borderColor:    bdr,
        scaleMargins:   { top: 0.04, bottom: 0.20 },
        minimumWidth:   60,
        entireTextOnly: true,
      },
      leftPriceScale: { visible: false },
      handleScroll:   { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
      handleScale:    { mouseWheel: true, pinch: true, axisPressedMouseMove: true, axisDoubleClickReset: true },
    });

    // Pane 0 — candlestick + volume (separate price scale)
    const cs = c.addSeries(CandlestickSeries, {
      upColor:          CHART_COLORS.upCandle,
      downColor:        CHART_COLORS.downCandle,
      borderUpColor:    CHART_COLORS.upCandle,
      borderDownColor:  CHART_COLORS.downCandle,
      wickUpColor:      CHART_COLORS.upCandle,
      wickDownColor:    CHART_COLORS.downCandle,
    }, 0);

    const vs = c.addSeries(HistogramSeries, {
      priceScaleId: "volume",
      priceFormat:  { type: "volume" },
    }, 0);

    c.priceScale("volume").applyOptions({ scaleMargins: { top: 0.80, bottom: 0 } });

    srRef.current.candle = cs;
    srRef.current.volume = vs;

    // Crosshair legend — uses refs so always reads latest series/state
    const onCrosshair = (param: MouseEventParams<Time>) => {
      if (!param.time || !param.point) { setLegendData(null); return; }
      const sr = srRef.current;
      const raw = sr.candle ? param.seriesData.get(sr.candle) : undefined;
      if (!raw || !("open" in raw)) { setLegendData(null); return; }

      const ohlc     = raw as OhlcData;
      const getV     = (s: S | null) => { const d = s ? param.seriesData.get(s) as { value?: number } | undefined : undefined; return d?.value ?? null; };
      const prevC    = prevCandlesRef.current;
      const tsS      = param.time as UTCTimestamp;
      const idx      = prevC.findIndex((ca) => toTime(ca.timestamp) === tsS);
      const prevClose = idx > 0 ? prevC[idx - 1].close : ohlc.close;
      const change    = ohlc.close - prevClose;

      setLegendData({
        timestamp: tsS * 1000,
        open: ohlc.open, high: ohlc.high, low: ohlc.low, close: ohlc.close,
        volume:    getV(sr.volume)   ?? 0,
        change,
        changePct: prevClose !== 0 ? (change / prevClose) * 100 : 0,
        sma:       getV(sr.sma),
        ema:       getV(sr.ema),
        vwap:      getV(sr.vwap),
        bbUpper:   getV(sr.bbUpper),
        bbLower:   getV(sr.bbLower),
        rsi:       getV(sr.rsi),
        macd:      getV(sr.macdLine),
        signal:    getV(sr.macdSig),
        histogram: getV(sr.macdHist),
      });
    };

    c.subscribeCrosshairMove(onCrosshair);
    chartRef.current = c;
    setChartReady(true);

    return () => {
      c.unsubscribeCrosshairMove(onCrosshair);
      c.remove();
      chartRef.current = null;
      srRef.current    = emptyRefs();
      setChartReady(false);
      setLegendData(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDark, theme.palette.background.paper, theme.palette.text.secondary, theme.typography.fontFamily, theme.palette.primary.main]);

  // ── ② Candle + volume data sync ───────────────────────────────────────────
  useEffect(() => {
    const { candle, volume } = srRef.current;
    if (!chartReady || !candle || !volume || !candles.length) return;

    const fullReload = candles !== prevCandlesRef.current;
    prevCandlesRef.current = candles;

    if (fullReload) {
      candle.setData((candles as OHLCV[]).map((ca) => ({
        time: toTime(ca.timestamp), open: ca.open, high: ca.high, low: ca.low, close: ca.close,
      })));
      volume.setData((candles as OHLCV[]).map((ca) => ({
        time: toTime(ca.timestamp), value: ca.volume,
        color: ca.close >= ca.open ? CHART_COLORS.upVolume : CHART_COLORS.downVolume,
      })));
    } else {
      const last = candles[candles.length - 1] as OHLCV;
      candle.update({ time: toTime(last.timestamp), open: last.open, high: last.high, low: last.low, close: last.close });
      volume.update({ time: toTime(last.timestamp), value: last.volume, color: last.close >= last.open ? CHART_COLORS.upVolume : CHART_COLORS.downVolume });
    }
  }, [candles, chartReady]);

  // ── Overlay helpers ───────────────────────────────────────────────────────

  const syncLineSeries = useCallback((
    ref:     keyof SeriesRefs,
    enabled: boolean,
    data:    { timestamp: number; value: number }[] | undefined,
    opts:    Parameters<IChartApi["addSeries"]>[1],
    paneIdx = 0,
  ) => {
    const c = chartRef.current;
    if (!c || !chartReady) return;

    if (enabled) {
      if (!srRef.current[ref]) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (srRef.current as any)[ref] = c.addSeries(LineSeries, opts, paneIdx) as S;
      }
      if (data?.length) {
        (srRef.current[ref] as S).setData(data.map((p) => ({ time: toTime(p.timestamp), value: p.value })));
      }
    } else if (srRef.current[ref]) {
      c.removeSeries(srRef.current[ref] as S);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (srRef.current as any)[ref] = null;
    }
  }, [chartReady]);

  // ── ③ SMA ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    syncLineSeries("sma", showSMA, indicators.sma, {
      color: CHART_COLORS.sma, lineWidth: 1, lineType: LineType.Simple,
      priceLineVisible: false, lastValueVisible: false,
    });
  }, [showSMA, indicators.sma, chartReady, syncLineSeries]);

  // ── ④ EMA ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    syncLineSeries("ema", showEMA, indicators.ema, {
      color: CHART_COLORS.ema, lineWidth: 1, lineType: LineType.Simple,
      priceLineVisible: false, lastValueVisible: false,
    });
  }, [showEMA, indicators.ema, chartReady, syncLineSeries]);

  // ── ⑤ VWAP ────────────────────────────────────────────────────────────────
  useEffect(() => {
    syncLineSeries("vwap", showVWAP, indicators.vwap, {
      color: CHART_COLORS.vwap, lineWidth: 1, lineStyle: LineStyle.Dashed,
      priceLineVisible: false, lastValueVisible: false,
    });
  }, [showVWAP, indicators.vwap, chartReady, syncLineSeries]);

  // ── ⑥ Bollinger Bands ────────────────────────────────────────────────────
  useEffect(() => {
    const c = chartRef.current;
    if (!c || !chartReady) return;
    const bbOpts: Parameters<IChartApi["addSeries"]>[1] = {
      color: CHART_COLORS.bbBand, lineWidth: 1 as const,
      priceLineVisible: false, lastValueVisible: false,
    };
    if (showBB) {
      if (!srRef.current.bbUpper) {
        srRef.current.bbUpper  = c.addSeries(LineSeries, { ...bbOpts, lineStyle: LineStyle.Dashed }, 0) as S;
        srRef.current.bbMiddle = c.addSeries(LineSeries, { ...bbOpts },                               0) as S;
        srRef.current.bbLower  = c.addSeries(LineSeries, { ...bbOpts, lineStyle: LineStyle.Dashed }, 0) as S;
      }
      if (indicators.bollinger?.length) {
        srRef.current.bbUpper!.setData( indicators.bollinger.map((p) => ({ time: toTime(p.timestamp), value: p.upper  })));
        srRef.current.bbMiddle!.setData(indicators.bollinger.map((p) => ({ time: toTime(p.timestamp), value: p.middle })));
        srRef.current.bbLower!.setData( indicators.bollinger.map((p) => ({ time: toTime(p.timestamp), value: p.lower  })));
      }
    } else if (srRef.current.bbUpper) {
      c.removeSeries(srRef.current.bbUpper);
      c.removeSeries(srRef.current.bbMiddle!);
      c.removeSeries(srRef.current.bbLower!);
      srRef.current.bbUpper = srRef.current.bbMiddle = srRef.current.bbLower = null;
    }
  }, [showBB, indicators.bollinger, chartReady]);

  // ── ⑦ RSI pane ───────────────────────────────────────────────────────────
  useEffect(() => {
    const c = chartRef.current;
    if (!c || !chartReady) return;
    if (showRSI) {
      if (!srRef.current.rsiPane) {
        const pane = c.addPane();
        pane.setHeight(RSI_PANE_HEIGHT);
        const pIdx = pane.paneIndex();
        srRef.current.rsiPane = pane;
        const rs = c.addSeries(LineSeries, {
          color: CHART_COLORS.rsi, lineWidth: 1,
          priceLineVisible: false, lastValueVisible: false,
          autoscaleInfoProvider: () => ({
            priceRange: { minValue: 0, maxValue: 100 },
            margins:    { above: 8, below: 8 },
          }),
        }, pIdx) as S;
        rs.createPriceLine({ price: 70, color: CHART_COLORS.rsi70, lineWidth: 1, lineStyle: LineStyle.Dotted, axisLabelVisible: true,  title: "70" });
        rs.createPriceLine({ price: 30, color: CHART_COLORS.rsi30, lineWidth: 1, lineStyle: LineStyle.Dotted, axisLabelVisible: true,  title: "30" });
        rs.createPriceLine({ price: 50, color: "rgba(150,150,150,0.3)", lineWidth: 1, lineStyle: LineStyle.Dotted, axisLabelVisible: false, title: "" });
        srRef.current.rsi = rs;
      }
      if (indicators.rsi?.length) {
        srRef.current.rsi!.setData(indicators.rsi.map((p) => ({ time: toTime(p.timestamp), value: p.value })));
      }
    } else if (srRef.current.rsi && srRef.current.rsiPane) {
      c.removeSeries(srRef.current.rsi);
      c.removePane(srRef.current.rsiPane.paneIndex());
      srRef.current.rsi     = null;
      srRef.current.rsiPane = null;
    }
  }, [showRSI, indicators.rsi, chartReady]);

  // ── ⑧ MACD pane ──────────────────────────────────────────────────────────
  useEffect(() => {
    const c = chartRef.current;
    if (!c || !chartReady) return;
    if (showMACD) {
      if (!srRef.current.macdPane) {
        const pane = c.addPane();
        pane.setHeight(MACD_PANE_HEIGHT);
        const pIdx = pane.paneIndex();
        srRef.current.macdPane = pane;

        const ml = c.addSeries(LineSeries, {
          color: CHART_COLORS.macdLine, lineWidth: 1, priceLineVisible: false, lastValueVisible: false,
        }, pIdx) as S;
        const ms = c.addSeries(LineSeries, {
          color: CHART_COLORS.macdSig,  lineWidth: 1, priceLineVisible: false, lastValueVisible: false,
        }, pIdx) as S;
        const mh = c.addSeries(HistogramSeries, {
          priceLineVisible: false, lastValueVisible: false,
        }, pIdx) as S;

        ml.createPriceLine({ price: 0, color: "rgba(150,150,150,0.3)", lineWidth: 1, lineStyle: LineStyle.Dotted, axisLabelVisible: false, title: "" });

        srRef.current.macdLine = ml;
        srRef.current.macdSig  = ms;
        srRef.current.macdHist = mh;
      }
      if (indicators.macd?.length) {
        srRef.current.macdLine!.setData(indicators.macd.map((p) => ({ time: toTime(p.timestamp), value: p.macd      })));
        srRef.current.macdSig!.setData( indicators.macd.map((p) => ({ time: toTime(p.timestamp), value: p.signal    })));
        srRef.current.macdHist!.setData(indicators.macd.map((p) => ({
          time:  toTime(p.timestamp),
          value: p.histogram,
          color: p.histogram >= 0 ? CHART_COLORS.histUp : CHART_COLORS.histDown,
        })));
      }
    } else if (srRef.current.macdPane) {
      if (srRef.current.macdLine) c.removeSeries(srRef.current.macdLine);
      if (srRef.current.macdSig)  c.removeSeries(srRef.current.macdSig);
      if (srRef.current.macdHist) c.removeSeries(srRef.current.macdHist);
      c.removePane(srRef.current.macdPane.paneIndex());
      srRef.current.macdLine = srRef.current.macdSig = srRef.current.macdHist = null;
      srRef.current.macdPane = null;
    }
  }, [showMACD, indicators.macd, chartReady]);

  // ── ⑨ Fit content ────────────────────────────────────────────────────────
  const handleFitContent = useCallback(() => {
    chartRef.current?.timeScale().fitContent();
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Box
      sx={{
        display:       "flex",
        flexDirection: "column",
        bgcolor:       "background.paper",
        borderRadius:  2,
        overflow:      "hidden",
        border:        1,
        borderColor:   "divider",
      }}
    >
      <ChartToolbar
        title={title}
        interval={interval}
        onIntervalChange={(iv) => { setInterval(iv); prevCandlesRef.current = []; }}
        onFitContent={handleFitContent}
        showSMA={showSMA}   onToggleSMA={() => setShowSMA((v) => !v)}
        showEMA={showEMA}   onToggleEMA={() => setShowEMA((v) => !v)}
        showBB={showBB}     onToggleBB={() => setShowBB((v) => !v)}
        showVWAP={showVWAP} onToggleVWAP={() => setShowVWAP((v) => !v)}
        showRSI={showRSI}   onToggleRSI={() => setShowRSI((v) => !v)}
        showMACD={showMACD} onToggleMACD={() => setShowMACD((v) => !v)}
      />

      <Box
        sx={{
          position:   "relative",
          width:      "100%",
          height:     totalHeight,
          transition: "height 0.2s ease",
          overflow:   "hidden",
        }}
      >
        <ChartLegend
          data={legendData}
          showSMA={showSMA}   showEMA={showEMA}
          showVWAP={showVWAP} showBB={showBB}
          showRSI={showRSI}   showMACD={showMACD}
        />

        {isLoading && (
          <Box
            sx={{
              position: "absolute", inset: 0, zIndex: 20,
              display: "flex", alignItems: "center", justifyContent: "center",
              bgcolor: (t) => `${t.palette.background.paper}cc`,
            }}
          >
            <CircularProgress size={28} />
          </Box>
        )}

        {!isLoading && !candles.length && (
          <Box
            sx={{
              position: "absolute", inset: 0, zIndex: 20,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Typography variant="body2" color="text.disabled">
              No data — check symbol or timeframe
            </Typography>
          </Box>
        )}

        <Box ref={containerRef} sx={{ width: "100%", height: "100%" }} />
      </Box>
    </Box>
  );
}
