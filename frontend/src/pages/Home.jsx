import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Play, Youtube, Users, Eye, Star, Sparkles, Music, Heart, TrendingUp, Award, Zap } from 'lucide-react'
import { videoAPI, channelAPI } from '../services/api'
// import youtubeService from '../services/youtube' // 不再使用前端 YouTube 服務
import LoadingSpinner from '../components/LoadingSpinner'

const Home = () => {
  const [featuredVideos, setFeaturedVideos] = useState([])
  const [channelInfo, setChannelInfo] = useState({})
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)

  // 格式化數字顯示
  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toLocaleString()
  }

  const [heroRef, heroInView] = useInView({ threshold: 0.1, triggerOnce: true })
  const [statsRef, statsInView] = useInView({ threshold: 0.1, triggerOnce: true })
  const [videosRef, videosInView] = useInView({ threshold: 0.1, triggerOnce: true })
  const [ctaRef, ctaInView] = useInView({ threshold: 0.1, triggerOnce: true })

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('正在從後端 API 獲取數據...')
        
        // 直接使用後端 API（已集成 YouTube API）
        const [videosResponse, channelResponse, statsResponse] = await Promise.all([
          videoAPI.getAll({ featured: true, limit: 6 }),
          channelAPI.getInfo(),
          channelAPI.getStats()
        ])

        // 設置影片數據
        if (videosResponse.data?.videos) {
          setFeaturedVideos(videosResponse.data.videos)
        }

        // 設置頻道資訊
        if (channelResponse.data) {
          setChannelInfo({
            name: channelResponse.data.title || 'CRCRC',
            description: channelResponse.data.description || '專業製作空耳音樂影片的 YouTube 頻道',
            subscriber_count: parseInt(channelResponse.data.subscriberCount) || 0,
            video_count: parseInt(channelResponse.data.videoCount) || 0,
            view_count: parseInt(channelResponse.data.viewCount) || 0
          })
        }

        // 設置統計數據
        if (statsResponse.data) {
          setStats({
            totalVideos: parseInt(statsResponse.data.videoCount) || 0,
            totalViews: parseInt(statsResponse.data.totalViews) || 0,
            totalSubscribers: parseInt(statsResponse.data.subscriberCount) || 0,
            totalLikes: 0 // 暫時設為 0，可以後續從影片數據計算
          })
        }

        console.log('數據獲取成功:', {
          videos: videosResponse.data?.videos?.length || 0,
          channelInfo: channelResponse.data,
          stats: statsResponse.data
        })

      } catch (error) {
        console.error('獲取首頁數據失敗:', error)
        // 設置默認數據
        setChannelInfo({
          name: 'CRCRC',
          description: '專業空耳音樂創作頻道',
          subscriber_count: 10000,
          video_count: 100,
          view_count: 1000000
        })
        setStats({
          totalVideos: 100,
          totalViews: 1000000,
          totalSubscribers: 10000,
          totalLikes: 50000
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
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* 動態背景 */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-purple-600 to-pink-600"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/30 via-transparent to-yellow-400/30"></div>
        
        {/* 動態粒子效果 */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.2, 0.8, 0.2],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
        
        {/* 漸變光暈 */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-pink-400/30 to-purple-600/30 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-blue-400/30 to-cyan-600/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-yellow-400/20 to-orange-600/20 rounded-full blur-3xl animate-glow"></div>
        
        <div className="relative container-custom py-20 lg:py-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, ease: "easeOut" }}
            className="max-w-5xl mx-auto"
          >
            {/* 標題上方的裝飾 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={heroInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex items-center justify-center mb-8"
            >
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md rounded-full px-6 py-3 border border-white/20">
                <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
                <span className="text-white/90 font-medium">專業空耳音樂創作</span>
                <Music className="w-5 h-5 text-pink-300 animate-bounce" />
              </div>
            </motion.div>
            
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
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 1, delay: 0.5 }}
              className="text-xl md:text-2xl lg:text-3xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed font-light"
            >
              將流行歌曲重新詮釋成
              <span className="text-gradient-warm font-semibold"> 有趣的空耳版本</span>
              <br />
              帶給你前所未有的音樂體驗
            </motion.p>
            
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
                { icon: Award, text: "品質保證", color: "from-yellow-400 to-orange-400" },
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
                <Link
                  to="/videos"
                  className="btn-large btn-ghost"
                >
                  <span className="text-lg font-bold">觀看影片</span>
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
        
        {/* 底部波浪效果 */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" className="w-full h-20 fill-white">
            <path d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,64C960,75,1056,85,1152,80C1248,75,1344,53,1392,42.7L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"></path>
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-primary-50"></div>
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
                value: (stats.totalVideos || 0).toLocaleString(),
                label: "精彩影片",
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
                value: formatNumber(stats.totalSubscribers || 0),
                label: "訂閱人數",
                color: "from-green-500 to-emerald-500",
                bgColor: "from-green-50 to-emerald-50",
                delay: 0.6
              },
              {
                icon: Star,
                value: formatNumber(stats.totalLikes || 0),
                label: "總讚數",
                color: "from-yellow-500 to-orange-500",
                bgColor: "from-yellow-50 to-orange-50",
                delay: 0.8
              }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={statsInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{ duration: 0.8, delay: stat.delay }}
                className="group"
              >
                <div className={`card-gradient bg-gradient-to-br ${stat.bgColor} p-8 text-center card-hover group-hover:shadow-glow`}>
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
        <div className="absolute inset-0 bg-gradient-to-br from-secondary-50 via-white to-primary-50"></div>
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
                探索我們最受歡迎的空耳音樂作品
                <br />
                <span className="text-gradient-warm font-semibold">每一部都是精心製作的藝術品</span>
              </p>
            </div>

            {featuredVideos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredVideos.map((video, index) => (
                  <motion.div
                    key={video.id}
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={videosInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                    transition={{ duration: 0.8, delay: index * 0.15 }}
                    className="group"
                  >
                    <div className="card-gradient p-2 card-hover group-hover:shadow-glow">
                      {/* 影片縮圖 */}
                      <div className="relative overflow-hidden rounded-2xl">
                        <img
                          src={video.thumbnail_url || `https://img.youtube.com/vi/${video.youtube_id}/maxresdefault.jpg`}
                          alt={video.title || '無標題'}
                          className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => {
                            e.target.src = '/api/placeholder/400/225'
                          }}
                        />
                        
                        {/* 播放覆蓋層 */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
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
                            {video.duration}
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
                          {video.title || '無標題'}
                        </h3>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                          {video.description || '暫無描述'}
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
              <Link
                to="/videos"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 text-white font-bold text-lg rounded-2xl hover:from-primary-600 hover:via-purple-600 hover:to-pink-600 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 group"
              >
                <span>查看所有影片</span>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section ref={ctaRef} className="py-24 relative overflow-hidden">
        {/* 動態背景 */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-purple-600 to-pink-600"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        
        {/* 動畫背景元素 */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-float"></div>
        <div className="absolute top-32 right-20 w-24 h-24 bg-yellow-300/20 rounded-full blur-lg animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-pink-300/15 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-32 right-1/3 w-28 h-28 bg-blue-300/20 rounded-full blur-xl animate-float" style={{ animationDelay: '0.5s' }}></div>
        
        {/* 粒子效果 */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/30 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            ></div>
          ))}
        </div>
        
        <div className="relative container-custom">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={ctaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1 }}
            className="text-center"
          >
            {/* 標題裝飾 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={ctaInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md rounded-full px-6 py-3 text-white font-medium mb-8 border border-white/30"
            >
              <Zap className="w-5 h-5 animate-pulse" />
              <span>立即加入</span>
              <Heart className="w-5 h-5 animate-bounce" />
            </motion.div>
            
            {/* 主標題 */}
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={ctaInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-4xl md:text-6xl lg:text-7xl font-display font-black text-white mb-6 leading-tight"
            >
              準備好體驗
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-300 to-blue-300 animate-shimmer">
                空耳音樂
              </span>
              <br />
              的魅力了嗎？
            </motion.h2>
            
            {/* 副標題 */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={ctaInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed"
            >
              加入我們的社群，一起探索音樂的無限可能
              <br />
              <span className="text-yellow-300 font-semibold">讓每一個音符都充滿驚喜</span>
            </motion.p>
            
            {/* CTA 按鈕組 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={ctaInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            >
              <Link
                to="/videos"
                className="group relative overflow-hidden bg-white text-primary-600 w-48 h-14 rounded-xl font-bold text-base hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 border border-gray-200 hover:border-gray-300 flex items-center justify-center"
              >
                <span className="relative">觀看影片</span>
              </Link>
              
              <a
                href="https://youtube.com/@officialcrcrcyt"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden bg-red-600 text-white w-48 h-14 rounded-xl font-bold text-base hover:bg-red-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 border border-red-600 hover:border-red-700 flex items-center justify-center"
              >
                <span className="relative">訂閱頻道</span>
              </a>
            </motion.div>
            
            {/* 底部裝飾 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={ctaInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 1, delay: 0.8 }}
              className="mt-16 flex justify-center items-center space-x-8"
            >
              <div className="flex items-center space-x-2 text-white/70">
                <Users className="w-5 h-5" />
                <span className="text-sm">10,000+ 訂閱者</span>
              </div>
              <div className="w-px h-6 bg-white/30"></div>
              <div className="flex items-center space-x-2 text-white/70">
                <Award className="w-5 h-5" />
                <span className="text-sm">100+ 精選作品</span>
              </div>
              <div className="w-px h-6 bg-white/30"></div>
              <div className="flex items-center space-x-2 text-white/70">
                <Heart className="w-5 h-5" />
                <span className="text-sm">無限創意</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default Home