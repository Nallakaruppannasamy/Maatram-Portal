import apiInstance from './axios'
import { API_ROUTES } from '@/constants/api'
import { ApiResponse, Zone } from '@/types/api'

export const zoneApi = {
  list: async (params?: Record<string, any>): Promise<ApiResponse<Zone[]>> => {
    const res = await apiInstance.get<ApiResponse<Zone[]>>(API_ROUTES.ZONES.BASE, { params })
    return res.data
  },

  getById: async (id: string): Promise<ApiResponse<Zone>> => {
    const res = await apiInstance.get<ApiResponse<Zone>>(API_ROUTES.ZONES.BY_ID(id))
    return res.data
  },

  create: async (payload: Partial<Zone>): Promise<ApiResponse<Zone>> => {
    const res = await apiInstance.post<ApiResponse<Zone>>(API_ROUTES.ZONES.BASE, payload)
    return res.data
  },

  update: async (id: string, payload: Partial<Zone>): Promise<ApiResponse<Zone>> => {
    const res = await apiInstance.put<ApiResponse<Zone>>(API_ROUTES.ZONES.BY_ID(id), payload)
    return res.data
  },

  delete: async (id: string): Promise<ApiResponse> => {
    const res = await apiInstance.delete<ApiResponse>(API_ROUTES.ZONES.BY_ID(id))
    return res.data
  },
}
