import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
  clearAuthStorage,
} from '@/utils/token'
import { API_ROUTES } from '@/constants/api'

const getBaseURL = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }
  if (import.meta.env.VITE_API_URL) {
    const rawUrl = import.meta.env.VITE_API_URL.replace(/\/+$/, '')
    return rawUrl.endsWith('/api/v1') ? rawUrl : `${rawUrl}/api/v1`
  }
  return 'http://localhost:5000/api/v1'
}

const baseURL = getBaseURL()

export const apiInstance = axios.create({
  baseURL,
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request Interceptor: Attach JWT Access Token
apiInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response Interceptor: Auto-refresh expired tokens
let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (err: any) => void
}> = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error)
    } else if (token) {
      promise.resolve(token)
    }
  })
  failedQueue = []
}

apiInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes(API_ROUTES.AUTH.LOGIN) &&
      !originalRequest.url?.includes(API_ROUTES.AUTH.REFRESH)
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            return apiInstance(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshToken = getRefreshToken()
        const response = await axios.post(
          `${baseURL}${API_ROUTES.AUTH.REFRESH}`,
          { refreshToken },
          { withCredentials: true }
        )

        if (response.data?.success) {
          const { accessToken, refreshToken: rotatedRefreshToken, newRefreshToken } = response.data.data
          setAccessToken(accessToken)
          const nextRefreshToken = rotatedRefreshToken || newRefreshToken
          if (nextRefreshToken) {
            setRefreshToken(nextRefreshToken)
          }

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`
          }

          processQueue(null, accessToken)
          return apiInstance(originalRequest)
        } else {
          throw new Error('Refresh token failed')
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null)
        clearAuthStorage()
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default apiInstance
