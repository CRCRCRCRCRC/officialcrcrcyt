import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Activity,
  ArrowUpRight,
  KeyRound,
  Megaphone,
  Radio,
  Settings,
  ShieldCheck
} from 'lucide-react'

const quickActions = [
  {
    title: '公告管理',
    description: '發布、編輯與管理網站公告',
    code: 'COM-02',
    href: '/admin/announcements',
    icon: Megaphone
  },
  {
    title: '兌換碼管理',
    description: '建立與追蹤兌換碼使用狀態',
    code: 'KEY-05',
    href: '/admin/redeem-codes',
    icon: KeyRound
  },
  {
    title: '系統設定',
    description: '管理網站核心資料與設定',
    code: 'SYS-09',
    href: '/admin/settings',
    icon: Settings
  }
]

const Dashboard = () => {
  const formattedDate = new Date().toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="hud-page-heading"
      >
        <div className="hud-page-eyebrow">
          <Radio className="h-4 w-4" />
          COMMAND CENTER // ONLINE
        </div>
        <h2 className="hud-page-title">歡迎回到控制中心</h2>
        <p className="hud-page-description">{formattedDate}，管理模組已就緒。</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <span className="hud-chip text-emerald-200">
            <Activity className="h-3.5 w-3.5" /> SYSTEM READY
          </span>
          <span className="hud-chip">
            <ShieldCheck className="h-3.5 w-3.5" /> AUTHORIZED SESSION
          </span>
        </div>
      </motion.section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] tracking-[0.18em] text-cyan-300">QUICK ACCESS</p>
            <h3 className="mt-1 text-xl font-bold text-white">常用控制模組</h3>
          </div>
          <span className="text-[10px] tracking-[0.14em] text-slate-500">03 MODULES</span>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.href}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.06 * (index + 1) }}
            >
              <Link to={action.href} className="hud-panel group block h-full p-6 no-underline">
                <div className="flex items-start justify-between gap-4">
                  <span className="admin-hud-current-icon flex transition-transform duration-200 group-hover:-translate-y-0.5">
                    <action.icon className="h-5 w-5" />
                  </span>
                  <span className="font-mono text-[9px] tracking-[0.15em] text-cyan-400/70">{action.code}</span>
                </div>
                <h4 className="mt-6 text-lg font-bold text-white">{action.title}</h4>
                <p className="mt-2 min-h-[48px] text-sm leading-6 text-slate-400">{action.description}</p>
                <div className="mt-5 flex items-center justify-between border-t border-cyan-300/10 pt-4 text-xs text-cyan-200">
                  <span>OPEN MODULE</span>
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Dashboard
