"use client";

import Alert          from "@mui/material/Alert";
import Box            from "@mui/material/Box";
import Button         from "@mui/material/Button";
import Chip           from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog         from "@mui/material/Dialog";
import DialogActions  from "@mui/material/DialogActions";
import DialogContent  from "@mui/material/DialogContent";
import DialogTitle    from "@mui/material/DialogTitle";
import FormControl    from "@mui/material/FormControl";
import Grid           from "@mui/material/Grid";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel     from "@mui/material/InputLabel";
import MenuItem       from "@mui/material/MenuItem";
import Select         from "@mui/material/Select";
import TextField      from "@mui/material/TextField";
import ToggleButton   from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography     from "@mui/material/Typography";
import { alpha }      from "@mui/material/styles";
import { useEffect, useState } from "react";
import { useModifyOrder } from "@/hooks/useAngelOrders";
import {
  ANGEL_DURATION,
  ANGEL_ORDER_TYPE,
  ANGEL_VARIETY,
} from "@/types/angel-order.types";
import type { AngelOrder, AngelOrderType, AngelDuration } from "@/types/angel-order.types";

// ── Props ─────────────────────────────────────────────────────────────────────

interface ModifyOrderDialogProps {
  order:   AngelOrder | null;
  onClose: () => void;
}

// ── Options ───────────────────────────────────────────────────────────────────

const ORDER_TYPE_OPTS = [
  { value: ANGEL_ORDER_TYPE.MARKET,          label: "Market" },
  { value: ANGEL_ORDER_TYPE.LIMIT,           label: "Limit" },
  { value: ANGEL_ORDER_TYPE.STOPLOSS_LIMIT,  label: "SL-Limit" },
  { value: ANGEL_ORDER_TYPE.STOPLOSS_MARKET, label: "SL-Market" },
] as const;

const DURATION_OPTS = [
  { value: ANGEL_DURATION.DAY, label: "DAY" },
  { value: ANGEL_DURATION.IOC, label: "IOC" },
] as const;

// ── Component ─────────────────────────────────────────────────────────────────

export function ModifyOrderDialog({ order, onClose }: ModifyOrderDialogProps) {
  const { mutate: modifyOrder, isPending, error: mutError } = useModifyOrder();

  const [orderType,    setOrderType]    = useState<AngelOrderType>(ANGEL_ORDER_TYPE.LIMIT);
  const [price,        setPrice]        = useState(0);
  const [triggerPrice, setTriggerPrice] = useState(0);
  const [quantity,     setQuantity]     = useState(1);
  const [duration,     setDuration]     = useState<AngelDuration>(ANGEL_DURATION.DAY);

  // Sync when order changes
  useEffect(() => {
    if (order) {
      setOrderType(order.ordertype);
      setPrice(order.price);
      setTriggerPrice(order.triggerprice ?? 0);
      setQuantity(parseInt(order.quantity, 10) || 1);
      setDuration(order.duration);
    }
  }, [order]);

  const isMarket = orderType === ANGEL_ORDER_TYPE.MARKET;
  const isSL     =
    orderType === ANGEL_ORDER_TYPE.STOPLOSS_LIMIT ||
    orderType === ANGEL_ORDER_TYPE.STOPLOSS_MARKET;

  const handleSubmit = () => {
    if (!order) return;
    modifyOrder(
      {
        variety:       order.variety ?? ANGEL_VARIETY.NORMAL,
        orderid:       order.orderid,
        ordertype:     orderType,
        producttype:   order.producttype,
        duration,
        price:         isMarket ? "0" : price.toFixed(2),
        quantity:      String(quantity),
        tradingsymbol: order.tradingsymbol,
        symboltoken:   order.symboltoken,
        exchange:      order.exchange,
        triggerprice:  isSL ? triggerPrice.toFixed(2) : "0",
      },
      { onSuccess: () => onClose() },
    );
  };

  const isBuy = order?.transactiontype === "BUY";

  return (
    <Dialog open={!!order} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1, display: "flex", alignItems: "center", gap: 1 }}>
        Modify Order
        {order && (
          <Chip
            label={order.tradingsymbol}
            size="small"
            color={isBuy ? "success" : "error"}
            variant="outlined"
            sx={{ fontSize: "0.72rem" }}
          />
        )}
      </DialogTitle>

      <DialogContent dividers>
        {/* Read-only summary row */}
        {order && (
          <Box
            sx={{
              display: "flex",
              gap: 2,
              mb: 2,
              p: 1,
              borderRadius: 1,
              background: (theme) => alpha(theme.palette.action.selected, 0.5),
            }}
          >
            {[
              ["Exchange",  order.exchange],
              ["Product",   order.producttype],
              ["Side",      order.transactiontype],
              ["Order ID",  order.orderid],
            ].map(([k, v]) => (
              <Box key={k}>
                <Typography sx={{ fontSize: 9.5, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.06em" }}>{k}</Typography>
                <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{v}</Typography>
              </Box>
            ))}
          </Box>
        )}

        <Grid container spacing={2}>
          {/* Order Type */}
          <Grid size={12}>
            <ToggleButtonGroup
              exclusive
              fullWidth
              size="small"
              value={orderType}
              onChange={(_, v) => v && setOrderType(v)}
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
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
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
              value={isMarket ? "" : price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              helperText={isMarket ? "Market" : undefined}
              InputProps={{
                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
              }}
              inputProps={{ min: 0, step: 0.05 }}
            />
          </Grid>

          {/* Trigger price for SL orders */}
          {isSL && (
            <Grid size={6}>
              <TextField
                label="Trigger Price"
                size="small"
                fullWidth
                type="number"
                value={triggerPrice}
                onChange={(e) => setTriggerPrice(parseFloat(e.target.value) || 0)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
                inputProps={{ min: 0, step: 0.05 }}
              />
            </Grid>
          )}

          {/* Validity */}
          <Grid size={isSL ? 6 : 12}>
            <FormControl size="small" fullWidth>
              <InputLabel>Validity</InputLabel>
              <Select
                label="Validity"
                value={duration}
                onChange={(e) => setDuration(e.target.value as AngelDuration)}
              >
                {DURATION_OPTS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {mutError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {mutError instanceof Error ? mutError.message : "Modify failed"}
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isPending}
          startIcon={isPending ? <CircularProgress size={14} color="inherit" /> : undefined}
          disableElevation
        >
          {isPending ? "Modifying…" : "Modify Order"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
