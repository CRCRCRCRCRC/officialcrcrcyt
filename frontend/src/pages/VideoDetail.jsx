import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, Eye, Tag, ExternalLink, Share2 } from 'lucide-react'
import { videoAPI } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import { formatDuration, formatNumber, decodeHtmlEntities } from '../utils/formatters'
import toast from 'react-hot-toast'

const VideoDetail = () => {
  const { id } = useParams()
  const [video, setVideo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [relatedVideos, setRelatedVideos] = useState([])

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const response = await videoAPI.getById(id)
        setVideo(response.data)
        
        // 獲取相關影片（隨機獲取其他影片）
        const relatedResponse = await videoAPI.getAll({ limit: 4 })
        setRelatedVideos(relatedResponse.data.videos.filter(v => v.id !== parseInt(id)))
      } catch (error) {
        console.error('獲取影片詳情失敗:', error)
        toast.error('影片不存在或已被刪除')
      } finally {
        setLoading(false)
      }
    }

    fetchVideo()
  }, [id])

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: video.title,
          text: video.description,
          url: window.location.href,
        })
      } catch (error) {
        console.log('分享取消')
      }
    } else {
      // 複製到剪貼板
      navigator.clipboard.writeText(window.location.href)
      toast.success('連結已複製到剪貼板')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">影片不存在</h1>
          <Link to="/" className="btn-primary">
            返回首頁
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6"
        >
          <Link
            to="/"
            className="inline-flex items-center text-gray-600 hover:text-primary-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回首頁
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="card"
            >
              {/* Video Player */}
              <div className="aspect-video mb-6">
                {video.youtube_id ? (
                  <div className="youtube-embed">
                    <iframe
                      src={`https://www.youtube.com/embed/${video.youtube_id}`}
                      title={video.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full rounded-lg"
                    ></iframe>
                  </div>
                ) : (
                  <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500">影片暫時無法播放</span>
                  </div>
                )}
              </div>

              {/* Video Info */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h1 className="text-2xl md:text-3xl font-display font-bold text-gray-900 flex-1">
                    {video.title}
                  </h1>
                  <button
                    onClick={handleShare}
                    className="btn-outline p-2 ml-4"
                    title="分享影片"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
                  {video.view_count && (
                    <div className="flex items-center">
                      <Eye className="w-4 h-4 mr-1" />
                      {video.view_count.toLocaleString()} 次觀看
                    </div>
                  )}
                  {video.published_at && (
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(video.published_at).toLocaleDateString('zh-TW')}
                    </div>
                  )}
                  {video.is_featured && (
                    <span className="bg-primary-100 text-primary-800 px-2 py-1 rounded-full text-xs font-medium">
                      精選影片
                    </span>
                  )}
                </div>

                {/* Description */}
                {video.description && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">影片描述</h3>
                    <div className="prose prose-gray max-w-none">
                      <p className="whitespace-pre-wrap">{video.description}</p>
                    </div>
                  </div>
                )}

                {/* Tags */}
                {video.tags && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <Tag className="w-5 h-5 mr-2" />
                      標籤
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {video.tags.split(',').map((tag, index) => (
                        <span
                          key={index}
                          className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* External Links */}
                {video.youtube_id && (
                  <div className="pt-6 border-t border-gray-200">
                    <a
                      href={`https://www.youtube.com/watch?v=${video.youtube_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary inline-flex items-center"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      在 YouTube 上觀看
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {relatedVideos.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="card"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">相關影片</h3>
                <div className="space-y-4">
                  {relatedVideos.map((relatedVideo) => (
                    <Link
                      key={relatedVideo.id}
                      to={`/videos/${relatedVideo.id}`}
                      className="block group"
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-24 h-16 relative overflow-hidden rounded">
                          <img
                            src={relatedVideo.thumbnail_url || `https://img.youtube.com/vi/${relatedVideo.youtube_id}/maxresdefault.jpg`}
                            alt={relatedVideo.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {relatedVideo.duration && (
                            <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                              {formatDuration(relatedVideo.duration)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm line-clamp-2 group-hover:text-primary-600 transition-colors">
                            {relatedVideo.title}
                          </h4>
                          <p className="text-xs text-gray-600 mt-1">
                            {relatedVideo.view_count?.toLocaleString()} 次觀看
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default VideoDetail