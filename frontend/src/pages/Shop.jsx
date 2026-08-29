import { useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ShoppingBag, ShieldCheck, Coins, MessageCircle, X, Gift, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useCoin } from '../contexts/CoinContext'
import { useWebsiteAuth } from '../contexts/WebsiteAuthContext'
import { coinAPI } from '../services/api'
import defaultAvatar from '../assets/default-avatar.svg'

const TECH_EFFECT_PRODUCT_ID = 'site-tech-effect'
const NEON_EFFECT_PRODUCT_ID = 'site-neon-matrix'

const PRODUCTS = [
  {
    id: 'discord-role-king',
    name: 'DC👑｜目前還沒有用的會員',
    price: 300,
    description: '購買後會自動加入 Discord 身分組（需先加入伺服器）。',
    requireDiscordId: true
  },
  {
    id: TECH_EFFECT_PRODUCT_ID,
    name: '網站特效 - 科技感',
    price: 2000,
    description: '解鎖科技感特效按鈕，一鍵切換全站酷炫視覺。',
    unlockTechEffect: true
  },
  {
    id: NEON_EFFECT_PRODUCT_ID,
    name: '網站特效 - 霓虹矩陣',
    price: 2500,
    description: '解鎖霓虹矩陣特效，一鍵切換全站霓虹視覺。',
    unlockNeonEffect: true
  },
  {
    id: 'crcrcoin-pack-50',
    name: '50 coin',
    price: 100,
    description:
      '來點惡趣味：花 100 coin 換 50 coin，可一次購買多份數量，純屬娛樂用途。',
    allowQuantity: true
  },
  {
    id: 'promotion-service',
    name: '幫你宣傳',
    price: 2000,
    description:
      '提交宣傳內容與 Discord ID，等待管理員審核。通過後會由管理員主動聯繫並協助曝光。',
    requireDiscordId: true,
    requirePromotionContent: true
  }
]

const Modal = ({ open, title, description, children, actions, onClose }) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 transition hover:text-gray-600"
            aria-label="關閉"
          >
            <X className="h-5 w-5" />
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

const resolveAvatarSrc = (value) => {
  if (!value) return ''
  if (/^(?:https?:)?\/\//i.test(value) || value.startsWith('data:')) return value
  const normalized = value.replace(/^\.?\/+/, '')
  return normalized ? `/${normalized}` : ''
}

const clampQuantity = (value) => {
  if (!Number.isFinite(value)) return 1
  return Math.min(99, Math.max(1, Math.floor(value)))
}

const PROMOTION_CONTENT_MIN = 10
const PROMOTION_CONTENT_MAX = 500

const Shop = () => {
  const { isLoggedIn, hydrated, balance, refreshWallet } = useCoin()
  const { user, refreshUser } = useWebsiteAuth()
  const techEffectUnlocked = Boolean(user?.techEffectUnlocked || user?.tech_effect_unlocked)
  const neonEffectUnlocked = Boolean(user?.neonEffectUnlocked || user?.neon_effect_unlocked)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [step, setStep] = useState('idle')
  const [discordId, setDiscordId] = useState('')
  const [promotionContent, setPromotionContent] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [processing, setProcessing] = useState(false)
  const [giftProduct, setGiftProduct] = useState(null)
  const [giftRecipientId, setGiftRecipientId] = useState('')
  const [giftRecipient, setGiftRecipient] = useState(null)
  const [giftQuantity, setGiftQuantity] = useState(1)
  const [giftLookupLoading, setGiftLookupLoading] = useState(false)
  const [giftProcessing, setGiftProcessing] = useState(false)

  // 記錄商店訪問（用於任務系統）
  useEffect(() => {
    if (isLoggedIn && hydrated) {
      coinAPI.recordShopVisit().catch(() => {
        // 靜默失敗，不影響用戶體驗
      })
    }
  }, [isLoggedIn, hydrated])

  const closeModals = () => {
    setSelectedProduct(null)
    setStep('idle')
    setDiscordId('')
    setPromotionContent('')
    setQuantity(1)
    setProcessing(false)
  }

  const closeGiftModal = () => {
    setGiftProduct(null)
    setGiftRecipientId('')
    setGiftRecipient(null)
    setGiftQuantity(1)
    setGiftLookupLoading(false)
    setGiftProcessing(false)
  }

  const handleGiftClick = (product) => {
    if (!isLoggedIn) {
      toast.error('請先使用 Google 登入後再贈禮')
      return
    }
    if (!hydrated) {
      toast('資料同步中，請稍候')
      return
    }
    setGiftProduct(product)
    setGiftRecipientId('')
    setGiftRecipient(null)
    setGiftQuantity(1)
  }

  const handleGiftLookup = async () => {
    const trimmed = giftRecipientId.trim().toUpperCase()
    if (!trimmed) {
      toast.error('請輸入收禮者 ID')
      return
    }
    setGiftLookupLoading(true)
    try {
      const response = await coinAPI.lookupGiftRecipient(trimmed)
      setGiftRecipient(response.data?.user || null)
    } catch (error) {
      setGiftRecipient(null)
      toast.error(error.response?.data?.error || '查詢失敗')
    } finally {
      setGiftLookupLoading(false)
    }
  }

  const handleGiftQuantityInput = (event) => {
    const value = Number.parseInt(event.target.value, 10)
    if (Number.isNaN(value)) {
      setGiftQuantity(1)
      return
    }
    setGiftQuantity(clampQuantity(value))
  }

  const handleSendGift = async () => {
    if (!giftProduct) return
    if (!giftRecipient) {
      toast.error('請先查詢收禮者')
      return
    }
    const payload = {
      productId: giftProduct.id,
      recipientPublicId: giftRecipient.publicId || giftRecipientId.trim().toUpperCase()
    }
    if (giftProduct.allowQuantity) {
      payload.quantity = giftQuantity
    }
    setGiftProcessing(true)
    try {
      await coinAPI.sendGift(payload)
      toast.success('贈禮已送出')
      closeGiftModal()
      await refreshWallet()
    } catch (error) {
      toast.error(error.response?.data?.error || '贈禮失敗，請稍後再試')
    } finally {
      setGiftProcessing(false)
    }
  }

  const handleBuyClick = async (product) => {
    if (!isLoggedIn) {
      toast.error('請先使用 Google 登入後再購買')
      return
    }
    if (!hydrated) {
      toast('資料同步中，請稍候再試')
      return
    }

    // 檢查是否需要 Discord ID
    if (product.requireDiscordId) {
      try {
        const response = await coinAPI.checkDiscordBinding()
        const userDiscordId = response.data?.discordId || ''

        if (!userDiscordId) {
          toast.error('請先至個人資料設定頁面綁定 Discord 帳號，再購買此商品。', {
            duration: 5000
          })
          setTimeout(() => {
            window.location.href = '/profile'
          }, 2000)
          return
        }

        // 自動填入已綁定的 Discord ID
        setDiscordId(userDiscordId)
      } catch (error) {
        console.error('檢查 Discord 綁定失敗:', error)
        toast.error('無法檢查 Discord 綁定狀態')
        return
      }
    }

    setSelectedProduct(product)
    setQuantity(1)
    setPromotionContent('')
    setStep('confirm')
  }

  const totalCost = useMemo(() => {
    if (!selectedProduct) return 0
    const factor = selectedProduct.allowQuantity ? quantity : 1
    return selectedProduct.price * factor
  }, [selectedProduct, quantity])

  const giftTotalCost = useMemo(() => {
    if (!giftProduct) return 0
    const factor = giftProduct.allowQuantity ? giftQuantity : 1
    return giftProduct.price * factor
  }, [giftProduct, giftQuantity])

  const insufficientBalance =
    hydrated &&
    selectedProduct &&
    typeof balance === 'number' &&
    balance < totalCost

  const giftInsufficientBalance =
    hydrated &&
    giftProduct &&
    typeof balance === 'number' &&
    balance < giftTotalCost

  const handleQuantityInput = (event) => {
    const value = Number.parseInt(event.target.value, 10)
    if (Number.isNaN(value)) {
      setQuantity(1)
      return
    }
    setQuantity(clampQuantity(value))
  }

  const handlePurchase = async () => {
    if (!selectedProduct) return

    const purchasedId = selectedProduct.id
    const payload = { productId: selectedProduct.id }

    if (selectedProduct.allowQuantity) {
      payload.quantity = quantity
    }

    // Discord ID 已由後端自動使用綁定的帳號，前端不需要再傳遞
    // if (selectedProduct.requireDiscordId) {
    //   const trimmed = discordId.trim()
    //   if (!trimmed) {
    //     toast.error('請輸入 Discord ID')
    //     return
    //   }
    //   if (trimmed.length > 100) {
    //     toast.error('Discord ID 太長，請確認是否正確')
    //     return
    //   }
    //   payload.discordId = trimmed
    // }

    if (selectedProduct.requirePromotionContent) {
      const trimmedContent = promotionContent.trim()
      if (!trimmedContent) {
        toast.error('請輸入想宣傳的內容')
        return
      }
      if (trimmedContent.length < PROMOTION_CONTENT_MIN) {
        toast.error(`宣傳內容至少 ${PROMOTION_CONTENT_MIN} 個字`)
        return
      }
      if (trimmedContent.length > PROMOTION_CONTENT_MAX) {
        toast.error(`宣傳內容請控制在 ${PROMOTION_CONTENT_MAX} 個字內`)
        return
      }
      payload.promotionContent = trimmedContent
    }

    setProcessing(true)
    try {
      await coinAPI.purchaseProduct(payload)
      toast.success('購買成功！')
      closeModals()
      await refreshWallet()
      if (purchasedId === TECH_EFFECT_PRODUCT_ID || purchasedId === NEON_EFFECT_PRODUCT_ID) {
        await refreshUser()
      }
    } catch (error) {
      toast.error(error.response?.data?.error || '購買失敗，請稍後再試')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="border-b border-white/20 bg-white/95 backdrop-blur-xl shadow-sm">
        <div className="mx-auto flex w-full max-w-[1800px] items-center justify-between px-4 py-6 sm:px-16 lg:px-28">
          <Link to="/wallet" className="flex items-center text-gray-600 transition hover:text-gray-900">
            <ArrowLeft className="mr-2 h-5 w-5" />
            返回錢包
          </Link>
          <h1 className="text-2xl font-bold text-transparent bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text">
            coin 商店
          </h1>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Coins className="h-4 w-4" />
            <span>
              餘額：{hydrated ? `${Number(balance || 0).toLocaleString('zh-TW')} coin` : '同步中…'}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1800px] px-4 py-12 sm:px-14 lg:px-24">
          <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[40px] border border-white/20 bg-white/90 px-10 py-12 shadow-2xl backdrop-blur-xl lg:px-20"
        >
          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">挑選你想試試看的商品</h2>
              <p className="text-sm text-gray-600">所有商品都是虛擬體驗，購買後請留意提示訊息。</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            {PRODUCTS.map((product) => {
              const isTechEffect = product.id === TECH_EFFECT_PRODUCT_ID
              const isNeonEffect = product.id === NEON_EFFECT_PRODUCT_ID
              const alreadyOwned =
                (isTechEffect && techEffectUnlocked) ||
                (isNeonEffect && neonEffectUnlocked)
              const disabled =
                alreadyOwned ||
                !isLoggedIn ||
                (hydrated && typeof balance === 'number' && balance < product.price)
              const giftDisabled =
                !isLoggedIn ||
                (hydrated && typeof balance === 'number' && balance < product.price)
              return (
                <div
                  key={product.id}
                  className="rounded-2xl bg-gradient-to-r from-purple-100/60 via-pink-100/60 to-blue-100/60 p-[1px]"
                >
                  <div className="flex h-full flex-col justify-between rounded-2xl bg-white px-6 py-6 shadow-sm transition-shadow hover:shadow-lg lg:px-8">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg">
                        <ShieldCheck className="h-6 w-6" />
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-gray-900 md:text-xl">{product.name}</h3>
                        {product.requirePromotionContent && (
                          <div className="inline-flex items-center gap-2 rounded-full bg-pink-50 px-3 py-1 text-xs font-medium text-pink-600">
                            <MessageCircle className="h-3.5 w-3.5" />
                            需管理員審核
                          </div>
                        )}
                        {alreadyOwned && (
                          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600">
                            已解鎖
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-6 space-y-4 text-center md:text-left">
                      <div className="text-xl font-extrabold text-transparent bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text md:text-2xl">
                        價格: {product.price.toLocaleString('zh-TW')}
                        <span className="ml-1 text-base font-semibold text-purple-500 md:text-lg">coin</span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                          <button
                            type="button"
                            onClick={() => handleBuyClick(product)}
                            className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
                            disabled={disabled}
                          >
                            {alreadyOwned ? '已擁有' : isLoggedIn ? '購買' : '請先登入'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleGiftClick(product)}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-purple-200 px-6 py-2.5 text-sm font-semibold text-purple-600 shadow-sm transition hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
                            disabled={giftDisabled}
                          >
                            <Gift className="h-4 w-4" />
                            贈禮
                          </button>
                        </div>
                        {isLoggedIn &&
                          !alreadyOwned &&
                          hydrated &&
                          typeof balance === 'number' &&
                          balance < product.price && (
                          <p className="text-xs text-red-500 md:text-right">餘額不足，請先累積更多 coin。</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>

      <Modal
        open={step === 'confirm' && !!selectedProduct}
        title={`確認購買「${selectedProduct?.name ?? ''}」`}
        description={selectedProduct?.description}
        onClose={processing ? undefined : closeModals}
        actions={[
          (
            <button
              key="cancel"
              type="button"
              onClick={closeModals}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50"
              disabled={processing}
            >
              取消
            </button>
          ),
          (
            <button
              key="confirm"
              type="button"
              onClick={() => {
                if (selectedProduct?.requirePromotionContent) {
                  setStep('promotion')
                } else {
                  handlePurchase()
                }
              }}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={processing || insufficientBalance}
            >
              {selectedProduct?.requirePromotionContent
                ? '下一步'
                : `確認購買（${totalCost.toLocaleString('zh-TW')} coin）`}
            </button>
          )
        ]}
      >
        {selectedProduct?.allowQuantity && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700" htmlFor="purchase-quantity">
              購買數量
            </label>
            <input
              id="purchase-quantity"
              type="number"
              min={1}
              max={99}
              value={quantity}
              onChange={handleQuantityInput}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
              disabled={processing}
            />
            <p className="text-sm text-gray-600">總價：{totalCost.toLocaleString('zh-TW')} coin</p>
            {insufficientBalance && (
              <p className="text-xs text-red-500">餘額不足，請調整數量或先賺取更多 coin。</p>
            )}
          </div>
        )}
        {!selectedProduct?.allowQuantity && (
          <p className="text-sm text-gray-600">總價：{totalCost.toLocaleString('zh-TW')} coin</p>
        )}
      </Modal>

      <Modal
        open={step === 'promotion' && !!selectedProduct}
        title="提交宣傳資訊"
        description={`請輸入想宣傳的內容（${PROMOTION_CONTENT_MIN}~${PROMOTION_CONTENT_MAX} 字），並留下 Discord ID 方便管理員聯繫。`}
        onClose={processing ? undefined : closeModals}
        actions={[
          (
            <button
              key="cancel-promotion"
              type="button"
              onClick={closeModals}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50"
              disabled={processing}
            >
              取消
            </button>
          ),
          (
            <button
              key="confirm-promotion"
              type="button"
              onClick={handlePurchase}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={processing || insufficientBalance}
            >
              {processing ? '處理中…' : `送出申請（${totalCost.toLocaleString('zh-TW')} coin）`}
            </button>
          )
        ]}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="promotion-content">
              想宣傳的內容
            </label>
            <textarea
              id="promotion-content"
              rows={5}
              maxLength={PROMOTION_CONTENT_MAX}
              value={promotionContent}
              onChange={(event) => setPromotionContent(event.target.value)}
              placeholder="請描述想宣傳的活動、連結或服務，管理員會人工審核內容。"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
              disabled={processing}
            />
            <div className="mt-1 text-right text-xs text-gray-500">
              {promotionContent.length}/{PROMOTION_CONTENT_MAX}
            </div>
          </div>
          <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3">
            <p className="text-sm text-green-800">
              將使用您已綁定的 Discord 帳號進行購買
            </p>
          </div>
          {insufficientBalance && (
            <p className="text-xs text-red-500">餘額不足，請先累積更多 coin 再送出申請。</p>
          )}
        </div>
      </Modal>

      <Modal
        open={!!giftProduct}
        title={`贈送「${giftProduct?.name ?? ''}」`}
        description="輸入收禮者的個人 ID（大寫字母+數字）並確認贈禮。"
        onClose={giftProcessing ? undefined : closeGiftModal}
        actions={[
          (
            <button
              key="cancel-gift"
              type="button"
              onClick={closeGiftModal}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50"
              disabled={giftProcessing}
            >
              取消
            </button>
          ),
          (
            <button
              key="confirm-gift"
              type="button"
              onClick={handleSendGift}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={giftProcessing || giftLookupLoading || !giftRecipient || giftInsufficientBalance}
            >
              {giftProcessing
                ? '處理中…'
                : `確認贈禮（${giftTotalCost.toLocaleString('zh-TW')} coin）`}
            </button>
          )
        ]}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700" htmlFor="gift-recipient">
              收禮者 ID
            </label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                id="gift-recipient"
                type="text"
                value={giftRecipientId}
                onChange={(event) => {
                  const value = event.target.value.toUpperCase()
                  setGiftRecipientId(value)
                  setGiftRecipient(null)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    handleGiftLookup()
                  }
                }}
                className="w-full flex-1 rounded-xl border border-gray-200 px-4 py-3 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
                placeholder="例如：AB12CD34"
                disabled={giftProcessing}
              />
              <button
                type="button"
                onClick={handleGiftLookup}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-60"
                disabled={giftLookupLoading || giftProcessing}
              >
                {giftLookupLoading ? (
                  '查詢中…'
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    查詢
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500">ID 會自動轉為大寫。</p>
          </div>

          {giftRecipient && (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <img
                src={resolveAvatarSrc(giftRecipient.avatarUrl) || defaultAvatar}
                alt={giftRecipient.displayName || 'avatar'}
                className="h-12 w-12 rounded-full object-cover"
                onError={(event) => {
                  event.currentTarget.src = defaultAvatar
                }}
              />
              <div>
                <p className="text-sm font-semibold text-emerald-900">
                  {giftRecipient.displayName || '未命名使用者'}
                </p>
                <p className="text-xs text-emerald-700">
                  ID：{giftRecipient.publicId || giftRecipientId}
                </p>
              </div>
            </div>
          )}

          {giftProduct?.allowQuantity && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700" htmlFor="gift-quantity">
                贈禮數量
              </label>
              <input
                id="gift-quantity"
                type="number"
                min={1}
                max={99}
                value={giftQuantity}
                onChange={handleGiftQuantityInput}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
                disabled={giftProcessing}
              />
            </div>
          )}

          <div className="text-sm text-gray-600">
            總價：{giftTotalCost.toLocaleString('zh-TW')} coin
          </div>
          {giftInsufficientBalance && (
            <p className="text-xs text-red-500">餘額不足，無法贈禮。</p>
          )}
        </div>
      </Modal>

    </div>
  )
}

export default Shop
