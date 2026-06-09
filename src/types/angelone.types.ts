// Angel One SmartAPI — domain types

export interface AngelOneLoginPayload {
  clientcode: string;
  password: string;
  totp: string;
}

export interface AngelOneUser {
  name: string;
  broker: string;
  clientcode: string;
  email: string;
  mobileno: string;
  exchanges: string[];
  products: string[];
  lastlogintime: string;
}

/** Raw tokens as returned by the API — jwtToken comes as "Bearer eyJ..." */
export interface AngelOneTokens {
  jwtToken: string;
  refreshToken: string;
  feedToken: string;
}

/** Login response data — tokens and user profile are returned flat in the same object */
export type AngelOneLoginResponseData = AngelOneTokens & AngelOneUser;

export interface AngelOneApiResponse<T> {
  status: boolean;
  message: string;
  errorcode: string;
  data: T;
}

export type AngelOneLoginResponse = AngelOneApiResponse<AngelOneLoginResponseData>;
export type AngelOneRefreshResponse = AngelOneApiResponse<AngelOneTokens>;
export type AngelOneProfileResponse = AngelOneApiResponse<AngelOneUser>;
export type AngelOneLogoutResponse = AngelOneApiResponse<null>;

/** Normalized session stored in the Zustand store */
export interface AngelOneSession {
  jwtToken: string;       // WITHOUT "Bearer " prefix
  refreshToken: string;
  feedToken: string;
  tokenExpiry: number;    // Unix ms timestamp
}

export interface AngelOneAuthState {
  session: AngelOneSession | null;
  user: AngelOneUser | null;
  clientCode: string | null;
  isAuthenticated: boolean;
}

/** Strongly-typed Angel One error codes */
export const ANGEL_ONE_ERROR_CODES = {
  INVALID_TOTP: "AB8050",
  INVALID_CREDENTIALS: "AB8010",
  ACCOUNT_BLOCKED: "AB8030",
  TOKEN_EXPIRED: "AG8111",
  INVALID_TOKEN: "AG8112",
  SESSION_EXPIRED: "AB1010",
} as const;

export type AngelOneErrorCode = (typeof ANGEL_ONE_ERROR_CODES)[keyof typeof ANGEL_ONE_ERROR_CODES];

export function getAngelOneErrorMessage(errorcode: string): string {
  const messages: Record<string, string> = {
    [ANGEL_ONE_ERROR_CODES.INVALID_TOTP]: "Invalid TOTP. Check your authenticator app and try again.",
    [ANGEL_ONE_ERROR_CODES.INVALID_CREDENTIALS]: "Invalid Client ID or password.",
    [ANGEL_ONE_ERROR_CODES.ACCOUNT_BLOCKED]: "Your account has been blocked. Contact Angel One support.",
    [ANGEL_ONE_ERROR_CODES.TOKEN_EXPIRED]: "Session expired. Please log in again.",
    [ANGEL_ONE_ERROR_CODES.INVALID_TOKEN]: "Invalid session token. Please log in again.",
    [ANGEL_ONE_ERROR_CODES.SESSION_EXPIRED]: "Session expired. Please log in again.",
  };
  return messages[errorcode] ?? "An unexpected error occurred. Please try again.";
}
