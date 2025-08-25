import { createContext, useContext, useEffect, useState } from 'react'
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
    } catch { return null }
  })
  const [token, setToken] = useState(localStorage.getItem('website_token'))

  const loginWithGoogleCode = async (code) => {
    const res = await authAPI.loginWithGooglePublic(code)
    const { token: t, user: u } = res.data
    localStorage.setItem('website_token', t)
    localStorage.setItem('website_user', JSON.stringify(u))
    setToken(t)
    setUser(u)
    return u
  }

  const logout = () => {
    localStorage.removeItem('website_token')
    localStorage.removeItem('website_user')
    setToken(null)
    setUser(null)
  }

  return (
    <WebsiteAuthContext.Provider value={{ user, token, loginWithGoogleCode, logout }}>
      {children}
    </WebsiteAuthContext.Provider>
  )
}

