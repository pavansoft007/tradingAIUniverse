export type OrderType = "market" | "limit" | "stop" | "stop_limit";
export type OrderSide = "buy" | "sell";
export type OrderStatus = "pending" | "open" | "filled" | "cancelled" | "rejected" | "expired";
export type TimeInForce = "gtc" | "day" | "ioc" | "fok";

export interface Order {
  id: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  price?: number;
  stopPrice?: number;
  filledQuantity: number;
  avgFillPrice?: number;
  status: OrderStatus;
  timeInForce: TimeInForce;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderPayload {
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  price?: number;
  stopPrice?: number;
  timeInForce: TimeInForce;
}

export interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  addedAt: string;
}

export interface Alert {
  id: string;
  symbol: string;
  condition: "above" | "below" | "crosses_up" | "crosses_down";
  targetPrice: number;
  isActive: boolean;
  triggeredAt?: string;
  createdAt: string;
}
