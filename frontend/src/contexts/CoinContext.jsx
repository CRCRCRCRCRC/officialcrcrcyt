import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useWebsiteAuth } from './WebsiteAuthContext'

/**
 * CRCRCoin 前端錢包（純前端，與後端無關）
 * - 以 localStorage 持久化，每個使用者（email）或訪客（guest）各自一份
 * - 提供加幣、扣幣、每日簽到等 API
 */

const CoinContext = createContext(null)

const DEFAULT_WALLET = {
  balance: 0,
  lastClaimAt: null, // ISO string
  history: [] // { type: 'earn' | 'spend' | 'claim', amount, reason, at }
}

const STORAGE_KEY_PREFIX = 'crcrcoin_wallet_'
const DAILY_REWARD_AMOUNT = 50
const DAILY_COOLDOWN_MS = 24 * 60 * 60 * 1000 // 24h

function keyForUser(user) {
  // 以 email 作為 key，無登入則為 guest
  const id = (user?.email || 'guest').toLowerCase()
  return STORAGE_KEY_PREFIX + id
}

function loadWallet(storageKey) {
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
  try {
    localStorage.setItem(storageKey, JSON.stringify(wallet))
  } catch {
    // ignore
  }
}

export const CoinProvider = ({ children }) => {
  const { user } = useWebsiteAuth()
  const storageKey = useMemo(() => keyForUser(user), [user])

  const [wallet, setWallet] = useState(() => loadWallet(storageKey))

  // 切換使用者時重新讀取
  useEffect(() => {
    setWallet(loadWallet(storageKey))
  }, [storageKey])

  // 持久化
  useEffect(() => {
    saveWallet(storageKey, wallet)
  }, [storageKey, wallet])

  // 工具：新增交易紀錄
  const pushHistory = (entry) => {
    setWallet((w) => ({
      ...w,
      history: [
        { ...entry, at: new Date().toISOString() },
        ...w.history
      ].slice(0, 200) // 保留最近 200 筆
    }))
  }

  // API：加幣
  const addCoins = (amount, reason = '任務獎勵') => {
    const value = Math.max(0, Math.floor(Number(amount) || 0))
    if (value <= 0) return
    setWallet((w) => ({ ...w, balance: Math.max(0, (w.balance || 0) + value) }))
    pushHistory({ type: 'earn', amount: value, reason })
  }

  // API：扣幣
  const spendCoins = (amount, reason = '消費') => {
    const value = Math.max(0, Math.floor(Number(amount) || 0))
    if (value <= 0) return { success: false, error: '金額無效' }
    if ((wallet.balance || 0) < value) return { success: false, error: '餘額不足' }
    setWallet((w) => ({ ...w, balance: Math.max(0, (w.balance || 0) - value) }))
    pushHistory({ type: 'spend', amount: value, reason })
    return { success: true }
  }

  // API：每日簽到
  const claimDaily = () => {
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

  const lastClaimTime = wallet.lastClaimAt ? new Date(wallet.lastClaimAt).getTime() : 0
  const msSinceLastClaim = Date.now() - lastClaimTime
  const canClaimNow = !wallet.lastClaimAt || msSinceLastClaim >= DAILY_COOLDOWN_MS
  const nextClaimInMs = canClaimNow ? 0 : Math.max(0, DAILY_COOLDOWN_MS - msSinceLastClaim)

  const value = {
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