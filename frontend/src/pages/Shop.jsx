import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ShoppingBag, ShieldCheck, Coins, MessageCircle, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useCoin } from '../contexts/CoinContext'
import { coinAPI } from '../services/api'

const PRODUCTS = [
  {
    id: 'discord-role-king',
    name: 'DC????????????',
    price: 300,
    description: '?????? Discord ID?????????????',
    requireDiscordId: true
  },
  {
    id: 'crcrcoin-pack-50',
    name: '50 CRCRCoin',
    price: 100,
    description:
      '??????? 100 CRCRCoin ? 50 CRCRCoin??????????????????',
    allowQuantity: true
  },
  {
    id: 'promotion-service',
    name: '????',
    price: 650,
    description:
      '??????? Discord ID???????????????????????????',
    requireDiscordId: true,
    requirePromotionContent: true
  }
]

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

const clampQuantity = (value) => {
  if (!Number.isFinite(value)) return 1
  return Math.min(99, Math.max(1, Math.floor(value)))
}

const PROMOTION_CONTENT_MIN = 10
const PROMOTION_CONTENT_MAX = 500

const Shop = () => {
  const { isLoggedIn, hydrated, balance, refreshWallet } = useCoin()
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [step, setStep] = useState('idle')
  const [discordId, setDiscordId] = useState('')
  const [promotionContent, setPromotionContent] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [processing, setProcessing] = useState(false)

  const closeModals = () => {
    setSelectedProduct(null)
    setStep('idle')
    setDiscordId('')
    setPromotionContent('')
    setQuantity(1)
    setProcessing(false)
  }

  const handleBuyClick = (product) => {
    if (!isLoggedIn) {
      toast.error('請先使用 Google 登入後再購買')
      return
    }
    if (!hydrated) {
      toast('資料同步中，請稍候再試')
      return
    }
    setSelectedProduct(product)
    setQuantity(1)
    setDiscordId('')
    setPromotionContent('')
    setStep('confirm')
  }

  const totalCost = useMemo(() => {
    if (!selectedProduct) return 0
    const factor = selectedProduct.allowQuantity ? quantity : 1
    return selectedProduct.price * factor
  }, [selectedProduct, quantity])

  const insufficientBalance =
    hydrated &&
    selectedProduct &&
    typeof balance === 'number' &&
    balance < totalCost

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

    const payload = { productId: selectedProduct.id }

    if (selectedProduct.allowQuantity) {
      payload.quantity = quantity
    }

    if (selectedProduct.requireDiscordId) {
      const trimmed = discordId.trim()
      if (!trimmed) {
        toast.error('請輸入 Discord ID')
        return
      }
      if (trimmed.length > 100) {
        toast.error('Discord ID 太長，請確認是否正確')
        return
      }
      payload.discordId = trimmed
    }

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
    } catch (error) {
      toast.error(error.response?.data?.error || '購買失敗，請稍後再試')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="border-b border-white/20 bg-white/95 backdrop-blur-xl shadow-sm">
        <div className="mx-auto flex w-full max-w-[1800px] items-center justify-between px-4 py-6 sm:px-16 lg:px-28">
          <Link to="/wallet" className="flex items-center text-gray-600 transition hover:text-gray-900">
            <ArrowLeft className="mr-2 h-5 w-5" />
            返回錢包
          </Link>
          <h1 className="text-2xl font-bold text-transparent bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text">
            CRCRCoin 商店
          </h1>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Coins className="h-4 w-4" />
            <span>
              餘額：{hydrated ? `${Number(balance || 0).toLocaleString('zh-TW')} CRCRCoin` : '同步中…'}
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
              const disabled = !isLoggedIn || (hydrated && typeof balance === 'number' && balance < product.price)
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
                      </div>
                    </div>
                    <div className="mt-6 space-y-4 text-center md:text-left">
                      <div className="text-xl font-extrabold text-transparent bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text md:text-2xl">
                        價格: {product.price.toLocaleString('zh-TW')}
                        <span className="ml-1 text-base font-semibold text-purple-500 md:text-lg">CRCRCoin</span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <button
                          type="button"
                          onClick={() => handleBuyClick(product)}
                          className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
                          disabled={disabled}
                        >
                          {isLoggedIn ? '購買' : '請先登入'}
                        </button>
                        {isLoggedIn && hydrated && typeof balance === 'number' && balance < product.price && (
                          <p className="text-xs text-red-500 md:text-right">餘額不足，請先累積更多 CRCRCoin。</p>
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
                } else if (selectedProduct?.requireDiscordId) {
                  setStep('discord')
                } else {
                  handlePurchase()
                }
              }}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={processing || insufficientBalance}
            >
              {selectedProduct?.requireDiscordId || selectedProduct?.requirePromotionContent
                ? '下一步'
                : `確認購買（${totalCost.toLocaleString('zh-TW')} CRCRCoin）`}
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
            <p className="text-sm text-gray-600">總價：{totalCost.toLocaleString('zh-TW')} CRCRCoin</p>
            {insufficientBalance && (
              <p className="text-xs text-red-500">餘額不足，請調整數量或先賺取更多 CRCRCoin。</p>
            )}
          </div>
        )}
        {!selectedProduct?.allowQuantity && (
          <p className="text-sm text-gray-600">總價：{totalCost.toLocaleString('zh-TW')} CRCRCoin</p>
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
              {processing ? '處理中…' : `送出申請（${totalCost.toLocaleString('zh-TW')} CRCRCoin）`}
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
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="promotion-discord">
              Discord ID
            </label>
            <input
              id="promotion-discord"
              type="text"
              value={discordId}
              onChange={(event) => setDiscordId(event.target.value)}
              placeholder="例如：123456789012345678"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
              disabled={processing}
            />
          </div>
          {insufficientBalance && (
            <p className="text-xs text-red-500">餘額不足，請先累積更多 CRCRCoin 再送出申請。</p>
          )}
        </div>
      </Modal>

      <Modal
        open={step === 'discord' && !!selectedProduct}
        title="輸入 Discord ID"
        description="請輸入要套用身分組的 Discord ID（開啟 Discord 開發者模式即可複製 ID）。"
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
              onClick={handlePurchase}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={processing || insufficientBalance}
            >
              {processing ? '處理中…' : `確認購買（${totalCost.toLocaleString('zh-TW')} CRCRCoin）`}
            </button>
          )
        ]}
      >
        <input
          type="text"
          value={discordId}
          onChange={(event) => setDiscordId(event.target.value)}
          placeholder="範例：123456789012345678"
          className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
          disabled={processing}
        />
        {insufficientBalance && (
          <p className="mt-3 text-xs text-red-500">餘額不足，請先累積更多 CRCRCoin。</p>
        )}
      </Modal>
    </div>
  )
}

export default Shop
