"use client";

import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import type { WsConnectionStatus } from "@/types/smartws.types";

interface ConnectionStatusProps {
  status: WsConnectionStatus;
  size?: "small" | "medium";
}

const STATUS_META: Record<
  WsConnectionStatus,
  { label: string; color: "success" | "error" | "warning" | "default"; tip: string }
> = {
  idle:          { label: "Idle",         color: "default",  tip: "WebSocket not started" },
  connecting:    { label: "Connecting",   color: "warning",  tip: "Establishing connection…" },
  connected:     { label: "Live",         color: "success",  tip: "Streaming real-time data" },
  reconnecting:  { label: "Reconnecting", color: "warning",  tip: "Connection lost — retrying…" },
  error:         { label: "Error",        color: "error",    tip: "Connection failed" },
  disconnected:  { label: "Offline",      color: "default",  tip: "Disconnected from feed" },
};

export function ConnectionStatus({ status, size = "small" }: ConnectionStatusProps) {
  const { label, color, tip } = STATUS_META[status];
  const pulse = status === "connected";

  return (
    <Tooltip title={tip} arrow>
      <Chip
        size={size}
        label={label}
        color={color}
        icon={
          <FiberManualRecordIcon
            sx={{
              fontSize: "10px !important",
              ...(pulse && {
                animation: "pulse 1.5s ease-in-out infinite",
                "@keyframes pulse": {
                  "0%, 100%": { opacity: 1 },
                  "50%": { opacity: 0.4 },
                },
              }),
            }}
          />
        }
        sx={{ fontWeight: 600, letterSpacing: 0.3 }}
      />
    </Tooltip>
  );
}
