"use client";

import TrendingUpIcon   from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import Alert            from "@mui/material/Alert";
import Box              from "@mui/material/Box";
import Button           from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog           from "@mui/material/Dialog";
import DialogActions    from "@mui/material/DialogActions";
import DialogContent    from "@mui/material/DialogContent";
import DialogTitle      from "@mui/material/DialogTitle";
import Divider          from "@mui/material/Divider";
import FormControl      from "@mui/material/FormControl";
import FormHelperText   from "@mui/material/FormHelperText";
import Grid             from "@mui/material/Grid";
import InputAdornment   from "@mui/material/InputAdornment";
import InputLabel       from "@mui/material/InputLabel";
import MenuItem         from "@mui/material/MenuItem";
import Select           from "@mui/material/Select";
import Tab              from "@mui/material/Tab";
import Tabs             from "@mui/material/Tabs";
import TextField        from "@mui/material/TextField";
import ToggleButton     from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip          from "@mui/material/Tooltip";
import Typography       from "@mui/material/Typography";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ScripSearch }        from "@/components/features/trading/ScripSearch";
import { validateOrder, buildOrderSummary } from "@/lib/orders/validator";
import { defaultOrderFormValues } from "@/lib/orders/executor";
import { useOrderEngine }     from "@/hooks/useOrderEngine";
import { useOrderStore }      from "@/store/useOrderStore";
import {
  ANGEL_DURATION,
  ANGEL_EXCHANGE,
  ANGEL_ORDER_TYPE,
  ANGEL_PRODUCT_TYPE,
  type OrderFormValues,
} from "@/types/angel-order.types";
import type { ScripSearchResult } from "@/lib/api/angelone/scrip.api";

// ── Option lists ──────────────────────────────────────────────────────────────

const ORDER_TYPE_OPTS = [
  { value: ANGEL_ORDER_TYPE.MARKET,          label: "Market" },
  { value: ANGEL_ORDER_TYPE.LIMIT,           label: "Limit" },
  { value: ANGEL_ORDER_TYPE.STOPLOSS_LIMIT,  label: "SL-Limit" },
  { value: ANGEL_ORDER_TYPE.STOPLOSS_MARKET, label: "SL-Market" },
] as const;

const PRODUCT_OPTS = [
  { value: ANGEL_PRODUCT_TYPE.INTRADAY,     label: "MIS (Intraday)" },
  { value: ANGEL_PRODUCT_TYPE.DELIVERY,     label: "CNC (Delivery)" },
  { value: ANGEL_PRODUCT_TYPE.CARRYFORWARD, label: "NRML (F&O)" },
] as const;

const DURATION_OPTS = [
  { value: ANGEL_DURATION.DAY, label: "DAY" },
  { value: ANGEL_DURATION.IOC, label: "IOC" },
] as const;

const fmt = (n: number) =>
  n.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

// ── Confirm dialog ────────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  open:          boolean;
  values:        OrderFormValues;
  ltp?:          number;
  riskWarnings:  string[];
  riskBlocked:   boolean;
  blockReason:   string | null;
  onOk:          () => void;
  onCancel:      () => void;
}

function ConfirmDialog({
  open, values, ltp, riskWarnings, riskBlocked, blockReason, onOk, onCancel,
}: ConfirmDialogProps) {
  const { estimatedValue, marginRequired, slippageNote } = buildOrderSummary(values, ltp);
  const isBuy = values.transactiontype === "BUY";

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        Confirm {isBuy ? "Buy" : "Sell"} Order
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {[
            ["Symbol",       values.tradingsymbol],
            ["Exchange",     values.exchange],
            ["Order Type",   values.ordertype],
            ["Product",      values.producttype],
            ["Quantity",     values.quantity.toString()],
            ["Price",        values.ordertype === ANGEL_ORDER_TYPE.MARKET ? "Market" : fmt(values.price)],
            ...(values.triggerprice > 0 ? [["Trigger Price", fmt(values.triggerprice)]] : []),
            ["Est. Value",   fmt(estimatedValue)],
            ["Margin Reqd.", fmt(marginRequired)],
          ].map(([label, val]) => (
            <Box key={label} sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">{label}</Typography>
              <Typography variant="body2" fontWeight={600}>{val}</Typography>
            </Box>
          ))}

          {slippageNote && (
            <Alert severity="info" sx={{ py: 0.5, fontSize: "0.75rem" }}>{slippageNote}</Alert>
          )}

          {riskWarnings.map((w, i) => (
            <Alert key={i} severity="warning" sx={{ py: 0.5, fontSize: "0.75rem" }}>{w}</Alert>
          ))}

          {riskBlocked && (
            <Alert severity="error" sx={{ py: 0.5 }}>
              <Typography variant="body2" fontWeight={700}>Order Blocked</Typography>
              <Typography variant="caption">{blockReason}</Typography>
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} color="inherit">Cancel</Button>
        <Button
          onClick={onOk}
          variant="contained"
          color={isBuy ? "success" : "error"}
          disabled={riskBlocked}
          disableElevation
        >
          {riskBlocked ? "Blocked" : `Confirm ${isBuy ? "Buy" : "Sell"}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

interface OrderPanelProps {
  symbol?:      string;
  symboltoken?: string;
  exchange?:    string;
  ltp?:         number;
}

export function OrderPanel({ symbol, symboltoken, exchange, ltp }: OrderPanelProps) {
  const [values, setValues] = useState<OrderFormValues>(() =>
    defaultOrderFormValues({
      tradingsymbol: symbol      ?? "",
      symboltoken:   symboltoken ?? "",
      exchange:      (exchange as OrderFormValues["exchange"]) ?? ANGEL_EXCHANGE.NSE,
    }),
  );
  const [errors,      setErrors]      = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { submitOrder, riskPreview, isPlacing } = useOrderEngine();
  const placingError = useOrderStore((s) => s.placingError);

  // Sync external symbol props
  useEffect(() => {
    if (symbol)      setValues((v) => ({ ...v, tradingsymbol: symbol }));
    if (symboltoken) setValues((v) => ({ ...v, symboltoken }));
    if (exchange)    setValues((v) => ({ ...v, exchange: exchange as OrderFormValues["exchange"] }));
  }, [symbol, symboltoken, exchange]);

  const set = useCallback(
    <K extends keyof OrderFormValues>(key: K, val: OrderFormValues[K]) => {
      setValues((prev) => ({ ...prev, [key]: val }));
      setErrors((prev) => { const e = { ...prev }; delete e[key]; return e; });
    },
    [],
  );

  const handleScripSelect = useCallback((scrip: ScripSearchResult) => {
    setValues((prev) => ({
      ...prev,
      tradingsymbol: scrip.tradingsymbol,
      symboltoken:   scrip.symboltoken,
      exchange:      scrip.exchange,
    }));
    setErrors((prev) => {
      const e = { ...prev };
      delete e.tradingsymbol;
      delete e.symboltoken;
      return e;
    });
  }, []);

  const isMarket  = values.ordertype === ANGEL_ORDER_TYPE.MARKET;
  const isSLOrder =
    values.ordertype === ANGEL_ORDER_TYPE.STOPLOSS_LIMIT ||
    values.ordertype === ANGEL_ORDER_TYPE.STOPLOSS_MARKET;

  const estimatedValue = useMemo(() => {
    const price = isMarket ? (ltp ?? 0) : values.price;
    return price * values.quantity;
  }, [isMarket, ltp, values.price, values.quantity]);

  // Live risk preview
  const risk = useMemo(() => {
    if (!values.tradingsymbol) return null;
    return riskPreview(values);
  }, [riskPreview, values]);

  const handleSubmit = () => {
    const result = validateOrder(values);
    if (!result.valid) {
      setErrors(result.errors);
      return;
    }
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    setConfirmOpen(false);
    await submitOrder(values, { source: "manual" });
  };

  const isBuy = values.transactiontype === "BUY";
  const btnColor = isBuy ? "success" : "error";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* BUY / SELL tabs */}
      <Tabs
        value={isBuy ? 0 : 1}
        onChange={(_, v) => set("transactiontype", v === 0 ? "BUY" : "SELL")}
        variant="fullWidth"
        sx={{
          "& .MuiTab-root":  { fontWeight: 700, fontSize: "0.875rem" },
          "& .Mui-selected": { color: isBuy ? "success.main" : "error.main" },
          "& .MuiTabs-indicator": { backgroundColor: isBuy ? "success.main" : "error.main" },
        }}
      >
        <Tab icon={<TrendingUpIcon fontSize="small" />}   iconPosition="start" label="BUY" />
        <Tab icon={<TrendingDownIcon fontSize="small" />} iconPosition="start" label="SELL" />
      </Tabs>

      <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
        <Grid container spacing={2}>
          {/* Symbol — autocomplete scrip search */}
          <Grid size={8}>
            <ScripSearch
              exchange={values.exchange}
              value={values.tradingsymbol}
              error={errors.tradingsymbol || errors.symboltoken}
              onSelect={handleScripSelect}
            />
          </Grid>

          {/* Exchange */}
          <Grid size={4}>
            <FormControl size="small" fullWidth>
              <InputLabel>Exchange</InputLabel>
              <Select
                label="Exchange"
                value={values.exchange}
                onChange={(e) => set("exchange", e.target.value as OrderFormValues["exchange"])}
              >
                {Object.values(ANGEL_EXCHANGE).map((ex) => (
                  <MenuItem key={ex} value={ex}>{ex}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Order Type */}
          <Grid size={12}>
            <ToggleButtonGroup
              exclusive
              fullWidth
              size="small"
              value={values.ordertype}
              onChange={(_, v) => v && set("ordertype", v)}
            >
              {ORDER_TYPE_OPTS.map((o) => (
                <ToggleButton key={o.value} value={o.value} sx={{ fontSize: "0.7rem", py: 0.75 }}>
                  {o.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Grid>

          {/* Quantity */}
          <Grid size={6}>
            <TextField
              label="Quantity"
              size="small"
              fullWidth
              type="number"
              value={values.quantity}
              onChange={(e) => set("quantity", parseInt(e.target.value, 10) || 0)}
              error={!!errors.quantity}
              helperText={errors.quantity}
              inputProps={{ min: 1, step: 1 }}
            />
          </Grid>

          {/* Price */}
          <Grid size={6}>
            <TextField
              label="Price"
              size="small"
              fullWidth
              type="number"
              disabled={isMarket}
              value={isMarket ? "" : values.price}
              onChange={(e) => set("price", parseFloat(e.target.value) || 0)}
              error={!!errors.price}
              helperText={isMarket ? "Market price" : errors.price}
              InputProps={{
                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
              }}
              inputProps={{ min: 0, step: 0.05 }}
            />
          </Grid>

          {/* Trigger price (SL orders only) */}
          {isSLOrder && (
            <Grid size={6}>
              <TextField
                label="Trigger Price"
                size="small"
                fullWidth
                type="number"
                value={values.triggerprice}
                onChange={(e) => set("triggerprice", parseFloat(e.target.value) || 0)}
                error={!!errors.triggerprice}
                helperText={errors.triggerprice}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
                inputProps={{ min: 0, step: 0.05 }}
              />
            </Grid>
          )}

          {/* Product type */}
          <Grid size={isSLOrder ? 6 : 12}>
            <FormControl size="small" fullWidth error={!!errors.producttype}>
              <InputLabel>Product</InputLabel>
              <Select
                label="Product"
                value={values.producttype}
                onChange={(e) => set("producttype", e.target.value as OrderFormValues["producttype"])}
              >
                {PRODUCT_OPTS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                ))}
              </Select>
              {errors.producttype && <FormHelperText>{errors.producttype}</FormHelperText>}
            </FormControl>
          </Grid>

          {/* Validity */}
          <Grid size={6}>
            <FormControl size="small" fullWidth>
              <InputLabel>Validity</InputLabel>
              <Select
                label="Validity"
                value={values.duration}
                onChange={(e) => set("duration", e.target.value as OrderFormValues["duration"])}
              >
                {DURATION_OPTS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Estimated value */}
          <Grid size={6}>
            <Box
              sx={{
                border:       "1px solid",
                borderColor:  "divider",
                borderRadius: 1,
                px: 1.5, py: 0.75,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <Typography variant="caption" color="text.secondary">Est. Value</Typography>
              <Typography variant="body2" fontWeight={700}>
                {fmt(estimatedValue)}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Risk warnings */}
        {risk?.warnings.map((w, i) => (
          <Alert key={i} severity="warning" sx={{ mt: 1.5, py: 0.5, fontSize: "0.73rem" }}>
            {w}
          </Alert>
        ))}

        {/* Risk blocked indicator */}
        {risk?.blocked && (
          <Alert severity="error" sx={{ mt: 1.5, py: 0.5, fontSize: "0.73rem" }}>
            {risk.reason}
          </Alert>
        )}

        {/* Server error */}
        {placingError && (
          <Alert severity="error" sx={{ mt: 1.5 }}>{placingError}</Alert>
        )}
      </Box>

      {/* Footer */}
      <Divider />
      <Box sx={{ p: 2 }}>
        <Tooltip
          title={risk?.blocked ? (risk.reason ?? "Order blocked by risk guard") : ""}
          placement="top"
        >
          <span style={{ display: "block" }}>
            <Button
              variant="contained"
              fullWidth
              size="large"
              color={btnColor}
              disableElevation
              disabled={isPlacing || (risk?.blocked ?? false)}
              onClick={handleSubmit}
              startIcon={isPlacing ? <CircularProgress size={16} color="inherit" /> : undefined}
              sx={{
                fontWeight: 700,
                background: risk?.blocked
                  ? undefined
                  : isBuy
                  ? "linear-gradient(135deg, #00D97E, #00b367)"
                  : "linear-gradient(135deg, #F23645, #c71c2c)",
              }}
            >
              {isPlacing
                ? "Placing…"
                : risk?.blocked
                ? "Risk Blocked"
                : `${isBuy ? "Buy" : "Sell"} ${values.tradingsymbol || "Order"}`}
            </Button>
          </span>
        </Tooltip>
      </Box>

      <ConfirmDialog
        open={confirmOpen}
        values={values}
        ltp={ltp}
        riskWarnings={risk?.warnings ?? []}
        riskBlocked={risk?.blocked ?? false}
        blockReason={risk?.reason ?? null}
        onOk={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </Box>
  );
}
