import { useEffect, useMemo, useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const GoogleMark = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41Z" />
    <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.36l-3.24-2.54c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z" />
    <path fill="#FBBC05" d="M6.39 13.93A6 6 0 0 1 6.08 12c0-.67.11-1.32.31-1.93V7.45H3.04A10 10 0 0 0 2 12c0 1.61.38 3.14 1.04 4.55l3.35-2.62Z" />
    <path fill="#EA4335" d="M12 5.94c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.63 9.63 0 0 0 12 2a10 10 0 0 0-8.96 5.45l3.35 2.62C7.18 7.7 9.39 5.94 12 5.94Z" />
  </svg>
)

const GoogleLoginButton = ({ onCode, className = '', disabled = false }) => {
  const [googleReady, setGoogleReady] = useState(() => Boolean(window.google?.accounts?.oauth2))
  const [requesting, setRequesting] = useState(false)

  useEffect(() => {
    const checkGoogle = () => setGoogleReady(Boolean(window.google?.accounts?.oauth2))
    checkGoogle()
    const intervalId = window.setInterval(checkGoogle, 250)
    return () => window.clearInterval(intervalId)
  }, [])

  const isDisabled = disabled || requesting || !googleReady
  const buttonClass = useMemo(
    () => [
      'group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-[22px]',
      'border border-white/70 bg-white/95 px-6 py-4 text-[15px] font-semibold tracking-[0.01em] text-slate-800',
      'shadow-[0_24px_80px_-28px_rgba(129,140,248,0.9)] backdrop-blur-xl transition duration-300',
      'hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_30px_90px_-25px_rgba(99,102,241,0.95)]',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-slate-950',
      'disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-y-0',
      className
    ].filter(Boolean).join(' '),
    [className]
  )

  const handleClick = () => {
    if (isDisabled) return

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || window.GOOGLE_CLIENT_ID
    if (!clientId) {
      toast.error('尚未設定 Google Client ID')
      return
    }

    setRequesting(true)

    try {
      const codeClient = window.google.accounts.oauth2.initCodeClient({
        client_id: clientId,
        scope: 'openid email profile',
        ux_mode: 'popup',
        callback: async (response) => {
          try {
            if (!response.code) {
              throw new Error('Google 未回傳授權碼')
            }
            await onCode?.(response.code)
          } catch (error) {
            if (!error?.handled) {
              toast.error(error.message || 'Google 登入失敗')
            }
          } finally {
            setRequesting(false)
          }
        },
        error_callback: () => {
          setRequesting(false)
          toast.error('Google 登入視窗已關閉')
        }
      })

      codeClient.requestCode()
    } catch {
      setRequesting(false)
      toast.error('無法開啟 Google 登入')
    }
  }

  return (
    <button type="button" onClick={handleClick} disabled={isDisabled} className={buttonClass}>
      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-indigo-100/70 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      <span className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
        {requesting || !googleReady ? <LoaderCircle className="h-5 w-5 animate-spin text-indigo-500" /> : <GoogleMark />}
      </span>
      <span className="relative">使用 Google 繼續</span>
    </button>
  )
}

export default GoogleLoginButton
