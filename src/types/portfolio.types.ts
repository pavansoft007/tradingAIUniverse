export interface Position {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  avgEntryPrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  allocation: number;
}

export interface Trade {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  price: number;
  total: number;
  fee: number;
  status: TradeStatus;
  createdAt: string;
  filledAt?: string;
}

export type TradeStatus = "pending" | "filled" | "cancelled" | "partially_filled";

export interface Portfolio {
  id: string;
  name: string;
  totalValue: number;
  availableCash: number;
  totalInvested: number;
  totalPnl: number;
  totalPnlPercent: number;
  dayPnl: number;
  dayPnlPercent: number;
  positions: Position[];
}

export interface PerformanceMetric {
  period: string;
  return: number;
  benchmark: number;
  alpha: number;
  beta: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
}
