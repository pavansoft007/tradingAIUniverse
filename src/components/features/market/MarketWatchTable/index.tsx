"use client";

import AddIcon from "@mui/icons-material/Add";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
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
import { useMemo, useState } from "react";
import { ConnectionStatus } from "@/components/features/market/ConnectionStatus";
import { PriceCell } from "@/components/features/market/PriceCell";
import { useConnectionStatus, useWatchlistActions, useWatchlistQuotes, useWatchlistTicks } from "@/hooks/useMarketWatch";
import type { AngelQuote } from "@/types/angel-portfolio.types";
import type { Tick, WatchlistItem } from "@/types/smartws.types";
import { EXCHANGE_LABEL, EXCHANGE_TYPE, WS_MODE } from "@/types/smartws.types";

const isValidPrice = (p: number | undefined): p is number => typeof p === "number" && p > 0 && p < 200_000;

function mergeTickWithQuote(tick: Tick | undefined, quote: AngelQuote | undefined): Tick | undefined {
  if (tick && isValidPrice(tick.ltp)) return tick;
  if (!quote?.ltp || !isValidPrice(quote.ltp)) return undefined;
  return {
    ...(tick ?? {} as Tick),
    ltp:               quote.ltp,
    open:              isValidPrice(quote.open)   ? quote.open   : undefined,
    high:              isValidPrice(quote.high)   ? quote.high   : undefined,
    low:               isValidPrice(quote.low)    ? quote.low    : undefined,
    close:             isValidPrice(quote.close)  ? quote.close  : undefined,
    volumeTradedToday: quote.volume,
  } as Tick;
}

// ── Formatters ────────────────────────────────────────────────────────────────

function fmtPrice(p: number) {
  return `₹${p.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtVolume(v: number) {
  if (v >= 10_000_000) return `${(v / 10_000_000).toFixed(2)} Cr`;
  if (v >= 100_000)    return `${(v / 100_000).toFixed(2)} L`;
  return v.toLocaleString("en-IN");
}

// ── Sort ──────────────────────────────────────────────────────────────────────

type SortField = "symbol" | "ltp" | "change" | "volume";
type SortDir   = "asc" | "desc";

function SortableHeader({
  field,
  label,
  sortField,
  sortDir,
  onSort,
  align = "left",
  minWidth,
  hidden,
}: {
  field: SortField;
  label: string;
  sortField: SortField;
  sortDir: SortDir;
  onSort: (f: SortField) => void;
  align?: "left" | "right";
  minWidth?: number;
  hidden?: boolean;
}) {
  const active = field === sortField;
  const SortIcon = sortDir === "asc" ? ArrowUpwardIcon : ArrowDownwardIcon;

  return (
    <TableCell
      align={align}
      onClick={() => onSort(field)}
      sx={{
        fontWeight: 700,
        minWidth:
          minWidth ??
          (field === "symbol" ? 120 : field === "change" ? 140 : 90),
        cursor: "pointer",
        userSelect: "none",
        "&:hover": { bgcolor: "action.hover" },
        ...(hidden && { display: { xs: "none", lg: "table-cell" } }),
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.25,
          justifyContent: align === "right" ? "flex-end" : "flex-start",
        }}
      >
        {label}
        {active ? (
          <SortIcon sx={{ fontSize: 13, color: "text.secondary" }} />
        ) : (
          <Box sx={{ width: 13 }} />
        )}
      </Box>
    </TableCell>
  );
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
          <IconButton
            size="small"
            onClick={() => onRemove(item.token)}
            sx={{ opacity: 0.5, "&:hover": { opacity: 1, color: "error.main" } }}
          >
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
    onAdd({
      symbol:       symbol.trim().toUpperCase(),
      token:        token.trim(),
      exchangeType: Number(exchange) as WatchlistItem["exchangeType"],
    });
    setSymbol("");
    setToken("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Add to Watchlist</DialogTitle>
      <DialogContent
        sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "12px !important" }}
      >
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
        <Button
          variant="contained"
          onClick={handleAdd}
          disabled={!symbol.trim() || !token.trim()}
        >
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main table ────────────────────────────────────────────────────────────────

const tickKey = (exchangeType: number, token: string) => `${exchangeType}_${token}`;

export function MarketWatchTable() {
  const [addOpen, setAddOpen]     = useState(false);
  const [sortField, setSortField] = useState<SortField>("symbol");
  const [sortDir, setSortDir]     = useState<SortDir>("asc");

  const connectionStatus                    = useConnectionStatus();
  const { watchlist, ticks }                = useWatchlistTicks(WS_MODE.QUOTE);
  const { addToWatchlist, removeFromWatchlist } = useWatchlistActions();
  const restQuotes                          = useWatchlistQuotes();

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const effectiveTicks = useMemo(() => {
    const merged: Record<string, Tick | undefined> = {};
    watchlist.forEach((item) => {
      const key = tickKey(item.exchangeType, item.token);
      merged[key] = mergeTickWithQuote(ticks[key], restQuotes.get(item.token));
    });
    return merged;
  }, [watchlist, ticks, restQuotes]);

  const sortedWatchlist = useMemo(() => {
    return [...watchlist].sort((a, b) => {
      const ta = effectiveTicks[tickKey(a.exchangeType, a.token)];
      const tb = effectiveTicks[tickKey(b.exchangeType, b.token)];

      if (sortField === "symbol") {
        const cmp = a.symbol.localeCompare(b.symbol);
        return sortDir === "asc" ? cmp : -cmp;
      }

      let va = 0;
      let vb = 0;
      if (sortField === "ltp") {
        va = ta?.ltp ?? 0;
        vb = tb?.ltp ?? 0;
      } else if (sortField === "change") {
        va = ta?.close ? ((ta.ltp - ta.close) / ta.close) * 100 : 0;
        vb = tb?.close ? ((tb.ltp - tb.close) / tb.close) * 100 : 0;
      } else if (sortField === "volume") {
        va = ta?.volumeTradedToday ?? 0;
        vb = tb?.volumeTradedToday ?? 0;
      }
      return sortDir === "asc" ? va - vb : vb - va;
    });
  }, [watchlist, effectiveTicks, sortField, sortDir]);

  // Market breadth
  const breadth = useMemo(() => {
    return watchlist.reduce(
      (acc, item) => {
        const tick = effectiveTicks[tickKey(item.exchangeType, item.token)];
        if (!tick?.close || tick.close === 0) return acc;
        const change = tick.ltp - tick.close;
        if (change > 0) acc.gainers++;
        else if (change < 0) acc.losers++;
        else acc.unchanged++;
        return acc;
      },
      { gainers: 0, losers: 0, unchanged: 0 },
    );
  }, [watchlist, effectiveTicks]);

  const breadthTotal = breadth.gainers + breadth.losers + breadth.unchanged;

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="h6" fontWeight={700}>
            Market Watch
          </Typography>
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

      {/* Market breadth bar */}
      {breadthTotal > 0 && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            mb: 1.5,
            px: 1.5,
            py: 0.75,
            borderRadius: 1,
            bgcolor: "action.hover",
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <TrendingUpIcon sx={{ fontSize: 13, color: "success.main" }} />
            <Typography variant="caption" fontWeight={700} color="success.main">
              {breadth.gainers}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <TrendingDownIcon sx={{ fontSize: 13, color: "error.main" }} />
            <Typography variant="caption" fontWeight={700} color="error.main">
              {breadth.losers}
            </Typography>
          </Box>
          {breadth.unchanged > 0 && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <TrendingFlatIcon sx={{ fontSize: 13, color: "text.secondary" }} />
              <Typography variant="caption" fontWeight={700} color="text.secondary">
                {breadth.unchanged}
              </Typography>
            </Box>
          )}
          <Box
            sx={{
              flex: 1,
              minWidth: 80,
              height: 5,
              borderRadius: 3,
              overflow: "hidden",
              bgcolor: "divider",
              display: "flex",
            }}
          >
            {breadth.gainers > 0 && (
              <Box
                sx={{
                  width: `${(breadth.gainers / breadthTotal) * 100}%`,
                  bgcolor: "success.main",
                }}
              />
            )}
            {breadth.unchanged > 0 && (
              <Box
                sx={{
                  width: `${(breadth.unchanged / breadthTotal) * 100}%`,
                  bgcolor: "grey.500",
                }}
              />
            )}
            {breadth.losers > 0 && (
              <Box
                sx={{
                  width: `${(breadth.losers / breadthTotal) * 100}%`,
                  bgcolor: "error.main",
                }}
              />
            )}
          </Box>
          <Typography variant="caption" color="text.disabled">
            {breadthTotal} tracked
          </Typography>
        </Box>
      )}

      {/* Table */}
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <SortableHeader
                field="symbol"
                label="Symbol"
                sortField={sortField}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <SortableHeader
                field="ltp"
                label="LTP"
                sortField={sortField}
                sortDir={sortDir}
                onSort={handleSort}
                align="right"
                minWidth={110}
              />
              <SortableHeader
                field="change"
                label="Change"
                sortField={sortField}
                sortDir={sortDir}
                onSort={handleSort}
                align="right"
              />
              <SortableHeader
                field="volume"
                label="Volume"
                sortField={sortField}
                sortDir={sortDir}
                onSort={handleSort}
                align="right"
              />
              <TableCell
                align="right"
                sx={{
                  fontWeight: 700,
                  minWidth: 90,
                  display: { xs: "none", lg: "table-cell" },
                }}
              >
                Open
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  fontWeight: 700,
                  minWidth: 90,
                  display: { xs: "none", lg: "table-cell" },
                }}
              >
                High
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  fontWeight: 700,
                  minWidth: 90,
                  display: { xs: "none", lg: "table-cell" },
                }}
              >
                Low
              </TableCell>
              <TableCell sx={{ width: 40 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {connectionStatus === "connecting" || connectionStatus === "reconnecting" ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={24} sx={{ mr: 1.5 }} />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    component="span"
                  >
                    {connectionStatus === "reconnecting"
                      ? "Reconnecting to feed…"
                      : "Connecting to live feed…"}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              sortedWatchlist.map((item) => (
                <WatchRow
                  key={item.token}
                  item={item}
                  tick={effectiveTicks[tickKey(item.exchangeType, item.token)]}
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
