import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  Inbox,
  Loader2,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
  X
} from 'lucide-react'
import toast from 'react-hot-toast'
import { contactAPI } from '../../services/api'
import defaultAvatar from '../../assets/default-avatar.svg'
import '../../styles/admin-contact.css'

const formatTime = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('zh-TW', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

const resolveAvatarSrc = (value) => {
  const normalized = String(value || '').trim()
  if (!normalized) return defaultAvatar
  if (/^(https?:)?\/\//i.test(normalized) || normalized.startsWith('data:')) return normalized
  return normalized.startsWith('/') ? normalized : `/${normalized}`
}

const AdminContactMessages = () => {
  const [conversations, setConversations] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [sending, setSending] = useState(false)
  const [changingStatus, setChangingStatus] = useState(false)
  const messagesEndRef = useRef(null)

  const loadConversations = useCallback(async ({ quiet = false } = {}) => {
    if (quiet) setRefreshing(true)
    else setLoading(true)
    try {
      const response = await contactAPI.getConversations({ limit: 300 })
      setConversations(response.data?.conversations || [])
    } catch (error) {
      if (!quiet) toast.error(error.response?.data?.error || '無法載入站內私訊')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  const openConversation = useCallback(async (conversationId, { quiet = false } = {}) => {
    if (!conversationId) return
    setSelectedId(conversationId)
    if (!quiet) setDetailLoading(true)
    try {
      const response = await contactAPI.getAdminConversation(conversationId)
      setConversation(response.data?.conversation || null)
      setMessages(response.data?.messages || [])
      setConversations((current) => current.map((item) => (
        String(item.id) === String(conversationId)
          ? { ...item, ...(response.data?.conversation || {}), admin_unread_count: 0 }
          : item
      )))
    } catch (error) {
      if (!quiet) toast.error(error.response?.data?.error || '無法開啟對話')
    } finally {
      setDetailLoading(false)
    }
  }, [])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  useEffect(() => {
    if (!selectedId && conversations.length > 0) {
      openConversation(conversations[0].id)
    }
  }, [conversations, openConversation, selectedId])

  useEffect(() => {
    const timer = window.setInterval(() => {
      loadConversations({ quiet: true })
      if (selectedId) openConversation(selectedId, { quiet: true })
    }, 20000)
    return () => window.clearInterval(timer)
  }, [loadConversations, openConversation, selectedId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length])

  const filteredConversations = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return conversations
    return conversations.filter((item) => [
      item.user_display_name,
      item.user_email,
      item.user_public_id,
      item.last_message
    ].some((value) => String(value || '').toLowerCase().includes(keyword)))
  }, [conversations, search])

  const sendMessage = async () => {
    const body = draft.trim()
    if (!selectedId || !body || sending) return
    setSending(true)
    try {
      const response = await contactAPI.sendAdminMessage(selectedId, body)
      const sent = response.data?.message
      if (sent) setMessages((current) => [...current, sent])
      setConversation((current) => current ? { ...current, status: 'open' } : current)
      setDraft('')
      await loadConversations({ quiet: true })
    } catch (error) {
      toast.error(error.response?.data?.error || '訊息傳送失敗')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }

  const toggleStatus = async () => {
    if (!conversation || changingStatus) return
    const nextStatus = conversation.status === 'closed' ? 'open' : 'closed'
    setChangingStatus(true)
    try {
      const response = await contactAPI.updateConversation(conversation.id, nextStatus)
      const updated = response.data?.conversation
      setConversation(updated)
      setConversations((current) => current.map((item) => (
        String(item.id) === String(updated?.id) ? { ...item, ...updated } : item
      )))
      toast.success(nextStatus === 'closed' ? '對話已結束' : '對話已重新開啟')
    } catch (error) {
      toast.error(error.response?.data?.error || '無法更新對話狀態')
    } finally {
      setChangingStatus(false)
    }
  }

  return (
    <div className="admin-message-page">
      <section className="hud-page-heading admin-message-heading">
        <div>
          <h2 className="hud-page-title">站內私訊</h2>
          <p className="hud-page-description">直接在網站內回覆使用者。</p>
        </div>
        <button type="button" onClick={() => loadConversations({ quiet: true })} disabled={refreshing}>
          <RefreshCw className={refreshing ? 'is-spinning' : ''} />
          重新整理
        </button>
      </section>

      <section className="admin-message-window">
        <aside className="admin-message-sidebar">
          <label className="admin-message-search">
            <Search />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="搜尋使用者或訊息"
            />
          </label>

          <div className="admin-message-list">
            {loading ? (
              <div className="admin-message-list-state"><Loader2 className="is-spinning" /></div>
            ) : filteredConversations.length === 0 ? (
              <div className="admin-message-list-state">
                <Inbox />
                <span>目前沒有私訊</span>
              </div>
            ) : filteredConversations.map((item) => (
              <button
                key={item.id}
                type="button"
                className={String(selectedId) === String(item.id) ? 'is-selected' : ''}
                onClick={() => openConversation(item.id)}
              >
                <img
                  src={resolveAvatarSrc(item.user_avatar_url)}
                  alt=""
                  onError={(event) => { event.currentTarget.src = defaultAvatar }}
                />
                <div>
                  <strong>{item.user_display_name || item.user_email}</strong>
                  <p>{item.last_message || '尚無訊息'}</p>
                </div>
                <span>
                  <time>{formatTime(item.last_message_at)}</time>
                  {Number(item.admin_unread_count) > 0 && <i>{item.admin_unread_count}</i>}
                </span>
              </button>
            ))}
          </div>
        </aside>

        <div className="admin-message-chat">
          {!selectedId ? (
            <div className="admin-message-placeholder">
              <MessageCircle />
              <span>選擇一段對話</span>
            </div>
          ) : detailLoading ? (
            <div className="admin-message-placeholder"><Loader2 className="is-spinning" /></div>
          ) : conversation ? (
            <>
              <div className="admin-message-chat-header">
                <img
                  src={resolveAvatarSrc(conversation.user_avatar_url)}
                  alt=""
                  onError={(event) => { event.currentTarget.src = defaultAvatar }}
                />
                <div>
                  <strong>{conversation.user_display_name || conversation.user_email}</strong>
                  <span>{conversation.user_public_id ? `ID：${conversation.user_public_id}` : conversation.user_email}</span>
                </div>
                <button type="button" onClick={toggleStatus} disabled={changingStatus}>
                  {changingStatus ? <Loader2 className="is-spinning" /> : conversation.status === 'closed' ? <Check /> : <X />}
                  {conversation.status === 'closed' ? '重新開啟' : '結束對話'}
                </button>
              </div>

              <div className="admin-message-history">
                {messages.map((message) => {
                  const mine = message.sender_role === 'admin'
                  return (
                    <div key={message.id} className={`admin-message-row ${mine ? 'is-mine' : 'is-user'}`}>
                      <div>
                        <p>{message.body}</p>
                        <time>{formatTime(message.created_at)}</time>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="admin-message-composer">
                {conversation.status === 'closed' && <p>傳送訊息會重新開啟對話。</p>}
                <div>
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={handleKeyDown}
                    maxLength={2000}
                    rows={1}
                    placeholder="輸入回覆…"
                  />
                  <button type="button" onClick={sendMessage} disabled={!draft.trim() || sending}>
                    {sending ? <Loader2 className="is-spinning" /> : <Send />}
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </section>
    </div>
  )
}

export default AdminContactMessages
