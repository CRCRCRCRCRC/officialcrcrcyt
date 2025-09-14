import { useState, useMemo, useEffect } from 'react'
import { useWebsiteAuth } from '../contexts/WebsiteAuthContext'
import { profileAPI } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

const Profile = () => {
  const { user, updateProfile } = useWebsiteAuth()
  const [name, setName] = useState(user?.name || '')
  const [picture, setPicture] = useState(user?.picture || '')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)

  const email = user?.email || user?.username || ''

  const onFile = (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return setMsg('請選擇圖片檔案')
    const max = 512 * 1024 // 512KB
    if (file.size > max) return setMsg('圖片過大（上限 512KB），請壓縮後再試')
    ;(async () => {
      try {
        const fd = new FormData()
        fd.append('avatar', file)
        const r = await profileAPI.uploadAvatar(fd)
        const url = r?.data?.url || ''
        setPicture(url)
        updateProfile({ picture: url })
        setMsg('已更新頭像')
      } catch {
        setMsg('上傳失敗')
      }
    })()
  }

  const preview = useMemo(() => picture || 'https://i.pravatar.cc/120', [picture])

  const onSave = async () => {
    setSaving(true)
    setMsg('')
    try {
      try { await profileAPI.update({ name, picture }) } catch {}
      updateProfile({ name, picture })
      setMsg('已儲存')
    } catch {
      setMsg('儲存失敗，請重試')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const res = await profileAPI.get()
        const d = res.data || {}
        setName(d.name || '')
        setPicture(d.picture || '')
        updateProfile({ name: d.name || '', picture: d.picture || '' })
      } catch {}
      setLoading(false)
    })()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-10">
        <h1 className="text-3xl font-bold mb-6">個人資料 & 設定</h1>

        <div className="bg-white rounded-2xl border shadow p-8 w-full max-w-3xl mx-auto">
          <div className="flex items-start gap-8">
            <img src={preview} alt="avatar" className="w-24 h-24 rounded-full border object-cover" />
            <div className="flex-1 space-y-5">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Email</label>
                <input value={email} readOnly className="input w-full cursor-not-allowed bg-gray-100" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">暱稱</label>
                <input value={name} onChange={e => setName(e.target.value)} className="input w-full" placeholder="輸入暱稱" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">頭像 URL</label>
                <input value={picture} onChange={e => setPicture(e.target.value)} className="input w-full" placeholder="https://..." />
                <div className="mt-2 text-sm text-gray-500">或上傳圖片（最大 512KB）</div>
                <input
                  type="file"
                  accept="image/*"
                  className="mt-1 block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  onChange={e => onFile(e.target.files?.[0])}
                />
              </div>
              <div className="pt-2">
                <button onClick={onSave} disabled={saving} className="px-6 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50">
                  {saving ? '儲存中…' : '儲存'}
                </button>
                {msg && <span className="ml-3 text-sm text-gray-600">{msg}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile


