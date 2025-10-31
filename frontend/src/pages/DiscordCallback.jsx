import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { authAPI } from '../services/api'

const DiscordCallback = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('processing') // processing, success, error
  const [message, setMessage] = useState('正在處理 Discord 綁定...')

  useEffect(() => {
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      setStatus('error')
      setMessage('Discord 授權被取消')
      toast.error('Discord 授權被取消')
      setTimeout(() => navigate('/profile'), 2000)
      return
    }

    if (!code) {
      setStatus('error')
      setMessage('缺少授權碼')
      toast.error('缺少授權碼')
      setTimeout(() => navigate('/profile'), 2000)
      return
    }

    handleDiscordBind(code)
  }, [searchParams, navigate])

  const handleDiscordBind = async (code) => {
    try {
      const response = await authAPI.bindDiscord(code)
      setStatus('success')
      setMessage(`Discord 綁定成功！歡迎 ${response.data.discord.username}`)
      toast.success('Discord 帳號綁定成功！')

      setTimeout(() => {
        navigate('/profile')
      }, 2000)
    } catch (error) {
      console.error('Discord 綁定失敗:', error)
      setStatus('error')
      setMessage(error.response?.data?.error || 'Discord 綁定失敗')
      toast.error(error.response?.data?.error || 'Discord 綁定失敗')

      setTimeout(() => {
        navigate('/profile')
      }, 3000)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-3xl border border-white/60 bg-white/90 shadow-2xl p-8 text-center space-y-6">
        {status === 'processing' && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">處理中</h1>
            <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">綁定成功</h1>
            <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
            <p className="text-xs text-gray-500">正在返回個人資料頁面...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-500">
              <XCircle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">綁定失敗</h1>
            <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
            <p className="text-xs text-gray-500">正在返回個人資料頁面...</p>
          </>
        )}
      </div>
    </div>
  )
}

export default DiscordCallback
