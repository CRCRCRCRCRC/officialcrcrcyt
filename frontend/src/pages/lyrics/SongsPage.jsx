import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Music, ArrowLeft } from 'lucide-react'
import { lyricsAPI } from '../../services/api'

const SongsPage = () => {
  const { category, artistSlug } = useParams()
  const navigate = useNavigate()
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(false)
  const [artistName, setArtistName] = useState('')

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
    loadSongs()
  }, [category, artistSlug])

  const loadSongs = async () => {
    setLoading(true)
    try {
      const response = await lyricsAPI.getByArtist(category, artistSlug)
      const songsData = response.data?.lyrics || []
      setSongs(songsData)
      if (songsData.length > 0) {
        setArtistName(songsData[0].artist_name)
      }
    } catch (error) {
      console.error('載入歌曲失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
      {/* 頁面標題 */}
      <div className={`bg-gradient-to-r ${categoryInfo.bgGradient} text-white py-12`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate(`/lyrics/${category}`)}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回演唱者列表</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center">
              <Music className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black">{artistName || '載入中...'}</h1>
              <p className="text-white/80 mt-2">{categoryInfo.name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent"></div>
          </div>
        ) : songs.length === 0 ? (
          <div className="text-center py-20">
            <Music className="w-20 h-20 mx-auto text-gray-300 mb-4" />
            <p className="text-xl text-gray-500">目前沒有歌曲</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {songs.map((song) => (
              <motion.button
                key={song.id}
                onClick={() => navigate(`/lyrics/${category}/${artistSlug}/${song.slug}`)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group text-left bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all p-6"
              >
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-14 h-14 bg-gradient-to-br ${categoryInfo.gradient} rounded-xl flex items-center justify-center`}>
                    <Music className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-pink-600 transition-colors line-clamp-2">
                      {song.title}
                    </h3>
                    <div className="mt-3 flex items-center text-gray-400 group-hover:text-pink-500 transition-colors">
                      <span className="text-sm font-semibold">查看歌詞</span>
                      <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default SongsPage
