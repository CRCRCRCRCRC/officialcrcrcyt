import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Coins } from 'lucide-react'
import toast from 'react-hot-toast'
import { useWebsiteAuth } from '../contexts/WebsiteAuthContext'
import { useCoin } from '../contexts/CoinContext'
import { coinAPI } from '../services/api'
import GoogleLoginButtonPublic from '../components/GoogleLoginButtonPublic'

const formatCoin = (value) => {
  try {
    return Number(value || 0).toLocaleString('zh-TW')
  } catch {
    return String(value || 0)
  }
}

const RedeemCode = () => {
  const { user, token } = useWebsiteAuth()
  const { balance, hydrated, refreshWallet } = useCoin()
  const isLoggedIn = !!user && !!token

  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()
    const trimmed = code.trim()

    if (!isLoggedIn) {
      toast.error('請先登入後再兌換')
      return
    }
    if (!trimmed) {
      toast.error('請輸入兌換碼')
      return
    }
    if (trimmed.length > 64) {
      toast.error('兌換碼太長，請確認後再試')
      return
    }

    setSubmitting(true)
    try {
      const res = await coinAPI.redeemCode(trimmed)
      const message = res?.data?.message || '兌換成功'
      toast.success(message)
      setCode('')
      await refreshWallet()
    } catch (error) {
      toast.error(error.response?.data?.error || '兌換失敗，請稍後再試')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="border-b border-white/20 bg-white/95 backdrop-blur-xl shadow-sm">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-6 sm:px-8">
          <Link to="/wallet" className="flex items-center text-gray-600 transition hover:text-gray-900">
            <ArrowLeft className="mr-2 h-5 w-5" />
            返回錢包
          </Link>
          <h1 className="text-2xl font-bold text-transparent bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text">
            兌換碼
          </h1>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Coins className="h-4 w-4" />
            <span>
              {isLoggedIn && hydrated
                ? `餘額：${formatCoin(balance)} CRCRCoin`
                : '登入後顯示餘額'}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="rounded-3xl border border-white/20 bg-white/85 p-8 shadow-xl backdrop-blur-xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">輸入兌換碼領取獎勵</h2>
              <p className="mt-2 text-sm text-gray-600">
                有活動或合作兌換碼時，請在此輸入。兌換成功後會直接加入你的 CRCRCoin 錢包。
              </p>
            </div>

            {!isLoggedIn && (
              <div className="mb-6 rounded-2xl border border-dashed border-purple-200 bg-purple-50/60 p-5">
                <p className="text-sm text-purple-700 mb-3">請先使用 Google 登入後再兌換。</p>
                <GoogleLoginButtonPublic />
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="redeem-code" className="block text-sm font-medium text-gray-700">
                  兌換碼
                </label>
                <input
                  id="redeem-code"
                  type="text"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="例：CRCRC-2025"
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
                  disabled={!isLoggedIn || submitting}
                />
              </div>
              <button
                type="submit"
                disabled={!isLoggedIn || submitting || !code.trim()}
                className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? '兌換中...' : '確認兌換'}
              </button>
              <p className="text-xs text-gray-500">
                兌換碼通常區分大小寫，請確認輸入內容。
              </p>
            </form>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-white/30 bg-white/80 p-6 shadow-lg backdrop-blur-xl">
              <h3 className="text-base font-semibold text-gray-900 mb-3">兌換規則</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>每組兌換碼僅能使用一次。</li>
                <li>活動碼通常有有效期限。</li>
                <li>兌換成功後會立即入帳。</li>
              </ul>
            </div>
            <div className="rounded-3xl border border-white/30 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-blue-500/10 p-6 shadow-lg">
              <h3 className="text-base font-semibold text-gray-900 mb-2">注意事項</h3>
              <p className="text-sm text-gray-600">
                兌換碼功能尚在準備中，正式上線後會在公告區通知。
              </p>
              <Link
                to="/announcements"
                className="mt-4 inline-flex items-center text-sm font-semibold text-purple-600 hover:text-purple-700"
              >
                查看最新公告
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RedeemCode
