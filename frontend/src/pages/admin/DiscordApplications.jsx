import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, MessageCircle, CheckCircle, XCircle, Clock, User } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

const DiscordApplications = () => {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/coin/discord-applications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('website_token')}`
        }
      })
      const result = await response.json()
      if (result.applications) {
        setApplications(result.applications)
      }
    } catch (error) {
      console.error('獲取申請記錄失敗:', error)
      toast.error('獲取申請記錄失敗')
    } finally {
      setLoading(false)
    }
  }

  const updateApplicationStatus = async (applicationId, status, adminNote = '') => {
    setProcessingId(applicationId)
    try {
      const response = await fetch(`/api/coin/discord-applications/${applicationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('website_token')}`
        },
        body: JSON.stringify({ status, adminNote })
      })

      const result = await response.json()
      if (result.success) {
        toast.success('狀態更新成功')
        fetchApplications() // 重新獲取列表
      } else {
        toast.error(result.error || '更新失敗')
      }
    } catch (error) {
      console.error('更新申請狀態失敗:', error)
      toast.error('更新失敗')
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return '已批准'
      case 'rejected':
        return '已拒絕'
      default:
        return '待處理'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <Link
              to="/admin"
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              返回管理後台
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              Discord 身分組申請管理
            </h1>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-6 h-6 text-blue-500" />
              <h2 className="text-lg font-semibold text-gray-900">
                申請記錄 ({applications.length})
              </h2>
            </div>
          </div>

          <div className="p-6">
            {applications.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">目前沒有任何申請記錄</p>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(app.status)}
                          <span className="font-medium text-gray-900">
                            {getStatusText(app.status)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User className="w-4 h-4" />
                          <span>{app.username}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500 mb-1">
                          申請時間: {new Date(app.applied_at).toLocaleString('zh-TW')}
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          Discord ID: {app.discord_id}
                        </div>
                      </div>
                    </div>

                    {app.processed_at && (
                      <div className="mt-3 text-sm text-gray-600">
                        <div>處理時間: {new Date(app.processed_at).toLocaleString('zh-TW')}</div>
                        {app.admin_note && (
                          <div className="mt-1 text-gray-500">
                            管理員備註: {app.admin_note}
                          </div>
                        )}
                      </div>
                    )}

                    {app.status === 'pending' && (
                      <div className="mt-4 flex gap-3">
                        <button
                          onClick={() => updateApplicationStatus(app.id, 'approved')}
                          disabled={processingId === app.id}
                          className="flex-1 py-2 px-4 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
                        >
                          {processingId === app.id ? '處理中...' : '批准'}
                        </button>
                        <button
                          onClick={() => updateApplicationStatus(app.id, 'rejected')}
                          disabled={processingId === app.id}
                          className="flex-1 py-2 px-4 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                        >
                          {processingId === app.id ? '處理中...' : '拒絕'}
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default DiscordApplications