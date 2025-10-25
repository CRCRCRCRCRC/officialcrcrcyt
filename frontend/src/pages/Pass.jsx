import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowLeft, Crown, Sparkles, Coins, Lock, CheckCircle2, BadgeCheck } from 'lucide-react'
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
    title: '全線獎勵解鎖',
    description: '立即開啟所有高級獎勵軌，升級即可領取。'
  },
  {
    title: '額外 CRCRCoin',
    description: '每個等級都比免費軌多出 50 至 150 CRCRCoin。'
  },
  {
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
  const xpPerLevel = Number(progress?.xpPerLevel) || 500
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

  const renderTierCard = (tier, reward, stageUnlocked) => {
    const isPremiumTier = tier === 'premium'
    const info = isPremiumTier ? reward.premium || {} : reward.free || {}
    const coins = Number(info?.coins) || 0
    const claimedSet = isPremiumTier ? claimedPremiumSet : claimedFreeSet
    const claimed = claimedSet.has(reward.id)
    const requiredXp = Number(reward.requiredXp ?? (reward.level * xpPerLevel))
    const lockedByPremium = isPremiumTier && !hasPremium
    const lockedByXp = !stageUnlocked
    const locked = lockedByPremium || lockedByXp
    const processing = claimingKey === `${tier}:${reward.id}`
    const cardColor = isPremiumTier
      ? 'from-[#a855f7]/90 via-[#7c3aed]/90 to-[#db2777]/90 border-[#f5d0ff]/40'
      : 'from-[#38bdf8]/90 via-[#2563eb]/90 to-[#4c1d95]/90 border-[#bae6fd]/40'
    const buttonEnabledClass = isPremiumTier
      ? 'bg-white text-purple-700 hover:bg-rose-50'
      : 'bg-white text-sky-700 hover:bg-blue-50'

    return (
      <div
        className={`relative flex h-full flex-col justify-between overflow-hidden rounded-[28px] border-2 p-5 shadow-lg transition-transform duration-200 ${cardColor} ${
          claimed ? 'ring-4 ring-emerald-300/80' : !locked ? 'shadow-[0_20px_45px_rgba(255,255,255,0.15)]' : ''
        } ${locked && !claimed ? 'opacity-80' : 'opacity-100'}`}
      >
        <div className='pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-white/20 blur-2xl' />
        <div className='pointer-events-none absolute -left-16 bottom-0 h-24 w-24 rounded-full bg-white/10 blur-3xl' />
        <div className='relative flex items-start justify-between'>
          <div>
            <span className='text-[11px] font-semibold uppercase tracking-[0.35em] text-white/70'>
              {isPremiumTier ? '高級獎勵' : '普通獎勵'}
            </span>
            <h4 className='mt-3 text-2xl font-black leading-none text-white'>
              {coins > 0 ? `${coins.toLocaleString('zh-TW')} CRCRCoin` : '特別獎勵'}
            </h4>
            {!locked && info?.description && (
              <p className='mt-2 text-xs text-white/80'>{info.description}</p>
            )}
          </div>
          <div className='flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/20 text-white'>
            {claimed ? <CheckCircle2 className='h-5 w-5' /> : locked ? <Lock className='h-5 w-5' /> : <Coins className='h-5 w-5' />}
          </div>
        </div>
        <div className='relative mt-6 flex flex-col gap-2'>
          <button
            type='button'
            onClick={() => handleClaim(tier, reward)}
            disabled={locked || claimed || processing}
            className={`w-full rounded-2xl px-4 py-2 text-sm font-semibold transition-all ${
              claimed
                ? 'bg-white/25 text-white/70 cursor-not-allowed'
                : locked
                  ? 'bg-white/15 text-white/60 cursor-not-allowed'
                  : buttonEnabledClass
            }`}
          >
            {claimed ? '已領取' : processing ? '領取中...' : locked ? '尚未解鎖' : '領取獎勵'}
          </button>
        </div>
      </div>
    )
  }

  const renderRewardStage = (reward, index) => {
    const requiredXp = Number(reward.requiredXp ?? (reward.level * xpPerLevel))
    const stageUnlocked = xp >= requiredXp
    const stageComplete = reward.level <= completedLevels
    const highlightLevel = totalLevels === 0 ? 0 : Math.min(totalLevels, completedLevels >= totalLevels ? totalLevels : completedLevels + 1)
    const isCurrentStage = reward.level === highlightLevel && !stageComplete

    return (
      <motion.div
        key={reward.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.035 }}
        className='relative flex w-[220px] shrink-0 flex-col items-center gap-6 pb-10 pt-4'
      >
        <div className='relative z-20 w-full'>{renderTierCard('premium', reward, stageUnlocked)}</div>
        <div
          className={`relative z-30 flex h-16 w-16 items-center justify-center rounded-full border-4 text-xl font-black shadow-xl transition-all ${
            stageComplete
              ? 'border-amber-300 bg-gradient-to-br from-yellow-200 via-amber-300 to-orange-400 text-purple-900'
              : isCurrentStage
                ? 'border-yellow-200 bg-white text-purple-700 shadow-[0_10px_30px_rgba(252,211,77,0.45)]'
                : 'border-white/20 bg-white/10 text-white/80'
          }`}
        >
          {reward.level}
          {stageComplete && (
            <CheckCircle2 className='absolute -top-2 -right-2 h-6 w-6 text-emerald-300 drop-shadow-[0_0_10px_rgba(16,185,129,0.6)]' />
          )}
        </div>
        <div className='relative z-20 w-full'>{renderTierCard('free', reward, stageUnlocked)}</div>
      </motion.div>
    )
  }

  const trackLine = (
    <div className='relative'>
      <div className='flex gap-8 overflow-x-auto pb-8 pt-16'>
        {rewards.map((reward, index) => renderRewardStage(reward, index))}
      </div>
    </div>
  )

  if (!isLoggedIn) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50'>
        <div className='text-center'>
          <div className='mb-4 mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500'>
            <Crown className='h-8 w-8 text-white' />
          </div>
          <h2 className='mb-2 text-2xl font-bold text-gray-900'>請先登入</h2>
          <p className='mb-6 text-gray-600'>登入後即可管理並領取通行券獎勵</p>
          <Link
            to='/'
            className='inline-flex items-center rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-xl'
          >
            <ArrowLeft className='mr-2 h-5 w-5' />
            返回首頁
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-[#200038] via-[#3c0072] to-[#060011] text-white'>
      <div className='border-b border-white/10 bg-white/5 backdrop-blur-xl'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between py-6'>
            <Link to='/wallet' className='flex items-center text-white/80 transition-colors hover:text-white'>
              <ArrowLeft className='mr-2 h-5 w-5' />
              回到錢包
            </Link>
            <h1 className='text-3xl font-bold tracking-wide'>CRCRC 通行券</h1>
            <div className='w-16' />
          </div>
        </div>
      </div>

      <div className='mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6 lg:px-8'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='grid gap-6 xl:grid-cols-[340px,1fr] xl:items-stretch'
        >
          <div className='relative overflow-hidden rounded-[32px] border border-white/15 bg-gradient-to-b from-[#762afb] via-[#9243ff] to-[#ff6ec7] p-8 shadow-[0_35px_80px_rgba(14,0,55,0.45)]'>
            <div className='pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-white/20 blur-3xl' />
            <div className='pointer-events-none absolute left-10 top-24 h-20 w-20 rounded-full bg-white/15 blur-2xl' />
            <div className='flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.4em] text-white/70'>
              <span>CRCRC PASS</span>
              <span>{hasPremium ? 'PLUS 已啟用' : 'FREE TRACK'}</span>
            </div>
            <div className='mt-6 flex items-center gap-4'>
              <div className='flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-white shadow-lg'>
                <Sparkles className='h-9 w-9' />
              </div>
              <div>
                <h2 className='text-3xl font-black leading-tight'>CRCRC 通行券</h2>
                <p className='mt-2 text-sm text-white/80'>
                  累積任務 XP 解鎖 {totalLevels || 0} 階段獎勵，高級通行券可領取雙重回饋。
                </p>
              </div>
            </div>
            <div className='mt-8 space-y-4'>
              <div className='flex items-center justify-between text-xs font-semibold tracking-widest text-white/70 uppercase'>
                <span>等級 {currentLevel} / {totalLevels || 0}</span>
                <span>{xp.toLocaleString('zh-TW')} XP</span>
              </div>
              <div className='h-3 w-full overflow-hidden rounded-full bg-white/20'>
                <div
                  className='h-full rounded-full bg-gradient-to-r from-[#ffe55c] via-[#ff9f1c] to-[#ff3864]'
                  style={{ width: `${totalLevels === 0 ? 0 : xpBarPercent}%` }}
                />
              </div>
              <div className='flex items-center justify-between text-[11px] font-semibold uppercase tracking-widest text-white/70'>
                <span>本階段 {Math.min(levelProgress, xpPerLevel).toLocaleString('zh-TW')} / {xpPerLevel.toLocaleString('zh-TW')} XP</span>
                <span>{xpBarPercent >= 100 || totalLevels === 0 ? '已達成' : `距離下一階段 ${xpToNext.toLocaleString('zh-TW')} XP`}</span>
              </div>
            </div>
            <div className='mt-8 space-y-3'>
              {hasPremium ? (
                <div className='inline-flex items-center gap-2 rounded-full bg-white/25 px-4 py-2 text-sm font-semibold text-white shadow-inner'>
                  <BadgeCheck className='h-4 w-4' />
                  高級通行券已啟用
                </div>
              ) : (
                <button
                  type='button'
                  onClick={requestPurchase}
                  disabled={purchaseLoading || !hydrated}
                  className='inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-purple-700 shadow-lg transition-all hover:bg-yellow-50 disabled:cursor-not-allowed disabled:opacity-80'
                >
                  <Crown className='h-5 w-5' />
                  {purchaseLoading ? '購買中...' : `購買高級通行券（${premiumPrice.toLocaleString('zh-TW')} CRCRCoin）`}
                </button>
              )}
              <p className='text-xs text-white/70'>
                目前餘額：<span className='font-semibold text-white'>{formattedBalance}</span> CRCRCoin
              </p>
            </div>
          </div>

          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            <div className='relative overflow-hidden rounded-[28px] border border-white/12 bg-white/10 p-6 shadow-lg backdrop-blur'>
              <div className='flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.35em] text-white/70'>
                <span>錢包餘額</span>
                <Coins className='h-5 w-5 text-white/70' />
              </div>
              <div className='mt-4 text-3xl font-black text-white'>{formattedBalance}</div>
              <p className='text-xs text-white/60'>CRCRCoin</p>
            </div>
            <div className='relative overflow-hidden rounded-[28px] border border-white/12 bg-white/10 p-6 shadow-lg backdrop-blur'>
              <div className='flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.35em] text-white/70'>
                <span>完成階段</span>
                <Sparkles className='h-5 w-5 text-white/70' />
              </div>
              <div className='mt-4 text-3xl font-black text-white'>{completedLevels}</div>
              <p className='text-xs text-white/60'>共 {totalLevels || 0} 階段</p>
            </div>
            <div className='relative overflow-hidden rounded-[28px] border border-white/12 bg-white/10 p-6 shadow-lg backdrop-blur'>
              <div className='flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.35em] text-white/70'>
                <span>獎勵進度</span>
                <Crown className='h-5 w-5 text-white/70' />
              </div>
              <div className='mt-4 space-y-4'>
                <div>
                  <div className='flex items-center justify-between text-sm text-white/80'>
                    <span className='font-semibold'>普通</span>
                    <span>{totalClaimedFree} / {totalLevels || 0}</span>
                  </div>
                  <div className='mt-2 h-2 w-full rounded-full bg-white/15'>
                    <div
                      className='h-full rounded-full bg-gradient-to-r from-[#38bdf8] to-[#2563eb]'
                      style={{ width: `${totalLevels ? Math.min(100, (totalClaimedFree / totalLevels) * 100) : 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className='flex items-center justify-between text-sm text-white/80'>
                    <span className='font-semibold'>高級</span>
                    <span>{hasPremium ? `${totalClaimedPremium} / ${totalLevels || 0}` : '尚未購買'}</span>
                  </div>
                  <div className='mt-2 h-2 w-full rounded-full bg-white/15'>
                    <div
                      className={`${hasPremium ? 'bg-gradient-to-r from-[#f97316] to-[#ec4899]' : 'bg-white/25'} h-full rounded-full`}
                      style={{ width: `${hasPremium && totalLevels ? Math.min(100, (totalClaimedPremium / totalLevels) * 100) : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {loading ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='rounded-[32px] border border-white/10 bg-white/10 py-20 text-center text-white/70 shadow-lg backdrop-blur'
          >
            載入通行券獎勵中...
          </motion.div>
        ) : rewards.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='rounded-[32px] border border-white/10 bg-white/10 py-20 text-center text-white/70 shadow-lg backdrop-blur'
          >
            尚未設定通行券獎勵，請稍後再試。
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='overflow-hidden rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl'
          >
            <div className='mb-4 flex items-center justify-between text-sm font-semibold uppercase tracking-[0.3em] text-white/70'>
              <span>高級獎勵</span>
              <span>普通獎勵</span>
            </div>
            {trackLine}
          </motion.div>
        )}
      </div>
      {showPremiumModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-6 py-12 backdrop-blur-sm'>
          <div className='w-full max-w-lg rounded-3xl bg-white p-6 text-slate-900 shadow-2xl'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs font-semibold uppercase tracking-[0.35em] text-slate-400'>升級提示</p>
                <h3 className='mt-2 text-2xl font-black text-slate-900'>購買高級通行券</h3>
              </div>
              <button
                type='button'
                onClick={() => setShowPremiumModal(false)}
                className='rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600'
              >
                ✕
              </button>
            </div>
            <p className='mt-3 text-sm text-slate-600'>
              支付 <span className='font-semibold text-slate-900'>{premiumPrice.toLocaleString('zh-TW')} CRCRCoin</span> 後即可解鎖所有 Premium 獎勵。
            </p>
            <div className='mt-6 space-y-4'>
              {PREMIUM_BENEFITS.map((benefit) => (
                <div key={benefit.title} className='flex gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3'>
                  <div className='mt-1 h-2 w-2 rounded-full bg-gradient-to-r from-indigo-500 to-rose-500' />
                  <div>
                    <p className='text-sm font-semibold text-slate-900'>{benefit.title}</p>
                    <p className='text-xs text-slate-600'>{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className='mt-8 flex flex-col gap-3 sm:flex-row'>
              <button
                type='button'
                onClick={() => setShowPremiumModal(false)}
                className='w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50'
              >
                先再考慮
              </button>
              <button
                type='button'
                onClick={confirmPurchase}
                disabled={purchaseLoading}
                className='w-full rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70'
              >
                {purchaseLoading ? '購買中…' : '確認購買'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Pass
