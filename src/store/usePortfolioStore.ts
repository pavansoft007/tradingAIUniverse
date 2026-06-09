import { create } from "zustand";
import type { Portfolio } from "@/types/portfolio.types";

interface PortfolioStore {
  activePortfolioId: string | null;
  portfolios: Portfolio[];
  setActivePortfolio: (id: string) => void;
  setPortfolios: (portfolios: Portfolio[]) => void;
  updatePortfolio: (portfolio: Portfolio) => void;
}

export const usePortfolioStore = create<PortfolioStore>((set) => ({
  activePortfolioId: null,
  portfolios: [],

  setActivePortfolio: (id) => set({ activePortfolioId: id }),

  setPortfolios: (portfolios) =>
    set({
      portfolios,
      activePortfolioId: portfolios[0]?.id ?? null,
    }),

  updatePortfolio: (portfolio) =>
    set((state) => ({
      portfolios: state.portfolios.map((p) => (p.id === portfolio.id ? portfolio : p)),
    })),
}));
