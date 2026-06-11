/** Paper Trading Simulator — shared TypeScript types */

// ── Order constraints ─────────────────────────────────────────────────────────

export type PaperOrderType = "MARKET" | "LIMIT" | "STOPLOSS_LIMIT" | "STOPLOSS_MARKET";
export type PaperProductType = "MIS" | "CNC" | "NRML";
export type PaperOrderSide = "BUY" | "SELL";
export type PaperOrderStatus = "OPEN" | "FILLED" | "CANCELLED" | "REJECTED" | "PENDING";

// ── API request / response shapes ─────────────────────────────────────────────

export interface PlaceOrderRequest {
  tradingsymbol:   string;
  symboltoken:     string;
  exchange:        string;
  transactiontype: PaperOrderSide;
  ordertype:       PaperOrderType;
  producttype:     PaperProductType;
  quantity:        number;
  price:           number;
  triggerprice:    number;
  source?:         "manual" | "ai_signal" | "strategy";
  notes?:          string;
}

export interface WalletData {
  id:             string;
  clientCode:     string;
  balance:        number;
  usedMargin:     number;
  totalDeposited: number;
  totalWithdrawn: number;
  realizedPnl:    number;
  createdAt:      string;
  updatedAt:      string;
}

export interface PaperOrderData {
  id:              string;
  walletId:        string;
  tradingsymbol:   string;
  symboltoken:     string;
  exchange:        string;
  transactiontype: string;
  ordertype:       string;
  producttype:     string;
  quantity:        number;
  price:           number;
  triggerprice:    number;
  status:          string;
  filledQty:       number;
  avgFillPrice:    number;
  slippagePct:     number;
  rejectionReason: string | null;
  source:          string;
  notes:           string | null;
  placedAt:        string;
  filledAt:        string | null;
  cancelledAt:     string | null;
}

export interface PositionData {
  id:            string;
  walletId:      string;
  tradingsymbol: string;
  symboltoken:   string;
  exchange:      string;
  producttype:   string;
  netQty:        number;
  avgBuyPrice:   number;
  avgSellPrice:  number;
  buyQty:        number;
  sellQty:       number;
  realizedPnl:   number;
  lastLtp:       number;
  openedAt:      string;
  // Computed from live LTP
  ltp:           number;
  unrealizedPnl: number;
  unrealizedPct: number;
  currentValue:  number;
  investedValue: number;
}

export interface TradeData {
  id:              string;
  walletId:        string;
  orderId:         string;
  tradingsymbol:   string;
  symboltoken:     string;
  exchange:        string;
  transactiontype: string;
  producttype:     string;
  quantity:        number;
  fillPrice:       number;
  slippagePct:     number;
  tradeValue:      number;
  realizedPnl:     number;
  closingTrade:    boolean;
  notes:           string | null;
  executedAt:      string;
}

export interface TradingStats {
  balance:         number;
  usedMargin:      number;
  totalDeposited:  number;
  realizedPnl:     number;
  unrealizedPnl:   number;
  totalPnl:        number;
  totalPnlPct:     number;
  openPositions:   number;
  totalTrades:     number;
  winRate:         number;
  avgWin:          number;
  avgLoss:         number;
  profitFactor:    number;
  bestTrade:       number;
  worstTrade:      number;
}
