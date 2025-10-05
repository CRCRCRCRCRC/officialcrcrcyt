import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { videoAPI } from '../../services/api'

const VideoForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = !!id

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    youtube_id: '',
    thumbnail_url: '',
    duration: '',
    view_count: 0,
    published_at: '',
    is_featured: false,
    tags: ''
  })

  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isEditing) {
      fetchVideo()
    }
  }, [id])

  const fetchVideo = async () => {
    try {
      setLoading(true)
      const response = await videoAPI.getById(id)
      const video = response.data
      
      setFormData({
        title: video.title || '',
        description: video.description || '',
        youtube_id: video.youtube_id || '',
        thumbnail_url: video.thumbnail_url || '',
        duration: video.duration || '',
        view_count: video.view_count || 0,
        published_at: video.published_at ? video.published_at.split('T')[0] : '',
        is_featured: video.is_featured || false,
        tags: video.tags || ''
      })
    } catch (error) {
      console.error('獲取影片失敗:', error)
      toast.error('獲取影片失敗')
      navigate('/admin/videos')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // 驗證必要字段
    if (!formData.title.trim()) {
      toast.error('請輸入影片標題')
      return
    }
    
    if (!formData.youtube_id.trim()) {
      toast.error('請輸入 YouTube ID')
      return
    }

    try {
      setSubmitting(true)
      
      const videoData = {
        ...formData,
        view_count: parseInt(formData.view_count) || 0
      }

      if (isEditing) {
        await videoAPI.update(id, videoData)
        toast.success('影片更新成功')
      } else {
        await videoAPI.create(videoData)
        toast.success('影片創建成功')
      }
      
      navigate('/admin/videos')
    } catch (error) {
      console.error('保存影片失敗:', error)
      toast.error('保存影片失敗: ' + (error.response?.data?.error || error.message))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading && isEditing) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/videos')}
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          ← 返回影片列表
        </button>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">
          {isEditing ? '編輯影片' : '添加影片'}
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                影片標題 *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="輸入影片標題"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                YouTube ID *
              </label>
              <input
                type="text"
                name="youtube_id"
                value={formData.youtube_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="輸入 YouTube ID"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                縮圖 URL
              </label>
              <input
                type="text"
                name="thumbnail_url"
                value={formData.thumbnail_url}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="輸入縮圖 URL"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                影片時長
              </label>
              <input
                type="text"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="例如: PT5M30S"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                觀看次數
              </label>
              <input
                type="number"
                name="view_count"
                value={formData.view_count}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="輸入觀看次數"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                發布日期
              </label>
              <input
                type="date"
                name="published_at"
                value={formData.published_at}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              影片描述
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="輸入影片描述"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              標籤
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="輸入標籤，用逗號分隔"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_featured"
              checked={formData.is_featured}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              設為精選影片
            </label>
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors duration-200 disabled:opacity-50"
            >
              {submitting ? '保存中...' : '保存影片'}
            </button>
            
            <button
              type="button"
              onClick={() => navigate('/admin/videos')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md font-medium transition-colors duration-200"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default VideoForm