import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  Star,
  Calendar
} from 'lucide-react'
import { videoAPI } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'

const Videos = () => {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    try {
      const response = await videoAPI.getAll()
      setVideos(response.data.videos)
    } catch (error) {
      console.error('獲取影片失敗:', error)
      toast.error('載入影片失敗')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleFeatured = async (videoId, currentStatus) => {
    try {
      await videoAPI.update(videoId, { is_featured: !currentStatus })
      setVideos(videos.map(video => 
        video.id === videoId 
          ? { ...video, is_featured: !currentStatus }
          : video
      ))
      toast.success(currentStatus ? '已取消精選' : '已設為精選')
    } catch (error) {
      toast.error('更新失敗')
    }
  }

  const handleDelete = async (videoId) => {
    if (!confirm('確定要刪除這個影片嗎？')) return
    
    try {
      await videoAPI.delete(videoId)
      setVideos(videos.filter(video => video.id !== videoId))
      toast.success('影片已刪除')
    } catch (error) {
      toast.error('刪除失敗')
    }
  }

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || 
      (filterStatus === 'featured' && video.is_featured) ||
      (filterStatus === 'regular' && !video.is_featured)
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-display font-bold text-gray-900">
                影片管理
              </h1>
              <p className="text-gray-600">
                管理您的 YouTube 影片內容
              </p>
            </div>
            <button className="btn-primary flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              新增影片
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="搜尋影片..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Filter className="w-4 h-4 mr-2 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="input"
                >
                  <option value="all">全部影片</option>
                  <option value="featured">精選影片</option>
                  <option value="regular">一般影片</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Videos Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video, index) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="card group"
            >
              <div className="relative">
                <img
                  src={video.thumbnail_url || `https://img.youtube.com/vi/${video.youtube_id}/maxresdefault.jpg`}
                  alt={video.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
                {video.is_featured && (
                  <div className="absolute top-2 left-2">
                    <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                      <Star className="w-3 h-3 mr-1" />
                      精選
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex space-x-2">
                    <button className="btn-primary p-2">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleToggleFeatured(video.id, video.is_featured)}
                      className="btn-outline p-2"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(video.id)}
                      className="btn-danger p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <h3 className="font-semibold text-gray-900 line-clamp-2">
                  {video.title}
                </h3>
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                  {video.description}
                </p>
                
                <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Eye className="w-4 h-4 mr-1" />
                    {video.view_count?.toLocaleString() || '0'} 次觀看
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(video.created_at).toLocaleDateString('zh-TW')}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredVideos.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Video className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              沒有找到影片
            </h3>
            <p className="text-gray-600">
              {searchTerm ? '請嘗試不同的搜尋關鍵字' : '開始新增您的第一個影片'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Videos