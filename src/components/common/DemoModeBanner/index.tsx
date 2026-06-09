"use client";

import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Alert from "@mui/material/Alert";
import { alpha, useTheme } from "@mui/material/styles";
import { useTickers } from "@/hooks/useMarketData";

export function DemoModeBanner() {
  const { isError, isPending } = useTickers();
  const theme = useTheme();

  if (isPending || !isError) return null;

  return (
    <Alert
      severity="info"
      icon={<InfoOutlinedIcon fontSize="small" />}
      sx={{
        mb: 2,
        borderRadius: 2,
        fontSize: 13,
        bgcolor: alpha(theme.palette.info.main, 0.08),
        border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
        color: "text.primary",
        "& .MuiAlert-icon": { color: "info.main" },
      }}
    >
      <strong>Demo mode</strong> — Backend at{" "}
      <code style={{ fontSize: 12 }}>localhost:8000</code> is offline. Showing
      mock market data. Connect the backend to see live prices.
    </Alert>
  );
}
