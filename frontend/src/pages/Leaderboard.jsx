import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Medal, Coins, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { coinAPI } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import defaultAvatar from '../assets/default-avatar.svg'

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 處理用戶頭像
  const getUserAvatar = (user) => {
    if (user.avatar_url) {
      // 如果是完整的 URL，直接返回
      if (/^(?:https?:)?\/\//i.test(user.avatar_url)) {
        return user.avatar_url;
      }
      // 如果是相對路徑，添加前綴
      const normalized = user.avatar_url.replace(/^\.?\/+/, '');
      return normalized ? `/${normalized}` : defaultAvatar;
    }
    return defaultAvatar;
  };

  // 獲取用戶顯示名稱並遮蔽中間部分
  const getUserDisplayName = (user) => {
    const displayName = user.display_name || user.displayName || '匿名用戶';
    
    // 如果是匿名用戶，直接返回
    if (displayName === '匿名用戶') {
      return displayName;
    }
    
    // 如果名稱長度小於等於2，只顯示第一個字符
    if (displayName.length <= 2) {
      return `${displayName[0]}*`;
    }
    
    // 否則顯示前一個和後一個字符，中間用星號遮蔽
    const firstChar = displayName[0];
    const lastChar = displayName[displayName.length - 1];
    const maskedLength = displayName.length - 2;
    
    return `${firstChar}${'*'.repeat(maskedLength)}${lastChar}`;
  };;

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true)
        const response = await coinAPI.getLeaderboard(20)
        setLeaderboard(response.data.leaderboard || [])
      } catch (err) {
        setError('無法加載排行榜數據')
        console.error('獲取排行榜數據失敗:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [])

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-xl mb-4">{error}</p>
          <Link to="/" className="text-blue-500 hover:underline">返回首頁</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="border-b border-white/20 bg-white/95 backdrop-blur-xl shadow-sm">
        <div className="mx-auto flex w-full max-w-[1800px] items-center justify-between px-4 py-6 sm:px-16 lg:px-28">
          <Link to="/wallet" className="flex items-center text-gray-600 transition hover:text-gray-900">
            <ArrowLeft className="mr-2 h-5 w-5" />
            返回錢包
          </Link>
          <h1 className="text-2xl font-bold text-transparent bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text">
            CRCRCoin 排行榜
          </h1>
          <div className="w-24"></div> {/* 用於平衡布局 */}
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1800px] px-4 py-12 sm:px-14 lg:px-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[40px] border border-white/20 bg-white/90 px-6 py-8 shadow-2xl backdrop-blur-xl sm:px-10 sm:py-12 lg:px-16 lg:py-16 tech-surface"
        >
          <div className="mb-10 text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg">
                <Trophy className="h-8 w-8" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">富豪榜</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              看看誰是 CRCRCoin 的最大持有者！
            </p>
          </div>

          {leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">暫無排行榜數據</p>
            </div>
          ) : (
            <div className="space-y-4 max-w-4xl mx-auto">
              {leaderboard.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center justify-between p-4 rounded-2xl ${
                    index === 0 
                      ? 'bg-gradient-to-r from-yellow-100 to-yellow-50 border-2 border-yellow-300' 
                      : index === 1 
                        ? 'bg-gradient-to-r from-gray-100 to-gray-50 border-2 border-gray-300' 
                        : index === 2 
                          ? 'bg-gradient-to-r from-orange-100 to-orange-50 border-2 border-orange-300' 
                          : 'bg-white border border-gray-200'
                  } shadow-sm hover:shadow-md transition-shadow tech-surface`}
                >
                  <div className="flex items-center">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                      index === 0 
                        ? 'bg-yellow-400 text-white' 
                        : index === 1 
                          ? 'bg-gray-400 text-white' 
                          : index === 2 
                            ? 'bg-orange-400 text-white' 
                            : 'bg-gray-200 text-gray-700'
                    }`}>
                      {index === 0 ? (
                        <Medal className="w-5 h-5" />
                      ) : (
                        <span className="font-bold">{index + 1}</span>
                      )}
                    </div>
                    <div className="ml-4 flex items-center">
                      <img 
                        src={getUserAvatar(user)} 
                        alt={getUserDisplayName(user)} 
                        className="w-10 h-10 rounded-full object-cover border-2 border-white shadow"
                        onError={(e) => {
                          e.target.src = defaultAvatar;
                        }}
                      />
                      <div className="ml-3">
                        <h3 className="font-semibold text-gray-900">
                          {getUserDisplayName(user)}
                        </h3>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Coins className="w-5 h-5 text-yellow-500 mr-2" />
                    <span className="font-bold text-lg text-gray-900">
                      {Number(user.balance || 0).toLocaleString('zh-TW')}
                    </span>
                    <span className="text-gray-500 ml-1">CRCRCoin</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <div className="mt-12 text-center">
            <div className="inline-flex items-center bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-full font-semibold">
              <Coins className="w-5 h-5 mr-2" />
              繼續努力賺取更多 CRCRCoin 吧！
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Leaderboard
