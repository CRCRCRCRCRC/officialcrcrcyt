import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Youtube, MessageCircle, ChevronDown, LogOut, Settings } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWebsiteAuth } from '../contexts/WebsiteAuthContext'
import GoogleLoginButtonPublic from './GoogleLoginButtonPublic'
import CRCRCoinWidget from './CRCRCoinWidget'
import ProfileSettingsModal from './ProfileSettingsModal'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const location = useLocation()
  const { user, logout, updateProfile } = useWebsiteAuth()
  const userMenuRef = useRef(null)

  const userDisplayName = user?.displayName || user?.name || user?.username || user?.email
  const userAvatar = user?.avatarUrl || user?.picture || 'https://i.pravatar.cc/80'

  useEffect(() => {
    const handleDocClick = (event) => {
      if (!userMenuRef.current) return
      if (!userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleDocClick)
    return () => document.removeEventListener('mousedown', handleDocClick)
  }, [])

  const navigation = [
    { name: '首頁', href: '/' },
    { name: '公告', href: '/announcements' },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <>
      <header className="bg-white/95 backdrop-blur-custom border-b border-gray-200 sticky top-0 z-50">
        <div className="container-custom">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CR</span>
              </div>
              <span className="text-xl font-display font-bold text-gradient">CRCRC</span>
            </Link>

            {/* Desktop Navigation - 水平居中 */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
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

            {/* Social Links & Mobile Menu Button */}
            <div className="flex items-center space-x-4">
              {/* Social Links */}
              <div className="hidden sm:flex items-center space-x-3">
                <a
                  href="https://youtube.com/@officialcrcrcyt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-600 hover:text-primary-600 transition-colors duration-200"
                  aria-label="YouTube"
                >
                  <Youtube className="w-5 h-5" />
                </a>
                <a
                  href="https://discord.gg/FyrNaF6Nbj"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-600 hover:text-primary-600 transition-colors duration-200"
                  aria-label="Discord"
                >
                  <MessageCircle className="w-5 h-5" />
                </a>

                <CRCRCoinWidget compact />
                {user ? (
                  <div className="relative" ref={userMenuRef}>
                    <button
                      className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100"
                      onClick={() => setIsUserMenuOpen((open) => !open)}
                    >
                      <img src={userAvatar} alt={userDisplayName || user?.email} className="w-8 h-8 rounded-full object-cover" />
                      <span className="text-sm font-medium text-gray-700">{userDisplayName || user?.email}</span>
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    </button>
                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg p-2 z-50">
                        <button
                          className="w-full flex items-center gap-2 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded"
                          onClick={() => {
                            setShowProfileModal(true)
                            setIsUserMenuOpen(false)
                          }}
                        >
                          <Settings className="w-4 h-4" />
                          個人資料設定
                        </button>
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
                transition={{ duration: 0.2 }}
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

                  {/* Mobile Social Links */}
                  <div className="flex items-center space-x-4 px-4 pt-4 border-t border-gray-200">
                    <CRCRCoinWidget />
                    <a
                      href="https://youtube.com/@officialcrcrcyt"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-sm text-gray-600 hover:text-primary-600 transition-colors duration-200"
                    >
                      <Youtube className="w-4 h-4" />
                      <span>YouTube</span>
                    </a>
                    <a
                      href="https://discord.gg/FyrNaF6Nbj"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-sm text-gray-600 hover:text-primary-600 transition-colors duration-200"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Discord</span>
                    </a>
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
        initialData={{ displayName: user?.displayName || user?.name || '', avatarUrl: user?.avatarUrl || user?.picture || '' }}
        onSubmit={updateProfile}
      />
    </>
  )
}

export default Header