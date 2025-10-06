import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('token'))

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token')
      console.log('🔍 檢查存儲的令牌:', storedToken ? storedToken.substring(0, 20) + '...' : '無')
      
      if (storedToken) {
        try {
          console.log('🔍 驗證 token:', storedToken.substring(0, 20) + '...')
          const response = await authAPI.verify()
          console.log('✅ Token 驗證成功:', response.data.user)
          setUser(response.data.user)
          setToken(storedToken)
        } catch (error) {
          console.error('❌ Token 驗證失敗:', error)
          localStorage.removeItem('token')
          setToken(null)
          setUser(null)
        }
      } else {
        console.log('ℹ️  沒有 token，跳過驗證')
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = async (username, password) => {
    try {
      console.log('嘗試登入:', { username })
      const response = await authAPI.login(username, password)
      console.log('登入響應:', response.data)
      
      const { token: newToken, user: userData } = response.data
      
      if (newToken && userData) {
        localStorage.setItem('token', newToken)
        setToken(newToken)
        setUser(userData)
        console.log('登入成功，用戶數據:', userData)
        return true
      } else {
        throw new Error('登入響應數據不完整')
      }
    } catch (error) {
      console.error('登入錯誤:', error)
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await authAPI.changePassword(currentPassword, newPassword)
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || '密碼修改失敗' 
      }
    }
  }

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    changePassword,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}