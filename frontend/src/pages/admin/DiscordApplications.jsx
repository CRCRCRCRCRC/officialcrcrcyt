import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, RefreshCw, Eye, X as CloseIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { coinAPI } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'

const STATUS_STYLES = {
  pending: { label: '待審核', classes: 'bg-amber-100 text-amber-700 border border-amber-200' },
  accepted: { label: '已通過', classes: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
  rejected: { label: '已回絕', classes: 'bg-rose-100 text-rose-700 border border-rose-200' }
}

const isPromotionOrder = (order) => order?.product_id === 'promotion-service'

const DiscordApplications = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [decisionId, setDecisionId] = useState(null)
  const [previewOrder, setPreviewOrder] = useState(null)

  const fetchOrders = async (manual = false) => {
    try {
      if (manual) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      const response = await coinAPI.getOrders()
      setOrders(response.data?.orders || [])
    } catch (error) {
      toast.error(error.response?.data?.error || '無法取得訂單資料')
    } finally {
      if (manual) {
        setRefreshing(false)
      } else {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    fetchOrders(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const formatDateTime = (value) => {
    if (!value) return '未知時間'
    try {
      return new Date(value).toLocaleString('zh-TW', { hour12: false })
    } catch {
      return value
    }
  }

  const renderStatusBadge = (status) => {
    const config = STATUS_STYLES[status] || {
      label: status || '未知',
      classes: 'bg-gray-100 text-gray-600 border border-gray-200'
    }
    return (
      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${config.classes}`}>
        {config.label}
      </span>
    )
  }

  const handleDecision = async (order, action) => {
    if (!order) return
    const actionName = action === 'accept' ? '接受' : '回絕'
    const confirmMessage =
      action === 'accept'
        ? `確定要接受「${order.user_email || '匿名用戶'}」的宣傳申請嗎？`
        : `確定要回絕並退款給「${order.user_email || '匿名用戶'}」的宣傳申請嗎？`
    if (!window.confirm(confirmMessage)) return

    setDecisionId(order.id)
    try {
      await coinAPI.decideOrder(order.id, { action })
      toast.success(action === 'accept' ? '已接受宣傳申請' : '已回絕並完成退款')
      await fetchOrders(true)
    } catch (error) {
      toast.error(error.response?.data?.error || '更新訂單狀態失敗')
    } finally {
      setDecisionId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="bg-white bg-opacity-80 backdrop-blur-xl border-b border-white/20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Discord 申請列表
                </h1>
                <p className="text-sm text-gray-600">
                  檢視使用者購買需要人工審核的商品，包含宣傳服務與身分組申請。
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => fetchOrders(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-60"
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              重新整理
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="large" />
          </div>
        ) : orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-3xl shadow-xl p-10 text-center text-gray-500"
          >
            目前沒有任何購買申請。
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-3xl border border-white/20 shadow-xl bg-white/85 backdrop-blur-xl"
          >
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">時間</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">使用者</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">商品</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金額</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discord ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">宣傳內容</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">狀態 / 操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {orders.map((order) => {
                    const promotion = isPromotionOrder(order)
                    const showActions = promotion && order.status === 'pending'
                    return (
                      <tr key={order.id} className="align-top">
                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                          {formatDateTime(order.created_at)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                          {order.user_email || '未知'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{order.product_name}</td>
                        <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                          {Number(order.price || 0).toLocaleString('zh-TW')} CRCRCoin
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap font-mono">
                          {order.discord_id || '—'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {order.promotion_content ? (
                            <div className="space-y-2">
                              <p className="text-gray-700 whitespace-pre-line max-h-32 overflow-hidden">
                                {order.promotion_content}
                              </p>
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800"
                                onClick={() => setPreviewOrder(order)}
                              >
                                <Eye className="h-3.5 w-3.5" />
                                檢視全文
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">－</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          <div className="flex flex-col gap-2">
                            {renderStatusBadge(order.status)}
                            {showActions && (
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleDecision(order, 'accept')}
                                  className="flex-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
                                  disabled={decisionId === order.id}
                                >
                                  接受
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDecision(order, 'reject')}
                                  className="flex-1 rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-600 disabled:opacity-60"
                                  disabled={decisionId === order.id}
                                >
                                  回絕
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>

      <ContentModal order={previewOrder} onClose={() => setPreviewOrder(null)} />
    </div>
  )
}

const ContentModal = ({ order, onClose }) => {
  if (!order) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full border border-gray-200 p-1 text-gray-500 hover:bg-gray-50"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
        <h3 className="text-xl font-semibold text-gray-900">宣傳內容</h3>
        <p className="mb-4 text-sm text-gray-500">
          來自 {order.user_email || '匿名用戶'}．Discord：{order.discord_id || '未提供'}
        </p>
        <div className="max-h-[60vh] overflow-y-auto whitespace-pre-line rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-800">
          {order.promotion_content}
        </div>
      </div>
    </div>
  )
}

export default DiscordApplications
