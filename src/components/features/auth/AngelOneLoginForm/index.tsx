"use client";

import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { useAngelOneLogin, useRememberedClientCode } from "@/hooks/useAngelOneAuth";
import { getAngelOneErrorMessage } from "@/types/angelone.types";

export function AngelOneLoginForm() {
  const { load: loadRemembered, save: saveRemembered, clear: clearRemembered } = useRememberedClientCode();

  const [clientCode, setClientCode] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const loginMutation = useAngelOneLogin();

  // Restore remembered client code on mount
  useEffect(() => {
    const remembered = loadRemembered();
    if (remembered) {
      setClientCode(remembered);
      setRememberMe(true);
    }
  }, [loadRemembered]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    setErrorMsg("");

    if (!clientCode.trim()) { setErrorMsg("Client ID is required."); return; }
    if (!password) { setErrorMsg("Password is required."); return; }
    if (totp.length !== 6) { setErrorMsg("Enter the 6-digit TOTP from your authenticator app."); return; }

    if (rememberMe) saveRemembered(clientCode.trim());
    else clearRemembered();

    loginMutation.mutate(
      { clientcode: clientCode.trim().toUpperCase(), password, totp },
      {
        onError: (err) => {
          const e = err as Error & { errorcode?: string };
          setErrorMsg(getAngelOneErrorMessage(e.errorcode ?? ""));
          setTotp(""); // Always clear TOTP on failure — it's single-use
        },
      },
    );
  };

  // Auto-submit when 6 TOTP digits are entered
  const handleTotpChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setTotp(digits);
    if (digits.length === 6 && clientCode && password) {
      // Defer one tick so state update settles
      setTimeout(() => handleSubmit(), 0);
    }
  };

  const isLoading = loginMutation.isPending;
  const canSubmit = clientCode.trim() && password && totp.length === 6 && !isLoading;

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      {/* Error alert */}
      {errorMsg && (
        <Alert severity="error" sx={{ mb: 2.5 }} onClose={() => setErrorMsg("")}>
          {errorMsg}
        </Alert>
      )}

      {/* Client ID */}
      <TextField
        fullWidth
        label="Client ID"
        placeholder="e.g. A123456"
        value={clientCode}
        onChange={(e) => setClientCode(e.target.value.toUpperCase())}
        disabled={isLoading}
        autoComplete="username"
        autoFocus={!clientCode}
        slotProps={{
          htmlInput: { maxLength: 12, style: { textTransform: "uppercase" } },
        }}
        sx={{ mb: 2 }}
      />

      {/* Password */}
      <TextField
        fullWidth
        label="Password"
        type={showPassword ? "text" : "password"}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={isLoading}
        autoComplete="current-password"
        sx={{ mb: 2 }}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword((v) => !v)}
                  edge="end"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />

      {/* TOTP */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          label="TOTP"
          placeholder="000000"
          value={totp}
          onChange={(e) => handleTotpChange(e.target.value)}
          disabled={isLoading}
          autoComplete="one-time-code"
          slotProps={{
            htmlInput: {
              maxLength: 6,
              inputMode: "numeric" as const,
              style: {
                letterSpacing: "0.5em",
                fontFamily: "monospace",
                fontSize: "1.2rem",
                textAlign: "center",
              },
            },
            input: {
              endAdornment: totp.length > 0 && (
                <InputAdornment position="end">
                  <Chip
                    label={`${totp.length}/6`}
                    size="small"
                    color={totp.length === 6 ? "success" : "default"}
                    sx={{ height: 20, fontSize: 10 }}
                  />
                </InputAdornment>
              ),
            },
          }}
          helperText="6-digit code from your authenticator app"
        />
      </Box>

      {/* Remember me */}
      <FormControlLabel
        control={
          <Checkbox
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            size="small"
            disabled={isLoading}
          />
        }
        label={<Typography variant="body2">Remember Client ID</Typography>}
        sx={{ mb: 2.5 }}
      />

      <Divider sx={{ mb: 2.5 }} />

      {/* Submit */}
      <Button
        type="submit"
        fullWidth
        variant="contained"
        size="large"
        disabled={!canSubmit}
        sx={{ fontWeight: 700, borderRadius: 2, py: 1.25 }}
        startIcon={
          isLoading ? (
            <CircularProgress size={18} color="inherit" />
          ) : (
            <LockOutlinedIcon />
          )
        }
      >
        {isLoading ? "Authenticating…" : "Sign In"}
      </Button>

      {/* TOTP hint */}
      <Typography
        variant="caption"
        color="text.secondary"
        align="center"
        sx={{ display: "block", mt: 2 }}
      >
        Use Google Authenticator, Authy, or the Angel One app to generate your TOTP.
      </Typography>
    </Box>
  );
}
