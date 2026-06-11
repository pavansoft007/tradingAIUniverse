"use client";

import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import RefreshIcon               from "@mui/icons-material/Refresh";
import TrendingDownIcon          from "@mui/icons-material/TrendingDown";
import TrendingUpIcon            from "@mui/icons-material/TrendingUp";
import Box                       from "@mui/material/Box";
import Button                    from "@mui/material/Button";
import Card                      from "@mui/material/Card";
import CardContent               from "@mui/material/CardContent";
import Chip                      from "@mui/material/Chip";
import CircularProgress          from "@mui/material/CircularProgress";
import Dialog                    from "@mui/material/Dialog";
import DialogActions             from "@mui/material/DialogActions";
import DialogContent             from "@mui/material/DialogContent";
import DialogTitle               from "@mui/material/DialogTitle";
import TextField                 from "@mui/material/TextField";
import Tooltip                   from "@mui/material/Tooltip";
import Typography                from "@mui/material/Typography";
import { useState }              from "react";
import { usePaperWallet, usePaperStats } from "@/hooks/usePaperTrading";

function fmt(n: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}
function fmtPnl(n: number): string {
  const s = fmt(Math.abs(n));
  return `${n >= 0 ? "+" : "-"}${s}`;
}

export function WalletCard() {
  const { data: wallet, isLoading, deposit, withdraw, reset } = usePaperWallet();
  const { data: stats } = usePaperStats();

  const [open, setOpen]   = useState<"deposit" | "withdraw" | null>(null);
  const [amount, setAmount] = useState("");

  if (isLoading) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={28} />
        </CardContent>
      </Card>
    );
  }

  if (!wallet) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 3, textAlign: "center" }}>
          <Typography color="text.secondary">
            Wallet unavailable — please log in or refresh the page.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const totalPnl    = stats?.totalPnl ?? 0;
  const totalPnlPct = stats?.totalPnlPct ?? 0;
  const pnlColor    = totalPnl >= 0 ? "success.main" : "error.main";

  function handleAction() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    if (open === "deposit")  deposit.mutate(amt,  { onSuccess: () => { setOpen(null); setAmount(""); } });
    if (open === "withdraw") withdraw.mutate(amt, { onSuccess: () => { setOpen(null); setAmount(""); } });
  }

  return (
    <>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <AccountBalanceWalletIcon sx={{ color: "primary.main" }} />
              <Typography variant="h6" fontWeight={700}>Virtual Wallet</Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button size="small" variant="outlined" color="success" onClick={() => setOpen("deposit")}>Deposit</Button>
              <Button size="small" variant="outlined" color="warning" onClick={() => setOpen("withdraw")}>Withdraw</Button>
              <Tooltip title="Reset to ₹10 lakh (all data cleared)">
                <Button size="small" variant="outlined" color="error" startIcon={<RefreshIcon />}
                  onClick={() => { if (confirm("Reset paper trading account? All data will be cleared.")) reset.mutate(); }}>
                  Reset
                </Button>
              </Tooltip>
            </Box>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">Available Balance</Typography>
              <Typography variant="h5" fontWeight={700} color="primary.main">{fmt(wallet.balance)}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Used Margin</Typography>
              <Typography variant="h5" fontWeight={700}>{fmt(wallet.usedMargin)}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Realized P&L</Typography>
              <Typography variant="h5" fontWeight={700} color={wallet.realizedPnl >= 0 ? "success.main" : "error.main"}>
                {fmtPnl(wallet.realizedPnl)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Total P&L</Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                {totalPnl >= 0
                  ? <TrendingUpIcon sx={{ color: "success.main", fontSize: 20 }} />
                  : <TrendingDownIcon sx={{ color: "error.main", fontSize: 20 }} />}
                <Typography variant="h5" fontWeight={700} color={pnlColor}>{fmtPnl(totalPnl)}</Typography>
                <Chip label={`${totalPnlPct >= 0 ? "+" : ""}${totalPnlPct.toFixed(2)}%`}
                  size="small" color={totalPnl >= 0 ? "success" : "error"} sx={{ ml: 0.5 }} />
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Dialog open={!!open} onClose={() => setOpen(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textTransform: "capitalize" }}>{open} Funds</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus fullWidth label="Amount (₹)" type="number" size="small"
            value={amount} onChange={(e) => setAmount(e.target.value)}
            sx={{ mt: 1 }}
            inputProps={{ min: 1, step: 1000 }}
          />
          {open === "withdraw" && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
              Free balance: {fmt(wallet.balance - wallet.usedMargin)}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleAction}
            disabled={deposit.isPending || withdraw.isPending}>
            {open === "deposit" ? "Deposit" : "Withdraw"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
