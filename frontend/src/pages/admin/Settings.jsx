import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  Coins,
  Database,
  LockKeyhole,
  RefreshCw,
  Settings as SettingsIcon,
  ShieldCheck
} from 'lucide-react'
import toast from 'react-hot-toast'
import { coinAPI } from '../../services/api'

const Settings = () => {
  const [resettingCoins, setResettingCoins] = useState(false)

  const handleResetAllCoins = async () => {
    const confirmed = window.confirm(
      '確定要將所有使用者的 CRCRCoin 歸零嗎？此操作無法復原。'
    )

    if (!confirmed) return

    setResettingCoins(true)

    try {
      await coinAPI.adminReset()
      toast.success('所有使用者的 CRCRCoin 已重設為 0')
    } catch (error) {
      toast.error(error.response?.data?.error || '重設失敗，請稍後再試')
    } finally {
      setResettingCoins(false)
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
        <div className="hud-page-eyebrow">
          <SettingsIcon className="h-4 w-4" />
          SYSTEM CONFIGURATION // SYS-09
        </div>
        <h2 className="hud-page-title">系統設定</h2>
        <p className="hud-page-description">
          管理網站核心資料。高風險操作會要求再次確認，執行前請先確認影響範圍。
        </p>
      </motion.section>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="hud-panel p-5">
          <div className="flex items-center gap-3">
            <span className="admin-hud-current-icon flex">
              <Database className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs tracking-[0.16em] text-cyan-300">DATA CORE</p>
              <p className="mt-1 font-semibold text-white">資料控制</p>
            </div>
          </div>
        </div>
        <div className="hud-panel p-5">
          <div className="flex items-center gap-3">
            <span className="admin-hud-current-icon flex">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs tracking-[0.16em] text-cyan-300">ACCESS</p>
              <p className="mt-1 font-semibold text-white">管理員限定</p>
            </div>
          </div>
        </div>
        <div className="hud-panel p-5">
          <div className="flex items-center gap-3">
            <span className="admin-hud-current-icon flex">
              <LockKeyhole className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs tracking-[0.16em] text-cyan-300">PROTOCOL</p>
              <p className="mt-1 font-semibold text-white">二次確認啟用</p>
            </div>
          </div>
        </div>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08 }}
        className="hud-panel hud-danger-panel overflow-hidden"
      >
        <div className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="hud-chip border-red-400/30 bg-red-500/10 text-red-200">
                <AlertTriangle className="h-3.5 w-3.5" /> DANGER ZONE
              </span>
              <span className="hud-chip">COIN DATABASE</span>
            </div>
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center border border-red-400/40 bg-red-500/10 text-red-200">
                <Coins className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-xl font-bold text-white sm:text-2xl">CRCRCoin 全站歸零</h3>
                <p className="mt-2 leading-7 text-slate-300">
                  將所有使用者目前持有的 CRCRCoin 重設為 0。這項操作會直接修改資料庫，而且無法復原。
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetAllCoins}
            disabled={resettingCoins}
            className="hud-danger-button shrink-0"
          >
            {resettingCoins ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                正在執行
              </>
            ) : (
              <>
                <Coins className="h-4 w-4" />
                重設所有 CRCRCoin
              </>
            )}
          </button>
        </div>
      </motion.section>
    </div>
  )
}

export default Settings
