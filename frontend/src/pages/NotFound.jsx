import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, ArrowLeft } from 'lucide-react'

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        {/* 404 Animation */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <div className="text-8xl md:text-9xl font-bold text-primary-600 mb-4">
            404
          </div>
          <div className="w-32 h-1 bg-primary-600 mx-auto"></div>
        </motion.div>

        {/* Error Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">
            頁面不存在
          </h1>
          <p className="text-xl text-gray-600 max-w-md mx-auto">
            抱歉，您訪問的頁面可能已被移動、刪除或不存在。
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link to="/" className="btn-primary inline-flex items-center">
            <Home className="w-5 h-5 mr-2" />
            返回首頁
          </Link>
          <button
            onClick={() => window.history.back()}
            className="btn-outline inline-flex items-center"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            返回上一頁
          </button>
        </motion.div>

        {/* Helpful Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12"
        >
          <p className="text-gray-500 mb-4">您可能在尋找：</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://youtube.com/@officialcrcrcyt"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-700 underline"
            >
              影片庫
            </a>
            <Link
              to="/contact"
              className="text-primary-600 hover:text-primary-700 underline"
            >
              聯繫我們
            </Link>
          </div>
        </motion.div>

        {/* Decorative Elements */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.1, scale: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="absolute inset-0 pointer-events-none overflow-hidden"
        >
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary-200 rounded-full"></div>
          <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-secondary-200 rounded-full"></div>
          <div className="absolute top-3/4 left-1/3 w-16 h-16 bg-primary-300 rounded-full"></div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default NotFound
