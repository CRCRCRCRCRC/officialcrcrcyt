import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { coinAPI } from '../../services/api'

const Settings = () => {
  const handleResetAllCoins = async () => {
    try {
      if (!window.confirm('確定要將所有用戶的 CRCRCoin 歸零？此動作無法復原')) return
      await coinAPI.adminReset()
      toast.success('已觸發重置，使用者下次重新載入即歸零')
    } catch (error) {
      toast.error(error.response?.data?.error || '重置失敗')
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="hud-page-heading"
      >
        <h2 className="hud-page-title">網站設定</h2>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08 }}
        className="hud-panel hud-danger-panel overflow-hidden"
      >
        <div className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center border border-red-400/40 bg-red-500/10 text-sm font-bold text-red-100">
                COIN
              </span>
              <div>
                <h3 className="text-xl font-bold text-white sm:text-2xl">CRCRCoin 管理</h3>
                <p className="mt-2 leading-7 text-slate-300">
                  觸發後，所有使用者在下次載入網站時將自動清空本地 CRCRCoin 錢包（localStorage）。
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetAllCoins}
            className="hud-danger-button shrink-0"
          >
            一鍵重置全部餘額
          </button>
        </div>
      </motion.section>
    </div>
  )
}

export default Settings
