import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Coins, Send, Search, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { coinAPI, authAPI } from '../../services/api'

const AddCoins = () => {
  const [email, setEmail] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [users, setUsers] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const dropdownRef = useRef(null)

  // 點擊外部關閉下拉選單
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 搜尋用戶
  const searchUsers = async (query) => {
    if (!query || query.length < 2) {
      setUsers([])
      setShowDropdown(false)
      return
    }

    setLoadingUsers(true)
    try {
      const response = await authAPI.getUsers(query)
      setUsers(response.data?.users || [])
      setShowDropdown(true)
    } catch (error) {
      console.error('搜尋用戶失敗:', error)
      setUsers([])
    } finally {
      setLoadingUsers(false)
    }
  }

  // 處理搜尋輸入變化
  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  // 選擇用戶
  const selectUser = (user) => {
    setEmail(user.email)
    setSearchQuery(user.display_name || user.email)
    setShowDropdown(false)
  }

  // 清除選擇
  const clearSelection = () => {
    setEmail('')
    setSearchQuery('')
    setUsers([])
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const trimmedEmail = email.trim()
    const value = Math.floor(Number(amount))

    if (!trimmedEmail) {
      toast.error('請輸入用戶電子郵件')
      return
    }
    if (!Number.isFinite(value) || value === 0) {
      toast.error('請輸入正確的 coin 數量（可正負整數）')
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
        toast.success(`已發放 ${value} coin 給 ${trimmedEmail}`)
      } else {
        toast.success(`已扣除 ${Math.abs(value)} coin，目標：${trimmedEmail}`)
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
                管理員發放 coin
              </h1>
              <p className="text-sm text-gray-600">
                直接依電子郵件搜尋用戶，支援發放或扣除 coin 餘額
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
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                搜尋用戶（依名稱或電子郵件）
              </label>
              <div className="relative" ref={dropdownRef}>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="輸入名稱或電子郵件搜尋..."
                    className="w-full pl-12 pr-10 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* 用戶下拉選單 */}
                {showDropdown && (
                  <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                    {loadingUsers ? (
                      <div className="px-4 py-3 text-center text-gray-500">搜尋中...</div>
                    ) : users.length === 0 ? (
                      <div className="px-4 py-3 text-center text-gray-500">找不到用戶</div>
                    ) : (
                      users.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => selectUser(user)}
                          className="w-full px-4 py-3 text-left hover:bg-blue-50 transition border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">
                            {user.display_name || user.username || '未命名'}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                用戶電子郵件 {email && <span className="text-green-600">✓ 已選擇</span>}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com 或從上方搜尋選擇"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              發放數量（coin）
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
