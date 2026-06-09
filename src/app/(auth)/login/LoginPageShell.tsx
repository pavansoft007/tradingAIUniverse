"use client";

import AutoGraphIcon from "@mui/icons-material/AutoGraph";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import SecurityIcon from "@mui/icons-material/Security";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import SpeedIcon from "@mui/icons-material/Speed";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import { AngelOneLoginForm } from "@/components/features/auth/AngelOneLoginForm";

const FEATURES = [
  { icon: <ShowChartIcon sx={{ fontSize: 16 }} />, text: "Real-time SmartAPI streaming" },
  { icon: <AutoGraphIcon sx={{ fontSize: 16 }} />, text: "AI-powered trade signals" },
  { icon: <SpeedIcon sx={{ fontSize: 16 }} />, text: "Sub-10ms order execution" },
  { icon: <SecurityIcon sx={{ fontSize: 16 }} />, text: "Bank-grade security (TOTP + JWT)" },
];

export function LoginPageShell() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        bgcolor: "background.default",
        background: (t) =>
          t.palette.mode === "dark"
            ? "radial-gradient(ellipse at 20% 0%, rgba(99,102,241,0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(0,217,126,0.08) 0%, transparent 50%), #05080F"
            : "radial-gradient(ellipse at 20% 0%, rgba(99,102,241,0.08) 0%, transparent 50%), #F0F4FF",
      }}
    >
      {/* Left panel — brand + features (desktop only) */}
      <Box
        sx={{
          display: { xs: "none", lg: "flex" },
          flexDirection: "column",
          justifyContent: "center",
          flex: 1,
          px: { lg: 8, xl: 12 },
          maxWidth: 560,
        }}
      >
        {/* Logo */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: "13px",
              background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 24px rgba(99,102,241,0.5)",
            }}
          >
            <ShowChartIcon sx={{ color: "white", fontSize: 22 }} />
          </Box>
          <Box>
            <Typography
              sx={{
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: "-0.02em",
                background: "linear-gradient(135deg, #C7D2FE 0%, #A5B4FC 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                lineHeight: 1,
              }}
            >
              TradingAI Universe
            </Typography>
            <Typography sx={{ fontSize: 11, color: "#475569", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Powered by Angel One SmartAPI
            </Typography>
          </Box>
        </Box>

        {/* Headline */}
        <Typography
          sx={{
            fontSize: { lg: 36, xl: 42 },
            fontWeight: 900,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            mb: 2,
          }}
        >
          Professional trading,{" "}
          <Box component="span" sx={{ background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            AI-powered
          </Box>{" "}
          intelligence.
        </Typography>

        <Typography sx={{ fontSize: 15, color: "text.secondary", mb: 4, lineHeight: 1.6 }}>
          Connect your Angel One account for real-time streaming, algorithmic signals,
          and institutional-grade analytics.
        </Typography>

        {/* Feature list */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {FEATURES.map((f) => (
            <Box key={f.text} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  width: 30,
                  height: 30,
                  borderRadius: "8px",
                  background: "rgba(99,102,241,0.12)",
                  border: "1px solid rgba(99,102,241,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#818CF8",
                  flexShrink: 0,
                }}
              >
                {f.icon}
              </Box>
              <Typography sx={{ fontSize: 13.5, color: "text.secondary" }}>{f.text}</Typography>
              <CheckCircleOutlineIcon sx={{ fontSize: 14, color: "#00D97E", ml: "auto" }} />
            </Box>
          ))}
        </Box>
      </Box>

      {/* Right panel — login form */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
          py: 4,
          maxWidth: { lg: 480 },
          mx: { xs: "auto", lg: 0 },
          width: "100%",
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 420,
            background: (t) =>
              t.palette.mode === "dark"
                ? "rgba(12,18,32,0.85)"
                : "rgba(255,255,255,0.95)",
            backdropFilter: "blur(24px)",
            border: "1px solid",
            borderColor: (t) =>
              t.palette.mode === "dark"
                ? "rgba(255,255,255,0.08)"
                : "rgba(0,0,0,0.08)",
            borderRadius: 3,
            p: { xs: 3, sm: 4 },
            boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
          }}
        >
          {/* Mobile logo */}
          <Box sx={{ display: { xs: "flex", lg: "none" }, alignItems: "center", gap: 1.25, mb: 3 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "10px",
                background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 18px rgba(99,102,241,0.4)",
              }}
            >
              <ShowChartIcon sx={{ color: "white", fontSize: 19 }} />
            </Box>
            <Typography
              sx={{
                fontSize: 16,
                fontWeight: 800,
                letterSpacing: "-0.02em",
                background: "linear-gradient(135deg, #C7D2FE 0%, #A5B4FC 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              TradingAI Universe
            </Typography>
          </Box>

          <Typography sx={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", mb: 0.5 }}>
            Welcome back
          </Typography>
          <Typography sx={{ fontSize: 13.5, color: "text.secondary", mb: 2.5 }}>
            Sign in with your Angel One credentials
          </Typography>

          <Divider sx={{ mb: 3 }}>
            <Chip
              label="Secure · Angel One SmartAPI"
              size="small"
              sx={{
                fontSize: 10,
                fontWeight: 600,
                height: 22,
                background: "rgba(99,102,241,0.1)",
                color: "#818CF8",
                border: "1px solid rgba(99,102,241,0.2)",
              }}
            />
          </Divider>

          <AngelOneLoginForm />
        </Box>
      </Box>
    </Box>
  );
}
