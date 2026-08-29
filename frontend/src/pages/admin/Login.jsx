import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { CornerDownLeft, Loader2, LockKeyhole } from 'lucide-react'
import toast from 'react-hot-toast'
import AdminThemeSwitch from '../../components/AdminThemeSwitch'
import GoogleLoginButton from '../../components/GoogleLoginButton'
import { useAuth } from '../../contexts/AuthContext'
import useAdminTheme from '../../hooks/useAdminTheme'

const LoginBackdrop = () => (
  <>
    <div className="admin-login-backdrop-base absolute inset-0 bg-[#060817]" />
    <motion.div
      className="admin-login-orb-a absolute left-[12%] top-[8%] h-[34rem] w-[34rem] rounded-full bg-indigo-600/25 blur-[130px]"
      animate={{ x: [0, 70, 0], y: [0, 35, 0], scale: [1, 1.12, 1] }}
      transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.div
      className="admin-login-orb-b absolute bottom-[-12rem] right-[5%] h-[38rem] w-[38rem] rounded-full bg-fuchsia-500/20 blur-[150px]"
      animate={{ x: [0, -55, 0], y: [0, -25, 0], scale: [1.08, 0.96, 1.08] }}
      transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
    />
    <div
      className="admin-login-grid absolute inset-0 opacity-[0.11]"
      style={{
        backgroundImage:
          'linear-gradient(rgba(148,163,184,.16) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.16) 1px, transparent 1px)',
        backgroundSize: '64px 64px',
        maskImage: 'radial-gradient(circle at center, black, transparent 78%)'
      }}
    />
    <div className="admin-login-vignette absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(6,8,23,.22)_50%,rgba(6,8,23,.88)_100%)]" />
  </>
)

const Login = () => {
  const {
    user,
    isAuthenticated,
    loading,
    beginAdminGoogleLogin,
    completeAdminGoogleLogin
  } = useAuth()
  const navigate = useNavigate()
  const { theme, setTheme } = useAdminTheme()
  const [challenge, setChallenge] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isAuthenticated && user?.role === 'admin') {
    return <Navigate to="/admin/announcements" replace />
  }

  const handleGoogleCode = async (code) => {
    setIsSubmitting(true)
    try {
      const nextChallenge = await beginAdminGoogleLogin(code)
      setChallenge(nextChallenge)
      setPassword('')
    } catch (error) {
      toast.error(error.response?.data?.error || error.message || 'Google 帳號驗證失敗')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePasswordSubmit = async (event) => {
    event.preventDefault()
    if (!password || isSubmitting) return

    setIsSubmitting(true)
    try {
      await completeAdminGoogleLogin(challenge, password)
      navigate('/admin/announcements', { replace: true })
    } catch (error) {
      const responseData = error.response?.data
      toast.error(responseData?.error || error.message || '登入失敗')
      setPassword('')

      if (responseData?.code === 'ADMIN_CHALLENGE_EXPIRED') {
        setChallenge('')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className={`admin-login admin-login-${theme} relative min-h-screen overflow-hidden`}>
      <LoginBackdrop />

      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <AdminThemeSwitch theme={theme} onChange={setTheme} compact />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-12">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="admin-login-loading flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-xl"
            >
              <Loader2 className="h-6 w-6 animate-spin text-indigo-200" />
            </motion.div>
          ) : !challenge ? (
            <motion.div
              key="google"
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -14, scale: 0.97 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-[340px]"
            >
              <GoogleLoginButton onCode={handleGoogleCode} disabled={isSubmitting} />
            </motion.div>
          ) : (
            <motion.form
              key="password"
              onSubmit={handlePasswordSubmit}
              onKeyDown={(event) => {
                if (event.key === 'Escape' && !isSubmitting) {
                  setChallenge('')
                  setPassword('')
                }
              }}
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -14, scale: 0.96 }}
              transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-[430px]"
              aria-label="管理員密碼驗證"
            >
              <div className="admin-login-password-frame group relative rounded-[28px] bg-gradient-to-r from-cyan-300/70 via-indigo-400/80 to-fuchsia-400/70 p-px shadow-[0_28px_100px_-28px_rgba(99,102,241,1)] transition-shadow duration-500 focus-within:shadow-[0_32px_120px_-22px_rgba(129,140,248,1)]">
                <div className="admin-login-password-glow absolute -inset-3 -z-10 rounded-[36px] bg-gradient-to-r from-cyan-400/20 via-indigo-500/25 to-fuchsia-500/20 blur-2xl transition duration-500 group-focus-within:opacity-100" />
                <div className="admin-login-password-surface flex items-center rounded-[27px] bg-slate-950/90 px-5 backdrop-blur-2xl">
                  <LockKeyhole className="admin-login-password-icon h-5 w-5 shrink-0 text-indigo-200" aria-hidden="true" />
                  <input
                    type="password"
                    name="admin-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={isSubmitting}
                    autoFocus
                    autoComplete="current-password"
                    aria-label="管理員密碼"
                    placeholder="••••••••"
                    className="admin-login-password-input min-w-0 flex-1 border-0 bg-transparent px-4 py-5 text-lg tracking-[0.28em] text-white caret-cyan-300 outline-none placeholder:tracking-[0.22em] placeholder:text-slate-600 disabled:cursor-wait"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting || !password}
                    aria-label="送出密碼"
                    className="admin-login-password-submit flex h-10 w-10 shrink-0 items-center justify-center text-slate-600 transition-colors hover:text-cyan-100 focus:outline-none focus-visible:text-cyan-100 disabled:cursor-default disabled:hover:text-slate-600 group-focus-within:text-cyan-200"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                    ) : (
                      <CornerDownLeft className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}

export default Login
