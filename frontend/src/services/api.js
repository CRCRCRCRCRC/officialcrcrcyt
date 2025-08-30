import axios from 'axios'

// 創建 axios 實例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

// 請求攔截器 - 添加 token（同時支援管理端 token 與網站端 website_token）
api.interceptors.request.use(
  (config) => {
    const adminToken = localStorage.getItem('token')
    const websiteToken = localStorage.getItem('website_token')
    const token = adminToken || websiteToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
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
    return Promise.reject(error)
  }
)

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
    api.post('/auth/change-password', { currentPassword, newPassword })
}

// 影片 API
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
  adminReset: () => api.post('/coin/reset'),
  // 取得目前用戶的伺服器錢包（需登入）
  getWallet: () => api.get('/coin/wallet'),
  // 取得交易紀錄（需登入）
  getHistory: (limit = 50) => api.get('/coin/history', { params: { limit } }),
  // 每日簽到（需登入）
  claimDaily: () => api.post('/coin/claim-daily'),
  // 消費（扣幣，需登入）
  spend: (amount, reason = '消費') => api.post('/coin/spend', { amount, reason }),
  // 加幣（管理員）
  earn: (amount, reason = '任務獎勵') => api.post('/coin/earn', { amount, reason })
}
export const announcementAPI = {
  getAll: (params = {}) =>
    api.get('/announcements', { params }),

  getById: (slug) =>
    api.get(`/announcements/${slug}`),

  create: (data) =>
    api.post('/announcements', data),

  update: (slug, data) =>
    api.put(`/announcements/${slug}`, data),

  delete: (slug) =>
    api.delete(`/announcements/${slug}`),

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