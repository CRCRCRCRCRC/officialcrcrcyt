import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

const Dashboard = () => {
  return (
    <div className="mx-auto max-w-7xl">
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="hud-page-heading"
      >
        <div className="flex items-center justify-between gap-6">
          <div>
            <h2 className="hud-page-title">歡迎回來！ 👋</h2>
            <p className="hud-page-description text-lg">
              今天是 {new Date().toLocaleDateString('zh-TW', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
              })}
            </p>
          </div>
          <div className="admin-hud-current-icon hidden h-16 w-16 md:flex">
            <Sparkles className="h-8 w-8" />
          </div>
        </div>
      </motion.section>
    </div>
  )
}

export default Dashboard
