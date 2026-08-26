import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { AuthUser } from '@/types/api'
import { UserRole } from '@/constants/roles'
import { authApi, LoginPayload } from '@/api/auth.api'
import {
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  setAccessToken,
  setRefreshToken,
  setStoredUser,
  clearAuthStorage,
} from '@/utils/token'

export type { UserRole } from '@/constants/roles'

interface AuthContextType {
  user: AuthUser | null
  accessToken: string | null
  token: string | null
  loading: boolean
  isAuthenticated: boolean
  login: ((payload: LoginPayload) => Promise<AuthUser>) &
    ((userData: AuthUser, token: string, refreshToken?: string) => void)
  loginWithTokens: (user: AuthUser, accessToken: string, refreshToken?: string) => void
  logout: () => Promise<void>
  refresh: () => Promise<void>
  getCurrentUser: () => Promise<AuthUser | null>
  updateCurrentUser: (updatedData: Partial<AuthUser>) => void
  updateUser: (updatedData: Partial<AuthUser>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser())
  const [accessToken, setAccessTokenState] = useState<string | null>(() => getAccessToken())
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const initAuth = async () => {
      const token = getAccessToken()
      if (token) {
        try {
          const res = await authApi.getMe()
          if (res.success && res.data) {
            setUser(res.data)
            setStoredUser(res.data)
          }
        } catch {
          // Token might be invalid or expired; state preserved from token utils
        }
      }
      setLoading(false)
    }
    initAuth()
  }, [])

  const loginWithTokens = (userData: AuthUser, token: string, refreshToken?: string) => {
    setUser(userData)
    setAccessTokenState(token)
    setAccessToken(token)
    setStoredUser(userData)
    if (refreshToken) {
      setRefreshToken(refreshToken)
    }
  }

  const login = ((arg1: LoginPayload | AuthUser, arg2?: string, arg3?: string): any => {
    if (typeof arg2 === 'string') {
      // Legacy signature: login(user, accessToken, refreshToken)
      loginWithTokens(arg1 as AuthUser, arg2, arg3)
      return
    }

    // Standard signature: login(payload)
    const payload = arg1 as LoginPayload
    setLoading(true)
    return authApi.login(payload).then((res) => {
      setLoading(false)
      if (res.success && res.data) {
        const { user: loggedInUser, accessToken: token, refreshToken } = res.data
        loginWithTokens(loggedInUser, token, refreshToken)
        return loggedInUser
      } else {
        throw new Error(res.message || 'Login failed')
      }
    }).catch((err) => {
      setLoading(false)
      throw err
    })
  }) as AuthContextType['login']

  const logout = async (): Promise<void> => {
    try {
      await authApi.logout()
    } catch {
      // Ignore API logout error if network fails
    } finally {
      setUser(null)
      setAccessTokenState(null)
      clearAuthStorage()
    }
  }

  const refresh = async (): Promise<void> => {
    const refreshToken = getRefreshToken()
    if (!refreshToken) return
    const res = await authApi.refresh(refreshToken)
    if (res.success && res.data) {
      setAccessTokenState(res.data.accessToken)
      setAccessToken(res.data.accessToken)
      const rotatedToken = res.data.refreshToken || res.data.newRefreshToken
      if (rotatedToken) {
        setRefreshToken(rotatedToken)
      }
    }
  }

  const getCurrentUser = async (): Promise<AuthUser | null> => {
    try {
      const res = await authApi.getMe()
      if (res.success && res.data) {
        setUser(res.data)
        setStoredUser(res.data)
        return res.data
      }
    } catch {
      return user
    }
    return user
  }

  const updateCurrentUser = (updatedData: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return null
      const updated = { ...prev, ...updatedData }
      setStoredUser(updated)
      return updated
    })
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        token: accessToken,
        loading,
        isAuthenticated: !!accessToken && !!user,
        login,
        loginWithTokens,
        logout,
        refresh,
        getCurrentUser,
        updateCurrentUser,
        updateUser: updateCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}