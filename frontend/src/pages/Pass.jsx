import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowLeft, Crown, Sparkles, Coins, Lock, CheckCircle2, BadgeCheck, Trophy, Star, Gift, Zap } from 'lucide-react'
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
  },
  {
    icon: BadgeCheck,
    title: '專屬身份展示',
    description: '獲得高級徽章與未來額外的視覺強化。'
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
  const xpToNext = Math.max(0, xpPerLevel - levelProgress)
  const totalClaimedFree = claimedFreeSet.size
  const totalClaimedPremium = claimedPremiumSet.size

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

  const renderRewardCard = (tier, reward, stageUnlocked) => {
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
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`relative overflow-hidden rounded-2xl p-5 transition-all ${
          isPremiumTier
            ? 'bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500'
            : 'bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600'
        } ${claimed ? 'ring-4 ring-emerald-400 shadow-2xl' : locked ? 'opacity-50' : 'shadow-xl hover:shadow-2xl'}`}
      >
        <div className='pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/20 blur-3xl' />

        {isMilestone && (
          <div className='absolute top-2 right-2 rounded-full bg-white/30 backdrop-blur-sm px-3 py-1 flex items-center gap-1'>
            <Star className='h-3 w-3 text-yellow-200' />
            <span className='text-xs font-bold text-white'>里程碑</span>
          </div>
        )}

        <div className='relative space-y-4'>
          <div className='flex items-start justify-between'>
            <div className='flex-1'>
              <div className='flex items-center gap-2 mb-2'>
                {isPremiumTier ? (
                  <Crown className='h-4 w-4 text-yellow-200' />
                ) : (
                  <Gift className='h-4 w-4 text-blue-100' />
                )}
                <span className='text-xs font-bold uppercase tracking-wider text-white/90'>
                  {isPremiumTier ? '高級獎勵' : '普通獎勵'}
                </span>
              </div>
              <div className='text-3xl font-black text-white'>
                {coins.toLocaleString('zh-TW')}
              </div>
              <div className='text-sm font-semibold text-white/80'>CRCRCoin</div>
            </div>

            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
              claimed ? 'bg-emerald-500' : locked ? 'bg-white/20' : 'bg-white/30'
            }`}>
              {claimed ? (
                <CheckCircle2 className='h-6 w-6 text-white' />
              ) : locked ? (
                <Lock className='h-6 w-6 text-white/60' />
              ) : (
                <Coins className='h-6 w-6 text-white' />
              )}
            </div>
          </div>

          <button
            type='button'
            onClick={() => handleClaim(tier, reward)}
            disabled={locked || claimed || processing}
            className={`w-full rounded-xl px-4 py-3 text-sm font-bold transition-all ${
              claimed
                ? 'bg-white/30 text-white/80 cursor-not-allowed'
                : locked
                  ? 'bg-white/20 text-white/60 cursor-not-allowed'
                  : 'bg-white text-gray-900 hover:bg-white/90 shadow-lg'
            }`}
          >
            {claimed ? '✓ 已領取' : processing ? '領取中...' : locked ? '🔒 尚未解鎖' : '領取獎勵'}
          </button>
        </div>
      </motion.div>
    )
  }

  const renderLevelSection = (reward, index) => {
    const requiredXp = 200
    const stageUnlocked = xp >= requiredXp * reward.level
    const stageComplete = reward.level <= completedLevels
    const isCurrentLevel = reward.level === currentLevel && !stageComplete
    const isMilestone = reward.level % 5 === 0

    return (
      <motion.div
        key={reward.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
        className={`relative ${isMilestone ? 'col-span-full' : ''}`}
      >
        {/* Level Header */}
        <div className='mb-4 flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl font-black text-xl transition-all ${
              stageComplete
                ? 'bg-gradient-to-br from-yellow-300 to-amber-500 text-purple-900 shadow-lg'
                : isCurrentLevel
                  ? 'bg-white text-purple-600 shadow-xl ring-4 ring-purple-300'
                  : 'bg-white/20 text-white/70 backdrop-blur'
            }`}>
              {reward.level}
              {stageComplete && (
                <CheckCircle2 className='absolute -top-1 -right-1 h-5 w-5 text-emerald-400 drop-shadow-lg' />
              )}
            </div>
            <div>
              <div className='flex items-center gap-2'>
                <h3 className='text-lg font-bold text-white'>等級 {reward.level}</h3>
                {isMilestone && (
                  <div className='flex items-center gap-1 rounded-full bg-yellow-400/30 px-2 py-0.5'>
                    <Star className='h-3 w-3 text-yellow-300' />
                    <span className='text-xs font-bold text-yellow-100'>里程碑</span>
                  </div>
                )}
              </div>
              <p className='text-sm text-white/70'>
                {stageUnlocked ? (
                  stageComplete ? '已完成' : '可領取獎勵'
                ) : (
                  `需要 ${(requiredXp * reward.level).toLocaleString('zh-TW')} XP`
                )}
              </p>
            </div>
          </div>

          {isCurrentLevel && (
            <div className='flex items-center gap-2 rounded-full bg-purple-500/30 backdrop-blur-sm px-4 py-2'>
              <Zap className='h-4 w-4 text-yellow-300' />
              <span className='text-sm font-bold text-white'>當前等級</span>
            </div>
          )}
        </div>

        {/* Rewards Grid */}
        <div className={`grid gap-4 ${isMilestone ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
          <div>{renderRewardCard('free', reward, stageUnlocked)}</div>
          <div>{renderRewardCard('premium', reward, stageUnlocked)}</div>
        </div>

        {/* Divider */}
        {index < rewards.length - 1 && (
          <div className='mt-8 mb-8 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent' />
        )}
      </motion.div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 px-4'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='max-w-md rounded-3xl border border-purple-200 bg-white/90 backdrop-blur-xl shadow-2xl p-8 text-center'
        >
          <div className='mb-6 mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 shadow-xl'>
            <Crown className='h-10 w-10 text-white' />
          </div>
          <h2 className='mb-3 text-3xl font-black text-gray-900'>請先登入</h2>
          <p className='mb-8 text-gray-600 leading-relaxed'>登入後即可管理並領取通行券獎勵</p>
          <Link
            to='/'
            className='inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-4 font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105'
          >
            <ArrowLeft className='h-5 w-5' />
            返回首頁
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#2d1b4e] to-[#0f0518] text-white'>
      {/* Header */}
      <div className='border-b border-white/10 bg-black/30 backdrop-blur-xl'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between py-6'>
            <Link
              to='/wallet'
              className='flex items-center gap-2 text-white/70 transition-colors hover:text-white font-medium'
            >
              <ArrowLeft className='h-5 w-5' />
              返回錢包
            </Link>
            <div className='flex items-center gap-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500'>
                <Crown className='h-5 w-5 text-white' />
              </div>
              <h1 className='text-2xl font-black'>CRCRC 通行券</h1>
            </div>
            <div className='w-24' />
          </div>
        </div>
      </div>

      <div className='mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8'>
        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='grid gap-6 md:grid-cols-2 lg:grid-cols-4'
        >
          {/* Current Level Card */}
          <div className='relative overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-6 backdrop-blur-xl'>
            <div className='absolute -right-6 -top-6 h-24 w-24 rounded-full bg-purple-500/30 blur-3xl' />
            <div className='relative'>
              <div className='flex items-center justify-between mb-2'>
                <span className='text-sm font-semibold text-white/70'>當前等級</span>
                <Sparkles className='h-5 w-5 text-purple-300' />
              </div>
              <div className='text-4xl font-black text-white'>{currentLevel}</div>
              <div className='mt-2 text-sm text-white/70'>共 {totalLevels} 等級</div>
            </div>
          </div>

          {/* Total XP Card */}
          <div className='relative overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 p-6 backdrop-blur-xl'>
            <div className='absolute -right-6 -top-6 h-24 w-24 rounded-full bg-blue-500/30 blur-3xl' />
            <div className='relative'>
              <div className='flex items-center justify-between mb-2'>
                <span className='text-sm font-semibold text-white/70'>總 XP</span>
                <Zap className='h-5 w-5 text-blue-300' />
              </div>
              <div className='text-4xl font-black text-white'>{xp.toLocaleString('zh-TW')}</div>
              <div className='mt-2 text-sm text-white/70'>經驗值</div>
            </div>
          </div>

          {/* Wallet Balance Card */}
          <div className='relative overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-amber-500/20 to-orange-500/20 p-6 backdrop-blur-xl'>
            <div className='absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-500/30 blur-3xl' />
            <div className='relative'>
              <div className='flex items-center justify-between mb-2'>
                <span className='text-sm font-semibold text-white/70'>餘額</span>
                <Coins className='h-5 w-5 text-amber-300' />
              </div>
              <div className='text-4xl font-black text-white'>{formattedBalance}</div>
              <div className='mt-2 text-sm text-white/70'>CRCRCoin</div>
            </div>
          </div>

          {/* Premium Status Card */}
          <div className='relative overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-rose-500/20 to-pink-500/20 p-6 backdrop-blur-xl'>
            <div className='absolute -right-6 -top-6 h-24 w-24 rounded-full bg-rose-500/30 blur-3xl' />
            <div className='relative'>
              <div className='flex items-center justify-between mb-2'>
                <span className='text-sm font-semibold text-white/70'>通行券</span>
                <Crown className='h-5 w-5 text-rose-300' />
              </div>
              <div className='text-2xl font-black text-white'>
                {hasPremium ? '高級版' : '免費版'}
              </div>
              <div className='mt-2 text-sm text-white/70'>
                {hasPremium ? '已解鎖全部獎勵' : '僅限普通獎勵'}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Progress Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className='rounded-3xl border border-white/20 bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-xl p-8'
        >
          <div className='mb-6 flex items-center justify-between'>
            <div>
              <h2 className='text-2xl font-black text-white'>本階段進度</h2>
              <p className='mt-1 text-sm text-white/70'>每 200 XP 即可解鎖下一個等級</p>
            </div>
            <Link
              to='/tasks'
              className='inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/20'
            >
              <Sparkles className='h-4 w-4' />
              完成任務獲取 XP
            </Link>
          </div>

          <div className='space-y-3'>
            <div className='flex items-center justify-between text-sm font-semibold'>
              <span className='text-white/80'>
                {Math.min(levelProgress, xpPerLevel).toLocaleString('zh-TW')} / {xpPerLevel.toLocaleString('zh-TW')} XP
              </span>
              <span className='text-purple-300'>{xpBarPercent}%</span>
            </div>

            <div className='relative h-4 w-full overflow-hidden rounded-full bg-white/10'>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xpBarPercent}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className='h-full rounded-full bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 shadow-lg'
              />
            </div>

            <div className='text-center text-sm text-white/70'>
              {xpBarPercent >= 100 || totalLevels === 0 ? (
                <span className='font-semibold text-emerald-400'>✓ 已達成！可領取獎勵</span>
              ) : (
                <span>還需要 <span className='font-bold text-white'>{xpToNext.toLocaleString('zh-TW')} XP</span> 解鎖下一等級</span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Premium Purchase Section */}
        {!hasPremium && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className='rounded-3xl border-2 border-yellow-400/50 bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-rose-500/20 backdrop-blur-xl p-8'
          >
            <div className='flex flex-col md:flex-row items-start md:items-center justify-between gap-6'>
              <div className='flex-1'>
                <div className='flex items-center gap-3 mb-3'>
                  <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-300 to-amber-500'>
                    <Crown className='h-6 w-6 text-purple-900' />
                  </div>
                  <h3 className='text-2xl font-black text-white'>升級至高級通行券</h3>
                </div>
                <p className='text-white/80 leading-relaxed'>
                  解鎖所有高級獎勵軌道，每個等級獲得額外 CRCRCoin，享受專屬身份展示！
                </p>
              </div>
              <button
                type='button'
                onClick={requestPurchase}
                disabled={purchaseLoading || !hydrated}
                className='whitespace-nowrap rounded-2xl bg-gradient-to-r from-yellow-300 to-amber-400 px-8 py-4 text-lg font-black text-purple-900 shadow-xl transition-all hover:shadow-2xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {purchaseLoading ? '購買中...' : `${premiumPrice.toLocaleString('zh-TW')} CRCRCoin`}
              </button>
            </div>
          </motion.div>
        )}

        {/* Rewards List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className='rounded-3xl border border-white/20 bg-black/30 backdrop-blur-xl p-8'
        >
          <div className='mb-8 flex items-center justify-between'>
            <div>
              <h2 className='text-3xl font-black text-white'>通行券獎勵</h2>
              <p className='mt-2 text-white/70'>完成任務提升等級，領取豐厚獎勵</p>
            </div>
            <div className='flex items-center gap-4 text-sm'>
              <div className='flex items-center gap-2'>
                <div className='h-3 w-3 rounded-full bg-gradient-to-br from-sky-400 to-blue-500' />
                <span className='text-white/70'>普通</span>
              </div>
              <div className='flex items-center gap-2'>
                <div className='h-3 w-3 rounded-full bg-gradient-to-br from-amber-400 to-rose-500' />
                <span className='text-white/70'>高級</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className='py-20 text-center'>
              <div className='mx-auto h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white' />
              <p className='mt-4 text-white/70'>載入中...</p>
            </div>
          ) : rewards.length === 0 ? (
            <div className='py-20 text-center text-white/70'>
              尚未設定通行券獎勵，請稍後再試。
            </div>
          ) : (
            <div className='space-y-0'>
              {rewards.map((reward, index) => renderLevelSection(reward, index))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Premium Purchase Modal */}
      <AnimatePresence>
        {showPremiumModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4'
            onClick={() => setShowPremiumModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className='w-full max-w-2xl rounded-3xl bg-gradient-to-br from-white to-purple-50 p-8 shadow-2xl'
            >
              <div className='mb-6 flex items-center justify-between'>
                <div className='flex items-center gap-4'>
                  <div className='flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500'>
                    <Crown className='h-8 w-8 text-white' />
                  </div>
                  <div>
                    <p className='text-xs font-bold uppercase tracking-wider text-purple-600'>升級提示</p>
                    <h3 className='text-3xl font-black text-gray-900'>購買高級通行券</h3>
                  </div>
                </div>
                <button
                  type='button'
                  onClick={() => setShowPremiumModal(false)}
                  className='flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200'
                >
                  ✕
                </button>
              </div>

              <p className='mb-6 text-gray-700 text-lg'>
                支付 <span className='font-black text-purple-600'>{premiumPrice.toLocaleString('zh-TW')} CRCRCoin</span> 後即可解鎖所有高級獎勵。
              </p>

              <div className='mb-8 space-y-4'>
                {PREMIUM_BENEFITS.map((benefit) => {
                  const Icon = benefit.icon
                  return (
                    <div
                      key={benefit.title}
                      className='flex gap-4 rounded-2xl border-2 border-purple-100 bg-white p-5 shadow-sm'
                    >
                      <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500'>
                        <Icon className='h-6 w-6 text-white' />
                      </div>
                      <div>
                        <p className='text-lg font-bold text-gray-900'>{benefit.title}</p>
                        <p className='mt-1 text-sm text-gray-600'>{benefit.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className='flex flex-col sm:flex-row gap-4'>
                <button
                  type='button'
                  onClick={() => setShowPremiumModal(false)}
                  className='flex-1 rounded-2xl border-2 border-gray-200 bg-white px-6 py-4 text-base font-bold text-gray-700 transition hover:bg-gray-50'
                >
                  先再考慮
                </button>
                <button
                  type='button'
                  onClick={confirmPurchase}
                  disabled={purchaseLoading}
                  className='flex-1 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 px-6 py-4 text-base font-bold text-white shadow-xl transition hover:shadow-2xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed'
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
