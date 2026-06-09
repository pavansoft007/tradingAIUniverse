/** Angel One SmartAPI — portfolio, user, and market data types */

// ── Convert position request ───────────────────────────────────────────────────

export interface ConvertPositionRequest {
  exchange:       string;          // "NSE" | "BSE" | "NFO" | "MCX"
  symboltoken:    string;
  tradingsymbol:  string;
  transactiontype:"BUY" | "SELL";
  oldproducttype: string;          // "INTRADAY" | "DELIVERY" | "CARRYFORWARD"
  newproducttype: string;
  quantity:       number;
}

// ── Holdings ──────────────────────────────────────────────────────────────────

export interface AngelHolding {
  tradingsymbol:      string;
  exchange:           string;
  isin:               string;
  t1quantity:         number;
  realisedquantity:   number;
  quantity:           number;
  authorisedquantity: number;
  utilisedquantity:   number;
  sip_indicator:      boolean;
  symboltoken:        string;
  averageprice:       number;
  close:              number;    // previous close price
  profitandloss:      number;
  pnlpercentage:      number;
  product:            string;
  collateralquantity: number;
  collateraltype:     string;
  haircut:            number;
}

export interface AngelTotalHolding {
  totalholdingvalue:  number;
  totalinvvalue:      number;
  totalprofitandloss: number;
  totalpnlpercentage: number;
}

export interface AngelHoldingsData {
  holdings:     AngelHolding[];
  totalholding: AngelTotalHolding;
}

// ── Funds / RMS ───────────────────────────────────────────────────────────────

export interface AngelFunds {
  net:                    string;
  availablecash:          string;
  availableintradayperc:  string;
  utilisedamount:         string;
  m2munrealized:          string;
  m2mrealized:            string;
  adhocmargin:            string;
  collateral:             string;
  liquidityamount?:       string;
  brokerageutilised?:     string;
}

// ── Profile ───────────────────────────────────────────────────────────────────

export interface AngelProfile {
  clientcode:    string;
  name:          string;
  email:         string;
  mobileno:      string;
  exchanges:     string[];
  products:      string[];
  lastlogintime: string;
  brokerid:      string;
}

// ── Market quote / depth ──────────────────────────────────────────────────────

export interface AngelDepthLevel {
  price:    number;
  quantity: number;
  orders:   number;
}

export interface AngelQuote {
  tradingSymbol:  string;
  symbolToken:    string;
  open:           number;
  high:           number;
  low:            number;
  close:          number;      // previous close
  ltp:            number;
  volume:         number;
  totalbuyqty:    number;
  totalsellqty:   number;
  tradevalue?:    number;
  opentrades?:    number;
  depth?: {
    buy:  AngelDepthLevel[];
    sell: AngelDepthLevel[];
  };
}
