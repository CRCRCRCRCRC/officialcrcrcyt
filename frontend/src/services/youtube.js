const API_KEY = 'AIzaSyAL7DTorRi5eu51ZeHhpANCE6i2TRPQnjQ'
const BASE_URL = 'https://www.googleapis.com/youtube/v3'

// CRCRC 頻道 ID (需要從頻道 URL 獲取)
const CHANNEL_ID = 'UCYourChannelIdHere' // 請替換為實際的頻道 ID

class YouTubeService {
  // 獲取頻道資訊
  async getChannelInfo(channelId = CHANNEL_ID) {
    try {
      const response = await fetch(
        `${BASE_URL}/channels?part=snippet,statistics,brandingSettings&id=${channelId}&key=${API_KEY}`
      )
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.items && data.items.length > 0) {
        const channel = data.items[0]
        return {
          id: channel.id,
          title: channel.snippet.title,
          description: channel.snippet.description,
          thumbnails: channel.snippet.thumbnails,
          subscriberCount: parseInt(channel.statistics.subscriberCount),
          videoCount: parseInt(channel.statistics.videoCount),
          viewCount: parseInt(channel.statistics.viewCount),
          bannerExternalUrl: channel.brandingSettings?.image?.bannerExternalUrl
        }
      }
      
      return null
    } catch (error) {
      console.error('獲取頻道資訊失敗:', error)
      throw error
    }
  }

  // 獲取頻道影片列表
  async getChannelVideos(channelId = CHANNEL_ID, maxResults = 50) {
    try {
      const response = await fetch(
        `${BASE_URL}/search?part=snippet&channelId=${channelId}&maxResults=${maxResults}&order=date&type=video&key=${API_KEY}`
      )
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.items) {
        // 獲取影片詳細資訊（包括統計數據）
        const videoIds = data.items.map(item => item.id.videoId).join(',')
        const detailsResponse = await fetch(
          `${BASE_URL}/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${API_KEY}`
        )
        
        const detailsData = await detailsResponse.json()
        
        return detailsData.items.map(video => ({
          id: video.id,
          title: video.snippet.title,
          description: video.snippet.description,
          publishedAt: video.snippet.publishedAt,
          thumbnails: video.snippet.thumbnails,
          channelTitle: video.snippet.channelTitle,
          tags: video.snippet.tags || [],
          viewCount: parseInt(video.statistics.viewCount || 0),
          likeCount: parseInt(video.statistics.likeCount || 0),
          commentCount: parseInt(video.statistics.commentCount || 0),
          duration: video.contentDetails.duration,
          url: `https://www.youtube.com/watch?v=${video.id}`
        }))
      }
      
      return []
    } catch (error) {
      console.error('獲取頻道影片失敗:', error)
      throw error
    }
  }

  // 獲取熱門影片
  async getPopularVideos(channelId = CHANNEL_ID, maxResults = 10) {
    try {
      const response = await fetch(
        `${BASE_URL}/search?part=snippet&channelId=${channelId}&maxResults=${maxResults}&order=viewCount&type=video&key=${API_KEY}`
      )
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.items) {
        // 獲取詳細資訊包括觀看次數
        const videoIds = data.items.map(item => item.id.videoId).join(',')
        const detailsResponse = await fetch(
          `${BASE_URL}/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${API_KEY}`
        )
        
        const detailsData = await detailsResponse.json()
        
        return detailsData.items.map(item => ({
          id: item.id,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnails: item.snippet.thumbnails,
          publishedAt: item.snippet.publishedAt,
          channelTitle: item.snippet.channelTitle,
          viewCount: parseInt(item.statistics.viewCount),
          likeCount: parseInt(item.statistics.likeCount || 0),
          duration: item.contentDetails.duration
        }))
      }
      
      return []
    } catch (error) {
      console.error('獲取熱門影片失敗:', error)
      throw error
    }
  }

  // 搜尋頻道影片
  async searchChannelVideos(query, channelId = CHANNEL_ID, maxResults = 20) {
    try {
      const response = await fetch(
        `${BASE_URL}/search?part=snippet&channelId=${channelId}&q=${encodeURIComponent(query)}&maxResults=${maxResults}&type=video&key=${API_KEY}`
      )
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.items) {
        const videoIds = data.items.map(item => item.id.videoId).join(',')
        const detailsResponse = await fetch(
          `${BASE_URL}/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${API_KEY}`
        )
        
        const detailsData = await detailsResponse.json()
        
        return detailsData.items.map(video => ({
          id: video.id,
          title: video.snippet.title,
          description: video.snippet.description,
          publishedAt: video.snippet.publishedAt,
          thumbnails: video.snippet.thumbnails,
          viewCount: parseInt(video.statistics.viewCount || 0),
          likeCount: parseInt(video.statistics.likeCount || 0),
          duration: video.contentDetails.duration,
          url: `https://www.youtube.com/watch?v=${video.id}`
        }))
      }
      
      return []
    } catch (error) {
      console.error('搜尋影片失敗:', error)
      throw error
    }
  }

  // 格式化持續時間 (PT4M13S -> 4:13)
  formatDuration(duration) {
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
  formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }
}

export default new YouTubeService()