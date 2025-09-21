import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ShoppingBag, ShieldCheck, Coins, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useCoin } from '../contexts/CoinContext'
import { coinAPI } from '../services/api'

const PRODUCTS = [
  {
    id: 'discord-role-king',
    name: 'DC👑｜目前還沒有用的會員◉⁠‿⁠◉',
    price: 300,
    description: '單純支持用的會員身分組，會通知管理員您的 Discord ID 後續手動處理。'
  }
]

const Modal = ({ open, title, description, children, actions, onClose }) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          aria-label="關閉"
        >
          ✕
        </button>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
        {description && <p className="text-sm text-gray-600 mb-4 whitespace-pre-line">{description}</p>}
        {children}
        <div className="mt-6 flex justify-end gap-3">
          {actions}
        </div>
      </div>
    </div>
  )
}

const Shop = () => {
  const { isLoggedIn, hydrated, balance, refreshWallet } = useCoin()
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [step, setStep] = useState('idle')
  const [discordId, setDiscordId] = useState('')
  const [processing, setProcessing] = useState(false)

  const closeModals = () => {
    setSelectedProduct(null)
    setStep('idle')
    setDiscordId('')
    setProcessing(false)
  }

  const handleBuyClick = (product) => {
    if (!isLoggedIn) {
      toast.error('請先使用 Google 登入後再購買。')
      return
    }
    if (!hydrated) {
      toast('正在同步錢包資訊，請稍候…')
      return
    }
    setSelectedProduct(product)
    setStep('confirm')
  }

  const handlePurchase = async () => {
    if (!selectedProduct) return
    const trimmed = discordId.trim()
    if (!trimmed) {
      toast.error('請輸入 Discord ID')
      return
    }
    setProcessing(true)
    try {
      await coinAPI.purchaseProduct(selectedProduct.id, trimmed)
      toast.success('購買成功！我們會盡快處理您的身分組。')
      closeModals()
      await refreshWallet()
    } catch (error) {
      toast.error(error.response?.data?.error || '購買失敗，請稍後再試')
    } finally {
      setProcessing(false)
    }
  }

  const insufficientBalance =
    hydrated && selectedProduct && typeof balance === 'number' && balance < selectedProduct.price

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="bg-white/95 backdrop-blur-xl border-b border-white border-opacity-20 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <Link
              to="/wallet"
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              返回錢包
            </Link>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              CRCRCoin 商城
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Coins className="w-4 h-4" />
              <span>
                目前餘額：{hydrated ? `${Number(balance || 0).toLocaleString('zh-TW')} CRCRCoin` : '同步中…'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl border border-white/25 rounded-3xl shadow-xl p-8"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">支援我們的最新方式</h2>
              <p className="text-sm text-gray-600">購買後會通知管理員手動為您指派 Discord 身分組</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {PRODUCTS.map((product) => (
              <div
                key={product.id}
                className="border border-purple-100 rounded-2xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-purple-500" />
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-2 flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-gray-400" />
                      {product.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-600">{product.price.toLocaleString('zh-TW')} CRCRCoin</div>
                    <button
                      type="button"
                      onClick={() => handleBuyClick(product)}
                      className="mt-3 inline-flex items-center justify-center px-5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow hover:shadow-md transition disabled:opacity-60 disabled:cursor-not-allowed"
                      disabled={!isLoggedIn || (hydrated && balance < product.price)}
                    >
                      {isLoggedIn ? '購買' : '請先登入'}
                    </button>
                    {isLoggedIn && hydrated && balance < product.price && (
                      <p className="text-xs text-red-500 mt-2">餘額不足，請先累積 CRCRCoin 再嘗試購買。</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <Modal
        open={step === 'confirm' && !!selectedProduct}
        title="確認購買"
        description={`此身分組目前沒啥意義，純屬支持用途。
確認購買「${selectedProduct?.name}」嗎？`}
        onClose={closeModals}
        actions={[
          (
            <button
              key="cancel"
              type="button"
              onClick={closeModals}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              取消
            </button>
          ),
          (
            <button
              key="next"
              type="button"
              onClick={() => setStep('discord')}
              className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
            >
              我要購買
            </button>
          )
        ]}
      />

      <Modal
        open={step === 'discord' && !!selectedProduct}
        title="輸入 Discord ID"
        description="請輸入要套用身分組的 Discord ID（右鍵個人頭像可複製 ID）。"
        onClose={processing ? undefined : closeModals}
        actions={[
          (
            <button
              key="cancel"
              type="button"
              onClick={closeModals}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
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
              className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60"
              disabled={processing || insufficientBalance}
            >
              {processing ? '處理中…' : `確認扣除 ${selectedProduct?.price.toLocaleString('zh-TW')} CRCRCoin`}
            </button>
          )
        ]}
      >
        <input
          type="text"
          value={discordId}
          onChange={(e) => setDiscordId(e.target.value)}
          placeholder="例如：123456789012345678"
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          disabled={processing}
        />
        {insufficientBalance && (
          <p className="text-xs text-red-500 mt-3">餘額不足，請先補足 CRCRCoin 再購買。</p>
        )}
      </Modal>
    </div>
  )
}

export default Shop
