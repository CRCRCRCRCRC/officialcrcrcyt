import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, MessageSquare, Youtube, Send, MapPin, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    // 模擬表單提交
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('訊息已發送！我們會盡快回覆您。')
      setFormData({ name: '', email: '', subject: '', message: '' })
    } catch (error) {
      toast.error('發送失敗，請稍後再試。')
    } finally {
      setIsSubmitting(false)
    }
  }

  const contactMethods = [
    {
      icon: Youtube,
      title: 'YouTube',
      description: '訂閱我們的頻道',
      link: 'https://youtube.com/@crcrc',
      linkText: '@CRCRC'
    },
    {
      icon: MessageSquare,
      title: 'Discord',
      description: '加入我們的社群',
      link: 'https://discord.gg/crcrc',
      linkText: 'CRCRC Community'
    },
    {
      icon: Mail,
      title: 'Email',
      description: '商業合作洽詢',
      link: 'mailto:contact@crcrc.com',
      linkText: 'contact@crcrc.com'
    }
  ]

  const faqs = [
    {
      question: '如何申請音樂授權？',
      answer: '請通過 Email 聯繫我們，詳細說明使用目的和範圍，我們會盡快回覆授權相關事宜。'
    },
    {
      question: '可以投稿作品嗎？',
      answer: '我們歡迎優質的空耳音樂作品投稿！請將作品發送到我們的 Email，並附上創作說明。'
    },
    {
      question: '如何加入創作團隊？',
      answer: '如果您有音樂創作經驗並對空耳音樂感興趣，歡迎通過 Discord 或 Email 聯繫我們。'
    },
    {
      question: '商業合作機會？',
      answer: '我們開放各種形式的商業合作，包括品牌合作、活動演出等，請通過 Email 詳談。'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-600 to-secondary-600 text-white">
        <div className="container-custom py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6">
              聯繫我們
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 max-w-3xl mx-auto">
              有任何問題或合作意向？我們很樂意聽到您的聲音
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container-custom py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="card">
              <h2 className="text-2xl font-display font-bold text-gray-900 mb-6">
                發送訊息
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      姓名 *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="input"
                      placeholder="請輸入您的姓名"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="input"
                      placeholder="請輸入您的 Email"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    主題 *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="input"
                    placeholder="請輸入訊息主題"
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    訊息內容 *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="input resize-none"
                    placeholder="請詳細描述您的問題或需求..."
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Send className="w-5 h-5 mr-2" />
                  )}
                  {isSubmitting ? '發送中...' : '發送訊息'}
                </button>
              </form>
            </div>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-8"
          >
            {/* Contact Methods */}
            <div className="card">
              <h2 className="text-2xl font-display font-bold text-gray-900 mb-6">
                聯繫方式
              </h2>
              
              <div className="space-y-6">
                {contactMethods.map((method, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <method.icon className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {method.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-2">
                        {method.description}
                      </p>
                      <a
                        href={method.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        {method.linkText}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Business Hours */}
            <div className="card">
              <h3 className="text-xl font-display font-bold text-gray-900 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-primary-600" />
                回覆時間
              </h3>
              <div className="space-y-2 text-gray-600">
                <p>週一至週五：24 小時內回覆</p>
                <p>週末及假日：48 小時內回覆</p>
                <p className="text-sm text-gray-500 mt-3">
                  * 緊急事務請優先使用 Discord 聯繫
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-6">
              常見問題
            </h2>
            <div className="w-24 h-1 bg-primary-600 mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {faqs.map((faq, index) => (
              <div key={index} className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {faq.question}
                </h3>
                <p className="text-gray-600">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Contact