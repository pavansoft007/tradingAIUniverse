"use client";

import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import SearchIcon from "@mui/icons-material/Search";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { alpha, useTheme } from "@mui/material/styles";
import { useState } from "react";
import { useAngelOneLogout, useAngelOneSession } from "@/hooks/useAngelOneAuth";
import { useThemeStore } from "@/store/useThemeStore";
import { NAV_W } from "@/components/layout/Sidebar";
import { HEADER_DESKTOP, HEADER_MOBILE } from "@/components/layout/DashboardLayout";

// ── Component ─────────────────────────────────────────────────────────────────

interface HeaderProps {
  onOpenNav: () => void;
  isDesktop: boolean;
}

export function Header({ onOpenNav, isDesktop }: HeaderProps) {
  const theme         = useTheme();
  const { mode, toggleTheme } = useThemeStore();
  const { user, clientCode }  = useAngelOneSession();
  const logoutMutation        = useAngelOneLogout();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClose  = () => setAnchorEl(null);
  const handleLogout = () => { handleClose(); logoutMutation.mutate(); };

  const displayName = user?.name ?? clientCode ?? "Trader";
  const initials    = displayName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  // bgBlur matching Minimal UI
  const bgBlur = {
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    backgroundColor: alpha(theme.palette.background.default, 0.8),
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        boxShadow: "none",
        ...bgBlur,
        height: HEADER_MOBILE,
        zIndex: theme.zIndex.appBar + 1,
        borderBottom: `1px dashed ${theme.palette.divider}`,
        transition: theme.transitions.create(["height"], {
          duration: theme.transitions.duration.shorter,
        }),
        ...(isDesktop && {
          height: HEADER_DESKTOP,
          width: `calc(100% - ${NAV_W + 1}px)`,
        }),
      }}
    >
      <Toolbar
        sx={{
          height: 1,
          px: { xs: 2, lg: 5 },
        }}
      >
        {/* Hamburger — mobile only */}
        {!isDesktop && (
          <IconButton
            onClick={onOpenNav}
            sx={{ mr: 1, color: "text.primary" }}
          >
            <MenuRoundedIcon />
          </IconButton>
        )}

        {/* Search */}
        <TextField
          size="small"
          placeholder="Search symbols…"
          sx={{
            width: { xs: 140, sm: 220 },
            "& .MuiOutlinedInput-root": {
              height: 40,
              fontSize: 13,
              borderRadius: "8px",
              bgcolor: alpha(theme.palette.grey[500], 0.08),
              "& fieldset": { borderColor: "transparent" },
              "&:hover fieldset": { borderColor: alpha(theme.palette.primary.main, 0.4) },
              "&.Mui-focused fieldset": { borderColor: theme.palette.primary.main },
            },
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 17, color: "text.disabled" }} />
                </InputAdornment>
              ),
              endAdornment: isDesktop ? (
                <InputAdornment position="end">
                  <Box
                    sx={{
                      px: 0.75,
                      py: 0.2,
                      borderRadius: "5px",
                      border: `1px solid ${theme.palette.divider}`,
                      display: "flex",
                    }}
                  >
                    <Typography sx={{ fontSize: 10, color: "text.disabled", fontFamily: "monospace" }}>
                      ⌘K
                    </Typography>
                  </Box>
                </InputAdornment>
              ) : undefined,
            },
          }}
        />

        <Box sx={{ flexGrow: 1 }} />

        {/* Right actions */}
        <Stack direction="row" alignItems="center" spacing={{ xs: 0.5, sm: 1 }}>
          {/* Market status */}
          <Chip
            size="small"
            label="Market Open"
            sx={{
              display: { xs: "none", md: "flex" },
              height: 24,
              fontSize: 11,
              fontWeight: 700,
              bgcolor: alpha(theme.palette.success.main, 0.12),
              color: "success.main",
              border: `1px solid ${alpha(theme.palette.success.main, 0.24)}`,
              "& .MuiChip-label": { px: 1 },
            }}
          />

          {/* Theme toggle */}
          <Tooltip title={mode === "dark" ? "Light mode" : "Dark mode"} arrow>
            <IconButton onClick={toggleTheme} sx={{ color: "text.primary" }}>
              {mode === "dark"
                ? <LightModeOutlinedIcon sx={{ fontSize: 20 }} />
                : <DarkModeOutlinedIcon  sx={{ fontSize: 20 }} />}
            </IconButton>
          </Tooltip>

          {/* Notifications */}
          <Tooltip title="Notifications" arrow>
            <IconButton sx={{ color: "text.primary" }}>
              <Badge
                badgeContent={3}
                color="error"
                sx={{ "& .MuiBadge-badge": { fontSize: 9, minWidth: 16, height: 16 } }}
              >
                <NotificationsNoneIcon sx={{ fontSize: 20 }} />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* User avatar */}
          <Tooltip title={displayName} arrow>
            <IconButton
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{
                p: 0,
                ml: 0.5,
                ...(Boolean(anchorEl) && {
                  "&::before": {
                    zIndex: 1,
                    content: "''",
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    position: "absolute",
                    bgcolor: alpha(theme.palette.grey[900], 0.64),
                  },
                }),
              }}
            >
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  fontSize: 13,
                  fontWeight: 700,
                  background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                  border: `2px solid ${alpha(theme.palette.primary.main, 0.24)}`,
                }}
              >
                {initials}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Stack>

        {/* User dropdown */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          slotProps={{
            paper: {
              sx: {
                mt: 1,
                minWidth: 200,
                p: 0,
                boxShadow: theme.shadows[24],
              },
            },
          }}
        >
          <Box sx={{ my: 1.5, px: 2.5 }}>
            <Typography variant="subtitle2" noWrap>{displayName}</Typography>
            {user?.email && (
              <Typography variant="body2" noWrap sx={{ color: "text.secondary" }}>
                {user.email}
              </Typography>
            )}
          </Box>

          <Divider sx={{ borderStyle: "dashed" }} />

          <MenuItem onClick={handleClose} sx={{ gap: 1.5, py: 1 }}>
            <ListItemIcon sx={{ minWidth: "auto" }}>
              <PersonOutlineIcon fontSize="small" />
            </ListItemIcon>
            Profile
          </MenuItem>

          <Divider sx={{ borderStyle: "dashed" }} />

          <MenuItem
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            sx={{ m: 1, gap: 1.5, color: "error.main" }}
          >
            <ListItemIcon sx={{ minWidth: "auto" }}>
              {logoutMutation.isPending
                ? <CircularProgress size={14} color="error" />
                : <LogoutIcon fontSize="small" color="error" />}
            </ListItemIcon>
            {logoutMutation.isPending ? "Signing out…" : "Sign Out"}
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
