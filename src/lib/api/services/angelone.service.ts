import smartApiClient from "@/lib/api/smartApiClient";
import type {
  AngelOneLoginPayload,
  AngelOneLoginResponse,
  AngelOneLogoutResponse,
  AngelOneProfileResponse,
  AngelOneRefreshResponse,
} from "@/types/angelone.types";

const PATHS = {
  login: "/rest/auth/angelbroking/user/v1/loginByPassword",
  refresh: "/rest/auth/angelbroking/jwt/v1/generateTokens",
  logout: "/rest/secure/angelbroking/user/v1/logout",
  profile: "/rest/secure/angelbroking/user/v1/getProfile",
} as const;

export const angelOneService = {
  /**
   * Authenticate with Angel One SmartAPI using client code, password, and TOTP.
   * Returns JWT tokens + user profile.
   */
  async login(payload: AngelOneLoginPayload): Promise<AngelOneLoginResponse> {
    const { data } = await smartApiClient.post<AngelOneLoginResponse>(PATHS.login, payload);
    if (!data.status) {
      const err = new Error(data.message) as Error & { errorcode: string };
      err.errorcode = data.errorcode;
      throw err;
    }
    return data;
  },

  /**
   * Exchange a refresh token for a new set of JWT tokens.
   * Called automatically by the Axios interceptor on 401 responses.
   */
  async refreshTokens(refreshToken: string): Promise<AngelOneRefreshResponse> {
    // Use a plain axios call here to avoid the interceptor triggering another refresh
    const { data } = await smartApiClient.post<AngelOneRefreshResponse>(
      PATHS.refresh,
      { refreshToken },
      { headers: { Authorization: undefined } }, // no JWT needed for this endpoint
    );
    if (!data.status) {
      const err = new Error(data.message) as Error & { errorcode: string };
      err.errorcode = data.errorcode;
      throw err;
    }
    return data;
  },

  /** Invalidate the current session on the server side. */
  async logout(clientCode: string): Promise<AngelOneLogoutResponse> {
    const { data } = await smartApiClient.post<AngelOneLogoutResponse>(PATHS.logout, {
      clientcode: clientCode,
    });
    return data;
  },

  /** Fetch the authenticated user's profile. */
  async getProfile(): Promise<AngelOneProfileResponse> {
    const { data } = await smartApiClient.get<AngelOneProfileResponse>(PATHS.profile);
    if (!data.status) {
      const err = new Error(data.message) as Error & { errorcode: string };
      err.errorcode = data.errorcode;
      throw err;
    }
    return data;
  },
};
