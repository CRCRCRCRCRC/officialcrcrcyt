import { useState, useEffect, useContext } from 'react'
import { motion } from 'framer-motion'
import { 
  Save, 
  Shield, 
  Globe, 
  Bell, 
  Database,
  Key,
  User,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react'
import { AuthContext } from '../../contexts/AuthContext'
import { settingsAPI } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'

const Settings = () => {
  const { user } = useContext(AuthContext)
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
      toast.error('儲存失敗')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('新密碼確認不符')
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('密碼長度至少需要 6 個字元')
      return
    }

    setSaving(true)

    try {
      await settingsAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      toast.success('密碼已更新')
    } catch (error) {
      console.error('更改密碼失敗:', error)
      toast.error('密碼更新失敗')
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-display font-bold text-gray-900">
                系統設定
              </h1>
              <p className="text-gray-600">
                管理網站的各項設定
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon className="w-5 h-5 mr-3" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            {activeTab === 'general' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="card"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  一般設定
                </h2>

                <form onSubmit={handleSaveSettings} className="space-y-6">
                  <div>
                    <label htmlFor="site_title" className="block text-sm font-medium text-gray-700 mb-2">
                      網站標題
                    </label>
                    <input
                      type="text"
                      id="site_title"
                      name="site_title"
                      value={settings.site_title}
                      onChange={handleSettingsChange}
                      className="input"
                      placeholder="CRCRC 官方網站"
                    />
                  </div>

                  <div>
                    <label htmlFor="site_description" className="block text-sm font-medium text-gray-700 mb-2">
                      網站描述
                    </label>
                    <textarea
                      id="site_description"
                      name="site_description"
                      rows={3}
                      value={settings.site_description}
                      onChange={handleSettingsChange}
                      className="input"
                      placeholder="網站的簡短描述"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700 mb-2">
                      聯絡信箱
                    </label>
                    <input
                      type="email"
                      id="contact_email"
                      name="contact_email"
                      value={settings.contact_email}
                      onChange={handleSettingsChange}
                      className="input"
                      placeholder="contact@crcrc.com"
                    />
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">社群媒體連結</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="youtube" className="block text-sm font-medium text-gray-700 mb-2">
                          YouTube
                        </label>
                        <input
                          type="url"
                          id="youtube"
                          name="social_links.youtube"
                          value={settings.social_links?.youtube || ''}
                          onChange={handleSettingsChange}
                          className="input"
                          placeholder="https://youtube.com/@crcrc"
                        />
                      </div>
                      <div>
                        <label htmlFor="facebook" className="block text-sm font-medium text-gray-700 mb-2">
                          Facebook
                        </label>
                        <input
                          type="url"
                          id="facebook"
                          name="social_links.facebook"
                          value={settings.social_links?.facebook || ''}
                          onChange={handleSettingsChange}
                          className="input"
                          placeholder="https://facebook.com/crcrc"
                        />
                      </div>
                      <div>
                        <label htmlFor="instagram" className="block text-sm font-medium text-gray-700 mb-2">
                          Instagram
                        </label>
                        <input
                          type="url"
                          id="instagram"
                          name="social_links.instagram"
                          value={settings.social_links?.instagram || ''}
                          onChange={handleSettingsChange}
                          className="input"
                          placeholder="https://instagram.com/crcrc"
                        />
                      </div>
                      <div>
                        <label htmlFor="twitter" className="block text-sm font-medium text-gray-700 mb-2">
                          Twitter
                        </label>
                        <input
                          type="url"
                          id="twitter"
                          name="social_links.twitter"
                          value={settings.social_links?.twitter || ''}
                          onChange={handleSettingsChange}
                          className="input"
                          placeholder="https://twitter.com/crcrc"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn-primary flex items-center"
                    >
                      {saving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          儲存中...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          儲存設定
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-6"
              >
                {/* User Info */}
                <div className="card">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    帳戶資訊
                  </h2>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{user?.username}</h3>
                      <p className="text-sm text-gray-600">管理員</p>
                    </div>
                  </div>
                </div>

                {/* Change Password */}
                <div className="card">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    更改密碼
                  </h2>

                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        目前密碼
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="currentPassword"
                          name="currentPassword"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                          required
                          className="input pl-10 pr-10"
                          placeholder="請輸入目前密碼"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        新密碼
                      </label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="newPassword"
                          name="newPassword"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          required
                          className="input pl-10"
                          placeholder="請輸入新密碼"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        確認新密碼
                      </label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="confirmPassword"
                          name="confirmPassword"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          required
                          className="input pl-10"
                          placeholder="請再次輸入新密碼"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={saving}
                        className="btn-primary flex items-center"
                      >
                        {saving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            更新中...
                          </>
                        ) : (
                          <>
                            <Shield className="w-4 h-4 mr-2" />
                            更新密碼
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="card"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  通知設定
                </h2>
                <p className="text-gray-600">
                  通知功能將在未來版本中提供。
                </p>
              </motion.div>
            )}

            {activeTab === 'advanced' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="card"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  進階設定
                </h2>

                <form onSubmit={handleSaveSettings} className="space-y-6">
                  <div>
                    <label htmlFor="seo_keywords" className="block text-sm font-medium text-gray-700 mb-2">
                      SEO 關鍵字
                    </label>
                    <input
                      type="text"
                      id="seo_keywords"
                      name="seo_keywords"
                      value={settings.seo_keywords}
                      onChange={handleSettingsChange}
                      className="input"
                      placeholder="關鍵字1, 關鍵字2, 關鍵字3"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      用逗號分隔多個關鍵字
                    </p>
                  </div>

                  <div>
                    <label htmlFor="analytics_id" className="block text-sm font-medium text-gray-700 mb-2">
                      Google Analytics ID
                    </label>
                    <input
                      type="text"
                      id="analytics_id"
                      name="analytics_id"
                      value={settings.analytics_id}
                      onChange={handleSettingsChange}
                      className="input"
                      placeholder="G-XXXXXXXXXX"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn-primary flex items-center"
                    >
                      {saving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          儲存中...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          儲存設定
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings