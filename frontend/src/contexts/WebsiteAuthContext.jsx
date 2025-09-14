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

  const updateProfile = (partial) => {
    setUser((prev) => {
      const current = prev || {}
      const next = {
        ...current,
        ...(partial.name !== undefined ? { name: String(partial.name || '').trim() } : {}),
        ...(partial.picture !== undefined ? { picture: String(partial.picture || '') } : {}),
      }
      try { localStorage.setItem('website_user', JSON.stringify(next)) } catch {}
      return next
    })
  }

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'website_user') {
        try { setUser(e.newValue ? JSON.parse(e.newValue) : null) } catch {}
      }
      if (e.key === 'website_token') {
        setToken(localStorage.getItem('website_token'))
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  return (
    <WebsiteAuthContext.Provider value={{ user, token, loginWithGoogleCode, logout, updateProfile }}>
      {children}
    </WebsiteAuthContext.Provider>
  )
}