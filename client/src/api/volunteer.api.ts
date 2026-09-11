import apiInstance from './axios'
import { API_ROUTES } from '@/constants/api'
import { ApiResponse, PaginatedResponse, Volunteer } from '@/types/api'

export const volunteerApi = {
  list: async (params?: Record<string, any>): Promise<PaginatedResponse<any>> => {
    const res = await apiInstance.get<PaginatedResponse<any>>(API_ROUTES.VOLUNTEERS.BASE, { params })
    return res.data
  },

  getById: async (id: string): Promise<ApiResponse<any>> => {
    const res = await apiInstance.get<ApiResponse<any>>(API_ROUTES.VOLUNTEERS.BY_ID(id))
    return res.data
  },

  create: async (payload: Partial<any>): Promise<ApiResponse<any>> => {
    const res = await apiInstance.post<ApiResponse<any>>(API_ROUTES.VOLUNTEERS.BASE, payload)
    return res.data
  },

  update: async (id: string, payload: Partial<any>): Promise<ApiResponse<any>> => {
    const res = await apiInstance.put<ApiResponse<any>>(API_ROUTES.VOLUNTEERS.BY_ID(id), payload)
    return res.data
  },

  changeStatus: async (
    id: string,
    status: string,
    reviewerComment?: string
  ): Promise<ApiResponse<any>> => {
    const res = await apiInstance.patch<ApiResponse<any>>(API_ROUTES.VOLUNTEERS.STATUS(id), {
      status,
      reviewerComment,
    })
    return res.data
  },

  addComment: async (id: string, comment: string): Promise<ApiResponse<any>> => {
    const res = await apiInstance.patch<ApiResponse<any>>(`/volunteers/${id}/comment`, { comment })
    return res.data
  },

  uploadImage: async (file: File): Promise<ApiResponse<{ url: string }>> => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await apiInstance.post<ApiResponse<{ url: string }>>('/volunteers/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return res.data
  },

  exportLogs: async (params?: Record<string, any>): Promise<Blob> => {
    const res = await apiInstance.get(API_ROUTES.VOLUNTEERS.EXPORT, { params, responseType: 'blob' })
    return res.data
  },
}
