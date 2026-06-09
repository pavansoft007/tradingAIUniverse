import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthTokens, User } from "@/types/auth.types";

interface AuthStore {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  setTokens: (tokens: AuthTokens) => void;
  logout: () => void;
}

const TOKEN_KEY = process.env.NEXT_PUBLIC_AUTH_TOKEN_KEY ?? "trading_ai_token";

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: true }),

      setTokens: (tokens) => {
        if (typeof window !== "undefined") {
          localStorage.setItem(TOKEN_KEY, tokens.accessToken);
        }
        set({ tokens });
      },

      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem(TOKEN_KEY);
        }
        set({ user: null, tokens: null, isAuthenticated: false });
      },
    }),
    {
      name: "trading-ai-auth",
      partialize: (state) => ({ user: state.user, tokens: state.tokens, isAuthenticated: state.isAuthenticated }),
    },
  ),
);
