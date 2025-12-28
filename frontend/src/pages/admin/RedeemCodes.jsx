import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { KeyRound, Copy, Coins, Gift, RefreshCw, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { coinAPI } from '../../services/api'

const formatNumber = (value) => {
  try {
    return Number(value || 0).toLocaleString('zh-TW')
  } catch {
    return String(value || 0)
  }
}

const RedeemCodes = () => {
  const [rewardType, setRewardType] = useState('product')
  const [products, setProducts] = useState([])
  const [productId, setProductId] = useState('')
  const [coinAmount, setCoinAmount] = useState('100')
  const [maxRedemptions, setMaxRedemptions] = useState('1')
  const [allowRepeat, setAllowRepeat] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingList, setLoadingList] = useState(false)
  const [codes, setCodes] = useState([])
  const [lastCreated, setLastCreated] = useState(null)

  const filteredProducts = useMemo(
    () => products.filter((item) => !item.requirePromotionContent),
    [products]
  )

  const fetchProducts = async () => {
    try {
      const res = await coinAPI.getProducts()
      const list = res.data?.products || []
      setProducts(list)
      if (!productId && list.length > 0) {
        const first = list.find((item) => !item.requirePromotionContent) || list[0]
        setProductId(first?.id || '')
      }
    } catch (error) {
      console.error('讀取商品失敗:', error)
    }
  }

  const fetchCodes = async () => {
    setLoadingList(true)
    try {
      const res = await coinAPI.getRedeemCodes()
      setCodes(res.data?.codes || [])
    } catch (error) {
      console.error('讀取兌換碼失敗:', error)
      toast.error('無法讀取兌換碼列表')
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    fetchProducts()
    fetchCodes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCreate = async (event) => {
    event.preventDefault()
    const maxCount = Math.floor(Number(maxRedemptions))
    if (!Number.isFinite(maxCount) || maxCount < 1) {
      toast.error('可兌換人數需為 1 以上')
      return
    }

    if (rewardType === 'product' && !productId) {
      toast.error('請選擇商品')
      return
    }

    if (rewardType === 'coins') {
      const amountValue = Math.floor(Number(coinAmount))
      if (!Number.isFinite(amountValue) || amountValue <= 0) {
        toast.error('請輸入正確的 CRCRCoin 數量')
        return
      }
    }

    setLoading(true)
    try {
      const payload = {
        rewardType,
        maxRedemptions: maxCount,
        allowRepeat
      }

      if (rewardType === 'product') {
        payload.productId = productId
      } else {
        payload.coinAmount = Math.floor(Number(coinAmount))
      }

      const res = await coinAPI.createRedeemCode(payload)
      const created = res.data?.redeemCode
      if (created?.code) {
        setLastCreated(created)
        toast.success('兌換碼已建立')
      } else {
        toast.success('兌換碼已建立')
      }
      await fetchCodes()
    } catch (error) {
      toast.error(error.response?.data?.error || '建立兌換碼失敗')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async (value) => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      toast.success('已複製兌換碼')
    } catch {
      toast.error('複製失敗，請手動複製')
    }
  }

  const getRewardLabel = (code) => {
    if (code.rewardType === 'coins') {
      return `${formatNumber(code.coinAmount)} CRCRCoin`
    }
    const match = products.find((item) => item.id === code.productId)
    return match?.name || code.productName || code.productId || '商品'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 py-8">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                兌換碼管理
              </h1>
              <p className="text-sm text-gray-600">
                建立兌換碼並指定獎勵內容、可兌換人數與是否允許重複兌換
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <motion.form
          onSubmit={handleCreate}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/85 backdrop-blur-xl border border-white/20 rounded-3xl shadow-xl p-8 space-y-6"
        >
          <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                兌換內容
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setRewardType('product')}
                  className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition ${
                    rewardType === 'product'
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Gift className="w-4 h-4" />
                  商品
                </button>
                <button
                  type="button"
                  onClick={() => setRewardType('coins')}
                  className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition ${
                    rewardType === 'coins'
                      ? 'bg-amber-50 border-amber-300 text-amber-700'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Coins className="w-4 h-4" />
                  CRCRCoin
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                可兌換人數
              </label>
              <input
                type="number"
                min={1}
                value={maxRedemptions}
                onChange={(event) => setMaxRedemptions(event.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={loading}
                required
              />
            </div>
          </div>

          {rewardType === 'product' ? (
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                選擇商品
              </label>
              <select
                value={productId}
                onChange={(event) => setProductId(event.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={loading}
              >
                {filteredProducts.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}（{formatNumber(item.price)} CRCRCoin）
                  </option>
                ))}
              </select>
              {filteredProducts.length === 0 && (
                <p className="mt-2 text-xs text-gray-500">目前沒有可用商品。</p>
              )}
              {products.some((item) => item.requirePromotionContent) && (
                <p className="mt-2 text-xs text-gray-500">
                  需要宣傳內容的商品不支援兌換碼。
                </p>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                發放 CRCRCoin 數量
              </label>
              <input
                type="number"
                min={1}
                value={coinAmount}
                onChange={(event) => setCoinAmount(event.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                disabled={loading}
                required
              />
            </div>
          )}

          <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-gray-800">允許重複兌換</p>
              <p className="text-xs text-gray-500">同一位使用者是否能多次兌換此兌換碼</p>
            </div>
            <button
              type="button"
              onClick={() => setAllowRepeat((prev) => !prev)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
                allowRepeat ? 'bg-indigo-500' : 'bg-gray-300'
              }`}
              aria-pressed={allowRepeat}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                  allowRepeat ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transition disabled:opacity-60"
          >
            <CheckCircle className="w-5 h-5" />
            {loading ? '建立中…' : '建立兌換碼'}
          </button>
        </motion.form>

        {lastCreated?.code && (
          <div className="rounded-3xl border border-indigo-100 bg-indigo-50/60 p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-indigo-700">最新建立的兌換碼</p>
                <p className="text-2xl font-bold text-indigo-900 tracking-widest">{lastCreated.code}</p>
                <p className="text-xs text-indigo-700 mt-1">
                  獎勵：{getRewardLabel(lastCreated)}｜可兌換 {lastCreated.maxRedemptions} 次
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(lastCreated.code)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-indigo-200 text-indigo-700 bg-white hover:bg-indigo-50 transition"
              >
                <Copy className="w-4 h-4" />
                複製
              </button>
            </div>
          </div>
        )}

        <div className="bg-white/85 backdrop-blur-xl border border-white/20 rounded-3xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">兌換碼列表</h2>
            <button
              type="button"
              onClick={fetchCodes}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
              disabled={loadingList}
            >
              <RefreshCw className={`w-4 h-4 ${loadingList ? 'animate-spin' : ''}`} />
              重新整理
            </button>
          </div>

          {loadingList ? (
            <p className="text-sm text-gray-500">載入中...</p>
          ) : codes.length === 0 ? (
            <p className="text-sm text-gray-500">尚未建立兌換碼</p>
          ) : (
            <div className="space-y-3">
              {codes.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-gray-50/70 px-4 py-3 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span className="font-semibold text-gray-900 tracking-wider">{item.code}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(item.code)}
                        className="text-gray-400 hover:text-gray-600"
                        aria-label="複製兌換碼"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      獎勵：{getRewardLabel(item)}｜可兌換 {item.usedCount}/{item.maxRedemptions}
                      {item.allowRepeat ? '｜允許重複' : ''}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {item.createdAt ? new Date(item.createdAt).toLocaleString('zh-TW') : '—'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RedeemCodes
