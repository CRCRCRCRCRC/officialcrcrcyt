import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  AtSign,
  CheckCircle2,
  ChevronDown,
  FileImage,
  HelpCircle,
  Home,
  Mail,
  MessageCircle,
  Monitor,
  RefreshCw,
  Send,
  ShieldCheck,
  ShoppingBag,
  Ticket,
  User,
  Users,
  X,
  Youtube
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useWebsiteAuth } from '../contexts/WebsiteAuthContext'
import { contactAPI } from '../services/api'
import defaultAvatar from '../assets/default-avatar.svg'
import '../styles/contact.css'

const CATEGORIES = [
  {
    value: 'website',
    label: '網站使用',
    description: '頁面異常、顯示問題或功能建議',
    tip: '請告訴我們發生問題的頁面、操作步驟，以及你原本預期看到的結果。',
    icon: Monitor
  },
  {
    value: 'account',
    label: '帳號與登入',
    description: 'Google 登入、個人資料或帳號狀態',
    tip: '可提供你的網站個人 ID，但請勿填寫密碼、驗證碼或登入憑證。',
    icon: User
  },
  {
    value: 'shop',
    label: '商店與商品',
    description: '購買、贈禮、背包或 coin 問題',
    tip: '若與購買有關，請填寫商品名稱、操作時間與畫面顯示的狀態。',
    icon: ShoppingBag
  },
  {
    value: 'redeem',
    label: '兌換碼',
    description: '兌換失敗、獎勵內容或使用狀態',
    tip: '請描述錯誤訊息與操作時間。請勿在公開場合張貼仍可使用的兌換碼。',
    icon: Ticket
  },
  {
    value: 'discord',
    label: 'Discord',
    description: '帳號綁定、伺服器或身分組',
    tip: '請說明 Discord 是否已綁定、是否已加入伺服器，以及缺少的身分組。',
    icon: MessageCircle
  },
  {
    value: 'collaboration',
    label: '合作邀請',
    description: '創作合作、宣傳邀約或其他提案',
    tip: '建議附上合作方式、預計時間、內容範圍及方便聯絡的管道。',
    icon: Users
  },
  {
    value: 'other',
    label: '其他問題',
    description: '不屬於上面分類的內容',
    tip: '請用一句話說明目的，再補充必要背景，會更容易快速理解。',
    icon: HelpCircle
  }
]

const FAQS = [
  {
    question: '一定要登入才能聯絡嗎？',
    answer: '不用。訪客也能直接送出訊息；若你已登入，管理員回覆後還會同步出現在網站通知中心。'
  },
  {
    question: '回覆會送到哪裡？',
    answer: '登入使用者會在網站通知中心收到回覆；訪客則會透過表單中填寫的信箱收到回覆，因此請確認信箱沒有打錯。'
  },
  {
    question: '可以附上問題畫面嗎？',
    answer: '可以附上一張 PNG 或 JPG 截圖，檔案大小上限為 2MB。上傳前請遮住信箱、付款資訊、驗證碼等敏感資料。'
  },
  {
    question: '多久會收到回覆？',
    answer: '處理時間會依問題內容而不同。提供清楚的操作步驟、發生時間與截圖，通常能減少來回確認所需的時間。'
  },
  {
    question: '可以在訊息中提供密碼或驗證碼嗎？',
    answer: '不可以。CRCRC 不會要求你提供 Google、Discord 或任何網站的密碼、驗證碼、權杖與付款資料。'
  }
]

const createInitialForm = (user) => ({
  category: '',
  name: (user?.displayName || user?.name || user?.username) === '載入中...'
    ? ''
    : (user?.displayName || user?.name || user?.username || ''),
  email: user?.email || '',
  subject: '',
  message: '',
  safetyConfirmed: false,
  website: ''
})

const resolveAvatarSrc = (value) => {
  const normalized = String(value || '').trim()
  if (!normalized) return defaultAvatar
  if (/^(https?:)?\/\//i.test(normalized) || normalized.startsWith('data:')) return normalized
  return normalized.startsWith('/') ? normalized : `/${normalized}`
}

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(String(reader.result || ''))
  reader.onerror = () => reject(new Error('無法讀取圖片'))
  reader.readAsDataURL(file)
})

const Contact = () => {
  const { user } = useWebsiteAuth()
  const fileInputRef = useRef(null)
  const [form, setForm] = useState(() => createInitialForm(user))
  const [attachment, setAttachment] = useState(null)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [ticket, setTicket] = useState(null)
  const [openFaq, setOpenFaq] = useState(0)

  const selectedCategory = CATEGORIES.find((item) => item.value === form.category)
  const displayName = user?.displayName || user?.name || user?.username || user?.email || ''
  const avatar = resolveAvatarSrc(user?.picture || user?.avatarUrl)
  const publicId = user?.publicId || user?.public_id || ''

  useEffect(() => {
    if (!user) return
    setForm((current) => ({
      ...current,
      name: (!current.name || current.name === '載入中...') ? displayName : current.name,
      email: current.email || user.email || ''
    }))
  }, [displayName, user])

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  const validate = () => {
    const nextErrors = {}
    if (!form.category) nextErrors.category = '請先選擇問題類型'
    if (form.name.trim().length < 2) nextErrors.name = '稱呼至少需要 2 個字元'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = '請輸入正確的回覆信箱'
    }
    if (form.subject.trim().length < 4) nextErrors.subject = '主旨至少需要 4 個字元'
    if (form.message.trim().length < 10) nextErrors.message = '詳細內容至少需要 10 個字元'
    if (!form.safetyConfirmed) nextErrors.safetyConfirmed = '請先確認內容不包含敏感資料'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleAttachment = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      toast.error('截圖只支援 PNG 或 JPG 格式')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('截圖大小不可超過 2MB')
      return
    }

    try {
      const data = await readFileAsDataUrl(file)
      setAttachment({ name: file.name, data })
      setErrors((current) => ({ ...current, attachment: undefined }))
    } catch (error) {
      toast.error(error.message || '無法讀取圖片')
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate()) return

    const body = document.body
    const colorMode = body.classList.contains('site-dark-mode') ? 'dark' : 'light'
    const effectMode = body.classList.contains('tech-mode')
      ? 'tech'
      : body.classList.contains('neon-mode')
        ? 'neon'
        : 'none'

    setSubmitting(true)
    try {
      const response = await contactAPI.submit({
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
        attachment,
        sourcePage: window.location.href,
        colorMode,
        effectMode
      })
      setTicket(response.data?.ticket || null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      const field = error.response?.data?.field
      const message = error.response?.data?.error || '目前無法送出訊息，請稍後再試'
      if (field) setErrors((current) => ({ ...current, [field]: message }))
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setForm(createInitialForm(user))
    setAttachment(null)
    setErrors({})
    setTicket(null)
  }

  return (
    <div className="contact-page">
      <section className="contact-hero">
        <div className="contact-container contact-hero-inner">
          <div className="contact-hero-icon" aria-hidden="true">
            <Mail />
          </div>
          <p className="contact-eyebrow">有事情想告訴我們？</p>
          <h1>聯絡我們</h1>
          <p className="contact-hero-copy">
            無論是網站問題、帳號疑問，還是合作想法，都可以從這裡傳給 CRCRC。
          </p>
          <div className="contact-hero-promise">
            <span><ShieldCheck />資料只用於處理這次聯絡</span>
            <span><CheckCircle2 />送出後會取得聯絡編號</span>
          </div>
        </div>
      </section>

      <div className="contact-container contact-content">
        {ticket ? (
          <section className="contact-success" aria-live="polite">
            <span className="contact-success-icon"><CheckCircle2 /></span>
            <p className="contact-eyebrow">訊息已送達</p>
            <h2>我們收到你的訊息了</h2>
            <p>請保留下面的聯絡編號，之後詢問處理進度時會比較方便。</p>
            <div className="contact-ticket-number">
              <span>聯絡編號</span>
              <strong>{ticket.reference}</strong>
            </div>
            {user ? (
              <p className="contact-success-note">管理員回覆後，內容會出現在你的網站通知中心。</p>
            ) : (
              <p className="contact-success-note">回覆將寄到你填寫的信箱，請留意收件匣與垃圾郵件匣。</p>
            )}
            <div className="contact-success-actions">
              <Link to="/" className="contact-button contact-button-secondary">
                <Home />返回首頁
              </Link>
              <button type="button" className="contact-button contact-button-primary" onClick={resetForm}>
                <RefreshCw />再傳一則訊息
              </button>
            </div>
          </section>
        ) : (
          <>
            <section className="contact-intro-grid" aria-label="其他聯絡方式與填寫提醒">
              <div className="contact-side-panel contact-account-panel">
                <div className="contact-section-heading">
                  <span className="contact-heading-icon"><User /></span>
                  <div>
                    <h2>{user ? '已帶入你的帳號資料' : '訪客也可以直接聯絡'}</h2>
                    <p>{user ? '回覆會同步送到網站通知中心。' : '不需要登入，只要留下正確回覆信箱。'}</p>
                  </div>
                </div>

                {user ? (
                  <div className="contact-user-card">
                    <img
                      src={avatar}
                      alt=""
                      onError={(event) => { event.currentTarget.src = defaultAvatar }}
                    />
                    <div>
                      <strong>{displayName}</strong>
                      <span>{user.email}</span>
                      {publicId && <span>個人 ID：{publicId}</span>}
                    </div>
                  </div>
                ) : (
                  <div className="contact-guest-note">
                    <AtSign />
                    <p>請確認信箱拼字正確，否則我們無法把回覆傳給你。</p>
                  </div>
                )}
              </div>

              <div className="contact-side-panel">
                <div className="contact-section-heading">
                  <span className="contact-heading-icon"><MessageCircle /></span>
                  <div>
                    <h2>也可以在這些地方找到我們</h2>
                    <p>適合一般交流；帳號或訂單問題仍建議使用下方表單。</p>
                  </div>
                </div>
                <div className="contact-channel-list">
                  <a href="https://discord.gg/FyrNaF6Nbj" target="_blank" rel="noreferrer">
                    <span className="contact-channel-icon contact-channel-discord"><MessageCircle /></span>
                    <span><strong>Discord 群組</strong><small>加入社群交流</small></span>
                    <ArrowRight />
                  </a>
                  <a href="https://youtube.com/@officialcrcrcyt" target="_blank" rel="noreferrer">
                    <span className="contact-channel-icon contact-channel-youtube"><Youtube /></span>
                    <span><strong>YouTube 頻道</strong><small>查看最新內容</small></span>
                    <ArrowRight />
                  </a>
                </div>
              </div>
            </section>

            <section className="contact-form-section">
              <div className="contact-form-heading">
                <div>
                  <p className="contact-eyebrow">傳送訊息</p>
                  <h2>先告訴我們遇到什麼事</h2>
                  <p>選擇最接近的類型，表單會提示你哪些資訊最有幫助。</p>
                </div>
                <span className="contact-required-note"><i>*</i> 為必填欄位</span>
              </div>

              <form onSubmit={handleSubmit} noValidate>
                <fieldset className="contact-fieldset">
                  <legend>問題類型 <i>*</i></legend>
                  <div className="contact-category-grid">
                    {CATEGORIES.map((category) => {
                      const Icon = category.icon
                      const selected = form.category === category.value
                      return (
                        <button
                          key={category.value}
                          type="button"
                          className={`contact-category ${selected ? 'is-selected' : ''}`}
                          onClick={() => updateField('category', category.value)}
                          aria-pressed={selected}
                        >
                          <Icon />
                          <span><strong>{category.label}</strong><small>{category.description}</small></span>
                          <i aria-hidden="true">{selected && <CheckCircle2 />}</i>
                        </button>
                      )
                    })}
                  </div>
                  {errors.category && <p className="contact-field-error"><AlertTriangle />{errors.category}</p>}
                  {selectedCategory && (
                    <div className="contact-category-tip" role="status">
                      <HelpCircle />
                      <p><strong>填寫提示</strong>{selectedCategory.tip}</p>
                    </div>
                  )}
                </fieldset>

                <div className="contact-form-grid">
                  <label className="contact-field">
                    <span>你的稱呼 <i>*</i></span>
                    <div className={`contact-input-wrap ${errors.name ? 'has-error' : ''}`}>
                      <User />
                      <input
                        value={form.name}
                        onChange={(event) => updateField('name', event.target.value)}
                        maxLength={100}
                        autoComplete="name"
                        placeholder="希望我們怎麼稱呼你"
                      />
                    </div>
                    {errors.name && <small className="contact-field-error"><AlertTriangle />{errors.name}</small>}
                  </label>

                  <label className="contact-field">
                    <span>回覆信箱 <i>*</i></span>
                    <div className={`contact-input-wrap ${errors.email ? 'has-error' : ''}`}>
                      <AtSign />
                      <input
                        type="email"
                        value={form.email}
                        onChange={(event) => updateField('email', event.target.value)}
                        maxLength={254}
                        autoComplete="email"
                        placeholder="name@example.com"
                      />
                    </div>
                    {errors.email && <small className="contact-field-error"><AlertTriangle />{errors.email}</small>}
                  </label>
                </div>

                <label className="contact-field">
                  <span>主旨 <i>*</i></span>
                  <div className={`contact-input-wrap ${errors.subject ? 'has-error' : ''}`}>
                    <Mail />
                    <input
                      value={form.subject}
                      onChange={(event) => updateField('subject', event.target.value)}
                      maxLength={150}
                      placeholder="用一句話說明這次想聯絡的事情"
                    />
                  </div>
                  {errors.subject && <small className="contact-field-error"><AlertTriangle />{errors.subject}</small>}
                </label>

                <label className="contact-field">
                  <span>詳細內容 <i>*</i></span>
                  <div className={`contact-textarea-wrap ${errors.message ? 'has-error' : ''}`}>
                    <textarea
                      value={form.message}
                      onChange={(event) => updateField('message', event.target.value)}
                      maxLength={2000}
                      rows={8}
                      placeholder={'建議依序寫下：\n1. 你正在做什麼\n2. 畫面發生了什麼\n3. 你原本期待的結果'}
                    />
                    <span>{form.message.length} / 2000</span>
                  </div>
                  {errors.message && <small className="contact-field-error"><AlertTriangle />{errors.message}</small>}
                </label>

                <div className="contact-field">
                  <span>問題截圖 <em>選填</em></span>
                  {attachment ? (
                    <div className="contact-attachment-preview">
                      <img src={attachment.data} alt="準備上傳的問題截圖" />
                      <div>
                        <strong>{attachment.name}</strong>
                        <span>圖片已準備好，會和訊息一起送出。</span>
                      </div>
                      <button type="button" onClick={() => setAttachment(null)} aria-label="移除截圖">
                        <X />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="contact-upload"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <span><FileImage /></span>
                      <strong>選擇一張問題截圖</strong>
                      <small>支援 PNG、JPG，最大 2MB</small>
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg"
                    className="contact-file-input"
                    onChange={handleAttachment}
                  />
                </div>

                <label className={`contact-safety-check ${errors.safetyConfirmed ? 'has-error' : ''}`}>
                  <input
                    type="checkbox"
                    checked={form.safetyConfirmed}
                    onChange={(event) => updateField('safetyConfirmed', event.target.checked)}
                  />
                  <span aria-hidden="true"><CheckCircle2 /></span>
                  <p>
                    <strong>我已確認內容安全</strong>
                    訊息與截圖不包含密碼、驗證碼、登入權杖、付款資料或其他不應公開的敏感資訊。
                  </p>
                </label>
                {errors.safetyConfirmed && (
                  <p className="contact-field-error"><AlertTriangle />{errors.safetyConfirmed}</p>
                )}

                <label className="contact-honeypot" aria-hidden="true">
                  網站
                  <input
                    value={form.website}
                    onChange={(event) => updateField('website', event.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </label>

                <div className="contact-submit-row">
                  <p><ShieldCheck />你的資料只會用於辨識與處理這次訊息。</p>
                  <button type="submit" className="contact-button contact-button-primary" disabled={submitting}>
                    {submitting ? <RefreshCw className="is-spinning" /> : <Send />}
                    {submitting ? '正在送出…' : '送出訊息'}
                  </button>
                </div>
              </form>
            </section>
          </>
        )}

        <section className="contact-faq-section">
          <div className="contact-faq-heading">
            <p className="contact-eyebrow">常見問題</p>
            <h2>送出之前，你可能也想知道</h2>
          </div>
          <div className="contact-faq-list">
            {FAQS.map((faq, index) => {
              const open = openFaq === index
              return (
                <div key={faq.question} className={`contact-faq-item ${open ? 'is-open' : ''}`}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? -1 : index)}
                    aria-expanded={open}
                  >
                    <span>{faq.question}</span>
                    <ChevronDown />
                  </button>
                  {open && <p>{faq.answer}</p>}
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}

export default Contact
