import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart3, 
  Users, 
  Video, 
  TrendingUp, 
  Calendar,
  LogOut,
  Settings,
  Eye
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { videoAPI, channelAPI } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'

const Dashboard = () => {
  const { logout } = useAuth()
  const [stats, setStats] = useState({
    totalVideos: 0,
    totalViews: 0,
    totalSubscribers: 0,
    featuredVideos: 0
  })
  const [recentVideos, setRecentVideos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const defaultStats = {
        totalVideos: 0,
        totalViews: 0,
        totalSubscribers: 0,
        featuredVideos: 0,
      };
      const defaultVideos = [];

      const videosResponse = await videoAPI.getAll({ limit: 5 }).catch((err) => {
        console.error("獲取影片數據失敗:", err);
        toast.error("無法載入最新影片數據。");
        return { data: { videos: defaultVideos } };
      });

      const statsResponse = await channelAPI.getStats().catch((err) => {
        console.error("獲取頻道統計數據失敗:", err);
        toast.error("無法載入頻道統計數據。");
        return { data: defaultStats };
      });

      setRecentVideos(videosResponse.data?.videos || defaultVideos);
      setStats(statsResponse.data || defaultStats);

    } catch (error) {
      console.error('獲取儀表板數據時發生嚴重錯誤:', error);
      toast.error('載入儀表板時發生未知錯誤，請稍後再試。');
      // 即使發生嚴重錯誤，也設置預設數據以防止白屏
      setRecentVideos([]);
      setStats({
        totalVideos: 0,
        totalViews: 0,
        totalSubscribers: 0,
        featuredVideos: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout()
    toast.success('已安全登出')
  }

  const statCards = [
    {
      title: '總影片數',
      value: stats.totalVideos,
      icon: Video,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: '總觀看數',
      value: stats.totalViews?.toLocaleString() || '0',
      icon: Eye,
      color: 'bg-green-500',
      change: '+8%'
    },
    {
      title: '訂閱者',
      value: stats.totalSubscribers?.toLocaleString() || '0',
      icon: Users,
      color: 'bg-purple-500',
      change: '+15%'
    },
    {
      title: '精選影片',
      value: stats.featuredVideos,
      icon: TrendingUp,
      color: 'bg-orange-500',
      change: '+5%'
    }
  ]

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
                管理員儀表板
              </h1>
              <p className="text-gray-600">
                歡迎回來！今天是 {new Date().toLocaleDateString('zh-TW')}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="btn-outline flex items-center"
            >
              <LogOut className="w-4 h-4 mr-2" />
              登出
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="card"
            >
              <div className="flex items-center">
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
                <div className="text-sm text-green-600 font-medium">
                  {stat.change}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Videos */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="card"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                最新影片
              </h2>
              <a href="/admin/videos" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                查看全部
              </a>
            </div>
            
            <div className="space-y-4">
              {recentVideos && recentVideos.length > 0 ? (
                recentVideos.map((video) => (
                  <div key={video.id || Math.random()} className="flex items-center space-x-4">
                    <img
                      src={video.thumbnail_url || `https://img.youtube.com/vi/${video.youtube_id}/default.jpg`}
                      alt={video.title || '影片'}
                      className="w-16 h-12 object-cover rounded bg-gray-200"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA2NCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNiAyMEwyNiAyOEwzMiAyNEwyNiAyMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+'
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {video.title || '無標題'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {video.view_count?.toLocaleString() || '0'} 次觀看
                      </p>
                    </div>
                    {video.is_featured && (
                      <span className="bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full">
                        精選
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">暫無影片數據</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="card"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              快速操作
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <a
                href="/admin/videos/new"
                className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-center"
              >
                <Video className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">新增影片</p>
              </a>
              
              <a
                href="/admin/videos"
                className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-center"
              >
                <BarChart3 className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">影片管理</p>
              </a>
              
              <a
                href="/admin/channel"
                className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-center"
              >
                <Users className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">頻道設定</p>
              </a>
              
              <a
                href="/admin/settings"
                className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-center"
              >
                <Settings className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">系統設定</p>
              </a>
            </div>
          </motion.div>
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="card mt-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            最近活動
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">系統正常運行</p>
                <p className="text-xs text-gray-500">2 分鐘前</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">資料庫備份完成</p>
                <p className="text-xs text-gray-500">1 小時前</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">新影片已發布</p>
                <p className="text-xs text-gray-500">3 小時前</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Dashboard