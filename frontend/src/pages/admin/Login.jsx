import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock } from 'lucide-react'
import GoogleLoginButton from '../../components/GoogleLoginButton'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'

const Login = () => {
  const { isAuthenticated, loading } = useAuth()


  // 如果已經登入，重定向到管理面板
  if (isAuthenticated) {
    return <Navigate to="/admin/dashboard" replace />
  }



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-secondary-600 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-display font-bold text-gray-900">
              管理員登入
            </h1>
            <p className="text-gray-600 mt-2">
              只支援 Google 登入
            </p>
          </div>

          <div>
            <GoogleLoginButton onSuccess={(data) => {
              if (data?.token && data?.user) {
                localStorage.setItem('token', data.token)
                window.location.href = '/admin'
              }
            }} />
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              CRCRC 管理系統 v1.0
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Login