import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Settings as SettingsIcon, 
  User, 
  Shield, 
  Bell, 
  Globe, 
  Save, 
  Eye, 
  EyeOff,
  Key,
  Database,
  Lock
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { settingsAPI } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'

const Settings = () => {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('general')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  const [settings, setSettings] = useState({
    site_title: '',
    site_description: '',
    contact_email: '',
    social_links: {
      youtube: '',
      facebook: '',
      instagram: '',
      twitter: ''
    },
    seo_keywords: '',
    analytics_id: ''
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await settingsAPI.getAll()
      setSettings(response.data)
    } catch (error) {
      console.error('獲取設定失敗:', error)
      toast.error('載入設定失敗')
    } finally {
      setLoading(false)
    }
  }

  const handleSettingsChange = (e) => {
    const { name, value } = e.target
    if (name.includes('.')) {
      const [parent, child] = name.split('.')
      setSettings(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }))
    } else {
      setSettings(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSaveSettings = async (e) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      await settingsAPI.update(settings)
      toast.success('設定已儲存')
    } catch (error) {
      console.error('儲存設定失敗:', error)
      toast.error('儲存設定失敗')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('新密碼與確認密碼不符')
      return
    }
    
    setSaving(true)
    
    try {
      // 這裡應該調用 API 來更改密碼
      toast.success('密碼已更新')
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error) {
      console.error('更改密碼失敗:', error)
      toast.error('更改密碼失敗')
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'general', name: '一般設定', icon: Globe },
    { id: 'security', name: '安全設定', icon: Shield },
    { id: 'notifications', name: '通知設定', icon: Bell },
    { id: 'advanced', name: '進階設定', icon: Database }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <div className="bg-white bg-opacity-80 backdrop-blur-xl border-b border-white border-opacity-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <SettingsIcon className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  系統設定
                </h1>
              </div>
              <p className="text-gray-600 text-lg">
                管理網站的各項設定與配置
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-80">
            <div className="bg-white bg-opacity-80 backdrop-blur-xl rounded-2xl border border-white border-opacity-20 shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">設定分類</h3>
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 hover:shadow-md'
                    }`}
                  >
                    <tab.icon className="w-5 h-5 mr-3" />
                    {tab.name}
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="activeSettingsTab"
                        className="ml-auto w-2 h-2 bg-white rounded-full"
                      />
                    )}
                  </motion.button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            {activeTab === 'general' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-white bg-opacity-80 backdrop-blur-xl rounded-2xl border border-white border-opacity-20 shadow-xl p-8"
              >
                <div className="flex items-center space-x-3 mb-8">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    一般設定
                  </h2>
                </div>

                <form onSubmit={handleSaveSettings} className="space-y-8">
                  <div className="bg-gray-50 bg-opacity-50 rounded-xl p-6">
                    <label htmlFor="site_title" className="block text-sm font-semibold text-gray-800 mb-3">
                      網站標題
                    </label>
                    <input
                      type="text"
                      id="site_title"
                      name="site_title"
                      value={settings.site_title}
                      onChange={handleSettingsChange}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 shadow-sm hover:shadow-md"
                      placeholder="CRCRC 官方網站"
                    />
                  </div>

                  <div className="bg-gray-50 bg-opacity-50 rounded-xl p-6">
                    <label htmlFor="site_description" className="block text-sm font-semibold text-gray-800 mb-3">
                      網站描述
                    </label>
                    <textarea
                      id="site_description"
                      name="site_description"
                      rows={4}
                      value={settings.site_description}
                      onChange={handleSettingsChange}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 shadow-sm hover:shadow-md resize-none"
                      placeholder="描述您的網站內容與特色..."
                    />
                  </div>

                  <div className="bg-gray-50 bg-opacity-50 rounded-xl p-6">
                    <label htmlFor="contact_email" className="block text-sm font-semibold text-gray-800 mb-3">
                      聯絡信箱
                    </label>
                    <input
                      type="email"
                      id="contact_email"
                      name="contact_email"
                      value={settings.contact_email}
                      onChange={handleSettingsChange}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 shadow-sm hover:shadow-md"
                      placeholder="contact@crcrc.com"
                    />
                  </div>

                  <div className="flex justify-end pt-6 border-t border-gray-200">
                    <motion.button
                      type="submit"
                      disabled={saving}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {saving ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                          儲存中...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5 mr-3" />
                          儲存設定
                        </>
                      )}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <div className="bg-white bg-opacity-80 backdrop-blur-xl rounded-2xl border border-white border-opacity-20 shadow-xl p-8">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    安全設定
                  </h2>
                </div>
                <p className="text-gray-600">
                  安全功能將在未來版本中提供。
                </p>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="bg-white bg-opacity-80 backdrop-blur-xl rounded-2xl border border-white border-opacity-20 shadow-xl p-8">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center">
                    <Bell className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    通知設定
                  </h2>
                </div>
                <p className="text-gray-600">
                  通知功能將在未來版本中提供。
                </p>
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="bg-white bg-opacity-80 backdrop-blur-xl rounded-2xl border border-white border-opacity-20 shadow-xl p-8">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <Database className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    進階設定
                  </h2>
                </div>
                <p className="text-gray-600">
                  進階功能將在未來版本中提供。
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
