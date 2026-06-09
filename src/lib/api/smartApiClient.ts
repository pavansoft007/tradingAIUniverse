/**
 * Dedicated Axios instance for Angel One SmartAPI.
 *
 * Responsibilities:
 *  - Attach required SmartAPI headers on every request
 *  - Inject the current JWT as Authorization: Bearer
 *  - On 401: attempt a single token refresh, queue concurrent requests,
 *    replay them with the new token, and redirect to /login on failure
 */

import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import { stripBearerPrefix } from "@/lib/utils/jwt";
import { sessionUtil } from "@/lib/utils/session";

const SMART_API_BASE =
  process.env.NEXT_PUBLIC_ANGEL_ONE_BASE_URL ?? "https://apiconnect.angelone.in";

// ── Refresh-queue state (module-level singleton) ──────────────────────────────

let isRefreshing = false;
type QueueEntry = { resolve: (token: string) => void; reject: (err: unknown) => void };
let refreshQueue: QueueEntry[] = [];

function flushQueue(error: unknown, token: string | null): void {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  refreshQueue = [];
}

// ── Client factory ────────────────────────────────────────────────────────────

export function createSmartApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: SMART_API_BASE,
    timeout: 30_000,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-UserType": "USER",
      "X-SourceID": "WEB",
      "X-ClientLocalIP": "127.0.0.1",
      "X-ClientPublicIP": "127.0.0.1",
      "X-MACAddress": "00:00:00:00:00:00",
      // X-PrivateKey is injected per-request in the interceptor below
    },
  });

  // ── Request: inject API key + JWT ────────────────────────────────────────
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Read per-request so env var changes are always picked up
      config.headers["X-PrivateKey"] = process.env.NEXT_PUBLIC_ANGEL_ONE_API_KEY ?? "";
      const token = sessionUtil.loadJWT();
      if (token) {
        config.headers.Authorization = `Bearer ${stripBearerPrefix(token)}`;
      }
      return config;
    },
    (error: AxiosError) => Promise.reject(error),
  );

  // ── Response: handle 401 → refresh → replay ───────────────────────────────
  client.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
      const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      const isAuthEndpoint =
        original.url?.includes("/loginByPassword") ||
        original.url?.includes("/generateTokens") ||
        original.url?.includes("/logout");

      if (error.response?.status !== 401 || original._retry || isAuthEndpoint) {
        return Promise.reject(normalizeError(error));
      }

      if (isRefreshing) {
        // Another request already triggered the refresh — wait in the queue
        return new Promise<string>((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((newToken) => {
          original.headers.Authorization = `Bearer ${newToken}`;
          return client(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        // Dynamic imports to break circular dependency (store ↔ client)
        const { useAngelOneStore } = await import("@/store/useAngelOneStore");
        const store = useAngelOneStore.getState();

        if (!store.session?.refreshToken) throw new Error("No refresh token available");

        const { angelOneService } = await import("@/lib/api/services/angelone.service");
        const refreshRes = await angelOneService.refreshTokens(store.session.refreshToken);

        const newJwt = stripBearerPrefix(refreshRes.data.jwtToken);
        store.updateTokens(refreshRes.data);

        flushQueue(null, newJwt);
        original.headers.Authorization = `Bearer ${newJwt}`;
        return client(original);
      } catch (refreshError) {
        flushQueue(refreshError, null);
        const { useAngelOneStore } = await import("@/store/useAngelOneStore");
        useAngelOneStore.getState().clearSession();
        if (typeof window !== "undefined") window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    },
  );

  return client;
}

/** Convert Axios errors into a plain object so the error boundary / hook
 *  can display user-facing messages without coupling to Axios types. */
function normalizeError(error: AxiosError): Error & { errorcode?: string; status?: number } {
  const apiData = error.response?.data as { message?: string; errorcode?: string } | undefined;
  const normalized = new Error(
    apiData?.message ?? error.message ?? "Unknown error",
  ) as Error & { errorcode?: string; status?: number };
  normalized.errorcode = apiData?.errorcode;
  normalized.status = error.response?.status;
  return normalized;
}

export const smartApiClient = createSmartApiClient();
export default smartApiClient;
