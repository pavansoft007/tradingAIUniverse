/** Angel One SmartAPI — Good Till Triggered (GTT) order types */

// ── Status ────────────────────────────────────────────────────────────────────

export type GTTStatus =
  | "NEW"
  | "ACTIVE"
  | "SENTTOEXCHANGE"
  | "EXECUTED"
  | "CANCELLED"
  | "FORCECANCEL";

// GTT supports DELIVERY and MARGIN only (not INTRADAY/CARRYFORWARD)
export type GTTProductType = "DELIVERY" | "MARGIN";

// ── API shapes ────────────────────────────────────────────────────────────────

export interface GTTRule {
  id:              number;
  tradingsymbol:   string;
  symboltoken:     string;
  exchange:        string;   // "NSE" | "BSE"
  producttype:     GTTProductType;
  transactiontype: "BUY" | "SELL";
  price:           number;   // limit execution price
  qty:             number;
  disclosedqty:    number;
  triggerprice:    number;   // condition price — triggers the order
  timeperiod:      number;   // remaining validity in days
  status:          GTTStatus;
  createddate:     string;
  updateddate:     string;
}

export interface CreateGTTRequest {
  tradingsymbol:   string;
  symboltoken:     string;
  exchange:        string;
  producttype:     GTTProductType;
  transactiontype: "BUY" | "SELL";
  price:           number;
  qty:             number;
  disclosedqty:    number;
  triggerprice:    number;
  timeperiod:      number;   // 1–365 days
}

export interface ModifyGTTRequest extends CreateGTTRequest {
  id: number;
}

export interface GTTListRequest {
  status?: GTTStatus[];
  page?:   number;
  count?:  number;
}

// ── Form values (used by the UI) ──────────────────────────────────────────────

export interface GTTFormValues {
  tradingsymbol:   string;
  symboltoken:     string;
  exchange:        string;
  producttype:     GTTProductType;
  transactiontype: "BUY" | "SELL";
  triggerprice:    number;
  price:           number;
  qty:             number;
  timeperiod:      number;
}
