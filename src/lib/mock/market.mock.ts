import type { AISignal, Ticker } from "@/types/market.types";

export const MOCK_TICKERS: Ticker[] = [
  { symbol: "RELIANCE",   name: "Reliance Industries",  price: 2710.45, change: 34.50,   changePercent:  1.29,  volume: 4_210_000,  high24h: 2725.00, low24h: 2678.90, assetClass: "stocks" },
  { symbol: "TCS",        name: "Tata Consultancy",     price: 3682.15, change: -18.30,  changePercent: -0.49,  volume: 1_840_000,  high24h: 3715.00, low24h: 3661.00, assetClass: "stocks" },
  { symbol: "HDFCBANK",   name: "HDFC Bank",            price: 1712.60, change:  22.10,  changePercent:  1.31,  volume: 6_900_000,  high24h: 1720.00, low24h: 1690.00, assetClass: "stocks" },
  { symbol: "INFY",       name: "Infosys",              price: 1389.80, change: -12.40,  changePercent: -0.88,  volume: 3_100_000,  high24h: 1405.00, low24h: 1382.00, assetClass: "stocks" },
  { symbol: "WIPRO",      name: "Wipro",                price:  496.35, change:   3.85,  changePercent:  0.78,  volume: 2_500_000,  high24h:  501.00, low24h:  492.00, assetClass: "stocks" },
  { symbol: "BAJFINANCE", name: "Bajaj Finance",        price: 7248.90, change: 148.20,  changePercent:  2.09,  volume:   890_000,  high24h: 7280.00, low24h: 7095.00, assetClass: "stocks" },
  { symbol: "ICICIBANK",  name: "ICICI Bank",           price: 1158.75, change: -8.90,   changePercent: -0.76,  volume: 5_700_000,  high24h: 1170.00, low24h: 1148.00, assetClass: "stocks" },
  { symbol: "SBIN",       name: "State Bank of India",  price:  812.40, change:  11.60,  changePercent:  1.45,  volume: 8_200_000,  high24h:  818.00, low24h:  800.00, assetClass: "stocks" },
  { symbol: "HINDUNILVR", name: "Hindustan Unilever",   price: 2342.10, change: -15.30,  changePercent: -0.65,  volume:   980_000,  high24h: 2360.00, low24h: 2330.00, assetClass: "stocks" },
  { symbol: "MARUTI",     name: "Maruti Suzuki",        price: 12_480.00, change: 245.00, changePercent: 2.00,  volume:   340_000,  high24h: 12_520.00, low24h: 12_200.00, assetClass: "stocks" },
];

export const MOCK_SIGNALS: AISignal[] = [
  { id: "1", symbol: "RELIANCE",   signal: "buy",  confidence: 0.84, targetPrice: 2920, stopLoss: 2600, timeframe: "1d", reasoning: "Breakout above 200-DMA with strong volume", createdAt: new Date().toISOString() },
  { id: "2", symbol: "TCS",        signal: "hold", confidence: 0.61, targetPrice: 3900, stopLoss: 3500, timeframe: "1w", reasoning: "Consolidating after recent earnings beat",   createdAt: new Date().toISOString() },
  { id: "3", symbol: "BAJFINANCE", signal: "buy",  confidence: 0.91, targetPrice: 8100, stopLoss: 6900, timeframe: "1d", reasoning: "RSI oversold bounce, strong support at 7100", createdAt: new Date().toISOString() },
  { id: "4", symbol: "INFY",       signal: "sell", confidence: 0.73, targetPrice: 1200, stopLoss: 1450, timeframe: "1w", reasoning: "Death cross on daily chart, IT sector weakness", createdAt: new Date().toISOString() },
  { id: "5", symbol: "HDFCBANK",   signal: "buy",  confidence: 0.78, targetPrice: 1900, stopLoss: 1640, timeframe: "1d", reasoning: "Ascending triangle breakout confirmed",         createdAt: new Date().toISOString() },
];
