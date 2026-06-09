/**
 * Angel One auth store.
 *
 * Security model:
 *  - jwtToken: in-memory + sessionStorage (per-tab, cleared on close)
 *  - refreshToken: in-memory ONLY (never persisted — intentional security trade-off)
 *  - feedToken: in-memory only
 *  - user: in-memory + sessionStorage
 *  - clientCode: localStorage (non-sensitive, for "remember me")
 *
 * The store is hydrated from sessionStorage on first render via `rehydrate()`.
 */

import { create } from "zustand";
import { getTokenExpiry, isTokenExpired, stripBearerPrefix } from "@/lib/utils/jwt";
import { sessionUtil } from "@/lib/utils/session";
import type { AngelOneSession, AngelOneTokens, AngelOneUser } from "@/types/angelone.types";

interface AngelOneStore {
  // ── State ──────────────────────────────────────────────────────────────────
  session: AngelOneSession | null;
  user: AngelOneUser | null;
  clientCode: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;

  // ── Actions ────────────────────────────────────────────────────────────────

  /** Called after a successful login. Persists to sessionStorage. */
  setSession: (tokens: AngelOneTokens, user: AngelOneUser | null, clientCode: string) => void;

  /** Called by the refresh interceptor to swap tokens without full logout. */
  updateTokens: (tokens: AngelOneTokens) => void;

  /** Full logout — clears all storage and in-memory state. */
  clearSession: () => void;

  /** Restore state from sessionStorage on page reload (call once on mount). */
  rehydrate: () => void;

  /** Returns true if the current JWT is valid and not near-expired. */
  isSessionValid: () => boolean;
}

function buildSession(tokens: AngelOneTokens): AngelOneSession {
  const raw = stripBearerPrefix(tokens.jwtToken);
  const expiry = getTokenExpiry(raw) ?? Date.now() + 24 * 60 * 60 * 1000; // fallback 24h
  return {
    jwtToken: raw,
    refreshToken: tokens.refreshToken,
    feedToken: tokens.feedToken,
    tokenExpiry: expiry,
  };
}

export const useAngelOneStore = create<AngelOneStore>((set, get) => ({
  session: null,
  user: null,
  clientCode: null,
  isAuthenticated: false,
  isHydrated: false,

  setSession(tokens, user, clientCode) {
    const session = buildSession(tokens);

    // Persist JWT + user to sessionStorage
    sessionUtil.saveJWT(session.jwtToken);
    if (user) sessionUtil.saveUser(user);
    // Set the session cookie so Next.js middleware allows dashboard access
    sessionUtil.setSessionCookie();

    set({ session, user, clientCode, isAuthenticated: true });
  },

  updateTokens(tokens) {
    const session = buildSession(tokens);
    sessionUtil.saveJWT(session.jwtToken);
    set((state) => ({
      session: {
        ...session,
        // Keep the current refreshToken if the refresh response omits it
        refreshToken: session.refreshToken || state.session?.refreshToken || "",
      },
    }));
  },

  clearSession() {
    sessionUtil.clearAll();
    set({ session: null, user: null, isAuthenticated: false });
  },

  rehydrate() {
    const jwt = sessionUtil.loadJWT();
    const user = sessionUtil.loadUser<AngelOneUser>();

    if (jwt && !isTokenExpired(jwt, 60_000)) {
      const expiry = getTokenExpiry(jwt) ?? Date.now();
      set({
        session: {
          jwtToken: jwt,
          refreshToken: "", // refresh token is NOT persisted — user must re-login if tab was closed
          feedToken: "",
          tokenExpiry: expiry,
        },
        user: user ?? null,
        clientCode: user?.clientcode ?? null,
        isAuthenticated: true,
        isHydrated: true,
      });
    } else {
      // JWT missing or expired — clear stale storage
      sessionUtil.clearAll();
      set({ isHydrated: true });
    }
  },

  isSessionValid() {
    const { session } = get();
    if (!session?.jwtToken) return false;
    return !isTokenExpired(session.jwtToken, 5 * 60 * 1000); // 5-minute buffer
  },
}));
