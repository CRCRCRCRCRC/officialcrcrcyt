// 格式化持續時間 (PT4M13S -> 4:13)
export const formatDuration = (duration) => {
  if (!duration) return '0:00'
  
  // 如果已經是 MM:SS 格式，直接返回
  if (duration.includes(':')) {
    return duration
  }
  
  // 處理 PT 格式 (PT4M13S)
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
  if (!match) return '0:00'
  
  const hours = parseInt(match[1]) || 0
  const minutes = parseInt(match[2]) || 0
  const seconds = parseInt(match[3]) || 0
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }
}

// 格式化數字 (1234567 -> 1.2M)
export const formatNumber = (num) => {
  if (!num) return '0'
  
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toLocaleString()
}

// 解碼 HTML 實體
export const decodeHtmlEntities = (text) => {
  if (!text) return text
  const textarea = document.createElement('textarea')
  textarea.innerHTML = text
  return textarea.value
}

// 根據品質設定獲取縮圖URL
export const getThumbnailUrl = (video, quality = 'maxres') => {
  if (!video) return ''

  // 如果有 thumbnails 物件，使用指定品質
  if (video.thumbnails) {
    const qualityOrder = ['maxres', 'standard', 'high', 'medium', 'default']

    // 從指定品質開始，往下降級尋找可用的縮圖
    const startIndex = qualityOrder.indexOf(quality)
    for (let i = startIndex; i < qualityOrder.length; i++) {
      const thumbnail = video.thumbnails[qualityOrder[i]]
      if (thumbnail?.url) {
        return thumbnail.url
      }
    }
  }

  // 回退到傳統方式
  const videoId = video.id || video.youtube_id
  if (!videoId) return ''

  const qualityMap = {
    'maxres': 'maxresdefault',
    'standard': 'sddefault',
    'high': 'hqdefault',
    'medium': 'mqdefault',
    'default': 'default'
  }

  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality] || 'maxresdefault'}.jpg`
}
