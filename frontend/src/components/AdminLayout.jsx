import { useState, useEffect } from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Video,
  Settings as SettingsIcon,
  Users,
  BarChart3,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  User,
  ChevronDown,
  Sparkles,
  Zap,
  TrendingUp,
  Megaphone,
  Coins
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const AdminLayout = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLargeScreen, setIsLargeScreen] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024)
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)

    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  useEffect(() => {
    if (!document?.body) {
      return undefined
    }

    const style = document.createElement('style')
    style.dataset.adminHideDonate = 'true'
    style.textContent = `
      #kofi-widget-overlay,
      #kofi-widget-overlay *,
      .floating-chat,
      .floating-chat *,
      [id^="kofiframe"],
      iframe[src*="ko-fi"],
      a[href*="ko-fi.com"] {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
        width: 0 !important;
        height: 0 !important;
      }
    `
    document.head.appendChild(style)

    const hideOverlay = () => {
      const overlay = document.getElementById('kofi-widget-overlay')
      if (overlay) {
        overlay.remove()
      }

      document
        .querySelectorAll('.floating-chat, [id^="kofiframe"], iframe[src*="ko-fi"], a[href*="ko-fi.com"]')
        .forEach((node) => {
          if (node instanceof HTMLElement || node instanceof HTMLIFrameElement) {
            node.remove()
          }
        })
    }

    hideOverlay()

    const observer = typeof MutationObserver !== 'undefined'
      ? new MutationObserver(() => hideOverlay())
      : null

    if (observer) {
      observer.observe(document.body, { childList: true, subtree: true })
    }

    const koFiScript = document.querySelector('script[src*="ko-fi.com"]')
    if (koFiScript) {
      koFiScript.remove()
    }

    const intervalId = window.setInterval(hideOverlay, 1500)

    return () => {
      if (style.parentNode) {
        style.parentNode.removeChild(style)
      }
      if (observer) {
        observer.disconnect()
      }
      window.clearInterval(intervalId)
    }
  }, [])

  const navigation = [
    { 
      name: '儀表板', 
      href: '/admin/dashboard', 
      icon: LayoutDashboard,
      gradient: 'from-blue-500 to-purple-600'
    },

    {
      name: '公告管理',
      href: '/admin/announcements',
      icon: Megaphone,
      gradient: 'from-orange-500 to-yellow-600'
    },
    {
      name: 'CRCRCoin 發放',
      href: '/admin/add-coins',
      icon: Coins,
      gradient: 'from-yellow-500 to-orange-500'
    },
    {
      name: 'Discord 申請',
      href: '/admin/discord-applications',
      icon: Users,
      gradient: 'from-indigo-500 to-purple-600'
    },
    {
      name: '系統設定',
      href: '/admin/settings',
      icon: SettingsIcon,
      gradient: 'from-green-500 to-teal-600'
    }
  ]

  const handleLogout = async () => {
    try {
      logout()
      toast.success('已成功登出')
    } catch (error) {
      toast.error('登出失敗')
    }
  }

  const isActive = (href) => location.pathname === href

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{
          x: isLargeScreen ? 0 : (sidebarOpen ? 0 : '-100%')
        }}
        className="fixed inset-y-0 left-0 z-50 w-64 bg-white/80 backdrop-blur-xl border-r border-white/20 shadow-2xl"
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-20 items-center justify-between px-6 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  CRCRC
                </h1>
                <p className="text-xs text-gray-500">管理後台</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className="group relative block"
                  onClick={() => setSidebarOpen(false)}
                >
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      relative flex items-center px-4 py-3 rounded-xl transition-all duration-300
                      ${active 
                        ? 'bg-gradient-to-r ' + item.gradient + ' text-white shadow-lg shadow-blue-500/25' 
                        : 'text-gray-700 hover:bg-white/60 hover:shadow-md'
                      }
                    `}
                  >
                    <item.icon className={`w-5 h-5 mr-3 ${active ? 'text-white' : 'text-gray-500'}`} />
                    <span className="font-medium">{item.name}</span>
                    
                    {active && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 rounded-xl"
                        initial={false}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </motion.div>
                </Link>
              )
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-white/10 -mt-10">
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-full flex items-center px-4 py-3 rounded-xl hover:bg-white/60 transition-all duration-300"
              >
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="ml-3 flex-1 text-left">
                  <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                  <p className="text-xs text-gray-500">管理員</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"
                  >
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-3 text-left hover:bg-red-50 text-red-600 transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      登出
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main content */}
      <div className="transition-all duration-300" style={{ paddingLeft: isLargeScreen ? '256px' : '0' }}>
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-white/20">
          <div className="flex h-16 items-center justify-between px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜尋..."
                  className="pl-10 pr-4 py-2 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>

              <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout


