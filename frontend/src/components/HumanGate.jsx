import { useMemo, useRef, useState } from 'react'

// 強化版外觀的人類驗證（純前端）：拖曳滑塊至最右即可通過
const HumanGate = ({ onPassed }) => {
  const [value, setValue] = useState(0)
  const [error, setError] = useState('')
  const done = useRef(false)
  const ttlMs = useMemo(() => 12 * 60 * 60 * 1000, []) // 12 小時有效

  const onChange = (e) => {
    if (done.current) return
    const v = Math.max(0, Math.min(100, Number(e.target.value || 0)))
    setValue(v)
    if (v >= 100) {
      done.current = true
      try {
        const token = Math.random().toString(36).slice(2) + Date.now().toString(36)
        localStorage.setItem('human_token', token)
        localStorage.setItem('human_exp', String(Date.now() + ttlMs))
        onPassed?.()
      } catch (e) {
        setError('瀏覽器儲存失敗，請重試或更換瀏覽器')
        done.current = false
        setValue(0)
      }
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-6">
      {/* 背景裝飾 */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-purple-600 to-pink-600 opacity-90" />
        <div className="absolute -top-20 -left-16 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-10 w-[28rem] h-[28rem] bg-white/10 rounded-full blur-3xl" />
      </div>

      {/* 玻璃擬態卡片 */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl max-w-lg w-full p-8">
        {/* 品牌抬頭 */}
        <div className="flex items-center justify-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-600 shadow flex items-center justify-center text-white text-xl font-black">
            CR
          </div>
        </div>

        <h1 className="text-2xl font-display font-bold text-white text-center drop-shadow mb-2">人類驗證</h1>
        <p className="text-white/85 text-center mb-8">請將滑塊拖曳到最右側以進入網站</p>

        {/* 自訂滑桿（可視化進度） */}
        <div className="relative select-none">
          {/* 軌道 */}
          <div className="h-3 w-full rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-400 to-pink-400"
              style={{ width: `${value}%` }}
            />
          </div>

          {/* 滑塊拇指（視覺） */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full shadow-lg border border-white/30 bg-gradient-to-br from-white to-white/80 backdrop-blur flex items-center justify-center text-xs font-bold text-gray-700"
            style={{ left: `${value}%` }}
          >
            {value >= 100 ? '✓' : `${Math.floor(value)}%`}
          </div>

          {/* 真正的輸入（透明疊在上方，保留可存取性） */}
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={value}
            onChange={onChange}
            aria-label="拖曳滑塊至最右"
            className="absolute inset-0 w-full h-8 opacity-0 cursor-pointer"
          />
        </div>

        {/* 說明與狀態 */}
        <div className="mt-4 text-center text-sm text-white/90">
          {value < 100 ? '向右拖曳完成驗證' : '驗證成功，正在進入…'}
        </div>

        {error && (
          <div className="mt-3 text-center text-sm text-red-200">{error}</div>
        )}

        {/* 友善提示 */}
        <div className="mt-6 text-center text-xs text-white/70">
          僅用於防止濫用，不會蒐集個資
        </div>
      </div>
    </div>
  )
}

export default HumanGate