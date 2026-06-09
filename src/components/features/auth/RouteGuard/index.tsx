"use client";

import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAngelOneStore } from "@/store/useAngelOneStore";
import { useAutoTokenRefresh, useSessionHydration } from "@/hooks/useAngelOneAuth";

interface RouteGuardProps {
  children: ReactNode;
}

/**
 * Client-side route guard for the dashboard layout.
 *
 * - Waits for sessionStorage hydration before rendering children.
 * - Redirects to /login if no valid session exists after hydration.
 * - Starts the proactive token-refresh timer.
 *
 * The Next.js edge middleware (`src/middleware.ts`) provides a first layer of
 * protection based on the session cookie, but this component is the authoritative
 * check using the actual in-memory Zustand state.
 */
export function RouteGuard({ children }: RouteGuardProps) {
  const router = useRouter();
  const isHydrated = useSessionHydration();
  const { isAuthenticated, isSessionValid } = useAngelOneStore();

  // Start proactive JWT refresh timer
  useAutoTokenRefresh();

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated || !isSessionValid()) {
      router.replace("/login");
    }
  }, [isHydrated, isAuthenticated, isSessionValid, router]);

  // Show a full-screen loader while sessionStorage is being read
  if (!isHydrated) {
    return (
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.default",
          zIndex: 9999,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Don't flash dashboard content before redirect happens
  if (!isAuthenticated) return null;

  return <>{children}</>;
}
