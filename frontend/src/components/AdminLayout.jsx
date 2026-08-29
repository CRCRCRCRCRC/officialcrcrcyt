import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import {
  ChevronDown,
  Coins,
  KeyRound,
  LogOut,
  Megaphone,
  Menu,
  Music,
  Settings as SettingsIcon,
  User,
  Users,
  Zap
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import useAdminTheme from '../hooks/useAdminTheme'
import AdminThemeSwitch from './AdminThemeSwitch'
import '../styles/admin-hud.css'

const navigation = [
  { name: '公告管理', href: '/admin/announcements', icon: Megaphone },
  { name: 'coin 發放', href: '/admin/add-coins', icon: Coins },
  { name: '通行券XP發放', href: '/admin/add-xp', icon: Zap },
  { name: '兌換碼管理', href: '/admin/redeem-codes', icon: KeyRound },
  { name: 'Discord 申請', href: '/admin/discord-applications', icon: Users },
  { name: '演唱者管理', href: '/admin/artists', icon: User },
  { name: '歌詞管理', href: '/admin/lyrics', icon: Music },
  { name: '系統設定', href: '/admin/settings', icon: SettingsIcon }
]

const AdminLayout = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [clock, setClock] = useState(() => new Date())
  const { theme, setTheme } = useAdminTheme()

  const currentSection = navigation.find((item) => location.pathname === item.href) || navigation[0]

  useEffect(() => {
    setSidebarOpen(false)
    setUserMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setSidebarOpen(false)
        setUserMenuOpen(false)
      }
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [])

  const handleLogout = () => {
    try {
      logout()
      toast.success('已成功登出')
    } catch (error) {
      toast.error('登出失敗')
    }
  }

  return (
    <div className={`admin-hud admin-theme-${theme}`}>
      <div className="admin-hud-ambient" aria-hidden="true">
        <span className="admin-hud-orb admin-hud-orb-a" />
        <span className="admin-hud-orb admin-hud-orb-b" />
        <span className="admin-hud-scan" />
      </div>

      {sidebarOpen && (
        <button
          type="button"
          className="admin-hud-overlay lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="關閉管理選單"
        />
      )}

      <aside
        className={`admin-hud-sidebar fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="admin-hud-navigation" aria-label="管理後台功能">
          {navigation.map((item) => {
            const active = location.pathname === item.href

            return (
              <Link
                key={item.href}
                to={item.href}
                className={`admin-hud-nav-link ${active ? 'is-active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <span className="admin-hud-nav-icon">
                  <item.icon className="h-[18px] w-[18px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="admin-hud-nav-name">{item.name}</span>
                </span>
                <span className="admin-hud-nav-state" aria-hidden="true" />
              </Link>
            )
          })}
        </nav>

        <div className="admin-hud-sidebar-footer">
          <div className="relative">
            {userMenuOpen && (
              <div className="admin-hud-user-menu">
                <button type="button" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  登出
                </button>
              </div>
            )}

            <button
              type="button"
              className="admin-hud-user"
              onClick={() => setUserMenuOpen((open) => !open)}
              aria-expanded={userMenuOpen}
            >
              <span className="admin-hud-user-avatar">
                <User className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1 text-left">
                <span className="admin-hud-user-name">{user?.username || user?.name || '管理員'}</span>
                <span className="admin-hud-user-role">管理員</span>
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </aside>

      <div className="admin-hud-main min-h-screen lg:pl-[280px]">
        <header className="admin-hud-topbar sticky top-0 z-30">
          <div className="flex h-[76px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="admin-hud-icon-button lg:hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label="開啟管理選單"
              >
                <Menu className="h-5 w-5" />
              </button>

              <span className="admin-hud-current-icon hidden sm:flex">
                <currentSection.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h1 className="admin-hud-current-title">{currentSection.name}</h1>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <AdminThemeSwitch theme={theme} onChange={setTheme} />
              <div className="admin-hud-clock hidden md:block">
                <span>{clock.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })}</span>
                <strong>{clock.toLocaleTimeString('zh-TW', { hour12: false })}</strong>
              </div>
            </div>
          </div>
        </header>

        <main className="admin-hud-content relative p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
