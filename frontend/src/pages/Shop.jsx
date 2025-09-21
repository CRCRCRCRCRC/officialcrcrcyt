import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ShoppingBag, Package } from 'lucide-react'
import { Link } from 'react-router-dom'

const Shop = () => {
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
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">商城即將開放</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              我們正在準備各種精彩的商品和服務，請耐心等候！<br />
              您可以先在錢包中累積 CRCRCoin 為購物做準備。
            </p>
            <Link
              to="/wallet"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Package className="w-5 h-5 mr-2" />
              返回錢包
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Shop