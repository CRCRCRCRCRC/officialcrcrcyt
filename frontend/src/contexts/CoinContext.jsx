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

const DEFAULT_WALLET = {
  balance: 0,
  lastClaimAt: null, // ISO string
  history: [] // { type: 'earn' | 'spend' | 'claim', amount, reason, at }
}

const DAILY_COOLDOWN_MS = 24 * 60 * 60 * 1000 // 24h
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
    // ignore
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

  // 封裝：以伺服器回傳值更新狀態/快取/廣播
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

  // 取得伺服器最新錢包與歷史
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
      // 將伺服器計算的冷卻時間帶入，避免本機時鐘誤差造成「可按但被拒」
      {
        const serverMs = Number(wRes?.data?.nextClaimInMs) || 0
        if (serverMs > 0) {
          const until = Date.now() + serverMs
          setOverrideNextClaimUntil(until)
          setServerNextUntil(until)
        } else {
          setOverrideNextClaimUntil(null)
          setServerNextUntil(null)
        }
      }
    } catch (e) {
      // 失敗則保留快取，不阻塞 UI
    } finally {
      setHydrated(true)
      refreshingRef.current = false
    }
  }

  // 初始化 BroadcastChannel（同分頁間同步）
  useEffect(() => {
    const bc = new BroadcastChannel('crcrcoin')
    bcRef.current = bc
    bc.onmessage = (ev) => {
      const msg = ev?.data
      if (!msg || msg.type !== 'wallet:update') return
      if (msg.userKey !== userKey) return
      setWallet(msg.wallet)
      if (userKey) saveCache(userKey, msg.wallet)
    }
    return () => {
      try { bc.close() } catch {}
      bcRef.current = null
    }
  }, [userKey])

  // 登入或使用者鍵變更時：先用快取填充，再拉取伺服器
  useEffect(() => {
    setHydrated(false)
    setWallet(userKey ? loadCache(userKey) : { ...DEFAULT_WALLET })
    refreshWallet()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userKey, isLoggedIn])

  // 在頁籤回到前景或跨分頁登入狀態變更時，嘗試刷新
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

  // 動作：加幣（僅 admin）
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

  // 動作：扣幣
  const spendCoins = async (amount, reason = '消費') => {
    if (!isLoggedIn) return { success: false, error: '請先登入' }
    const value = Math.max(0, Math.floor(Number(amount) || 0))
    if (value <= 0) return { success: false, error: '金額無效' }
    try {
      const res = await coinAPI.spend(value, reason)
      const newWallet = res?.data?.wallet
      if (newWallet) {
        // 伺服器不回傳歷史在此端同步扣款歷史以提升即時性（非必要）
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

  // 動作：每日簽到（先以伺服器冷卻判斷一次，再送出簽到，避免本機時鐘誤差）
  const claimDaily = async () => {
    if (!isLoggedIn) return { success: false, error: '請先登入才能簽到' }
    try {
      // 先向伺服器確認冷卻
      const wRes = await coinAPI.getWallet()
      const preMs = Number(wRes?.data?.nextClaimInMs) || 0
      if (preMs > 0) {
        const until = Date.now() + preMs
        setOverrideNextClaimUntil(until)
        setServerNextUntil(until)
        return { success: false, error: '尚未到下次簽到時間', nextClaimInMs: preMs }
      }

      // 再進行簽到
      const res = await coinAPI.claimDaily()
      const newWallet = res?.data?.wallet
      const amount = Number(res?.data?.amount) || 0
      if (newWallet) {
        const newHist = [
          { type: 'claim', amount, reason: '每日簽到', at: new Date().toISOString() },
          ...(wallet.history || [])
        ].slice(0, 50)
        setFromServer(newWallet, newHist)
        // 成功後立即套用 24h 冷卻，避免短暫「可按」狀態
        const until = Date.now() + DAILY_COOLDOWN_MS
        setOverrideNextClaimUntil(until)
        setServerNextUntil(until)
      }
      return { success: true, amount }
    } catch (e) {
      const nextClaimInMs = Number(e?.response?.data?.nextClaimInMs) || 0
      if (nextClaimInMs > 0) {
        const until = Date.now() + nextClaimInMs
        setOverrideNextClaimUntil(until)
        setServerNextUntil(until)
      }
      return {
        success: false,
        error: e?.response?.data?.error || '尚未到下次簽到時間',
        nextClaimInMs
      }
    }
  }

  // 狀態：是否可簽到與剩餘時間（以伺服器時間為準，若伺服器回傳冷卻則臨時覆蓋）
  // 取 wallet.lastClaimAt 與歷史中最近一次 claim 的最大時間，以避免某些情況只更新其中一處造成誤判
  const claimHistMax = (() => {
    const list = Array.isArray(wallet.history) ? wallet.history : []
    const ts = list
      .filter(h => h?.type === 'claim' && h?.at)
      .map(h => new Date(h.at).getTime())
      .filter(n => !Number.isNaN(n))
    return ts.length ? Math.max(...ts) : 0
  })()
  const lastClaimTime = wallet.lastClaimAt ? new Date(wallet.lastClaimAt).getTime() : 0
  const lastEffective = Math.max(lastClaimTime || 0, claimHistMax || 0)
  const baseNext = lastEffective ? (lastEffective + DAILY_COOLDOWN_MS - Date.now()) : 0
  const overrideLeft = overrideNextClaimUntil ? (overrideNextClaimUntil - Date.now()) : null
  const serverLeft = serverNextUntil ? (serverNextUntil - Date.now()) : null
  const effectiveNext = Math.max(
    0,
    Math.max(
      baseNext,
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