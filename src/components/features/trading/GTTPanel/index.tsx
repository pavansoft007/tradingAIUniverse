"use client";

import AddIcon          from "@mui/icons-material/Add";
import CancelIcon       from "@mui/icons-material/Cancel";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon   from "@mui/icons-material/TrendingUp";
import Alert            from "@mui/material/Alert";
import Box              from "@mui/material/Box";
import Button           from "@mui/material/Button";
import Chip             from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog           from "@mui/material/Dialog";
import DialogActions    from "@mui/material/DialogActions";
import DialogContent    from "@mui/material/DialogContent";
import DialogTitle      from "@mui/material/DialogTitle";
import Divider          from "@mui/material/Divider";
import FormControl      from "@mui/material/FormControl";
import Grid             from "@mui/material/Grid";
import IconButton       from "@mui/material/IconButton";
import InputAdornment   from "@mui/material/InputAdornment";
import InputLabel       from "@mui/material/InputLabel";
import MenuItem         from "@mui/material/MenuItem";
import Select           from "@mui/material/Select";
import Table            from "@mui/material/Table";
import TableBody        from "@mui/material/TableBody";
import TableCell        from "@mui/material/TableCell";
import TableContainer   from "@mui/material/TableContainer";
import TableHead        from "@mui/material/TableHead";
import TableRow         from "@mui/material/TableRow";
import TextField        from "@mui/material/TextField";
import ToggleButton     from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip          from "@mui/material/Tooltip";
import Typography       from "@mui/material/Typography";
import { alpha }        from "@mui/material/styles";
import { useCallback, useMemo, useState } from "react";
import { ScripSearch }  from "@/components/features/trading/ScripSearch";
import {
  useCancelGTT,
  useCreateGTT,
  useGTTRules,
  useModifyGTT,
} from "@/hooks/useGTT";
import type { ScripSearchResult } from "@/lib/api/angelone/scrip.api";
import type { GTTFormValues, GTTProductType, GTTRule, GTTStatus } from "@/types/angel-gtt.types";

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_FILTERS: Array<{ label: string; values: GTTStatus[] }> = [
  { label: "Active",    values: ["NEW", "ACTIVE"] },
  { label: "Pending",   values: ["SENTTOEXCHANGE"] },
  { label: "Executed",  values: ["EXECUTED"] },
  { label: "Cancelled", values: ["CANCELLED", "FORCECANCEL"] },
];

const STATUS_CHIP: Record<GTTStatus, { label: string; color: string; bg: string }> = {
  NEW:              { label: "New",       color: "#818CF8", bg: "rgba(129,140,248,0.12)" },
  ACTIVE:           { label: "Active",    color: "#00D97E", bg: "rgba(0,217,126,0.12)"  },
  SENTTOEXCHANGE:   { label: "Sent",      color: "#38BDF8", bg: "rgba(56,189,248,0.12)" },
  EXECUTED:         { label: "Executed",  color: "#00D97E", bg: "rgba(0,217,126,0.15)"  },
  CANCELLED:        { label: "Cancelled", color: "#94A3B8", bg: "rgba(148,163,184,0.10)"},
  FORCECANCEL:      { label: "Voided",    color: "#F23645", bg: "rgba(242,54,69,0.12)"  },
};

const fmt = (n: number) =>
  `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const EMPTY_FORM: GTTFormValues = {
  tradingsymbol:   "",
  symboltoken:     "",
  exchange:        "NSE",
  producttype:     "DELIVERY",
  transactiontype: "BUY",
  triggerprice:    0,
  price:           0,
  qty:             1,
  timeperiod:      365,
};

// ── GTT Form Dialog ───────────────────────────────────────────────────────────

interface GTTFormDialogProps {
  open:       boolean;
  editRule:   GTTRule | null;
  onClose:    () => void;
}

function GTTFormDialog({ open, editRule, onClose }: GTTFormDialogProps) {
  const [values, setValues] = useState<GTTFormValues>(() =>
    editRule
      ? {
          tradingsymbol:   editRule.tradingsymbol,
          symboltoken:     editRule.symboltoken,
          exchange:        editRule.exchange,
          producttype:     editRule.producttype,
          transactiontype: editRule.transactiontype,
          triggerprice:    editRule.triggerprice,
          price:           editRule.price,
          qty:             editRule.qty,
          timeperiod:      editRule.timeperiod,
        }
      : EMPTY_FORM,
  );
  const [errors, setErrors] = useState<Partial<Record<keyof GTTFormValues, string>>>({});

  const { mutate: createGTT, isPending: creating, error: createError } = useCreateGTT();
  const { mutate: modifyGTT, isPending: modifying, error: modifyError } = useModifyGTT();
  const isPending = creating || modifying;
  const apiError  = (createError || modifyError) as Error | null;

  const set = useCallback(
    <K extends keyof GTTFormValues>(key: K, val: GTTFormValues[K]) => {
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

  const validate = (): boolean => {
    const errs: typeof errors = {};
    if (!values.tradingsymbol) errs.tradingsymbol = "Required";
    if (!values.symboltoken)   errs.symboltoken   = "Required";
    if (values.triggerprice <= 0) errs.triggerprice = "Must be > 0";
    if (values.price <= 0)        errs.price        = "Must be > 0";
    if (values.qty < 1)           errs.qty          = "Must be ≥ 1";
    if (values.timeperiod < 1 || values.timeperiod > 365)
      errs.timeperiod = "1–365 days";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const payload = {
      tradingsymbol:   values.tradingsymbol,
      symboltoken:     values.symboltoken,
      exchange:        values.exchange,
      producttype:     values.producttype,
      transactiontype: values.transactiontype,
      price:           values.price,
      qty:             values.qty,
      disclosedqty:    0,
      triggerprice:    values.triggerprice,
      timeperiod:      values.timeperiod,
    };

    if (editRule) {
      modifyGTT({ ...payload, id: editRule.id }, { onSuccess: onClose });
    } else {
      createGTT(payload, { onSuccess: onClose });
    }
  };

  const isBuy = values.transactiontype === "BUY";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        {editRule ? "Modify GTT Order" : "Create GTT Order"}
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={2} sx={{ pt: 0.5 }}>
          {/* BUY / SELL toggle */}
          <Grid size={12}>
            <ToggleButtonGroup
              exclusive
              fullWidth
              size="small"
              value={values.transactiontype}
              onChange={(_, v) => v && set("transactiontype", v)}
            >
              <ToggleButton
                value="BUY"
                sx={{
                  fontWeight: 700,
                  "&.Mui-selected": { background: "rgba(0,217,126,0.12)", color: "#00D97E", borderColor: "rgba(0,217,126,0.3)" },
                }}
              >
                <TrendingUpIcon sx={{ fontSize: 16, mr: 0.5 }} /> BUY
              </ToggleButton>
              <ToggleButton
                value="SELL"
                sx={{
                  fontWeight: 700,
                  "&.Mui-selected": { background: "rgba(242,54,69,0.12)", color: "#F23645", borderColor: "rgba(242,54,69,0.3)" },
                }}
              >
                <TrendingDownIcon sx={{ fontSize: 16, mr: 0.5 }} /> SELL
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>

          {/* Symbol search */}
          <Grid size={8}>
            <ScripSearch
              exchange={values.exchange as "NSE" | "BSE"}
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
                onChange={(e) => set("exchange", e.target.value)}
              >
                <MenuItem value="NSE">NSE</MenuItem>
                <MenuItem value="BSE">BSE</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Product type — GTT only supports DELIVERY and MARGIN */}
          <Grid size={12}>
            <FormControl size="small" fullWidth>
              <InputLabel>Product Type</InputLabel>
              <Select
                label="Product Type"
                value={values.producttype}
                onChange={(e) => set("producttype", e.target.value as GTTProductType)}
              >
                <MenuItem value="DELIVERY">CNC — Delivery</MenuItem>
                <MenuItem value="MARGIN">MARGIN</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Trigger price */}
          <Grid size={6}>
            <TextField
              label="Trigger Price"
              size="small"
              fullWidth
              type="number"
              value={values.triggerprice || ""}
              onChange={(e) => set("triggerprice", parseFloat(e.target.value) || 0)}
              error={!!errors.triggerprice}
              helperText={errors.triggerprice ?? "Order fires when LTP crosses this"}
              InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
              inputProps={{ min: 0.01, step: 0.05 }}
            />
          </Grid>

          {/* Limit price */}
          <Grid size={6}>
            <TextField
              label="Limit Price"
              size="small"
              fullWidth
              type="number"
              value={values.price || ""}
              onChange={(e) => set("price", parseFloat(e.target.value) || 0)}
              error={!!errors.price}
              helperText={errors.price ?? "Execution price after trigger"}
              InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
              inputProps={{ min: 0.01, step: 0.05 }}
            />
          </Grid>

          {/* Quantity */}
          <Grid size={6}>
            <TextField
              label="Quantity"
              size="small"
              fullWidth
              type="number"
              value={values.qty}
              onChange={(e) => set("qty", parseInt(e.target.value, 10) || 1)}
              error={!!errors.qty}
              helperText={errors.qty}
              inputProps={{ min: 1, step: 1 }}
            />
          </Grid>

          {/* Validity (days) */}
          <Grid size={6}>
            <TextField
              label="Validity (days)"
              size="small"
              fullWidth
              type="number"
              value={values.timeperiod}
              onChange={(e) => set("timeperiod", parseInt(e.target.value, 10) || 365)}
              error={!!errors.timeperiod}
              helperText={errors.timeperiod ?? "1–365 days"}
              InputProps={{ endAdornment: <InputAdornment position="end">days</InputAdornment> }}
              inputProps={{ min: 1, max: 365, step: 1 }}
            />
          </Grid>

          {/* Summary */}
          {values.triggerprice > 0 && values.price > 0 && values.qty > 0 && (
            <Grid size={12}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: isBuy ? "rgba(0,217,126,0.2)" : "rgba(242,54,69,0.2)",
                  background:  isBuy ? "rgba(0,217,126,0.04)" : "rgba(242,54,69,0.04)",
                }}
              >
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  Order Summary
                </Typography>
                <Box sx={{ display: "flex", gap: 3 }}>
                  <Box>
                    <Typography sx={{ fontSize: 10, color: "text.secondary" }}>Trigger at</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace" }}>
                      {fmt(values.triggerprice)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 10, color: "text.secondary" }}>Execute at</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace" }}>
                      {fmt(values.price)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 10, color: "text.secondary" }}>Est. Value</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace" }}>
                      {fmt(values.price * values.qty)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
          )}

          {apiError && (
            <Grid size={12}>
              <Alert severity="error" sx={{ py: 0.5 }}>{apiError.message}</Alert>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={isPending}>Cancel</Button>
        <Button
          variant="contained"
          disableElevation
          disabled={isPending}
          onClick={handleSubmit}
          color={isBuy ? "success" : "error"}
          startIcon={isPending ? <CircularProgress size={14} color="inherit" /> : undefined}
          sx={{ fontWeight: 700 }}
        >
          {isPending
            ? editRule ? "Modifying…" : "Creating…"
            : editRule ? "Modify GTT" : "Create GTT"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── GTT Rule Row ──────────────────────────────────────────────────────────────

interface RuleRowProps {
  rule:     GTTRule;
  onEdit:   (rule: GTTRule) => void;
  onCancel: (id: number)   => void;
  cancelling: number | null;
}

function RuleRow({ rule, onEdit, onCancel, cancelling }: RuleRowProps) {
  const statusCfg = STATUS_CHIP[rule.status] ?? STATUS_CHIP.CANCELLED;
  const isBuy     = rule.transactiontype === "BUY";
  const sideColor = isBuy ? "#00D97E" : "#F23645";
  const canEdit   = rule.status === "NEW" || rule.status === "ACTIVE";
  const isCancelling = cancelling === rule.id;

  return (
    <TableRow hover sx={{ "& td": { py: 0.75, fontSize: "0.8rem" } }}>
      {/* Symbol */}
      <TableCell>
        <Typography variant="body2" fontWeight={700}>{rule.tradingsymbol}</Typography>
        <Typography variant="caption" color="text.secondary">{rule.exchange} · {rule.producttype}</Typography>
      </TableCell>

      {/* Side */}
      <TableCell>
        <Chip
          label={rule.transactiontype}
          size="small"
          sx={{
            fontSize: "0.65rem", fontWeight: 700, height: 18,
            background: alpha(sideColor, 0.12),
            color:      sideColor,
            border:     `1px solid ${alpha(sideColor, 0.3)}`,
          }}
        />
      </TableCell>

      {/* Trigger price */}
      <TableCell align="right" sx={{ fontFamily: "monospace" }}>
        {fmt(rule.triggerprice)}
      </TableCell>

      {/* Limit price */}
      <TableCell align="right" sx={{ fontFamily: "monospace" }}>
        {fmt(rule.price)}
      </TableCell>

      {/* Qty */}
      <TableCell align="right">{rule.qty}</TableCell>

      {/* Validity */}
      <TableCell align="right">
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.4 }}>
          <TimerOutlinedIcon sx={{ fontSize: 12, color: "text.secondary" }} />
          <Typography sx={{ fontSize: 12 }}>{rule.timeperiod}d</Typography>
        </Box>
      </TableCell>

      {/* Status */}
      <TableCell>
        <Chip
          label={statusCfg.label}
          size="small"
          sx={{
            height: 18, fontSize: "0.65rem", fontWeight: 700,
            background: statusCfg.bg,
            color:      statusCfg.color,
          }}
        />
      </TableCell>

      {/* Actions */}
      <TableCell align="center">
        {canEdit && (
          <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center" }}>
            <Tooltip title="Modify GTT">
              <IconButton size="small" onClick={() => onEdit(rule)}>
                <EditOutlinedIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Cancel GTT">
              <span>
                <IconButton
                  size="small"
                  color="error"
                  disabled={isCancelling}
                  onClick={() => onCancel(rule.id)}
                >
                  {isCancelling
                    ? <CircularProgress size={14} />
                    : <CancelIcon sx={{ fontSize: 14 }} />}
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        )}
      </TableCell>
    </TableRow>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function GTTPanel() {
  const [statusFilter, setStatusFilter] = useState(0);
  const [createOpen, setCreateOpen]     = useState(false);
  const [editRule,   setEditRule]       = useState<GTTRule | null>(null);
  const [cancelling, setCancelling]     = useState<number | null>(null);

  const statuses = useMemo(
    () => STATUS_FILTERS[statusFilter]?.values ?? STATUS_FILTERS[0].values,
    [statusFilter],
  );

  const { data: rules = [], isFetching, error } = useGTTRules(statuses);
  const { mutate: cancelGTT } = useCancelGTT();

  const handleCancel = (id: number) => {
    setCancelling(id);
    cancelGTT(id, { onSettled: () => setCancelling(null) });
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 1.5, flexWrap: "wrap" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1, minWidth: 200 }}>
          <TimerOutlinedIcon sx={{ fontSize: 18, color: "#818CF8" }} />
          <Typography variant="subtitle2" fontWeight={700}>GTT Orders</Typography>
          <Chip
            label={rules.length}
            size="small"
            sx={{ height: 18, fontSize: "0.7rem", background: "rgba(129,140,248,0.15)", color: "#818CF8" }}
          />
          {isFetching && <CircularProgress size={14} />}
        </Box>

        <Button
          size="small"
          variant="contained"
          disableElevation
          startIcon={<AddIcon />}
          onClick={() => setCreateOpen(true)}
          sx={{
            fontSize: "0.75rem",
            fontWeight: 700,
            background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
          }}
        >
          New GTT
        </Button>
      </Box>

      {/* Status filter tabs */}
      <Box sx={{ px: 2, pb: 1, display: "flex", gap: 0.75, flexWrap: "wrap" }}>
        {STATUS_FILTERS.map((f, i) => (
          <Chip
            key={f.label}
            label={f.label}
            size="small"
            clickable
            onClick={() => setStatusFilter(i)}
            sx={{
              fontSize: "0.72rem",
              fontWeight: statusFilter === i ? 700 : 500,
              background: statusFilter === i ? "rgba(99,102,241,0.2)" : undefined,
              color:      statusFilter === i ? "#818CF8" : "text.secondary",
              border:     statusFilter === i ? "1px solid rgba(99,102,241,0.3)" : "1px solid transparent",
            }}
          />
        ))}
      </Box>

      <Divider />

      {/* Error state */}
      {error && (
        <Alert severity="error" sx={{ m: 2, py: 0.5, fontSize: "0.8rem" }}>
          {(error as Error).message}
        </Alert>
      )}

      {/* Table */}
      <TableContainer sx={{ flex: 1, overflowY: "auto" }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow sx={{ "& th": { fontSize: "0.72rem", fontWeight: 700 } }}>
              <TableCell>Symbol</TableCell>
              <TableCell>Side</TableCell>
              <TableCell align="right">Trigger</TableCell>
              <TableCell align="right">Limit</TableCell>
              <TableCell align="right">Qty</TableCell>
              <TableCell align="right">Validity</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {rules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    {isFetching ? "Loading GTT orders…" : "No GTT orders found"}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rules.map((rule) => (
                <RuleRow
                  key={rule.id}
                  rule={rule}
                  onEdit={setEditRule}
                  onCancel={handleCancel}
                  cancelling={cancelling}
                />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Info footer */}
      <Divider />
      <Box sx={{ px: 2, py: 0.75 }}>
        <Typography sx={{ fontSize: 10.5, color: "text.secondary" }}>
          GTT orders persist across sessions · NSE &amp; BSE only · CNC or MARGIN product
        </Typography>
      </Box>

      {/* Create dialog */}
      <GTTFormDialog
        open={createOpen}
        editRule={null}
        onClose={() => setCreateOpen(false)}
      />

      {/* Edit dialog */}
      <GTTFormDialog
        open={editRule !== null}
        editRule={editRule}
        onClose={() => setEditRule(null)}
      />
    </Box>
  );
}
