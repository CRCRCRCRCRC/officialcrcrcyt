import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Package, Loader2, MessageCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCoin } from '../contexts/CoinContext'
import { useWebsiteAuth } from '../contexts/WebsiteAuthContext'
import { coinAPI } from '../services/api'

const PROMOTION_CONTENT_MIN = 10
const PROMOTION_CONTENT_MAX = 500

const Modal = ({ open, title, description, children, actions, onClose }) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 transition hover:text-gray-600"
            aria-label="關閉"
          >
            X
          </button>
        )}
        <h3 className="mb-2 text-xl font-semibold text-gray-900">{title}</h3>
        {description && <p className="mb-4 text-sm text-gray-600 whitespace-pre-line">{description}</p>}
        {children}
        <div className="mt-6 flex justify-end gap-3">{actions}</div>
      </div>
    </div>
  )
}

const formatDateTime = (value) => {
  if (!value) return '未知時間'
  try {
    return new Date(value).toLocaleString('zh-TW', { hour12: false })
  } catch {
    return value
  }
}

const Backpack = () => {
  const { isLoggedIn, refreshWallet } = useCoin()
  const { refreshUser } = useWebsiteAuth()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [usingId, setUsingId] = useState(null)
  const [promotionModal, setPromotionModal] = useState({ open: false, item: null, content: '' })

  const fetchBackpack = async () => {
    setLoading(true)
    try {
      const res = await coinAPI.getBackpack()
      setItems(res.data?.items || [])
    } catch (error) {
      toast.error(error.response?.data?.error || '無法取得背包')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isLoggedIn) {
      fetchBackpack()
    } else {
      setItems([])
      setLoading(false)
    }
  }, [isLoggedIn])

  const updateItemState = (updatedItem) => {
    if (!updatedItem) return
    setItems((prev) =>
      prev.flatMap((entry) => {
        if (entry.id !== updatedItem.id) return [entry]
        const next = { ...entry, ...updatedItem, product: entry.product }
        return Number(next.quantity) > 0 ? [next] : []
      })
    )
  }

  const handleUse = async (item, payload = {}) => {
    if (!item?.id) return false
    setUsingId(item.id)
    try {
      const res = await coinAPI.useBackpackItem(item.id, payload)
      const updatedItem = res.data?.item
      updateItemState(updatedItem)

      if (res.data?.wallet) {
        await refreshWallet()
      }
      if (res.data?.techEffectUnlocked) {
        await refreshUser()
      }

      if (res.data?.order) {
        toast.success('已送出宣傳內容，等待審核')
      } else {
        toast.success('使用成功')
      }
      return true
    } catch (error) {
      toast.error(error.response?.data?.error || '使用失敗')
      return false
    } finally {
      setUsingId(null)
    }
  }

  const openPromotionModal = (item) => {
    setPromotionModal({ open: true, item, content: '' })
  }

  const closePromotionModal = () => {
    setPromotionModal({ open: false, item: null, content: '' })
  }

  const handleSubmitPromotion = async () => {
    const item = promotionModal.item
    if (!item) return
    const trimmed = promotionModal.content.trim()
    if (!trimmed) {
      toast.error('請輸入宣傳內容')
      return
    }
    if (trimmed.length < PROMOTION_CONTENT_MIN) {
      toast.error(`宣傳內容至少 ${PROMOTION_CONTENT_MIN} 字`)
      return
    }
    if (trimmed.length > PROMOTION_CONTENT_MAX) {
      toast.error(`宣傳內容最多 ${PROMOTION_CONTENT_MAX} 字`)
      return
    }
    const success = await handleUse(item, { promotionContent: trimmed })
    if (success) {
      closePromotionModal()
    }
  }

  const pendingPromotionItem = promotionModal.item
  const pendingPromotionLength = useMemo(
    () => promotionModal.content.length,
    [promotionModal.content]
  )

  if (!isLoggedIn) {
    return (
      <div className="min-h-[60vh] bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center px-4">
        <div className="max-w-md rounded-3xl border border-white/60 bg-white/90 shadow-2xl p-8 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
            <Package className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">請先登入</h1>
          <p className="text-gray-600 text-sm leading-relaxed">
            登入 CRCRC 帳號後即可查看背包與使用收到的禮物。
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
          <Link to="/shop" className="flex items-center text-gray-600 hover:text-gray-900 transition">
            <ArrowLeft className="w-5 h-5 mr-2" />
            返回商店
          </Link>
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.4em] text-gray-500">Backpack</p>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 justify-center">
              <Package className="w-5 h-5 text-primary-500" />
              背包
            </h1>
          </div>
          <button
            type="button"
            onClick={fetchBackpack}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50 disabled:opacity-60"
            disabled={loading}
          >
            重新整理
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-white/60 bg-white/90 shadow-xl p-10 text-center text-gray-500">
            <p className="text-lg font-medium">背包目前是空的</p>
            <p className="text-sm mt-2 text-gray-400">收到禮物或兌換後會出現在這裡。</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              const product = item.product || {}
              const isUsing = usingId === item.id
              return (
                <div
                  key={item.id}
                  className="rounded-3xl border border-white/60 bg-white/95 shadow-xl p-6 flex flex-col gap-5"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg">
                      <Package className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">{item.productName}</h3>
                        <span className="text-xs text-gray-500">數量：{item.quantity}</span>
                      </div>
                      {product.description && (
                        <p className="mt-2 text-sm text-gray-600">{product.description}</p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {product.requirePromotionContent && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-pink-50 px-3 py-1 text-xs font-medium text-pink-600">
                            <MessageCircle className="h-3.5 w-3.5" />
                            需提交宣傳內容
                          </span>
                        )}
                        {product.requireDiscordId && (
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                            需綁定 Discord
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-xs text-gray-500">取得時間：{formatDateTime(item.createdAt)}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (product.requirePromotionContent) {
                          openPromotionModal(item)
                        } else {
                          handleUse(item)
                        }
                      }}
                      className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl disabled:opacity-60"
                      disabled={isUsing}
                    >
                      {isUsing ? '處理中…' : '使用'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Modal
        open={promotionModal.open && !!pendingPromotionItem}
        title={`提交宣傳內容：${pendingPromotionItem?.productName || ''}`}
        description={`請輸入宣傳內容（${PROMOTION_CONTENT_MIN}~${PROMOTION_CONTENT_MAX} 字），送出後需等待管理員審核。`}
        onClose={usingId ? undefined : closePromotionModal}
        actions={[
          (
            <button
              key="cancel-promo"
              type="button"
              onClick={closePromotionModal}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50"
              disabled={usingId !== null}
            >
              取消
            </button>
          ),
          (
            <button
              key="confirm-promo"
              type="button"
              onClick={handleSubmitPromotion}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={usingId !== null}
            >
              {usingId ? '處理中…' : '送出'}
            </button>
          )
        ]}
      >
        <div className="space-y-3">
          <textarea
            rows={6}
            maxLength={PROMOTION_CONTENT_MAX}
            value={promotionModal.content}
            onChange={(event) => setPromotionModal((prev) => ({ ...prev, content: event.target.value }))}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
            placeholder="請描述要宣傳的活動、連結或內容。"
            disabled={usingId !== null}
          />
          <div className="text-right text-xs text-gray-500">
            {pendingPromotionLength}/{PROMOTION_CONTENT_MAX}
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Backpack
