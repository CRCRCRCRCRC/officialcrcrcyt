import { useEffect, useRef, useState } from 'react'
import { authAPI } from '../services/api'

const HumanGate = ({ onPassed }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const containerRef = useRef(null)
  const widgetIdRef = useRef(null)
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || window.TURNSTILE_SITE_KEY || ''

  useEffect(() => {
    const render = () => {
      if (!window.turnstile || !containerRef.current || widgetIdRef.current) return
      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: 'light',
          callback: async (token) => {
            setLoading(true)
            setError('')
            try {
              const res = await authAPI.humanVerify(token)
              const t = res?.data?.token
              const ttl = Number(res?.data?.expiresInSec) || 0
              if (t) {
                localStorage.setItem('human_token', t)
                if (ttl > 0) localStorage.setItem('human_exp', String(Date.now() + ttl * 1000))
                onPassed?.()
              } else {
                setError('驗證失敗，請重試')
                // 允許重試
                try { window.turnstile.reset(widgetIdRef.current) } catch {}
              }
            } catch (e) {
              setError(e?.response?.data?.error || '驗證服務暫時不可用')
              try { window.turnstile.reset(widgetIdRef.current) } catch {}
            } finally {
              setLoading(false)
            }
          }
        })
      } catch (e) {
        setError('載入驗證元件失敗，請重新整理')
      }
    }

    // 若腳本尚未載入，稍後重試
    const id = setInterval(() => {
      if (window.turnstile) {
        clearInterval(id)
        render()
      }
    }, 200)
    return () => clearInterval(id)
  }, [siteKey, onPassed])

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-secondary-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">人類驗證</h1>
        <p className="text-gray-600 mb-6">請完成下方驗證以進入網站</p>
        <div ref={containerRef} />
        {loading && (
          <div className="text-sm text-gray-500 mt-3">驗證中…</div>
        )}
        {error && (
          <div className="text-sm text-red-600 mt-3">{error}</div>
        )}
      </div>
    </div>
  )
}

export default HumanGate

