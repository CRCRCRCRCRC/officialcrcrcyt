import { useState, useMemo } from 'react'
import { useWebsiteAuth } from '../contexts/WebsiteAuthContext'\nimport { profileAPI } from '../services/api'

const Profile = () => {
  const { user, updateProfile } = useWebsiteAuth();
  const [name, setName] = useState(user?.name || '')
  const [picture, setPicture] = useState(user?.picture || '')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const email = user?.email || user?.username || ''

  const onFile = (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return setMsg('?ｇ蹓????????)
    const max = 512 * 1024 // 512KB?蹓??localStorage ??鳴
    if (file.size > max) return setMsg('?謘?????????512KB???ｇ???格????疵')
    const reader = new FileReader()
    (async () => { try { const fd = new FormData(); fd.append("avatar", file); const r = await profileAPI.uploadAvatar(fd); const url = r?.data?.url || ""; setPicture(url); updateProfile({ picture: url }); setMsg("已更新頭像"); } catch(e){ setMsg("上傳失敗") } })(); } catch {} finally { updateProfile({ name, picture }); }
      setMsg('???)
    } catch (e) {
      setMsg('????剜??????疵')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-custom py-10">
        <h1 className="text-3xl font-bold mb-6">????? & ?桀??</h1>

        <div className="bg-white rounded-2xl border shadow p-6 max-w-2xl">
          <div className="flex items-start gap-6">
            <img src={preview} alt="avatar" className="w-24 h-24 rounded-full border object-cover" />
            <div className="flex-1 space-y-5">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Email</label>
                <input value={email} readOnly className="input w-full cursor-not-allowed bg-gray-100" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">?璇?</label>
                <input value={name} onChange={e => setName(e.target.value)} className="input w-full" placeholder="?岳??璇?" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">??? URL</label>
                <input value={picture} onChange={e => setPicture(e.target.value)} className="input w-full" placeholder="https://..." />
                <div className="mt-2 text-sm text-gray-500">?謘???????????512KB??/div>
                <input type="file" accept="image/*" className="mt-1" onChange={e => onFile(e.target.files?.[0])} />
              </div>
              <div className="pt-2">
                <button onClick={onSave} disabled={saving} className="px-6 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50">
                  {saving ? '??????? : '???'}
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



