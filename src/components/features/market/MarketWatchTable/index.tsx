"use client";

import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingFlatIcon from "@mui/icons-material/TrendingFlat";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { ConnectionStatus } from "@/components/features/market/ConnectionStatus";
import { PriceCell } from "@/components/features/market/PriceCell";
import { useConnectionStatus, useWatchlistActions, useWatchlistTicks } from "@/hooks/useMarketWatch";
import type { Tick, WatchlistItem } from "@/types/smartws.types";
import { EXCHANGE_LABEL, EXCHANGE_TYPE, WS_MODE } from "@/types/smartws.types";

// ── Formatters ────────────────────────────────────────────────────────────────

function fmtPrice(p: number) {
  return `₹${p.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtVolume(v: number) {
  if (v >= 10_000_000) return `${(v / 10_000_000).toFixed(2)} Cr`;
  if (v >= 100_000)    return `${(v / 100_000).toFixed(2)} L`;
  return v.toLocaleString("en-IN");
}

// ── Row ───────────────────────────────────────────────────────────────────────

function ChangeCell({ tick }: { tick: Tick | undefined }) {
  if (!tick?.close || tick.close === 0) return <TableCell align="right">—</TableCell>;
  const change    = tick.ltp - tick.close;
  const changePct = (change / tick.close) * 100;
  const isUp      = change > 0;
  const isFlat    = change === 0;
  const color     = isFlat ? "text.secondary" : isUp ? "success.main" : "error.main";
  const Icon      = isFlat ? TrendingFlatIcon : isUp ? TrendingUpIcon : TrendingDownIcon;

  return (
    <TableCell align="right">
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5 }}>
        <Icon sx={{ fontSize: 14, color }} />
        <Typography variant="body2" color={color} fontWeight={600}>
          {isUp ? "+" : ""}
          {change.toFixed(2)}
        </Typography>
        <Chip
          label={`${isUp ? "+" : ""}${changePct.toFixed(2)}%`}
          size="small"
          color={isFlat ? "default" : isUp ? "success" : "error"}
          sx={{ height: 18, fontSize: 10, fontWeight: 700, ml: 0.25 }}
        />
      </Box>
    </TableCell>
  );
}

interface WatchRowProps {
  item: WatchlistItem;
  tick: Tick | undefined;
  onRemove: (token: string) => void;
}

function WatchRow({ item, tick, onRemove }: WatchRowProps) {
  const loading = !tick;

  return (
    <TableRow hover sx={{ "&:last-child td": { border: 0 } }}>
      {/* Symbol */}
      <TableCell>
        <Box>
          <Typography variant="body2" fontWeight={700}>{item.symbol}</Typography>
          <Typography variant="caption" color="text.secondary">
            {EXCHANGE_LABEL[item.exchangeType] ?? "—"}
          </Typography>
        </Box>
      </TableCell>

      {/* LTP */}
      <TableCell align="right">
        {loading ? (
          <Skeleton width={72} height={20} sx={{ ml: "auto" }} />
        ) : (
          <PriceCell price={tick?.ltp} prevClose={tick?.close} formatFn={fmtPrice} />
        )}
      </TableCell>

      {/* Change */}
      {loading ? (
        <TableCell align="right">
          <Skeleton width={80} height={20} sx={{ ml: "auto" }} />
        </TableCell>
      ) : (
        <ChangeCell tick={tick} />
      )}

      {/* Volume */}
      <TableCell align="right">
        {loading ? (
          <Skeleton width={60} height={20} sx={{ ml: "auto" }} />
        ) : (
          <Typography variant="body2" color="text.secondary">
            {tick?.volumeTradedToday !== undefined ? fmtVolume(tick.volumeTradedToday) : "—"}
          </Typography>
        )}
      </TableCell>

      {/* Open / High / Low */}
      {(["open", "high", "low"] as const).map((field) => (
        <TableCell key={field} align="right" sx={{ display: { xs: "none", lg: "table-cell" } }}>
          {loading ? (
            <Skeleton width={56} height={20} sx={{ ml: "auto" }} />
          ) : (
            <Typography variant="body2" color="text.secondary" fontFamily="monospace">
              {tick?.[field] !== undefined ? fmtPrice(tick[field]!) : "—"}
            </Typography>
          )}
        </TableCell>
      ))}

      {/* Remove */}
      <TableCell align="center" sx={{ width: 40, pr: 1 }}>
        <Tooltip title="Remove from watchlist">
          <IconButton size="small" onClick={() => onRemove(item.token)} sx={{ opacity: 0.5, "&:hover": { opacity: 1, color: "error.main" } }}>
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
}

// ── Add token dialog ──────────────────────────────────────────────────────────

const NSE_CM_VALUE = String(EXCHANGE_TYPE.NSE_CM);

function AddTokenDialog({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (item: WatchlistItem) => void;
}) {
  const [symbol, setSymbol]     = useState("");
  const [token, setToken]       = useState("");
  const [exchange, setExchange] = useState(NSE_CM_VALUE);

  const handleAdd = () => {
    if (!symbol.trim() || !token.trim()) return;
    onAdd({ symbol: symbol.trim().toUpperCase(), token: token.trim(), exchangeType: Number(exchange) as WatchlistItem["exchangeType"] });
    setSymbol(""); setToken("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Add to Watchlist</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "12px !important" }}>
        <TextField
          label="Symbol"
          placeholder="e.g. RELIANCE"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          size="small"
          slotProps={{ htmlInput: { maxLength: 20 } }}
        />
        <TextField
          label="Angel One Token"
          placeholder="e.g. 2885"
          value={token}
          onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
          size="small"
          helperText="Find token IDs in the Angel One SmartAPI instrument list"
        />
        <TextField
          select
          label="Exchange"
          value={exchange}
          onChange={(e) => setExchange(e.target.value)}
          size="small"
        >
          {Object.entries(EXCHANGE_LABEL).map(([val, label]) => (
            <MenuItem key={val} value={val}>{label}</MenuItem>
          ))}
        </TextField>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleAdd} disabled={!symbol.trim() || !token.trim()}>
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main table ────────────────────────────────────────────────────────────────

export function MarketWatchTable() {
  const [addOpen, setAddOpen] = useState(false);
  const connectionStatus = useConnectionStatus();
  const { watchlist, ticks } = useWatchlistTicks(WS_MODE.QUOTE);
  const { addToWatchlist, removeFromWatchlist } = useWatchlistActions();

  const tickKey = (exchangeType: number, token: string) => `${exchangeType}_${token}`;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="h6" fontWeight={700}>Market Watch</Typography>
          <ConnectionStatus status={connectionStatus} />
        </Box>
        <Button
          size="small"
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => setAddOpen(true)}
        >
          Add Symbol
        </Button>
      </Box>

      {/* Table */}
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, minWidth: 120 }}>Symbol</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, minWidth: 110 }}>LTP</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, minWidth: 140 }}>Change</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, minWidth: 90 }}>Volume</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, minWidth: 90, display: { xs: "none", lg: "table-cell" } }}>Open</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, minWidth: 90, display: { xs: "none", lg: "table-cell" } }}>High</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, minWidth: 90, display: { xs: "none", lg: "table-cell" } }}>Low</TableCell>
              <TableCell sx={{ width: 40 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {connectionStatus === "connecting" || connectionStatus === "reconnecting" ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={24} sx={{ mr: 1.5 }} />
                  <Typography variant="body2" color="text.secondary" component="span">
                    {connectionStatus === "reconnecting" ? "Reconnecting to feed…" : "Connecting to live feed…"}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              watchlist.map((item) => (
                <WatchRow
                  key={item.token}
                  item={item}
                  tick={ticks[tickKey(item.exchangeType, item.token)]}
                  onRemove={removeFromWatchlist}
                />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <AddTokenDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={addToWatchlist}
      />
    </Box>
  );
}
