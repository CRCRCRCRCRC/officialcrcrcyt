import toast from 'react-hot-toast'
import { authAPI } from '../services/api'

// 需要在 index.html 內加上 <script src="https://accounts.google.com/gsi/client" async defer></script>
// 使用 Google OAuth Code Flow（需要 Client ID + Client Secret）

const GoogleLoginButton = ({ onSuccess }) => {
  const handleClick = () => {
    if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
      toast.error('Google 元件尚未載入')
      return
    }

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || window.GOOGLE_CLIENT_ID
    if (!clientId) {
      toast.error('尚未設定 Google Client ID')
      return
    }

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

          // 提示輸入密語（二次驗證）
          const passphrase = window.prompt('請輸入管理員密語：')
          if (!passphrase) {
            toast('已取消登入')
            return
          }

          const res = await authAPI.loginWithGoogleCode(code, passphrase)
          onSuccess?.(res.data)
          toast.success('登入成功')
        } catch (err) {
          const msg = err.response?.data?.error || err.message
          toast.error(msg)
        }
      }
    })

    codeClient.requestCode()
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 py-2.5 hover:bg-gray-50"
    >
      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
      使用 Google 登入
    </button>
  )
}

export default GoogleLoginButton

