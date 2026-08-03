import apiInstance from './axios'
import { API_ROUTES } from '@/constants/api'
import { ApiResponse, PaginatedResponse, Volunteer } from '@/types/api'

export const volunteerApi = {
  list: async (params?: Record<string, any>): Promise<PaginatedResponse<Volunteer>> => {
    const res = await apiInstance.get<PaginatedResponse<Volunteer>>(API_ROUTES.VOLUNTEERS.BASE, { params })
    return res.data
  },

  getById: async (id: string): Promise<ApiResponse<Volunteer>> => {
    const res = await apiInstance.get<ApiResponse<Volunteer>>(API_ROUTES.VOLUNTEERS.BY_ID(id))
    return res.data
  },

  create: async (payload: Partial<Volunteer>): Promise<ApiResponse<Volunteer>> => {
    const res = await apiInstance.post<ApiResponse<Volunteer>>(API_ROUTES.VOLUNTEERS.BASE, payload)
    return res.data
  },

  update: async (id: string, payload: Partial<Volunteer>): Promise<ApiResponse<Volunteer>> => {
    const res = await apiInstance.put<ApiResponse<Volunteer>>(API_ROUTES.VOLUNTEERS.BY_ID(id), payload)
    return res.data
  },

  changeStatus: async (
    id: string,
    status: string,
    reviewerComment?: string
  ): Promise<ApiResponse<Volunteer>> => {
    const res = await apiInstance.patch<ApiResponse<Volunteer>>(API_ROUTES.VOLUNTEERS.STATUS(id), {
      status,
      reviewerComment,
    })
    return res.data
  },
}
