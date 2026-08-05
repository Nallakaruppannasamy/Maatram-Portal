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

  // Skills
  addSkill: async (skillName: string): Promise<ApiResponse<any>> => {
    const res = await apiInstance.post<ApiResponse<any>>(`${API_ROUTES.PROFILE.BASE}/skills`, { skillName })
    return res.data
  },
  updateSkill: async (id: string, skillName: string): Promise<ApiResponse<any>> => {
    const res = await apiInstance.put<ApiResponse<any>>(`${API_ROUTES.PROFILE.BASE}/skills/${id}`, { skillName })
    return res.data
  },
  deleteSkill: async (id: string): Promise<ApiResponse<any>> => {
    const res = await apiInstance.delete<ApiResponse<any>>(`${API_ROUTES.PROFILE.BASE}/skills/${id}`)
    return res.data
  },

  // Projects
  addProject: async (payload: any): Promise<ApiResponse<any>> => {
    const res = await apiInstance.post<ApiResponse<any>>(`${API_ROUTES.PROFILE.BASE}/projects`, payload)
    return res.data
  },
  updateProject: async (id: string, payload: any): Promise<ApiResponse<any>> => {
    const res = await apiInstance.put<ApiResponse<any>>(`${API_ROUTES.PROFILE.BASE}/projects/${id}`, payload)
    return res.data
  },
  deleteProject: async (id: string): Promise<ApiResponse<any>> => {
    const res = await apiInstance.delete<ApiResponse<any>>(`${API_ROUTES.PROFILE.BASE}/projects/${id}`)
    return res.data
  },

  // Certifications
  addCertification: async (payload: any): Promise<ApiResponse<any>> => {
    const res = await apiInstance.post<ApiResponse<any>>(`${API_ROUTES.PROFILE.BASE}/certifications`, payload)
    return res.data
  },
  updateCertification: async (id: string, payload: any): Promise<ApiResponse<any>> => {
    const res = await apiInstance.put<ApiResponse<any>>(`${API_ROUTES.PROFILE.BASE}/certifications/${id}`, payload)
    return res.data
  },
  deleteCertification: async (id: string): Promise<ApiResponse<any>> => {
    const res = await apiInstance.delete<ApiResponse<any>>(`${API_ROUTES.PROFILE.BASE}/certifications/${id}`)
    return res.data
  },
}
