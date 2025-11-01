import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Music, Search, ExternalLink } from 'lucide-react'
import { lyricsAPI } from '../services/api'

const LyricsPage = () => {
  const [lyrics, setLyrics] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeCategory, setActiveCategory] = useState('all') // all, soramimi, lyrics
  const [searchQuery, setSearchQuery] = useState('')

  // 載入歌詞列表
  const loadLyrics = async () => {
    setLoading(true)
    try {
      const category = activeCategory === 'all' ? '' : activeCategory
      const response = await lyricsAPI.getAll(category)
      setLyrics(response.data?.lyrics || [])
    } catch (error) {
      console.error('載入歌詞失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLyrics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory])

  const getCategoryLabel = (category) => {
    return category === 'soramimi' ? '空耳歌詞' : '歌詞'
  }

  const getCategoryColor = (category) => {
    return category === 'soramimi'
      ? 'bg-gradient-to-r from-purple-500 to-pink-600'
      : 'bg-gradient-to-r from-blue-500 to-cyan-600'
  }

  // 篩選和搜尋
  const filteredLyrics = lyrics.filter(lyric => {
    const matchCategory = activeCategory === 'all' || lyric.category === activeCategory
    const matchSearch = searchQuery === '' ||
      lyric.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lyric.artist_name?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCategory && matchSearch
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
      {/* 頁面標題 */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center">
              <Music className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black">歌詞</h1>
              <p className="text-white/80 mt-2">瀏覽所有空耳歌詞與歌詞內容</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 搜尋和分類 */}
        <div className="mb-8 space-y-4">
          {/* 搜尋框 */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋歌曲或演唱者..."
              className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          {/* 分類切換 */}
          <div className="flex gap-3">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-6 py-2.5 rounded-xl font-semibold transition-all ${
                activeCategory === 'all'
                  ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setActiveCategory('soramimi')}
              className={`px-6 py-2.5 rounded-xl font-semibold transition-all ${
                activeCategory === 'soramimi'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              空耳歌詞
            </button>
            <button
              onClick={() => setActiveCategory('lyrics')}
              className={`px-6 py-2.5 rounded-xl font-semibold transition-all ${
                activeCategory === 'lyrics'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              歌詞
            </button>
          </div>
        </div>

        {/* 歌詞列表 */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent"></div>
          </div>
        ) : filteredLyrics.length === 0 ? (
          <div className="text-center py-20">
            <Music className="w-20 h-20 mx-auto text-gray-300 mb-4" />
            <p className="text-xl text-gray-500">
              {searchQuery ? '找不到符合的歌詞' : '目前沒有歌詞'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLyrics.map((lyric) => (
              <motion.div
                key={lyric.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden"
              >
                <div className="p-6">
                  {/* 分類標籤 */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`${getCategoryColor(lyric.category)} text-white text-xs font-bold px-3 py-1 rounded-full`}>
                      {getCategoryLabel(lyric.category)}
                    </span>
                  </div>

                  {/* 歌曲資訊 */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {lyric.title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {lyric.artist_name}
                  </p>

                  {/* YouTube 連結 */}
                  {lyric.youtube_url && (
                    <a
                      href={lyric.youtube_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-pink-600 hover:text-pink-700 mb-4 text-sm font-semibold"
                    >
                      <ExternalLink className="w-4 h-4" />
                      觀看 YouTube 影片
                    </a>
                  )}

                  {/* 歌詞內容 */}
                  <div className="bg-gray-50 rounded-xl p-4 max-h-64 overflow-y-auto">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                      {lyric.lyrics}
                    </pre>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default LyricsPage
