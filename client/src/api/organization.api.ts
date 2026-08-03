import apiInstance from './axios'
import { API_ROUTES } from '@/constants/api'
import { ApiResponse, Organization } from '@/types/api'

export const organizationApi = {
  list: async (params?: Record<string, any>): Promise<ApiResponse<Organization[]>> => {
    const res = await apiInstance.get<ApiResponse<Organization[]>>(API_ROUTES.ORGANIZATIONS.BASE, { params })
    return res.data
  },

  getById: async (id: string): Promise<ApiResponse<Organization>> => {
    const res = await apiInstance.get<ApiResponse<Organization>>(API_ROUTES.ORGANIZATIONS.BY_ID(id))
    return res.data
  },

  create: async (payload: Partial<Organization>): Promise<ApiResponse<Organization>> => {
    const res = await apiInstance.post<ApiResponse<Organization>>(API_ROUTES.ORGANIZATIONS.BASE, payload)
    return res.data
  },

  update: async (id: string, payload: Partial<Organization>): Promise<ApiResponse<Organization>> => {
    const res = await apiInstance.put<ApiResponse<Organization>>(API_ROUTES.ORGANIZATIONS.BY_ID(id), payload)
    return res.data
  },

  delete: async (id: string): Promise<ApiResponse> => {
    const res = await apiInstance.delete<ApiResponse>(API_ROUTES.ORGANIZATIONS.BY_ID(id))
    return res.data
  },
}
