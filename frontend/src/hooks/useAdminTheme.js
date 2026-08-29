import { useCallback, useEffect, useState } from 'react'

const ADMIN_THEME_STORAGE_KEY = 'crcrc-admin-theme'
const DEFAULT_ADMIN_THEME = 'hud'

const normalizeTheme = (theme) => (
  theme === 'cheerful' ? 'cheerful' : DEFAULT_ADMIN_THEME
)

const readSavedTheme = () => {
  try {
    return normalizeTheme(window.localStorage.getItem(ADMIN_THEME_STORAGE_KEY))
  } catch {
    return DEFAULT_ADMIN_THEME
  }
}

const useAdminTheme = () => {
  const [theme, setThemeState] = useState(readSavedTheme)

  const setTheme = useCallback((nextTheme) => {
    setThemeState(normalizeTheme(nextTheme))
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem(ADMIN_THEME_STORAGE_KEY, theme)
    } catch {
      // 瀏覽器停用儲存功能時仍可在本次頁面切換風格。
    }
  }, [theme])

  useEffect(() => {
    const syncTheme = (event) => {
      if (event.key === ADMIN_THEME_STORAGE_KEY) {
        setThemeState(normalizeTheme(event.newValue))
      }
    }

    window.addEventListener('storage', syncTheme)
    return () => window.removeEventListener('storage', syncTheme)
  }, [])

  return { theme, setTheme }
}

export default useAdminTheme
