import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useCoin } from '../contexts/CoinContext'
import CoinIcon from '../../CRCRCoin-icon.svg'

/**
 * CRCRCoin Widget (Modern/Minimal)
 * - Compact header pill with number
 * - Click to open a glassmorphism dropdown (not fullscreen)
 * - Matches site style (soft glass, gradients, rounded)
 */
const CRCRCoinWidget = ({ compact = false }) => {
  const {
    balance,
    history,
    claimDaily,
    canClaimNow,
    nextClaimInMs
  } = useCoin()

  const [open, setOpen] = useState(false)
  const [leftMs, setLeftMs] = useState(nextClaimInMs)
  const wrapperRef = useRef(null)

  // Countdown for next claim
  useEffect(() => {
    setLeftMs(nextClaimInMs)
    if (nextClaimInMs <= 0) return
    const id = setInterval(() => {
      setLeftMs((ms) => (ms > 1000 ? ms - 1000 : 0))
    }, 1000)
    return () => clearInterval(id)
  }, [nextClaimInMs])

  // Outside click to close
  useEffect(() => {
    const onDocClick = (e) => {
      if (!open) return
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const fmtCoin = useMemo(() => {
    try {
      return (n) => Number(n || 0).toLocaleString('zh-TW')
    } catch {
      return (n) => String(n || 0)
    }
  }, [])

  const fmtTime = (ms) => {
    const s = Math.ceil(ms / 1000)
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    const pad = (x) => String(x).padStart(2, '0')
    return `${pad(h)}:${pad(m)}:${pad(sec)}`
  }

  const onDaily = () => {
    const res = claimDaily()
    if (res?.success) {
      toast.success(`簽到成功！獲得 ${res.amount} CRCRCoin`)
    } else {
      const msg = res?.error || '尚未到下次簽到時間'
      toast.error(msg)
    }
  }

  // Compact pill button styling (neutral, subtle)
  const pillClass =
    'group inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-all ' +
    'bg-white/60 hover:bg-white/80 border-white/30 backdrop-blur-md shadow-sm hover:shadow ' +
    'text-gray-800'

  return (
    <div ref={wrapperRef} className={compact ? 'relative inline-block' : 'relative'}>
      {/* Pill button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={pillClass}
        aria-expanded={open}
        aria-haspopup="dialog"
        title="CRCRCoin 錢包"
      >
        <img src={CoinIcon} className="w-4 h-4" alt="CRCRCoin" />
        <span className="font-semibold tabular-nums">{fmtCoin(balance)}</span>
      </button>

      {/* Dropdown panel (glassmorphism) */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 z-50">
          <div className="bg-white/80 backdrop-blur-xl border border-white/25 rounded-2xl shadow-xl">
            {/* Header row */}
            <div className="flex items-center justify-between p-4 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow">
                  <img src={CoinIcon} className="w-4 h-4" alt="CRCRCoin" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900">CRCRCoin 錢包</h3>
              </div>
              <button
                className="text-gray-400 hover:text-gray-700 text-sm"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Balance card */}
            <div className="px-4 pb-4">
              <div className="rounded-xl border border-white/25 bg-gradient-to-br from-white/70 to-white/50 p-4">
                <div className="text-xs text-gray-600">目前餘額</div>
                <div className="mt-1 flex items-end gap-2">
                  <div className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-700 via-orange-600 to-amber-600 text-3xl font-black leading-none">
                    {fmtCoin(balance)}
                  </div>
                  <div className="text-[10px] text-gray-500 mb-1">CRCRCoin</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-4 pb-2">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-700">
                  每日簽到獎勵：<span className="font-semibold text-yellow-700">+50</span>
                </div>
                <button
                  type="button"
                  onClick={onDaily}
                  disabled={!canClaimNow}
                  className={[
                    'px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-all',
                    canClaimNow
                      ? 'bg-gradient-to-r from-primary-500 to-pink-500 hover:from-primary-600 hover:to-pink-600 shadow'
                      : 'bg-gray-300 cursor-not-allowed'
                  ].join(' ')}
                >
                  {canClaimNow ? '領取' : `等待 ${fmtTime(leftMs)}`}
                </button>
              </div>
            </div>

            {/* History */}
            <div className="px-4 pb-4">
              <div className="text-xs font-semibold text-gray-800 mb-2">最近紀錄</div>
              {history.length === 0 ? (
                <div className="text-xs text-gray-500 py-3">尚無交易紀錄</div>
              ) : (
                <ul className="space-y-2 max-h-48 overflow-auto pr-1">
                  {history.slice(0, 8).map((h, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between text-xs border-b border-white/20 pb-2 last:border-b-0"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={[
                            'inline-flex items-center justify-center w-5 h-5 rounded-full text-white',
                            h.type === 'spend' ? 'bg-rose-500' : 'bg-emerald-500'
                          ].join(' ')}
                        >
                          {h.type === 'spend' ? '-' : '+'}
                        </span>
                        <span className="text-gray-700">
                          {h.reason || (h.type === 'claim' ? '每日簽到' : h.type === 'earn' ? '獲得' : '消費')}
                        </span>
                      </div>
                      <div
                        className={[
                          'font-semibold tabular-nums',
                          h.type === 'spend' ? 'text-rose-600' : 'text-emerald-700'
                        ].join(' ')}
                      >
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