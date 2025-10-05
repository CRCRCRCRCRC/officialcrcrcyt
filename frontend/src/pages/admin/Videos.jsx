import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { videoAPI, settingsAPI } from '../../services/api'

const Videos = () => {
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
      try {
        const featuredResponse = await settingsAPI.getFeaturedVideo()
        setFeaturedVideoId(featuredResponse.data?.featuredVideo?.id || '')
      } catch (error) {
        console.log('沒有設置熱門影片')
        setFeaturedVideoId('')
      }
    } catch (error) {
      console.error('獲取數據失敗:', error)
      toast.error('獲取數據失敗')
    } finally {
      setLoading(false)
    }
  }

  const handleSetFeatured = async (videoId) => {
    try {
      setSaving(true)
      await settingsAPI.updateFeaturedVideo(videoId)
      setFeaturedVideoId(videoId)
      toast.success('熱門影片設置成功')
    } catch (error) {
      console.error('設置熱門影片失敗:', error)
      toast.error('設置熱門影片失敗')
    } finally {
      setSaving(false)
    }
  }

  const handleUnsetFeatured = async () => {
    try {
      setSaving(true)
      await settingsAPI.updateFeaturedVideo('')
      setFeaturedVideoId('')
      toast.success('熱門影片已取消設置')
    } catch (error) {
      console.error('取消設置熱門影片失敗:', error)
      toast.error('取消設置熱門影片失敗')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">影片管理</h1>
        <Link
          to="/admin/videos/create"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
        >
          添加影片
        </Link>
      </div>

      {/* 熱門影片設置 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">熱門影片設置</h2>
        <div className="flex items-center space-x-4">
          {featuredVideoId ? (
            <>
              <span className="text-gray-700">
                當前熱門影片: {videos.find(v => v.id === featuredVideoId)?.title || '未知影片'}
              </span>
              <button
                onClick={handleUnsetFeatured}
                disabled={saving}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50"
              >
                {saving ? '取消設置中...' : '取消設置'}
              </button>
            </>
          ) : (
            <span className="text-gray-500">尚未設置熱門影片</span>
          )}
        </div>
      </div>

      {/* 影片列表 */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">所有影片</h2>
        </div>
        
        {videos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">暫無影片數據</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    標題
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    YouTube ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    觀看次數
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    精選
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {videos.map((video) => (
                  <tr key={video.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{video.title}</div>
                      <div className="text-sm text-gray-500 line-clamp-2">{video.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {video.youtube_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {video.view_count?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {video.is_featured ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          是
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          否
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSetFeatured(video.id)}
                          disabled={saving || featuredVideoId === video.id}
                          className={`${
                            featuredVideoId === video.id
                              ? 'bg-green-600 hover:bg-green-700'
                              : 'bg-blue-600 hover:bg-blue-700'
                          } text-white px-3 py-1 rounded-md transition-colors duration-200 disabled:opacity-50`}
                        >
                          {featuredVideoId === video.id ? '已設為熱門' : '設為熱門'}
                        </button>
                        <Link
                          to={`/admin/videos/edit/${video.id}`}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-md transition-colors duration-200"
                        >
                          編輯
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Videos