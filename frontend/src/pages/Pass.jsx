import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowLeft, Crown, Sparkles, Coins, Lock, CheckCircle2, Trophy, ChevronRight, Home } from 'lucide-react'
import toast from 'react-hot-toast'
import { coinAPI } from '../services/api'
import { useCoin } from '../contexts/CoinContext'

const toUniqueList = (value) => {
  if (!Array.isArray(value)) return []
  const seen = new Set()
  const result = []
  value.forEach((item) => {
    const str = item != null ? String(item) : ''
    if (!seen.has(str)) {
      seen.add(str)
      result.push(str)
    }
  })
  return result
}

const sanitizeState = (state = {}) => ({
  hasPremium: !!state.hasPremium,
  claimedFree: toUniqueList(state.claimedFree),
  claimedPremium: toUniqueList(state.claimedPremium)
})

const PREMIUM_BENEFITS = [
  {
    icon: Trophy,
    title: '全線獎勵解鎖',
    description: '立即開啟所有高級獎勵軌，升級即可領取。'
  },
  {
    icon: Coins,
    title: '額外 CRCRCoin',
    description: '每個等級都比免費軌多出 50% CRCRCoin。'
  }
]

const Pass = () => {
  const { isLoggedIn, hydrated, balance, refreshWallet } = useCoin()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [purchaseLoading, setPurchaseLoading] = useState(false)
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [claimingKey, setClaimingKey] = useState(null)

  const rewards = useMemo(() => data?.config?.rewards ?? [], [data?.config?.rewards])
  const premiumPrice = Number(data?.config?.premiumPrice) || 0

  const sanitizedState = data?.state || sanitizeState({})
  const hasPremium = sanitizedState.hasPremium
  const claimedFreeSet = useMemo(() => new Set(sanitizedState.claimedFree || []), [sanitizedState])
  const claimedPremiumSet = useMemo(() => new Set(sanitizedState.claimedPremium || []), [sanitizedState])

  const progress = data?.progress || {}
  const xp = Number(progress?.xp) || 0
  const xpPerLevel = Number(progress?.xpPerLevel) || 200
  const totalLevels = Number(progress?.totalLevels) || (rewards?.length || 0)
  const completedLevels = Math.min(Number(progress?.completedLevels) || 0, totalLevels)
  const currentLevel =
    totalLevels === 0
      ? 0
      : Math.min(totalLevels, Number(progress?.currentLevel) || (completedLevels < totalLevels ? completedLevels + 1 : totalLevels))
  const levelProgress = Math.min(xpPerLevel, Number(progress?.levelProgress) || 0)
  const xpBarPercent = xpPerLevel > 0 ? Math.min(100, Math.round((levelProgress / xpPerLevel) * 100)) : 0

  const formattedBalance = useMemo(() => {
    try {
      return Number(balance || 0).toLocaleString('zh-TW')
    } catch {
      return String(balance || 0)
    }
  }, [balance])

  const updatePassData = useCallback((payload) => {
    if (!payload) return
    setData((prev) => {
      const next = {
        ...prev,
        ...payload
      }
      if (payload.state) {
        next.state = sanitizeState(payload.state)
      } else if (prev?.state) {
        next.state = prev.state
      } else {
        next.state = sanitizeState({})
      }
      return next
    })
  }, [])

  const loadPass = useCallback(async () => {
    if (!isLoggedIn) {
      setData(null)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await coinAPI.getPass()
      if (res?.data) {
        updatePassData(res.data)
      }
    } catch (error) {
      console.error('載入通行券資料失敗:', error)
      toast.error(error?.response?.data?.error || '無法載入通行券資料')
    } finally {
      setLoading(false)
    }
  }, [isLoggedIn, updatePassData])

  useEffect(() => {
    loadPass()
  }, [loadPass])

  const requireLogin = useCallback(() => {
    toast.error('請先登入才能使用通行券')
  }, [])

  const handlePurchase = async () => {
    if (!isLoggedIn) return requireLogin()
    if (!hydrated) {
      toast('資料同步中，請稍候')
      return
    }
    if (hasPremium) {
      toast('已擁有高級通行券')
      return
    }
    setPurchaseLoading(true)
    try {
      const res = await coinAPI.purchasePass()
      toast.success('成功購買高級通行券！')
      if (res?.data) {
        updatePassData(res.data)
      }
      await refreshWallet()
    } catch (error) {
      console.error('購買通行券失敗:', error)
      toast.error(error?.response?.data?.error || '購買失敗，請稍後再試')
    } finally {
      setPurchaseLoading(false)
    }
  }

  const requestPurchase = () => {
    if (!isLoggedIn) return requireLogin()
    if (!hydrated) {
      toast('資料同步中，請稍候')
      return
    }
    if (hasPremium) {
      toast('已擁有高級通行券')
      return
    }
    setShowPremiumModal(true)
  }

  const confirmPurchase = async () => {
    setShowPremiumModal(false)
    await handlePurchase()
  }

  const handleClaim = async (tier, reward) => {
    if (!isLoggedIn) return requireLogin()
    if (!hydrated) {
      toast('資料同步中，請稍候')
      return
    }

    // 防止重複點擊 - 如果正在處理任何領取，就不允許新的領取
    if (claimingKey) {
      return
    }

    if (tier === 'premium' && !hasPremium) {
      toast.error('尚未購買高級通行券')
      return
    }

    const key = `${tier}:${reward.id}`
    setClaimingKey(key)

    try {
      const res = await coinAPI.claimPassReward({ rewardId: reward.id, tier })
      const rewardInfo = res?.data?.reward
      if (rewardInfo?.coins) {
        toast.success(`獲得 ${Number(rewardInfo.coins).toLocaleString('zh-TW')} CRCRCoin`)
      } else {
        toast.success('成功領取獎勵！')
      }
      if (res?.data) {
        updatePassData(res.data)
      }
      await refreshWallet()
    } catch (error) {
      console.error('領取通行券獎勵失敗:', error)
      toast.error(error?.response?.data?.error || '領取失敗，請稍後再試')
    } finally {
      setClaimingKey(null)
    }
  }

  const renderRewardBox = (tier, reward, stageUnlocked) => {
    const isPremiumTier = tier === 'premium'
    const info = isPremiumTier ? reward.premium || {} : reward.free || {}
    const coins = Number(info?.coins) || 0
    const claimedSet = isPremiumTier ? claimedPremiumSet : claimedFreeSet
    const claimed = claimedSet.has(reward.id)
    const lockedByPremium = isPremiumTier && !hasPremium
    const lockedByXp = !stageUnlocked
    const locked = lockedByPremium || lockedByXp
    const processing = claimingKey === `${tier}:${reward.id}`
    const isMilestone = reward.level % 5 === 0

    return (
      <div className="relative w-full">
        {/* 里程碑標記 - 放在按鈕外層 */}
        {isMilestone && !locked && !processing && !claimed && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg z-20 whitespace-nowrap">
            里程碑
          </div>
        )}

        {/* 已領取勾勾 - 放在按鈕外層 */}
        {claimed && (
          <div className="absolute -top-1.5 -right-1.5 bg-green-500 rounded-full p-1 shadow-lg ring-2 ring-white z-20">
            <CheckCircle2 className='h-5 w-5 text-white' />
          </div>
        )}

        <button
          onClick={() => handleClaim(tier, reward)}
          disabled={locked || claimed || processing}
          className={`relative w-full rounded-xl flex flex-col items-center justify-center py-3 px-2 transition-all duration-200 border-3 overflow-hidden ${
            isPremiumTier
              ? 'bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500 border-yellow-500/50'
              : 'bg-gradient-to-br from-cyan-300 via-blue-400 to-indigo-500 border-cyan-500/50'
          } ${
            claimed
              ? 'ring-2 ring-green-400 shadow-lg shadow-green-400/30'
              : locked
                ? 'opacity-30 grayscale'
                : processing
                  ? 'opacity-60 cursor-wait'
                  : 'hover:scale-105 hover:shadow-xl shadow-md active:scale-95'
          } ${
            isMilestone ? 'min-h-[100px]' : 'min-h-[85px]'
          }`}
        >
          {/* 處理中動畫 */}
          {processing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl z-10">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent"></div>
            </div>
          )}

          {/* 鎖定圖標 */}
          {locked && !claimed && !processing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl z-10">
              <Lock className='h-7 w-7 text-white drop-shadow-lg' />
            </div>
          )}

          {/* 獎勵圖標 */}
          <Coins className={`${isMilestone ? 'h-9 w-9' : 'h-7 w-7'} text-white drop-shadow-lg ${isPremiumTier ? 'mb-0.5' : 'mb-1'}`} />

          {/* 金額 */}
          <div className={`${isMilestone ? 'text-xl' : 'text-lg'} font-black text-white drop-shadow-lg ${isPremiumTier ? 'mb-3' : ''}`}>
            {coins}
          </div>

          {/* Premium 標籤 */}
          {isPremiumTier && !processing && !locked && (
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md whitespace-nowrap">
              PREMIUM
            </div>
          )}
        </button>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-600 via-pink-500 to-rose-500 px-4'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='max-w-md rounded-3xl border-4 border-white/30 bg-white shadow-2xl p-8 text-center'
        >
          <div className='mb-6 mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 shadow-xl'>
            <Crown className='h-12 w-12 text-white' />
          </div>
          <h2 className='mb-3 text-3xl font-black text-gray-900'>請先登入</h2>
          <p className='mb-8 text-gray-600 leading-relaxed'>登入後即可管理並領取通行券獎勵</p>
          <Link
            to='/'
            className='inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-4 font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105'
          >
            <Home className='h-5 w-5' />
            返回首頁
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-rose-500'>
      {/* 頂部固定區域 */}
      <div className='bg-gradient-to-r from-purple-700/95 via-pink-600/95 to-rose-600/95 backdrop-blur-xl border-b-4 border-white/20 shadow-2xl'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6'>
          {/* 頂部操作列 */}
          <div className='flex items-center justify-between mb-6'>
            <Link
              to='/wallet'
              className='flex items-center gap-2 text-white/90 transition-all hover:text-white hover:scale-105 font-semibold'
            >
              <ArrowLeft className='h-5 w-5' />
              <span className="hidden sm:inline">返回錢包</span>
            </Link>

            <div className='flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-2xl px-5 py-2.5 border-2 border-white/30 shadow-lg'>
              <Coins className='h-6 w-6 text-yellow-300 drop-shadow-lg' />
              <span className='text-xl font-black text-white drop-shadow-lg'>{formattedBalance}</span>
            </div>
          </div>

          {/* 通行券標題 */}
          <div className='flex items-center justify-between mb-6'>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-gradient-to-br from-yellow-300 to-amber-500 rounded-2xl p-3 shadow-xl">
                  <Crown className='h-8 w-8 text-purple-900' />
                </div>
                <div>
                  <h1 className='text-3xl sm:text-4xl font-black text-white drop-shadow-lg'>
                    通行券【測試階段】
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="bg-white/30 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm border border-white/40">
                      SEASON 1
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {!hasPremium && (
              <button
                onClick={requestPurchase}
                disabled={purchaseLoading || !hydrated}
                className='hidden sm:flex items-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500 px-6 py-3 text-base font-black text-purple-900 shadow-xl transition-all hover:shadow-2xl hover:scale-105 disabled:opacity-50 border-4 border-yellow-400/50'
              >
                <Crown className="h-5 w-5" />
                {purchaseLoading ? '購買中...' : `升級 ${premiumPrice.toLocaleString('zh-TW')}`}
              </button>
            )}
          </div>

          {/* 進度條 */}
          <div className='space-y-3 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border-2 border-white/20'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Sparkles className='h-5 w-5 text-yellow-300 drop-shadow-lg' />
                <span className='font-black text-white text-lg drop-shadow-lg'>
                  XP
                </span>
                <span className='font-black text-white text-lg drop-shadow-lg'>
                  {levelProgress}/{xpPerLevel}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  to='/tasks'
                  className='flex items-center gap-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-xl font-bold text-sm transition-all hover:scale-105 border border-white/30'
                >
                  完成任務
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <div className="bg-gradient-to-br from-white to-gray-100 text-purple-900 font-black text-lg px-4 py-2 rounded-xl shadow-lg border-2 border-white/50">
                  {currentLevel}
                </div>
              </div>
            </div>

            <div className='relative h-4 w-full overflow-hidden rounded-full bg-purple-900/50 border-2 border-white/20 shadow-inner'>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xpBarPercent}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className='h-full rounded-full bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 shadow-lg'
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-black text-white drop-shadow-lg">{xpBarPercent}%</span>
              </div>
            </div>
          </div>

          {/* 高級通行券購買按鈕 (手機版) */}
          {!hasPremium && (
            <div className="sm:hidden mt-4">
              <button
                onClick={requestPurchase}
                disabled={purchaseLoading || !hydrated}
                className='w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500 px-6 py-3 text-base font-black text-purple-900 shadow-xl transition-all hover:shadow-2xl hover:scale-105 disabled:opacity-50 border-4 border-yellow-400/50'
              >
                <Crown className="h-5 w-5" />
                {purchaseLoading ? '購買中...' : `升級高級通行券 ${premiumPrice.toLocaleString('zh-TW')}`}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 獎勵軌道 */}
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8'>
        {loading ? (
          <div className='flex justify-center py-20'>
            <div className='h-16 w-16 animate-spin rounded-full border-8 border-white/30 border-t-white shadow-xl' />
          </div>
        ) : rewards.length === 0 ? (
          <div className='py-20 text-center'>
            <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-12 border-4 border-white/30">
              <p className="text-white/70 text-lg font-semibold">尚未設定通行券獎勵</p>
            </div>
          </div>
        ) : (
          <div className='overflow-x-auto pb-6'>
            {/* 軌道容器 */}
            <div className='inline-flex gap-0 min-w-full'>
              {rewards.map((reward, index) => {
                const stageUnlocked = xp >= 200 * reward.level
                const isCurrentLevel = reward.level === currentLevel
                const showConnector = index < rewards.length - 1

                return (
                  <div key={reward.id} className="flex items-center">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className='inline-block w-36 shrink-0'
                    >
                      {/* 高級獎勵 */}
                      <div className='mb-2.5'>
                        {renderRewardBox('premium', reward, stageUnlocked)}
                      </div>

                      {/* 等級數字 */}
                      <div
                        className={`mb-2.5 flex h-11 items-center justify-center rounded-xl text-lg font-black transition-all border-3 shadow-md ${
                          isCurrentLevel
                            ? 'bg-gradient-to-br from-white to-gray-100 text-purple-600 ring-2 ring-white shadow-lg scale-105 border-white'
                            : stageUnlocked
                              ? 'bg-gradient-to-br from-yellow-300 to-amber-500 text-purple-900 border-yellow-400/50'
                              : 'bg-purple-900/30 text-white/40 border-white/20'
                        }`}
                      >
                        {reward.level}
                      </div>

                      {/* 免費獎勵 */}
                      <div>
                        {renderRewardBox('free', reward, stageUnlocked)}
                      </div>
                    </motion.div>

                    {/* 連接線 */}
                    {showConnector && (
                      <div className="flex-shrink-0 w-6 flex flex-col items-center justify-center gap-2.5 px-1">
                        <div className={`h-1 w-full rounded-full ${stageUnlocked ? 'bg-yellow-400' : 'bg-white/20'}`}></div>
                        <div className="h-12"></div>
                        <div className={`h-1 w-full rounded-full ${stageUnlocked ? 'bg-cyan-400' : 'bg-white/20'}`}></div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 圖例說明 */}
        <div className='mt-8 flex flex-wrap items-center justify-center gap-6 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border-2 border-white/20'>
          <div className='flex items-center gap-2'>
            <div className='h-6 w-6 rounded-lg bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500 border-2 border-yellow-500/50 shadow-lg' />
            <span className="font-bold text-white drop-shadow-lg">高級獎勵</span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='h-6 w-6 rounded-lg bg-gradient-to-br from-cyan-300 via-blue-400 to-indigo-500 border-2 border-cyan-500/50 shadow-lg' />
            <span className="font-bold text-white drop-shadow-lg">免費獎勵</span>
          </div>
          {hasPremium && (
            <div className='flex items-center gap-2'>
              <Crown className="h-6 w-6 text-yellow-300 drop-shadow-lg" />
              <span className="font-bold text-yellow-300 drop-shadow-lg">已擁有高級通行券</span>
            </div>
          )}
        </div>
      </div>

      {/* 購買模態框 */}
      <AnimatePresence>
        {showPremiumModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4'
            onClick={() => setShowPremiumModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className='w-full max-w-md rounded-3xl bg-gradient-to-br from-white via-purple-50 to-pink-50 p-6 shadow-2xl border-4 border-purple-200'
            >
              <div className='mb-6 flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <div className='flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 shadow-xl'>
                    <Crown className='h-8 w-8 text-white' />
                  </div>
                  <div>
                    <h3 className='text-2xl font-black text-gray-900'>購買高級通行券</h3>
                    <p className="text-sm text-gray-600 font-semibold">解鎖全部高級獎勵</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPremiumModal(false)}
                  className='flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-600 transition hover:bg-gray-300 text-xl font-bold'
                >
                  ✕
                </button>
              </div>

              <div className="mb-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-4 text-center shadow-lg">
                <p className='text-white/90 text-sm font-semibold mb-1'>
                  支付金額
                </p>
                <p className="text-4xl font-black text-white drop-shadow-lg">
                  {premiumPrice.toLocaleString('zh-TW')}
                </p>
                <p className="text-white/90 text-sm font-semibold mt-1">
                  CRCRCoin
                </p>
              </div>

              <div className='mb-6 space-y-3'>
                {PREMIUM_BENEFITS.map((benefit) => {
                  const Icon = benefit.icon
                  return (
                    <div
                      key={benefit.title}
                      className='flex gap-3 rounded-2xl border-2 border-purple-200 bg-white p-4 shadow-lg'
                    >
                      <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg'>
                        <Icon className='h-6 w-6 text-white' />
                      </div>
                      <div>
                        <p className='font-black text-gray-900 text-lg'>{benefit.title}</p>
                        <p className='text-sm text-gray-600 font-medium'>{benefit.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className='flex gap-3'>
                <button
                  onClick={() => setShowPremiumModal(false)}
                  className='flex-1 rounded-xl border-4 border-gray-300 bg-white px-4 py-3 font-black text-gray-700 transition hover:bg-gray-50 text-lg'
                >
                  取消
                </button>
                <button
                  onClick={confirmPurchase}
                  disabled={purchaseLoading}
                  className='flex-1 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-3 font-black text-white shadow-xl transition hover:shadow-2xl hover:scale-105 disabled:opacity-50 text-lg border-4 border-purple-300'
                >
                  {purchaseLoading ? '購買中…' : '確認購買'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Pass
