import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useCoin } from '../contexts/CoinContext'
import CoinIcon from '../../CRCRCoin-icon.svg'

const CRCRCoinWidget = ({ compact = false, navigateOnClick = false }) => {
  const { isLoggedIn, hydrated, balance, streak, lastClaimAt, history, claimDaily, canClaimNow, nextClaimInMs } = useCoin()

  const [open, setOpen] = useState(false)
  const [leftMs, setLeftMs] = useState(nextClaimInMs)
  const [claiming, setClaiming] = useState(false)
  const wrapperRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    setLeftMs(nextClaimInMs)
    if (nextClaimInMs <= 0) return
    const id = setInterval(() => setLeftMs(ms => (ms > 1000 ? ms - 1000 : 0)), 1000)
    return () => clearInterval(id)
  }, [nextClaimInMs])

  useEffect(() => {
    const onDocClick = (e) => {
      if (!open) return
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const fmtCoin = useMemo(() => {
    try { return (n) => Number(n || 0).toLocaleString('zh-TW') } catch { return (n) => String(n || 0) }
  }, [])
  const fmtTime = (ms) => {
    const s = Math.ceil(ms / 1000)
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    const pad = (x) => String(x).padStart(2, '0')
    return `${pad(h)}:${pad(m)}:${pad(sec)}`
  }

  const onDaily = async () => {
    if (claiming) return
    setClaiming(true)
    try {
      const res = await claimDaily()
      if (res?.success) {
        toast.success(`簽到成功！獲得 ${res.amount} CRCRCoin`)
      } else {
        const msg = res?.error || '尚未可再次簽到'
        toast.error(msg)
      }
    } finally {
      setClaiming(false)
    }
  }

  const pillClass = 'group inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-all ' +
    'bg-white/60 hover:bg-white/80 border-white/30 backdrop-blur-md shadow-sm hover:shadow ' +
    'text-gray-800'

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

  return (
    <div ref={wrapperRef} className={compact ? 'relative inline-block' : 'relative'}>
      <button
        type="button"
        onClick={() => { if (navigateOnClick) { navigate('/wallet') } else { setOpen(v => !v) } }}
        className={pillClass}
        aria-expanded={open}
        aria-haspopup="dialog"
        title="CRCRCoin 錢包"
      >
        <img src={CoinIcon} className="w-4 h-4" alt="CRCRCoin" />
        <span className="font-semibold tabular-nums">{hydrated ? fmtCoin(balance) : '...'}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 z-50">
          <div className="bg-white/80 backdrop-blur-xl border border-white/25 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between p-4 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow">
                  <img src={CoinIcon} className="w-4 h-4" alt="CRCRCoin" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900">CRCRCoin 錢包</h3>
              </div>
              <button className="text-gray-400 hover:text-gray-700 text-sm" onClick={() => setOpen(false)} aria-label="Close">×</button>
            </div>

            <div className="px-4 pb-4">
              <div className="rounded-xl border border-white/25 bg-gradient-to-br from-white/70 to-white/50 p-4">
                <div className="text-xs text-gray-600">錢包餘額</div>
                <div className="mt-1 flex items-end gap-2">
                  <div className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-700 via-orange-600 to-amber-600 text-3xl font-black leading-none">
                    {fmtCoin(balance)}
                  </div>
                  <div className="text-[10px] text-gray-500 mb-1">CRCRCoin</div>
                </div>
                <div className="mt-2 text-[11px] text-gray-600">
                  連續簽到：<span className="font-semibold text-yellow-700">{Math.max(0, Number(streak) || 0)}</span> 天
                </div>
              </div>
            </div>

            <div className="px-4 pb-2">
              <div className="text-[11px] text-gray-700 mb-1">
                {rewardLabel}：<span className="font-semibold text-yellow-700">+{nextGrant.total}</span>
                <span className="text-gray-500 ml-1">(含加成 +{nextGrant.bonus})</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-700">
                  {isLoggedIn ? (canClaimNow ? '可立即簽到' : `等候 ${fmtTime(leftMs)}`) : '請先登入後簽到'}
                </div>
                <button
                  type="button"
                  onClick={onDaily}
                  aria-disabled={!isLoggedIn || !hydrated || !canClaimNow || claiming}
                  disabled={!isLoggedIn || !hydrated || !canClaimNow || claiming}
                  className={['px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-all',
                    (!isLoggedIn || !hydrated || !canClaimNow || claiming)
                      ? 'bg-gray-300 cursor-not-allowed pointer-events-none'
                      : 'bg-gradient-to-r from-primary-500 to-pink-500 hover:from-primary-600 hover:to-pink-600 shadow'
                  ].join(' ')}
                >
                  {!isLoggedIn ? '請先登入' : (!hydrated ? '同步中..' : (claiming ? '簽到中..' : (canClaimNow ? '簽到' : `等候 ${fmtTime(leftMs)}`)))}
                </button>
              </div>
            </div>

            <div className="px-4 pb-4">
              <div className="text-xs font-semibold text-gray-800 mb-2">最近紀錄</div>
              {history.length === 0 ? (
                <div className="text-xs text-gray-500 py-3">尚無交易紀錄</div>
              ) : (
                <ul className="space-y-2 max-h-48 overflow-auto pr-1">
                  {history.slice(0, 8).map((h, i) => (
                    <li key={i} className="flex items-center justify-between text-xs border-b border-white/20 pb-2 last:border-b-0">
                      <div className="flex items-center gap-2">
                        <span className={['inline-flex items-center justify-center w-5 h-5 rounded-full text-white', h.type === 'spend' ? 'bg-rose-500' : 'bg-emerald-500'].join(' ')}>
                          {h.type === 'spend' ? '-' : '+'}
                        </span>
                        <span className="text-gray-700">
                          {h.reason || (h.type === 'claim' ? '每日簽到' : h.type === 'earn' ? '獲得' : '消費')}
                        </span>
                      </div>
                      <div className={['font-semibold tabular-nums', h.type === 'spend' ? 'text-rose-600' : 'text-emerald-700'].join(' ')}>
                        {fmtCoin(h.amount)}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CRCRCoinWidget

