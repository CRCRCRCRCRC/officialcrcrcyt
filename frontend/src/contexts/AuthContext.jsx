import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext()

const normalizeUser = (userData) => ({
  id: userData.id,
  username: userData.username,
  role: userData.role || 'user',
  display_name: userData.display_name || userData.displayName,
  avatar_url: userData.avatar_url || userData.avatarUrl,
  email: userData.email || userData.username
})

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

  const saveSession = (newToken, userData) => {
    if (!newToken || !userData) {
      throw new Error('登入響應數據不完整')
    }

    const fullUser = normalizeUser(userData)
    localStorage.setItem('token', newToken)
    setToken(newToken)
    setUser(fullUser)
    return fullUser
  }

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token')
      console.log('🔍 檢查存儲的令牌:', storedToken ? storedToken.substring(0, 20) + '...' : '無')
      
      if (storedToken) {
        try {
          console.log('🔍 驗證 token:', storedToken.substring(0, 20) + '...')
          const response = await authAPI.verify()
          console.log('✅ Token 驗證成功:', response.data.user)
          
          const fullUser = normalizeUser(response.data.user)
          
          setUser(fullUser)
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
        const fullUser = saveSession(newToken, userData)
        console.log('登入成功，用戶數據:', fullUser)
        return true
      } else {
        throw new Error('登入響應數據不完整')
      }
    } catch (error) {
      console.error('登入錯誤:', error)
      throw error
    }
  }

  const beginAdminGoogleLogin = async (code) => {
    const response = await authAPI.beginAdminGoogleLogin(code)
    if (!response.data?.challenge) {
      throw new Error('Google 驗證資料不完整')
    }
    return response.data.challenge
  }

  const completeAdminGoogleLogin = async (challenge, password) => {
    const response = await authAPI.completeAdminGoogleLogin(challenge, password)
    const { token: newToken, user: userData } = response.data || {}

    if (userData?.role !== 'admin') {
      throw new Error('此帳號沒有管理員權限')
    }

    saveSession(newToken, userData)
    return true
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
    beginAdminGoogleLogin,
    completeAdminGoogleLogin,
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
