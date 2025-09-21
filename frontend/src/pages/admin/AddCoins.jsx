import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Coins, User, Mail, Plus, CheckCircle, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

const AddCoins = () => {
  const [formData, setFormData] = useState({
    email: '',
    amount: '',
    reason: ''
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState(null)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.email.trim()) {
      toast.error('請輸入用戶電子郵件')
      return
    }

    if (!formData.amount || formData.amount <= 0) {
      toast.error('請輸入有效的金額')
      return
    }

    setIsProcessing(true)
    setResult(null)

    try {
      const response = await fetch('/api/coin/add-coins-by-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('website_token')}`
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          amount: parseInt(formData.amount),
          reason: formData.reason.trim() || '管理員手動加幣'
        })
      })

      const data = await response.json()

      if (data.success) {
        setResult({
          success: true,
          message: data.message,
          wallet: data.wallet
        })
        toast.success('加幣成功！')
        // 清空表單
        setFormData({
          email: '',
          amount: '',
          reason: ''
        })
      } else {
        setResult({
          success: false,
          message: data.error
        })
        toast.error(data.error || '加幣失敗')
      }
    } catch (error) {
      console.error('加幣失敗:', error)
      setResult({
        success: false,
        message: '網路錯誤，請稍後再試'
      })
      toast.error('網路錯誤，請稍後再試')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <Link
              to="/admin"
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              返回管理後台
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              手動加幣管理
            </h1>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Add Coins Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm border p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                給用戶加幣
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  用戶電子郵件
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="請輸入用戶的電子郵件地址"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    disabled={isProcessing}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  加幣金額
                </label>
                <div className="relative">
                  <Coins className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="請輸入要添加的 CRCRCoin 數量"
                    min="1"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    disabled={isProcessing}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  原因（選填）
                </label>
                <input
                  type="text"
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  placeholder="例如：活動獎勵、補償等"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={isProcessing}
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3 px-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? '處理中...' : '確認加幣'}
              </button>
            </form>
          </motion.div>

          {/* Result Display */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm border p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                操作結果
              </h2>
            </div>

            {result ? (
              <div className={`p-4 rounded-lg border ${
                result.success
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-3">
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  <div>
                    <p className={`font-medium ${
                      result.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {result.success ? '加幣成功' : '加幣失敗'}
                    </p>
                    <p className={`text-sm mt-1 ${
                      result.success ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {result.message}
                    </p>
                  </div>
                </div>

                {result.success && result.wallet && (
                  <div className="mt-4 p-3 bg-white rounded border">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">用戶餘額</span>
                      <span className="font-bold text-gray-900">
                        {result.wallet.balance} CRCRCoin
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Coins className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>請填寫表單並提交以查看結果</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6"
        >
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            使用說明
          </h3>
          <ul className="text-blue-800 space-y-2 text-sm">
            <li>• 請確保輸入的電子郵件地址是用戶註冊時使用的地址</li>
            <li>• 加幣金額必須大於 0</li>
            <li>• 原因欄位可選填，用於記錄加幣原因</li>
            <li>• 加幣操作會記錄在用戶的交易歷史中</li>
            <li>• 用戶會在下次登入時看到更新的餘額</li>
          </ul>
        </motion.div>
      </div>
    </div>
  )
}

export default AddCoins