import { createTheme } from "@mui/material/styles";

const baseTypography = {
  fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  h1: { fontWeight: 700, letterSpacing: "-0.02em" },
  h2: { fontWeight: 700, letterSpacing: "-0.02em" },
  h3: { fontWeight: 700, letterSpacing: "-0.01em" },
  h4: { fontWeight: 700, letterSpacing: "-0.01em" },
  h5: { fontWeight: 700 },
  h6: { fontWeight: 600 },
  subtitle1: { fontWeight: 600, letterSpacing: "-0.01em" },
  subtitle2: { fontWeight: 600 },
  body1: { letterSpacing: "-0.01em" },
  body2: { letterSpacing: "-0.01em" },
};

// ── Dark theme ───────────────────────────────────────────────────────────────

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#6366F1", light: "#818CF8", dark: "#4F46E5" },
    secondary: { main: "#00D97E", light: "#34EFA0", dark: "#00B868" },
    error: { main: "#F23645", light: "#FF6B75", dark: "#C41E2D" },
    warning: { main: "#F59E0B", light: "#FBD04C", dark: "#D97706" },
    success: { main: "#00D97E", light: "#34EFA0", dark: "#00B868" },
    info: { main: "#38BDF8", light: "#7DD3FC", dark: "#0EA5E9" },
    background: {
      default: "#161C24",
      paper: "#212B36",
    },
    text: {
      primary: "#FFFFFF",
      secondary: "#919EAB",
    },
    divider: "rgba(145,158,171,0.24)",
  },
  typography: baseTypography,
  shape: { borderRadius: 10 },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        * { font-feature-settings: 'tnum' on, 'lnum' on; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.3); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(99,102,241,0.6); }
      `,
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: "#212B36",
          backgroundImage: "none",
          boxShadow: "0 0 2px 0 rgba(145,158,171,0.2), 0 12px 24px -4px rgba(145,158,171,0.12)",
          borderRadius: 16,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          borderRadius: 12,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 8,
          letterSpacing: "0",
        },
        containedPrimary: {
          background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
          boxShadow: "0 0 20px rgba(99,102,241,0.25)",
          "&:hover": {
            background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
            boxShadow: "0 0 28px rgba(99,102,241,0.4)",
          },
        },
        containedSuccess: {
          background: "linear-gradient(135deg, #00D97E 0%, #059669 100%)",
          color: "#fff",
          boxShadow: "0 0 20px rgba(0,217,126,0.2)",
        },
        containedError: {
          background: "linear-gradient(135deg, #F23645 0%, #C41E2D 100%)",
          boxShadow: "0 0 20px rgba(242,54,69,0.2)",
        },
        outlined: {
          borderColor: "rgba(255,255,255,0.12)",
          "&:hover": { borderColor: "rgba(99,102,241,0.6)", background: "rgba(99,102,241,0.08)" },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6, fontWeight: 600, fontSize: 11 },
        colorSuccess: {
          background: "rgba(0,217,126,0.15)",
          color: "#00D97E",
          border: "1px solid rgba(0,217,126,0.3)",
        },
        colorError: {
          background: "rgba(242,54,69,0.15)",
          color: "#F23645",
          border: "1px solid rgba(242,54,69,0.3)",
        },
        colorWarning: {
          background: "rgba(245,158,11,0.15)",
          color: "#F59E0B",
          border: "1px solid rgba(245,158,11,0.3)",
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          "& .MuiTableCell-root": {
            background: "rgba(5,8,15,0.6)",
            color: "#64748B",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: "1px solid rgba(255,255,255,0.04)",
          padding: "10px 12px",
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:hover": { background: "rgba(99,102,241,0.04)" },
          transition: "background 0.15s",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 8,
            background: "rgba(255,255,255,0.03)",
            "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
            "&:hover fieldset": { borderColor: "rgba(99,102,241,0.5)" },
            "&.Mui-focused fieldset": { borderColor: "#6366F1" },
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { backgroundImage: "none" },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          boxShadow: "none",
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 600, minHeight: 40 },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          background: "rgba(12,18,32,0.95)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8,
          fontSize: 12,
        },
        arrow: { color: "rgba(12,18,32,0.95)" },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 4, height: 5, background: "rgba(255,255,255,0.08)" },
        bar: { borderRadius: 4 },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          "&.Mui-selected": {
            background: "rgba(99,102,241,0.15)",
            "&:hover": { background: "rgba(99,102,241,0.2)" },
          },
        },
      },
    },
  },
});

// ── Light theme ───────────────────────────────────────────────────────────────

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#6366F1", light: "#818CF8", dark: "#4F46E5" },
    secondary: { main: "#059669", light: "#10B981", dark: "#047857" },
    error: { main: "#DC2626", light: "#EF4444", dark: "#B91C1C" },
    warning: { main: "#D97706", light: "#F59E0B", dark: "#B45309" },
    success: { main: "#059669", light: "#10B981", dark: "#047857" },
    info: { main: "#0284C7", light: "#38BDF8", dark: "#0369A1" },
    background: { default: "#F4F6F8", paper: "#FFFFFF" },
    text: { primary: "#212B36", secondary: "#637381" },
    divider: "rgba(145,158,171,0.24)",
  },
  typography: baseTypography,
  shape: { borderRadius: 10 },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        * { font-feature-settings: 'tnum' on, 'lnum' on; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.25); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(99,102,241,0.5); }
      `,
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: "#FFFFFF",
          backgroundImage: "none",
          boxShadow: "0 0 2px 0 rgba(145,158,171,0.2), 0 12px 24px -4px rgba(145,158,171,0.12)",
          borderRadius: 16,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          borderRadius: 12,
          boxShadow: "0 0 2px 0 rgba(145,158,171,0.2), 0 12px 24px -4px rgba(145,158,171,0.12)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 600, borderRadius: 8, letterSpacing: "0" },
        containedPrimary: {
          background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
          boxShadow: "0 2px 8px rgba(99,102,241,0.3)",
          "&:hover": { boxShadow: "0 4px 14px rgba(99,102,241,0.4)" },
        },
        containedSuccess: {
          background: "linear-gradient(135deg, #059669 0%, #10B981 100%)",
          color: "#fff",
        },
        containedError: {
          background: "linear-gradient(135deg, #DC2626 0%, #EF4444 100%)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6, fontWeight: 600, fontSize: 11 },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          "& .MuiTableCell-root": {
            background: "#F8FAFF",
            color: "#64748B",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            borderBottom: "1px solid rgba(0,0,0,0.07)",
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderBottom: "1px solid rgba(0,0,0,0.05)", padding: "10px 12px" },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: { "&:hover": { background: "rgba(99,102,241,0.03)" }, transition: "background 0.15s" },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 8,
            "& fieldset": { borderColor: "rgba(0,0,0,0.12)" },
            "&:hover fieldset": { borderColor: "rgba(99,102,241,0.5)" },
            "&.Mui-focused fieldset": { borderColor: "#6366F1" },
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: { paper: { background: "#FFFFFF", borderRight: "1px solid rgba(0,0,0,0.07)" } },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: "rgba(255,255,255,0.9)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(0,0,0,0.07)",
          boxShadow: "none",
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          "&.Mui-selected": {
            background: "rgba(99,102,241,0.1)",
            "&:hover": { background: "rgba(99,102,241,0.14)" },
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { background: "#1E293B", borderRadius: 8, fontSize: 12 },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 4, height: 5 },
        bar: { borderRadius: 4 },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 600, minHeight: 40 },
      },
    },
  },
});
