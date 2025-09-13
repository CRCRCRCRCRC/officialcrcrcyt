import { useMemo, useRef, useState } from 'react'

// 簡易人類驗證：拖曳滑塊至最右側即通過（無外部服務）
const HumanGate = ({ onPassed }) => {
  const [value, setValue] = useState(0)
  const [error, setError] = useState('')
  const done = useRef(false)
  const ttlMs = useMemo(() => 12 * 60 * 60 * 1000, [])

  const onChange = (e) => {
    if (done.current) return
    const v = Number(e.target.value || 0)
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
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-secondary-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">人類驗證</h1>
        <p className="text-gray-600 mb-6">請拖曳滑塊至最右側以進入網站</p>
        <div className="px-2 py-4">
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={value}
            onChange={onChange}
            className="w-full"
            aria-label="拖曳滑塊至最右"
          />
          <div className="mt-2 text-sm text-gray-600">{value < 100 ? '向右拖曳完成驗證' : '驗證成功，即將進入'}</div>
        </div>
        {error && (<div className="text-sm text-red-600 mt-2">{error}</div>)}
      </div>
    </div>
  )
}

export default HumanGate
