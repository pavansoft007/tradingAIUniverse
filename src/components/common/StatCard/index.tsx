"use client";

import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

// ── Mini sparkline ─────────────────────────────────────────────────────────────

function Sparkline({ positive, color }: { positive: boolean; color: string }) {
  const upPoints   = "0,28 12,22 24,26 36,18 48,20 60,12 72,8  84,14 96,6";
  const downPoints = "0,6  12,10 24,8  36,16 48,12 60,20 72,18 84,24 96,28";
  return (
    <svg width={96} height={32} viewBox="0 0 96 32" fill="none">
      <defs>
        <linearGradient id={`sg-${positive}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={positive ? upPoints : downPoints}
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polygon
        points={`${positive ? upPoints : downPoints} 96,32 0,32`}
        fill={`url(#sg-${positive})`}
      />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: ReactNode;
  iconColor?: string;
  loading?: boolean;
  prefix?: string;
  suffix?: string;
}

export function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  iconColor = "#6366F1",
  loading = false,
  prefix = "",
  suffix = "",
}: StatCardProps) {
  const isPositive = change !== undefined && change >= 0;
  const hasChange  = change !== undefined;
  const changeColor = isPositive ? "#00D97E" : "#F23645";

  return (
    <Card
      sx={{
        position: "relative",
        overflow: "hidden",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: `0 8px 32px rgba(0,0,0,0.25), 0 0 0 1px ${iconColor}22`,
        },
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, ${iconColor} 0%, ${iconColor}00 100%)`,
          opacity: 0.8,
        },
      }}
    >
      <CardContent sx={{ p: "16px !important" }}>
        {loading ? (
          <>
            <Skeleton width={100} height={14} sx={{ mb: 1 }} />
            <Skeleton width="65%" height={30} sx={{ mb: 0.75 }} />
            <Skeleton width="45%" height={14} />
          </>
        ) : (
          <>
            {/* Top row: label + icon */}
            <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 1.5 }}>
              <Typography
                sx={{
                  fontSize: 11.5,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "text.secondary",
                }}
              >
                {title}
              </Typography>
              {icon && (
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "9px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: `linear-gradient(135deg, ${iconColor}22 0%, ${iconColor}11 100%)`,
                    border: `1px solid ${iconColor}33`,
                    color: iconColor,
                    boxShadow: `0 0 14px ${iconColor}22`,
                    "& svg": { fontSize: 16 },
                  }}
                >
                  {icon}
                </Box>
              )}
            </Box>

            {/* Value */}
            <Typography
              sx={{
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: "-0.03em",
                lineHeight: 1,
                mb: 0.5,
                fontFamily: '"Inter", monospace',
                fontFeatureSettings: '"tnum"',
              }}
            >
              {prefix}
              {typeof value === "number" ? value.toLocaleString("en-IN") : value}
              {suffix}
            </Typography>

            {/* Sparkline + change */}
            <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", mt: 1 }}>
              {hasChange && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.4,
                      px: 0.75,
                      py: 0.3,
                      borderRadius: "6px",
                      background: `${changeColor}18`,
                      border: `1px solid ${changeColor}30`,
                    }}
                  >
                    {isPositive ? (
                      <ArrowUpwardIcon sx={{ fontSize: 12, color: changeColor }} />
                    ) : (
                      <ArrowDownwardIcon sx={{ fontSize: 12, color: changeColor }} />
                    )}
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: changeColor }}>
                      {isPositive ? "+" : ""}
                      {Math.abs(change!).toFixed(2)}%
                    </Typography>
                  </Box>
                  {changeLabel && (
                    <Typography sx={{ fontSize: 11, color: "text.secondary" }}>{changeLabel}</Typography>
                  )}
                </Box>
              )}
              {hasChange && (
                <Sparkline positive={isPositive} color={changeColor} />
              )}
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}
