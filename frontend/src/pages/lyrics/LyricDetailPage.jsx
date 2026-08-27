import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { lyricsAPI, artistsAPI } from '../../services/api'
import CommentSection from '../../components/lyrics/CommentSection'
import SEO from '../../components/SEO'
import { toAbsoluteSiteUrl } from '../../config/site'

const LyricDetailPage = () => {
  const { category, artistSlug, songSlug } = useParams()
  const navigate = useNavigate()
  const [lyric, setLyric] = useState(null)
  const [artists, setArtists] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [latestLyrics, setLatestLyrics] = useState([])
  const [likeCount, setLikeCount] = useState(0)
  const [isLiked, setIsLiked] = useState(false)

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

      // 增加瀏覽次數
      if (lyricResponse.data?.lyric) {
        try {
          await lyricsAPI.incrementView(category, artistSlug, songSlug)
        } catch (error) {
          console.error('增加瀏覽次數失敗:', error)
        }
      }

      // 載入該分類下的所有演唱者
      const artistsResponse = await artistsAPI.getAll(category)
      setArtists(artistsResponse.data?.artists || [])

      // 載入最新歌詞（限制5筆）
      try {
        const latestResponse = await lyricsAPI.getAll(category)
        const allLyrics = latestResponse.data?.lyrics || []
        setLatestLyrics(allLyrics.slice(0, 5))
      } catch (error) {
        console.error('載入最新歌詞失敗:', error)
      }

      // 載入按讚狀態
      try {
        const likeResponse = await lyricsAPI.getLikeStatus(category, artistSlug, songSlug)
        setLikeCount(likeResponse.data?.likes || 0)
        setIsLiked(likeResponse.data?.liked || false)
      } catch (error) {
        console.error('載入按讚狀態失敗:', error)
      }
    } catch (error) {
      console.error('載入失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    try {
      const response = await lyricsAPI.likeLyric(category, artistSlug, songSlug)
      setLikeCount(response.data?.likes || 0)
      setIsLiked(response.data?.liked || false)
    } catch (error) {
      console.error('按讚失敗:', error)
    }
  }

  // 搜尋演唱者
  const filteredArtists = artists.filter(artist =>
    artist.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // 從 YouTube URL 提取影片 ID
  const extractYouTubeId = (url) => {
    if (!url) return null
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/
    const match = url.match(regExp)
    return (match && match[7].length === 11) ? match[7] : null
  }

  // 格式化日期時間（西元年-月份-日期-時間）
  const formatDateTime = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  }

  if (loading) {
    return (
      <div className="min-h-full flex justify-center items-center bg-gradient-to-br from-purple-400 via-pink-500 to-purple-600">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
      </div>
    )
  }

  const categoryLabel = getCategoryLabel()

  if (!lyric) {
    return (
      <div className="min-h-full flex flex-col justify-center items-center">
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

  // SEO 結構化數據
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "MusicComposition",
    "name": lyric.title,
    "composer": {
      "@type": "Person",
      "name": lyric.artist_name
    },
    "lyricist": {
      "@type": "Person",
      "name": lyric.artist_name
    },
    "inLanguage": "zh-TW",
    "text": lyric.lyrics.substring(0, 200),
    "datePublished": lyric.created_at,
    "dateModified": lyric.updated_at,
    "interactionStatistic": [
      {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/LikeAction",
        "userInteractionCount": likeCount
      },
      {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/ViewAction",
        "userInteractionCount": lyric.view_count || 0
      }
    ]
  }

  return (
    <>
      <SEO
        title={`${lyric.artist_name} - ${lyric.title} ${categoryLabel}`}
        description={`${lyric.artist_name} 的 ${lyric.title} ${categoryLabel}，包含完整歌詞內容、YouTube 影片連結。瀏覽次數：${(lyric.view_count || 0).toLocaleString()}，按讚數：${likeCount}。`}
        keywords={`${lyric.artist_name}, ${lyric.title}, ${categoryLabel}, 歌詞, lyrics, ${category === 'soramimi' ? '空耳, soramimi' : '翻譯'}`}
        type="music.song"
        canonicalUrl={toAbsoluteSiteUrl(`/lyrics/${category}/${artistSlug}/${songSlug}`)}
        author={lyric.artist_name}
        publishedTime={lyric.created_at}
        modifiedTime={lyric.updated_at}
        structuredData={structuredData}
      />
      <div className="min-h-full bg-gradient-to-br from-purple-400 via-pink-500 to-purple-600">

      {/* 頂部麵包屑導航 */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-purple-100 shadow-md">
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
          <main className="flex-1 bg-white rounded-3xl shadow-2xl p-8 transition-all hover:shadow-3xl hover:-translate-y-1 overflow-hidden">
            {/* 頂部漸變條 */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 bg-[length:200%_100%] animate-[gradientShift_3s_ease_infinite]"></div>

            <h2 className="text-2xl font-bold mb-6 pb-4 border-l-4 pl-5 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent border-purple-600">
              {lyric.artist_name} – {lyric.title} {getCategoryLabel()}
            </h2>

            {/* 資訊列 */}
            <div className="flex flex-wrap items-center gap-4 mb-4">
              {/* 按讚按鈕 */}
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg ${
                  isLiked
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white'
                    : 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 hover:from-purple-100 hover:to-pink-100'
                }`}
              >
                <svg className="w-5 h-5" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span>{isLiked ? '已按讚' : '按讚'} ({likeCount})</span>
              </button>

              {/* 瀏覽次數 */}
              {lyric.view_count !== null && lyric.view_count !== undefined && (
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="font-medium">{lyric.view_count.toLocaleString()} 次瀏覽</span>
                </div>
              )}

              {/* 最後編輯時間 */}
              {lyric.updated_at && (
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">最後編輯：{formatDateTime(lyric.updated_at)}</span>
                </div>
              )}
            </div>

            {/* YouTube 嵌入播放器 */}
            {lyric.youtube_url && (() => {
              const videoId = extractYouTubeId(lyric.youtube_url)
              return videoId ? (
                <div className="mb-6 rounded-2xl overflow-hidden shadow-lg">
                  <div className="relative pb-[56.25%] h-0">
                    <iframe
                      className="absolute top-0 left-0 w-full h-full"
                      src={`https://www.youtube.com/embed/${videoId}`}
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
              ) : (
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
              )
            })()}

            {/* 歌詞內容 */}
            <div className="lyrics-section">
              {lyric.lyrics.split('\n').map((line, index) => (
                <p
                  key={index}
                  className="my-1 text-gray-700 text-base leading-relaxed transition-all hover:text-purple-600 hover:translate-x-1 cursor-default"
                >
                  {line || '\u00A0'}
                </p>
              ))}
            </div>

            {/* 評論區 */}
            <CommentSection lyricId={lyric.id} />
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
                className="w-full px-5 py-3 pr-12 rounded-2xl border-2 border-transparent bg-white shadow-xl focus:border-purple-400 focus:shadow-2xl focus:-translate-y-0.5 transition-all outline-none"
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xl opacity-50">
                🔍
              </span>
            </div>

            {/* 最新歌詞 */}
            {latestLyrics.length > 0 && (
              <div className="bg-white rounded-3xl shadow-2xl p-6 transition-all hover:shadow-3xl hover:-translate-y-1">
                <h3 className="text-lg font-bold mb-4 pb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent border-b-2 border-gradient-to-r from-purple-600 to-pink-600">
                  最新{getCategoryLabel()}
                </h3>
                <ul className="space-y-2">
                  {latestLyrics.map((latest) => (
                    <li key={latest.id}>
                      <Link
                        to={`/lyrics/${latest.category}/${latest.artist_slug}/${latest.slug}`}
                        className="block px-4 py-2.5 rounded-xl transition-all bg-gradient-to-r from-purple-50/50 to-pink-50/50 hover:from-purple-100 hover:to-pink-100 text-gray-700 hover:text-purple-700 hover:translate-x-1 hover:shadow-md"
                      >
                        <div className="text-sm font-semibold line-clamp-1">{latest.title}</div>
                        <div className="text-xs text-gray-500 mt-1">{latest.artist_name}</div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 演唱者列表 */}
            <div className="bg-white rounded-3xl shadow-2xl p-6 transition-all hover:shadow-3xl hover:-translate-y-1">
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
    </>
  )
}

export default LyricDetailPage
