import { motion } from 'framer-motion'
import { Users, Music, Heart, Award } from 'lucide-react'

const About = () => {
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

  const stats = [
    { number: '100+', label: '創作作品' },
    { number: '50K+', label: '訂閱者' },
    { number: '1M+', label: '總觀看數' },
    { number: '3+', label: '年創作經驗' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-600 to-secondary-600 text-white">
        <div className="container-custom py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6">
              關於 CRCRC
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 max-w-3xl mx-auto">
              我們是一個專注於空耳音樂創作的團隊，致力於為觀眾帶來歡樂與驚喜
            </p>
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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
                animate={{ opacity: 1, y: 0 }}
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
              我們的成就
            </h2>
            <div className="w-24 h-1 bg-primary-500 mx-auto"></div>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 1 + index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold text-primary-400 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-300 text-lg">
                  {stat.label}
                </div>
              </motion.div>
            ))}
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