import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, Key } from 'lucide-react'
import GoogleLoginButton from '../../components/GoogleLoginButton'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'

const Login = () => {
  const { isAuthenticated, loading, login } = useAuth()
  const navigate = useNavigate()
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPasswordLogin, setShowPasswordLogin] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/admin/dashboard" replace />
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  const handlePasswordLogin = async (e) => {
    e.preventDefault()
    if (!credentials.username || !credentials.password) {
      toast.error('請輸入用戶名和密碼')
      return
    }

    setIsSubmitting(true)
    try {
      await login(credentials.username, credentials.password)
      toast.success('登入成功')
      navigate('/admin/dashboard')
    } catch (error) {
      toast.error(error.response?.data?.error || '登入失敗')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative overflow-hidden bg-slate-950">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#1f1c47] via-[#7f1d1d] to-[#111827]" />
      <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#f43f5e]/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-120px] right-[-80px] h-80 w-80 rounded-full bg-[#6366f1]/40 blur-3xl" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-lg"
        >
          <div className="relative overflow-hidden rounded-3xl bg-white/95 shadow-2xl ring-1 ring-white/70 backdrop-blur">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#f97316] via-[#f43f5e] to-[#6366f1]" />
            <div className="p-10 sm:p-12">
              <div className="mb-8 space-y-4 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ef4444] to-[#f97316] shadow-lg shadow-rose-400/50">
                  <Lock className="h-8 w-8 text-white" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">管理員登入</h1>
                  <p className="text-sm text-gray-600 sm:text-base">
                    請使用授權的帳號登入 CRCRC 管理後台。
                  </p>
                </div>
              </div>

              {!showPasswordLogin ? (
                <>
                  <GoogleLoginButton
                    className="mt-2"
                    onSuccess={(data) => {
                      if (data?.token && data?.user) {
                        localStorage.setItem('token', data.token)
                        window.location.href = '/admin'
                      }
                    }}
                  />

                  <div className="mt-6">
                    <button
                      onClick={() => setShowPasswordLogin(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                    >
                      <Key className="h-4 w-4" />
                      使用密碼登入
                    </button>
                  </div>

                  <div className="mt-6 space-y-2 text-center text-xs text-gray-500 sm:text-sm">
                    <p>登入前系統會先要求輸入管理員專用通關密語，以確保權限安全。</p>
                    <p>完成登入後將自動重新導向至後台首頁。</p>
                  </div>
                </>
              ) : (
                <form onSubmit={handlePasswordLogin} className="space-y-6">
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                      用戶名
                    </label>
                    <input
                      id="username"
                      type="text"
                      value={credentials.username}
                      onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="輸入用戶名"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      密碼
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={credentials.password}
                      onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="輸入密碼"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowPasswordLogin(false)}
                      className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                      disabled={isSubmitting}
                    >
                      返回
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition disabled:opacity-70"
                    >
                      {isSubmitting ? '登入中...' : '登入'}
                    </button>
                  </div>
                </form>
              )}

              <div className="mt-10 text-center">
                <p className="text-sm font-medium text-gray-500">CRCRC 管理系統 v1.0</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Login
