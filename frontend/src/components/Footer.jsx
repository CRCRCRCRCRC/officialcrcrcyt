import { Link } from 'react-router-dom'
import { Youtube, MessageCircle } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="site-footer bg-secondary-900 text-white">
      <div className="site-footer-inner container-custom py-12">
        <div className="site-footer-grid grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="site-footer-brand col-span-1 md:col-span-2">
            <Link to="/" className="site-brand flex items-center space-x-2 mb-4">
              <div className="site-brand-mark w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CR</span>
              </div>
              <span className="text-xl font-display font-bold">CRCRC</span>
            </Link>
            <p className="text-gray-300 mb-6 max-w-md">
              創作空耳與荒野亂鬥內容的頻道，歡迎訂閱！
            </p>
            <div className="flex items-center space-x-4">
              <a
                href="https://youtube.com/@officialcrcrcyt"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-gray-300 hover:text-primary-400 transition-colors duration-200"
              >
                <Youtube className="w-5 h-5" />
                <span className="text-sm">YouTube 頻道</span>
              </a>
              <a
                href="https://discord.gg/FyrNaF6Nbj"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-gray-300 hover:text-primary-400 transition-colors duration-200"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm">Discord 群組</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">快速連結</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-white transition-colors duration-200">
                  首頁
                </Link>
              </li>
              <li>
                <a href="https://youtube.com/@officialcrcrcyt" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors duration-200">
                  影片
                </a>
              </li>

              <li>
                <Link to="/contact" className="text-gray-300 hover:text-white transition-colors duration-200">
                  聯絡我們
                </Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="text-lg font-semibold mb-4">社群</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://youtube.com/@officialcrcrcyt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors duration-200"
                >
                  YouTube 頻道
                </a>
              </li>
              <li>
                <a
                  href="https://discord.gg/FyrNaF6Nbj"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors duration-200"
                >
                  Discord 群組
                </a>
              </li>
              <li>
                <a
                  href="https://discord.gg/9jBCTheX3Y"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors duration-200"
                >
                  Minecraft 伺服器
                </a>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </footer>
  )
}

export default Footer
