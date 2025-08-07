import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Settings as SettingsIcon,
  Save,
  RefreshCw,
  Star,
  Play,
  Eye,
  Calendar
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

// 解碼 HTML 實體
const decodeHtmlEntities = (text) => {
  if (!text) return text;
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

const Settings = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [availableVideos, setAvailableVideos] = useState([])
  const [featuredVideoId, setFeaturedVideoId] = useState('')
  const [thumbnailQuality, setThumbnailQuality] = useState('maxres')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('/api/settings', {
        headers: { Authorization: `Bearer ${token}` }
      })

      setAvailableVideos(response.data.availableVideos || [])
      setFeaturedVideoId(response.data.featuredVideoId || '')
      setThumbnailQuality(response.data.thumbnailQuality || 'maxres')
    } catch (error) {
      console.error('獲取設定失敗:', error)
      toast.error('載入設定失敗')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveFeaturedVideo = async () => {
    if (!featuredVideoId) {
      toast.error('請選擇一個影片')
      return
    }

    setSaving(true)

    try {
      const token = localStorage.getItem('token')
      await axios.post('/api/settings/featured-video',
        {
          videoId: featuredVideoId,
          thumbnailQuality: thumbnailQuality
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success('熱門影片設定已更新！\n注意：要持久化此設定，請在 Vercel 環境變數中設置 FEATURED_VIDEO_ID', {
        duration: 6000
      })
    } catch (error) {
      console.error('更新熱門影片設定失敗:', error)
      toast.error('更新設定失敗')
    } finally {
      setSaving(false)
    }
  }

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num?.toLocaleString() || '0'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">載入設定中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <div className="bg-white bg-opacity-80 backdrop-blur-xl border-b border-white border-opacity-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <SettingsIcon className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  網站設定
                </h1>
              </div>
              <p className="text-gray-600 text-lg">
                設定首頁熱門影片
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white bg-opacity-80 backdrop-blur-xl rounded-2xl border border-white border-opacity-20 shadow-xl p-8"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                熱門影片設定
              </h2>
            </div>
            <motion.button
              onClick={fetchSettings}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              重新載入
            </motion.button>
          </div>

          <div className="space-y-6">
            {/* 縮圖解析度設定 */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-4">
                縮圖解析度設定
              </label>
              <p className="text-gray-600 text-sm mb-4">
                選擇熱門影片縮圖的解析度品質
              </p>
              <select
                value={thumbnailQuality}
                onChange={(e) => setThumbnailQuality(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <option value="maxres">最高解析度 (1280x720)</option>
                <option value="standard">標準解析度 (640x480)</option>
                <option value="high">高解析度 (480x360)</option>
                <option value="medium">中等解析度 (320x180)</option>
                <option value="default">預設解析度 (120x90)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-4">
                選擇首頁熱門影片
              </label>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-yellow-800 text-sm">
                  <strong>重要提示：</strong> 此設定在重新部署後會重置。要持久化保存，請在 Vercel 環境變數中設置：
                </p>
                <ul className="text-yellow-700 text-xs mt-2 ml-4 list-disc">
                  <li><code>FEATURED_VIDEO_ID</code> = 選中的影片ID</li>
                  <li><code>THUMBNAIL_QUALITY</code> = 選中的縮圖品質</li>
                </ul>
              </div>
              <p className="text-gray-600 text-sm mb-6">
                從你的 YouTube 頻道中選擇一個影片作為首頁的熱門影片展示
              </p>

              {availableVideos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                  {availableVideos.map((video) => (
                    <motion.div
                      key={video.id}
                      whileHover={{ scale: 1.02 }}
                      className={`relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                        featuredVideoId === video.id
                          ? 'border-blue-500 shadow-lg'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setFeaturedVideoId(video.id)}
                    >
                      <div className="aspect-video relative">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <Play className="w-8 h-8 text-white" />
                        </div>
                        {featuredVideoId === video.id && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <Star className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-2">
                          {decodeHtmlEntities(video.title)}
                        </h3>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="flex items-center">
                            <Eye className="w-3 h-3 mr-1" />
                            {formatNumber(video.viewCount)}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(video.publishedAt).toLocaleDateString('zh-TW')}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>沒有可用的影片</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-6 border-t border-gray-200">
              <motion.button
                onClick={handleSaveFeaturedVideo}
                disabled={saving || !featuredVideoId}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-3 animate-spin" />
                    儲存中...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-3" />
                    儲存設定
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Settings
