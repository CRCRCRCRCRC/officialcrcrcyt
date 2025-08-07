import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Megaphone, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Calendar,
  Save,
  X,
  Search
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { announcementAPI } from '../../services/api'
import { decodeHtmlEntities } from '../../utils/formatters'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'

const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState(null)
  const [saving, setSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    published: true
  })

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      const response = await announcementAPI.getAll() // 獲取所有公告，包括未發布的
      setAnnouncements(response.data.announcements || [])
    } catch (error) {
      console.error('獲取公告失敗:', error)
      toast.error('載入公告失敗')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingAnnouncement(null)
    setFormData({
      title: '',
      content: '',
      published: true
    })
    setPreviewMode(false)
    setShowModal(true)
  }

  const handleEdit = (announcement) => {
    setEditingAnnouncement(announcement)
    setFormData({
      title: announcement.title,
      content: announcement.content,
      published: announcement.published
    })
    setPreviewMode(false)
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('標題和內容不能為空')
      return
    }

    setSaving(true)
    try {
      if (editingAnnouncement) {
        await announcementAPI.update(editingAnnouncement.id, formData)
        toast.success('公告已更新')
      } else {
        await announcementAPI.create(formData)
        toast.success('公告已創建')
      }
      
      setShowModal(false)
      fetchAnnouncements()
    } catch (error) {
      console.error('保存公告失敗:', error)
      toast.error('保存失敗')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('確定要刪除這個公告嗎？')) return

    try {
      await announcementAPI.delete(id)
      toast.success('公告已刪除')
      fetchAnnouncements()
    } catch (error) {
      console.error('刪除公告失敗:', error)
      toast.error('刪除失敗')
    }
  }

  const togglePublished = async (announcement) => {
    try {
      await announcementAPI.update(announcement.id, {
        ...announcement,
        published: !announcement.published
      })
      toast.success(announcement.published ? '公告已隱藏' : '公告已發布')
      fetchAnnouncements()
    } catch (error) {
      console.error('更新公告狀態失敗:', error)
      toast.error('更新失敗')
    }
  }

  const filteredAnnouncements = announcements.filter(announcement =>
    announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    announcement.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('zh-TW')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <div className="bg-white bg-opacity-80 backdrop-blur-xl border-b border-white border-opacity-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Megaphone className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  公告管理
                </h1>
              </div>
              <p className="text-gray-600 text-lg">
                管理網站公告與重要資訊
              </p>
            </div>
            <motion.button
              onClick={handleCreate}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              新增公告
            </motion.button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="搜尋公告..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 shadow-sm"
            />
          </div>
        </div>

        {/* Announcements List */}
        <div className="space-y-6">
          {filteredAnnouncements.map((announcement, index) => (
            <motion.div
              key={announcement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">
                        {decodeHtmlEntities(announcement.title)}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        announcement.published 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {announcement.published ? '已發布' : '草稿'}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 mb-3">
                      <Calendar className="w-4 h-4 mr-2" />
                      創建：{formatDate(announcement.createdAt)}
                      {announcement.updatedAt !== announcement.createdAt && (
                        <span className="ml-4">
                          更新：{formatDate(announcement.updatedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => togglePublished(announcement)}
                      className={`p-2 rounded-lg transition-colors ${
                        announcement.published
                          ? 'text-green-600 hover:bg-green-50'
                          : 'text-gray-400 hover:bg-gray-50'
                      }`}
                      title={announcement.published ? '隱藏公告' : '發布公告'}
                    >
                      {announcement.published ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => handleEdit(announcement)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="編輯公告"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(announcement.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="刪除公告"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="text-gray-600 line-clamp-3">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    className="prose prose-sm max-w-none"
                    components={{
                      p: ({ children }) => <p className="mb-2">{children}</p>,
                      h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-base font-semibold mb-2">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-sm font-medium mb-1">{children}</h3>,
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                      li: ({ children }) => <li className="mb-1">{children}</li>
                    }}
                  >
                    {announcement.content.substring(0, 200) + (announcement.content.length > 200 ? '...' : '')}
                  </ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredAnnouncements.length === 0 && (
          <div className="text-center py-16">
            <Megaphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {searchQuery ? '沒有找到相關公告' : '暫無公告'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery ? '請嘗試其他關鍵字' : '點擊上方按鈕創建第一個公告'}
            </p>
            {!searchQuery && (
              <button
                onClick={handleCreate}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                新增公告
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingAnnouncement ? '編輯公告' : '新增公告'}
                </h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPreviewMode(!previewMode)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      previewMode 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {previewMode ? '編輯' : '預覽'}
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {!previewMode ? (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      標題
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      placeholder="輸入公告標題..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      內容 (支援 Markdown 格式)
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      rows={12}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 resize-none font-mono text-sm"
                      placeholder="輸入公告內容... 支援 Markdown 格式"
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="published"
                      checked={formData.published}
                      onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="published" className="ml-2 text-sm font-medium text-gray-900">
                      立即發布
                    </label>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {formData.title || '無標題'}
                  </h3>
                  <div className="prose prose-lg max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {formData.content || '無內容'}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 flex items-center"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    保存
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default AdminAnnouncements
