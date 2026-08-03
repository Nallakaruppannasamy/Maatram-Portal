import apiInstance from './axios'
import { API_ROUTES } from '@/constants/api'
import { ApiResponse, Profile } from '@/types/api'

export const profileApi = {
  get: async (): Promise<ApiResponse<Profile>> => {
    const res = await apiInstance.get<ApiResponse<Profile>>(API_ROUTES.PROFILE.BASE)
    return res.data
  },

  update: async (payload: Partial<Profile>): Promise<ApiResponse<Profile>> => {
    const res = await apiInstance.put<ApiResponse<Profile>>(API_ROUTES.PROFILE.BASE, payload)
    return res.data
  },
}
