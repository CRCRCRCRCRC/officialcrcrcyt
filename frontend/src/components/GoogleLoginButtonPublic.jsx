import toast from 'react-hot-toast'
import { useWebsiteAuth } from '../contexts/WebsiteAuthContext'

// Google Login Button Animation Styles
const buttonStyles = `
/* From Uiverse.io by vinodjangid07 */
.Btn {
  display: flex !important;
  align-items: center !important;
  justify-content: flex-start !important;
  width: 50px !important;
  height: 50px !important;
  border: none !important;
  border-radius: 50% !important;
  cursor: pointer !important;
  position: relative !important;
  overflow: hidden !important;
  transition-duration: .3s !important;
  box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.199) !important;
  background-color: rgb(163, 142, 255) !important;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
}

/* plus sign */
.sign {
  width: 100% !important;
  transition-duration: .3s !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.sign svg {
  width: 20px !important;
  height: 20px !important;
}

.sign svg path {
  fill: white !important;
}
/* text */
.text {
  position: absolute !important;
  right: 0% !important;
  width: 0% !important;
  opacity: 0 !important;
  color: white !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
  transition-duration: .3s !important;
  letter-spacing: 0.5px !important;
  white-space: nowrap !important;
}
/* hover effect on button width */
.Btn:hover {
  width: 135px !important;
  border-radius: 40px !important;
  transition-duration: .3s !important;
}

.Btn:hover .sign {
  width: 25% !important;
  transition-duration: .3s !important;
  padding-left: 25px !important;
}
/* hover effect button's text */
.Btn:hover .text {
  opacity: 1 !important;
  width: 75% !important;
  transition-duration: .3s !important;
  padding-right: 15px !important;
}
/* button click effect*/
.Btn:active {
  transform: translate(2px ,2px) !important;
}
`

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
    <>
      <style dangerouslySetInnerHTML={{ __html: buttonStyles }} />
      <div className="Btn" onClick={handleClick}>
        <div className="sign">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-[17px] h-[17px]" />
        </div>
        <div className="text">GOOGLE 登入</div>
      </div>
    </>
  )
}

export default GoogleLoginButtonPublic

