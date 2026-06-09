export type SortDirection = "asc" | "desc";

export type ThemeMode = "light" | "dark";

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  code: string;
  status: number;
}

export interface SelectOption {
  label: string;
  value: string | number;
}

export type TimeFrame = "1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "1w" | "1M";

export type AssetClass = "crypto" | "stocks" | "forex" | "commodities" | "indices";
