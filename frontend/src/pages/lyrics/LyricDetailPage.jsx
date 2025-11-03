import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { lyricsAPI, artistsAPI } from '../../services/api'

const LyricDetailPage = () => {
  const { category, artistSlug, songSlug } = useParams()
  const navigate = useNavigate()
  const [lyric, setLyric] = useState(null)
  const [artists, setArtists] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const getCategoryLabel = () => {
    return category === 'soramimi' ? '空耳歌詞' : '歌詞'
  }

  useEffect(() => {
    loadData()
  }, [category, artistSlug, songSlug])

  const loadData = async () => {
    setLoading(true)
    try {
      // 載入歌詞內容
      const lyricResponse = await lyricsAPI.getBySlugs(category, artistSlug, songSlug)
      setLyric(lyricResponse.data?.lyric || null)

      // 載入該分類下的所有演唱者
      const artistsResponse = await artistsAPI.getAll(category)
      setArtists(artistsResponse.data?.artists || [])
    } catch (error) {
      console.error('載入失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  // 搜尋演唱者
  const filteredArtists = artists.filter(artist =>
    artist.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    )
  }

  if (!lyric) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center">
        <p className="text-xl text-gray-500 mb-8">找不到歌詞</p>
        <button
          onClick={() => navigate('/lyrics')}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
        >
          返回歌詞首頁
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-purple-600">
      {/* 背景動態效果 */}
      <div className="fixed inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-[20%] left-[20%] w-96 h-96 bg-white rounded-full blur-3xl"></div>
        <div className="absolute top-[80%] right-[20%] w-96 h-96 bg-white rounded-full blur-3xl"></div>
        <div className="absolute top-[40%] right-[40%] w-64 h-64 bg-white rounded-full blur-3xl"></div>
      </div>

      {/* 頂部麵包屑導航 */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-purple-100 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-purple-600 transition-colors">首頁</Link>
            <span>»</span>
            <Link to="/lyrics" className="hover:text-purple-600 transition-colors">歌詞</Link>
            <span>»</span>
            <Link to={`/lyrics/${category}`} className="hover:text-purple-600 transition-colors">
              {getCategoryLabel()}
            </Link>
            <span>»</span>
            <Link to={`/lyrics/${category}/${artistSlug}`} className="hover:text-purple-600 transition-colors">
              {lyric.artist_name}
            </Link>
            <span>»</span>
            <span className="text-gray-900 font-medium">{lyric.artist_name} - {lyric.title} {getCategoryLabel()}</span>
          </div>
        </div>
      </div>

      {/* 主標題 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-3xl font-black text-white drop-shadow-lg">
          {lyric.artist_name} - {lyric.title} {getCategoryLabel()}
        </h1>
      </div>

      {/* 主容器 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="flex gap-8 relative z-10">
          {/* 主內容區 */}
          <main className="flex-1 bg-white/98 backdrop-blur-xl rounded-3xl shadow-2xl p-8 transition-all hover:shadow-3xl hover:-translate-y-1 overflow-hidden">
            {/* 頂部漸變條 */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 bg-[length:200%_100%] animate-[gradientShift_3s_ease_infinite]"></div>

            <h2 className="text-2xl font-bold mb-6 pb-4 border-l-4 pl-5 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent border-purple-600">
              {lyric.artist_name} – {lyric.title} {getCategoryLabel()}
            </h2>

            {/* YouTube 連結 */}
            {lyric.youtube_url && (
              <a
                href={lyric.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mb-6 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 text-purple-700 font-semibold transition-all shadow-md hover:shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                觀看 YouTube 影片
              </a>
            )}

            {/* 歌詞內容 */}
            <div className="lyrics-section">
              {lyric.lyrics.split('\n').map((line, index) => (
                <p
                  key={index}
                  className="mb-2 text-gray-700 leading-relaxed transition-all hover:text-purple-600 hover:translate-x-1 cursor-default"
                >
                  {line || '\u00A0'}
                </p>
              ))}
            </div>
          </main>

          {/* 側邊欄 */}
          <aside className="w-72 flex-shrink-0 space-y-6">
            {/* 搜尋框 */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋演唱者..."
                className="w-full px-5 py-3 pr-12 rounded-2xl border-2 border-transparent bg-white/98 backdrop-blur-xl shadow-xl focus:border-purple-400 focus:shadow-2xl focus:-translate-y-0.5 transition-all outline-none"
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xl opacity-50">
                🔍
              </span>
            </div>

            {/* 演唱者列表 */}
            <div className="bg-white/98 backdrop-blur-xl rounded-3xl shadow-2xl p-6 transition-all hover:shadow-3xl hover:-translate-y-1">
              <h3 className="text-lg font-bold mb-4 pb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent border-b-2 border-gradient-to-r from-purple-600 to-pink-600">
                {getCategoryLabel()} 演唱者
              </h3>
              <ul className="space-y-2 max-h-[500px] overflow-y-auto">
                {filteredArtists.map((artist) => (
                  <li key={artist.id}>
                    <Link
                      to={`/lyrics/${category}/${artist.slug}`}
                      className={`block px-4 py-2.5 rounded-xl transition-all ${
                        artist.slug === artistSlug
                          ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 font-semibold shadow-md'
                          : 'bg-gradient-to-r from-purple-50/50 to-pink-50/50 hover:from-purple-100 hover:to-pink-100 text-gray-700 hover:text-purple-700 hover:translate-x-1 hover:shadow-md'
                      }`}
                    >
                      {artist.name}
                    </Link>
                  </li>
                ))}
                {filteredArtists.length === 0 && (
                  <li className="text-center py-8 text-gray-400">找不到演唱者</li>
                )}
              </ul>
            </div>
          </aside>
        </div>
      </div>

      <style>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        /* 美化滾動條 */
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #764ba2, #667eea);
        }
      `}</style>
    </div>
  )
}

export default LyricDetailPage
