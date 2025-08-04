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
      localStorage.removeItem('token')
      window.location.href = '/admin/login'
    }
    return Promise.reject(error)
  }
)

// 身份驗證 API
export const authAPI = {
  login: (username, password) => 
    api.post('/auth/login', { username, password }),
  
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
    api.put('/channel/settings', data)
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