import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Plus, Edit2, Trash2, Save, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { artistsAPI } from '../../services/api'

const Artists = () => {
  const [artists, setArtists] = useState([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    name: ''
  })

  // 載入演唱者列表
  const loadArtists = async () => {
    setLoading(true)
    try {
      const response = await artistsAPI.getAll()
      setArtists(response.data?.artists || [])
    } catch (error) {
      console.error('載入演唱者失敗:', error)
      toast.error('載入演唱者失敗')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadArtists()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name) {
      toast.error('請輸入演唱者名稱')
      return
    }

    try {
      if (editingId) {
        await artistsAPI.update(editingId, formData)
        toast.success('演唱者已更新')
      } else {
        await artistsAPI.create(formData)
        toast.success('演唱者已新增')
      }

      setFormData({ name: '' })
      setShowAddForm(false)
      setEditingId(null)
      loadArtists()
    } catch (error) {
      console.error('儲存演唱者失敗:', error)
      toast.error(error.response?.data?.error || '儲存演唱者失敗')
    }
  }

  const handleEdit = (artist) => {
    setFormData({
      name: artist.name
    })
    setEditingId(artist.id)
    setShowAddForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('確定要刪除這位演唱者嗎？\n注意：如果有歌詞使用此演唱者將無法刪除。')) return

    try {
      await artistsAPI.delete(id)
      toast.success('演唱者已刪除')
      loadArtists()
    } catch (error) {
      console.error('刪除演唱者失敗:', error)
      toast.error(error.response?.data?.error || '刪除演唱者失敗')
    }
  }

  const cancelEdit = () => {
    setFormData({ name: '' })
    setEditingId(null)
    setShowAddForm(false)
  }

  return (
    <div className="space-y-6">
      {/* 標題列 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              演唱者管理
            </h1>
            <p className="text-sm text-gray-600">管理所有演唱者資料</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
        >
          {showAddForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {showAddForm ? '取消' : '新增演唱者'}
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
            {editingId ? '編輯演唱者' : '新增演唱者'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                演唱者名稱 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="請輸入演唱者名稱"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
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

      {/* 演唱者列表 */}
      <div className="bg-white/85 backdrop-blur-xl border border-white/20 rounded-3xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">載入中...</p>
          </div>
        ) : artists.length === 0 ? (
          <div className="p-12 text-center">
            <User className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">目前沒有演唱者資料</p>
            <p className="text-sm text-gray-500 mt-2">點擊上方「新增演唱者」按鈕來新增第一位演唱者</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {artists.map((artist) => (
              <motion.div
                key={artist.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all hover:scale-105"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{artist.name}</h3>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(artist)}
                      className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(artist.id)}
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

export default Artists
