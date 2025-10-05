import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { authAPI } from '../services/api'
import { safeRender } from '../utils/safeRender'

const ADMIN_PASSPHRASE = import.meta.env.VITE_ADMIN_PASSPHRASE || 'howard is a pig'

const GoogleLoginButton = ({ onSuccess, className = '' }) => {
  const [showPassphraseModal, setShowPassphraseModal] = useState(false)
  const [passphrase, setPassphrase] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const buttonClass = useMemo(() => {
    const base = 'group relative inline-flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-white px-5 py-3 text-base font-semibold text-slate-700 shadow-[0_22px_45px_-24px_rgba(66,133,244,0.75)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_30px_55px_-28px_rgba(66,133,244,0.8)] focus:outline-none focus:ring-2 focus:ring-[#4285F4]/40 focus:ring-offset-2'
    const disabled = submitting ? 'cursor-not-allowed opacity-70' : ''
    return [base, disabled, className].filter(Boolean).join(' ')
  }, [className, submitting])

  const openModal = () => {
    if (submitting) return
    setShowPassphraseModal(true)
  }

  const cancel = () => {
    if (submitting) return
    setShowPassphraseModal(false)
    setPassphrase('')
    toast('已取消登入')
  }

  const startGoogleLogin = () => {
    if (submitting) return

    const normalized = passphrase.trim().toLowerCase()
    if (!normalized) {
      toast.error('請輸入管理員通關密語')
      return
    }

    if (normalized !== ADMIN_PASSPHRASE) {
      toast.error('密語錯誤，請聯絡系統管理員')
      return
    }

    if (!window.google?.accounts?.oauth2) {
      toast.error('Google 登入模組尚未載入')
      return
    }

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || window.GOOGLE_CLIENT_ID
    if (!clientId) {
      toast.error('找不到 Google Client ID，請確認環境設定')
      return
    }

    setSubmitting(true)

    const codeClient = window.google.accounts.oauth2.initCodeClient({
      client_id: clientId,
      scope: 'openid email profile',
      ux_mode: 'popup',
      callback: async (response) => {
        try {
          const code = response.code
          if (!code) {
            toast.error('未取得授權碼，請再試一次')
            return
          }

          const res = await authAPI.loginWithGoogleCode(code, passphrase.trim())
          onSuccess?.(res.data)
          toast.success('登入成功')
        } catch (err) {
          const msg = err.response?.data?.error || err.message
          toast.error(msg)
        } finally {
          setSubmitting(false)
          setShowPassphraseModal(false)
          setPassphrase('')
        }
      }
    })

    try {
      codeClient.requestCode()
    } catch (error) {
      toast.error('無法啟動 Google 登入，請稍後再試')
      setSubmitting(false)
    }
  }

  const confirmLabel = submitting ? '處理中…' : '啟動 Google 登入'
  const mainLabel = submitting ? '啟動登入中…' : '使用 Google 登入'

  return (
    <>
      <button type="button" onClick={openModal} disabled={submitting} className={buttonClass}>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4285F4]/10 transition-colors duration-200 group-hover:bg-[#4285F4]/20">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google 標誌" className="h-6 w-6" />
        </span>
        <span className="tracking-wide">{mainLabel}</span>
      </button>

      {showPassphraseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/10">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-900">管理員通關密語</h3>
              <p className="text-sm text-slate-500">為了安全性，登入前需先驗證管理員專用通關密語。</p>
            </div>

            <label className="mt-6 block text-sm font-medium text-slate-700" htmlFor="admin-passphrase">
              通關密語
            </label>
            <input
              id="admin-passphrase"
              type="password"
              value={passphrase}
              onChange={(event) => setPassphrase(event.target.value)}
              placeholder="請輸入密語"
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-[#4285F4] focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
              autoFocus
            />

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={cancel}
                disabled={submitting}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                取消
              </button>
              <button
                type="button"
                onClick={startGoogleLogin}
                disabled={submitting}
                className="rounded-xl bg-[#4285F4] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#4285F4]/40 transition hover:bg-[#356ac3] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default GoogleLoginButton
