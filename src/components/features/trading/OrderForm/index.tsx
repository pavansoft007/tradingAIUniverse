"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { useCreateOrder } from "@/hooks/useOrders";
import type { OrderSide, OrderType, TimeInForce } from "@/types/trading.types";

interface OrderFormProps {
  symbol: string;
  currentPrice?: number;
}

export function OrderForm({ symbol, currentPrice }: OrderFormProps) {
  const [side, setSide] = useState<OrderSide>("buy");
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState(currentPrice?.toString() ?? "");
  const [stopPrice, setStopPrice] = useState("");
  const [tif, setTif] = useState<TimeInForce>("gtc");

  const { mutate: createOrder, isPending } = useCreateOrder();

  const total = parseFloat(quantity || "0") * parseFloat(price || "0");

  const handleSubmit = () => {
    createOrder({
      symbol,
      side,
      type: orderType,
      quantity: parseFloat(quantity),
      price: orderType !== "market" ? parseFloat(price) : undefined,
      stopPrice: ["stop", "stop_limit"].includes(orderType) ? parseFloat(stopPrice) : undefined,
      timeInForce: tif,
    });
  };

  return (
    <Card>
      <CardHeader
        title={`Order — ${symbol}`}
        titleTypographyProps={{ variant: "subtitle1", fontWeight: 600 }}
      />
      <CardContent sx={{ pt: 0 }}>
        {/* Buy / Sell tabs */}
        <Tabs
          value={side}
          onChange={(_, v: OrderSide) => setSide(v)}
          sx={{ mb: 2 }}
          TabIndicatorProps={{ style: { display: "none" } }}
        >
          <Tab
            label="Buy"
            value="buy"
            sx={{
              flex: 1,
              borderRadius: 2,
              fontWeight: 600,
              bgcolor: side === "buy" ? "success.main" : "transparent",
              color: side === "buy" ? "white !important" : "text.secondary",
              minHeight: 36,
            }}
          />
          <Tab
            label="Sell"
            value="sell"
            sx={{
              flex: 1,
              borderRadius: 2,
              fontWeight: 600,
              bgcolor: side === "sell" ? "error.main" : "transparent",
              color: side === "sell" ? "white !important" : "text.secondary",
              minHeight: 36,
            }}
          />
        </Tabs>

        {/* Order type */}
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>Order Type</InputLabel>
          <Select
            value={orderType}
            label="Order Type"
            onChange={(e) => setOrderType(e.target.value as OrderType)}
          >
            <MenuItem value="market">Market</MenuItem>
            <MenuItem value="limit">Limit</MenuItem>
            <MenuItem value="stop">Stop</MenuItem>
            <MenuItem value="stop_limit">Stop Limit</MenuItem>
          </Select>
        </FormControl>

        {/* Quantity */}
        <TextField
          fullWidth
          size="small"
          label="Quantity"
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          sx={{ mb: 2 }}
          slotProps={{ input: { inputProps: { min: 0, step: "any" } } }}
        />

        {/* Price (limit/stop_limit) */}
        {["limit", "stop_limit"].includes(orderType) && (
          <TextField
            fullWidth
            size="small"
            label="Limit Price"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            sx={{ mb: 2 }}
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                inputProps: { min: 0, step: "any" },
              },
            }}
          />
        )}

        {/* Stop price */}
        {["stop", "stop_limit"].includes(orderType) && (
          <TextField
            fullWidth
            size="small"
            label="Stop Price"
            type="number"
            value={stopPrice}
            onChange={(e) => setStopPrice(e.target.value)}
            sx={{ mb: 2 }}
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                inputProps: { min: 0, step: "any" },
              },
            }}
          />
        )}

        {/* TIF */}
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>Time in Force</InputLabel>
          <Select
            value={tif}
            label="Time in Force"
            onChange={(e) => setTif(e.target.value as TimeInForce)}
          >
            <MenuItem value="gtc">Good Till Cancelled</MenuItem>
            <MenuItem value="day">Day</MenuItem>
            <MenuItem value="ioc">Immediate or Cancel</MenuItem>
            <MenuItem value="fok">Fill or Kill</MenuItem>
          </Select>
        </FormControl>

        <Divider sx={{ mb: 2 }} />

        {/* Total */}
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Estimated Total
          </Typography>
          <Typography variant="body2" fontWeight={700}>
            ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Typography>
        </Box>

        <Button
          fullWidth
          variant="contained"
          color={side === "buy" ? "success" : "error"}
          size="large"
          onClick={handleSubmit}
          disabled={isPending || !quantity || parseFloat(quantity) <= 0}
          sx={{ fontWeight: 700, borderRadius: 2 }}
        >
          {isPending ? "Placing..." : `${side === "buy" ? "Buy" : "Sell"} ${symbol}`}
        </Button>
      </CardContent>
    </Card>
  );
}
