import type { Metadata } from "next";
import TradingClient from "./TradingClient";

export const metadata: Metadata = { title: "Trading" };

export default function TradingPage() {
  return <TradingClient />;
}
