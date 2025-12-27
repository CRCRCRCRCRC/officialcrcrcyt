import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ClipboardList, Loader2, Sparkles, CheckCircle2, Clock, Rocket } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCoin } from '../contexts/CoinContext'
import { coinAPI } from '../services/api'

const FREQUENCY_LABELS = {
  daily: '每日任務',
  once: '成就任務'
}

const STATUS_META = {
  available: {
    label: '可完成',
    badge: 'bg-emerald-100 text-emerald-600 border border-emerald-200',
    tone: 'text-emerald-600',
    icon: Sparkles
  },
  cooldown: {
    label: '冷卻中',
    badge: 'bg-amber-100 text-amber-600 border border-amber-200',
    tone: 'text-amber-600',
    icon: Clock
  },
  completed: {
    label: '已完成',
    badge: 'bg-purple-100 text-purple-600 border border-purple-200',
    tone: 'text-purple-600',
    icon: CheckCircle2
  }
}

const formatCountdown = (ms) => {
  if (!ms || ms <= 0) return '00:00:00'
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds].map((v) => String(v).padStart(2, '0')).join(':')
}

const groupTasks = (tasks = []) => {
  const buckets = {}
  tasks.forEach((task) => {
    const key = task.frequency || 'other'
    if (!buckets[key]) buckets[key] = []
    buckets[key].push(task)
  })
  return buckets
}

const Tasks = () => {
  const { isLoggedIn } = useCoin()
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState([])
  const [completing, setCompleting] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const grouped = useMemo(() => groupTasks(tasks), [tasks])

  const fetchTasks = async (initial = false) => {
    if (!isLoggedIn) return
    initial ? setLoading(true) : setRefreshing(true)
    try {
      const response = await coinAPI.getPassTasks()
      setTasks(response.data?.tasks || [])
    } catch (error) {
      toast.error(error.response?.data?.error || '無法取得任務列表')
    } finally {
      initial ? setLoading(false) : setRefreshing(false)
    }
  }

  useEffect(() => {
    if (isLoggedIn) {
      fetchTasks(true)
    } else {
      setTasks([])
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn])

  const handleComplete = async (taskId) => {
    if (!taskId || completing) return
    setCompleting(taskId)
    try {
      const response = await coinAPI.completePassTask(taskId)
      const rewardXp = response.data?.reward?.xp || 0
      if (rewardXp > 0) {
        toast.success(`獲得 ${rewardXp} XP！`)
      } else {
        toast.success('任務完成')
      }
      setTasks(response.data?.tasks || [])
    } catch (error) {
      toast.error(error.response?.data?.error || '無法完成任務')
    } finally {
      setCompleting(null)
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-[60vh] bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center px-4">
        <div className="max-w-md rounded-3xl border border-white/60 bg-white/90 shadow-2xl p-8 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
            <ClipboardList className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">請先登入</h1>
          <p className="text-gray-600 text-sm leading-relaxed">
            登入後即可查看可完成的任務，獲得通行券 XP，提升等級解鎖更多獎勵！
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="bg-white/95 backdrop-blur-xl border-b border-white/30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <Link to="/wallet" className="flex items-center text-gray-600 hover:text-gray-900 transition">
            <ArrowLeft className="w-5 h-5 mr-2" />
            返回錢包
          </Link>
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.4em] text-gray-500">Pass Mission</p>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 justify-center">
              <Rocket className="w-5 h-5 text-primary-500" />
              通行券任務中心
            </h1>
          </div>
          <button
            type="button"
            onClick={() => fetchTasks(false)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50 disabled:opacity-60"
            disabled={refreshing || loading}
          >
            <Loader2 className={`w-4 h-4 ${refreshing ? 'animate-spin' : 'hidden'}`} />
            重新整理
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        <section className="rounded-3xl border border-white/40 bg-gradient-to-br from-white/95 via-purple-50/70 to-pink-50/70 shadow-xl p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-500">完成任務累積 XP，快速提升通行券等級。</p>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                今日任務狀態
              </h2>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : (
          Object.entries(grouped).map(([frequency, list]) => (
            <section key={frequency} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{FREQUENCY_LABELS[frequency] || '任務'}</h3>
                  <p className="text-sm text-gray-500">
                    {frequency === 'daily'
                      ? '每日任務於台北時間凌晨重置。'
                      : '完成一次即可獲得額外 XP，將在未來開放更多成就任務。'}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {list.map((task) => {
                  const status = STATUS_META[task.status] || STATUS_META.available
                  const StatusIcon = status.icon || Sparkles
                  return (
                    <div
                      key={task.id}
                      className="rounded-3xl border border-white/60 bg-white/95 shadow-xl p-6 flex flex-col gap-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg">
                            <StatusIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-lg font-semibold text-gray-900">{task.title}</span>
                              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${status.badge}`}>
                                {status.label}
                              </span>
                              <span className="inline-flex items-center rounded-full bg-white border border-purple-200 px-3 py-1 text-xs font-semibold text-purple-600">
                                +{task.xp} XP
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-gray-600">{task.description}</p>
                            {task.status === 'cooldown' && task.nextAvailableAt && (
                              <p className="mt-2 text-xs text-amber-600">
                                距離重置：{formatCountdown(task.availableInMs)}（{new Date(task.nextAvailableAt).toLocaleString('zh-TW', { hour12: false })}）
                              </p>
                            )}
                            {task.completedCount > 0 && task.frequency === 'once' && (
                              <p className="mt-2 text-xs text-gray-400">已完成次數：{task.completedCount}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
                        <button
                          type="button"
                          onClick={() => handleComplete(task.id)}
                          disabled={task.status !== 'available' || completing === task.id}
                          className={`inline-flex items-center justify-center rounded-xl px-5 py-2 text-sm font-semibold transition ${
                            task.status === 'available'
                              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {completing === task.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : task.status === 'available' ? (
                            '立即檢查'
                          ) : task.status === 'completed' ? (
                            '已完成'
                          ) : (
                            `冷卻中`
                          )}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  )
}

export default Tasks
