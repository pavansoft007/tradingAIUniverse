"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { angelOneService } from "@/lib/api/services/angelone.service";
import { sessionUtil } from "@/lib/utils/session";
import { useAngelOneStore } from "@/store/useAngelOneStore";
import type { AngelOneLoginPayload, AngelOneUser } from "@/types/angelone.types";

const REFRESH_BUFFER_MS = 5 * 60 * 1000; // Refresh 5 minutes before expiry

// ── Login ─────────────────────────────────────────────────────────────────────

export function useAngelOneLogin() {
  const { setSession } = useAngelOneStore();
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: AngelOneLoginPayload) => angelOneService.login(payload),
    onSuccess: (res) => {
      const { jwtToken, refreshToken, feedToken, ...userFields } = res.data;
      const user: AngelOneUser = userFields;
      setSession({ jwtToken, refreshToken, feedToken }, user, user.clientcode);
      router.replace("/dashboard");
    },
  });
}

// ── Logout ────────────────────────────────────────────────────────────────────

export function useAngelOneLogout() {
  const { clearSession, clientCode } = useAngelOneStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      if (clientCode) {
        // Best-effort server-side session invalidation
        try {
          await angelOneService.logout(clientCode);
        } catch {
          // Proceed with local logout even if server call fails
        }
      }
    },
    onSettled: () => {
      clearSession();
      queryClient.clear();
      router.replace("/login");
    },
  });
}

// ── Auto token refresh ────────────────────────────────────────────────────────

/**
 * Schedules a proactive token refresh before the JWT expires.
 * Call this once at the top of the dashboard layout.
 */
export function useAutoTokenRefresh() {
  const { session, updateTokens, clearSession } = useAngelOneStore();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleRefresh = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!session?.tokenExpiry || !session.refreshToken) return;

    const delay = session.tokenExpiry - Date.now() - REFRESH_BUFFER_MS;
    if (delay <= 0) return; // Already near-expired; let the interceptor handle it

    timerRef.current = setTimeout(async () => {
      try {
        const res = await angelOneService.refreshTokens(session.refreshToken);
        updateTokens(res.data);
      } catch {
        clearSession();
        window.location.href = "/login";
      }
    }, delay);
  }, [session, updateTokens, clearSession]);

  useEffect(() => {
    scheduleRefresh();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [scheduleRefresh]);
}

// ── Hydration ─────────────────────────────────────────────────────────────────

/**
 * Restores the JWT session from sessionStorage on initial page load.
 * Must be called once in the root layout (client boundary).
 */
export function useSessionHydration() {
  const { rehydrate, isHydrated } = useAngelOneStore();

  useEffect(() => {
    if (!isHydrated) rehydrate();
  }, [isHydrated, rehydrate]);

  return isHydrated;
}

// ── Session info (read-only) ──────────────────────────────────────────────────

export function useAngelOneSession() {
  return useAngelOneStore(
    useShallow((s) => ({
      user: s.user,
      session: s.session,
      clientCode: s.clientCode,
      isAuthenticated: s.isAuthenticated,
      feedToken: s.session?.feedToken ?? null,
    })),
  );
}

// ── "Remember me" client code ─────────────────────────────────────────────────

export function useRememberedClientCode() {
  const load = useCallback(() => sessionUtil.loadRememberedClientCode(), []);
  const save = useCallback((code: string) => sessionUtil.saveRememberedClientCode(code), []);
  const clear = useCallback(() => sessionUtil.clearRememberedClientCode(), []);
  return { load, save, clear };
}
