import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Calendar, 
  Clock,
  Megaphone,
  Share2,
  Copy,
  Check
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { announcementAPI } from '../services/api'
import { decodeHtmlEntities } from '../utils/formatters'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const AnnouncementDetail = () => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [announcement, setAnnouncement] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  console.log('🎬 AnnouncementDetail 組件載入，slug:', slug)

  useEffect(() => {
    fetchAnnouncement()
  }, [slug])

  const fetchAnnouncement = async () => {
    console.log('🚀 開始獲取公告，slug:', slug)
    try {
      setLoading(true)
      setError(null)
      const response = await announcementAPI.getById(slug)
      console.log('📋 API 響應:', response)
      console.log('📋 公告詳情數據:', response.data)
      console.log('📅 創建時間原始值:', response.data.created_at)
      console.log('📅 更新時間原始值:', response.data.updated_at)
      setAnnouncement(response.data)
    } catch (error) {
      console.error('❌ 獲取公告失敗:', error)
      if (error.response?.status === 404) {
        setError('公告不存在')
      } else {
        setError('載入公告失敗')
      }
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateInput) => {
    if (!dateInput) {
      return '未知日期'
    }

    try {
      let date = dateInput instanceof Date ? dateInput : new Date(dateInput)

      if (isNaN(date.getTime())) {
        return '日期格式錯誤'
      }

      return date.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch (error) {
      return '日期格式錯誤'
    }
  }



  const handleShare = async () => {
    const url = window.location.href
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: announcement.title,
          text: announcement.content.substring(0, 100) + '...',
          url: url
        })
      } catch (error) {
        console.log('分享取消')
      }
    } else {
      // 回退到複製連結
      handleCopyLink()
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      toast.success('連結已複製到剪貼板')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('複製失敗')
    }
  }

  console.log('🔄 組件狀態:', { loading, error, announcement: !!announcement })

  if (loading) {
    console.log('⏳ 顯示載入中...')
    return (
      <div className="min-h-full bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  if (error) {
    console.log('❌ 顯示錯誤:', error)
    return (
      <div className="min-h-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Megaphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{error}</h1>
          <p className="text-gray-600 mb-6">
            {error === '公告不存在' ? '您要查看的公告可能已被刪除或不存在' : '請稍後再試'}
          </p>
          <div className="space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-3 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
            >
              返回上頁
            </button>
            <Link
              to="/announcements"
              className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors"
            >
              查看所有公告
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container-custom py-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-between"
          >
            <Link
              to="/announcements"
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              返回公告列表
            </Link>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleShare}
                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Share2 className="w-4 h-4 mr-2" />
                分享
              </button>
              <button
                onClick={handleCopyLink}
                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2 text-green-600" />
                    已複製
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    複製連結
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="container-custom py-12">
        <motion.article
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          {/* Article Header */}
          <header className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {decodeHtmlEntities(announcement.title)}
            </h1>
            
            <div className="flex items-center space-x-6 text-gray-500 mb-6">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                發布於 {(() => {
                  console.log('🎯 渲染創建日期，announcement:', announcement)
                  console.log('🎯 created_at 值:', announcement?.created_at)
                  return formatDate(announcement?.created_at)
                })()}
              </div>
              {announcement?.updated_at !== announcement?.created_at && (
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  更新於 {formatDate(announcement?.updated_at)}
                </div>
              )}
            </div>
          </header>

          {/* Article Content */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-8 md:p-12">
              <div className="prose prose-lg max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  className="markdown-content"
                >
                  {announcement.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex items-center justify-center">
              <Link
                to="/announcements"
                className="flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                查看更多公告
              </Link>
            </div>
          </footer>
        </motion.article>
      </div>
    </div>
  )
}

export default AnnouncementDetail
