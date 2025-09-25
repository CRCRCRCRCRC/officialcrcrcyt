import { createContext, useContext, useState } from 'react'
import { authAPI } from '../services/api'

const WebsiteAuthContext = createContext()

export const useWebsiteAuth = () => {
  const ctx = useContext(WebsiteAuthContext)
  if (!ctx) throw new Error('useWebsiteAuth must be used within WebsiteAuthProvider')
  return ctx
}

export const WebsiteAuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('website_user')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })
  const [token, setToken] = useState(localStorage.getItem('website_token'))

  const loginWithGoogleCode = async (code) => {
    const res = await authAPI.loginWithGooglePublic(code)
    const { token: newToken, user: nextUser } = res.data
    localStorage.setItem('website_token', newToken)
    localStorage.setItem('website_user', JSON.stringify(nextUser))
    setToken(newToken)
    setUser(nextUser)
    return nextUser
  }

  const updateProfile = async ({ displayName, avatarFile, removeAvatar } = {}) => {
    const formData = new FormData()
    if (typeof displayName === 'string') formData.append('displayName', displayName)
    if (avatarFile) formData.append('avatar', avatarFile)
    if (removeAvatar) formData.append('removeAvatar', 'true')

    const res = await authAPI.updateProfile(formData)
    const updatedUser = res?.data?.user
    if (updatedUser) {
      localStorage.setItem('website_user', JSON.stringify(updatedUser))
      setUser(updatedUser)
    }
    return updatedUser
  }

  const logout = () => {
    localStorage.removeItem('website_token')
    localStorage.removeItem('website_user')
    setToken(null)
    setUser(null)
  }

  return (
    <WebsiteAuthContext.Provider value={{ user, token, loginWithGoogleCode, logout, updateProfile }}>
      {children}
    </WebsiteAuthContext.Provider>
  )
}
