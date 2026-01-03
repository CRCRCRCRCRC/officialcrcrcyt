import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, User, Save, Loader2, MessageCircle, Unlink, Copy } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCoin } from '../contexts/CoinContext'
import { authAPI } from '../services/api'

const Profile = () => {
  const { isLoggedIn, user } = useCoin()
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [unbinding, setUnbinding] = useState(false)
  const [profile, setProfile] = useState({
    displayName: '',
    discordId: '',
    discordUsername: '',
    discordAvatar: '',
    publicId: ''
  })

  useEffect(() => {
    if (isLoggedIn) {
      fetchProfile()
    } else {
      setLoading(false)
    }
  }, [isLoggedIn])

  const fetchProfile = async () => {
    try {
      const response = await authAPI.getProfile()
      const data = response.data.user || response.data
      setProfile({
        displayName: data.display_name || data.displayName || '',
        discordId: data.discord_id || data.discordId || '',
        discordUsername: data.discord_username || data.discordUsername || '',
        discordAvatar: data.discord_avatar || data.discordAvatar || '',
        publicId: data.public_id || data.publicId || ''
      })
    } catch (error) {
      console.error('取得個人資料失敗:', error)
      toast.error('無法載入個人資料')
    } finally {
      setLoading(false)
    }
  }

  const handleDiscordBind = () => {
    const DISCORD_CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID || window.DISCORD_CLIENT_ID
    if (!DISCORD_CLIENT_ID) {
      toast.error('Discord OAuth 未配置')
      return
    }

    const redirectUri = `${window.location.origin}/profile/discord/callback`
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify`

    window.location.href = discordAuthUrl
  }

  const handleDiscordUnbind = async () => {
    if (!confirm('確定要解除 Discord 綁定嗎？')) {
      return
    }

    setUnbinding(true)
    try {
      await authAPI.unbindDiscord()
      setProfile({
        ...profile,
        discordId: '',
        discordUsername: '',
        discordAvatar: ''
      })
      toast.success('Discord 帳號已解除綁定')
    } catch (error) {
      console.error('解除綁定失敗:', error)
      toast.error(error.response?.data?.error || '解除綁定失敗')
    } finally {
      setUnbinding(false)
    }
  }

  const handleCopyPublicId = async () => {
    if (!profile.publicId) return
    try {
      await navigator.clipboard.writeText(profile.publicId)
      toast.success('已複製個人 ID')
    } catch (error) {
      console.error('複製個人 ID 失敗:', error)
      toast.error('複製失敗，請手動選取')
    }
  }

  const handleSave = async () => {
    if (!profile.displayName.trim()) {
      toast.error('請輸入顯示名稱')
      return
    }

    setSaving(true)
    try {
      await authAPI.updateProfile({
        displayName: profile.displayName.trim()
      })
      toast.success('個人資料已更新')
      // 刷新用戶資訊
      if (window.location.pathname === '/profile') {
        setTimeout(() => window.location.reload(), 1000)
      }
    } catch (error) {
      console.error('更新個人資料失敗:', error)
      toast.error(error.response?.data?.error || '更新失敗')
    } finally {
      setSaving(false)
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-[60vh] bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center px-4">
        <div className="max-w-md rounded-3xl border border-white/60 bg-white/90 shadow-2xl p-8 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
            <User className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">請先登入</h1>
          <p className="text-gray-600 text-sm leading-relaxed">
            登入後即可設定個人資料與綁定 Discord 帳號
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl"
          >
            返回首頁
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-full bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-xl border-b border-white/30 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            to="/"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            返回首頁
          </Link>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white mb-4">
              <User className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">個人資料設定</h1>
            <p className="text-gray-600 mt-2">管理您的個人資訊與 Discord 綁定</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-3xl border border-white/60 bg-white/95 shadow-2xl p-6 sm:p-8 space-y-6">
          {/* 帳號資訊 */}
          <div className="pb-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">帳號資訊</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  登入帳號 (Google Email)
                </label>
                <div className="text-gray-900 bg-gray-50 rounded-lg px-4 py-3">
                  {user?.email || user?.username || '未提供'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  個人 ID（贈禮用）
                </label>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="flex-1 text-gray-900 bg-gray-50 rounded-lg px-4 py-3">
                    {profile.publicId || '尚未產生'}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyPublicId}
                    disabled={!profile.publicId}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Copy className="h-4 w-4" />
                    複製
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 個人資料 */}
          <div className="pb-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">個人資料</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  顯示名稱 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={profile.displayName}
                  onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  placeholder="請輸入顯示名稱"
                  maxLength={50}
                />
                <p className="text-xs text-gray-500 mt-1">
                  此名稱會顯示在排行榜與其他用戶可見的地方
                </p>
              </div>
            </div>
          </div>

          {/* Discord 綁定 */}
          <div className="pb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Discord 綁定</h2>
            <p className="text-sm text-gray-600 mb-4">
              使用 Discord 帳號登入綁定後，購買需要 Discord ID 的商品時將自動使用綁定的帳號，並可完成「綁定 DISCORD 帳號」任務。
            </p>

            {profile.discordId ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  {profile.discordAvatar && (
                    <img
                      src={profile.discordAvatar}
                      alt="Discord Avatar"
                      className="w-12 h-12 rounded-full"
                    />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">已綁定 Discord 帳號</p>
                    <p className="text-sm text-gray-600">{profile.discordUsername || profile.discordId}</p>
                  </div>
                  <button
                    onClick={handleDiscordUnbind}
                    disabled={unbinding}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50"
                  >
                    {unbinding ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        解除中...
                      </>
                    ) : (
                      <>
                        <Unlink className="w-4 h-4" />
                        解除綁定
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 mb-3">
                    點擊下方按鈕使用 Discord 帳號登入以完成綁定
                  </p>
                  <button
                    onClick={handleDiscordBind}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#5865F2] text-white rounded-lg hover:bg-[#4752C4] transition font-medium"
                  >
                    <MessageCircle className="w-5 h-5" />
                    使用 Discord 登入綁定
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 儲存按鈕 */}
          <div className="pt-6 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 text-base font-semibold text-white shadow-lg transition hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  儲存中...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  儲存變更
                </>
              )}
            </button>
          </div>
        </div>

        {/* 提示卡片 */}
        <div className="mt-6 rounded-2xl bg-blue-50 border border-blue-200 p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">溫馨提示</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• 顯示名稱為必填項目，會顯示在公開的排行榜上</li>
            <li>• Discord ID 為選填，綁定後可享受自動填入與任務獎勵</li>
            <li>• 您隨時可以回來此頁面修改您的個人資料</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Profile
