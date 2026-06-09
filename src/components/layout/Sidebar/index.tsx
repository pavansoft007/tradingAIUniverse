"use client";

import AnalyticsIcon from "@mui/icons-material/Analytics";
import AutoGraphIcon from "@mui/icons-material/AutoGraph";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha, styled, useTheme } from "@mui/material/styles";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useAngelOneSession } from "@/hooks/useAngelOneAuth";

// ── Constants ─────────────────────────────────────────────────────────────────

export const NAV_W = 280;

// ── Nav config ────────────────────────────────────────────────────────────────

const NAV_SECTIONS = [
  {
    subheader: "Trading",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: <DashboardRoundedIcon /> },
      { title: "Markets",   href: "/markets",   icon: <StorefrontOutlinedIcon /> },
      { title: "Trading",   href: "/trading",   icon: <SwapHorizIcon /> },
      { title: "Portfolio", href: "/portfolio", icon: <AutoGraphIcon /> },
      { title: "Analytics", href: "/analytics", icon: <AnalyticsIcon /> },
    ],
  },
  {
    subheader: "Management",
    items: [
      { title: "Alerts",   href: "/alerts",   icon: <NotificationsNoneIcon /> },
      { title: "Settings", href: "/settings", icon: <SettingsOutlinedIcon /> },
    ],
  },
];

// ── Styled subheader ──────────────────────────────────────────────────────────

const StyledSubheader = styled(ListSubheader)(({ theme }) => ({
  ...theme.typography.overline,
  fontSize: 11,
  paddingTop: theme.spacing(3),
  paddingBottom: theme.spacing(1),
  color: theme.palette.text.disabled,
  background: "transparent",
}));

// ── Nav item ──────────────────────────────────────────────────────────────────

function NavItem({ title, href, icon, active }: { title: string; href: string; icon: React.ReactNode; active: boolean }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const activeColor = isDark ? theme.palette.primary.light : theme.palette.primary.main;

  return (
    <ListItemButton
      component={Link}
      href={href}
      sx={{
        position: "relative",
        height: 48,
        borderRadius: `${theme.shape.borderRadius}px`,
        mb: 0.5,
        pl: 2,
        pr: 1.5,
        color: active ? activeColor : theme.palette.text.secondary,
        backgroundColor: active
          ? alpha(theme.palette.primary.main, theme.palette.action.selectedOpacity)
          : "transparent",
        "&:hover": {
          backgroundColor: active
            ? alpha(theme.palette.primary.main, theme.palette.action.selectedOpacity + 0.04)
            : alpha(theme.palette.text.primary, theme.palette.action.hoverOpacity),
        },
      }}
    >
      <ListItemIcon
        sx={{
          minWidth: 0,
          mr: 2,
          width: 24,
          height: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "inherit",
          "& svg": { fontSize: 22 },
        }}
      >
        {icon}
      </ListItemIcon>

      <ListItemText
        primary={title}
        primaryTypographyProps={{
          noWrap: true,
          component: "span" as React.ElementType,
          variant: active ? "subtitle2" : "body2",
        }}
      />
    </ListItemButton>
  );
}

// ── Logo ──────────────────────────────────────────────────────────────────────

function Logo() {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: "12px",
          background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 8px 16px rgba(99,102,241,0.3)",
          flexShrink: 0,
        }}
      >
        <ShowChartIcon sx={{ fontSize: 22, color: "white" }} />
      </Box>
      <Box>
        <Typography
          sx={{
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            color: "text.primary",
          }}
        >
          TradingAI
        </Typography>
        <Typography sx={{ fontSize: 10, color: "text.disabled", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Universe
        </Typography>
      </Box>
    </Box>
  );
}

// ── NavAccount ────────────────────────────────────────────────────────────────

function NavAccount() {
  const { user, clientCode } = useAngelOneSession();
  const displayName = user?.name ?? clientCode ?? "Trader";
  const initials    = displayName.charAt(0).toUpperCase();
  const theme       = useTheme();

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        p: 2,
        borderRadius: `${Number(theme.shape.borderRadius) * 1.5}px`,
        bgcolor: alpha(theme.palette.grey[500], 0.12),
        cursor: "default",
        transition: "opacity 200ms",
      }}
    >
      <Avatar
        sx={{
          width: 36,
          height: 36,
          fontSize: 14,
          fontWeight: 700,
          flexShrink: 0,
          background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
        }}
      >
        {initials}
      </Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="subtitle2" noWrap>
          {displayName}
        </Typography>
        <Typography variant="body2" noWrap sx={{ color: "text.secondary" }}>
          {user?.broker ?? "Angel One"}
        </Typography>
      </Box>
    </Box>
  );
}

// ── Bottom info card ──────────────────────────────────────────────────────────

function NavInfo() {
  const theme = useTheme();

  return (
    <Stack
      spacing={1}
      sx={{
        mx: 1,
        mb: 2,
        p: 2,
        borderRadius: 2,
        bgcolor: alpha(theme.palette.primary.main, 0.08),
        border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
        textAlign: "center",
      }}
    >
      <Box
        sx={{
          mx: "auto",
          width: 36,
          height: 36,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: alpha(theme.palette.primary.main, 0.12),
        }}
      >
        <ShowChartIcon sx={{ fontSize: 18, color: "primary.main" }} />
      </Box>
      <Typography variant="subtitle2">TradingAI Universe</Typography>
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        Powered by Angel One SmartAPI · Live market data
      </Typography>
    </Stack>
  );
}

// ── Sidebar content ───────────────────────────────────────────────────────────

function SidebarContent() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || (pathname.startsWith(href + "/") && href !== "/");

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        overflowX: "hidden",
        "&::-webkit-scrollbar": { width: 4 },
        "&::-webkit-scrollbar-thumb": { bgcolor: "divider", borderRadius: 2 },
      }}
    >
      {/* Logo + user account */}
      <Stack
        spacing={3}
        sx={{ pt: 3, pb: 2, px: 2.5, flexShrink: 0 }}
      >
        <Logo />
        <NavAccount />
      </Stack>

      {/* Nav sections */}
      <Box sx={{ flexGrow: 1 }}>
        {NAV_SECTIONS.map((section) => (
          <List key={section.subheader} disablePadding sx={{ px: 2 }}>
            <StyledSubheader disableSticky>{section.subheader}</StyledSubheader>
            {section.items.map((item) => (
              <NavItem
                key={item.href}
                title={item.title}
                href={item.href}
                icon={item.icon}
                active={isActive(item.href)}
              />
            ))}
          </List>
        ))}
      </Box>

      {/* Bottom info card */}
      <NavInfo />
    </Box>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

interface SidebarProps {
  openNav: boolean;
  onCloseNav: () => void;
  isDesktop: boolean;
}

export function Sidebar({ openNav, onCloseNav, isDesktop }: SidebarProps) {
  const pathname = usePathname();

  // Close mobile drawer on route change
  useEffect(() => {
    if (openNav) onCloseNav();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const paperSx = {
    width: NAV_W,
    bgcolor: "background.default",
    borderRight: "1px dashed",
    borderColor: "divider",
  };

  if (isDesktop) {
    return (
      <Box component="nav" sx={{ flexShrink: 0, width: NAV_W }}>
        <Drawer
          open
          variant="permanent"
          PaperProps={{ sx: { ...paperSx, zIndex: 0 } }}
        >
          <SidebarContent />
        </Drawer>
      </Box>
    );
  }

  return (
    <Drawer
      open={openNav}
      onClose={onCloseNav}
      ModalProps={{ keepMounted: true }}
      PaperProps={{ sx: paperSx }}
    >
      <SidebarContent />
    </Drawer>
  );
}
