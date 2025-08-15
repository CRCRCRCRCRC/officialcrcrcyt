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

    </div>
  )
}

export default Dashboard