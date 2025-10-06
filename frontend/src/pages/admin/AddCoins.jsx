import { useState } from 'react'
import { motion } from 'framer-motion'
import { Coins, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { coinAPI } from '../../services/api'

const AddCoins = () => {
  const [email, setEmail] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    const trimmedEmail = email.trim()
    const value = Math.floor(Number(amount))

    if (!trimmedEmail) {
      toast.error('請輸入用戶電子郵件')
      return
    }
    if (!Number.isFinite(value) || value === 0) {
      toast.error('請輸入正確的 CRCRCoin 數量（可正負整數）')
      return
    }

    // 檢查電子郵件格式
    if (!trimmedEmail.includes('@')) {
      toast.error('請輸入有效的電子郵件地址')
      return
    }

    // 檢查用戶角色
    const adminToken = localStorage.getItem('token');
    if (adminToken) {
      try {
        const payload = adminToken.split('.')[1];
        const decoded = JSON.parse(atob(payload));
        console.log('🔍 管理員令牌解碼結果:', decoded);
        if (decoded.role !== 'admin') {
          toast.error('您的帳號沒有管理員權限');
          return;
        }
      } catch (e) {
        console.error('❌ 令牌解碼失敗:', e);
      }
    }

    setLoading(true)
    try {
      console.log('🔍 調用 grantCoins:', { email: trimmedEmail, amount: value })
      const response = await coinAPI.grantCoins(trimmedEmail, value)
      console.log('✅ grantCoins 響應:', response)
      
      if (value > 0) {
        toast.success(`已發放 ${value} CRCRCoin 給 ${trimmedEmail}`)
      } else {
        toast.success(`已扣除 ${Math.abs(value)} CRCRCoin，目標：${trimmedEmail}`)
      }
      setEmail('')
      setAmount('')
    } catch (error) {
      console.error('❌ grantCoins 錯誤:', error)
      console.error('❌ 錯誤響應:', error.response)
      const errorMessage = error.response?.data?.error || error.message || '發放失敗，請稍後再試'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="bg-white bg-opacity-80 backdrop-blur-xl border-b border-white/20 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 py-8">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl flex items-center justify-center text-white">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                管理員發放 CRCRCoin
              </h1>
              <p className="text-sm text-gray-600">
                直接依電子郵件搜尋用戶，支援發放或扣除 CRCRCoin 餘額
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/85 backdrop-blur-xl border border-white/20 rounded-3xl shadow-xl p-8 space-y-6"
        >
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              用戶電子郵件
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              發放數量（CRCRCoin）
            </label>
            <input
              type="number"
              step={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="例如：100 或 -50"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
              required
            />
          </div>

          <div className="bg-blue-50 border border-blue-100 text-blue-700 text-sm rounded-xl p-4 space-y-1">
            <p>注意：僅會發放給已經登入過的用戶（Google 登入時使用的電子郵件）。</p>
            <p>提示：輸入正數等於發放，輸入負數等於扣除。</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg hover:shadow-xl transition disabled:opacity-60"
          >
            <Send className="w-5 h-5" />
            {loading ? '發放中…' : '立即發放'}
          </button>
        </motion.form>
      </div>
    </div>
  )
}

export default AddCoins
