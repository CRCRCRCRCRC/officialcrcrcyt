import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Youtube, MessageCircle, ChevronDown, LogOut } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWebsiteAuth } from '../contexts/WebsiteAuthContext'
import GoogleLoginButtonPublic from './GoogleLoginButtonPublic'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const location = useLocation()
  const { user, logout } = useWebsiteAuth()
  const userMenuRef = useRef(null)

  useEffect(() => {
    const onDocClick = (e) => {
      if (!userMenuRef.current) return
      if (!userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const navigation = [
    { name: '首頁', href: '/' },
    { name: '公告', href: '/announcements' },
  ]

  const isActive = (path) => location.pathname === path

  return (
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

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`text-sm font-medium transition-colors duration-200 ${
                  isActive(item.href)
                    ? 'text-primary-600'
                    : 'text-gray-700 hover:text-primary-600'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

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

              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  >
                    <img src={user.picture || 'https://i.pravatar.cc/40'} alt={user.name || user.email} className="w-8 h-8 rounded-full" />
                    <span className="text-sm font-medium text-gray-700">{user.name || user.email}</span>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </button>
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-40 bg-white border rounded-lg shadow-lg p-2 z-50">
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
              onClick={() => setIsMenuOpen(!isMenuOpen)}
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
  )
}

export default Header