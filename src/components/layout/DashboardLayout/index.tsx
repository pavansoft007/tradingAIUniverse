"use client";

import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar, SIDEBAR_COLLAPSED_WIDTH, SIDEBAR_WIDTH } from "@/components/layout/Sidebar";
import { useSmartWsConnection } from "@/hooks/useMarketWatch";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  useSmartWsConnection();          // opens SmartAPI WS for the session lifetime

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Always start open (matches server render), then close on mobile after mount.
  // This avoids an SSR/client useState(isMobile) mismatch.
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [isMobile]);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Header onMenuClick={toggleSidebar} sidebarOpen={sidebarOpen} />

      <Sidebar
        open={sidebarOpen}
        onClose={toggleSidebar}
        variant={isMobile ? "temporary" : "permanent"}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          ml: isMobile ? 0 : `${sidebarOpen ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED_WIDTH}px`,
          transition: (t) =>
            t.transitions.create("margin", {
              easing: t.transitions.easing.sharp,
              duration: t.transitions.duration.enteringScreen,
            }),
        }}
      >
        <Toolbar />
        <Box sx={{ p: { xs: 2, sm: 3 } }}>{children}</Box>
      </Box>
    </Box>
  );
}
