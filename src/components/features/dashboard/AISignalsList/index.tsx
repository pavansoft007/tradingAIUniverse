"use client";

import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import { useAISignals } from "@/hooks/useMarketData";

const SIGNAL_CONFIG = {
  buy:  { label: "BUY",  color: "#00D97E", bg: "rgba(0,217,126,0.12)",  border: "rgba(0,217,126,0.25)",  Icon: TrendingUpIcon },
  sell: { label: "SELL", color: "#F23645", bg: "rgba(242,54,69,0.12)",  border: "rgba(242,54,69,0.25)",  Icon: TrendingDownIcon },
  hold: { label: "HOLD", color: "#F59E0B", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)", Icon: FiberManualRecordIcon },
} as const;

export function AISignalsList() {
  const { data, isLoading } = useAISignals();
  const signals = data?.data ?? [];

  return (
    <Card sx={{ height: "100%" }}>
      <Box
        sx={{
          px: 2.5,
          py: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: "8px",
              background: "linear-gradient(135deg, rgba(99,102,241,0.3) 0%, rgba(139,92,246,0.2) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 10px rgba(99,102,241,0.3)",
            }}
          >
            <AutoAwesomeIcon sx={{ fontSize: 14, color: "#818CF8" }} />
          </Box>
          <Typography sx={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.01em" }}>
            AI Signals
          </Typography>
        </Box>
        <Chip
          label={`${signals.length} Active`}
          size="small"
          sx={{
            height: 22,
            fontSize: 10,
            fontWeight: 700,
            background: "rgba(99,102,241,0.15)",
            color: "#818CF8",
            border: "1px solid rgba(99,102,241,0.25)",
          }}
        />
      </Box>

      <CardContent sx={{ p: 0 }}>
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Box key={i} sx={{ p: 2, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <Skeleton width="45%" height={14} sx={{ mb: 1 }} />
                <Skeleton width="100%" height={6} sx={{ borderRadius: 1 }} />
              </Box>
            ))
          : signals.slice(0, 5).map((signal) => {
              const cfg  = SIGNAL_CONFIG[signal.signal] ?? SIGNAL_CONFIG.hold;
              const Icon = cfg.Icon;
              const pct  = Math.round(signal.confidence * 100);

              return (
                <Box
                  key={signal.id}
                  sx={{
                    px: 2.5,
                    py: 1.75,
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    "&:last-child": { borderBottom: "none" },
                    "&:hover": { background: "rgba(255,255,255,0.02)" },
                    transition: "background 0.15s",
                    cursor: "pointer",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 26,
                          height: 26,
                          borderRadius: "7px",
                          background: cfg.bg,
                          border: `1px solid ${cfg.border}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Icon sx={{ fontSize: 13, color: cfg.color }} />
                      </Box>
                      <Typography sx={{ fontSize: 13, fontWeight: 700, letterSpacing: "-0.01em" }}>
                        {signal.symbol}
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                      <Box
                        sx={{
                          px: 0.75,
                          py: 0.2,
                          borderRadius: "5px",
                          background: cfg.bg,
                          border: `1px solid ${cfg.border}`,
                        }}
                      >
                        <Typography sx={{ fontSize: 10, fontWeight: 800, color: cfg.color, letterSpacing: "0.06em" }}>
                          {cfg.label}
                        </Typography>
                      </Box>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: cfg.color, fontFamily: "monospace" }}>
                        {pct}%
                      </Typography>
                    </Box>
                  </Box>

                  {/* Confidence bar */}
                  <LinearProgress
                    variant="determinate"
                    value={pct}
                    sx={{
                      mb: 1,
                      "& .MuiLinearProgress-bar": {
                        background: `linear-gradient(90deg, ${cfg.color} 0%, ${cfg.color}88 100%)`,
                      },
                      background: `${cfg.color}15`,
                    }}
                  />

                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
                      Target{" "}
                      <Typography component="span" sx={{ fontSize: 11, fontWeight: 700, color: "#00D97E", fontFamily: "monospace" }}>
                        ₹{signal.targetPrice.toLocaleString("en-IN")}
                      </Typography>
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
                      Stop{" "}
                      <Typography component="span" sx={{ fontSize: 11, fontWeight: 700, color: "#F23645", fontFamily: "monospace" }}>
                        ₹{signal.stopLoss.toLocaleString("en-IN")}
                      </Typography>
                    </Typography>
                  </Box>
                </Box>
              );
            })}
      </CardContent>
    </Card>
  );
}
