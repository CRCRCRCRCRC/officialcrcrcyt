import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Music, Plus, Edit2, Trash2, Save, X } from 'lucide-react'
import toast from 'react-hot-toast'

const Lyrics = () => {
  const [lyrics, setLyrics] = useState([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    lyrics: '',
    youtube_url: ''
  })

  // 載入歌詞列表
  const loadLyrics = async () => {
    setLoading(true)
    try {
      // TODO: 實作 API 呼叫
      // const response = await lyricsAPI.getAll()
      // setLyrics(response.data)
      setLyrics([])
    } catch (error) {
      console.error('載入歌詞失敗:', error)
      toast.error('載入歌詞失敗')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLyrics()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.title || !formData.artist || !formData.lyrics) {
      toast.error('請填寫所有必填欄位')
      return
    }

    try {
      if (editingId) {
        // TODO: 實作更新 API
        toast.success('歌詞已更新')
      } else {
        // TODO: 實作新增 API
        toast.success('歌詞已新增')
      }

      setFormData({ title: '', artist: '', lyrics: '', youtube_url: '' })
      setShowAddForm(false)
      setEditingId(null)
      loadLyrics()
    } catch (error) {
      console.error('儲存歌詞失敗:', error)
      toast.error('儲存歌詞失敗')
    }
  }

  const handleEdit = (lyric) => {
    setFormData({
      title: lyric.title,
      artist: lyric.artist,
      lyrics: lyric.lyrics,
      youtube_url: lyric.youtube_url || ''
    })
    setEditingId(lyric.id)
    setShowAddForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('確定要刪除這首歌詞嗎？')) return

    try {
      // TODO: 實作刪除 API
      toast.success('歌詞已刪除')
      loadLyrics()
    } catch (error) {
      console.error('刪除歌詞失敗:', error)
      toast.error('刪除歌詞失敗')
    }
  }

  const cancelEdit = () => {
    setFormData({ title: '', artist: '', lyrics: '', youtube_url: '' })
    setEditingId(null)
    setShowAddForm(false)
  }

  return (
    <div className="space-y-6">
      {/* 標題列 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center">
            <Music className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              歌詞管理
            </h1>
            <p className="text-sm text-gray-600">管理歌曲歌詞內容</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
        >
          {showAddForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {showAddForm ? '取消' : '新增歌詞'}
        </button>
      </div>

      {/* 新增/編輯表單 */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/85 backdrop-blur-xl border border-white/20 rounded-3xl shadow-xl p-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {editingId ? '編輯歌詞' : '新增歌詞'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  歌曲名稱 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="請輸入歌曲名稱"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  演唱者 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.artist}
                  onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                  placeholder="請輸入演唱者名稱"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                YouTube 連結
              </label>
              <input
                type="url"
                value={formData.youtube_url}
                onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                歌詞內容 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.lyrics}
                onChange={(e) => setFormData({ ...formData, lyrics: e.target.value })}
                placeholder="請輸入歌詞內容..."
                rows={12}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none font-mono text-sm"
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                <Save className="w-5 h-5" />
                {editingId ? '更新' : '新增'}
              </button>

              <button
                type="button"
                onClick={cancelEdit}
                className="px-6 py-3 rounded-xl bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition-all"
              >
                取消
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* 歌詞列表 */}
      <div className="bg-white/85 backdrop-blur-xl border border-white/20 rounded-3xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-pink-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">載入中...</p>
          </div>
        ) : lyrics.length === 0 ? (
          <div className="p-12 text-center">
            <Music className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">目前沒有歌詞資料</p>
            <p className="text-sm text-gray-500 mt-2">點擊上方「新增歌詞」按鈕來新增第一首歌詞</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {lyrics.map((lyric) => (
              <motion.div
                key={lyric.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{lyric.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{lyric.artist}</p>
                    {lyric.youtube_url && (
                      <a
                        href={lyric.youtube_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-pink-600 hover:text-pink-700 mt-2 inline-block"
                      >
                        觀看 YouTube 影片 →
                      </a>
                    )}
                    <pre className="mt-4 text-sm text-gray-700 whitespace-pre-wrap font-sans bg-gray-50 p-4 rounded-xl max-h-40 overflow-y-auto">
                      {lyric.lyrics}
                    </pre>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(lyric)}
                      className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(lyric.id)}
                      className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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

export default Lyrics
