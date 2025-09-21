import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Coins, User, Mail, Plus, CheckCircle, AlertCircle, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

const AddCoins = () => {
  const [searchType, setSearchType] = useState('email') // 'email' or 'username'
  const [formData, setFormData] = useState({
    email: '',
    username: '',
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

  const handleSearchTypeChange = (type) => {
    setSearchType(type)
    // 清空對應的輸入框
    setFormData(prev => ({
      ...prev,
      email: type === 'username' ? '' : prev.email,
      username: type === 'email' ? '' : prev.username
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const searchValue = searchType === 'email' ? formData.email.trim() : formData.username.trim()

    if (!searchValue) {
      toast.error(searchType === 'email' ? '請輸入用戶電子郵件' : '請輸入用戶名')
      return
    }

    if (!formData.amount || formData.amount <= 0) {
      toast.error('請輸入有效的金額')
      return
    }

    setIsProcessing(true)
    setResult(null)

    try {
      const apiEndpoint = searchType === 'email'
        ? '/api/coin/add-coins-by-email'
        : '/api/coin/add-coins-by-username'

      const requestData = searchType === 'email'
        ? {
            email: formData.email.trim(),
            amount: parseInt(formData.amount),
            reason: formData.reason.trim() || '管理員手動加幣'
          }
        : {
            username: formData.username.trim(),
            amount: parseInt(formData.amount),
            reason: formData.reason.trim() || '管理員手動加幣'
          }

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('website_token')}`
        },
        body: JSON.stringify(requestData)
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
          username: '',
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

            {/* Search Type Tabs */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                查找用戶方式
              </label>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => handleSearchTypeChange('email')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    searchType === 'email'
                      ? 'bg-white text-green-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  電子郵件
                </button>
                <button
                  type="button"
                  onClick={() => handleSearchTypeChange('username')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    searchType === 'username'
                      ? 'bg-white text-green-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <User className="w-4 h-4" />
                  用戶名
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {searchType === 'email' ? '用戶電子郵件' : '用戶名'}
                </label>
                <div className="relative">
                  {searchType === 'email' ? (
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  ) : (
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  )}
                  <input
                    type={searchType === 'email' ? 'email' : 'text'}
                    name={searchType === 'email' ? 'email' : 'username'}
                    value={searchType === 'email' ? formData.email : formData.username}
                    onChange={handleInputChange}
                    placeholder={searchType === 'email' ? '請輸入用戶的電子郵件地址' : '請輸入用戶名'}
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
            <li>• 支持通過電子郵件地址或用戶名查找用戶</li>
            <li>• 請確保輸入的電子郵件地址或用戶名是正確的</li>
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