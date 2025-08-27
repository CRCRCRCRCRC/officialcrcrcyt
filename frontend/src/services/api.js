import axios from 'axios'

// 創建 axios 實例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

// 請求攔截器 - 添加 token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
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
      // 只有在不是登入頁面時才自動跳轉
      if (!window.location.pathname.includes('/admin/login')) {
        localStorage.removeItem('token')
        window.location.href = '/admin/login'
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
  // 取得目前的重置版本（公開）
  getResetVersion: () => api.get('/coin/reset-version'),
  // 管理員一鍵重置（需要 admin token）
  adminReset: () => api.post('/coin/reset')
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