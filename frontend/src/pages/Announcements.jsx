import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Link } from 'react-router-dom'
import { 
  Megaphone, 
  Calendar, 
  Clock,
  ChevronRight,
  Search,
  Filter
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { announcementAPI } from '../services/api'
import { formatNumber, decodeHtmlEntities } from '../utils/formatters'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const [heroRef, heroInView] = useInView({ threshold: 0.1, triggerOnce: true })
  const [listRef, listInView] = useInView({ threshold: 0.1, triggerOnce: true })

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      const response = await announcementAPI.getAll({ published: true })
      setAnnouncements(response.data.announcements || [])
    } catch (error) {
      console.error('獲取公告失敗:', error)
      toast.error('載入公告失敗')
    } finally {
      setLoading(false)
    }
  }

  const filteredAnnouncements = announcements.filter(announcement =>
    announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    announcement.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (dateString) => {
    if (!dateString || dateString === 'null' || dateString === 'undefined') {
      return '未知日期'
    }

    let date = new Date(dateString)

    if (isNaN(date.getTime())) {
      date = new Date(dateString.replace(' ', 'T'))
      if (isNaN(date.getTime())) {
        return '日期格式錯誤'
      }
    }

    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // 移除 modal 相關函數，改用路由跳轉

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-700 text-white">
        <div className="container-custom py-20">
          <motion.div
            ref={heroRef}
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <Megaphone className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6">
              最新公告
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
              掌握 CRCRC 的最新動態與重要資訊
            </p>
          </motion.div>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="container-custom py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-2xl mx-auto"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="搜尋公告..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Announcements List */}
      <div className="container-custom py-12">
        <motion.div
          ref={listRef}
          initial={{ opacity: 0 }}
          animate={listInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {filteredAnnouncements.length > 0 ? (
            <div className="space-y-6">
              {filteredAnnouncements.map((announcement, index) => (
                <motion.div
                  key={announcement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={listInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  <Link to={`/announcements/${announcement.slug}`} className="block group">
                  <div className="p-8">
                    <div className="flex items-start justify-between mb-4">
                      <h2 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300 flex-1">
                        {decodeHtmlEntities(announcement.title)}
                      </h2>
                      <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-blue-600 transition-colors duration-300 ml-4 flex-shrink-0" />
                    </div>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        {formatDate(announcement.created_at)}
                      </div>
                    </div>
                    
                    <div className="text-gray-600 line-clamp-3">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        disallowedElements={['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'code', 'blockquote']}
                        unwrapDisallowed={true}
                      >
                        {announcement.content.substring(0, 200).replace(/[#*`]/g, '') + (announcement.content.length > 200 ? '...' : '')}
                      </ReactMarkdown>
                    </div>
                  </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Megaphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {searchQuery ? '沒有找到相關公告' : '暫無公告'}
              </h3>
              <p className="text-gray-500">
                {searchQuery ? '請嘗試其他關鍵字' : '請稍後再來查看'}
              </p>
            </div>
          )}
        </motion.div>
      </div>


    </div>
  )
}

export default Announcements
