import { useState } from 'react'
import toast from 'react-hot-toast'
import { authAPI } from '../services/api'

// Google Login Button Animation Styles
const buttonStyles = `
/* From Uiverse.io by vinodjangid07 */
.Btn {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 45px;
  height: 45px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition-duration: .3s;
  box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.199);
  background-color: rgb(163, 142, 255);
}

/* plus sign */
.sign {
  width: 100%;
  transition-duration: .3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sign svg {
  width: 17px;
}

.sign svg path {
  fill: white;
}
/* text */
.text {
  position: absolute;
  right: 0%;
  width: 0%;
  opacity: 0;
  color: white;
  font-size: 1.2em;
  font-weight: 600;
  transition-duration: .3s;
}
/* hover effect on button width */
.Btn:hover {
  width: 125px;
  border-radius: 40px;
  transition-duration: .3s;
}

.Btn:hover .sign {
  width: 30%;
  transition-duration: .3s;
  padding-left: 20px;
}
/* hover effect button's text */
.Btn:hover .text {
  opacity: 1;
  width: 70%;
  transition-duration: .3s;
  padding-right: 10px;
}
/* button click effect*/
.Btn:active {
  transform: translate(2px ,2px);
}
`

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
      <style dangerouslySetInnerHTML={{ __html: buttonStyles }} />
      <div className="Btn" onClick={openModal}>
        <div className="sign">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-[17px] h-[17px]" />
        </div>
        <div className="text">GOOGLE LOGIN</div>
      </div>

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
