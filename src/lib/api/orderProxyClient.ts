/**
 * Axios instance for order-related SmartAPI calls.
 *
 * Points to /api/angel (the Next.js proxy route) so that all requests
 * stay same-origin in the browser. The proxy adds SmartAPI headers and
 * forwards to Angel One server-to-server, avoiding CORS.
 */

import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { stripBearerPrefix } from "@/lib/utils/jwt";
import { sessionUtil } from "@/lib/utils/session";

const orderProxyClient = axios.create({
  baseURL: "/api/angel",
  timeout: 30_000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Inject JWT so the proxy can forward it to Angel One
orderProxyClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = sessionUtil.loadJWT();
    if (token) {
      config.headers.Authorization = `Bearer ${stripBearerPrefix(token)}`;
    }
    return config;
  },
  (err: AxiosError) => Promise.reject(err),
);

export default orderProxyClient;
