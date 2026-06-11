"use client";

import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import Box from "@mui/material/Box";
import Fab from "@mui/material/Fab";
import Tooltip from "@mui/material/Tooltip";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { useState } from "react";
import { AIAssistantPanel }    from "@/components/features/ai/AIAssistantPanel";
import { OrderNotifications }  from "@/components/features/trading/OrderNotifications";
import { Header }              from "@/components/layout/Header";
import { Sidebar, NAV_W }      from "@/components/layout/Sidebar";
import { useClientCodeRecovery } from "@/hooks/useAngelOneAuth";
import { useSmartWsConnection } from "@/hooks/useMarketWatch";
import { useAIStore }           from "@/store/useAIStore";

// Header heights matching Minimal UI config-global
export const HEADER_MOBILE  = 64;
export const HEADER_DESKTOP = 92;

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  useSmartWsConnection();
  useClientCodeRecovery(); // silently recovers clientCode from profile API if missing

  const theme      = useTheme();
  const isDesktop  = useMediaQuery(theme.breakpoints.up("lg"));
  const toggleAI   = useAIStore((s) => s.togglePanel);
  const isPanelOpen = useAIStore((s) => s.isPanelOpen);

  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <Header onOpenNav={() => setMobileOpen(true)} isDesktop={isDesktop} />

      <Box sx={{ display: { lg: "flex" }, minHeight: { lg: 1 } }}>
        <Sidebar
          openNav={mobileOpen}
          onCloseNav={() => setMobileOpen(false)}
          isDesktop={isDesktop}
        />

        {/* Main */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            py: `${HEADER_MOBILE + 8}px`,
            ...(isDesktop && {
              px: 3,
              py: `${HEADER_DESKTOP + 8}px`,
              width: `calc(100% - ${NAV_W}px)`,
            }),
          }}
        >
          {children}
        </Box>
      </Box>

      {/* AI Assistant FAB */}
      <Tooltip title="AI Market Analyst" placement="left">
        <Fab
          onClick={toggleAI}
          size="medium"
          sx={{
            position: "fixed",
            bottom: 28,
            right: 28,
            zIndex: (t) => t.zIndex.drawer - 1,
            background: isPanelOpen
              ? "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)"
              : "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
            color: "#fff",
            boxShadow: "0 4px 20px rgba(99,102,241,0.45)",
            "&:hover": {
              background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
              boxShadow: "0 6px 28px rgba(99,102,241,0.55)",
            },
            transition: "all 0.2s",
            transform: isPanelOpen ? "rotate(20deg)" : "none",
          }}
        >
          <AutoAwesomeIcon />
        </Fab>
      </Tooltip>

      {/* AI panel drawer */}
      <AIAssistantPanel />

      {/* Order event toasts */}
      <OrderNotifications />
    </>
  );
}
