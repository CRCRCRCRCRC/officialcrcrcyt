import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useWebsiteAuth } from './WebsiteAuthContext'
import { coinAPI } from '../services/api'

/**
 * CRCRCoin 前端錢包（純前端）
 * - 以 localStorage 持久化
 * - 每個已登入使用者以 email 分隔錢包
 * - 取消「訪客錢包」，未登入時不再讀寫 guest 錢包，並清除舊資料
 */

const CoinContext = createContext(null)

const DEFAULT_WALLET = {
  balance: 0,
  lastClaimAt: null, // ISO string
  history: [] // { type: 'earn' | 'spend' | 'claim', amount, reason, at }
}

const STORAGE_KEY_PREFIX = 'crcrcoin_wallet_'
const ENABLE_GUEST_WALLET = false // 關閉訪客錢包，未登入不顯示/不持久化
const DAILY_REWARD_AMOUNT = 50
const DAILY_COOLDOWN_MS = 24 * 60 * 60 * 1000 // 24h

// 從伺服器取得的重置版本標記
const RESET_MARKER_KEY = 'crcrcoin_reset_version'

// 清除所有 CRCRCoin 的 localStorage 錢包
function clearAllCoinWallets() {
  try {
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith(STORAGE_KEY_PREFIX)) keysToRemove.push(k)
    }
    keysToRemove.forEach(k => localStorage.removeItem(k))
  } catch {
    // ignore
  }
}

// 與伺服器版本比對，若版本不同則清空所有錢包並寫入新版本
async function ensureRemoteReset() {
  try {
    const res = await coinAPI.getResetVersion()
    const remote = String(res.data?.version || '0')
    const current = localStorage.getItem(RESET_MARKER_KEY)
    if (remote !== current) {
      clearAllCoinWallets()
      localStorage.setItem(RESET_MARKER_KEY, remote)
    }
  } catch {
    // ignore server errors; do not block UI
  }
}

function keyForUser(user) {
  // 以 email 作為 key，無登入則預設 guest（但可被 ENABLE_GUEST_WALLET 控制是否實際使用）
  const id = (user?.email || 'guest').toLowerCase()
  return STORAGE_KEY_PREFIX + id
}

function loadWallet(storageKey) {
  if (!storageKey) return { ...DEFAULT_WALLET }
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return { ...DEFAULT_WALLET }
    const parsed = JSON.parse(raw)
    return {
      ...DEFAULT_WALLET,
      ...parsed,
      balance: Number(parsed.balance) || 0
    }
  } catch {
    return { ...DEFAULT_WALLET }
  }
}

function saveWallet(storageKey, wallet) {
  if (!storageKey) return
  try {
    localStorage.setItem(storageKey, JSON.stringify(wallet))
  } catch {
    // ignore
  }
}

export const CoinProvider = ({ children }) => {
  const { user } = useWebsiteAuth()
  const isLoggedIn = !!user

  // 未登入時若關閉訪客錢包，storageKey 為 null（不讀寫 localStorage）
  const storageKey = useMemo(
    () => (isLoggedIn ? keyForUser(user) : (ENABLE_GUEST_WALLET ? keyForUser(null) : null)),
    [user, isLoggedIn]
  )

  const [wallet, setWallet] = useState(() => (storageKey ? loadWallet(storageKey) : { ...DEFAULT_WALLET }))

  // 切換使用者或登入狀態時：先與伺服器同步重置版本，再讀取錢包
  useEffect(() => {
    let mounted = true
    ;(async () => {
      await ensureRemoteReset()
      if (mounted) {
        setWallet(storageKey ? loadWallet(storageKey) : { ...DEFAULT_WALLET })
      }
    })()
    return () => { mounted = false }
  }, [storageKey])

  // 持久化（未登入/無 storageKey 時不持久化）
  useEffect(() => {
    if (storageKey) saveWallet(storageKey, wallet)
  }, [storageKey, wallet])

  // 移除舊有的 guest 錢包，避免未登入時殘留顯示舊數據
  useEffect(() => {
    if (!isLoggedIn && !ENABLE_GUEST_WALLET) {
      try { localStorage.removeItem(STORAGE_KEY_PREFIX + 'guest') } catch {}
    }
  }, [isLoggedIn])

  // 工具：新增交易紀錄
  const pushHistory = (entry) => {
    setWallet((w) => ({
      ...w,
      history: [
        { ...entry, at: new Date().toISOString() },
        ...(w.history || [])
      ].slice(0, 200) // 保留最近 200 筆
    }))
  }

  // API：加幣（需登入）
  const addCoins = (amount, reason = '任務獎勵') => {
    if (!isLoggedIn) return { success: false, error: '請先登入' }
    const value = Math.max(0, Math.floor(Number(amount) || 0))
    if (value <= 0) return { success: false, error: '金額無效' }
    setWallet((w) => ({ ...w, balance: Math.max(0, (w.balance || 0) + value) }))
    pushHistory({ type: 'earn', amount: value, reason })
    return { success: true }
  }

  // API：扣幣（需登入）
  const spendCoins = (amount, reason = '消費') => {
    if (!isLoggedIn) return { success: false, error: '請先登入' }
    const value = Math.max(0, Math.floor(Number(amount) || 0))
    if (value <= 0) return { success: false, error: '金額無效' }
    if ((wallet.balance || 0) < value) return { success: false, error: '餘額不足' }
    setWallet((w) => ({ ...w, balance: Math.max(0, (w.balance || 0) - value) }))
    pushHistory({ type: 'spend', amount: value, reason })
    return { success: true }
  }

  // API：每日簽到（需登入）
  const claimDaily = () => {
    if (!isLoggedIn) {
      return { success: false, error: '請先登入才能簽到' }
    }
    const now = Date.now()
    const last = wallet.lastClaimAt ? new Date(wallet.lastClaimAt).getTime() : 0
    const passed = now - last
    if (passed < DAILY_COOLDOWN_MS) {
      return {
        success: false,
        error: '尚未到下次簽到時間',
        nextClaimInMs: DAILY_COOLDOWN_MS - passed
      }
    }
    const reward = DAILY_REWARD_AMOUNT
    setWallet((w) => ({
      ...w,
      balance: (w.balance || 0) + reward,
      lastClaimAt: new Date().toISOString()
    }))
    pushHistory({ type: 'claim', amount: reward, reason: '每日簽到' })
    return { success: true, amount: reward }
  }

  // 狀態：是否可簽到與剩餘時間（未登入則不可簽到）
  const lastClaimTime = wallet.lastClaimAt ? new Date(wallet.lastClaimAt).getTime() : 0
  const msSinceLastClaim = Date.now() - lastClaimTime
  const canClaimNow = isLoggedIn && (!wallet.lastClaimAt || msSinceLastClaim >= DAILY_COOLDOWN_MS)
  const nextClaimInMs = isLoggedIn ? (canClaimNow ? 0 : Math.max(0, DAILY_COOLDOWN_MS - msSinceLastClaim)) : 0

  const value = {
    isLoggedIn,
    balance: wallet.balance || 0,
    lastClaimAt: wallet.lastClaimAt,
    history: wallet.history || [],
    addCoins,
    spendCoins,
    claimDaily,
    canClaimNow,
    nextClaimInMs
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