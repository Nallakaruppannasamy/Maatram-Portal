import apiInstance from './axios'
import { API_ROUTES } from '@/constants/api'
import { ApiResponse, AuthUser } from '@/types/api'

export interface LoginPayload {
  identifier: string
  password: string
}

export interface LoginResponseData {
  accessToken: string
  refreshToken?: string
  user: AuthUser
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<ApiResponse<LoginResponseData>> => {
    const res = await apiInstance.post<ApiResponse<LoginResponseData>>(API_ROUTES.AUTH.LOGIN, payload)
    return res.data
  },

  refresh: async (
    refreshToken: string
  ): Promise<ApiResponse<{ accessToken: string; refreshToken?: string; newRefreshToken?: string }>> => {
    const res = await apiInstance.post<
      ApiResponse<{ accessToken: string; refreshToken?: string; newRefreshToken?: string }>
    >(API_ROUTES.AUTH.REFRESH, { refreshToken })
    return res.data
  },

  forgotPassword: async (identifier: string): Promise<ApiResponse> => {
    const res = await apiInstance.post<ApiResponse>(API_ROUTES.AUTH.FORGOT_PASSWORD, { identifier })
    return res.data
  },

  resetPassword: async (payload: { token: string; newPassword: string }): Promise<ApiResponse> => {
    const res = await apiInstance.post<ApiResponse>(API_ROUTES.AUTH.RESET_PASSWORD, payload)
    return res.data
  },

  changePassword: async (payload: { currentPassword: string; newPassword: string; confirmPassword?: string }): Promise<ApiResponse> => {
    const res = await apiInstance.post<ApiResponse>(API_ROUTES.AUTH.CHANGE_PASSWORD, payload)
    return res.data
  },

  logout: async (): Promise<ApiResponse> => {
    const res = await apiInstance.post<ApiResponse>(API_ROUTES.AUTH.LOGOUT)
    return res.data
  },

  getMe: async (): Promise<ApiResponse<AuthUser>> => {
    const res = await apiInstance.get<ApiResponse<AuthUser>>(API_ROUTES.AUTH.ME)
    return res.data
  },
}
