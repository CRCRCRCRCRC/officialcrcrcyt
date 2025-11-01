import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Music, Mic2 } from 'lucide-react'

const CategoryPage = () => {
  const navigate = useNavigate()

  const categories = [
    {
      id: 'soramimi',
      name: '空耳歌詞',
      description: '搞笑的空耳歌詞創作',
      gradient: 'from-purple-500 to-pink-600',
      icon: Mic2
    },
    {
      id: 'lyrics',
      name: '歌詞',
      description: '完整的歌詞內容',
      gradient: 'from-blue-500 to-cyan-600',
      icon: Music
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
      {/* 頁面標題 */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-xl rounded-3xl mb-6">
              <Music className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-black mb-4">歌詞</h1>
            <p className="text-xl text-white/90">選擇歌詞類型開始瀏覽</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <motion.button
                key={category.id}
                onClick={() => navigate(`/lyrics/${category.id}`)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all overflow-hidden p-8 text-left"
              >
                {/* 背景漸層 */}
                <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />

                {/* 圖標 */}
                <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${category.gradient} rounded-2xl mb-6`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>

                {/* 標題 */}
                <h2 className="text-3xl font-black text-gray-900 mb-3">
                  {category.name}
                </h2>

                {/* 描述 */}
                <p className="text-gray-600 text-lg">
                  {category.description}
                </p>

                {/* 箭頭 */}
                <div className="mt-6 flex items-center text-gray-400 group-hover:text-pink-500 transition-colors">
                  <span className="text-sm font-semibold">開始瀏覽</span>
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default CategoryPage
