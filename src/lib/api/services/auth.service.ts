import apiClient from "../client";
import { ENDPOINTS } from "../endpoints";
import type { AuthTokens, LoginCredentials, RegisterPayload, User } from "@/types/auth.types";
import type { ApiResponse } from "@/types/common.types";

export const authService = {
  login: async (credentials: LoginCredentials): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> => {
    const { data } = await apiClient.post(ENDPOINTS.auth.login, credentials);
    return data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post(ENDPOINTS.auth.logout);
  },

  register: async (payload: RegisterPayload): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> => {
    const { data } = await apiClient.post(ENDPOINTS.auth.register, payload);
    return data;
  },

  refresh: async (refreshToken: string): Promise<ApiResponse<AuthTokens>> => {
    const { data } = await apiClient.post(ENDPOINTS.auth.refresh, { refreshToken });
    return data;
  },

  getMe: async (): Promise<ApiResponse<User>> => {
    const { data } = await apiClient.get(ENDPOINTS.auth.me);
    return data;
  },
};
