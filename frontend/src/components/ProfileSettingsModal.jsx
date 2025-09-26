import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import defaultAvatar from '../assets/default-avatar.svg'

const resolveAvatarSrc = (value) => {
  if (!value) return ''
  if (/^(?:https?:)?\/\//i.test(value) || value.startsWith('data:')) return value
  const normalized = value.replace(/^\.?\/+/, '')
  return normalized ? `/${normalized}` : ''
}

const ProfileSettingsModal = ({ open, onClose, initialData, onSubmit }) => {
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setDisplayName(initialData?.displayName || '')
    setAvatarUrl(resolveAvatarSrc(initialData?.avatarUrl || ''))
  }, [open, initialData?.displayName, initialData?.avatarUrl])

  const previewSrc = useMemo(() => {
    const normalized = resolveAvatarSrc(avatarUrl)
    return normalized || defaultAvatar
  }, [avatarUrl])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (submitting) return

    const payload = {
      displayName: displayName?.trim() ?? ''
    }

    setSubmitting(true)
    try {
      await onSubmit?.(payload)
      toast.success('個人資料已更新')
      onClose?.()
    } catch (error) {
      const message = error?.response?.data?.error || error?.message || '更新失敗'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 260 }}
            className="w-full max-w-lg rounded-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <form onSubmit={handleSubmit} className="p-6 sm:p-8">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">個人資料設定</h2>
                  <p className="mt-1 text-sm text-gray-500">更新暱稱與檢視頭像</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">暱稱</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="輸入顯示名稱"
                    className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  />
                  <p className="mt-1 text-xs text-gray-400">建議 30 個字元以內</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">頭像</label>
                  <div className="mt-3 flex items-center gap-4">
                    <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                      <img
                        src={previewSrc}
                        alt="頭像預覽"
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.src = defaultAvatar
                        }}
                      />
                    </div>
                    <p className="text-sm text-gray-500">
                      頭像會依據 Google 帳號同步，無法於此變更。
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      儲存中...
                    </>
                  ) : (
                    '儲存變更'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ProfileSettingsModal
