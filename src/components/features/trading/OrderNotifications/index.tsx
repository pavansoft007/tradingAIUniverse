"use client";

import { useCallback } from "react";
import { keyframes } from "@emotion/react";
import {
  Alert,
  Box,
  Collapse,
  IconButton,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { TransitionGroup } from "react-transition-group";
import { useOrderStore } from "@/store/useOrderStore";
import type { OrderNotification, OrderNotifType } from "@/types/angel-order.types";

// ── Slide-in animation ────────────────────────────────────────────────────────

const slideIn = keyframes`
  from { transform: translateX(110%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
`;

const ICONS: Record<OrderNotifType, React.ReactElement> = {
  success: <CheckCircleOutlineIcon fontSize="small" />,
  error:   <ErrorOutlineIcon fontSize="small" />,
  warning: <WarningAmberIcon fontSize="small" />,
  info:    <InfoOutlinedIcon fontSize="small" />,
};

// ── Single toast ──────────────────────────────────────────────────────────────

interface ToastProps {
  notif: OrderNotification;
  onDismiss: (id: string) => void;
}

function Toast({ notif, onDismiss }: ToastProps) {
  return (
    <Alert
      severity={notif.type}
      icon={ICONS[notif.type]}
      sx={{
        minWidth: 280,
        maxWidth: 380,
        animation: `${slideIn} 0.3s ease`,
        boxShadow: 3,
        "& .MuiAlert-message": { width: "100%" },
      }}
      action={
        <IconButton
          size="small"
          aria-label="close"
          onClick={() => onDismiss(notif.id)}
          sx={{ mt: -0.25 }}
        >
          <CloseIcon fontSize="inherit" />
        </IconButton>
      }
    >
      <Typography variant="subtitle2" fontWeight={600} lineHeight={1.2}>
        {notif.title}
      </Typography>
      <Typography variant="caption" display="block" sx={{ opacity: 0.85, mt: 0.25 }}>
        {notif.message}
      </Typography>
    </Alert>
  );
}

// ── Container ─────────────────────────────────────────────────────────────────

export function OrderNotifications() {
  const notifications = useOrderStore((s) => s.notifications);
  const dismissNotif  = useOrderStore((s) => s.dismissNotif);

  const handleDismiss = useCallback(
    (id: string) => dismissNotif(id),
    [dismissNotif],
  );

  if (notifications.length === 0) return null;

  return (
    <Box
      sx={{
        position:      "fixed",
        top:           80,
        right:         16,
        zIndex:        (theme) => theme.zIndex.snackbar,
        display:       "flex",
        flexDirection: "column",
        gap:           1,
        pointerEvents: "none",
        "& > *":       { pointerEvents: "auto" },
      }}
    >
      <TransitionGroup component={null}>
        {notifications.map((n) => (
          <Collapse key={n.id} timeout={250}>
            <Box sx={{ mb: 1 }}>
              <Toast notif={n} onDismiss={handleDismiss} />
            </Box>
          </Collapse>
        ))}
      </TransitionGroup>
    </Box>
  );
}
