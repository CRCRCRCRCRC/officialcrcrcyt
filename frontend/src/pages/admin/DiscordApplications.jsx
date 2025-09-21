import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { coinAPI } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'

const DiscordApplications = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchOrders = async () => {
    try {
      if (loading) {
        setLoading(true)
      } else {
        setRefreshing(true)
      }
      const response = await coinAPI.getOrders()
      setOrders(response.data?.orders || [])
    } catch (error) {
      toast.error(error.response?.data?.error || '無法取得訂單資料')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const formatDateTime = (value) => {
    if (!value) return '未知時間'
    try {
      return new Date(value).toLocaleString('zh-TW', {
        hour12: false
      })
    } catch {
      return value
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
                  Discord 申請紀錄
                </h1>
                <p className="text-sm text-gray-600">
                  查看使用者購買商品時留下的 Discord ID，方便後續指派身分組
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={fetchOrders}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
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
            目前還沒有任何購買申請。
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用戶 Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">商品</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">價格</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discord ID</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{formatDateTime(order.created_at)}</td>
                      <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{order.user_email || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{order.product_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{Number(order.price || 0).toLocaleString('zh-TW')} CRCRCoin</td>
                      <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap font-mono">{order.discord_id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default DiscordApplications
