import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Youtube, MessageCircle, ChevronDown, LogOut, Settings, Bell, Zap, Package, Cpu, Terminal } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWebsiteAuth } from '../contexts/WebsiteAuthContext'
import { useCoin } from '../contexts/CoinContext'
import GoogleLoginButtonPublic from './GoogleLoginButtonPublic'
import CRCRCoinWidget from './CRCRCoinWidget'
import ProfileSettingsModal from './ProfileSettingsModal'
import defaultAvatar from '../assets/default-avatar.svg'

const resolveAvatarSrc = (value) => {
  if (!value) return ''
  if (/^(?:https?:)?\/\//i.test(value) || value.startsWith('data:')) return value
  const normalized = value.replace(/^\.?\/+/, '')
  return normalized ? `/${normalized}` : ''
}

const APP_VERSION = 'v1.0.01'
const TECH_EFFECT_STORAGE_PREFIX = 'tech_effect_enabled:'
const EFFECT_MODE_STORAGE_PREFIX = 'site_effect_mode:'

const getTechEffectStorageKey = (userId) => {
  if (!userId) return TECH_EFFECT_STORAGE_PREFIX
  return `${TECH_EFFECT_STORAGE_PREFIX}${userId}`
}

const getEffectModeStorageKey = (userId) => {
  if (!userId) return EFFECT_MODE_STORAGE_PREFIX
  return `${EFFECT_MODE_STORAGE_PREFIX}${userId}`
}

const MATRIX_STREAMS = [
  '01001011 11010010 CRCRC 00110101 10100110',
  '10110100 00101101 SYSTEM 11001010 01110100',
  '00111001 11100100 ONLINE 01011011 10001101',
  '11001001 01101010 MATRIX 10110100 00101110',
  '01110110 10010011 ACCESS 01001101 11100010',
  '10001101 00110110 SIGNAL 11010001 01001011',
]

const MATRIX_COLUMNS = Array.from({ length: 14 }, (_, index) => ({
  id: index,
  text: MATRIX_STREAMS[index % MATRIX_STREAMS.length],
  left: `${2 + index * 7.4}%`,
  delay: `${-((index * 0.83) % 9)}s`,
  duration: `${7 + (index % 5) * 1.15}s`,
}))

const SiteEffectOverlay = ({ mode }) => {
  if (mode !== 'tech' && mode !== 'neon') return null

  return (
    <div className={`site-effect-overlay site-effect-overlay--${mode}`} aria-hidden="true">
      {mode === 'tech' ? (
        <>
          <div className="tech-hud-glow" />
          <div className="tech-hud-grid" />
          <div className="tech-hud-scan" />
        </>
      ) : (
        <>
          <div className="matrix-rain">
            {MATRIX_COLUMNS.map((column) => (
              <span
                key={column.id}
                style={{
                  '--matrix-left': column.left,
                  '--matrix-delay': column.delay,
                  '--matrix-duration': column.duration,
                }}
              >
                {column.text}<br />{column.text}<br />{column.text}
              </span>
            ))}
          </div>
          <div className="matrix-vignette" />
        </>
      )}
    </div>
  )
}

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [effectMode, setEffectMode] = useState('none')
  const [isEffectMenuOpen, setIsEffectMenuOpen] = useState(false)
  const location = useLocation()
  const { user, logout, updateProfile } = useWebsiteAuth()
  const { hasNewNotifications } = useCoin()
  const userMenuRef = useRef(null)
  const effectMenuRef = useRef(null)

  const userDisplayName = user?.displayName || user?.name || user?.username || user?.email
  const rawUserAvatar = user?.picture || user?.avatarUrl || ''
  const userAvatar = resolveAvatarSrc(rawUserAvatar) || defaultAvatar
  
  // Reuse existing flags from DB but map them to new themes
  const techEffectUnlocked = Boolean(user?.techEffectUnlocked || user?.tech_effect_unlocked)
  const neonEffectUnlocked = Boolean(user?.neonEffectUnlocked || user?.neon_effect_unlocked)
  const hasEffectUnlocked = techEffectUnlocked || neonEffectUnlocked
  
  const techStorageKey = getTechEffectStorageKey(user?.id)
  const effectStorageKey = getEffectModeStorageKey(user?.id)
  
  const effectLabel =
    effectMode === 'tech' ? '科技感 HUD' : effectMode === 'neon' ? '霓虹矩陣' : '特效關閉'

  useEffect(() => {
    const handleDocClick = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false)
      }
      if (effectMenuRef.current && !effectMenuRef.current.contains(event.target)) {
        setIsEffectMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleDocClick)
    return () => document.removeEventListener('mousedown', handleDocClick)
  }, [])

  useEffect(() => {
    if (!hasEffectUnlocked) {
      setEffectMode('none')
      if (typeof document !== 'undefined') {
        document.body.classList.remove('tech-mode', 'neon-mode', 'mode-ethereal', 'mode-cosmic')
      }
      return
    }
    
    let storedMode = (localStorage.getItem(effectStorageKey) || '').toLowerCase()
    if (storedMode === 'ethereal') storedMode = 'tech'
    if (storedMode === 'cosmic') storedMode = 'neon'
    
    let nextMode = storedMode
    if (!nextMode) {
      const legacy = localStorage.getItem(techStorageKey)
      nextMode = legacy === 'true' ? 'tech' : 'none'
    }
    
    if (nextMode === 'tech' && !techEffectUnlocked) {
      nextMode = neonEffectUnlocked ? 'neon' : 'none'
    }
    if (nextMode === 'neon' && !neonEffectUnlocked) {
      nextMode = techEffectUnlocked ? 'tech' : 'none'
    }
    if (!['tech', 'neon'].includes(nextMode)) {
      nextMode = 'none'
    }
    setEffectMode(nextMode)
  }, [hasEffectUnlocked, techEffectUnlocked, neonEffectUnlocked, effectStorageKey, techStorageKey])

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.body.classList.remove('tech-mode', 'neon-mode', 'mode-ethereal', 'mode-cosmic')
    if (!hasEffectUnlocked) {
      return
    }
    if (effectMode === 'tech') {
      document.body.classList.add('tech-mode')
    } else if (effectMode === 'neon') {
      document.body.classList.add('neon-mode')
    }
    localStorage.setItem(effectStorageKey, effectMode)
    // Legacy support
    localStorage.setItem(techStorageKey, effectMode === 'tech' ? 'true' : 'false')
  }, [effectMode, hasEffectUnlocked, effectStorageKey, techStorageKey])

  useEffect(() => {
    return () => {
      if (typeof document !== 'undefined') {
        document.body.classList.remove('tech-mode', 'neon-mode', 'mode-ethereal', 'mode-cosmic')
      }
    }
  }, [])

  const navigation = [
    { name: '首頁', href: '/' },
    { name: '公告', href: '/announcements' },
    { name: '排行榜', href: '/leaderboard' },
    { name: '兌換碼', href: '/redeem' },
    { name: '歌詞', href: '/lyrics' },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <>
      <SiteEffectOverlay mode={hasEffectUnlocked ? effectMode : 'none'} />
      <header className="bg-white/95 backdrop-blur-custom border-b border-gray-200 sticky top-0 z-50 transition-colors duration-500">
        <div className="w-full px-4 md:px-8">
          <div className="relative flex items-center justify-between h-16 w-full">
            {/* Logo - 最左邊 */}
            <Link to="/" className="flex items-center space-x-2 z-10">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CR</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-xl font-display font-bold text-gradient">CRCRC</span>
                <span className="text-[10px] font-medium text-gray-400 tracking-wide">{APP_VERSION}</span>
              </div>
            </Link>

            {/* Desktop Navigation - 絕對置中 */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <nav className="hidden md:flex items-center space-x-8">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center justify-center px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-lg ${
                      isActive(item.href)
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Social Links & Mobile Menu Button - 最右邊 */}
            <div className="flex items-center space-x-4 z-10">
            {/* Social Links */}
            <div className="hidden sm:flex items-center space-x-3">
              {hasEffectUnlocked && (
                <div className="relative" ref={effectMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsEffectMenuOpen((prev) => !prev)}
                    className={`relative rounded-full p-2 transition-colors duration-200 ${
                      effectMode === 'tech'
                        ? 'bg-cyan-950 text-cyan-300 ring-2 ring-cyan-400/70'
                        : effectMode === 'neon'
                          ? 'bg-black text-emerald-300 ring-2 ring-emerald-400/70'
                          : 'text-gray-600 hover:text-cyan-600 hover:bg-cyan-50'
                    }`}
                    aria-expanded={isEffectMenuOpen}
                    aria-label="特效切換"
                    title={`特效切換：${effectLabel}`}
                  >
                    {effectMode === 'tech' ? <Cpu className="w-5 h-5" /> :
                     effectMode === 'neon' ? <Terminal className="w-5 h-5" /> :
                     <Zap className="w-5 h-5" />}
                  </button>
                  {isEffectMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-200 bg-white/95 p-2 shadow-lg backdrop-blur z-[100]">
                      <button
                        type="button"
                        onClick={() => {
                          setEffectMode('none')
                          setIsEffectMenuOpen(false)
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                          effectMode === 'none'
                            ? 'bg-gray-100 text-gray-900'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <span className="flex items-center gap-2"><Zap className="w-4 h-4" /> 特效關閉</span>
                      </button>
                      
                      {techEffectUnlocked && (
                        <button
                          type="button"
                          onClick={() => {
                            setEffectMode('tech')
                            setIsEffectMenuOpen(false)
                          }}
                          className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition mt-1 ${
                            effectMode === 'tech'
                              ? 'bg-cyan-950 text-cyan-300'
                              : 'text-gray-600 hover:bg-cyan-50 hover:text-cyan-700'
                          }`}
                        >
                          <span className="flex items-center gap-2"><Cpu className="w-4 h-4" /> 科技感 HUD</span>
                        </button>
                      )}
                      
                      {neonEffectUnlocked && (
                        <button
                          type="button"
                          onClick={() => {
                            setEffectMode('neon')
                            setIsEffectMenuOpen(false)
                          }}
                          className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition mt-1 ${
                            effectMode === 'neon'
                              ? 'bg-black text-emerald-300'
                              : 'text-gray-600 hover:bg-emerald-950 hover:text-emerald-300'
                          }`}
                        >
                          <span className="flex items-center gap-2"><Terminal className="w-4 h-4" /> 霓虹矩陣</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
              <Link
                to="/notifications"
                className="relative rounded-full p-2 text-gray-600 hover:text-primary-600 transition-colors duration-200"
                aria-label="通知中心"
              >
                  <Bell className="w-5 h-5" />
                  {hasNewNotifications && (
                    <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
                  )}
                </Link>
                <CRCRCoinWidget compact />
                {user ? (
                  <div className="relative" ref={userMenuRef}>
                    <button
                      className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100"
                      onClick={() => setIsUserMenuOpen((open) => !open)}
                    >
                      <img
                        src={userAvatar}
                        alt={userDisplayName || user?.email || 'default avatar'}
                        className="w-8 h-8 rounded-full object-cover"
                        onError={(event) => {
                          event.currentTarget.src = defaultAvatar
                        }}
                      />
                      <span className="text-sm font-medium text-gray-700 max-w-[100px] truncate">{userDisplayName || user?.email}</span>
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    </button>
                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg p-2 z-50">
                        <Link
                          to="/profile"
                          className="w-full flex items-center gap-2 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Settings className="w-4 h-4" />
                          個人資料設定
                        </Link>
                        <Link
                          to="/backpack"
                          className="w-full flex items-center gap-2 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Package className="w-4 h-4" />
                          背包
                        </Link>
                        <button
                          className="w-full flex items-center gap-2 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded"
                          onClick={() => {
                            logout()
                            setIsUserMenuOpen(false)
                          }}
                        >
                          <LogOut className="w-4 h-4" />
                          登出
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <GoogleLoginButtonPublic />
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen((open) => !open)}
                className="md:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.1 }}
                className="md:hidden border-t border-gray-200 bg-white"
              >
                <div className="py-4 space-y-2">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`block px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                        isActive(item.href)
                          ? 'text-primary-600 bg-primary-50'
                          : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}

                  <Link
                    to="/notifications"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-colors duration-200"
                  >
                    <Bell className="w-4 h-4" />
                    通知中心
                    {hasNewNotifications && (
                      <span className="ml-auto inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-600">
                        新
                      </span>
                    )}
                  </Link>
                  {hasEffectUnlocked && (
                    <div className="px-4 py-2 space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gray-400">
                        特效切換
                      </p>
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEffectMode('none')
                            setIsMenuOpen(false)
                          }}
                          className={`flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                            effectMode === 'none'
                              ? 'bg-gray-100 text-gray-900'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <Zap className="w-4 h-4" />
                          特效關閉
                        </button>
                        {techEffectUnlocked && (
                          <button
                            type="button"
                            onClick={() => {
                              setEffectMode('tech')
                              setIsMenuOpen(false)
                            }}
                            className={`flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                              effectMode === 'tech'
                                ? 'bg-cyan-950 text-cyan-300'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <Cpu className="w-4 h-4" />
                            科技感 HUD
                          </button>
                        )}
                        {neonEffectUnlocked && (
                          <button
                            type="button"
                            onClick={() => {
                              setEffectMode('neon')
                              setIsMenuOpen(false)
                            }}
                            className={`flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                              effectMode === 'neon'
                                ? 'bg-black text-emerald-300'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <Terminal className="w-4 h-4" />
                            霓虹矩陣
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Mobile Social Links */}
                  <div className="flex items-center space-x-4 px-4 pt-4 border-t border-gray-200">
                    <CRCRCoinWidget />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      <ProfileSettingsModal
        open={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        initialData={{ displayName: user?.displayName || user?.name || '', avatarUrl: user?.picture || user?.avatarUrl || '' }}
        onSubmit={updateProfile}
      />
    </>
  )
}

export default Header
