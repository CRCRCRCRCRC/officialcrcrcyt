import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  ExternalLink,
  Image as ImageIcon,
  Inbox,
  Loader2,
  Mail,
  MessageSquare,
  Paperclip,
  RefreshCw,
  Save,
  Search,
  Send
} from 'lucide-react'
import toast from 'react-hot-toast'
import { contactAPI } from '../../services/api'
import defaultAvatar from '../../assets/default-avatar.svg'
import '../../styles/admin-contact.css'

const STATUS_META = {
  new: { label: '待查看', tone: 'new' },
  in_progress: { label: '處理中', tone: 'progress' },
  replied: { label: '已回覆', tone: 'replied' },
  closed: { label: '已結束', tone: 'closed' }
}

const CATEGORY_META = {
  website: '網站使用',
  account: '帳號與登入',
  shop: '商店與商品',
  redeem: '兌換碼',
  discord: 'Discord',
  collaboration: '合作邀請',
  other: '其他問題'
}

const formatDateTime = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('zh-TW', { hour12: false })
}

const resolveAvatarSrc = (value) => {
  const normalized = String(value || '').trim()
  if (!normalized) return defaultAvatar
  if (/^(https?:)?\/\//i.test(normalized) || normalized.startsWith('data:')) return normalized
  return normalized.startsWith('/') ? normalized : `/${normalized}`
}

const AdminContactMessages = () => {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [selectedId, setSelectedId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [reply, setReply] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('new')
  const [savingStatus, setSavingStatus] = useState(false)
  const [savingReply, setSavingReply] = useState(false)

  const fetchMessages = async ({ initial = false } = {}) => {
    if (initial) setLoading(true)
    else setRefreshing(true)
    try {
      const response = await contactAPI.getAll({ limit: 300 })
      setMessages(response.data?.messages || [])
    } catch (error) {
      toast.error(error.response?.data?.error || '無法載入聯絡訊息')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchMessages({ initial: true })
  }, [])

  const counts = useMemo(() => ({
    all: messages.length,
    new: messages.filter((item) => item.status === 'new').length,
    in_progress: messages.filter((item) => item.status === 'in_progress').length,
    replied: messages.filter((item) => item.status === 'replied').length,
    closed: messages.filter((item) => item.status === 'closed').length
  }), [messages])

  const filteredMessages = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return messages.filter((message) => {
      if (statusFilter !== 'all' && message.status !== statusFilter) return false
      if (categoryFilter !== 'all' && message.category !== categoryFilter) return false
      if (!keyword) return true
      return [
        message.reference_code,
        message.sender_name,
        message.sender_email,
        message.subject,
        message.message
      ].some((value) => String(value || '').toLowerCase().includes(keyword))
    })
  }, [categoryFilter, messages, search, statusFilter])

  const openMessage = async (messageId) => {
    setSelectedId(messageId)
    setDetailLoading(true)
    try {
      const response = await contactAPI.getById(messageId)
      const nextDetail = response.data?.message || null
      setDetail(nextDetail)
      setReply(nextDetail?.admin_reply || '')
      setSelectedStatus(nextDetail?.status || 'new')
      setMessages((current) => current.map((message) => (
        String(message.id) === String(messageId)
          ? { ...message, read_at: nextDetail?.read_at || message.read_at }
          : message
      )))
    } catch (error) {
      toast.error(error.response?.data?.error || '無法載入訊息內容')
      setSelectedId(null)
      setDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }

  const applyUpdatedMessage = (updated) => {
    if (!updated) return
    setDetail(updated)
    setSelectedStatus(updated.status || 'new')
    setReply(updated.admin_reply || '')
    setMessages((current) => current.map((message) => (
      String(message.id) === String(updated.id)
        ? { ...message, ...updated, attachment_data: undefined }
        : message
    )))
  }

  const saveStatus = async () => {
    if (!detail || selectedStatus === 'replied') {
      if (selectedStatus === 'replied') toast.error('請使用回覆欄位將訊息設為已回覆')
      return
    }
    setSavingStatus(true)
    try {
      const response = await contactAPI.update(detail.id, { status: selectedStatus })
      applyUpdatedMessage(response.data?.message)
      toast.success('處理狀態已更新')
    } catch (error) {
      toast.error(error.response?.data?.error || '無法更新處理狀態')
    } finally {
      setSavingStatus(false)
    }
  }

  const saveReply = async () => {
    if (!detail) return
    if (reply.trim().length < 2) {
      toast.error('回覆內容至少需要 2 個字元')
      return
    }
    setSavingReply(true)
    try {
      const response = await contactAPI.update(detail.id, {
        status: 'replied',
        reply: reply.trim()
      })
      applyUpdatedMessage(response.data?.message)
      toast.success(detail.user_id ? '回覆已儲存，使用者將收到網站通知' : '回覆已儲存，請再開啟信箱寄給訪客')
    } catch (error) {
      toast.error(error.response?.data?.error || '無法儲存回覆')
    } finally {
      setSavingReply(false)
    }
  }

  const copyText = async (value, label) => {
    try {
      await navigator.clipboard.writeText(String(value || ''))
      toast.success(`${label}已複製`)
    } catch {
      toast.error('複製失敗，請手動選取')
    }
  }

  const replyIsSaved = Boolean(
    detail &&
    detail.status === 'replied' &&
    detail.admin_reply === reply.trim()
  )
  const emailHref = detail && !detail.user_id && replyIsSaved
    ? `mailto:${encodeURIComponent(detail.sender_email)}?subject=${encodeURIComponent(`回覆：${detail.subject}（${detail.reference_code}）`)}&body=${encodeURIComponent(`${reply.trim()}\n\n聯絡編號：${detail.reference_code}`)}`
    : ''

  if (loading) {
    return (
      <div className="admin-contact-loading">
        <Loader2 />
        <span>正在載入聯絡訊息…</span>
      </div>
    )
  }

  return (
    <div className="admin-contact-page">
      <section className="hud-page-heading admin-contact-heading">
        <div>
          <h2 className="hud-page-title">聯絡訊息</h2>
          <p className="hud-page-description">查看網站表單內容、追蹤處理狀態並回覆使用者。</p>
        </div>
        <button type="button" className="admin-contact-refresh" onClick={() => fetchMessages()} disabled={refreshing}>
          <RefreshCw className={refreshing ? 'is-spinning' : ''} />
          重新整理
        </button>
      </section>

      <section className="admin-contact-stats" aria-label="訊息統計">
        {[
          ['all', '全部訊息', Inbox],
          ['new', '待查看', AlertCircle],
          ['in_progress', '處理中', Clock],
          ['replied', '已回覆', CheckCircle2],
          ['closed', '已結束', Mail]
        ].map(([key, label, Icon]) => (
          <button
            key={key}
            type="button"
            className={statusFilter === key ? 'is-active' : ''}
            onClick={() => setStatusFilter(key)}
          >
            <span><Icon /></span>
            <div><strong>{counts[key]}</strong><small>{label}</small></div>
          </button>
        ))}
      </section>

      <section className="admin-contact-workspace">
        <div className="admin-contact-inbox">
          <div className="admin-contact-tools">
            <label className="admin-contact-search">
              <Search />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="搜尋姓名、信箱、主旨或編號"
              />
            </label>
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="all">所有類型</option>
              {Object.entries(CATEGORY_META).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="admin-contact-list" aria-label="聯絡訊息列表">
            {filteredMessages.length === 0 ? (
              <div className="admin-contact-empty">
                <Inbox />
                <strong>沒有符合條件的訊息</strong>
                <span>可以調整上方篩選或重新整理。</span>
              </div>
            ) : filteredMessages.map((message) => {
              const status = STATUS_META[message.status] || STATUS_META.new
              const selected = String(selectedId) === String(message.id)
              return (
                <button
                  key={message.id}
                  type="button"
                  className={`admin-contact-list-item ${selected ? 'is-selected' : ''} ${!message.read_at ? 'is-unread' : ''}`}
                  onClick={() => openMessage(message.id)}
                >
                  <div className="admin-contact-list-topline">
                    <span className={`admin-contact-status is-${status.tone}`}>{status.label}</span>
                    <time>{formatDateTime(message.created_at)}</time>
                  </div>
                  <strong className="admin-contact-list-subject">{message.subject}</strong>
                  <span className="admin-contact-list-sender">{message.sender_name} · {message.sender_email}</span>
                  <p>{message.message}</p>
                  <div className="admin-contact-list-footer">
                    <span>{CATEGORY_META[message.category] || message.category}</span>
                    <span>{message.reference_code}</span>
                    {message.has_attachment && <Paperclip aria-label="有附圖" />}
                    <ChevronRight />
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="admin-contact-detail">
          {!selectedId ? (
            <div className="admin-contact-detail-placeholder">
              <MessageSquare />
              <strong>選擇一則訊息</strong>
              <p>完整內容、截圖與回覆工具會顯示在這裡。</p>
            </div>
          ) : detailLoading ? (
            <div className="admin-contact-detail-placeholder">
              <Loader2 className="is-spinning" />
              <strong>正在開啟訊息…</strong>
            </div>
          ) : detail ? (
            <div className="admin-contact-detail-content">
              <header className="admin-contact-detail-header">
                <div className="admin-contact-detail-badges">
                  <span className={`admin-contact-status is-${STATUS_META[detail.status]?.tone || 'new'}`}>
                    {STATUS_META[detail.status]?.label || detail.status}
                  </span>
                  <span>{CATEGORY_META[detail.category] || detail.category}</span>
                </div>
                <h3>{detail.subject}</h3>
                <div className="admin-contact-reference">
                  <span>{detail.reference_code}</span>
                  <button type="button" onClick={() => copyText(detail.reference_code, '聯絡編號')} aria-label="複製聯絡編號">
                    <Copy />
                  </button>
                </div>
              </header>

              <div className="admin-contact-sender-card">
                <img
                  src={resolveAvatarSrc(detail.user_avatar_url)}
                  alt=""
                  onError={(event) => { event.currentTarget.src = defaultAvatar }}
                />
                <div>
                  <strong>{detail.user_display_name || detail.sender_name}</strong>
                  <button type="button" onClick={() => copyText(detail.sender_email, '信箱')}>
                    {detail.sender_email}<Copy />
                  </button>
                  <span>
                    {detail.user_id
                      ? `已登入使用者${detail.user_public_id ? ` · ID ${detail.user_public_id}` : ''}`
                      : '未登入訪客'}
                  </span>
                </div>
              </div>

              <div className="admin-contact-meta-grid">
                <div><span>送出時間</span><strong>{formatDateTime(detail.created_at)}</strong></div>
                <div><span>顯示狀態</span><strong>{detail.color_mode === 'dark' ? '深色' : '明亮'} · {detail.effect_mode === 'tech' ? '科技感' : detail.effect_mode === 'neon' ? '霓虹矩陣' : '一般'}</strong></div>
              </div>

              <section className="admin-contact-message-body">
                <h4>訊息內容</h4>
                <p>{detail.message}</p>
              </section>

              {detail.attachment_data && (
                <section className="admin-contact-attachment">
                  <div><ImageIcon /><h4>問題截圖</h4><span>{detail.attachment_name}</span></div>
                  <a href={detail.attachment_data} target="_blank" rel="noreferrer" title="開啟原圖">
                    <img src={detail.attachment_data} alt="使用者附上的問題截圖" />
                    <span><ExternalLink />開啟原圖</span>
                  </a>
                </section>
              )}

              {detail.source_page && (
                <div className="admin-contact-source">
                  <span>送出頁面</span>
                  <a href={detail.source_page} target="_blank" rel="noreferrer">{detail.source_page}<ExternalLink /></a>
                </div>
              )}

              <section className="admin-contact-status-editor">
                <div>
                  <h4>處理狀態</h4>
                  <p>可先標記為處理中，完成回覆後會自動改為已回覆。</p>
                </div>
                <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)}>
                  <option value="new">待查看</option>
                  <option value="in_progress">處理中</option>
                  <option value="replied">已回覆</option>
                  <option value="closed">已結束</option>
                </select>
                <button type="button" onClick={saveStatus} disabled={savingStatus || selectedStatus === 'replied'}>
                  {savingStatus ? <Loader2 className="is-spinning" /> : <Save />}
                  儲存狀態
                </button>
              </section>

              <section className="admin-contact-reply-editor">
                <div>
                  <h4>回覆內容</h4>
                  <p>
                    {detail.user_id
                      ? '儲存後，這位使用者會在網站通知中心看到回覆。'
                      : '這是訪客訊息；先儲存內容，再使用下方按鈕開啟信箱寄出。'}
                  </p>
                </div>
                <textarea
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  maxLength={4000}
                  rows={8}
                  placeholder="輸入要回覆給對方的內容…"
                />
                <div className="admin-contact-reply-footer">
                  <span>{reply.length} / 4000</span>
                  <div>
                    {!detail.user_id && (
                      <a
                        href={emailHref || undefined}
                        className={!emailHref ? 'is-disabled' : ''}
                        onClick={(event) => { if (!emailHref) event.preventDefault() }}
                      >
                        <Mail />開啟信箱寄出
                      </a>
                    )}
                    <button type="button" onClick={saveReply} disabled={savingReply}>
                      {savingReply ? <Loader2 className="is-spinning" /> : <Send />}
                      儲存回覆
                    </button>
                  </div>
                </div>
                {detail.replied_at && (
                  <p className="admin-contact-last-reply">
                    上次儲存回覆：{formatDateTime(detail.replied_at)}。再次儲存會更新回覆內容。
                  </p>
                )}
              </section>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}

export default AdminContactMessages
