import { useEffect, useMemo, useState } from 'react'
import { useCoin } from '../contexts/CoinContext'
import GoogleLoginButtonPublic from '../components/GoogleLoginButtonPublic'
import LoadingSpinner from '../components/LoadingSpinner'

const Wallet = () => {
  const { isLoggedIn, hydrated, balance, streak, lastClaimAt, nextClaimInMs, claimDaily, history, refreshWallet } = useCoin()
  const [leftMs, setLeftMs] = useState(nextClaimInMs)
  const [claiming, setClaiming] = useState(false)

  useEffect(() => { setLeftMs(nextClaimInMs) }, [nextClaimInMs])
  useEffect(() => {
    const id = setInterval(() => setLeftMs((ms) => (ms > 1000 ? ms - 1000 : 0)), 1000)
    return () => clearInterval(id)
  }, [])

  const fmtCoin = useMemo(() => (n) => {
    try { return Number(n || 0).toLocaleString('zh-TW') } catch { return String(n || 0) }
  }, [])
  const fmtTime = (ms) => {
    const s = Math.ceil((ms || 0) / 1000)
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    const pad = (x) => String(x).padStart(2, '0')
    return `${pad(h)}:${pad(m)}:${pad(sec)}`
  }

  const dateStr = (d) => new Date(d).toISOString().slice(0, 10)
  const todayStr = dateStr(new Date())
  const lastStr = lastClaimAt ? dateStr(lastClaimAt) : null

  const canClaim = leftMs <= 0
  const nextStreak = (() => {
    if (!lastStr) return 1
    if (!canClaim) return (Number(streak) || 0) + 1 // 明日
    const deltaDays = Math.floor((Date.parse(todayStr) - Date.parse(lastStr)) / (24 * 60 * 60 * 1000))
    return deltaDays === 1 ? (Number(streak) || 0) + 1 : 1
  })()

  const rewardLabel = canClaim ? '今日簽到獎勵' : '明日簽到獎勵'
  const nextGrant = (() => {
    const base = 50
    const bonus = Math.min(50, Math.max(0, (nextStreak - 1) * 10))
    return { base, bonus, total: base + bonus }
  })()

  const onDaily = async () => {
    if (claiming) return
    setClaiming(true)
    try {
      await claimDaily()
      await refreshWallet()
    } finally { setClaiming(false) }
  }

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-10">
        <h1 className="text-3xl font-bold mb-6">錢包</h1>

        {!isLoggedIn ? (
          <div className="bg-white rounded-2xl border shadow p-6">
            <p className="text-gray-700 mb-4">請使用 Google 登入後查看與簽到。</p>
            <GoogleLoginButtonPublic />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-2xl border shadow p-6">
                <div className="text-sm text-gray-600">餘額</div>
                <div className="mt-2 text-3xl font-black text-gray-900">{fmtCoin(balance)} <span className="text-base font-semibold">CRCRCoin</span></div>
              </div>
              <div className="bg-white rounded-2xl border shadow p-6">
                <div className="text-sm text-gray-600">連續簽到</div>
                <div className="mt-2 text-3xl font-black text-gray-900">{Math.max(0, Number(streak) || 0)} <span className="text-base font-semibold">天</span></div>
              </div>
              <div className="bg-white rounded-2xl border shadow p-6">
                <div className="text-sm text-gray-600">{rewardLabel}</div>
                <div className="mt-2 text-3xl font-black text-gray-900">+{nextGrant.total} <span className="text-base font-semibold">(含加成 +{nextGrant.bonus})</span></div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border shadow p-6 mb-8">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  {leftMs > 0 ? `下次簽到倒數：${fmtTime(leftMs)}` : '可立即簽到'}
                </div>
                <button
                  type="button"
                  onClick={onDaily}
                  disabled={leftMs > 0 || claiming}
                  aria-disabled={leftMs > 0 || claiming}
                  className={`px-6 py-2 rounded-lg text-white font-semibold ${leftMs > 0 || claiming ? 'bg-gray-300 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'}`}
                >
                  {leftMs > 0 ? '已簽到' : (claiming ? '簽到中..' : '簽到')}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border shadow p-6">
              <h2 className="text-lg font-semibold mb-4">交易紀錄</h2>
              {history.length === 0 ? (
                <div className="text-sm text-gray-600">尚無紀錄</div>
              ) : (
                <ul className="divide-y">
                  {history.map((h, i) => (
                    <li key={i} className="grid grid-cols-12 items-center py-2 text-sm">
                      <div className="col-span-7 text-gray-700">{h.reason || (h.type === 'claim' ? '每日簽到' : h.type === 'earn' ? '獲得' : '消費')}</div>
                      <div className={`col-span-2 text-right font-mono tabular-nums font-semibold ${h.type === 'spend' ? 'text-rose-600' : 'text-emerald-700'}`}>
                        {h.type === 'spend' ? '-' : '+'}{fmtCoin(h.amount)}
                      </div>
                      <div className="col-span-3 text-right text-gray-400">{h.at ? new Date(h.at).toLocaleString('zh-TW') : ''}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Wallet

