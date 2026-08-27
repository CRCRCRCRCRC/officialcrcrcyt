import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Play, Eye, Star, Sparkles, Heart, TrendingUp, Megaphone, Calendar, ChevronRight, ArrowRight, Users } from 'lucide-react'
import { channelAPI, announcementAPI } from '../services/api'
// import youtubeService from '../services/youtube' // 不再使用前端 YouTube 服務
import LoadingSpinner from '../components/LoadingSpinner'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { formatNumber, decodeHtmlEntities } from '../utils/formatters'

const Home = () => {
  const [stats, setStats] = useState({})
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)

  const [heroRef, heroInView] = useInView({ threshold: 0.1, triggerOnce: true })
  const [statsRef, statsInView] = useInView({ threshold: 0.1, triggerOnce: true })
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('正在獲取數據...')

        const dashboardResponse = await channelAPI.getPublicData()
        const data = dashboardResponse.data

        // 獲取最新公告
        try {
          console.log('🏠 首頁：開始獲取公告...')
          const announcementResponse = await announcementAPI.getAll({ limit: 3, published: true })
          const fetchedAnnouncements = announcementResponse.data.announcements || []
          console.log('🏠 首頁：獲取到公告數量:', fetchedAnnouncements.length)
          console.log('🏠 首頁：公告數據:', fetchedAnnouncements)
          setAnnouncements(fetchedAnnouncements)
        } catch (error) {
          console.log('首頁：獲取公告失敗，使用空陣列', error)
          setAnnouncements([])
        }

        setStats({
          totalVideos: parseInt(data.totalVideos) || 0,
          totalViews: parseInt(data.totalViews) || 0,
          totalSubscribers: parseInt(data.subscriberCount) || 0,
          totalLikes: data.latestVideos?.reduce((sum, video) => sum + (video.likeCount || 0), 0) || 0
        })

        console.log('YouTube 數據獲取成功:', data)

      } catch (error) {
        console.error('獲取 YouTube 數據失敗:', error)
        setStats({
          totalVideos: 0,
          totalViews: 0,
          totalSubscribers: 0,
          totalLikes: 0
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="min-h-full">
      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        {/* 靜態漸層背景 - 高效能 */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-purple-600 to-pink-600"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 via-transparent to-yellow-400/10"></div>

        <div className="relative container-custom py-16 lg:py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, ease: "easeOut" }}
            className="max-w-5xl mx-auto p-8 lg:p-12"
          >
            {/* 主標題 */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 1, delay: 0.3 }}
              className="text-5xl md:text-7xl lg:text-8xl font-display font-black mb-8 leading-tight"
            >
              <span className="text-white drop-shadow-2xl">你好。</span>
            </motion.h1>

            {/* 副標題 */}


            {/* 特色標籤 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 1, delay: 0.7 }}
              className="flex flex-wrap items-center justify-center gap-4 mb-12"
            >
              {[
                { icon: Heart, text: "哈哈哈", color: "from-pink-400 to-red-400" },
                { icon: TrendingUp, text: "特別好吃（?", color: "from-green-400 to-blue-400" },
                { icon: Star, text: "嘿嘿嘿", color: "from-yellow-400 to-orange-400" },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={heroInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
                  className={`flex items-center space-x-2 bg-gradient-to-r ${item.color} rounded-full px-4 py-2 text-white font-medium shadow-lg`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm">{item.text}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA 按鈕 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 1, delay: 0.9 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-6"
            >
              <a
                href="https://youtube.com/@officialcrcrcyt"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-large bg-gradient-to-r from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700 shadow-glow-lg"
              >
                <span className="text-lg font-bold">訂閱頻道</span>
              </a>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <a
                  href="https://youtube.com/@officialcrcrcyt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-large btn-ghost"
                >
                  <span className="text-lg font-bold">觀看影片</span>
                </a>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* 底部波浪效果 */}
        <div className="hidden">
          <svg viewBox="0 0 1440 120" className="w-full h-20 fill-white">
            <path d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,64C960,75,1056,85,1152,80C1248,75,1344,53,1392,42.7L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"></path>
          </svg>
        </div>
      </section>

      {/* Announcements Section */}
      {announcements.length > 0 && (
        <section className="py-24 relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/10 via-white/20 to-purple-500/10" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.25),transparent_60%)]" />
          <div className="relative z-10 container-custom">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <div className="flex items-center justify-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Megaphone className="w-6 h-6 text-white" />
                </div>
              </div>
              <h2 className="text-4xl md:text-5xl font-display font-bold text-gradient mb-4">
                最新公告
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                掌握 CRCRC 的最新動態與重要資訊
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {announcements.map((announcement, index) => (
                <motion.div
                  key={announcement.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className="card-gradient overflow-hidden hover:shadow-[0_10px_40px_rgba(59,130,246,0.18)] transition-all duration-500"
                >
                  <Link to={`/announcements/${announcement.slug}`} className="block group">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="w-4 h-4 mr-2" />
                          {(() => {
                            if (!announcement.created_at || announcement.created_at === 'null') {
                              return '未知日期'
                            }

                            let date = new Date(announcement.created_at)
                            if (isNaN(date.getTime())) {
                              date = new Date(announcement.created_at.replace(' ', 'T'))
                              if (isNaN(date.getTime())) {
                                return '日期格式錯誤'
                              }
                            }

                            return date.toLocaleDateString('zh-TW')
                          })()}
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                      </div>

                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {decodeHtmlEntities(announcement.title)}
                      </h3>

                      <div className="text-gray-600 text-sm line-clamp-3">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          disallowedElements={['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'code', 'blockquote']}
                          unwrapDisallowed={true}
                        >
                          {announcement.content.substring(0, 150).replace(/[#*`]/g, '') + (announcement.content.length > 150 ? '...' : '')}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="text-center"
            >
              <Link
                to="/announcements"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                查看所有公告
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      {/* Stats Section */}
      <section ref={statsRef} className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-white/40 to-pink-500/10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(255,255,255,0.6),transparent_60%)]"></div>
        <div className="relative container-custom">
          {/* 統計卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Play,
                value: stats.totalVideos > 0 ? stats.totalVideos.toString() : "0",
                label: "精選作品",
                color: "from-blue-500 to-cyan-500",
                bgColor: "from-blue-50 to-cyan-50",
                delay: 0.2
              },
              {
                icon: Eye,
                value: formatNumber(stats.totalViews || 0),
                label: "總觀看次數",
                color: "from-purple-500 to-pink-500",
                bgColor: "from-purple-50 to-pink-50",
                delay: 0.4
              },
              {
                icon: Users,
                value: stats.totalSubscribers > 0 ? formatNumber(stats.totalSubscribers) : "0",
                label: "訂閱者",
                color: "from-green-500 to-emerald-500",
                bgColor: "from-green-50 to-emerald-50",
                delay: 0.6
              }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={statsInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{ duration: 0.8, delay: stat.delay }}
                className="group"
              >
                <div className={`card-gradient tech-surface bg-gradient-to-br ${stat.bgColor} p-8 text-center card-hover group-hover:shadow-[0_10px_60px_rgba(16,185,129,0.25)]`}>
                  {/* 圖標 */}
                  <motion.div
                    className={`w-20 h-20 bg-gradient-to-r ${stat.color} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300`}
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                  >
                    <stat.icon className="w-10 h-10 text-white" />
                  </motion.div>

                  {/* 數值 */}
                  <motion.h3
                    className="text-4xl md:text-5xl font-display font-black text-gray-900 mb-3"
                    initial={{ scale: 0 }}
                    animate={statsInView ? { scale: 1 } : {}}
                    transition={{ duration: 0.6, delay: stat.delay + 0.3, type: "spring", bounce: 0.4 }}
                  >
                    {stat.value}
                  </motion.h3>

                  {/* 標籤 */}
                  <p className="text-lg font-semibold text-gray-700 group-hover:text-gray-900 transition-colors duration-300">
                    {stat.label}
                  </p>

                  {/* 裝飾線條 */}
                  <div className={`h-1 bg-gradient-to-r ${stat.color} rounded-full mx-auto mt-4 w-12 group-hover:w-20 transition-all duration-300`}></div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* 底部裝飾 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={statsInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 1, delay: 0.8 }}
            className="text-center mt-16"
          >
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary-500 to-pink-500 rounded-full px-6 py-3 text-white font-semibold shadow-lg">
              <Sparkles className="w-5 h-5 animate-pulse" />
              <span>持續創作中...</span>
              <Heart className="w-5 h-5 animate-bounce text-pink-200" />
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  )
}

export default Home
