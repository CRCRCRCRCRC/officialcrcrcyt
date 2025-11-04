import { useState, useEffect } from 'react'
import { lyricCommentsAPI } from '../../services/api'

const CommentSection = ({ lyricId }) => {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    loadComments()
    // 檢查是否已登入
    const token = localStorage.getItem('token')
    setIsLoggedIn(!!token)
  }, [lyricId])

  const loadComments = async () => {
    setLoading(true)
    try {
      const response = await lyricCommentsAPI.getComments(lyricId)
      setComments(response.data?.comments || [])
    } catch (error) {
      console.error('載入評論失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // 如果未登入且沒有填暱稱
    if (!isLoggedIn && !username.trim()) {
      alert('請填寫暱稱或登入')
      return
    }

    if (!content.trim()) {
      alert('請填寫評論內容')
      return
    }

    setSubmitting(true)
    try {
      await lyricCommentsAPI.createComment(lyricId, {
        username: isLoggedIn ? undefined : username.trim(),
        content: content.trim()
      })
      setContent('')
      setUsername('')
      await loadComments()
    } catch (error) {
      console.error('新增評論失敗:', error)
      alert('新增評論失敗')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLike = async (commentId) => {
    try {
      const response = await lyricCommentsAPI.likeComment(commentId)
      // 更新評論列表中的按讚數
      setComments(comments.map(comment =>
        comment.id === commentId
          ? { ...comment, likes: response.data.likes }
          : comment
      ))
    } catch (error) {
      console.error('按讚失敗:', error)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '剛剛'
    if (minutes < 60) return `${minutes} 分鐘前`
    if (hours < 24) return `${hours} 小時前`
    if (days < 7) return `${days} 天前`

    return date.toLocaleDateString('zh-TW')
  }

  return (
    <div className="mt-8 bg-white rounded-3xl shadow-2xl p-8">
      <h3 className="text-2xl font-bold mb-6 pb-4 border-l-4 pl-5 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent border-purple-600">
        評論 ({comments.length})
      </h3>

      {/* 評論表單 */}
      <form onSubmit={handleSubmit} className="mb-8">
        {/* 只在未登入時顯示暱稱欄位 */}
        {!isLoggedIn && (
          <div className="mb-4">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="您的暱稱"
              className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:outline-none transition-all"
              maxLength={50}
            />
          </div>
        )}
        <div className="mb-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="留下您的評論..."
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:outline-none transition-all resize-none"
            rows={4}
            maxLength={500}
          />
          <div className="text-right text-sm text-gray-500 mt-1">
            {content.length}/500
          </div>
        </div>
        <button
          type="submit"
          disabled={submitting || (!isLoggedIn && !username.trim()) || !content.trim()}
          className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? '發送中...' : '發送評論'}
        </button>
      </form>

      {/* 評論列表 */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-purple-500 border-t-transparent mx-auto"></div>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          還沒有評論，成為第一個留言的人吧！
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="p-4 rounded-xl bg-gradient-to-r from-purple-50/50 to-pink-50/50 hover:from-purple-50 hover:to-pink-50 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-purple-700">{comment.username}</span>
                    <span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-4">
                <button
                  onClick={() => handleLike(comment.id)}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-pink-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>{comment.likes || 0}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CommentSection
