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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-display font-bold text-gray-900">
                頻道管理
              </h1>
              <p className="text-gray-600">
                管理您的 YouTube 頻道資訊
              </p>
            </div>
            <a
              href={channelInfo.youtube_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline flex items-center"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              查看頻道
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Channel Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="card text-center"
          >
            <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {channelInfo.subscriber_count?.toLocaleString() || '0'}
            </h3>
            <p className="text-gray-600">訂閱者</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="card text-center"
          >
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {channelInfo.total_views?.toLocaleString() || '0'}
            </h3>
            <p className="text-gray-600">總觀看數</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="card text-center"
          >
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Youtube className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              CRCRC
            </h3>
            <p className="text-gray-600">頻道名稱</p>
          </motion.div>
        </div>

        {/* Channel Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="card"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            頻道資訊設定
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Channel Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                頻道名稱
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={channelInfo.name}
                onChange={handleInputChange}
                className="input"
                placeholder="請輸入頻道名稱"
              />
            </div>

            {/* Channel Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                頻道描述
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={channelInfo.description}
                onChange={handleInputChange}
                className="input"
                placeholder="請輸入頻道描述"
              />
            </div>

            {/* YouTube URL */}
            <div>
              <label htmlFor="youtube_url" className="block text-sm font-medium text-gray-700 mb-2">
                YouTube 頻道連結
              </label>
              <input
                type="url"
                id="youtube_url"
                name="youtube_url"
                value={channelInfo.youtube_url}
                onChange={handleInputChange}
                className="input"
                placeholder="https://www.youtube.com/@your-channel"
              />
            </div>

            {/* Channel Images */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Avatar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  頻道頭像
                </label>
                <div className="flex items-center space-x-4">
                  {channelInfo.avatar_url && (
                    <img
                      src={channelInfo.avatar_url}
                      alt="頻道頭像"
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload('avatar', e.target.files[0])}
                      className="hidden"
                      id="avatar-upload"
                    />
                    <label
                      htmlFor="avatar-upload"
                      className="btn-outline cursor-pointer flex items-center"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      上傳頭像
                    </label>
                  </div>
                </div>
              </div>

              {/* Banner */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  頻道橫幅
                </label>
                <div className="space-y-2">
                  {channelInfo.banner_url && (
                    <img
                      src={channelInfo.banner_url}
                      alt="頻道橫幅"
                      className="w-full h-24 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload('banner', e.target.files[0])}
                      className="hidden"
                      id="banner-upload"
                    />
                    <label
                      htmlFor="banner-upload"
                      className="btn-outline cursor-pointer flex items-center"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      上傳橫幅
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="subscriber_count" className="block text-sm font-medium text-gray-700 mb-2">
                  訂閱者數量
                </label>
                <input
                  type="number"
                  id="subscriber_count"
                  name="subscriber_count"
                  value={channelInfo.subscriber_count}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="0"
                />
              </div>

              <div>
                <label htmlFor="total_views" className="block text-sm font-medium text-gray-700 mb-2">
                  總觀看數
                </label>
                <input
                  type="number"
                  id="total_views"
                  name="total_views"
                  value={channelInfo.total_views}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary flex items-center"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    儲存中...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    儲存變更
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}

export default Channel