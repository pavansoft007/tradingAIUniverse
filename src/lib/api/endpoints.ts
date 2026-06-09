export const ENDPOINTS = {
  // Auth
  auth: {
    login: "/auth/login",
    logout: "/auth/logout",
    register: "/auth/register",
    refresh: "/auth/refresh",
    me: "/auth/me",
  },

  // Market
  market: {
    tickers: "/market/tickers",
    ticker: (symbol: string) => `/market/tickers/${symbol}`,
    ohlcv: (symbol: string) => `/market/ohlcv/${symbol}`,
    depth: (symbol: string) => `/market/depth/${symbol}`,
    signals: "/market/signals",
    signal: (symbol: string) => `/market/signals/${symbol}`,
    sentiment: (symbol: string) => `/market/sentiment/${symbol}`,
    search: "/market/search",
  },

  // Portfolio
  portfolio: {
    list: "/portfolio",
    detail: (id: string) => `/portfolio/${id}`,
    positions: (id: string) => `/portfolio/${id}/positions`,
    performance: (id: string) => `/portfolio/${id}/performance`,
    trades: "/portfolio/trades",
  },

  // Trading
  trading: {
    orders: "/trading/orders",
    order: (id: string) => `/trading/orders/${id}`,
    cancel: (id: string) => `/trading/orders/${id}/cancel`,
    watchlist: "/trading/watchlist",
    watchlistItem: (id: string) => `/trading/watchlist/${id}`,
    alerts: "/trading/alerts",
    alert: (id: string) => `/trading/alerts/${id}`,
  },
} as const;
