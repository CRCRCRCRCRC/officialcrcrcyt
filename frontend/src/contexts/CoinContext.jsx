import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useWebsiteAuth } from './WebsiteAuthContext'
import { coinAPI } from '../services/api'

/**
 * CRCRCoin（伺服器為單一真相）
 * - 登入後從伺服器取錢包、交易紀錄，所有加/扣/簽到都走後端
 * - localStorage 僅作為快取，避免剛載入時顯示 0 的閃爍
 * - 支援多分頁/視窗透過 BroadcastChannel 同步
 * - 跨裝置依賴伺服器持久化，自動一致
 */

const CoinContext = createContext(null)

const DAY_MS = 24 * 60 * 60 * 1000
const TAIPEI_OFFSET_MS = 8 * 60 * 60 * 1000

const toTimestamp = (value) => {
  if (!value) return null
  try {
    if (value instanceof Date) {
      const ts = value.getTime()
      return Number.isFinite(ts) ? ts : null
    }
    const ts = new Date(value).getTime()
    return Number.isFinite(ts) ? ts : null
  } catch {
    return null
  }
}

const getNextTaipeiMidnightTimestamp = (timestamp) => {
  if (timestamp === null || timestamp === undefined) return null
  const ts = Number(timestamp)
  if (!Number.isFinite(ts)) return null
  const nextDay = Math.floor((ts + TAIPEI_OFFSET_MS) / DAY_MS) + 1
  return nextDay * DAY_MS - TAIPEI_OFFSET_MS
}

const DEFAULT_WALLET = {
  balance: 0,
  lastClaimAt: null,
  history: []
}

const CACHE_PREFIX = 'crcrcoin_cache_'

function cacheKeyForUser(user) {
  if (!user) return null
  if (user.email) return CACHE_PREFIX + `email:${String(user.email).toLowerCase()}`
  if (user.id !== undefined && user.id !== null) return CACHE_PREFIX + `id:${String(user.id)}`
  return null
}

function loadCache(cacheKey) {
  if (!cacheKey) return { ...DEFAULT_WALLET }
  try {
    const raw = localStorage.getItem(cacheKey)
    if (!raw) return { ...DEFAULT_WALLET }
    const obj = JSON.parse(raw)
    return {
      balance: Number(obj?.balance) || 0,
      lastClaimAt: obj?.lastClaimAt || null,
      history: Array.isArray(obj?.history) ? obj.history : []
    }
  } catch {
    return { ...DEFAULT_WALLET }
  }
}

function saveCache(cacheKey, wallet) {
  if (!cacheKey) return
  try {
    const toSave = {
      balance: Number(wallet?.balance) || 0,
      lastClaimAt: wallet?.lastClaimAt || null,
      history: Array.isArray(wallet?.history) ? wallet.history.slice(0, 50) : []
    }
    localStorage.setItem(cacheKey, JSON.stringify(toSave))
  } catch {
  }
}

export const CoinProvider = ({ children }) => {
  const { user, token } = useWebsiteAuth()
  const isLoggedIn = !!user && !!token

  const userKey = useMemo(() => (isLoggedIn ? cacheKeyForUser(user) : null), [isLoggedIn, user])
  const [wallet, setWallet] = useState(() => (userKey ? loadCache(userKey) : { ...DEFAULT_WALLET }))
  const [hydrated, setHydrated] = useState(false)

  const bcRef = useRef(null)
  const refreshingRef = useRef(false)
  const [overrideNextClaimUntil, setOverrideNextClaimUntil] = useState(null)
  const [serverNextUntil, setServerNextUntil] = useState(null)

  const scheduleNextClaimFromMs = (ms) => {
    if (ms > 0) {
      const until = Date.now() + ms
      setOverrideNextClaimUntil(until)
      setServerNextUntil(until)
    } else {
      setOverrideNextClaimUntil(null)
      setServerNextUntil(null)
    }
  }

  const scheduleNextClaimFromLastClaim = (iso) => {
    const lastTs = toTimestamp(iso)
    if (lastTs !== null) {
      const nextMidnight = getNextTaipeiMidnightTimestamp(lastTs)
      if (nextMidnight !== null) {
        setOverrideNextClaimUntil(nextMidnight)
        setServerNextUntil(nextMidnight)
        return
      }
    }
    setOverrideNextClaimUntil(null)
    setServerNextUntil(null)
  }

  const setFromServer = (serverWallet, history) => {
    const merged = {
      balance: Number(serverWallet?.balance) || 0,
      lastClaimAt: serverWallet?.lastClaimAt || null,
      history: Array.isArray(history) ? history : (wallet.history || [])
    }
    setWallet(merged)
    if (userKey) saveCache(userKey, merged)
    if (bcRef.current) {
      bcRef.current.postMessage({ type: 'wallet:update', userKey, wallet: merged })
    }
  }

  const refreshWallet = async () => {
    if (!isLoggedIn) {
      setWallet({ ...DEFAULT_WALLET })
      setHydrated(true)
      return
    }
    if (refreshingRef.current) return
    refreshingRef.current = true
    try {
      const [wRes, hRes] = await Promise.all([
        coinAPI.getWallet(),
        coinAPI.getHistory(50)
      ])
      const w = wRes?.data?.wallet
      const h = hRes?.data?.history || []
      setFromServer(w, h)
      {
        const serverMs = Number(wRes?.data?.nextClaimInMs) || 0
        scheduleNextClaimFromMs(serverMs)
      }
    } catch (e) {
    } finally {
      setHydrated(true)
      refreshingRef.current = false
    }
  }

  useEffect(() => {
    const bc = new BroadcastChannel('crcrcoin')
    bcRef.current = bc
    bc.onmessage = (ev) => {
      const msg = ev?.data
      if (!msg || msg.type !== 'wallet:update') return
      if (msg.userKey !== userKey) return
      setWallet(msg.wallet)
      if (userKey) saveCache(userKey, msg.wallet)
      scheduleNextClaimFromLastClaim(msg.wallet?.lastClaimAt)
    }
    return () => {
      try { bc.close() } catch {}
      bcRef.current = null
    }
  }, [userKey])

  useEffect(() => {
    setHydrated(false)
    const initialWallet = userKey ? loadCache(userKey) : { ...DEFAULT_WALLET }
    setWallet(initialWallet)
    scheduleNextClaimFromLastClaim(initialWallet.lastClaimAt)
    refreshWallet()
  }, [userKey, isLoggedIn])

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') refreshWallet()
    }
    const onStorage = (e) => {
      if (e.key === 'website_token' || e.key === 'website_user') {
        refreshWallet()
      }
    }
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('storage', onStorage)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('storage', onStorage)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, userKey])

  const addCoins = async (amount, reason = '任務獎勵') => {
    if (!isLoggedIn) return { success: false, error: '請先登入' }
    const value = Math.max(0, Math.floor(Number(amount) || 0))
    if (value <= 0) return { success: false, error: '金額無效' }
    try {
      const res = await coinAPI.earn(value, reason)
      const newWallet = res?.data?.wallet
      if (newWallet) setFromServer(newWallet, wallet.history)
      return { success: true }
    } catch (e) {
      return { success: false, error: e?.response?.data?.error || '加幣失敗' }
    }
  }

  const spendCoins = async (amount, reason = '消費') => {
    if (!isLoggedIn) return { success: false, error: '請先登入' }
    const value = Math.max(0, Math.floor(Number(amount) || 0))
    if (value <= 0) return { success: false, error: '金額無效' }
    try {
      const res = await coinAPI.spend(value, reason)
      const newWallet = res?.data?.wallet
      if (newWallet) {
        const newHist = [
          { type: 'spend', amount: value, reason, at: new Date().toISOString() },
          ...(wallet.history || [])
        ].slice(0, 50)
        setFromServer(newWallet, newHist)
      }
      return { success: true }
    } catch (e) {
      return { success: false, error: e?.response?.data?.error || '扣款失敗' }
    }
  }

  const claimDaily = async () => {
    if (!isLoggedIn) return { success: false, error: '請先登入才能簽到' }
    try {
      const res = await coinAPI.claimDaily()
      const newWallet = res?.data?.wallet
      const amount = Number(res?.data?.amount) || 0
      if (newWallet) {
        const newHist = [
          { type: 'claim', amount, reason: '每日簽到', at: new Date().toISOString() },
          ...(wallet.history || [])
        ].slice(0, 50)
        setFromServer(newWallet, newHist)
      }
      if (newWallet?.lastClaimAt) {
        scheduleNextClaimFromLastClaim(newWallet.lastClaimAt)
      } else {
        scheduleNextClaimFromMs(0)
      }
      return { success: true, amount }
    } catch (e) {
      const nextClaimInMs = Number(e?.response?.data?.nextClaimInMs) || 0
      scheduleNextClaimFromMs(nextClaimInMs)
      return {
        success: false,
        error: e?.response?.data?.error || '尚未到下次簽到時間',
        nextClaimInMs
      }
    }
  }

  const overrideLeft = overrideNextClaimUntil ? (overrideNextClaimUntil - Date.now()) : null
  const serverLeft = serverNextUntil ? (serverNextUntil - Date.now()) : null
  const effectiveNext = Math.max(
    0,
    Math.max(
      overrideLeft !== null ? overrideLeft : 0,
      serverLeft !== null ? serverLeft : 0
    )
  )
  const canClaimNow = isLoggedIn && hydrated && effectiveNext <= 0
  const nextClaimInMs = isLoggedIn ? effectiveNext : 0

  const value = {
    isLoggedIn,
    hydrated,
    balance: wallet.balance || 0,
    lastClaimAt: wallet.lastClaimAt,
    history: wallet.history || [],
    addCoins,
    spendCoins,
    claimDaily,
    canClaimNow,
    nextClaimInMs,
    refreshWallet
  }

  return (
    <CoinContext.Provider value={value}>{children}</CoinContext.Provider>
  )
}

export const useCoin = () => {
  const ctx = useContext(CoinContext)
  if (!ctx) throw new Error('useCoin must be used within CoinProvider')
  return ctx
}
