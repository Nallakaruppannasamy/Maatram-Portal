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

  getMyColleges: async (): Promise<ApiResponse<any[]>> => {
    const res = await apiInstance.get<ApiResponse<any[]>>(API_ROUTES.ZONES.MY_COLLEGES)
    return res.data
  },

  exportMyColleges: async (params?: Record<string, any>): Promise<Blob> => {
    const res = await apiInstance.get(API_ROUTES.ZONES.MY_COLLEGES_EXPORT, { params, responseType: 'blob' })
    return res.data
  },

  getColleges: async (zoneId: string): Promise<ApiResponse<any[]>> => {
    const res = await apiInstance.get<ApiResponse<any[]>>(`${API_ROUTES.ZONES.BY_ID(zoneId)}/colleges`)
    return res.data
  },

  exportColleges: async (zoneId: string, params?: Record<string, any>): Promise<Blob> => {
    const res = await apiInstance.get(`${API_ROUTES.ZONES.BY_ID(zoneId)}/colleges/export`, { params, responseType: 'blob' })
    return res.data
  },

  addCollege: async (zoneId: string, payload: { name: string; code: string; location: string }): Promise<ApiResponse<any>> => {
    const res = await apiInstance.post<ApiResponse<any>>(`${API_ROUTES.ZONES.BASE}/${zoneId}/colleges`, payload)
    return res.data
  },

  updateCollege: async (collegeId: string, payload: { name: string; location: string }): Promise<ApiResponse<any>> => {
    const res = await apiInstance.put<ApiResponse<any>>(`${API_ROUTES.ZONES.BASE}/colleges/${collegeId}`, payload)
    return res.data
  },

  deleteCollege: async (collegeId: string): Promise<ApiResponse<any>> => {
    const res = await apiInstance.delete<ApiResponse<any>>(`${API_ROUTES.ZONES.BASE}/colleges/${collegeId}`)
    return res.data
  },

  addDepartment: async (collegeId: string, payload: { name: string }): Promise<ApiResponse<any>> => {
    const res = await apiInstance.post<ApiResponse<any>>(`${API_ROUTES.ZONES.BASE}/colleges/${collegeId}/departments`, payload)
    return res.data
  },

  updateDepartment: async (departmentId: string, payload: { name: string }): Promise<ApiResponse<any>> => {
    const res = await apiInstance.put<ApiResponse<any>>(`${API_ROUTES.ZONES.BASE}/departments/${departmentId}`, payload)
    return res.data
  },

  deleteDepartment: async (departmentId: string): Promise<ApiResponse<any>> => {
    const res = await apiInstance.delete<ApiResponse<any>>(`${API_ROUTES.ZONES.BASE}/departments/${departmentId}`)
    return res.data
  },

  addProgram: async (departmentId: string, payload: { name: string; durationYears: number }): Promise<ApiResponse<any>> => {
    const res = await apiInstance.post<ApiResponse<any>>(`${API_ROUTES.ZONES.BASE}/departments/${departmentId}/programs`, payload)
    return res.data
  },

  updateProgram: async (programId: string, payload: { name: string; durationYears: number }): Promise<ApiResponse<any>> => {
    const res = await apiInstance.put<ApiResponse<any>>(`${API_ROUTES.ZONES.BASE}/programs/${programId}`, payload)
    return res.data
  },

  deleteProgram: async (programId: string): Promise<ApiResponse<any>> => {
    const res = await apiInstance.delete<ApiResponse<any>>(`${API_ROUTES.ZONES.BASE}/programs/${programId}`)
    return res.data
  },

  importStructure: async (zoneId: string, file: File): Promise<ApiResponse<any>> => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await apiInstance.post<ApiResponse<any>>(`${API_ROUTES.ZONES.BASE}/${zoneId}/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 120000 // 2 minutes timeout for bulk imports
    })
    return res.data
  },

  downloadTemplate: async (): Promise<Blob> => {
    const res = await apiInstance.get(`${API_ROUTES.ZONES.BASE}/import/template`, { responseType: 'blob' })
    return res.data
  },
}
