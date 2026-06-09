"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import TrendingUpIcon   from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import { validateOrder, buildOrderSummary } from "@/lib/orders/validator";
import { defaultOrderFormValues } from "@/lib/orders/executor";
import { usePlaceOrder } from "@/hooks/useAngelOrders";
import { useOrderStore } from "@/store/useOrderStore";
import {
  ANGEL_DURATION,
  ANGEL_EXCHANGE,
  ANGEL_ORDER_TYPE,
  ANGEL_PRODUCT_TYPE,
  type OrderFormValues,
} from "@/types/angel-order.types";

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

// ── Confirmation dialog ───────────────────────────────────────────────────────

interface ConfirmDialogProps {
  open:    boolean;
  values:  OrderFormValues;
  ltp?:    number;
  onOk:    () => void;
  onCancel:() => void;
}

function ConfirmDialog({ open, values, ltp, onOk, onCancel }: ConfirmDialogProps) {
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
            <Alert severity="info" sx={{ py: 0.5, fontSize: "0.75rem" }}>
              {slippageNote}
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
          disableElevation
        >
          Confirm {isBuy ? "Buy" : "Sell"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

interface OrderPanelProps {
  /** Pre-fill symbol when a watchlist row is clicked */
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

  const { mutate: placeOrder } = usePlaceOrder();
  const isPlacing = useOrderStore((s) => s.isPlacing);
  const placingError = useOrderStore((s) => s.placingError);

  // Sync symbol props → form if they change externally
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

  const isMarket  = values.ordertype === ANGEL_ORDER_TYPE.MARKET;
  const isSLOrder =
    values.ordertype === ANGEL_ORDER_TYPE.STOPLOSS_LIMIT ||
    values.ordertype === ANGEL_ORDER_TYPE.STOPLOSS_MARKET;

  const estimatedValue = useMemo(() => {
    const price = isMarket ? (ltp ?? 0) : values.price;
    return price * values.quantity;
  }, [isMarket, ltp, values.price, values.quantity]);

  const handleSubmit = () => {
    const result = validateOrder(values);
    if (!result.valid) {
      setErrors(result.errors);
      return;
    }
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    setConfirmOpen(false);
    placeOrder(values);
  };

  const isBuy = values.transactiontype === "BUY";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* BUY / SELL toggle */}
      <Tabs
        value={isBuy ? 0 : 1}
        onChange={(_, v) => set("transactiontype", v === 0 ? "BUY" : "SELL")}
        variant="fullWidth"
        sx={{
          "& .MuiTab-root": { fontWeight: 700, fontSize: "0.875rem" },
          "& .Mui-selected": { color: isBuy ? "success.main" : "error.main" },
          "& .MuiTabs-indicator": { backgroundColor: isBuy ? "success.main" : "error.main" },
        }}
      >
        <Tab icon={<TrendingUpIcon fontSize="small" />} iconPosition="start" label="BUY"  />
        <Tab icon={<TrendingDownIcon fontSize="small" />} iconPosition="start" label="SELL" />
      </Tabs>

      <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
        <Grid container spacing={2}>
          {/* Symbol */}
          <Grid size={8}>
            <TextField
              label="Symbol"
              size="small"
              fullWidth
              value={values.tradingsymbol}
              onChange={(e) => set("tradingsymbol", e.target.value.toUpperCase())}
              error={!!errors.tradingsymbol}
              helperText={errors.tradingsymbol}
              placeholder="e.g. RELIANCE-EQ"
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

          {/* Price (hidden for MARKET) */}
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

          {/* Trigger price (only for SL orders) */}
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
                px: 1.5,
                py: 0.75,
                height:       "100%",
                display:      "flex",
                flexDirection:"column",
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

        {/* Error banner from server */}
        {placingError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {placingError}
          </Alert>
        )}
      </Box>

      {/* Footer */}
      <Divider />
      <Box sx={{ p: 2 }}>
        <Button
          variant="contained"
          fullWidth
          size="large"
          color={isBuy ? "success" : "error"}
          disableElevation
          disabled={isPlacing}
          onClick={handleSubmit}
          startIcon={isPlacing ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {isPlacing
            ? "Placing…"
            : `${isBuy ? "Buy" : "Sell"} ${values.tradingsymbol || "Order"}`}
        </Button>
      </Box>

      <ConfirmDialog
        open={confirmOpen}
        values={values}
        ltp={ltp}
        onOk={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </Box>
  );
}
