"use client";

import SecurityIcon      from "@mui/icons-material/Security";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import SpeedIcon         from "@mui/icons-material/Speed";
import Box               from "@mui/material/Box";
import Card              from "@mui/material/Card";
import CardContent       from "@mui/material/CardContent";
import Chip              from "@mui/material/Chip";
import LinearProgress    from "@mui/material/LinearProgress";
import Skeleton          from "@mui/material/Skeleton";
import Switch            from "@mui/material/Switch";
import Tooltip           from "@mui/material/Tooltip";
import Typography        from "@mui/material/Typography";
import { alpha }         from "@mui/material/styles";
import { useOrderEngine } from "@/hooks/useOrderEngine";
import { useRiskStore }   from "@/store/useRiskStore";
import { useFunds }       from "@/hooks/usePortfolio";

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n >= 1_00_000
    ? `₹${(n / 1_00_000).toFixed(1)}L`
    : `₹${(n / 1_000).toFixed(1)}K`;

// ── Stat cell ─────────────────────────────────────────────────────────────────

function Stat({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) {
  return (
    <Box>
      <Typography component="div" sx={{ fontSize: 9.5, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </Typography>
      <Typography component="div" sx={{ fontSize: 13, fontWeight: 700, color: color ?? "text.primary", fontFamily: "monospace" }}>
        {value}
      </Typography>
    </Box>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function RiskGauge() {
  const {
    availableCash,
    dailyPnL,
    riskConfig,
    ordersThisMinute,
    isMarketOpen,
  } = useOrderEngine();

  const toggleRisk = useRiskStore((s) => s.toggleRisk);
  const { isLoading: fundsLoading } = useFunds();

  const rateUsed     = riskConfig.maxOrdersPerMin > 0
    ? ordersThisMinute / riskConfig.maxOrdersPerMin
    : 0;

  const pnlColor     = dailyPnL >= 0 ? "#00D97E" : "#F23645";
  const rateColor    = rateUsed > 0.75 ? "#F23645" : rateUsed > 0.4 ? "#F59E0B" : "#00D97E";

  const riskLevel    = !riskConfig.enabled
    ? { label: "OFF",    color: "#94A3B8", bg: "rgba(148,163,184,0.12)" }
    : rateUsed > 0.75 || (riskConfig.maxDailyLoss < 0 && dailyPnL < riskConfig.maxDailyLoss * 0.8)
    ? { label: "HIGH",   color: "#F23645", bg: "rgba(242,54,69,0.12)" }
    : rateUsed > 0.4
    ? { label: "MEDIUM", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" }
    : { label: "LOW",    color: "#00D97E", bg: "rgba(0,217,126,0.12)" };

  return (
    <Card>
      <CardContent sx={{ p: "14px 20px !important" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
          {/* Icon */}
          <Box
            sx={{
              width: 26, height: 26, borderRadius: "7px",
              background: alpha(riskLevel.color, 0.15),
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            {riskConfig.enabled
              ? <SecurityIcon sx={{ fontSize: 14, color: riskLevel.color }} />
              : <SecurityOutlinedIcon sx={{ fontSize: 14, color: riskLevel.color }} />}
          </Box>

          <Typography sx={{ fontSize: 13, fontWeight: 700, flex: 1 }}>Risk Guard</Typography>

          {/* Risk level chip */}
          <Chip
            label={riskLevel.label}
            size="small"
            sx={{
              height: 20, fontSize: 10, fontWeight: 800,
              background: riskLevel.bg,
              color:      riskLevel.color,
              border:     `1px solid ${alpha(riskLevel.color, 0.3)}`,
            }}
          />

          {/* Enable/disable toggle */}
          <Tooltip title={riskConfig.enabled ? "Disable risk checks" : "Enable risk checks"}>
            <Switch
              checked={riskConfig.enabled}
              onChange={toggleRisk}
              size="small"
              color="success"
              sx={{ ml: -0.5 }}
            />
          </Tooltip>
        </Box>

        <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
          {/* Market status */}
          <Stat
            label="Market"
            value={
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Box sx={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: isMarketOpen ? "#00D97E" : "#F59E0B",
                  flexShrink: 0,
                }} />
                <span>{isMarketOpen ? "Open" : "Closed"}</span>
              </Box>
            }
          />

          {/* Available cash */}
          <Stat
            label="Available"
            value={
              fundsLoading
                ? <Skeleton width={60} height={14} />
                : availableCash > 0 ? fmt(availableCash) : "–"
            }
            color="#818CF8"
          />

          {/* Daily P&L */}
          <Stat
            label="Day P&L"
            value={
              dailyPnL !== 0
                ? `${dailyPnL >= 0 ? "+" : ""}₹${Math.abs(dailyPnL).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
                : "–"
            }
            color={dailyPnL !== 0 ? pnlColor : undefined}
          />

          {/* Rate limiter */}
          {riskConfig.maxOrdersPerMin > 0 && (
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.3 }}>
                <SpeedIcon sx={{ fontSize: 11, color: "text.secondary" }} />
                <Typography sx={{ fontSize: 9.5, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Rate
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(rateUsed * 100, 100)}
                  sx={{
                    width: 60, height: 4, borderRadius: 2,
                    "& .MuiLinearProgress-bar": { background: rateColor },
                    background: alpha(rateColor, 0.15),
                  }}
                />
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: rateColor, fontFamily: "monospace" }}>
                  {ordersThisMinute}/{riskConfig.maxOrdersPerMin}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
