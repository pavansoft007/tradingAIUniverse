"use client";

import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SendIcon from "@mui/icons-material/Send";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { alpha, useTheme } from "@mui/material/styles";
import { useEffect, useRef, useState } from "react";
import { useAIStore } from "@/store/useAIStore";
import type { ChatMessage } from "@/store/useAIStore";

// ── Mock AI brain ─────────────────────────────────────────────────────────────

const RESPONSES: Record<string, string> = {
  portfolio: `Portfolio Analysis

Your portfolio stands at ₹1,51,200 with +₹17,250 unrealized gain (+12.89%).

Key insights:
• Best performer: BAJFINANCE +6.62%
• Weak link: WIPRO -4.81%, INFY -6.08%
• Concentration risk: HDFCBANK 28.7% — consider rebalancing if >30%
• All large-caps with good diversification across Banking, IT, and Financials

Recommendation: Consider booking partial profits in RELIANCE and TCS (both approaching resistance). Add ICICIBANK on dips for banking exposure.`,

  risk: `Risk Assessment

Portfolio risk metrics:
• Beta: 1.12 (slightly above market — moves 12% more than Nifty)
• Sharpe Ratio: 2.34 (excellent — strong risk-adjusted returns)
• Max Drawdown: -8.42% (last 12 months)
• VaR (95%, 1-day): ₹8,200

Alerts:
⚠ INFY at -6.08% — approaching stop-loss territory
⚠ WIPRO showing weakness — IT sector headwinds

Action: Set stop-loss at ₹1,350 for INFY and ₹470 for WIPRO to limit downside.`,

  market: `Market Summary — NSE Today

Indices:
• Nifty 50: 23,456 (+0.82%)
• Bank Nifty: 48,234 (+1.24%)
• Nifty IT: 34,120 (-0.31%)
• Advance/Decline: 1,543 / 982

Sector rotation:
• Strong: Banking, FMCG, Auto, Infrastructure
• Weak: IT, Pharma, Metal

Key levels to watch:
• Nifty resistance: 23,600 | Support: 23,200
• Bank Nifty resistance: 48,800 | Support: 47,500

FII: Bought ₹2,840 Cr | DII: Sold ₹1,120 Cr`,

  reliance: `RELIANCE Analysis

Current: ₹2,710 (+1.29%)
Target: ₹2,920 | Stop-Loss: ₹2,600

Technical:
• Trend: Bullish above 200-DMA (₹2,485)
• RSI (14): 62 — approaching overbought zone
• MACD: Positive crossover confirmed
• Support: ₹2,650 | Resistance: ₹2,750

Fundamental:
• Revenue growth: +8.4% QoQ
• Jio subscriber additions strong (+4.2M)
• Retail segment outperforming sector

Signal: HOLD — Wait for pullback to ₹2,640 for fresh entry. Strong long-term story.`,

  tcs: `TCS Analysis

Current: ₹3,682 (-0.49%)
Target: ₹3,900 | Stop-Loss: ₹3,500

Technical:
• Consolidating in ₹3,600–₹3,750 range (4 weeks)
• RSI (14): 48 — neutral, no divergence
• Volume slightly below 20-day average

Fundamental:
• Q3 revenue beat estimates by 2.1%
• Deal TCV: $8.1B — strong pipeline
• IT sector facing near-term US slowdown headwinds

Signal: HOLD — Accumulate on dips below ₹3,600. Strong long-term franchise.`,

  trade_ideas: `Today's Trade Ideas

Bullish setups:
1. HDFCBANK — Breaking out above ₹1,710 resistance
   Entry: ₹1,715 | Target: ₹1,780 | SL: ₹1,680 | R:R = 2.1

2. BAJFINANCE — NBFC rally + RSI oversold bounce
   Entry: ₹7,200 | Target: ₹7,600 | SL: ₹7,000 | R:R = 2.0

Bearish setups:
1. WIPRO — IT weakness + death cross on daily
   Short below ₹495 | Target: ₹470 | SL: ₹510

Options play:
• NIFTY 23,500 CE (weekly expiry) — Cost: ₹85, Target: ₹180

Note: All ideas are for educational purposes. Always verify with your own analysis and risk management.`,

  infy: `INFOSYS Analysis

Current: ₹1,390 (-0.88%)
Your position: 30 qty @ ₹1,480 | P&L: -₹2,700 (-6.08%)

Technical:
• Death cross: 50-DMA crossed below 200-DMA
• RSI (14): 38 — oversold, potential bounce
• Key support: ₹1,350 (strong historical level)

Risk alert: Your position is -6.08% below entry. Recommend setting a hard stop at ₹1,350.

Fundamental:
• Q3 revenue slightly below guidance
• Management cautious on FY25 outlook
• Attrition improved but deal wins slowed

Action: Consider reducing position by 30–50% to limit further downside. Re-enter below ₹1,320 with smaller size.`,
};

function getMockResponse(input: string): { text: string; delay: number } {
  const q = input.toLowerCase();
  if (q.includes("portfolio") || q.includes("holding") || q.includes("p&l"))
    return { text: RESPONSES.portfolio, delay: 2000 };
  if (q.includes("risk") || q.includes("drawdown") || q.includes("var"))
    return { text: RESPONSES.risk, delay: 2200 };
  if (q.includes("market") || q.includes("nifty") || q.includes("sensex") || q.includes("fii"))
    return { text: RESPONSES.market, delay: 1800 };
  if (q.includes("reliance"))
    return { text: RESPONSES.reliance, delay: 2400 };
  if (q.includes("tcs"))
    return { text: RESPONSES.tcs, delay: 2000 };
  if (q.includes("infy") || q.includes("infosys"))
    return { text: RESPONSES.infy, delay: 2200 };
  if (
    q.includes("trade idea") ||
    q.includes("buy") ||
    q.includes("sell") ||
    q.includes("opportunity")
  )
    return { text: RESPONSES.trade_ideas, delay: 2600 };
  return {
    text: `I can help you with:

• Portfolio analysis — Review holdings and P&L
• Market overview — Current trends and sector rotation
• Risk assessment — Portfolio risk metrics and alerts
• Trade ideas — Opportunities with entry/target/SL
• Stock analysis — RELIANCE, TCS, INFY, HDFCBANK, etc.

Try asking: "Analyze my portfolio" or "What's the market outlook?"`,
    delay: 1200,
  };
}

// ── Quick action chips ────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { label: "Portfolio Review",  prompt: "Analyze my portfolio and give insights" },
  { label: "Market Summary",    prompt: "What is today's market summary?" },
  { label: "Risk Check",        prompt: "What is my portfolio risk assessment?" },
  { label: "Trade Ideas",       prompt: "Give me today's trade ideas" },
];

// ── Message bubble ────────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <Box sx={{ display: "flex", gap: 0.5, alignItems: "center", py: 0.5 }}>
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          sx={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            bgcolor: "primary.main",
            animation: "typing-bounce 1.2s infinite",
            animationDelay: `${i * 0.2}s`,
            "@keyframes typing-bounce": {
              "0%, 80%, 100%": { transform: "scale(0.6)", opacity: 0.4 },
              "40%": { transform: "scale(1)", opacity: 1 },
            },
          }}
        />
      ))}
    </Box>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const theme = useTheme();
  const isUser = msg.role === "user";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: isUser ? "row-reverse" : "row",
        alignItems: "flex-end",
        gap: 1,
        mb: 2,
      }}
    >
      {!isUser && (
        <Avatar
          sx={{
            width: 28,
            height: 28,
            background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
            flexShrink: 0,
            mb: 0.25,
          }}
        >
          <AutoAwesomeIcon sx={{ fontSize: 15 }} />
        </Avatar>
      )}

      <Box sx={{ maxWidth: "82%", display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start" }}>
        <Box
          sx={{
            px: 1.75,
            py: 1.25,
            borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
            background: isUser
              ? `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`
              : theme.palette.mode === "dark"
              ? alpha(theme.palette.common.white, 0.05)
              : alpha(theme.palette.common.black, 0.04),
            border: isUser ? "none" : `1px solid ${alpha(theme.palette.divider, 0.8)}`,
            backdropFilter: isUser ? "none" : "blur(8px)",
          }}
        >
          {msg.isTyping ? (
            <TypingDots />
          ) : (
            <Typography
              variant="body2"
              sx={{
                color: isUser ? "#fff" : "text.primary",
                whiteSpace: "pre-wrap",
                lineHeight: 1.65,
                fontSize: 13,
              }}
            >
              {msg.content}
            </Typography>
          )}
        </Box>
        <Typography
          variant="caption"
          color="text.disabled"
          sx={{ fontSize: 10, mt: 0.4, px: 0.5 }}
        >
          {msg.timestamp.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Typography>
      </Box>
    </Box>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────

const PANEL_WIDTH = 400;

export function AIAssistantPanel() {
  const theme = useTheme();
  const { messages, isPanelOpen, isLoading, closePanel, addMessage, updateMessage, clearMessages, setLoading } =
    useAIStore();

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setInput("");
    addMessage("user", trimmed);
    setLoading(true);

    // Add typing indicator
    const typingMsg = addMessage("assistant", "");
    updateMessage(typingMsg.id, "", true);

    const { text: response, delay } = getMockResponse(trimmed);

    await new Promise((r) => setTimeout(r, delay));

    updateMessage(typingMsg.id, response, false);
    setLoading(false);
  };

  const handleSend = () => sendMessage(input);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const showQuickActions = messages.length <= 1;

  return (
    <Drawer
      anchor="right"
      open={isPanelOpen}
      onClose={closePanel}
      variant="temporary"
      ModalProps={{ keepMounted: true }}
      PaperProps={{
        sx: {
          width: { xs: "100vw", sm: PANEL_WIDTH },
          bgcolor: "background.paper",
          backgroundImage: "none",
          display: "flex",
          flexDirection: "column",
          borderLeft: "1px solid",
          borderColor: "divider",
        },
      }}
    >
      {/* ── Header ── */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          borderBottom: "1px solid",
          borderColor: "divider",
          flexShrink: 0,
          background:
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.06) 100%)"
              : "linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(139,92,246,0.03) 100%)",
        }}
      >
        <Avatar
          sx={{
            width: 34,
            height: 34,
            background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
            boxShadow: "0 0 12px rgba(99,102,241,0.4)",
          }}
        >
          <AutoAwesomeIcon sx={{ fontSize: 17 }} />
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>
            AI Market Analyst
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.25 }}>
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                bgcolor: "#00D97E",
                animation: "pulse 1.5s infinite",
                "@keyframes pulse": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.3 } },
              }}
            />
            <Typography sx={{ fontSize: 11, color: "text.secondary" }}>Online</Typography>
          </Box>
        </Box>
        <Chip
          label="Beta"
          size="small"
          sx={{
            height: 18,
            fontSize: 10,
            fontWeight: 700,
            bgcolor: "rgba(99,102,241,0.12)",
            color: "#818CF8",
            border: "1px solid rgba(99,102,241,0.25)",
          }}
        />
        <Tooltip title="Clear chat">
          <IconButton size="small" onClick={clearMessages} sx={{ opacity: 0.6 }}>
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <IconButton size="small" onClick={closePanel}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* ── Messages ── */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          px: 2,
          py: 2,
          display: "flex",
          flexDirection: "column",
          "&::-webkit-scrollbar": { width: 4 },
          "&::-webkit-scrollbar-track": { bgcolor: "transparent" },
          "&::-webkit-scrollbar-thumb": { bgcolor: "divider", borderRadius: 2 },
        }}
      >
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}

        {/* Quick actions — shown only before first interaction */}
        {showQuickActions && (
          <Box sx={{ mt: 1 }}>
            <Typography
              variant="caption"
              color="text.disabled"
              sx={{ display: "block", mb: 1, textAlign: "center" }}
            >
              Quick actions
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, justifyContent: "center" }}>
              {QUICK_ACTIONS.map((qa) => (
                <Chip
                  key={qa.label}
                  label={qa.label}
                  size="small"
                  variant="outlined"
                  clickable
                  onClick={() => sendMessage(qa.prompt)}
                  sx={{
                    fontSize: 11,
                    height: 26,
                    borderColor: alpha(theme.palette.primary.main, 0.35),
                    color: "text.secondary",
                    "&:hover": {
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      borderColor: "primary.main",
                      color: "primary.main",
                    },
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </Box>

      <Divider />

      {/* ── Disclaimer ── */}
      <Typography
        sx={{
          fontSize: 10,
          color: "text.disabled",
          textAlign: "center",
          px: 2,
          pt: 0.75,
          flexShrink: 0,
        }}
      >
        AI-generated insights. Not financial advice. Verify independently.
      </Typography>

      {/* ── Input ── */}
      <Box sx={{ p: 1.5, flexShrink: 0 }}>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          size="small"
          placeholder="Ask about markets, portfolio, or trade ideas…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    sx={{
                      bgcolor: input.trim() && !isLoading ? "primary.main" : "transparent",
                      color: input.trim() && !isLoading ? "#fff" : "text.disabled",
                      "&:hover": {
                        bgcolor: input.trim() && !isLoading ? "primary.dark" : "transparent",
                      },
                      transition: "all 0.2s",
                      width: 30,
                      height: 30,
                    }}
                  >
                    <SendIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 3,
              fontSize: 13,
            },
          }}
        />
      </Box>
    </Drawer>
  );
}
