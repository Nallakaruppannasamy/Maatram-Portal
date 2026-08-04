import apiInstance from './axios'
import { API_ROUTES } from '@/constants/api'
import { ApiResponse } from '@/types/api'

export const profileApi = {
  get: async (): Promise<ApiResponse<any>> => {
    const res = await apiInstance.get<ApiResponse<any>>(API_ROUTES.PROFILE.BASE)
    return res.data
  },

  update: async (payload: any): Promise<ApiResponse<any>> => {
    const res = await apiInstance.put<ApiResponse<any>>(API_ROUTES.PROFILE.BASE, payload)
    return res.data
  },

  getColleges: async (): Promise<ApiResponse<any[]>> => {
    const res = await apiInstance.get<ApiResponse<any[]>>(`${API_ROUTES.PROFILE.BASE}/colleges`)
    return res.data
  },

  getDegrees: async (): Promise<ApiResponse<any[]>> => {
    const res = await apiInstance.get<ApiResponse<any[]>>(`${API_ROUTES.PROFILE.BASE}/degrees`)
    return res.data
  },

  getDepartments: async (): Promise<ApiResponse<any[]>> => {
    const res = await apiInstance.get<ApiResponse<any[]>>(`${API_ROUTES.PROFILE.BASE}/departments`)
    return res.data
  },

  uploadImage: async (file: File): Promise<ApiResponse<{ fileUrl: string }>> => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await apiInstance.post<ApiResponse<{ fileUrl: string }>>(
      `${API_ROUTES.PROFILE.BASE}/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return res.data
  },
}
