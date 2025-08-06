import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Play, Filter } from 'lucide-react'
import { videoAPI, channelAPI } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import YouTubePlayer from '../components/YouTubePlayer'

// 解碼 HTML 實體
const decodeHtmlEntities = (text) => {
  if (!text) return text;
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

const Videos = () => {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false)
  const [playerOpen, setPlayerOpen] = useState(false)
  const [currentVideoId, setCurrentVideoId] = useState('')
  const [currentVideoTitle, setCurrentVideoTitle] = useState('')

  // 播放影片
  const playVideo = (video) => {
    setCurrentVideoId(video.id || video.youtube_id)
    setCurrentVideoTitle(decodeHtmlEntities(video.title))
    setPlayerOpen(true)
  }

  const fetchVideos = async (page = 1, search = '', featured = false) => {
    setLoading(true)
    try {
      // 如果沒有搜索條件，從 YouTube API 獲取
      if (!search && !featured) {
        const dashboardResponse = await channelAPI.getPublicData()
        const youtubeVideos = dashboardResponse.data.latestVideos || []

        // 轉換 YouTube 數據格式以匹配現有組件
        const formattedVideos = youtubeVideos.map(video => ({
          id: video.id,
          title: decodeHtmlEntities(video.title),
          description: decodeHtmlEntities(video.description),
          thumbnail_url: video.thumbnails?.medium?.url || video.thumbnails?.default?.url,
          youtube_id: video.id,
          view_count: video.viewCount || 0,
          like_count: video.likeCount || 0,
          published_at: video.publishedAt,
          duration: video.duration,
          url: video.url,
          is_featured: video.likeCount > 1000 // 根據點讚數判斷是否為精選
        }))

        setVideos(formattedVideos)
        setTotalPages(1) // YouTube API 一次返回所有數據
        console.log('使用 YouTube API 數據')
      } else {
        // 對於搜索和精選，使用本地 API
        let response
        if (search) {
          response = await videoAPI.search(search, { page, limit: 12 })
        } else {
          response = await videoAPI.getAll({
            page,
            limit: 12,
            featured: featured ? 'true' : undefined
          })
        }

        setVideos(response.data.videos || [])
        setTotalPages(response.data.pagination?.pages || 1)
        console.log('使用本地 API 數據')
      }
    } catch (error) {
      console.error('獲取影片失敗:', error)
      setVideos([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVideos(currentPage, searchQuery, showFeaturedOnly)
  }, [currentPage, showFeaturedOnly])

  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchVideos(1, searchQuery, showFeaturedOnly)
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container-custom py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">
              影片庫
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              探索我們所有的空耳音樂作品
            </p>

            {/* Search and Filter */}
            <div className="flex flex-col lg:flex-row gap-4">
              <form onSubmit={handleSearch} className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="搜索影片標題、描述或標籤..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input pl-10 pr-4 py-3 w-full"
                  />
                </div>
              </form>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
                  className={`btn ${showFeaturedOnly ? 'btn-primary' : 'btn-outline'} px-4 py-3`}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  {showFeaturedOnly ? '顯示全部' : '僅精選'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Videos Grid */}
      <div className="container-custom py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="large" />
          </div>
        ) : videos.length > 0 ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {videos.map((video, index) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="card group hover:shadow-lg transition-all duration-300"
                >
                  <div
                    className="cursor-pointer"
                    onClick={() => playVideo(video)}
                  >
                    <div className="relative overflow-hidden aspect-video">
                      <img
                        src={video.thumbnail_url || `https://img.youtube.com/vi/${video.youtube_id || video.id}/maxresdefault.jpg`}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <Play className="w-12 h-12 text-white" />
                      </div>
                      {video.duration && (
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                          {video.duration}
                        </div>
                      )}
                      {video.is_featured && (
                        <div className="absolute top-2 left-2 bg-primary-600 text-white text-xs px-2 py-1 rounded">
                          精選
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
                        {decodeHtmlEntities(video.title)}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {decodeHtmlEntities(video.description)}
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{(video.viewCount || video.view_count || 0).toLocaleString()} 次觀看</span>
                        {(video.published_at || video.publishedAt) && (
                          <span>
                            {new Date(video.published_at || video.publishedAt).toLocaleDateString('zh-TW')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-12">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="btn-outline px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    上一頁
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 rounded-lg ${
                          currentPage === page
                            ? 'bg-primary-600 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  })}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="btn-outline px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    下一頁
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Play className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery ? '找不到相關影片' : '暫無影片'}
            </h3>
            <p className="text-gray-600">
              {searchQuery ? '請嘗試其他關鍵字' : '敬請期待更多精彩內容'}
            </p>
          </div>
        )}
      </div>

      {/* YouTube 播放器 */}
      <YouTubePlayer
        videoId={currentVideoId}
        isOpen={playerOpen}
        onClose={() => setPlayerOpen(false)}
        title={currentVideoTitle}
      />
    </div>
  )
}

export default Videos