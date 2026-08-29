import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="site-footer bg-secondary-900 text-white">
      <div className="site-footer-inner container-custom py-8">
        <nav className="site-footer-quick-links mx-auto max-w-lg text-center" aria-label="快速連結">
          <h3 className="text-lg font-semibold mb-4">快速連結</h3>
          <ul className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-8">
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
        </nav>
      </div>
    </footer>
  )
}

export default Footer
