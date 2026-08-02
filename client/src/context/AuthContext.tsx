import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type UserRole = 'student' | 'zone_incharge' | 'super_admin'

export interface User {
  id: string
  name: string
  email?: string
  regNumber?: string
  role: UserRole
  isFirstTimeUser?: boolean
}

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (userData: User, authToken: string) => void
  logout: () => void
  updateUser: (updatedData: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('svms_user')
    return savedUser ? JSON.parse(savedUser) : null
  })

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('svms_token') || null
  })

  const login = (userData: User, authToken: string) => {
    setUser(userData)
    setToken(authToken)
    localStorage.setItem('svms_user', JSON.stringify(userData))
    localStorage.setItem('svms_token', authToken)
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('svms_user')
    localStorage.removeItem('svms_token')
  }

  const updateUser = (updatedData: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null
      const updated = { ...prev, ...updatedData }
      localStorage.setItem('svms_user', JSON.stringify(updated))
      return updated
    })
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        login,
        logout,
        updateUser,
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