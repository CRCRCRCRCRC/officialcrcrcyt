import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Youtube, MessageCircle, LogOut } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWebsiteAuth } from '../contexts/WebsiteAuthContext'
import GoogleLoginButtonPublic from './GoogleLoginButtonPublic'
import CRCRCoinWidget from './CRCRCoinWidget'

// Logout Button Animation Styles
const logoutButtonStyles = `
/* From Uiverse.io by vinodjangid07 */
.LogoutBtn {
  display: flex !important;
  align-items: center !important;
  justify-content: flex-start !important;
  width: 45px !important;
  height: 45px !important;
  border: none !important;
  border-radius: 50% !important;
  cursor: pointer !important;
  position: relative !important;
  overflow: hidden !important;
  transition-duration: .3s !important;
  box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.199) !important;
  background-color: rgb(255, 65, 65) !important;
}

/* logout icon */
.logout-icon {
  width: 100% !important;
  transition-duration: .3s !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.logout-icon svg {
  width: 17px !important;
}

.logout-icon svg path {
  fill: white !important;
}
/* text */
.logout-text {
  position: absolute !important;
  right: 0% !important;
  width: 0% !important;
  opacity: 0 !important;
  color: white !important;
  font-size: 1.2em !important;
  font-weight: 600 !important;
  transition-duration: .3s !important;
}
/* hover effect on button width */
.LogoutBtn:hover {
  width: 125px !important;
  border-radius: 40px !important;
  transition-duration: .3s !important;
}

.LogoutBtn:hover .logout-icon {
  width: 30% !important;
  transition-duration: .3s !important;
  padding-left: 20px !important;
}
/* hover effect button's text */
.LogoutBtn:hover .logout-text {
  opacity: 1 !important;
  width: 70% !important;
  transition-duration: .3s !important;
  padding-right: 10px !important;
}
/* button click effect*/
.LogoutBtn:active {
  transform: translate(2px ,2px) !important;
}
`

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()
  const { user, logout } = useWebsiteAuth()

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

              <CRCRCoinWidget compact />
              {user ? (
                <>
                  <style dangerouslySetInnerHTML={{ __html: logoutButtonStyles }} />
                  <div className="LogoutBtn" onClick={logout}>
                    <div className="logout-icon">
                      <LogOut className="w-[17px] h-[17px]" />
                    </div>
                    <div className="logout-text">登出</div>
                  </div>
                </>
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
  )
}

export default Header