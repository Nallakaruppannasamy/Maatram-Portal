import apiInstance from './axios'
import { API_ROUTES } from '@/constants/api'
import { ApiResponse, AuditLog, AuditLogQueryParams } from '@/types/api'

export const auditApi = {
  list: async (params?: AuditLogQueryParams): Promise<ApiResponse<AuditLog[]>> => {
    const res = await apiInstance.get<ApiResponse<AuditLog[]>>(API_ROUTES.AUDIT_LOGS.BASE, { params })
    return res.data
  },

  getById: async (id: string): Promise<ApiResponse<AuditLog>> => {
    const res = await apiInstance.get<ApiResponse<AuditLog>>(API_ROUTES.AUDIT_LOGS.BY_ID(id))
    return res.data
  },

  getActions: async (): Promise<ApiResponse<string[]>> => {
    const res = await apiInstance.get<ApiResponse<string[]>>(API_ROUTES.AUDIT_LOGS.ACTIONS)
    return res.data
  },
}

export default auditApi
