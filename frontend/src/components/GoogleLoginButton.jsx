import { useState } from 'react'
import toast from 'react-hot-toast'
import { authAPI } from '../services/api'

// 需要在 index.html 內加上 <script src="https://accounts.google.com/gsi/client" async defer></script>
// 使用 Google OAuth Code Flow（需要 Client ID + Client Secret）

const GoogleLoginButton = ({ onSuccess }) => {
  const [showPassphraseModal, setShowPassphraseModal] = useState(false)
  const [passphrase, setPassphrase] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const openModal = () => {
    setShowPassphraseModal(true)
  }

  const cancel = () => {
    setShowPassphraseModal(false)
    setPassphrase('')
    toast('已取消登入')
  }

  const startGoogleLogin = () => {
    if (!passphrase.trim()) {
      toast.error('請輸入管理員密語')
      return
    }

    if (!window.google?.accounts?.oauth2) {
      toast.error('Google 元件尚未載入')
      return
    }

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || window.GOOGLE_CLIENT_ID
    if (!clientId) {
      toast.error('尚未設定 Google Client ID')
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
            toast.error('未取得授權碼')
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

    codeClient.requestCode()
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 py-2.5 hover:bg-gray-50"
      >
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
        使用 Google 登入
      </button>

      {showPassphraseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">管理員二次驗證</h3>
            <p className="text-sm text-gray-600 mb-4">
              請先輸入管理員密語，然後繼續完成 Google 登入
            </p>
            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="管理員密語"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              autoFocus
            />
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={cancel}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={startGoogleLogin}
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? '處理中...' : '繼續 Google 登入'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default GoogleLoginButton
