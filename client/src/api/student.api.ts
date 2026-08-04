import apiInstance from './axios'
import { API_ROUTES } from '@/constants/api'
import { ApiResponse, PaginatedResponse, Student } from '@/types/api'

export const studentApi = {
  list: async (params?: Record<string, any>): Promise<PaginatedResponse<Student>> => {
    const res = await apiInstance.get<PaginatedResponse<Student>>(API_ROUTES.STUDENTS.BASE, { params })
    return res.data
  },

  getById: async (id: string): Promise<ApiResponse<Student>> => {
    const res = await apiInstance.get<ApiResponse<Student>>(API_ROUTES.STUDENTS.BY_ID(id))
    return res.data
  },

  create: async (payload: Partial<Student>): Promise<ApiResponse<Student>> => {
    const res = await apiInstance.post<ApiResponse<Student>>(API_ROUTES.STUDENTS.BASE, payload)
    return res.data
  },

  update: async (id: string, payload: Partial<Student>): Promise<ApiResponse<Student>> => {
    const res = await apiInstance.put<ApiResponse<Student>>(API_ROUTES.STUDENTS.BY_ID(id), payload)
    return res.data
  },

  changeStatus: async (id: string, status: string): Promise<ApiResponse<Student>> => {
    const res = await apiInstance.patch<ApiResponse<Student>>(API_ROUTES.STUDENTS.STATUS(id), { status })
    return res.data
  },

  importCSV: async (file: File): Promise<ApiResponse<any>> => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await apiInstance.post<ApiResponse<any>>(API_ROUTES.STUDENTS.IMPORT, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },

  exportCSV: async (params?: Record<string, any>): Promise<Blob> => {
    const res = await apiInstance.get(API_ROUTES.STUDENTS.EXPORT, { params, responseType: 'blob' })
    return res.data
  },

  manualRegister: async (payload: {
    studentName: string
    registrationNumber: string
    email: string
    dateOfBirth: string
  }): Promise<ApiResponse<Student>> => {
    const res = await apiInstance.post<ApiResponse<Student>>(`${API_ROUTES.STUDENTS.BASE}/manual`, payload)
    return res.data
  },

  downloadTemplate: async (): Promise<Blob> => {
    const res = await apiInstance.get(`${API_ROUTES.STUDENTS.BASE}/template`, { responseType: 'blob' })
    return res.data
  },
}
