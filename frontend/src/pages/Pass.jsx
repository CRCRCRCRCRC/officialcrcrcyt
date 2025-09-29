import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowLeft, Crown, Sparkles, Shield, Coins, Lock } from 'lucide-react'
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

const Pass = () => {
  const { isLoggedIn, hydrated, balance, refreshWallet } = useCoin()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [purchaseLoading, setPurchaseLoading] = useState(false)
  const [claimingKey, setClaimingKey] = useState(null)

  const hasPremium = !!data?.state?.hasPremium
  const rewards = data?.config?.rewards ?? []
  const premiumPrice = Number(data?.config?.premiumPrice) || 0

  const formattedBalance = useMemo(() => {
    try {
      return Number(balance || 0).toLocaleString('zh-TW')
    } catch {
      return String(balance || 0)
    }
  }, [balance])

  const loadPass = async () => {
    if (!isLoggedIn) {
      setData(null)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await coinAPI.getPass()
      if (res?.data) {
        setData({
          config: res.data.config,
          state: sanitizeState(res.data.state),
          wallet: res.data.wallet
        })
      }
    } catch (error) {
      console.error('載入通行券資料失敗:', error)
      toast.error(error?.response?.data?.error || '無法載入通行券資料')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPass()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn])

  const requireLogin = () => {
    toast.error('請先登入才能使用通行券')
  }

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
      const nextState = sanitizeState(res?.data?.state || data?.state)
      setData((prev) => ({
        config: prev?.config || data?.config,
        state: nextState,
        wallet: res?.data?.wallet || prev?.wallet
      }))
      await refreshWallet()
    } catch (error) {
      console.error('購買通行券失敗:', error)
      toast.error(error?.response?.data?.error || '購買失敗，請稍後再試')
    } finally {
      setPurchaseLoading(false)
    }
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
      const nextState = sanitizeState(res?.data?.state || data?.state)
      setData((prev) => ({
        config: prev?.config || data?.config,
        state: nextState,
        wallet: res?.data?.wallet || prev?.wallet
      }))
      await refreshWallet()
    } catch (error) {
      console.error('領取通行券獎勵失敗:', error)
      toast.error(error?.response?.data?.error || '領取失敗，請稍後再試')
    } finally {
      setClaimingKey(null)
    }
  }

  const renderTierCard = (reward, tier) => {
    const tierInfo = tier === 'premium' ? reward.premium : reward.free
    const isPremiumTier = tier === 'premium'
    const state = sanitizeState(data?.state || {})
    const claimedFree = new Set(state.claimedFree)
    const claimedPremium = new Set(state.claimedPremium)
    const claimed = isPremiumTier ? claimedPremium.has(reward.id) : claimedFree.has(reward.id)
    const locked = isPremiumTier && !state.hasPremium
    const coins = Number(tierInfo?.coins) || 0
    const isProcessing = claimingKey === `${tier}:${reward.id}`

    return (
      <div
        key={`${reward.id}-${tier}`}
        className={`rounded-2xl border p-5 transition-all backdrop-blur-sm ${
          isPremiumTier
            ? 'border-purple-200/60 bg-gradient-to-br from-purple-50/80 to-pink-50/80'
            : 'border-blue-200/60 bg-gradient-to-br from-blue-50/80 to-sky-50/80'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-xl flex items-center justify-center text-white ${
                isPremiumTier ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-gradient-to-br from-blue-500 to-sky-500'
              }`}
            >
              {isPremiumTier ? <Crown className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">{isPremiumTier ? '高級獎勵' : '普通獎勵'}</p>
              <p className="text-xs text-gray-500">{tierInfo?.description || (coins > 0 ? `獲得 ${coins} CRCRCoin` : '通行券專屬獎勵')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Coins className={coins > 0 ? 'w-4 h-4 text-amber-500' : 'w-4 h-4 text-gray-400'} />
            <span>{coins > 0 ? coins.toLocaleString('zh-TW') : '--'}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleClaim(tier, reward)}
          disabled={locked || claimed || isProcessing}
          className={`mt-4 w-full rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
            claimed
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : locked
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed flex items-center justify-center gap-2'
                : isPremiumTier
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl'
                  : 'bg-gradient-to-r from-blue-500 to-sky-500 text-white hover:from-blue-600 hover:to-sky-600 shadow-lg hover:shadow-xl'
          }`}
        >
          {claimed
            ? '已領取'
            : locked
              ? (<span className="flex items-center gap-1"><Lock className="w-4 h-4" />需購買高級</span>)
              : isProcessing
                ? '領取中...'
                : '領取獎勵'}
        </button>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">請先登入</h2>
          <p className="text-gray-600 mb-6">登入後即可管理並領取通行券獎勵</p>
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
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
      <div className="bg-white/95 backdrop-blur-xl border-b border-white border-opacity-20 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <Link
              to="/wallet"
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              回到錢包
            </Link>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
              CRCRC 通行券
            </h1>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl border border-white/25 rounded-3xl shadow-xl p-6 sm:p-8"
        >
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg">
                <Sparkles className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-wider text-purple-500 font-semibold">本季資訊</p>
                <h2 className="text-2xl font-bold text-gray-900">通行券獎勵任務</h2>
                <p className="text-sm text-gray-600">完成任務即可領取普通獎勵；購買高級通行券可解鎖全部獎勵。</p>
              </div>
            </div>
            <div className="rounded-2xl border border-purple-200 bg-purple-50/80 px-6 py-4 text-center shadow-inner">
              <p className="text-xs font-semibold text-purple-500">目前餘額</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{formattedBalance} CRCRCoin</p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Crown className={`w-4 h-4 ${hasPremium ? 'text-purple-500' : 'text-gray-400'}`} />
                {hasPremium ? '已擁有高級通行券' : '尚未購買高級通行券'}
              </div>
              <p className="text-xs text-gray-500">購買一次即可領取本季所有普通與高級獎勵。</p>
            </div>
            <button
              type="button"
              onClick={handlePurchase}
              disabled={purchaseLoading || hasPremium || !hydrated}
              className={`inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold transition-all shadow-lg hover:shadow-xl ${
                hasPremium
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
              }`}
            >
              {hasPremium ? '已購買' : purchaseLoading ? '購買中...' : `購買高級通行券（${premiumPrice.toLocaleString('zh-TW')} CRCRCoin）`}
            </button>
          </div>
        </motion.div>

        {loading ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/70 border border-white/30 backdrop-blur-xl rounded-3xl shadow-xl p-10 text-center text-gray-500"
          >
            載入通行券獎勵中...
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {rewards.length === 0 ? (
              <div className="bg-white/70 border border-white/30 backdrop-blur-xl rounded-3xl shadow-xl p-10 text-center text-gray-500">
                尚未設定通行券獎勵，請稍後再試。
              </div>
            ) : (
              rewards.map((reward) => (
                <div key={reward.id} className="bg-white/85 border border-white/30 backdrop-blur-xl rounded-3xl shadow-xl p-6 sm:p-8">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-purple-500">LEVEL {reward.level}</p>
                      <h3 className="text-xl font-bold text-gray-900">{reward.title}</h3>
                      {reward.description && <p className="text-sm text-gray-600">{reward.description}</p>}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      <span>完成度提升獎勵</span>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {renderTierCard(reward, 'free')}
                    {renderTierCard(reward, 'premium')}
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default Pass
