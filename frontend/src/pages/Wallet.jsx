import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Coins, Calendar, TrendingUp, Wallet as WalletIcon, ShoppingBag, Crown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCoin } from '../contexts/CoinContext'
import toast from 'react-hot-toast'
import CoinIcon from '../../CRCRCoin-icon.svg'

const PASS_TOTAL_LEVELS = 50
const PASS_XP_PER_LEVEL = 500
const PASS_PREMIUM_PRICE = 6000

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
        const msg = res?.error || '尚未到下次簽到時間'
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">請先登入</h2>
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 rounded-3xl border border-white/40 bg-gradient-to-r from-amber-100/80 via-orange-100/70 to-pink-100/80 px-6 py-10 sm:px-12 shadow-xl backdrop-blur"
        >
          <div className="grid gap-8 lg:grid-cols-[260px,1fr] lg:items-center">
            <div className="relative mx-auto w-full max-w-[240px] overflow-hidden rounded-3xl border border-white/70 bg-gradient-to-b from-white/95 via-amber-100/80 to-orange-100/80 p-6 text-purple-700 shadow-xl">
              <div className="pointer-events-none absolute -right-6 -top-10 h-32 w-32 rounded-full bg-purple-200/40 blur-3xl" />
              <div className="pointer-events-none absolute left-4 bottom-0 h-20 w-20 rounded-full bg-purple-200/30 blur-2xl" />
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.35em] text-purple-500">
                <span>CRCRC PASS</span>
                <span>PLUS</span>
              </div>
              <div className="mt-8 space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 shadow-inner">
                  <Crown className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-black leading-tight">雙倍獎勵</h3>
                <p className="text-sm text-purple-600">高級通行券解鎖額外 {PASS_TOTAL_LEVELS} 階段獎勵。</p>
              </div>
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between rounded-2xl bg-white/80 px-4 py-2 text-sm font-semibold text-purple-700 shadow-inner">
                  <span>費用</span>
                  <span>{PASS_PREMIUM_PRICE.toLocaleString('zh-TW')} CRCRCoin</span>
                </div>
                <div className="rounded-2xl bg-white/70 px-4 py-2 text-xs font-semibold text-purple-600 shadow-inner">
                  每階段需要 {PASS_XP_PER_LEVEL.toLocaleString('zh-TW')} XP
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-amber-700">本季通行券</p>
                <h2 className="text-3xl font-bold text-gray-900">解鎖高級獎勵，雙倍收穫</h2>
                <p className="text-base leading-relaxed text-gray-700">
                  完成任務累積 XP 即可依序領取 {PASS_TOTAL_LEVELS} 階段獎勵。購買高級通行券後，可同時領取普通與高級獎勵，回饋直接翻倍。
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Link
                  to="/pass"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:from-purple-600 hover:to-pink-600"
                >
                  <Crown className="h-4 w-4" />
                  查看通行券獎勵
                </Link>
                <Link
                  to="/shop"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-purple-200/60 bg-white/80 px-6 py-3 text-sm font-semibold text-purple-700 shadow transition-all hover:bg-white"
                >
                  <ShoppingBag className="h-4 w-4" />
                  兌換更多 CRCRCoin
                </Link>
              </div>
              <p className="text-xs text-gray-600">
                每提升一階段需要 {PASS_XP_PER_LEVEL.toLocaleString('zh-TW')} XP，總共 {PASS_TOTAL_LEVELS} 階段，所有進度皆由伺服器即時紀錄。
              </p>
            </div>
          </div>
        </motion.div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Balance Card */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-xl border border-white/25 rounded-2xl shadow-xl p-8 h-full"
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
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
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
              className="bg-white/80 backdrop-blur-xl border border-white/25 rounded-2xl shadow-xl p-6 h-full"
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
          className="mt-8 bg-white/80 backdrop-blur-xl border border-white/25 rounded-2xl shadow-xl"
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
                          {new Date(h.created_at).toLocaleDateString('zh-TW')}
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
