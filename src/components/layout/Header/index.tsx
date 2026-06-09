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
import TextField from "@mui/material/TextField";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { useAngelOneLogout, useAngelOneSession } from "@/hooks/useAngelOneAuth";
import { useThemeStore } from "@/store/useThemeStore";

interface HeaderProps {
  onMenuClick: () => void;
  sidebarOpen: boolean;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { mode, toggleTheme } = useThemeStore();
  const { user, clientCode } = useAngelOneSession();
  const logoutMutation = useAngelOneLogout();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClose = () => setAnchorEl(null);
  const handleLogout = () => { handleClose(); logoutMutation.mutate(); };

  const displayName = user?.name ?? clientCode ?? "Trader";
  const initials = displayName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <AppBar position="fixed" elevation={0}>
      <Toolbar sx={{ gap: 1, minHeight: "60px !important" }}>
        {/* Menu toggle */}
        <IconButton
          onClick={onMenuClick}
          size="small"
          sx={{
            color: "text.secondary",
            "&:hover": { color: "text.primary", background: "rgba(255,255,255,0.06)" },
          }}
        >
          <MenuRoundedIcon fontSize="small" />
        </IconButton>

        {/* Search */}
        <TextField
          size="small"
          placeholder="Search symbols…"
          sx={{
            ml: 0.5,
            width: { xs: 150, sm: 240 },
            "& .MuiOutlinedInput-root": {
              borderRadius: "8px",
              height: 36,
              fontSize: 13,
              background: "rgba(255,255,255,0.04)",
              "& fieldset": { borderColor: "rgba(255,255,255,0.08)" },
              "&:hover fieldset": { borderColor: "rgba(99,102,241,0.4)" },
            },
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 15, color: "text.secondary" }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Box
                    sx={{
                      px: 0.75,
                      py: 0.2,
                      borderRadius: "5px",
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      display: { xs: "none", sm: "flex" },
                    }}
                  >
                    <Typography sx={{ fontSize: 10, color: "text.secondary", fontFamily: "monospace" }}>
                      ⌘K
                    </Typography>
                  </Box>
                </InputAdornment>
              ),
            },
          }}
        />

        <Box sx={{ flex: 1 }} />

        {/* Market status */}
        <Chip
          size="small"
          label="Market Open"
          sx={{
            display: { xs: "none", md: "flex" },
            height: 24,
            fontSize: 11,
            fontWeight: 700,
            background: "rgba(0,217,126,0.12)",
            color: "#00D97E",
            border: "1px solid rgba(0,217,126,0.25)",
            "& .MuiChip-label": { px: 1 },
            "&::before": {
              content: '""',
              display: "inline-block",
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#00D97E",
              ml: 0.5,
              animation: "pulse 1.5s ease-in-out infinite",
              "@keyframes pulse": {
                "0%, 100%": { opacity: 1 },
                "50%": { opacity: 0.3 },
              },
            },
          }}
        />

        {/* Theme toggle */}
        <Tooltip title={mode === "dark" ? "Light mode" : "Dark mode"} arrow>
          <IconButton
            onClick={toggleTheme}
            size="small"
            sx={{ color: "text.secondary", "&:hover": { color: "text.primary", background: "rgba(255,255,255,0.06)" } }}
          >
            {mode === "dark" ? <LightModeOutlinedIcon fontSize="small" /> : <DarkModeOutlinedIcon fontSize="small" />}
          </IconButton>
        </Tooltip>

        {/* Notifications */}
        <Tooltip title="Notifications" arrow>
          <IconButton
            size="small"
            sx={{ color: "text.secondary", "&:hover": { color: "text.primary", background: "rgba(255,255,255,0.06)" } }}
          >
            <Badge
              badgeContent={3}
              sx={{
                "& .MuiBadge-badge": {
                  fontSize: 9,
                  minWidth: 16,
                  height: 16,
                  background: "linear-gradient(135deg, #F23645 0%, #C41E2D 100%)",
                  boxShadow: "0 0 8px rgba(242,54,69,0.5)",
                },
              }}
            >
              <NotificationsNoneIcon fontSize="small" />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* User avatar */}
        <Tooltip title={displayName} arrow>
          <IconButton
            onClick={(e) => setAnchorEl(e.currentTarget)}
            size="small"
            sx={{ p: 0.25 }}
          >
            <Avatar
              sx={{
                width: 30,
                height: 30,
                fontSize: 11,
                fontWeight: 700,
                background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                boxShadow: "0 0 12px rgba(99,102,241,0.4)",
                border: "1.5px solid rgba(99,102,241,0.3)",
              }}
            >
              {initials}
            </Avatar>
          </IconButton>
        </Tooltip>

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
                minWidth: 210,
                mt: 0.75,
                background: "rgba(12,18,32,0.95)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.1)",
              },
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  fontSize: 13,
                  fontWeight: 700,
                  background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                }}
              >
                {initials}
              </Avatar>
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>{displayName}</Typography>
                {user?.email && (
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 140, display: "block" }}>
                    {user.email}
                  </Typography>
                )}
                {clientCode && (
                  <Typography sx={{ fontSize: 10, color: "#6366F1", fontWeight: 600, fontFamily: "monospace", mt: 0.25 }}>
                    {clientCode}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>

          <Divider sx={{ borderColor: "rgba(255,255,255,0.07)" }} />

          <MenuItem onClick={handleClose} sx={{ fontSize: 13, gap: 1.25, py: 1 }}>
            <ListItemIcon sx={{ minWidth: "auto" }}>
              <PersonOutlineIcon fontSize="small" sx={{ color: "text.secondary" }} />
            </ListItemIcon>
            Profile
          </MenuItem>

          <Divider sx={{ borderColor: "rgba(255,255,255,0.07)" }} />

          <MenuItem
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            sx={{ fontSize: 13, gap: 1.25, py: 1, color: "#F23645" }}
          >
            <ListItemIcon sx={{ minWidth: "auto" }}>
              {logoutMutation.isPending ? (
                <CircularProgress size={14} color="error" />
              ) : (
                <LogoutIcon fontSize="small" color="error" />
              )}
            </ListItemIcon>
            {logoutMutation.isPending ? "Signing out…" : "Sign Out"}
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
