import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Play, Youtube, Eye, Star, Sparkles, Music, Heart, TrendingUp, Megaphone, Calendar, ChevronRight, ArrowRight, Users } from 'lucide-react'
import { videoAPI, channelAPI, settingsAPI, announcementAPI } from '../services/api'
// import youtubeService from '../services/youtube' // 不再使用前端 YouTube 服務
import LoadingSpinner from '../components/LoadingSpinner'
import YouTubePlayer from '../components/YouTubePlayer'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { formatDuration, formatNumber, decodeHtmlEntities, getThumbnailUrl } from '../utils/formatters'

const Home = () => {
  const [featuredVideos, setFeaturedVideos] = useState([])
  const [channelInfo, setChannelInfo] = useState({})
  const [stats, setStats] = useState({})
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [playerOpen, setPlayerOpen] = useState(false)
  const [currentVideoId, setCurrentVideoId] = useState('')
  const [currentVideoTitle, setCurrentVideoTitle] = useState('')
  const [thumbnailQuality, setThumbnailQuality] = useState('maxres')



  // 播放影片
  const playVideo = (video) => {
    setCurrentVideoId(video.id || video.youtube_id)
    setCurrentVideoTitle(decodeHtmlEntities(video.title))
    setPlayerOpen(true)
  }

  const [heroRef, heroInView] = useInView({ threshold: 0.1, triggerOnce: true })
  const [statsRef, statsInView] = useInView({ threshold: 0.1, triggerOnce: true })
  const [videosRef, videosInView] = useInView({ threshold: 0.1, triggerOnce: true })


  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('正在獲取數據...')

        // 首先嘗試獲取設定的熱門影片
        let featuredVideo = null
        try {
          const featuredResponse = await settingsAPI.getFeaturedVideo()
          featuredVideo = featuredResponse.data.featuredVideo
          setThumbnailQuality(featuredResponse.data.thumbnailQuality || 'maxres')
          console.log('設定的熱門影片:', featuredVideo)
        } catch (error) {
          console.log('沒有設定熱門影片，使用預設')
        }

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

        // 設置 YouTube 數據
        setChannelInfo({
          name: data.channelTitle || 'CRCRC',
          description: '創作空耳與荒野亂鬥內容的頻道，歡迎訂閱！',
          subscriber_count: parseInt(data.subscriberCount) || 0,
          video_count: parseInt(data.totalVideos) || 0,
          view_count: parseInt(data.totalViews) || 0
        })

        setStats({
          totalVideos: parseInt(data.totalVideos) || 0,
          totalViews: parseInt(data.totalViews) || 0,
          totalSubscribers: parseInt(data.subscriberCount) || 0,
          totalLikes: data.latestVideos?.reduce((sum, video) => sum + (video.likeCount || 0), 0) || 0
        })

        // 設置熱門影片：優先使用設定的，否則使用第一個影片
        if (featuredVideo) {
          console.log('使用設定的熱門影片:', featuredVideo.title)
          setFeaturedVideos([featuredVideo])
        } else if (data.latestVideos && data.latestVideos.length > 0) {
          console.log('使用最新影片作為熱門影片:', data.latestVideos[0].title)
          setFeaturedVideos([data.latestVideos[0]])
        } else {
          // 如果還沒有熱門影片，嘗試從數據庫獲取精選影片
          console.log('沒有可用的影片，嘗試獲取精選影片')
          try {
            const featuredVideosResponse = await videoAPI.getFeaturedVideos()
            if (featuredVideosResponse.data && featuredVideosResponse.data.length > 0) {
              console.log('使用精選影片作為熱門影片:', featuredVideosResponse.data[0].title)
              setFeaturedVideos([featuredVideosResponse.data[0]])
            } else {
              console.log('沒有精選影片')
              setFeaturedVideos([])
            }
          } catch (videoError) {
            console.log('獲取精選影片失敗:', videoError)
            setFeaturedVideos([])
          }
        }

        console.log('YouTube 數據獲取成功:', data)

      } catch (error) {
        console.error('獲取 YouTube 數據失敗:', error)
        // 設置空數據
        setChannelInfo({
          name: 'CRCRC',
          description: '創作空耳與荒野亂鬥內容的頻道，歡迎訂閱！',
          subscriber_count: 0,
          video_count: 0,
          view_count: 0
        })
        setStats({
          totalVideos: 0,
          totalViews: 0,
          totalSubscribers: 0,
          totalLikes: 0
        })
        setFeaturedVideos([])
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
        {/* 動態背景 */}
        {/* 動態背景 - 柔和極光波浪 */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 opacity-100 dark:from-gray-900 dark:via-gray-800 dark:to-black transition-colors duration-1000"></div>

        {/* 主要視覺核心 - 呼吸光暈 */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-tr from-blue-400/20 via-purple-500/20 to-pink-400/20 blur-[100px]"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
            rotate: [0, 90, 0]
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* 互動式流動線條 (可選，這裡用簡單的裝飾線代替複雜Canvas) */}
        <div className="absolute inset-0 overflow-hidden">
          <svg className="absolute w-full h-full opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
            <motion.path
              d="M0 50 Q 25 20, 50 50 T 100 50"
              stroke="url(#gradient-line)"
              strokeWidth="0.5"
              fill="none"
              animate={{
                d: [
                  "M0 50 Q 25 30, 50 50 T 100 50",
                  "M0 50 Q 25 70, 50 50 T 100 50",
                  "M0 50 Q 25 30, 50 50 T 100 50"
                ]
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />
            <defs>
              <linearGradient id="gradient-line" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#60A5FA" stopOpacity="0" />
                <stop offset="50%" stopColor="#A78BFA" stopOpacity="1" />
                <stop offset="100%" stopColor="#F472B6" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

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
              <span className="text-white drop-shadow-2xl">歡迎來到</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-300 to-cyan-300 animate-shimmer">
                CRCRC
              </span>
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
                { icon: Heart, text: "創意無限", color: "from-pink-400 to-red-400" },
                { icon: TrendingUp, text: "熱門推薦", color: "from-green-400 to-blue-400" },
                { icon: Star, text: "品質保證", color: "from-yellow-400 to-orange-400" },
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
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-white/20 to-purple-500/10" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.25),transparent_60%)]" />
          <div className="container-custom">
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
          {/* 標題 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={statsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-display font-bold text-gradient mb-4">
              我們的成就
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              用數字見證我們的創作熱情與觀眾的喜愛
            </p>
          </motion.div>

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

      {/* Featured Videos Section */}
      <section ref={videosRef} className="py-24 relative overflow-hidden">
        {/* 背景裝飾 */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-white/35 to-blue-500/10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.55),transparent_60%)]"></div>
        <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-r from-blue-200/30 to-purple-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r from-pink-200/30 to-yellow-200/30 rounded-full blur-3xl"></div>

        <div className="relative container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={videosInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            {/* 標題區塊 */}
            <div className="text-center mb-16">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={videosInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary-500 to-pink-500 rounded-full px-6 py-2 text-white font-medium mb-6"
              >
                <Star className="w-5 h-5 animate-pulse" />
                <span>精選作品</span>
                <Sparkles className="w-5 h-5 animate-bounce" />
              </motion.div>

              <h2 className="text-4xl md:text-6xl font-display font-black text-gradient mb-6">
                熱門影片
              </h2>
              <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                探索我們最受歡迎的作品
              </p>
            </div>

            {featuredVideos.length > 0 ? (
              <div className="max-w-4xl mx-auto">
                {featuredVideos.map((video, index) => (
                  <motion.div
                    key={video.id}
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={videosInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                    transition={{ duration: 0.8, delay: index * 0.15 }}
                    className="group"
                  >
                    <div className="card-gradient p-2 card-hover group-hover:shadow-[0_10px_60px_rgba(236,72,153,0.25)]">
                      {/* 影片縮圖 */}
                      <div className="relative overflow-hidden rounded-2xl aspect-video">
                        <img
                          src={getThumbnailUrl(video, thumbnailQuality)}
                          alt={decodeHtmlEntities(video.title) || '無標題'}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => {
                            // 如果指定解析度失敗，嘗試降級
                            const fallbackUrl = getThumbnailUrl(video, 'high')
                            if (e.target.src !== fallbackUrl) {
                              e.target.src = fallbackUrl
                            }
                          }}
                        />

                        {/* 播放覆蓋層 */}
                        <div
                          className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center cursor-pointer"
                          onClick={() => playVideo(video)}
                        >
                          <motion.div
                            className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Play className="w-8 h-8 text-white ml-1" />
                          </motion.div>
                        </div>

                        {/* 時長標籤 */}
                        {video.duration && (
                          <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full font-medium">
                            {formatDuration(video.duration)}
                          </div>
                        )}

                        {/* 熱門標籤 */}
                        <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-3 py-1 rounded-full font-bold flex items-center space-x-1">
                          <TrendingUp className="w-3 h-3" />
                          <span>熱門</span>
                        </div>
                      </div>

                      {/* 內容區塊 */}
                      <div className="p-6">
                        <h3 className="font-bold text-gray-900 mb-3 line-clamp-2 text-lg group-hover:text-primary-600 transition-colors duration-300">
                          {decodeHtmlEntities(video.title) || '無標題'}
                        </h3>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                          {decodeHtmlEntities(video.description) || '暫無描述'}
                        </p>

                        {/* 底部資訊 */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Eye className="w-4 h-4" />
                            <span>{formatNumber(video.view_count || 0)} 次觀看</span>
                          </div>
                          <Link
                            to={`/videos/${video.id}`}
                            className="btn-small bg-gradient-to-r from-primary-500 to-pink-500 text-white hover:from-primary-600 hover:to-pink-600 group-hover:shadow-lg transition-all duration-300"
                          >
                            觀看
                          </Link>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={videosInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.8 }}
                className="text-center py-16"
              >
                <div className="card-glass p-12 max-w-md mx-auto">
                  <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">暫無精選影片</p>
                  <p className="text-gray-400 text-sm mt-2">敬請期待更多精彩內容</p>
                </div>
              </motion.div>
            )}

            {/* CTA 按鈕 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={videosInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex justify-center mt-16"
            >
              <a
                href="https://youtube.com/@officialcrcrcyt"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 text-white font-bold text-lg rounded-2xl hover:from-primary-600 hover:via-purple-600 hover:to-pink-600 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 group"
              >
                <span>前往 YouTube</span>
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>


      {/* YouTube 播放器 */}
      <YouTubePlayer
        videoId={currentVideoId}
        isOpen={playerOpen}
        onClose={() => setPlayerOpen(false)}
        title={currentVideoTitle}
      />
    </div>
  )
}

export default Home
