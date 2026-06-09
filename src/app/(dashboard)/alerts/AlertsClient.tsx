"use client";

import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import NotificationsOffIcon from "@mui/icons-material/NotificationsOff";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { alpha, useTheme } from "@mui/material/styles";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";

// ── Types ──────────────────────────────────────────────────────────────────────

type AlertType   = "price_above" | "price_below" | "change_pct_up" | "change_pct_down" | "volume";
type AlertStatus = "active" | "triggered" | "paused";

interface Alert {
  id: string;
  symbol: string;
  exchange: string;
  type: AlertType;
  condition: string;
  targetValue: number;
  status: AlertStatus;
  createdAt: string;
  triggeredAt?: string;
  notifications: ("app" | "email" | "sms")[];
  triggerCount: number;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const INITIAL_ALERTS: Alert[] = [
  {
    id: "1", symbol: "RELIANCE",   exchange: "NSE", type: "price_above",      condition: "Price above ₹2,800",    targetValue: 2800,    status: "active",    createdAt: "10 Jan 2025",                  notifications: ["app", "email"], triggerCount: 0,
  },
  {
    id: "2", symbol: "TCS",        exchange: "NSE", type: "price_below",      condition: "Price below ₹3,500",    targetValue: 3500,    status: "active",    createdAt: "12 Jan 2025",                  notifications: ["app"],          triggerCount: 0,
  },
  {
    id: "3", symbol: "INFY",       exchange: "NSE", type: "change_pct_down",  condition: "Day change < -5%",      targetValue: -5,      status: "triggered", createdAt: "05 Jan 2025", triggeredAt: "09:55 AM",  notifications: ["app", "sms"],   triggerCount: 2,
  },
  {
    id: "4", symbol: "HDFCBANK",   exchange: "NSE", type: "price_above",      condition: "Price above ₹1,750",    targetValue: 1750,    status: "active",    createdAt: "14 Jan 2025",                  notifications: ["app"],          triggerCount: 0,
  },
  {
    id: "5", symbol: "BAJFINANCE", exchange: "NSE", type: "volume",            condition: "Volume > 10 Lakh",      targetValue: 1000000, status: "paused",    createdAt: "08 Jan 2025",                  notifications: ["app"],          triggerCount: 0,
  },
  {
    id: "6", symbol: "WIPRO",      exchange: "NSE", type: "change_pct_down",  condition: "Day change < -3%",      targetValue: -3,      status: "triggered", createdAt: "03 Jan 2025", triggeredAt: "11:20 AM",  notifications: ["app", "email"], triggerCount: 1,
  },
  {
    id: "7", symbol: "SBIN",       exchange: "NSE", type: "price_below",      condition: "Price below ₹800",      targetValue: 800,     status: "active",    createdAt: "15 Jan 2025",                  notifications: ["app"],          triggerCount: 0,
  },
  {
    id: "8", symbol: "ICICIBANK",  exchange: "NSE", type: "price_above",      condition: "Price above ₹1,200",    targetValue: 1200,    status: "active",    createdAt: "15 Jan 2025",                  notifications: ["app", "email"], triggerCount: 0,
  },
];

// ── Alert meta ────────────────────────────────────────────────────────────────

const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  price_above:      "Price Target",
  price_below:      "Stop Level",
  change_pct_up:    "% Gain Alert",
  change_pct_down:  "% Loss Alert",
  volume:           "Volume Alert",
};

const STATUS_META: Record<
  AlertStatus,
  { label: string; color: string; bg: string; border: string; Icon: typeof NotificationsNoneIcon }
> = {
  active:    { label: "Active",    color: "#00D97E", bg: "rgba(0,217,126,0.1)",  border: "rgba(0,217,126,0.25)",  Icon: NotificationsActiveIcon },
  triggered: { label: "Triggered", color: "#F59E0B", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)", Icon: NotificationsNoneIcon   },
  paused:    { label: "Paused",    color: "#94A3B8", bg: "rgba(148,163,184,0.1)", border: "rgba(148,163,184,0.25)", Icon: NotificationsOffIcon   },
};

// ── Create alert dialog ────────────────────────────────────────────────────────

function CreateAlertDialog({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (alert: Alert) => void;
}) {
  const [symbol,    setSymbol]    = useState("");
  const [exchange,  setExchange]  = useState("NSE");
  const [alertType, setAlertType] = useState<AlertType>("price_above");
  const [value,     setValue]     = useState("");
  const [notifs,    setNotifs]    = useState<string[]>(["app"]);

  const handleSave = () => {
    if (!symbol.trim() || !value) return;
    const num   = parseFloat(value);
    const label = alertType.includes("pct")
      ? `Day change ${alertType === "change_pct_up" ? ">" : "<"} ${value}%`
      : alertType === "volume"
      ? `Volume > ₹${Number(value).toLocaleString("en-IN")}`
      : `Price ${alertType === "price_above" ? "above" : "below"} ₹${Number(value).toLocaleString("en-IN")}`;

    onSave({
      id:           `alert_${Date.now()}`,
      symbol:       symbol.trim().toUpperCase(),
      exchange,
      type:         alertType,
      condition:    label,
      targetValue:  num,
      status:       "active",
      createdAt:    new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      notifications: notifs as ("app" | "email" | "sms")[],
      triggerCount: 0,
    });
    setSymbol(""); setValue(""); setAlertType("price_above"); setNotifs(["app"]);
    onClose();
  };

  const toggleNotif = (n: string) =>
    setNotifs((prev) => prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Create Alert</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "8px !important" }}>
        <Box sx={{ display: "flex", gap: 1 }}>
          <TextField
            label="Symbol"
            placeholder="e.g. RELIANCE"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            size="small"
            sx={{ flex: 1 }}
            slotProps={{ htmlInput: { maxLength: 20 } }}
          />
          <FormControl size="small" sx={{ minWidth: 90 }}>
            <InputLabel>Exchange</InputLabel>
            <Select value={exchange} label="Exchange" onChange={(e) => setExchange(e.target.value)}>
              <MenuItem value="NSE">NSE</MenuItem>
              <MenuItem value="BSE">BSE</MenuItem>
              <MenuItem value="NFO">NFO</MenuItem>
              <MenuItem value="MCX">MCX</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <FormControl fullWidth size="small">
          <InputLabel>Alert Type</InputLabel>
          <Select
            value={alertType}
            label="Alert Type"
            onChange={(e) => setAlertType(e.target.value as AlertType)}
          >
            <MenuItem value="price_above">Price Above (Target)</MenuItem>
            <MenuItem value="price_below">Price Below (Stop)</MenuItem>
            <MenuItem value="change_pct_up">Day % Gain Alert</MenuItem>
            <MenuItem value="change_pct_down">Day % Loss Alert</MenuItem>
            <MenuItem value="volume">Volume Alert</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label={alertType === "volume" ? "Volume (units)" : alertType.includes("pct") ? "% Value" : "Price (₹)"}
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          size="small"
          fullWidth
        />

        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.75, display: "block" }}>
            Notify via
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            {(["app", "email", "sms"] as const).map((n) => (
              <Chip
                key={n}
                label={n.charAt(0).toUpperCase() + n.slice(1)}
                size="small"
                variant={notifs.includes(n) ? "filled" : "outlined"}
                color={notifs.includes(n) ? "primary" : "default"}
                onClick={() => toggleNotif(n)}
                sx={{ cursor: "pointer", fontWeight: 600, fontSize: 11 }}
              />
            ))}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!symbol.trim() || !value}
        >
          Create Alert
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Alert card ────────────────────────────────────────────────────────────────

function AlertCard({
  alert,
  onDelete,
  onToggle,
}: {
  alert: Alert;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  const theme = useTheme();
  const meta = STATUS_META[alert.status];
  const StatusIcon = meta.Icon;
  const isUp =
    alert.type === "price_above" || alert.type === "change_pct_up";

  return (
    <Card
      variant="outlined"
      sx={{
        borderColor: alert.status === "active" ? alpha(meta.color, 0.3) : "divider",
        transition: "box-shadow 0.2s",
        "&:hover": { boxShadow: `0 4px 20px ${alpha(meta.color, 0.12)}` },
      }}
    >
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        {/* Row 1: symbol + status + actions */}
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "10px",
                bgcolor: alpha(meta.color, 0.12),
                border: `1px solid ${alpha(meta.color, 0.25)}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <StatusIcon sx={{ fontSize: 17, color: meta.color }} />
            </Box>
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <Typography sx={{ fontWeight: 800, fontSize: 14, fontFamily: "monospace" }}>
                  {alert.symbol}
                </Typography>
                <Typography
                  sx={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "text.disabled",
                    bgcolor: "action.hover",
                    px: 0.5,
                    borderRadius: 0.5,
                  }}
                >
                  {alert.exchange}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
                {ALERT_TYPE_LABELS[alert.type]}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
            <Chip
              label={meta.label}
              size="small"
              sx={{
                height: 20,
                fontSize: 10,
                fontWeight: 700,
                bgcolor: meta.bg,
                color: meta.color,
                border: `1px solid ${meta.border}`,
              }}
            />
            <Tooltip title={alert.status === "paused" ? "Resume" : "Pause"}>
              <IconButton size="small" onClick={() => onToggle(alert.id)} sx={{ opacity: 0.6 }}>
                {alert.status === "paused" ? (
                  <NotificationsActiveIcon sx={{ fontSize: 16 }} />
                ) : (
                  <NotificationsOffIcon sx={{ fontSize: 16 }} />
                )}
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete alert">
              <IconButton
                size="small"
                onClick={() => onDelete(alert.id)}
                sx={{ opacity: 0.5, "&:hover": { color: "error.main", opacity: 1 } }}
              >
                <DeleteOutlineIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Row 2: condition */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            py: 0.75,
            px: 1.25,
            borderRadius: 1,
            bgcolor: "action.hover",
            mb: 1.25,
          }}
        >
          {isUp ? (
            <TrendingUpIcon sx={{ fontSize: 14, color: "success.main" }} />
          ) : (
            <TrendingDownIcon sx={{ fontSize: 14, color: "error.main" }} />
          )}
          <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>
            {alert.condition}
          </Typography>
        </Box>

        {/* Row 3: meta info */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", gap: 0.5 }}>
            {alert.notifications.map((n) => (
              <Chip
                key={n}
                label={n}
                size="small"
                sx={{
                  height: 16,
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  color: "primary.main",
                  letterSpacing: "0.04em",
                }}
              />
            ))}
          </Box>
          <Box sx={{ textAlign: "right" }}>
            {alert.triggeredAt ? (
              <Typography sx={{ fontSize: 10.5, color: "warning.main", fontWeight: 600 }}>
                Triggered at {alert.triggeredAt}
              </Typography>
            ) : (
              <Typography sx={{ fontSize: 10.5, color: "text.disabled" }}>
                Created {alert.createdAt}
              </Typography>
            )}
            {alert.triggerCount > 0 && (
              <Typography sx={{ fontSize: 10, color: "text.disabled" }}>
                {alert.triggerCount} trigger{alert.triggerCount !== 1 ? "s" : ""}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AlertsClient() {
  const [alerts, setAlerts]     = useState<Alert[]>(INITIAL_ALERTS);
  const [createOpen, setCreate] = useState(false);
  const [activeTab, setTab]     = useState(0);

  const stats = {
    total:    alerts.length,
    active:   alerts.filter((a) => a.status === "active").length,
    triggered:alerts.filter((a) => a.status === "triggered").length,
    paused:   alerts.filter((a) => a.status === "paused").length,
  };

  const filtered =
    activeTab === 0
      ? alerts
      : activeTab === 1
      ? alerts.filter((a) => a.status === "active")
      : activeTab === 2
      ? alerts.filter((a) => a.status === "triggered")
      : alerts.filter((a) => a.status === "paused");

  const handleDelete = (id: string) => setAlerts((prev) => prev.filter((a) => a.id !== id));

  const handleToggle = (id: string) =>
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, status: a.status === "paused" ? "active" : "paused" }
          : a,
      ),
    );

  const handleCreate = (alert: Alert) => setAlerts((prev) => [alert, ...prev]);

  return (
    <>
      <PageHeader
        title="Alerts"
        subtitle="Real-time price and volume notifications"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Alerts" }]}
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreate(true)}
            size="small"
          >
            New Alert
          </Button>
        }
      />

      {/* KPI strip */}
      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        {[
          { title: "Total Alerts",    value: stats.total,     iconColor: "#6366F1" },
          { title: "Active",          value: stats.active,    iconColor: "#00D97E" },
          { title: "Triggered Today", value: stats.triggered, iconColor: "#F59E0B" },
          { title: "Paused",          value: stats.paused,    iconColor: "#94A3B8" },
        ].map((s) => (
          <Grid key={s.title} size={{ xs: 6, sm: 3 }}>
            <StatCard title={s.title} value={s.value} iconColor={s.iconColor} />
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Box sx={{ mb: 2, borderBottom: "1px solid", borderColor: "divider" }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setTab(v)}
          sx={{
            minHeight: 40,
            "& .MuiTab-root": { minHeight: 40, fontSize: 13, fontWeight: 600, textTransform: "none" },
          }}
        >
          <Tab label={`All (${stats.total})`} />
          <Tab label={`Active (${stats.active})`} />
          <Tab label={`Triggered (${stats.triggered})`} />
          <Tab label={`Paused (${stats.paused})`} />
        </Tabs>
      </Box>

      {/* Alert cards */}
      {filtered.length === 0 ? (
        <Box
          sx={{
            py: 8,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1.5,
            color: "text.disabled",
          }}
        >
          <NotificationsNoneIcon sx={{ fontSize: 48, opacity: 0.4 }} />
          <Typography variant="body2">No alerts in this category.</Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setCreate(true)}
          >
            Create Alert
          </Button>
        </Box>
      ) : (
        <Grid container spacing={1.5}>
          {filtered.map((alert) => (
            <Grid key={alert.id} size={{ xs: 12, sm: 6, lg: 4 }}>
              <AlertCard alert={alert} onDelete={handleDelete} onToggle={handleToggle} />
            </Grid>
          ))}
        </Grid>
      )}

      <CreateAlertDialog
        open={createOpen}
        onClose={() => setCreate(false)}
        onSave={handleCreate}
      />
    </>
  );
}
