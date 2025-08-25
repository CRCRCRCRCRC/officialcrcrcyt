import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import {
  Users,
  Music,
  Heart,
  Award,
  Youtube,
  Calendar,
  Eye,
  Video,
  Play,
  Star
} from 'lucide-react'
import { channelAPI } from '../services/api'
import { formatNumber, decodeHtmlEntities } from '../utils/formatters'
import LoadingSpinner from '../components/LoadingSpinner'

const About = () => {
  const [channelInfo, setChannelInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [heroRef, heroInView] = useInView({ threshold: 0.1, triggerOnce: true })
  const [statsRef, statsInView] = useInView({ threshold: 0.1, triggerOnce: true })
  const [featuresRef, featuresInView] = useInView({ threshold: 0.1, triggerOnce: true })

  useEffect(() => {
    const fetchChannelInfo = async () => {
      try {
        setLoading(true)
        const response = await channelAPI.getPublicData()
        const data = response.data

        setChannelInfo({
          title: data.channelTitle || 'CRCRC',
          description: '創作空耳與荒野亂鬥內容的頻道，歡迎訂閱，一起玩音樂玩遊戲！',
          customUrl: data.customUrl || 'https://youtube.com/@officialcrcrcyt',
          thumbnails: data.channelThumbnails || {},
          subscriberCount: parseInt(data.subscriberCount) || 0,
          videoCount: parseInt(data.videoCount) || 0,
          viewCount: parseInt(data.totalViews) || 0,
          publishedAt: data.publishedAt || new Date().toISOString(),
          country: data.country || 'TW'
        })
      } catch (error) {
        console.error('獲取頻道資訊失敗:', error)
        setError('無法載入頻道資訊')
        // 設置預設資訊
        setChannelInfo({
          title: 'CRCRC',
          description: '創作空耳與荒野亂鬥內容的頻道，歡迎訂閱，一起玩音樂玩遊戲！',
          customUrl: 'https://youtube.com/@officialcrcrcyt',
          thumbnails: {},
          subscriberCount: 0,
          videoCount: 0,
          viewCount: 0,
          publishedAt: new Date().toISOString(),
          country: 'TW'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchChannelInfo()
  }, [])

  const features = [
    {
      icon: Music,
      title: '空耳音樂創作',
      description: '專注於創作高質量的空耳音樂作品，為觀眾帶來歡樂與驚喜。'
    },
    {
      icon: Users,
      title: '社群互動',
      description: '與粉絲建立緊密聯繫，共同分享音樂創作的樂趣。'
    },
    {
      icon: Heart,
      title: '用心製作',
      description: '每一個作品都經過精心製作，追求完美的視聽體驗。'
    },
    {
      icon: Award,
      title: '品質保證',
      description: '堅持原創，保證每個作品的獨特性和高品質。'
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
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-600 to-secondary-600 text-white">
        <div className="container-custom py-20">
          <motion.div
            ref={heroRef}
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* 頻道頭像 */}
            {channelInfo?.thumbnails?.high?.url && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={heroInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mb-8"
              >
                <img
                  src={channelInfo.thumbnails.high.url}
                  alt={channelInfo.title}
                  className="w-32 h-32 rounded-full mx-auto border-4 border-white/20 shadow-2xl"
                />
              </motion.div>
            )}

            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6">
              關於 {channelInfo?.title || 'CRCRC'}
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 max-w-3xl mx-auto leading-relaxed">
              {decodeHtmlEntities(channelInfo?.description) || '專業空耳音樂創作頻道，致力於為觀眾帶來歡樂與驚喜'}
            </p>

            {/* YouTube 連結 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-8"
            >
              <a
                href={channelInfo?.customUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors duration-300"
              >
                <Youtube className="w-5 h-5 mr-2" />
                訂閱我們的頻道
              </a>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Story Section */}
      <div className="container-custom py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-6">
              我們的故事
            </h2>
            <div className="w-24 h-1 bg-primary-600 mx-auto mb-8"></div>
          </div>

          <div className="prose prose-lg prose-gray max-w-none">
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              CRCRC 成立於 2021 年，起初只是幾個熱愛音樂的朋友聚在一起，分享對空耳音樂的熱情。
              我們發現，通過創意的重新詮釋，可以讓經典歌曲煥發新的生命力，同時為觀眾帶來歡笑。
            </p>
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              隨著時間的推移，我們的團隊逐漸壯大，作品質量不斷提升。我們不僅專注於空耳創作，
              還致力於音樂教育和社群建設，希望能夠啟發更多人對音樂創作的興趣。
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              今天，CRCRC 已經成為空耳音樂領域的知名品牌，我們將繼續創作優質內容，
              與全球觀眾分享音樂的魅力。
            </p>
          </div>
        </motion.div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-16">
        <div className="container-custom">
          <motion.div
            ref={featuresRef}
            initial={{ opacity: 0, y: 20 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-6">
              我們的特色
            </h2>
            <div className="w-24 h-1 bg-primary-600 mx-auto"></div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gray-900 text-white py-16">
        <div className="container-custom">
          <motion.div
            ref={statsRef}
            initial={{ opacity: 0, y: 20 }}
            animate={statsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
              頻道數據
            </h2>
            <div className="w-24 h-1 bg-primary-500 mx-auto"></div>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={statsInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: 1 }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-bold text-primary-400 mb-2">
                {formatNumber(channelInfo?.subscriberCount || 0)}
              </div>
              <div className="text-gray-300 text-lg flex items-center justify-center">
                <Users className="w-5 h-5 mr-2" />
                訂閱者
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={statsInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: 1.1 }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-bold text-primary-400 mb-2">
                {formatNumber(channelInfo?.videoCount || 0)}
              </div>
              <div className="text-gray-300 text-lg flex items-center justify-center">
                <Video className="w-5 h-5 mr-2" />
                影片數量
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={statsInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: 1.2 }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-bold text-primary-400 mb-2">
                {formatNumber(channelInfo?.viewCount || 0)}
              </div>
              <div className="text-gray-300 text-lg flex items-center justify-center">
                <Eye className="w-5 h-5 mr-2" />
                總觀看數
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={statsInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: 1.3 }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-bold text-primary-400 mb-2">
                {channelInfo?.publishedAt ? new Date().getFullYear() - new Date(channelInfo.publishedAt).getFullYear() : 0}+
              </div>
              <div className="text-gray-300 text-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 mr-2" />
                創作年數
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="container-custom py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-6">
            我們的使命
          </h2>
          <div className="w-24 h-1 bg-primary-600 mx-auto mb-8"></div>
          <p className="text-xl text-gray-700 leading-relaxed">
            我們相信音樂是連接人心的橋樑。通過創新的空耳創作，我們希望能夠打破語言和文化的界限，
            讓更多人感受到音樂的魅力。我們的目標是成為全球空耳音樂社群的領導者，
            持續創作優質內容，啟發更多創作者加入這個充滿創意的領域。
          </p>
        </motion.div>
      </div>
    </div>
  )
}

export default About