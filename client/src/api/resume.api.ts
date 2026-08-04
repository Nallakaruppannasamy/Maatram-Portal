import apiInstance from './axios'
import { ApiResponse } from '@/types/api'

export const resumeApi = {
  get: async (studentId: string): Promise<ApiResponse<any>> => {
    const res = await apiInstance.get<ApiResponse<any>>(`/students/${studentId}/resume`)
    return res.data
  },
}
