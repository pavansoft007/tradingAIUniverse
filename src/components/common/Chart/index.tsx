"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import { useTheme, alpha } from "@mui/material/styles";
import { useMemo } from "react";

const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

// ── Types ─────────────────────────────────────────────────────────────────────

export type ChartProps = {
  type:
    | "line"
    | "area"
    | "bar"
    | "pie"
    | "donut"
    | "radialBar"
    | "scatter"
    | "bubble"
    | "heatmap"
    | "candlestick"
    | "boxPlot"
    | "radar"
    | "polarArea"
    | "rangeBar"
    | "rangeArea"
    | "treemap";
  series: ApexOptions["series"];
  options?: ApexOptions;
  width?: string | number;
  height?: string | number;
};

// ── Chart component ───────────────────────────────────────────────────────────

export default function Chart({ type, series, options = {}, width = "100%", height = 320 }: ChartProps) {
  return (
    <ApexChart
      type={type}
      series={series}
      options={options}
      width={width}
      height={height}
    />
  );
}

// ── useChart hook ─────────────────────────────────────────────────────────────

export function useChart(options?: ApexOptions): ApexOptions {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const baseOptions = useMemo<ApexOptions>(
    () => ({
      chart: {
        toolbar: { show: false },
        zoom: { enabled: false },
        background: "transparent",
        foreColor: theme.palette.text.secondary,
        animations: { enabled: true, speed: 400 },
        fontFamily: theme.typography.fontFamily,
      },
      colors: [
        theme.palette.primary.main,
        theme.palette.secondary.main,
        theme.palette.warning.main,
        theme.palette.error.main,
        theme.palette.info.main,
        alpha(theme.palette.primary.main, 0.6),
        alpha(theme.palette.secondary.main, 0.6),
      ],
      fill: {
        opacity: 1,
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        width: 2.5,
        curve: "smooth",
        lineCap: "round",
      },
      grid: {
        strokeDashArray: 4,
        borderColor: alpha(theme.palette.divider, isDark ? 1 : 0.8),
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
      },
      xaxis: {
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          style: {
            fontSize: "11px",
            fontWeight: 500,
            colors: theme.palette.text.secondary,
            fontFamily: theme.typography.fontFamily,
          },
        },
        crosshairs: {
          stroke: { color: alpha(theme.palette.primary.main, 0.3), dashArray: 4 },
        },
      },
      yaxis: {
        labels: {
          style: {
            fontSize: "11px",
            fontWeight: 500,
            colors: theme.palette.text.secondary,
            fontFamily: theme.typography.fontFamily,
          },
        },
      },
      legend: {
        show: true,
        position: "top",
        horizontalAlign: "right",
        markers: { width: 8, height: 8, radius: 6, offsetX: -2 },
        fontSize: "12px",
        fontWeight: 500,
        fontFamily: theme.typography.fontFamily,
        labels: { colors: theme.palette.text.secondary },
        itemMargin: { horizontal: 12 },
      },
      tooltip: {
        theme: isDark ? "dark" : "light",
        x: { show: true },
        style: { fontSize: "12px", fontFamily: theme.typography.fontFamily },
      },
      plotOptions: {
        bar: {
          borderRadius: 4,
          columnWidth: "56%",
        },
        pie: {
          donut: {
            size: "72%",
            labels: {
              show: true,
              total: {
                show: true,
                label: "Total",
                fontSize: "13px",
                fontWeight: 600,
                color: theme.palette.text.primary,
                fontFamily: theme.typography.fontFamily,
              },
            },
          },
        },
      },
      responsive: [
        {
          breakpoint: 600,
          options: { legend: { show: false } },
        },
      ],
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theme]
  );

  // Deep-merge caller options on top of base
  return useMemo(
    () => mergeDeep(baseOptions as AnyObject, (options ?? {}) as AnyObject) as ApexOptions,
    [baseOptions, options]
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

type AnyObject = Record<string, unknown>;

function isObject(item: unknown): item is AnyObject {
  return !!item && typeof item === "object" && !Array.isArray(item);
}

function mergeDeep(base: AnyObject, override: AnyObject): AnyObject {
  const result: AnyObject = { ...base };
  for (const key of Object.keys(override)) {
    if (isObject(base[key]) && isObject(override[key])) {
      result[key] = mergeDeep(base[key] as AnyObject, override[key] as AnyObject);
    } else {
      result[key] = override[key];
    }
  }
  return result;
}
