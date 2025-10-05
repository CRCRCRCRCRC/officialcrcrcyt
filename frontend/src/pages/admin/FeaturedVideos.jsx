import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { videoAPI, settingsAPI } from '../../services/api'

const FeaturedVideos = () => {
  const [videos, setVideos] = useState([])
  const [featuredVideoId, setFeaturedVideoId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // 獲取所有影片
      const videosResponse = await videoAPI.getAll()
      setVideos(videosResponse.data || [])
      
      // 獲取當前設置的熱門影片
      const settingsResponse = await settingsAPI.getFeaturedVideo()
      if (settingsResponse.data && settingsResponse.data.featuredVideo) {
        setFeaturedVideoId(settingsResponse.data.featuredVideo.id)
      }
    } catch (error) {
      console.error('獲取數據失敗:', error)
      toast.error('獲取數據失敗: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      if (!featuredVideoId) {
        toast.error('請選擇一個熱門影片')
        return
      }
      
      await settingsAPI.updateFeaturedVideo(featuredVideoId)
      toast.success('熱門影片設置成功')
    } catch (error) {
      console.error('設置熱門影片失敗:', error)
      toast.error('設置熱門影片失敗: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleClear = async () => {
    try {
      setSaving(true)
      setFeaturedVideoId('')
      
      // 通過傳遞空的 videoId 來清除設置
      await settingsAPI.updateFeaturedVideo('')
      toast.success('熱門影片已清除')
    } catch (error) {
      console.error('清除熱門影片失敗:', error)
      toast.error('清除熱門影片失敗: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">熱門影片管理</h1>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            選擇熱門影片
          </label>
          <select
            value={featuredVideoId}
            onChange={(e) => setFeaturedVideoId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">請選擇熱門影片</option>
            {videos.map((video) => (
              <option key={video.id} value={video.youtube_id || video.id}>
                {video.title} ({video.youtube_id || video.id})
              </option>
            ))}
          </select>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存設置'}
          </button>
          
          <button
            onClick={handleClear}
            disabled={saving}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {saving ? '清除中...' : '清除設置'}
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">所有影片</h2>
        {videos.length === 0 ? (
          <p className="text-gray-500">暫無影片數據</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((video) => (
              <div key={video.id} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 truncate">{video.title}</h3>
                <p className="text-sm text-gray-500 mt-1">ID: {video.youtube_id || video.id}</p>
                <p className="text-sm text-gray-500">觀看次數: {video.view_count || 0}</p>
                {video.is_featured && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mt-2">
                    精選
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default FeaturedVideos