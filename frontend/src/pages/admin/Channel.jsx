import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Save, 
  Upload, 
  Youtube, 
  Users, 
  Eye,
  Calendar,
  ExternalLink
} from 'lucide-react'
import { channelAPI } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'

const Channel = () => {
  const [channelInfo, setChannelInfo] = useState({
    name: '',
    description: '',
    youtube_url: '',
    subscriber_count: 0,
    total_views: 0,
    banner_url: '',
    avatar_url: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchChannelInfo()
  }, [])

  const fetchChannelInfo = async () => {
    try {
      const response = await channelAPI.getInfo()
      setChannelInfo(response.data)
    } catch (error) {
      console.error('獲取頻道資訊失敗:', error)
      toast.error('載入頻道資訊失敗')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setChannelInfo(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      await channelAPI.updateInfo(channelInfo)
      toast.success('頻道資訊已更新')
    } catch (error) {
      console.error('更新頻道資訊失敗:', error)
      toast.error('更新失敗')
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (type, file) => {
    if (!file) return

    const formData = new FormData()
    formData.append('image', file)
    formData.append('type', type)

    try {
      const response = await channelAPI.uploadImage(formData)
      setChannelInfo(prev => ({
        ...prev,
        [type === 'banner' ? 'banner_url' : 'avatar_url']: response.data.url
      }))
      toast.success('圖片上傳成功')
    } catch (error) {
      toast.error('圖片上傳失敗')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" />
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
                <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <Youtube className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  頻道管理
                </h1>
              </div>
              <p className="text-gray-600 text-lg">
                管理您的 YouTube 頻道資訊與設定
              </p>
            </div>
            <motion.a
              href={channelInfo.youtube_url}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center"
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              查看頻道
            </motion.a>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Channel Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            whileHover={{ scale: 1.02, y: -5 }}
            className="bg-white bg-opacity-80 backdrop-blur-xl rounded-2xl border border-white border-opacity-20 shadow-xl p-8 text-center group hover:shadow-2xl transition-all duration-300"
          >
            <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-pink-600 bg-clip-text text-transparent mb-2">
              {channelInfo.subscriber_count?.toLocaleString() || '0'}
            </h3>
            <p className="text-gray-600 font-medium">訂閱者</p>
            <div className="mt-4 text-sm text-gray-500">
              YouTube 訂閱人數
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            whileHover={{ scale: 1.02, y: -5 }}
            className="bg-white bg-opacity-80 backdrop-blur-xl rounded-2xl border border-white border-opacity-20 shadow-xl p-8 text-center group hover:shadow-2xl transition-all duration-300"
          >
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
              <Eye className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-3xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent mb-2">
              {channelInfo.total_views?.toLocaleString() || '0'}
            </h3>
            <p className="text-gray-600 font-medium">總觀看數</p>
            <div className="mt-4 text-sm text-gray-500">
              累計影片觀看次數
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            whileHover={{ scale: 1.02, y: -5 }}
            className="bg-white bg-opacity-80 backdrop-blur-xl rounded-2xl border border-white border-opacity-20 shadow-xl p-8 text-center group hover:shadow-2xl transition-all duration-300"
          >
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
              <Youtube className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent mb-2">
              {channelInfo.name || 'CRCRC'}
            </h3>
            <p className="text-gray-600 font-medium">頻道名稱</p>
            <div className="mt-4 text-sm text-gray-500">
              YouTube 頻道標識
            </div>
          </motion.div>
        </div>

        {/* Channel Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-white bg-opacity-80 backdrop-blur-xl rounded-2xl border border-white border-opacity-20 shadow-xl p-8"
        >
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Youtube className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              頻道資訊設定
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Channel Name */}
            <div className="bg-gray-50 bg-opacity-50 rounded-xl p-6">
              <label htmlFor="name" className="block text-sm font-semibold text-gray-800 mb-3">
                頻道名稱
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={channelInfo.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 shadow-sm hover:shadow-md"
                placeholder="請輸入頻道名稱"
              />
            </div>

            {/* Channel Description */}
            <div className="bg-gray-50 bg-opacity-50 rounded-xl p-6">
              <label htmlFor="description" className="block text-sm font-semibold text-gray-800 mb-3">
                頻道描述
              </label>
              <textarea
                id="description"
                name="description"
                rows={5}
                value={channelInfo.description}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 shadow-sm hover:shadow-md resize-none"
                placeholder="請輸入頻道描述，介紹您的頻道內容與特色..."
              />
            </div>

            {/* YouTube URL */}
            <div className="bg-gray-50 bg-opacity-50 rounded-xl p-6">
              <label htmlFor="youtube_url" className="block text-sm font-semibold text-gray-800 mb-3">
                YouTube 頻道連結
              </label>
              <input
                type="url"
                id="youtube_url"
                name="youtube_url"
                value={channelInfo.youtube_url}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300 shadow-sm hover:shadow-md"
                placeholder="https://www.youtube.com/@your-channel"
              />
            </div>

            {/* Channel Images */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg mr-3"></div>
                頻道視覺設計
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Avatar */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-4">
                    頻道頭像
                  </label>
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-24 h-24 rounded-full bg-gray-100 border-4 border-white shadow-lg overflow-hidden">
                      {channelInfo.avatar_url ? (
                        <img
                          src={channelInfo.avatar_url}
                          alt="頻道頭像"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center">
                          <Youtube className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload('avatar', e.target.files[0])}
                        className="hidden"
                        id="avatar-upload"
                      />
                      <motion.label
                        htmlFor="avatar-upload"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="cursor-pointer px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        上傳頭像
                      </motion.label>
                    </div>
                  </div>
                </div>

                {/* Banner */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-4">
                    頻道橫幅
                  </label>
                  <div className="space-y-4">
                    <div className="w-full h-32 rounded-xl bg-gray-100 border-4 border-white shadow-lg overflow-hidden">
                      {channelInfo.banner_url ? (
                        <img
                          src={channelInfo.banner_url}
                          alt="頻道橫幅"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center">
                          <Youtube className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex justify-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload('banner', e.target.files[0])}
                        className="hidden"
                        id="banner-upload"
                      />
                      <motion.label
                        htmlFor="banner-upload"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="cursor-pointer px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        上傳橫幅
                      </motion.label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-green-600 rounded-lg mr-3"></div>
                頻道統計數據
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="subscriber_count" className="block text-sm font-semibold text-gray-800 mb-3">
                    訂閱者數量
                  </label>
                  <input
                    type="number"
                    id="subscriber_count"
                    name="subscriber_count"
                    value={channelInfo.subscriber_count}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300 shadow-sm hover:shadow-md"
                    placeholder="0"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    YouTube 頻道的訂閱人數
                  </p>
                </div>

                <div>
                  <label htmlFor="total_views" className="block text-sm font-semibold text-gray-800 mb-3">
                    總觀看數
                  </label>
                  <input
                    type="number"
                    id="total_views"
                    name="total_views"
                    value={channelInfo.total_views}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 shadow-sm hover:shadow-md"
                    placeholder="0"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    所有影片的累計觀看次數
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t border-gray-200">
              <motion.button
                type="submit"
                disabled={saving}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                    儲存中...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-3" />
                    儲存變更
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}

export default Channel