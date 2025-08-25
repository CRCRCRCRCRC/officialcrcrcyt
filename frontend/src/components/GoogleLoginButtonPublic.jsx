import toast from 'react-hot-toast'
import { useWebsiteAuth } from '../contexts/WebsiteAuthContext'

const GoogleLoginButtonPublic = () => {
  const { loginWithGoogleCode } = useWebsiteAuth()

  const handleClick = () => {
    if (!window.google?.accounts?.oauth2) {
      toast.error('Google 登入元件未載入')
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
          if (!code) return
          await loginWithGoogleCode(code)
          toast.success('登入成功')
        } catch (e) {
          toast.error(e.response?.data?.error || e.message)
        }
      }
    })
    codeClient.requestCode()
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm"
    >
      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4 mr-2" />
      使用 Google 登入
    </button>
  )
}

export default GoogleLoginButtonPublic

