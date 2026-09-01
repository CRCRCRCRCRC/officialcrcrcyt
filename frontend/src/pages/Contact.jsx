import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, MessageCircle, RefreshCw, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { useWebsiteAuth } from '../contexts/WebsiteAuthContext'
import { contactAPI } from '../services/api'
import GoogleLoginButtonPublic from '../components/GoogleLoginButtonPublic'
import '../styles/contact.css'

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

const Contact = () => {
  const { user, token } = useWebsiteAuth()
  const isLoggedIn = Boolean(user && token)
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(isLoggedIn)
  const [refreshing, setRefreshing] = useState(false)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)
  const loadInFlightRef = useRef(false)

  const loadConversation = useCallback(async ({ quiet = false } = {}) => {
    if (!isLoggedIn || loadInFlightRef.current) return
    loadInFlightRef.current = true
    if (quiet) setRefreshing(true)
    else setLoading(true)
    try {
      const response = await contactAPI.getConversation()
      setConversation(response.data?.conversation || null)
      setMessages(response.data?.messages || [])
    } catch (error) {
      if (!quiet) toast.error(error.response?.data?.error || '無法載入私訊')
    } finally {
      loadInFlightRef.current = false
      setLoading(false)
      setRefreshing(false)
    }
  }, [isLoggedIn])

  useEffect(() => {
    if (!isLoggedIn) {
      setConversation(null)
      setMessages([])
      setLoading(false)
      return undefined
    }

    loadConversation()
    const timer = window.setInterval(() => loadConversation({ quiet: true }), 20000)
    return () => window.clearInterval(timer)
  }, [isLoggedIn, loadConversation])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length])

  const sendMessage = async () => {
    const message = draft.trim()
    if (!message || sending) return
    if (message.length > 2000) {
      toast.error('每則訊息最多 2000 個字元')
      return
    }

    setSending(true)
    try {
      const response = await contactAPI.sendMessage(message)
      const sent = response.data?.message
      if (sent) setMessages((current) => [...current, sent])
      setConversation((current) => ({
        ...(current || response.data?.conversation || {}),
        status: 'open',
        last_message_at: sent?.created_at || new Date().toISOString()
      }))
      setDraft('')
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

  if (!isLoggedIn) {
    return (
      <div className="message-page message-page-login">
        <div className="message-login-card">
          <MessageCircle aria-hidden="true" />
          <h1>站內私訊</h1>
          <p>登入後就能直接傳訊息給管理員。</p>
          <div className="message-google-login">
            <GoogleLoginButtonPublic />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="message-page">
      <div className="message-window" role="region" aria-label="與管理員的站內私訊">
        <div className="message-header">
          <div className="message-admin-avatar"><MessageCircle /></div>
          <div>
            <h1>管理員</h1>
            <span>站內私訊</span>
          </div>
          <button
            type="button"
            onClick={() => loadConversation({ quiet: true })}
            disabled={refreshing || loading}
            aria-label="重新整理訊息"
          >
            <RefreshCw className={refreshing ? 'is-spinning' : ''} />
          </button>
        </div>

        <div className="message-history" aria-live="polite">
          {loading ? (
            <div className="message-state"><Loader2 className="is-spinning" /><span>載入中…</span></div>
          ) : messages.length === 0 ? (
            <div className="message-state message-empty-state">
              <MessageCircle />
              <strong>有什麼想說的，直接傳訊息就好。</strong>
            </div>
          ) : (
            messages.map((message) => {
              const mine = message.sender_role === 'user'
              return (
                <div key={message.id} className={`message-row ${mine ? 'is-mine' : 'is-admin'}`}>
                  {!mine && <span className="message-small-avatar"><MessageCircle /></span>}
                  <div>
                    <p>{message.body}</p>
                    <time>{formatTime(message.created_at)}</time>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="message-composer">
          {conversation?.status === 'closed' && (
            <p className="message-closed-note">傳送新訊息會重新開啟這段對話。</p>
          )}
          <div>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={2000}
              rows={1}
              placeholder="輸入訊息…"
              aria-label="訊息內容"
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={!draft.trim() || sending}
              aria-label="傳送訊息"
            >
              {sending ? <Loader2 className="is-spinning" /> : <Send />}
            </button>
          </div>
          <span>{draft.length} / 2000</span>
        </div>
      </div>
    </div>
  )
}

export default Contact
