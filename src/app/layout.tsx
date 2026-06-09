import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { EmotionRegistry } from "@/providers/EmotionRegistry";
import { QueryProvider } from "@/providers/QueryProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "TradingAI Universe",
    template: "%s | TradingAI Universe",
  },
  description: "AI-powered trading platform for professional traders",
  keywords: ["trading", "AI", "crypto", "stocks", "portfolio", "analytics"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <EmotionRegistry>
          <QueryProvider>
            <ThemeProvider>{children}</ThemeProvider>
          </QueryProvider>
        </EmotionRegistry>
      </body>
    </html>
  );
}
