import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Music, ArrowLeft, ExternalLink } from 'lucide-react'
import { lyricsAPI } from '../../services/api'

const LyricDetailPage = () => {
  const { category, artistSlug, songSlug } = useParams()
  const navigate = useNavigate()
  const [lyric, setLyric] = useState(null)
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
    loadLyric()
  }, [category, artistSlug, songSlug])

  const loadLyric = async () => {
    setLoading(true)
    try {
      const response = await lyricsAPI.getBySlugs(category, artistSlug, songSlug)
      setLyric(response.data?.lyric || null)
    } catch (error) {
      console.error('載入歌詞失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent"></div>
      </div>
    )
  }

  if (!lyric) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 flex flex-col justify-center items-center">
        <Music className="w-20 h-20 text-gray-300 mb-4" />
        <p className="text-xl text-gray-500 mb-8">找不到歌詞</p>
        <button
          onClick={() => navigate(`/lyrics/${category}/${artistSlug}`)}
          className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
        >
          返回歌曲列表
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
      {/* 頁面標題 */}
      <div className={`bg-gradient-to-r ${categoryInfo.bgGradient} text-white py-12`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate(`/lyrics/${category}/${artistSlug}`)}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回 {lyric.artist_name} 的歌曲列表</span>
          </button>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-20 h-20 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center">
              <Music className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1">
              <div className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold mb-3 bg-white/20 backdrop-blur-xl`}>
                {categoryInfo.name}
              </div>
              <h1 className="text-4xl font-black mb-2">{lyric.title}</h1>
              <p className="text-xl text-white/90">{lyric.artist_name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* YouTube 連結 */}
        {lyric.youtube_url && (
          <motion.a
            href={lyric.youtube_url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-6 py-3 mb-8 rounded-xl bg-white shadow-lg hover:shadow-xl transition-all text-pink-600 hover:text-pink-700 font-semibold"
          >
            <ExternalLink className="w-5 h-5" />
            觀看 YouTube 影片
          </motion.a>
        )}

        {/* 歌詞內容 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl p-8 md:p-12"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <div className={`w-10 h-10 bg-gradient-to-br ${categoryInfo.gradient} rounded-lg flex items-center justify-center`}>
              <Music className="w-5 h-5 text-white" />
            </div>
            歌詞內容
          </h2>
          <div className="prose prose-lg max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">
              {lyric.lyrics}
            </pre>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default LyricDetailPage
