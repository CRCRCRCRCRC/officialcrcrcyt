import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Save,
  Upload,
  Youtube,
  Users,
  Eye,
  Calendar,
  ExternalLink,
  RefreshCw,
  Play
} from 'lucide-react'
import { channelAPI } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'

const Channel = () => {
  const [channelInfo, setChannelInfo] = useState({
    title: '',
    description: '',
    subscriberCount: 0,
    viewCount: 0,
    videoCount: 0,
    thumbnails: {},
    customUrl: '',
    banner_url: '',
    avatar_url: ''
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchChannelInfo()
  }, [])

  const fetchChannelInfo = async () => {
    try {
      // 直接從 YouTube API 獲取數據
      const response = await channelAPI.getYouTubeData()
      setChannelInfo(prev => ({
        ...prev,
        title: response.data.title,
        description: response.data.description,
        subscriberCount: parseInt(response.data.subscriberCount) || 0,
        viewCount: parseInt(response.data.viewCount) || 0,
        videoCount: parseInt(response.data.videoCount) || 0,
        thumbnails: response.data.thumbnails,
        customUrl: `https://youtube.com/@officialcrcrcyt`
      }))
      toast.success('已從 YouTube 獲取最新數據')
    } catch (error) {
      console.error('獲取 YouTube 數據失敗:', error)
      toast.error('無法獲取 YouTube 數據，請檢查 API 設定')
    } finally {
      setLoading(false)
    }
  }

  const refreshYouTubeData = async () => {
    setRefreshing(true)
    try {
      await fetchChannelInfo()
    } finally {
      setRefreshing(false)
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
            <div className="flex space-x-3">
              <motion.button
                onClick={refreshYouTubeData}
                disabled={refreshing}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? '更新中...' : '刷新數據'}
              </motion.button>
              <motion.a
                href={channelInfo.customUrl}
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
              {channelInfo.subscriberCount?.toLocaleString() || '0'}
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
              {channelInfo.viewCount?.toLocaleString() || '0'}
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
              <Play className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent mb-2">
              {channelInfo.videoCount?.toLocaleString() || '0'}
            </h3>
            <p className="text-gray-600 font-medium">影片數量</p>
            <div className="mt-4 text-sm text-gray-500">
              YouTube 頻道影片總數
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

          <div className="space-y-8">
            {/* YouTube 頻道資訊 */}
            <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-6 h-6 bg-gradient-to-r from-red-500 to-pink-600 rounded-lg mr-3"></div>
                YouTube 頻道資訊
                <span className="ml-auto text-sm text-gray-500">自動從 YouTube API 獲取</span>
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">
                    頻道名稱
                  </label>
                  <div className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm text-gray-700">
                    {channelInfo.title || '載入中...'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">
                    頻道連結
                  </label>
                  <div className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm">
                    <a
                      href={channelInfo.customUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-600 hover:text-red-800 transition-colors"
                    >
                      {channelInfo.customUrl || '載入中...'}
                    </a>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-semibold text-gray-800 mb-3">
                  頻道描述
                </label>
                <div className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm text-gray-700 min-h-[120px] whitespace-pre-wrap">
                  {channelInfo.description || '載入中...'}
                </div>
              </div>
            </div>



            {/* 說明文字 */}
            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-green-600 rounded-lg mr-3"></div>
                自動數據同步
              </h3>
              <div className="text-gray-700 space-y-3">
                <p className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  頻道統計數據會自動從 YouTube API 獲取，無需手動輸入
                </p>
                <p className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  點擊「刷新數據」按鈕可獲取最新的頻道資訊
                </p>
                <p className="flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                  只有頻道圖片需要手動上傳管理
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Channel