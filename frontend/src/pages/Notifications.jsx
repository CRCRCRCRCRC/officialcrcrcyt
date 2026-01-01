import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Bell, Trash2, RefreshCw, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCoin } from '../contexts/CoinContext'
import { coinAPI } from '../services/api'

const STATUS_META = {
  accepted: {
    label: '已通過',
    colorClass: 'text-emerald-600 bg-emerald-50',
    icon: CheckCircle2
  },
  rejected: {
    label: '已回絕',
    colorClass: 'text-rose-600 bg-rose-50',
    icon: AlertTriangle
  }
}

const Notifications = () => {
  const { isLoggedIn, markNotificationsRead } = useCoin()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [dismissingId, setDismissingId] = useState(null)

  const formatDateTime = (value) => {
    if (!value) return '未知時間'
    try {
      return new Date(value).toLocaleString('zh-TW', { hour12: false })
    } catch {
      return value
    }
  }

  const fetchNotifications = async (options = { initial: false }) => {
    if (!isLoggedIn) return
    if (options.initial) {
      setLoading(true)
    } else {
      setRefreshing(true)
    }
    try {
      const response = await coinAPI.getNotifications('all')
      const list = response.data?.notifications || []
      setNotifications(list)
      markNotificationsRead()
    } catch (error) {
      toast.error(error.response?.data?.error || '無法取得通知')
    } finally {
      if (options.initial) {
        setLoading(false)
      } else {
        setRefreshing(false)
      }
    }
  }

  useEffect(() => {
    if (isLoggedIn) {
      fetchNotifications({ initial: true })
    } else {
      setNotifications([])
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn])

  const handleDismiss = async (notificationId) => {
    if (!notificationId) return
    setDismissingId(notificationId)
    try {
      await coinAPI.dismissNotification(notificationId)
      setNotifications((prev) => prev.filter((item) => item.id !== notificationId))
      toast.success('通知已刪除')
    } catch (error) {
      toast.error(error.response?.data?.error || '刪除通知失敗')
    } finally {
      setDismissingId(null)
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-[60vh] bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center px-4">
        <div className="max-w-md rounded-3xl border border-white/60 bg-white/90 shadow-2xl p-8 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
            <Bell className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">請先登入</h1>
          <p className="text-gray-600 text-sm leading-relaxed">
            登入 CRCRC 帳號即可接收「幫你宣傳」等人工審核商品的最新通知。
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl"
          >
            返回首頁
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="bg-white/95 backdrop-blur-xl border-b border-white/30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <Link to="/" className="flex items-center text-gray-600 hover:text-gray-900 transition">
            <ArrowLeft className="w-5 h-5 mr-2" />
            返回首頁
          </Link>
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.4em] text-gray-500">Notification Center</p>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 justify-center">
              <Bell className="w-5 h-5 text-primary-500" />
              通知中心
            </h1>
          </div>
          <button
            type="button"
            onClick={() => fetchNotifications({ initial: false })}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50 disabled:opacity-60"
            disabled={refreshing || loading}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            重新整理
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-3xl border border-white/60 bg-white/90 shadow-xl p-10 text-center text-gray-500">
            <p className="text-lg font-medium">目前沒有任何通知</p>
            <p className="text-sm mt-2 text-gray-400">等待管理員審核的服務會在完成後出現在這裡。</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => {
              const meta = STATUS_META[notification.status] || STATUS_META.accepted
              const Icon = meta.icon || Bell
              return (
                <div
                  key={notification.id}
                  className="rounded-3xl border border-white/60 bg-white/95 shadow-xl p-6 flex flex-col gap-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${meta.colorClass}`}>
                          {meta.label}
                        </span>
                        <span className="text-xs text-gray-400">{formatDateTime(notification.createdAt)}</span>
                      </div>
                      <p className="mt-2 text-gray-800 whitespace-pre-line">{notification.message}</p>
                      <p className="mt-2 text-xs text-gray-500">
                        商品：{notification.productName || '幫你宣傳'}｜金額：{Number(notification.price || 0).toLocaleString('zh-TW')} CRCRCoin
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
                    <button
                      type="button"
                      onClick={() => handleDismiss(notification.id)}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60 whitespace-nowrap"
                      disabled={dismissingId === notification.id}
                    >
                      {dismissingId === notification.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      刪除
                    </button>
                    <Link
                      to="/shop"
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:shadow-xl whitespace-nowrap"
                    >
                      前往商店
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Notifications
