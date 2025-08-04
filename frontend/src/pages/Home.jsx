import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Play, Youtube, Users, Eye, Star } from 'lucide-react'
import { videoAPI, channelAPI } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

const Home = () => {
  const [featuredVideos, setFeaturedVideos] = useState([])
  const [channelInfo, setChannelInfo] = useState({})
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)

  const [heroRef, heroInView] = useInView({ threshold: 0.1, triggerOnce: true })
  const [statsRef, statsInView] = useInView({ threshold: 0.1, triggerOnce: true })
  const [videosRef, videosInView] = useInView({ threshold: 0.1, triggerOnce: true })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [videosRes, channelRes, statsRes] = await Promise.all([
          videoAPI.getAll({ featured: true, limit: 6 }),
          channelAPI.getInfo(),
          channelAPI.getStats()
        ])

        setFeaturedVideos(videosRes.data.videos)
        setChannelInfo(channelRes.data)
        setStats(statsRes.data)
      } catch (error) {
        console.error('獲取首頁數據失敗:', error)
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
      <section ref={heroRef} className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container-custom py-20 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold mb-6">
              歡迎來到
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">
                CRCRC
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-100 mb-8 max-w-2xl mx-auto">
              專業製作空耳音樂影片的 YouTube 頻道，將流行歌曲重新詮釋成有趣的空耳版本
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://youtube.com/@officialcrcrcyt"
                target="_blank"
                rel="noopener noreferrer"
                className="btn bg-white text-primary-700 hover:bg-gray-100 px-8 py-3 text-lg font-semibold"
              >
                <Youtube className="w-5 h-5 mr-2" />
                訂閱頻道
              </a>
              <Link
                to="/videos"
                className="btn border-2 border-white text-white hover:bg-white hover:text-primary-700 px-8 py-3 text-lg font-semibold"
              >
                <Play className="w-5 h-5 mr-2" />
                觀看影片
              </Link>
            </div>
          </motion.div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-yellow-300/20 rounded-full blur-xl"></div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="py-16 bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={statsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">
                {stats.videoCount || 0}
              </h3>
              <p className="text-gray-600">精彩影片</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">
                {(stats.totalViews || 0).toLocaleString()}
              </h3>
              <p className="text-gray-600">總觀看次數</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">
                {stats.featuredCount || 0}
              </h3>
              <p className="text-gray-600">精選作品</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Videos Section */}
      <section ref={videosRef} className="py-16 bg-gray-50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={videosInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">
                精選影片
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                探索我們最受歡迎的空耳音樂作品
              </p>
            </div>

            {featuredVideos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredVideos.map((video, index) => (
                  <motion.div
                    key={video.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={videosInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                    className="card group hover:shadow-lg transition-all duration-300"
                  >
                    <div className="relative overflow-hidden">
                      <img
                        src={video.thumbnail_url || `https://img.youtube.com/vi/${video.youtube_id}/maxresdefault.jpg`}
                        alt={video.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <Play className="w-12 h-12 text-white" />
                      </div>
                      {video.duration && (
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                          {video.duration}
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {video.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {video.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          {video.view_count?.toLocaleString()} 次觀看
                        </span>
                        <Link
                          to={`/videos/${video.id}`}
                          className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                        >
                          觀看影片
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">暫無精選影片</p>
              </div>
            )}

            <div className="text-center mt-12">
              <Link
                to="/videos"
                className="btn-primary px-8 py-3 text-lg"
              >
                查看所有影片
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-secondary-900 text-white">
        <div className="container-custom text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              加入我們的社群
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              訂閱我們的 YouTube 頻道，加入 Discord 群組，與其他粉絲一起分享音樂的樂趣
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://youtube.com/@officialcrcrcyt"
                target="_blank"
                rel="noopener noreferrer"
                className="btn bg-primary-600 text-white hover:bg-primary-700 px-8 py-3 text-lg"
              >
                <Youtube className="w-5 h-5 mr-2" />
                訂閱 YouTube
              </a>
              <a
                href="https://discord.gg/FyrNaF6Nbj"
                target="_blank"
                rel="noopener noreferrer"
                className="btn border-2 border-white text-white hover:bg-white hover:text-secondary-900 px-8 py-3 text-lg"
              >
                <Users className="w-5 h-5 mr-2" />
                加入 Discord
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default Home