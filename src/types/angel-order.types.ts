/** Angel One SmartAPI — order execution types */

// ── Enums (wire values) ───────────────────────────────────────────────────────

export const ANGEL_VARIETY = {
  NORMAL:   "NORMAL",
  STOPLOSS: "STOPLOSS",
  AMO:      "AMO",
  ROBO:     "ROBO",
} as const;
export type AngelVariety = (typeof ANGEL_VARIETY)[keyof typeof ANGEL_VARIETY];

export const ANGEL_ORDER_TYPE = {
  MARKET:          "MARKET",
  LIMIT:           "LIMIT",
  STOPLOSS_LIMIT:  "STOPLOSS_LIMIT",
  STOPLOSS_MARKET: "STOPLOSS_MARKET",
} as const;
export type AngelOrderType = (typeof ANGEL_ORDER_TYPE)[keyof typeof ANGEL_ORDER_TYPE];

export const ANGEL_PRODUCT_TYPE = {
  INTRADAY:     "INTRADAY",    // MIS
  DELIVERY:     "DELIVERY",    // CNC
  CARRYFORWARD: "CARRYFORWARD",// NRML (F&O)
  MARGIN:       "MARGIN",
} as const;
export type AngelProductType = (typeof ANGEL_PRODUCT_TYPE)[keyof typeof ANGEL_PRODUCT_TYPE];

export const ANGEL_TRANSACTION = {
  BUY:  "BUY",
  SELL: "SELL",
} as const;
export type AngelTransaction = (typeof ANGEL_TRANSACTION)[keyof typeof ANGEL_TRANSACTION];

export const ANGEL_EXCHANGE = {
  NSE: "NSE",
  BSE: "BSE",
  NFO: "NFO",
  MCX: "MCX",
  CDS: "CDS",
  BFO: "BFO",
} as const;
export type AngelExchange = (typeof ANGEL_EXCHANGE)[keyof typeof ANGEL_EXCHANGE];

export const ANGEL_DURATION = {
  DAY: "DAY",
  IOC: "IOC",
} as const;
export type AngelDuration = (typeof ANGEL_DURATION)[keyof typeof ANGEL_DURATION];

export const ANGEL_ORDER_STATUS = {
  OPEN:              "open",
  PENDING:           "pending",
  COMPLETE:          "complete",
  REJECTED:          "rejected",
  CANCELLED:         "cancelled",
  TRIGGER_PENDING:   "trigger pending",
  AMO_RECEIVED:      "AMO REQ RECEIVED",
  MODIFY_PENDING:    "modify pending",
  CANCEL_PENDING:    "cancel pending",
  AFTER_MARKET_ORDER:"after market order req received",
} as const;
export type AngelOrderStatus = (typeof ANGEL_ORDER_STATUS)[keyof typeof ANGEL_ORDER_STATUS];

// ── Request payloads ──────────────────────────────────────────────────────────

export interface AngelPlaceOrderRequest {
  variety:         AngelVariety;
  tradingsymbol:   string;    // e.g. "RELIANCE-EQ"
  symboltoken:     string;    // e.g. "2885"
  transactiontype: AngelTransaction;
  exchange:        AngelExchange;
  ordertype:       AngelOrderType;
  producttype:     AngelProductType;
  duration:        AngelDuration;
  price:           string;    // "0" for MARKET
  squareoff:       string;    // "0" normally
  stoploss:        string;    // stop offset for BO, else "0"
  triggerprice:    string;    // for SL orders
  quantity:        string;
}

export interface AngelModifyOrderRequest {
  variety:       AngelVariety;
  orderid:       string;
  ordertype:     AngelOrderType;
  producttype:   AngelProductType;
  duration:      AngelDuration;
  price:         string;
  quantity:      string;
  tradingsymbol: string;
  symboltoken:   string;
  exchange:      AngelExchange;
  triggerprice?: string;
}

export interface AngelCancelOrderRequest {
  variety: AngelVariety;
  orderid: string;
}

// ── Response shapes ───────────────────────────────────────────────────────────

export interface AngelOrderPlaced {
  script:       string;
  orderid:      string;
  uniqueorderid:string;
}

export interface AngelApiResponse<T> {
  status:    boolean;
  message:   string;
  errorcode: string;
  data:      T;
}

// ── Order book entry ─────────────────────────────────────────────────────────

export interface AngelOrder {
  variety:               AngelVariety;
  ordertype:             AngelOrderType;
  producttype:           AngelProductType;
  duration:              AngelDuration;
  price:                 number;
  triggerprice:          number;
  quantity:              string;
  disclosedquantity:     string;
  squareoff:             number;
  stoploss:              number;
  tradingsymbol:         string;
  transactiontype:       AngelTransaction;
  exchange:              AngelExchange;
  symboltoken:           string;
  averageprice:          number;
  filledshares:          string;
  unfilledshares:        string;
  orderid:               string;
  uniqueorderid?:        string;
  text:                  string;        // rejection/cancellation reason
  status:                AngelOrderStatus;
  orderstatus:           string;
  updatetime:            string;
  exchtime:              string;
  lotsize:               string;
  cancelsize:            string;
  parentorderid:         string;
}

// ── Trade book entry ──────────────────────────────────────────────────────────

export interface AngelTrade {
  exchange:       AngelExchange;
  producttype:    AngelProductType;
  tradingsymbol:  string;
  transactiontype:AngelTransaction;
  fillprice:      string;
  fillsize:       string;
  orderid:        string;
  fillid:         string;
  filltime:       string;
  tradevalue:     string;
  symboltoken?:   string;
  instrumenttype: string;
  precision:      string;
}

// ── Position ──────────────────────────────────────────────────────────────────

export interface AngelPosition {
  exchange:          AngelExchange;
  symboltoken:       string;
  producttype:       AngelProductType;
  tradingsymbol:     string;
  symbolname:        string;
  instrumenttype:    string;
  priceden:          string;
  pricenum:          string;
  genpriceden:       string;
  genpricenum:       string;
  precision:         string;
  multiplier:        string;
  boardlotsize:      string;
  buyqty:            string;
  sellqty:           string;
  buyamount:         string;
  sellamount:        string;
  netqty:            string;
  netamount:         string;
  daychangevalue:    string;
  daychangeperc:     string;
  cfbuyqty:          string;
  cfsellqty:         string;
  cfbuyamount:       string;
  cfsellamount:      string;
  buyavgprice:       string;
  sellavgprice:      string;
  avgnetprice:       string;
  netvalue:          string;
  unrealised:        string;
  realised:          string;
  ltp:               string;
  pnl:               string;
  close:             string;
}

// ── Internal UI form model ────────────────────────────────────────────────────

export interface OrderFormValues {
  tradingsymbol: string;
  symboltoken:   string;
  exchange:      AngelExchange;
  transactiontype: AngelTransaction;
  ordertype:     AngelOrderType;
  producttype:   AngelProductType;
  duration:      AngelDuration;
  quantity:      number;
  price:         number;          // 0 for MARKET
  triggerprice:  number;          // 0 if not a stop order
}

// ── Execution result (includes retry metadata) ────────────────────────────────

export interface ExecutionResult {
  orderid:       string;
  uniqueorderid: string;
  script:        string;
  attempts:      number;        // how many tries were needed
  durationMs:    number;        // total wall-clock time
}

// ── Validation result ─────────────────────────────────────────────────────────

export interface OrderValidationResult {
  valid:  boolean;
  errors: Record<string, string>;  // field → message
}

// ── Notification for order events ─────────────────────────────────────────────

export type OrderNotifType = "success" | "error" | "warning" | "info";

export interface OrderNotification {
  id:        string;
  type:      OrderNotifType;
  title:     string;
  message:   string;
  orderId?:  string;
  createdAt: number;            // Date.now()
}
