import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Music, User, ArrowLeft } from 'lucide-react'
import { artistsAPI } from '../../services/api'

const ArtistsPage = () => {
  const { category } = useParams()
  const navigate = useNavigate()
  const [artists, setArtists] = useState([])
  const [loading, setLoading] = useState(false)

  const getCategoryInfo = () => {
    return category === 'soramimi'
      ? {
          name: '空耳歌詞',
          gradient: 'from-purple-500 to-pink-600',
          bgGradient: 'from-purple-600 via-pink-600 to-rose-600'
        }
      : {
          name: '歌詞',
          gradient: 'from-blue-500 to-cyan-600',
          bgGradient: 'from-blue-600 via-cyan-600 to-teal-600'
        }
  }

  const categoryInfo = getCategoryInfo()

  useEffect(() => {
    loadArtists()
  }, [category])

  const loadArtists = async () => {
    setLoading(true)
    try {
      const response = await artistsAPI.getAll(category)
      setArtists(response.data?.artists || [])
    } catch (error) {
      console.error('載入演唱者失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
      {/* 頁面標題 */}
      <div className={`bg-gradient-to-r ${categoryInfo.bgGradient} text-white py-12`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate('/lyrics')}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回選擇分類</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center">
              <Music className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black">{categoryInfo.name}</h1>
              <p className="text-white/80 mt-2">選擇演唱者</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent"></div>
          </div>
        ) : artists.length === 0 ? (
          <div className="text-center py-20">
            <User className="w-20 h-20 mx-auto text-gray-300 mb-4" />
            <p className="text-xl text-gray-500">目前沒有演唱者</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {artists.map((artist) => (
              <motion.button
                key={artist.id}
                onClick={() => navigate(`/lyrics/${category}/${artist.slug}`)}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all p-6 text-center"
              >
                <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-br ${categoryInfo.gradient} rounded-full flex items-center justify-center`}>
                  <User className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-pink-600 transition-colors">
                  {artist.name}
                </h3>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ArtistsPage
