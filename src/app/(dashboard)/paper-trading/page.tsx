import type { Metadata } from "next";
import { PaperTradingClient } from "./PaperTradingClient";

export const metadata: Metadata = { title: "Paper Trading — TradingAI Universe" };

export default function PaperTradingPage() {
  return <PaperTradingClient />;
}
