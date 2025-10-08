import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useWebsiteAuth } from './WebsiteAuthContext'
import { coinAPI } from '../services/api'

/**
 * CRCRCoin（完全依賴伺服器）
 * - 所有資料都從伺服器取得，不使用 localStorage 快取
 * - 支援多分頁/視窗透過 BroadcastChannel 同步
 */

const CoinContext = createContext(null)

const DEFAULT_WALLET = {
  balance: 0,
  lastClaimAt: null,
  history: []
}

export const CoinProvider = ({ children }) => {
  const { user, token } = useWebsiteAuth()
  const isLoggedIn = !!user && !!token

  const [wallet, setWallet] = useState({ ...DEFAULT_WALLET })
  const [hydrated, setHydrated] = useState(false)
  const [nextClaimInMs, setNextClaimInMs] = useState(0)

  const bcRef = useRef(null)
  const refreshingRef = useRef(false)

  const refreshWallet = async () => {
    if (!isLoggedIn) {
      setWallet({ ...DEFAULT_WALLET })
      setNextClaimInMs(0)
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
      const serverNextMs = Number(wRes?.data?.nextClaimInMs) || 0
      
      const newWallet = {
        balance: Number(w?.balance) || 0,
        lastClaimAt: w?.lastClaimAt || null,
        history: h
      }
      
      setWallet(newWallet)
      setNextClaimInMs(serverNextMs)
      
      // 廣播給其他分頁
      if (bcRef.current) {
        bcRef.current.postMessage({ 
          type: 'wallet:update', 
          wallet: newWallet,
          nextClaimInMs: serverNextMs
        })
      }
    } catch (e) {
      console.error('刷新錢包失敗:', e)
    } finally {
      setHydrated(true)
      refreshingRef.current = false
    }
  }

  // BroadcastChannel 同步
  useEffect(() => {
    const bc = new BroadcastChannel('crcrcoin')
    bcRef.current = bc
    bc.onmessage = (ev) => {
      const msg = ev?.data
      if (!msg || msg.type !== 'wallet:update') return
      setWallet(msg.wallet)
      setNextClaimInMs(msg.nextClaimInMs || 0)
    }
    return () => {
      try { bc.close() } catch {}
      bcRef.current = null
    }
  }, [])

  // 初始載入
  useEffect(() => {
    setHydrated(false)
    setWallet({ ...DEFAULT_WALLET })
    setNextClaimInMs(0)
    refreshWallet()
  }, [isLoggedIn, user?.id])

  // 頁面可見時刷新
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') refreshWallet()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [isLoggedIn])

  const addCoins = async (amount, reason = '任務獎勵') => {
    if (!isLoggedIn) return { success: false, error: '請先登入' }
    const value = Math.max(0, Math.floor(Number(amount) || 0))
    if (value <= 0) return { success: false, error: '金額無效' }
    try {
      const res = await coinAPI.earn(value, reason)
      const walletData = res?.data?.wallet
      
      // 直接使用服務器返回的錢包數據，但需要重新獲取歷史記錄
      if (walletData) {
        try {
          // 獲取最新的交易歷史
          const historyRes = await coinAPI.getHistory(50)
          const latestHistory = historyRes?.data?.history || []
          
          const newWallet = {
            balance: Number(walletData.balance) || 0,
            lastClaimAt: walletData.lastClaimAt || null,
            history: latestHistory
          }
          setWallet(newWallet)
          
          // 廣播給其他分頁
          if (bcRef.current) {
            bcRef.current.postMessage({ 
              type: 'wallet:update', 
              wallet: newWallet,
              nextClaimInMs: nextClaimInMs
            })
          }
        } catch (historyError) {
          console.error('獲取交易歷史失敗:', historyError)
          // 如果獲取歷史失敗，至少更新餘額
          const newWallet = {
            balance: Number(walletData.balance) || 0,
            lastClaimAt: walletData.lastClaimAt || null,
            history: wallet.history || []
          }
          setWallet(newWallet)
        }
      } else {
        await refreshWallet()
      }
      
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
      const walletData = res?.data?.wallet
      
      // 直接使用服務器返回的錢包數據，但需要重新獲取歷史記錄
      if (walletData) {
        try {
          // 獲取最新的交易歷史
          const historyRes = await coinAPI.getHistory(50)
          const latestHistory = historyRes?.data?.history || []
          
          const newWallet = {
            balance: Number(walletData.balance) || 0,
            lastClaimAt: walletData.lastClaimAt || null,
            history: latestHistory
          }
          setWallet(newWallet)
          
          // 廣播給其他分頁
          if (bcRef.current) {
            bcRef.current.postMessage({ 
              type: 'wallet:update', 
              wallet: newWallet,
              nextClaimInMs: nextClaimInMs
            })
          }
        } catch (historyError) {
          console.error('獲取交易歷史失敗:', historyError)
          // 如果獲取歷史失敗，至少更新餘額
          const newWallet = {
            balance: Number(walletData.balance) || 0,
            lastClaimAt: walletData.lastClaimAt || null,
            history: wallet.history || []
          }
          setWallet(newWallet)
        }
      } else {
        await refreshWallet()
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
      const amount = Number(res?.data?.amount) || 0
      const walletData = res?.data?.wallet
      
      // 直接使用服務器返回的錢包數據，並獲取最新的交易歷史
      if (walletData) {
        try {
          // 獲取最新的交易歷史
          const historyRes = await coinAPI.getHistory(50)
          const latestHistory = historyRes?.data?.history || []
          
          const newWallet = {
            balance: Number(walletData.balance) || 0,
            lastClaimAt: walletData.lastClaimAt || null,
            history: latestHistory
          }
          setWallet(newWallet)
          setNextClaimInMs(0) // 簽到成功後重置下次簽到時間
          
          // 廣播給其他分頁
          if (bcRef.current) {
            bcRef.current.postMessage({ 
              type: 'wallet:update', 
              wallet: newWallet,
              nextClaimInMs: 0
            })
          }
        } catch (historyError) {
          console.error('獲取交易歷史失敗:', historyError)
          // 如果獲取歷史失敗，至少更新餘額
          const newWallet = {
            balance: Number(walletData.balance) || 0,
            lastClaimAt: walletData.lastClaimAt || null,
            history: wallet.history || []
          }
          setWallet(newWallet)
          setNextClaimInMs(0)
        }
      } else {
        // 如果沒有錢包數據，才調用 refreshWallet
        await refreshWallet()
      }
      
      return { success: true, amount }
    } catch (e) {
      const serverNextMs = Number(e?.response?.data?.nextClaimInMs) || 0
      setNextClaimInMs(serverNextMs)
      return {
        success: false,
        error: e?.response?.data?.error || '尚未到下次簽到時間',
        nextClaimInMs: serverNextMs
      }
    }
  }

  const canClaimNow = isLoggedIn && hydrated && nextClaimInMs <= 0

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
