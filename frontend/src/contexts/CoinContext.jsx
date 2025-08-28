import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useWebsiteAuth } from './WebsiteAuthContext'
import { coinAPI } from '../services/api'

/**
 * CRCRCoin 前端錢包（純前端）
 * - 以 localStorage 持久化
 * - 使用者錢包 key 優先採用 email，無 email 才回退 id
 * - 未登入不使用 guest 錢包（避免資料混亂）
 */

const CoinContext = createContext(null)

const DEFAULT_WALLET = {
  balance: 0,
  lastClaimAt: null, // ISO string
  history: [] // { type: 'earn' | 'spend' | 'claim', amount, reason, at }
}

const STORAGE_KEY_PREFIX = 'crcrcoin_wallet_'
const ENABLE_GUEST_WALLET = false
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
// 注意：當伺服器回傳 '0' 或空值時，代表「未設定重置」，不得清空
async function ensureRemoteReset() {
  try {
    const res = await coinAPI.getResetVersion()
    const remote = String(res.data?.version || '0')

    // '0' 代表未設定全域重置，不觸發清空；僅在本地無標記時對齊為 '0'
    if (remote === '0') {
      if (!localStorage.getItem(RESET_MARKER_KEY)) {
        localStorage.setItem(RESET_MARKER_KEY, '0')
      }
      return
    }

    const current = localStorage.getItem(RESET_MARKER_KEY) || '0'
    if (remote === current) return

    clearAllCoinWallets()
    localStorage.setItem(RESET_MARKER_KEY, remote)
  } catch {
    // ignore server errors; do not block UI
  }
}

function storageKeyForUser(user) {
  // 優先使用 email（跨資料庫最穩定），若無 email 再回退 id；未登入且允許訪客時回傳 guest。
  if (!user) {
    return ENABLE_GUEST_WALLET ? STORAGE_KEY_PREFIX + 'guest' : null
  }
  if (user.email) {
    return STORAGE_KEY_PREFIX + `email:${String(user.email).toLowerCase()}`
  }
  if (user.id !== undefined && user.id !== null) {
    return STORAGE_KEY_PREFIX + `id:${String(user.id)}`
  }
  return ENABLE_GUEST_WALLET ? STORAGE_KEY_PREFIX + 'guest' : null
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
  const initInProgressRef = useRef(false)

  // 未登入時若關閉訪客錢包，storageKey 為 null（不讀寫 localStorage）
  const storageKey = useMemo(
    () => (isLoggedIn ? storageKeyForUser(user) : (ENABLE_GUEST_WALLET ? storageKeyForUser(null) : null)),
    [user, isLoggedIn]
  )

  const [wallet, setWallet] = useState(() => (storageKey ? loadWallet(storageKey) : { ...DEFAULT_WALLET }))
  const [hydrated, setHydrated] = useState(false)

  // 主要載入流程：遠端重置比對 + 從候選鍵挑選最佳資料 + 寫入當前 key
  useEffect(() => {
    let mounted = true
    setHydrated(false)
    initInProgressRef.current = true
    ;(async () => {
      await ensureRemoteReset()

      // 未登入或無 storageKey：使用預設
      if (!storageKey) {
        if (mounted) {
          setWallet({ ...DEFAULT_WALLET })
          setHydrated(true)
        }
        return
      }

      // 準備候選鍵（優先順序：目前 key -> 舊 email 鍵 -> 舊 email: 鍵 -> 舊 id: 鍵 -> guest -> 其他所有舊鍵）
      const seen = new Set()
      const candidates = []
      const push = (k) => { if (k && !seen.has(k)) { seen.add(k); candidates.push(k) } }

      push(storageKey)

      const email = (user?.email || '').toLowerCase()
      const idVal = (user?.id !== undefined && user?.id !== null) ? String(user.id) : null
      if (email) {
        push(`${STORAGE_KEY_PREFIX}${email}`)          // 舊版（無前綴）的 email key
        push(`${STORAGE_KEY_PREFIX}email:${email}`)   // 舊版 email: 前綴
      }
      if (idVal) {
        push(`${STORAGE_KEY_PREFIX}id:${idVal}`)      // 舊版 id: 前綴
      }
      push(`${STORAGE_KEY_PREFIX}guest`)              // 舊版 guest

      // 其他所有舊鍵
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k && k.startsWith(STORAGE_KEY_PREFIX)) push(k)
      }

      // 從候選中挑選最佳（最近簽到時間 + 餘額 + 紀錄數）
      let bestRaw = null
      let bestScore = -1
      for (const k of candidates) {
        const raw = localStorage.getItem(k)
        if (!raw) continue
        try {
          const obj = JSON.parse(raw)
          const bal = Number(obj?.balance) || 0
          const ts = obj?.lastClaimAt ? new Date(obj.lastClaimAt).getTime() : 0
          const hist = Array.isArray(obj?.history) ? obj.history.length : 0
          const empty = (bal === 0 && hist === 0)
          if (empty) continue
          const score = ts + bal * 1000 + hist
          if (score > bestScore) {
            bestScore = score
            bestRaw = raw
          }
        } catch {}
      }

      if (mounted) {
        if (bestRaw) {
          // 將最佳資料寫到目前使用者的正式 key
          localStorage.setItem(storageKey, bestRaw)
          setWallet(loadWallet(storageKey))
        } else {
          // 沒有可用舊資料，照目前 key 讀取（若不存在則為預設）
          setWallet(loadWallet(storageKey))
        }
        setHydrated(true)
        initInProgressRef.current = false
      }
    })()
    return () => { mounted = false }
  }, [storageKey, user])

  // 持久化（未登入/無 storageKey 時不持久化；避免在尚未完成載入時覆寫）
  useEffect(() => {
    if (storageKey && hydrated && !initInProgressRef.current) saveWallet(storageKey, wallet)
  }, [storageKey, wallet, hydrated])

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

  // API：加幣（需登入且需已同步）
  const addCoins = (amount, reason = '任務獎勵') => {
    if (!isLoggedIn) return { success: false, error: '請先登入' }
    if (!hydrated) return { success: false, error: '資料同步中，請稍候' }
    const value = Math.max(0, Math.floor(Number(amount) || 0))
    if (value <= 0) return { success: false, error: '金額無效' }
    setWallet((w) => ({ ...w, balance: Math.max(0, (w.balance || 0) + value) }))
    pushHistory({ type: 'earn', amount: value, reason })
    return { success: true }
  }

  // API：扣幣（需登入且需已同步）
  const spendCoins = (amount, reason = '消費') => {
    if (!isLoggedIn) return { success: false, error: '請先登入' }
    if (!hydrated) return { success: false, error: '資料同步中，請稍候' }
    const value = Math.max(0, Math.floor(Number(amount) || 0))
    if (value <= 0) return { success: false, error: '金額無效' }
    if ((wallet.balance || 0) < value) return { success: false, error: '餘額不足' }
    setWallet((w) => ({ ...w, balance: Math.max(0, (w.balance || 0) - value) }))
    pushHistory({ type: 'spend', amount: value, reason })
    return { success: true }
  }

  // API：每日簽到（需登入且需已同步）
  const claimDaily = () => {
    if (!isLoggedIn) {
      return { success: false, error: '請先登入才能簽到' }
    }
    if (!hydrated) return { success: false, error: '資料同步中，請稍候' }
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

  // 狀態：是否可簽到與剩餘時間（未登入或未同步則不可簽到）
  const lastClaimTime = wallet.lastClaimAt ? new Date(wallet.lastClaimAt).getTime() : 0
  const msSinceLastClaim = Date.now() - lastClaimTime
  const canClaimNow = isLoggedIn && hydrated && (!wallet.lastClaimAt || msSinceLastClaim >= DAILY_COOLDOWN_MS)
  const nextClaimInMs = isLoggedIn ? (canClaimNow ? 0 : Math.max(0, DAILY_COOLDOWN_MS - msSinceLastClaim)) : 0

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