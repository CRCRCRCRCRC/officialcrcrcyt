import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const SEO = ({
  title,
  description,
  keywords,
  image = 'https://officialcrcrc.vercel.app/og-image.png',
  type = 'website',
  canonicalUrl,
  author,
  publishedTime,
  modifiedTime,
  structuredData
}) => {
  const location = useLocation()
  const baseUrl = 'https://officialcrcrc.vercel.app'
  const fullUrl = canonicalUrl || `${baseUrl}${location.pathname}`
  const fullTitle = title ? `${title} - CRCRC 官方網站` : 'CRCRC 官方網站 - 空耳歌詞、K-pop 翻唱與遊戲社群'
  const fullDescription = description || 'CRCRC 官方網站 - 提供最新空耳歌詞、K-pop 空耳翻唱、荒野亂鬥遊戲內容。與社群互動、參與排行榜競賽，獲得 CRCR 幣獎勵！'
  const fullKeywords = keywords || 'CRCRC, 空耳歌詞, soramimi, K-pop 空耳, 歌詞翻譯, 荒野亂鬥, Brawl Stars, YouTube 創作者, 音樂翻唱'

  useEffect(() => {
    // 設置 title
    document.title = fullTitle

    // 設置或更新 meta 標籤
    const setMetaTag = (name, content) => {
      if (!content) return
      let meta = document.querySelector(`meta[name="${name}"]`)
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute('name', name)
        document.head.appendChild(meta)
      }
      meta.setAttribute('content', content)
    }

    const setMetaProperty = (property, content) => {
      if (!content) return
      let meta = document.querySelector(`meta[property="${property}"]`)
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute('property', property)
        document.head.appendChild(meta)
      }
      meta.setAttribute('content', content)
    }

    const setLinkTag = (rel, href) => {
      if (!href) return
      let link = document.querySelector(`link[rel="${rel}"]`)
      if (!link) {
        link = document.createElement('link')
        link.setAttribute('rel', rel)
        document.head.appendChild(link)
      }
      link.setAttribute('href', href)
    }

    // Primary Meta Tags
    setMetaTag('description', fullDescription)
    setMetaTag('keywords', fullKeywords)
    if (author) setMetaTag('author', author)

    // Canonical URL
    setLinkTag('canonical', fullUrl)

    // Open Graph / Facebook
    setMetaProperty('og:type', type)
    setMetaProperty('og:url', fullUrl)
    setMetaProperty('og:title', fullTitle)
    setMetaProperty('og:description', fullDescription)
    setMetaProperty('og:image', image)
    setMetaProperty('og:site_name', 'CRCRC 官方網站')
    setMetaProperty('og:locale', 'zh_TW')

    if (publishedTime) setMetaProperty('article:published_time', publishedTime)
    if (modifiedTime) setMetaProperty('article:modified_time', modifiedTime)

    // Twitter Card
    setMetaTag('twitter:card', 'summary_large_image')
    setMetaTag('twitter:url', fullUrl)
    setMetaTag('twitter:title', fullTitle)
    setMetaTag('twitter:description', fullDescription)
    setMetaTag('twitter:image', image)
    setMetaTag('twitter:creator', '@officialcrcrcyt')

    // JSON-LD 結構化數據
    if (structuredData) {
      let script = document.querySelector('script[type="application/ld+json"]#page-structured-data')
      if (!script) {
        script = document.createElement('script')
        script.type = 'application/ld+json'
        script.id = 'page-structured-data'
        document.head.appendChild(script)
      }
      script.textContent = JSON.stringify(structuredData)
    }

    // Cleanup
    return () => {
      // 恢復默認 title
      document.title = 'CRCRC 官方網站'
    }
  }, [fullTitle, fullDescription, fullKeywords, fullUrl, image, type, author, publishedTime, modifiedTime, structuredData])

  return null
}

export default SEO
