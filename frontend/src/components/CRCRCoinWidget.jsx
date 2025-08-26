import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useCoin } from '../contexts/CoinContext'
import CoinIcon from '../../CRCRCoin-icon.svg'

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

  useEffect(() => {
    setLeftMs(nextClaimInMs)
    if (nextClaimInMs <= 0) return
    const id = setInterval(() => {
      setLeftMs((ms) => (ms > 1000 ? ms - 1000 : 0))
    }, 1000)
    return () => clearInterval(id)
  }, [nextClaimInMs])

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

  const Btn = (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={`inline-flex items-center ${
        compact ? 'px-2 py-1 text-sm' : 'px-3 py-1.5 text-sm'
      } rounded-full border border-yellow-300/70 bg-yellow-50 hover:bg-yellow-100 transition-colors`}
      aria-label="CRCRCoin"
      title="開啟 CRCRCoin 錢包"
    >
      <img src={CoinIcon} className={compact ? 'w-4 h-4 mr-1.5' : 'w-5 h-5 mr-2'} alt="CRCRCoin" />
      <span className="font-semibold text-yellow-700">{fmtCoin(balance)}</span>
    </button>
  )

  return (
    <>
      {Btn}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4 border border-yellow-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <img src={CoinIcon} className="w-7 h-7" alt="CRCRCoin" />
                <h3 className="text-lg font-bold text-gray-900">CRCRCoin 錢包</h3>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-800">✕</button>
            </div>

            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-100 rounded-xl p-4 mb-4">
              <div className="text-sm text-gray-600">目前餘額</div>
              <div className="mt-1 flex items-end gap-2">
                <div className="text-3xl font-black text-yellow-700">{fmtCoin(balance)}</div>
                <div className="text-xs text-gray-500 mb-1">CRCRCoin</div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-700">每日簽到獎勵：<span className="font-semibold text-yellow-700">+50</span></div>
              <button
                type="button"
                onClick={onDaily}
                disabled={!canClaimNow}
                className={`px-4 py-2 rounded-lg text-white font-semibold transition-colors ${
                  canClaimNow ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                {canClaimNow ? '領取' : `等待 ${fmtTime(leftMs)}`}
              </button>
            </div>

            <div>
              <div className="text-sm font-semibold text-gray-800 mb-2">最近紀錄</div>
              {history.length === 0 ? (
                <div className="text-sm text-gray-500">尚無交易紀錄</div>
              ) : (
                <ul className="space-y-2 max-h-52 overflow-auto pr-1">
                  {history.slice(0, 10).map((h, i) => (
                    <li key={i} className="flex items-center justify-between text-sm border-b border-gray-100 pb-2 last:border-b-0">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs ${
                          h.type === 'earn' || h.type === 'claim' ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}>
                          {h.type === 'spend' ? '-' : '+'}
                        </span>
                        <span className="text-gray-700">{h.reason || (h.type === 'claim' ? '每日簽到' : h.type === 'earn' ? '獲得' : '消費')}</span>
                      </div>
                      <div className={`font-semibold ${
                        h.type === 'spend' ? 'text-rose-600' : 'text-emerald-600'
                      }`}>{fmtCoin(h.amount)}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default CRCRCoinWidget