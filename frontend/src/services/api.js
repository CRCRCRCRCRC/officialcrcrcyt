import axios from 'axios'

// 創建 axios 實例
const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
})

// 請求攔截器 - 添加 token（同時支援管理端 token 與網站端 website_token）
// 規則：
// - /coin 相關 API 優先使用 website_token（公開網站用戶）
// - 其它 API 仍以管理端 token 為優先（後台）
api.interceptors.request.use(
  (config) => {
    const adminToken = localStorage.getItem('token')
    const websiteToken = localStorage.getItem('website_token')
    const url = String(config.url || '')
    const isCoinApi = url.includes('/coin/')
    const picked = isCoinApi
      ? (websiteToken || adminToken)
      : (adminToken || websiteToken)
    if (picked) {
      config.headers.Authorization = `Bearer ${picked}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 響應攔截器 - 處理錯誤
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const path = window.location.pathname || ''
      const isAdminRoute = path.startsWith('/admin')
      if (isAdminRoute) {
        // 管理端：清除管理員 token 並導向登入
        localStorage.removeItem('token')
        if (!path.includes('/admin/login')) {
          window.location.href = '/admin/login'
        }
      } else {
        // 公開網站：清除網站登入資訊並回首頁
        localStorage.removeItem('website_token')
        localStorage.removeItem('website_user')
        window.location.href = '/'
      }
    }
    // 處理 403 無效令牌（特別是 /coin/ 端點的舊 token）
    else if (error.response?.status === 403) {
      try {
        const url = String(error?.config?.url || '')
        const isCoinApi = url.includes('/coin/')
        const errMsg = error?.response?.data?.error || ''
        if (isCoinApi && /無效的訪問令牌|invalid/i.test(errMsg)) {
          localStorage.removeItem('website_token')
          localStorage.removeItem('website_user')
          // 保守做法：僅在當前非管理路由時回首頁
          const path = window.location.pathname || ''
          if (!path.startsWith('/admin')) {
            window.location.href = '/'
          }
        }
      } catch {}
    }
    return Promise.reject(error)
  }
)
 
// 幫 /coin 系列 API 強制附帶 Authorization（優先 website_token，其次 admin token）
const authHeaderForCoin = () => {
  try {
    const websiteToken = localStorage.getItem('website_token')
    const adminToken = localStorage.getItem('token')
    const token = websiteToken || adminToken
    return token ? { Authorization: `Bearer ${token}` } : {}
  } catch {
    return {}
  }
}

// 身份驗證 API
export const authAPI = {
  login: (username, password) =>
    api.post('/auth/login', { username, password }),
  loginWithGoogle: (id_token) =>
    api.post('/auth/google', { id_token }),
  loginWithGoogleCode: (code, passphrase) =>
    api.post('/auth/google-code', { code, passphrase }),
  loginWithGooglePublic: (code) =>
    api.post('/auth/google-public', { code }),
  
  verify: () => 
    api.get('/auth/verify'),
  
  changePassword: (currentPassword, newPassword) => 
    api.post('/auth/change-password', { currentPassword, newPassword }),
  
  updateProfile: (formData) => 
    api.put('/auth/profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
}
export const videoAPI = {
  getAll: (params = {}) => 
    api.get('/videos', { params }),
  
  getById: (id) => 
    api.get(`/videos/${id}`),
  
  search: (query, params = {}) => 
    api.get(`/videos/search/${encodeURIComponent(query)}`, { params }),
  
  create: (data) => 
    api.post('/videos', data),
  
  update: (id, data) => 
    api.put(`/videos/${id}`, data),
  
  delete: (id) => 
    api.delete(`/videos/${id}`)
}

// 頻道 API
export const channelAPI = {
  getInfo: () => 
    api.get('/channel/info'),
  
  updateInfo: (data) => 
    api.put('/channel/info', data),
  
  getStats: () => 
    api.get('/channel/stats'),
  
  getSettings: () => 
    api.get('/channel/settings'),
  
  updateSettings: (data) => 
    api.put('/channel/settings', data),
  
  uploadImage: (formData) =>
    api.post('/channel/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  getYouTubeData: () =>
    api.get('/channel/youtube-data'),

  getDashboard: () =>
    api.get('/channel/dashboard'),

  getPublicData: () =>
    api.get('/channel/public-data')
}

export const settingsAPI = {
  getAll: () =>
    api.get('/settings'),

  updateFeaturedVideo: (videoId) =>
    api.post('/settings/featured-video', { videoId }),

  getFeaturedVideo: () =>
    api.get('/settings/featured-video')
}

// CRCRCoin API
export const coinAPI = {
  // 取得目前的重置版本（公開，用於舊版 localStorage 清空同步）
  getResetVersion: () => api.get('/coin/reset-version'),
  // 管理員一鍵重置（需要 admin token）
  adminReset: () => api.post('/coin/reset', undefined, { headers: authHeaderForCoin() }),
  // 取得商品列表（公開）
  getProducts: () => api.get('/coin/products'),
  // 取得目前用戶的伺服器錢包（需登入）
  getWallet: () => api.get('/coin/wallet', { headers: authHeaderForCoin() }),
  // 取得交易紀錄（需登入）
  getHistory: (limit = 50) => api.get('/coin/history', { params: { limit }, headers: authHeaderForCoin() }),
  // 每日簽到（需登入）
  claimDaily: () => api.post('/coin/claim-daily', undefined, { headers: authHeaderForCoin() }),
  // 購買商品
  purchaseProduct: (productId, discordId) =>
    api.post('/coin/purchase', { productId, discordId }, { headers: authHeaderForCoin() }),
  // 消費（扣幣，需登入）
  spend: (amount, reason = '消費') => api.post('/coin/spend', { amount, reason }, { headers: authHeaderForCoin() }),
  // 加幣（管理員）
  earn: (amount, reason = '任務獎勵') => api.post('/coin/earn', { amount, reason }, { headers: authHeaderForCoin() }),
  // 管理員發放 CRCRCoin
  grantCoins: (email, amount) =>
    api.post('/coin/grant', { email, amount }, { headers: authHeaderForCoin() }),
  // 取得商品訂單（管理員）
  getOrders: (params = {}) =>
    api.get('/coin/orders', { params, headers: authHeaderForCoin() })
}
export const announcementAPI = {
  getAll: (params = {}) =>
    api.get('/announcements', { params }),

  getById: (slug) =>
    api.get(`/announcements/${slug}`),

  create: (data) =>
    api.post('/announcements', data),

  update: (identifier, data) =>
    api.put(`/announcements/${identifier}`, data),

  delete: (identifier) =>
    api.delete(`/announcements/${identifier}`),

  reset: () =>
    api.post('/announcements/reset')
}



// 通用 API 函數
export const apiCall = async (apiFunction, ...args) => {
  try {
    const response = await apiFunction(...args)
    return { success: true, data: response.data }
  } catch (error) {
    console.error('API 調用錯誤:', error)
    return { 
      success: false, 
      error: error.response?.data?.error || error.message || '請求失敗' 
    }
  }
}

export default api
