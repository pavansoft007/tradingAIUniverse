/**
 * Secure session utilities.
 *
 * JWT is stored in sessionStorage (per-tab, cleared on browser close).
 * A non-sensitive indicator cookie is written so Next.js edge middleware
 * can gate dashboard routes without touching the real token.
 *
 * NOTE: sessionStorage is NOT accessible to other tabs/windows, which means
 * opening the app in a new tab will require re-login. This is the intentional
 * security trade-off vs. localStorage (persistent across tabs).
 */

const SESSION_JWT_KEY = "ao_jwt_v1";
const SESSION_USER_KEY = "ao_user_v1";
const SESSION_COOKIE_NAME = "ao_session";

// Simple obfuscation — not encryption. Use Web Crypto API for true encryption.
function encode(value: string): string {
  return btoa(encodeURIComponent(value));
}
function decode(value: string): string {
  try {
    return decodeURIComponent(atob(value));
  } catch {
    return "";
  }
}

export const sessionUtil = {
  // ── JWT ──────────────────────────────────────────────────────────────────

  saveJWT(token: string): void {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(SESSION_JWT_KEY, encode(token));
  },

  loadJWT(): string | null {
    if (typeof window === "undefined") return null;
    const raw = window.sessionStorage.getItem(SESSION_JWT_KEY);
    if (!raw) return null;
    const decoded = decode(raw);
    return decoded || null;
  },

  clearJWT(): void {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem(SESSION_JWT_KEY);
  },

  // ── User profile ──────────────────────────────────────────────────────────

  saveUser(user: unknown): void {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(SESSION_USER_KEY, encode(JSON.stringify(user)));
    } catch {
      // ignore serialisation errors
    }
  },

  loadUser<T>(): T | null {
    if (typeof window === "undefined") return null;
    const raw = window.sessionStorage.getItem(SESSION_USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(decode(raw)) as T;
    } catch {
      return null;
    }
  },

  clearUser(): void {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem(SESSION_USER_KEY);
  },

  // ── Session cookie (read by Next.js middleware) ───────────────────────────

  setSessionCookie(): void {
    if (typeof window === "undefined") return;
    document.cookie = `${SESSION_COOKIE_NAME}=1; path=/; SameSite=Strict`;
  },

  clearSessionCookie(): void {
    if (typeof window === "undefined") return;
    document.cookie = `${SESSION_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict`;
  },

  // ── Client ID "remember me" (localStorage, not sensitive) ────────────────

  saveRememberedClientCode(clientCode: string): void {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("ao_remembered_client", clientCode);
  },

  loadRememberedClientCode(): string {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem("ao_remembered_client") ?? "";
  },

  clearRememberedClientCode(): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem("ao_remembered_client");
  },

  // ── Clear everything ──────────────────────────────────────────────────────

  clearAll(): void {
    this.clearJWT();
    this.clearUser();
    this.clearSessionCookie();
  },
};
