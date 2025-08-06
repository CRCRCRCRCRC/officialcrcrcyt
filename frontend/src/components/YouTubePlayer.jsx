import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Play, Maximize2 } from 'lucide-react'

const YouTubePlayer = ({ videoId, isOpen, onClose, title }) => {
  const [isFullscreen, setIsFullscreen] = useState(false)

  if (!isOpen || !videoId) return null

  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className={`bg-white rounded-2xl shadow-2xl overflow-hidden ${
            isFullscreen ? 'w-full h-full' : 'w-full max-w-4xl'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 播放器頭部 */}
          <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
            <h3 className="font-semibold text-gray-900 truncate flex-1 mr-4">
              {title || '播放影片'}
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleFullscreen}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                title={isFullscreen ? '退出全螢幕' : '全螢幕'}
              >
                <Maximize2 className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                title="關閉"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* 播放器容器 */}
          <div className={`relative ${isFullscreen ? 'h-full' : 'aspect-video'}`}>
            <iframe
              src={embedUrl}
              title={title}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default YouTubePlayer
