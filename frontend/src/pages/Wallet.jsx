import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Coins, Calendar, TrendingUp, Wallet as WalletIcon, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCoin } from '../contexts/CoinContext'
import toast from 'react-hot-toast'
import CoinIcon from '../../CRCRCoin-icon.svg'

const normalizeMessage = (value, fallback) => {
  if (!value) return fallback
  if (typeof value === 'string') return value
  if (typeof value?.message === 'string') return value.message
  if (typeof value?.error === 'string') return value.error
  try {
    return JSON.stringify(value)
  } catch {
    return fallback
  }
}

const Wallet = () => {
  const {
    isLoggedIn,
    hydrated,
    balance,
    history,
    claimDaily,
    canClaimNow,
    nextClaimInMs
  } = useCoin()

  const [claiming, setClaiming] = useState(false)
  const [leftMs, setLeftMs] = useState(nextClaimInMs)

  // Countdown for next claim
  useEffect(() => {
    setLeftMs(nextClaimInMs)
    if (nextClaimInMs <= 0) return
    const id = setInterval(() => {
      setLeftMs((ms) => (ms > 1000 ? ms - 1000 : 0))
    }, 1000)
    return () => clearInterval(id)
  }, [nextClaimInMs])

  const fmtCoin = (n) => {
    try {
      return Number(n || 0).toLocaleString('zh-TW')
    } catch {
      return String(n || 0)
    }
  }

  const fmtTime = (ms) => {
    const s = Math.ceil(ms / 1000)
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    const pad = (x) => String(x).padStart(2, '0')
    return `${pad(h)}:${pad(m)}:${pad(sec)}`
  }

  const fmtNextClaimTime = (ms) => {
    if (ms <= 0) return '可以簽到'

    // 計算剩餘時間
    const hours = Math.floor(ms / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))

    // 如果超過24小時，顯示明天格式
    if (hours >= 24) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)
      const timeUntilMidnight = tomorrow.getTime() - Date.now()
      const h = Math.floor(timeUntilMidnight / (1000 * 60 * 60))
      const m = Math.floor((timeUntilMidnight % (1000 * 60 * 60)) / (1000 * 60))
      return `明天 ${pad(h)}:${pad(m)}`
    }

    // 如果在24小時內，顯示剩餘小時和分鐘
    return `${pad(hours)}:${pad(minutes)} 後`
  }

  const pad = (x) => String(x).padStart(2, '0')

  const onDaily = async () => {
    if (claiming) return
    setClaiming(true)
    try {
      const res = await claimDaily()
      if (res?.success) {
        toast.success(`簽到成功！獲得 ${res.amount} CRCRCoin`)
      } else {
        const msg = normalizeMessage(res?.error, '尚未到下次簽到時間')
        toast.error(msg)
      }
    } finally {
      setClaiming(false)
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Coins className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">請先登入</h2>
          <p className="text-gray-600 mb-6">登入後即可查看您的 CRCRCoin 錢包</p>
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-500 to-pink-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            返回首頁
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-xl border-b border-white border-opacity-20 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <Link
              to="/"
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              返回首頁
            </Link>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              CRCRCoin 錢包
            </h1>
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Balance Card */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-xl border border-white/25 rounded-2xl shadow-xl p-8 h-full tech-surface"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg">
                    <img src={CoinIcon} className="w-6 h-6" alt="CRCRCoin" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">目前餘額</h2>
                    <p className="text-sm text-gray-600">CRCRCoin 錢包</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-700 via-orange-600 to-amber-600">
                    {hydrated ? fmtCoin(balance) : '...'}
                  </div>
                  <div className="text-sm text-gray-500">CRCRCoin</div>
                </div>
              </div>

              {/* Daily Claim */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100 tech-surface">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-green-800">每日簽到獎勵</span>
                    </div>
                    <p className="text-sm text-green-700">
                      {!isLoggedIn
                        ? '請先登入'
                        : (!hydrated
                          ? '同步中...'
                          : (canClaimNow ? '可以領取每日獎勵了！' : `下次簽到：${fmtNextClaimTime(leftMs)}`))}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={onDaily}
                      disabled={!isLoggedIn || !hydrated || !canClaimNow || claiming}
                      className={`px-6 py-3 rounded-xl font-semibold text-white transition-all ${
                        (!isLoggedIn || !hydrated || !canClaimNow || claiming)
                          ? 'bg-gray-300 cursor-not-allowed'
                          : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg hover:shadow-xl'
                      }`}
                    >
                      {!isLoggedIn
                        ? '請先登入'
                        : (!hydrated
                          ? '同步中...'
                          : (claiming
                            ? '處理中...'
                            : (canClaimNow ? '領取 +50' : fmtNextClaimTime(leftMs))))}
                    </button>
                    <Link
                      to="/shop"
                      className="px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      前往商城
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Stats Card */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/80 backdrop-blur-xl border border-white/25 rounded-2xl shadow-xl p-6 h-full tech-surface"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">統計資訊</h3>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">總餘額</span>
                  <span className="font-semibold text-gray-900">{hydrated ? fmtCoin(balance) : '...'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">今日可領取</span>
                  <span className="font-semibold text-green-600">
                    {isLoggedIn && hydrated && canClaimNow ? '+50' : '0'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">交易筆數</span>
                  <span className="font-semibold text-gray-900">{history.length}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Transaction History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 bg-white/80 backdrop-blur-xl border border-white/25 rounded-2xl shadow-xl tech-surface"
        >
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">交易記錄</h3>
          </div>

          <div className="p-6">
            {history.length === 0 ? (
              <div className="text-center py-8">
                <WalletIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">尚無交易記錄</p>
                <p className="text-sm text-gray-400 mt-1">開始使用 CRCRCoin 來記錄您的交易</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-auto">
                {history.map((h, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50/50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                          h.type === 'spend' ? 'bg-red-500' : 'bg-green-500'
                        }`}
                      >
                        {h.type === 'spend' ? '-' : '+'}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {h.reason || (h.type === 'claim' ? '每日簽到' : h.type === 'earn' ? '獲得' : '消費')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {(() => {
                            try {
                              const dateValue = h.at || h.created_at;
                              if (!dateValue) return '未知日期';
                              const date = new Date(dateValue);
                              return isNaN(date.getTime()) ? '無效日期' : date.toLocaleDateString('zh-TW');
                            } catch (e) {
                              return '日期錯誤';
                            }
                          })()}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`font-bold tabular-nums ${
                        h.type === 'spend' ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {h.type === 'spend' ? '-' : '+'}{fmtCoin(h.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Wallet
