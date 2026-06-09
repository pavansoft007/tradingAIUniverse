"use client";

import AnalyticsIcon from "@mui/icons-material/Analytics";
import AutoGraphIcon from "@mui/icons-material/AutoGraph";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAngelOneSession } from "@/hooks/useAngelOneAuth";

export const SIDEBAR_WIDTH = 240;
export const SIDEBAR_COLLAPSED_WIDTH = 68;

const NAV_MAIN = [
  { label: "Dashboard", href: "/dashboard",  icon: <DashboardRoundedIcon fontSize="small" /> },
  { label: "Markets",   href: "/markets",    icon: <StorefrontOutlinedIcon fontSize="small" /> },
  { label: "Trading",   href: "/trading",    icon: <SwapHorizIcon fontSize="small" /> },
  { label: "Portfolio", href: "/portfolio",  icon: <AutoGraphIcon fontSize="small" /> },
  { label: "Analytics", href: "/analytics",  icon: <AnalyticsIcon fontSize="small" /> },
];

const NAV_BOTTOM = [
  { label: "Alerts",   href: "/alerts",   icon: <NotificationsNoneIcon fontSize="small" /> },
  { label: "Settings", href: "/settings", icon: <SettingsOutlinedIcon fontSize="small" /> },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  variant?: "permanent" | "temporary";
}

function NavButton({
  item,
  open,
  isActive,
}: {
  item: { label: string; href: string; icon: React.ReactNode };
  open: boolean;
  isActive: boolean;
}) {
  return (
    <ListItem disablePadding sx={{ mb: 0.5 }}>
      <Tooltip title={!open ? item.label : ""} placement="right" arrow>
        <ListItemButton
          component={Link}
          href={item.href}
          selected={isActive}
          sx={{
            borderRadius: "10px",
            px: open ? 1.5 : 1.25,
            py: 1,
            justifyContent: open ? "flex-start" : "center",
            position: "relative",
            overflow: "hidden",
            ...(isActive && {
              background: "linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.1) 100%)",
              "&::before": {
                content: '""',
                position: "absolute",
                left: 0,
                top: "20%",
                bottom: "20%",
                width: 3,
                borderRadius: "0 4px 4px 0",
                background: "linear-gradient(180deg, #6366F1 0%, #8B5CF6 100%)",
              },
            }),
            "&:hover": {
              background: isActive
                ? "linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(139,92,246,0.15) 100%)"
                : "rgba(255,255,255,0.05)",
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: open ? 34 : "auto",
              color: isActive ? "#818CF8" : "text.secondary",
              ...(isActive && { filter: "drop-shadow(0 0 6px rgba(99,102,241,0.6))" }),
            }}
          >
            {item.icon}
          </ListItemIcon>
          {open && (
            <ListItemText
              primary={item.label}
              slotProps={{
                primary: {
                  sx: {
                    fontSize: 13.5,
                    fontWeight: isActive ? 600 : 450,
                    color: isActive ? "#C7D2FE" : "text.secondary",
                    letterSpacing: "-0.01em",
                  },
                },
              }}
            />
          )}
        </ListItemButton>
      </Tooltip>
    </ListItem>
  );
}

function SectionLabel({ label, open }: { label: string; open: boolean }) {
  if (!open) return <Box sx={{ my: 1, borderTop: "1px solid rgba(255,255,255,0.06)" }} />;
  return (
    <Typography
      variant="caption"
      sx={{
        display: "block",
        px: 1.5,
        py: 0.75,
        color: "text.secondary",
        fontWeight: 700,
        fontSize: 10,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        opacity: 0.6,
      }}
    >
      {label}
    </Typography>
  );
}

export function Sidebar({ open, onClose, variant = "permanent" }: SidebarProps) {
  const pathname  = usePathname();
  const { user, clientCode } = useAngelOneSession();
  const displayName = user?.name ?? clientCode ?? "Trader";
  const initials    = displayName.charAt(0).toUpperCase();

  const isActive = (href: string) =>
    pathname === href || (pathname.startsWith(href + "/") && href !== "/");

  const drawer = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "linear-gradient(180deg, #070C18 0%, #050810 100%)",
      }}
    >
      {/* Brand */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: open ? "space-between" : "center",
          px: open ? 2 : 1,
          minHeight: 64,
        }}
      >
        {open && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: "9px",
                background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 16px rgba(99,102,241,0.5)",
                flexShrink: 0,
              }}
            >
              <ShowChartIcon sx={{ fontSize: 17, color: "white" }} />
            </Box>
            <Box>
              <Typography
                sx={{
                  fontSize: 15,
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  background: "linear-gradient(135deg, #C7D2FE 0%, #A5B4FC 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  lineHeight: 1.1,
                }}
              >
                TradingAI
              </Typography>
              <Typography sx={{ fontSize: 9, color: "#475569", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Universe
              </Typography>
            </Box>
          </Box>
        )}

        {!open && (
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: "10px",
              background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 16px rgba(99,102,241,0.4)",
            }}
          >
            <ShowChartIcon sx={{ fontSize: 18, color: "white" }} />
          </Box>
        )}

        {variant === "permanent" && (
          <Tooltip title={open ? "Collapse sidebar" : "Expand sidebar"} placement="right">
            <IconButton
              onClick={onClose}
              size="small"
              sx={{
                color: "text.secondary",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
                width: 24,
                height: 24,
                "&:hover": { background: "rgba(99,102,241,0.15)", color: "primary.light" },
              }}
            >
              {open ? <ChevronLeftIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Main nav */}
      <Box sx={{ px: 1, pt: 1, flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        <SectionLabel label="Main" open={open} />
        <List disablePadding>
          {NAV_MAIN.map((item) => (
            <NavButton key={item.href} item={item} open={open} isActive={isActive(item.href)} />
          ))}
        </List>

        <Box sx={{ mt: 1.5 }}>
          <SectionLabel label="Tools" open={open} />
          <List disablePadding>
            {NAV_BOTTOM.map((item) => (
              <NavButton key={item.href} item={item} open={open} isActive={isActive(item.href)} />
            ))}
          </List>
        </Box>
      </Box>

      {/* User footer */}
      <Box
        sx={{
          mx: 1,
          mb: 1.5,
          p: open ? 1.25 : 0.75,
          borderRadius: "10px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          justifyContent: open ? "flex-start" : "center",
          cursor: "default",
        }}
      >
        <Avatar
          sx={{
            width: 30,
            height: 30,
            fontSize: 12,
            fontWeight: 700,
            flexShrink: 0,
            background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
            boxShadow: "0 0 10px rgba(99,102,241,0.3)",
          }}
        >
          {initials}
        </Avatar>
        {open && (
          <Box sx={{ overflow: "hidden" }}>
            <Typography sx={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.2, color: "#E2E8F0" }} noWrap>
              {displayName}
            </Typography>
            <Typography sx={{ fontSize: 10.5, color: "#475569", fontWeight: 500 }} noWrap>
              Angel One · {user?.broker ?? "SMARTAPI"}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width: open ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED_WIDTH,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: open ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED_WIDTH,
          boxSizing: "border-box",
          overflowX: "hidden",
          border: "none",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          transition: (t) =>
            t.transitions.create("width", {
              easing: t.transitions.easing.sharp,
              duration: t.transitions.duration.enteringScreen,
            }),
        },
      }}
    >
      {drawer}
    </Drawer>
  );
}
