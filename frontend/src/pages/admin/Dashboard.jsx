import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3,
  Users,
  Video,
  TrendingUp,
  Calendar,
  Eye,
  Play,
  Heart,
  Star,
  Zap,
  ArrowUp,
  ArrowDown,
  Clock,
  Globe,
  Sparkles,
  Activity,
  Settings,
  RefreshCw
} from 'lucide-react'
import { videoAPI, channelAPI } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'

// 解碼 HTML 實體
const decodeHtmlEntities = (text) => {
  if (!text) return text;
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalVideos: 0,
    totalViews: 0,
    totalSubscribers: 0,
    featuredVideos: 0
  })
  const [recentVideos, setRecentVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [timeRange, setTimeRange] = useState('7d')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await channelAPI.getDashboard();
      const data = response.data;

      setStats({
        totalVideos: parseInt(data.totalVideos) || 0,
        totalViews: parseInt(data.totalViews) || 0,
        totalSubscribers: parseInt(data.subscriberCount) || 0,
        featuredVideos: data.latestVideos?.length || 0
      });

      setRecentVideos(data.latestVideos || []);
      toast.success('已從 YouTube 獲取最新數據');
    } catch (error) {
      console.error('獲取 YouTube 儀表板數據失敗:', error);
      toast.error('無法載入 YouTube 數據，請檢查 API 設置');

      // 設置空數據
      setStats({
        totalVideos: 0,
        totalViews: 0,
        totalSubscribers: 0,
        featuredVideos: 0
      });
      setRecentVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await fetchDashboardData();
    } finally {
      setRefreshing(false);
    }
  };



  const handleLogout = () => {
    logout()
    toast.success('已安全登出')
  }

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num?.toLocaleString() || '0'
  }

  const statCards = [
    {
      title: '總影片數',
      value: stats.totalVideos?.toLocaleString() || '0',
      icon: Video,
      gradient: 'from-blue-500 to-cyan-500',
      change: 'YouTube 同步',
      trend: 'up',
      description: 'YouTube 頻道影片總數'
    },
    {
      title: '總觀看次數',
      value: formatNumber(stats.totalViews),
      icon: Eye,
      gradient: 'from-emerald-500 to-teal-500',
      change: 'YouTube 同步',
      trend: 'up',
      description: '所有影片累計觀看數'
    },
    {
      title: '訂閱者數',
      value: formatNumber(stats.totalSubscribers),
      icon: Users,
      gradient: 'from-purple-500 to-pink-500',
      change: 'YouTube 同步',
      trend: 'up',
      description: 'YouTube 頻道訂閱人數'
    },
    {
      title: '最新影片',
      value: stats.featuredVideos?.toLocaleString() || '0',
      icon: Star,
      gradient: 'from-orange-500 to-red-500',
      change: '即時更新',
      trend: 'up',
      description: '最近發布的影片數量'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">載入儀表板數據中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-8 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  歡迎回來！ 👋
                </h1>
                <p className="text-blue-100 text-lg">
                  今天是 {new Date().toLocaleDateString('zh-TW', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long'
                  })}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <motion.button
                  onClick={refreshData}
                  disabled={refreshing}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl text-white font-medium hover:bg-white/30 transition-all duration-300 flex items-center disabled:opacity-50"
                >
                  <RefreshCw className={`w-5 h-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? '更新中...' : '刷新數據'}
                </motion.button>
                <div className="hidden md:block">
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-16 -translate-x-16"></div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="relative group h-full"
          >
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden h-full flex flex-col">
              {/* Background gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>

              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-14 h-14 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                    <stat.icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex items-center space-x-1">
                    {stat.trend === 'up' ? (
                      <ArrowUp className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <ArrowDown className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`text-sm font-semibold ${stat.trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
                      {stat.change}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 flex-1">
                  <h3 className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </h3>
                  <p className="text-3xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500">
                    {stat.description}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Videos */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="lg:col-span-2"
        >
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Video className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  最新影片
                </h2>
              </div>
              <a
                href="/admin/videos"
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 text-sm font-medium"
              >
                查看全部
                <ArrowUp className="w-4 h-4 ml-2 rotate-45" />
              </a>
            </div>

            <div className="space-y-4">
              {recentVideos && recentVideos.length > 0 ? (
                recentVideos.map((video, index) => (
                  <motion.div
                    key={video.id || Math.random()}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="group flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-50 transition-all duration-300"
                  >
                    <div className="relative">
                      <img
                        src={video.thumbnails?.medium?.url || video.thumbnail_url || `https://img.youtube.com/vi/${video.id || video.youtube_id}/mqdefault.jpg`}
                        alt={video.title || '影片'}
                        className="w-20 h-14 object-cover rounded-lg bg-gray-200 group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA2NCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNiAyMEwyNiAyOEwzMiAyNEwyNiAyMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+'
                        }}
                      />
                      <div className="absolute inset-0 bg-black/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <Play className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <a
                        href={video.url || `https://www.youtube.com/watch?v=${video.id || video.youtube_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors block"
                      >
                        {decodeHtmlEntities(video.title) || '無標題'}
                      </a>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-gray-500 flex items-center">
                          <Eye className="w-3 h-3 mr-1" />
                          {(video.viewCount || video.view_count || 0).toLocaleString()} 次觀看
                        </span>
                        {video.likeCount && (
                          <span className="text-xs text-gray-500 flex items-center">
                            <Heart className="w-3 h-3 mr-1" />
                            {video.likeCount.toLocaleString()}
                          </span>
                        )}
                        <span className="text-xs text-gray-500 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {video.publishedAt ? new Date(video.publishedAt).toLocaleDateString('zh-TW') : '未知'}
                        </span>
                      </div>
                    </div>
                    {(video.is_featured || video.likeCount > 1000) && (
                      <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-3 py-1 rounded-full font-medium flex items-center">
                        <Star className="w-3 h-3 mr-1" />
                        {video.is_featured ? '精選' : '熱門'}
                      </span>
                    )}
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Video className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">暫無影片數據</p>
                  <p className="text-gray-400 text-xs mt-1">開始上傳您的第一部影片吧！</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Quick Actions & Analytics */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  快速操作
                </h2>
              </div>

              <div className="space-y-3">
                <a
                  href="/admin/videos"
                  className="group flex items-center p-4 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 border border-transparent hover:border-blue-200"
                >
                  <div className="w-10 h-10 bg-blue-100 group-hover:bg-blue-500 rounded-lg flex items-center justify-center transition-colors">
                    <Video className="w-5 h-5 text-blue-600 group-hover:text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-gray-900">影片管理</p>
                    <p className="text-sm text-gray-500">管理所有影片內容</p>
                  </div>
                </a>

                <a
                  href="/admin/channel"
                  className="group flex items-center p-4 rounded-xl hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-300 border border-transparent hover:border-purple-200"
                >
                  <div className="w-10 h-10 bg-purple-100 group-hover:bg-purple-500 rounded-lg flex items-center justify-center transition-colors">
                    <Users className="w-5 h-5 text-purple-600 group-hover:text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-gray-900">頻道設定</p>
                    <p className="text-sm text-gray-500">編輯頻道資訊</p>
                  </div>
                </a>

                <a
                  href="/admin/settings"
                  className="group flex items-center p-4 rounded-xl hover:bg-gradient-to-r hover:from-green-50 hover:to-teal-50 transition-all duration-300 border border-transparent hover:border-green-200"
                >
                  <div className="w-10 h-10 bg-green-100 group-hover:bg-green-500 rounded-lg flex items-center justify-center transition-colors">
                    <Settings className="w-5 h-5 text-green-600 group-hover:text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-gray-900">系統設定</p>
                    <p className="text-sm text-gray-500">配置系統參數</p>
                  </div>
                </a>
              </div>
            </div>
          </motion.div>

          {/* Performance Overview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  本週表現
                </h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">影片上傳</span>
                  <span className="text-sm font-semibold text-gray-900">3 部</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">新增觀看</span>
                  <span className="text-sm font-semibold text-green-600">+2.4K</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">新訂閱者</span>
                  <span className="text-sm font-semibold text-blue-600">+127</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">互動率</span>
                  <span className="text-sm font-semibold text-purple-600">8.2%</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.0 }}
        className="mt-8"
      >
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              系統活動
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">系統正常運行</p>
                <p className="text-xs text-gray-500 flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  2 分鐘前
                </p>
              </div>
              <div className="w-2 h-2 bg-green-100 rounded-full"></div>
            </div>

            <div className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">資料庫同步完成</p>
                <p className="text-xs text-gray-500 flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  1 小時前
                </p>
              </div>
              <div className="w-2 h-2 bg-blue-100 rounded-full"></div>
            </div>

            <div className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">新影片已發布</p>
                <p className="text-xs text-gray-500 flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  3 小時前
                </p>
              </div>
              <div className="w-2 h-2 bg-purple-100 rounded-full"></div>
            </div>

            <div className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">YouTube API 同步</p>
                <p className="text-xs text-gray-500 flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  6 小時前
                </p>
              </div>
              <div className="w-2 h-2 bg-orange-100 rounded-full"></div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Dashboard