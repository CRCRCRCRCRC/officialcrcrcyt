import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ShoppingBag, Package, Crown, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCoin } from '../contexts/CoinContext'
import toast from 'react-hot-toast'

const Shop = () => {
  const { isLoggedIn, balance, spendCoins } = useCoin()
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showDiscordDialog, setShowDiscordDialog] = useState(false)
  const [discordId, setDiscordId] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const handlePurchaseClick = () => {
    setShowConfirmDialog(true)
  }

  const handleConfirmPurchase = () => {
    setShowConfirmDialog(false)
    setShowDiscordDialog(true)
  }

  const handleDiscordSubmit = async () => {
    if (!discordId.trim()) {
      toast.error('請輸入您的 Discord ID')
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch('/api/coin/purchase-discord-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('website_token')}`
        },
        body: JSON.stringify({ discordId: discordId.trim() })
      })

      const result = await response.json()

      if (result.success) {
        toast.success('購買成功！管理員將會處理您的身分組申請。')
        setShowDiscordDialog(false)
        setDiscordId('')
        // 刷新錢包餘額
        window.location.reload()
      } else {
        toast.error(result.error || '購買失敗')
      }
    } catch (error) {
      console.error('購買失敗:', error)
      toast.error('購買失敗，請稍後再試')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
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
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl border border-white/25 rounded-2xl shadow-xl p-8"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">精選商品</h2>
            <p className="text-gray-600">
              使用您的 CRCRCoin 購買專屬商品和服務
            </p>
          </div>

          {/* Product Card */}
          <div className="max-w-md mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-2xl p-6 shadow-lg"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  👑｜目前還沒有用的會員◉⁠‿⁠◉
                </h3>
                <p className="text-gray-600 mb-4 text-sm">
                  Discord 專屬身分組<br />
                  <span className="text-yellow-600 font-medium">300 CRCRCoin</span>
                </p>

                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm text-gray-500">目前餘額</span>
                  <span className="font-bold text-lg text-gray-900">
                    {isLoggedIn ? `${balance} CRCRCoin` : '請先登入'}
                  </span>
                </div>

                <button
                  onClick={handlePurchaseClick}
                  disabled={!isLoggedIn || balance < 300}
                  className={`w-full py-3 px-6 rounded-xl font-semibold text-white transition-all ${
                    (!isLoggedIn || balance < 300)
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {!isLoggedIn
                    ? '請先登入'
                    : (balance < 300 ? '餘額不足' : '立即購買')
                  }
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full"
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">確認購買</h3>
              <p className="text-gray-600 mb-6">
                此身分組目前沒啥意義，<br />
                您確定要購買嗎？
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmPurchase}
                  className="flex-1 py-2 px-4 bg-yellow-500 text-white rounded-xl font-semibold hover:bg-yellow-600 transition-colors"
                >
                  確認購買
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Discord ID Dialog */}
      {showDiscordDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full"
          >
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900 mb-4">輸入 Discord ID</h3>
              <p className="text-gray-600 mb-4 text-sm">
                請輸入您的 Discord 使用者 ID，<br />
                管理員將會為您設置身分組
              </p>
              <input
                type="text"
                value={discordId}
                onChange={(e) => setDiscordId(e.target.value)}
                placeholder="請輸入您的 Discord ID"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                disabled={isProcessing}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDiscordDialog(false)}
                  disabled={isProcessing}
                  className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  onClick={handleDiscordSubmit}
                  disabled={isProcessing || !discordId.trim()}
                  className="flex-1 py-2 px-4 bg-yellow-500 text-white rounded-xl font-semibold hover:bg-yellow-600 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? '處理中...' : '確認'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default Shop