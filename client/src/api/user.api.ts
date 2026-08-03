import apiInstance from './axios'
import { API_ROUTES } from '@/constants/api'
import { ApiResponse, AuthUser } from '@/types/api'

export const userApi = {
  list: async (params?: Record<string, any>): Promise<ApiResponse<AuthUser[]>> => {
    const res = await apiInstance.get<ApiResponse<AuthUser[]>>(API_ROUTES.USERS.BASE, { params })
    return res.data
  },

  getById: async (id: string): Promise<ApiResponse<AuthUser>> => {
    const res = await apiInstance.get<ApiResponse<AuthUser>>(API_ROUTES.USERS.BY_ID(id))
    return res.data
  },

  create: async (payload: Partial<AuthUser> & { password?: string }): Promise<ApiResponse<AuthUser>> => {
    const res = await apiInstance.post<ApiResponse<AuthUser>>(API_ROUTES.USERS.BASE, payload)
    return res.data
  },

  update: async (id: string, payload: Partial<AuthUser>): Promise<ApiResponse<AuthUser>> => {
    const res = await apiInstance.put<ApiResponse<AuthUser>>(API_ROUTES.USERS.BY_ID(id), payload)
    return res.data
  },

  activate: async (id: string): Promise<ApiResponse<AuthUser>> => {
    const res = await apiInstance.patch<ApiResponse<AuthUser>>(API_ROUTES.USERS.ACTIVATE(id))
    return res.data
  },

  deactivate: async (id: string): Promise<ApiResponse<AuthUser>> => {
    const res = await apiInstance.patch<ApiResponse<AuthUser>>(API_ROUTES.USERS.DEACTIVATE(id))
    return res.data
  },
}
