"use client";

import AddIcon         from "@mui/icons-material/Add";
import Alert           from "@mui/material/Alert";
import Box             from "@mui/material/Box";
import Button          from "@mui/material/Button";
import Card            from "@mui/material/Card";
import CardContent     from "@mui/material/CardContent";
import FormControl     from "@mui/material/FormControl";
import InputAdornment  from "@mui/material/InputAdornment";
import InputLabel      from "@mui/material/InputLabel";
import MenuItem        from "@mui/material/MenuItem";
import Select          from "@mui/material/Select";
import TextField       from "@mui/material/TextField";
import ToggleButton    from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip         from "@mui/material/Tooltip";
import Typography      from "@mui/material/Typography";
import { useState }    from "react";
import { ScripSearch } from "@/components/features/trading/ScripSearch";
import { usePaperOrders } from "@/hooks/usePaperTrading";
import type { ScripSearchResult } from "@/lib/api/angelone/scrip.api";
import type { PaperOrderSide, PaperOrderType, PaperProductType } from "@/types/paper-trading.types";

type AngelExchange = "NSE" | "BSE" | "NFO" | "MCX" | "BFO" | "CDS";

const ORDER_TYPES: { value: PaperOrderType; label: string }[] = [
  { value: "MARKET",         label: "Market" },
  { value: "LIMIT",          label: "Limit" },
  { value: "STOPLOSS_LIMIT", label: "SL-Limit" },
  { value: "STOPLOSS_MARKET",label: "SL-Market" },
];
const PRODUCT_TYPES: { value: PaperProductType; label: string; hint: string }[] = [
  { value: "CNC",  label: "CNC",  hint: "Cash & Carry (delivery)" },
  { value: "MIS",  label: "MIS",  hint: "Intraday (auto square-off 3:20 PM)" },
  { value: "NRML", label: "NRML", hint: "Normal (F&O overnight)" },
];

interface FormState {
  scrip:        ScripSearchResult | null;
  exchange:     AngelExchange;
  side:         PaperOrderSide;
  ordertype:    PaperOrderType;
  producttype:  PaperProductType;
  quantity:     string;
  price:        string;
  triggerprice: string;
  notes:        string;
}

const INIT: FormState = {
  scrip: null, exchange: "NSE", side: "BUY",
  ordertype: "MARKET", producttype: "CNC",
  quantity: "", price: "", triggerprice: "", notes: "",
};

function estimateSlippage(ordertype: PaperOrderType, side: PaperOrderSide): string {
  if (ordertype === "LIMIT" || ordertype === "STOPLOSS_LIMIT") return "0% (exact price)";
  const base = ordertype === "STOPLOSS_MARKET" ? "0.07–0.13%" : "0.02–0.08%";
  return `${side === "BUY" ? "+" : "-"}${base}`;
}

export function PaperOrderEntryForm() {
  const [form, setForm] = useState<FormState>(INIT);
  const [error, setError] = useState<string>("");
  const { placeOrder } = usePaperOrders();

  const needsPrice    = form.ordertype === "LIMIT" || form.ordertype === "STOPLOSS_LIMIT";
  const needsTrigger  = form.ordertype === "STOPLOSS_LIMIT" || form.ordertype === "STOPLOSS_MARKET";

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    setError("");
  }

  function handleScrip(scrip: ScripSearchResult) {
    setForm((f) => ({ ...f, scrip, exchange: (scrip.exchange as AngelExchange) || f.exchange }));
  }

  function validate(): string | null {
    if (!form.scrip)                        return "Select a symbol";
    if (!form.quantity || +form.quantity <= 0) return "Enter a valid quantity";
    if (needsPrice && !form.price)          return "Enter limit price";
    if (needsTrigger && !form.triggerprice) return "Enter trigger price";
    return null;
  }

  function handlePlace() {
    const err = validate();
    if (err) { setError(err); return; }
    placeOrder.mutate(
      {
        tradingsymbol:   form.scrip!.tradingsymbol,
        symboltoken:     form.scrip!.symboltoken,
        exchange:        form.exchange,
        transactiontype: form.side,
        ordertype:       form.ordertype,
        producttype:     form.producttype,
        quantity:        parseInt(form.quantity, 10),
        price:           +form.price || 0,
        triggerprice:    +form.triggerprice || 0,
        notes:           form.notes || undefined,
        source:          "manual",
      },
      {
        onSuccess: () => setForm(INIT),
        onError:   (e) => setError((e as Error).message),
      },
    );
  }

  const slippageHint = estimateSlippage(form.ordertype, form.side);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight={700} gutterBottom>Place Paper Order</Typography>

        {/* Side toggle */}
        <ToggleButtonGroup
          value={form.side} exclusive size="small" fullWidth
          onChange={(_, v) => v && set("side", v as PaperOrderSide)}
          sx={{ mb: 2 }}
        >
          <ToggleButton value="BUY"  sx={{ color: "success.main", "&.Mui-selected": { bgcolor: "success.main", color: "#fff" } }}>
            BUY
          </ToggleButton>
          <ToggleButton value="SELL" sx={{ color: "error.main", "&.Mui-selected": { bgcolor: "error.main", color: "#fff" } }}>
            SELL
          </ToggleButton>
        </ToggleButtonGroup>

        {/* Symbol */}
        <Box sx={{ mb: 2 }}>
          <ScripSearch
            exchange={form.exchange}
            value={form.scrip?.tradingsymbol ?? ""}
            onSelect={handleScrip}
          />
        </Box>

        {/* Exchange */}
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>Exchange</InputLabel>
          <Select value={form.exchange} label="Exchange" onChange={(e) => set("exchange", e.target.value as AngelExchange)}>
            {["NSE", "BSE", "NFO", "MCX"].map((ex) => (
              <MenuItem key={ex} value={ex}>{ex}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Order type & product type */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
          <FormControl size="small" fullWidth>
            <InputLabel>Order Type</InputLabel>
            <Select value={form.ordertype} label="Order Type" onChange={(e) => set("ordertype", e.target.value as PaperOrderType)}>
              {ORDER_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </Select>
          </FormControl>

          <FormControl size="small" fullWidth>
            <InputLabel>Product</InputLabel>
            <Select value={form.producttype} label="Product" onChange={(e) => set("producttype", e.target.value as PaperProductType)}>
              {PRODUCT_TYPES.map((p) => (
                <MenuItem key={p.value} value={p.value}>
                  <Tooltip title={p.hint} placement="right">
                    <span>{p.label}</span>
                  </Tooltip>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Quantity */}
        <TextField fullWidth size="small" label="Quantity" type="number" sx={{ mb: 2 }}
          value={form.quantity} onChange={(e) => set("quantity", e.target.value)}
          inputProps={{ min: 1, step: 1 }} />

        {/* Limit price */}
        {needsPrice && (
          <TextField fullWidth size="small" label="Limit Price" type="number" sx={{ mb: 2 }}
            value={form.price} onChange={(e) => set("price", e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} />
        )}

        {/* Trigger price */}
        {needsTrigger && (
          <TextField fullWidth size="small" label="Trigger Price" type="number" sx={{ mb: 2 }}
            value={form.triggerprice} onChange={(e) => set("triggerprice", e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} />
        )}

        {/* Slippage preview */}
        <Box sx={{ bgcolor: "action.hover", borderRadius: 1, p: 1.5, mb: 2 }}>
          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
            Simulated Slippage
          </Typography>
          <Typography variant="body2" fontWeight={600}>{slippageHint}</Typography>
          <Typography variant="caption" color="text.secondary">
            Limit/SL-Limit fills at exact price. Market/SL-Market adds realistic slippage.
          </Typography>
        </Box>

        {/* Notes */}
        <TextField fullWidth size="small" label="Notes (optional)" sx={{ mb: 2 }}
          value={form.notes} onChange={(e) => set("notes", e.target.value)} />

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Button fullWidth variant="contained" size="large"
          color={form.side === "BUY" ? "success" : "error"}
          startIcon={<AddIcon />}
          disabled={placeOrder.isPending}
          onClick={handlePlace}
        >
          {placeOrder.isPending ? "Placing…" : `${form.side} ${form.scrip?.tradingsymbol || "Symbol"}`}
        </Button>
      </CardContent>
    </Card>
  );
}
