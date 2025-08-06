const axios = require('axios');
const database = require('../config/database');

const API_KEY = process.env.YOUTUBE_API_KEY;
const BASE_URL = 'https://www.googleapis.com/youtube/v3';



// 獲取頻道 ID
async function getChannelId() {
  // 優先使用環境變數中的頻道 ID
  if (process.env.YOUTUBE_CHANNEL_ID) {
    console.log(`✅ 使用環境變數中的頻道 ID: ${process.env.YOUTUBE_CHANNEL_ID}`);
    return process.env.YOUTUBE_CHANNEL_ID;
  }

  // 如果沒有直接的頻道 ID，但有 handle，通過 API 獲取頻道 ID
  if (process.env.YOUTUBE_CHANNEL_HANDLE) {
    try {
      const response = await axios.get(`${BASE_URL}/channels`, {
        params: {
          part: 'id',
          forHandle: process.env.YOUTUBE_CHANNEL_HANDLE,
          key: API_KEY,
        },
      });

      if (response.data.items && response.data.items.length > 0) {
        const channelId = response.data.items[0].id;
        console.log(`✅ 通過 handle @${process.env.YOUTUBE_CHANNEL_HANDLE} 獲取到頻道 ID: ${channelId}`);
        return channelId;
      }
    } catch (error) {
      console.error('通過 handle 獲取頻道 ID 失敗:', error.message);
      throw error;
    }
  }

  // 從資料庫獲取
  try {
    const channelId = await database.getSiteSetting('youtube_channel_id');
    if (channelId) {
      return channelId;
    }
  } catch (error) {
    console.error('無法從資料庫獲取頻道 ID:', error);
  }

  throw new Error('無法獲取 YouTube 頻道 ID，請設置 YOUTUBE_CHANNEL_ID 或 YOUTUBE_CHANNEL_HANDLE 環境變數');
}

// 獲取頻道統計數據
async function getChannelStats() {
  if (!API_KEY) {
    throw new Error('YouTube API key must be configured.');
  }

  const CHANNEL_ID = await getChannelId();
  if (!CHANNEL_ID) {
    throw new Error('YouTube Channel ID must be configured.');
  }

  try {
    const response = await axios.get(`${BASE_URL}/channels`, {
      params: {
        part: 'statistics,snippet',
        id: CHANNEL_ID,
        key: API_KEY,
      },
    });

    if (response.data.items.length === 0) {
      throw new Error('Channel not found.');
    }

    const stats = response.data.items[0].statistics;
    const snippet = response.data.items[0].snippet;

    return {
      subscriberCount: stats.subscriberCount,
      viewCount: stats.viewCount,
      videoCount: stats.videoCount,
      title: snippet.title,
      description: snippet.description,
      thumbnails: snippet.thumbnails,
    };
  } catch (error) {
    console.error('Error fetching channel stats:', error.message);
    throw error;
  }
}

// 獲取頻道影片
async function getChannelVideos(maxResults = 10) {
  if (!API_KEY) {
    throw new Error('YouTube API key must be configured.');
  }

  const CHANNEL_ID = await getChannelId();
  if (!CHANNEL_ID) {
    throw new Error('YouTube Channel ID must be configured.');
  }

  try {
    const response = await axios.get(`${BASE_URL}/search`, {
      params: {
        part: 'snippet',
        channelId: CHANNEL_ID,
        order: 'date',
        type: 'video',
        maxResults,
        key: API_KEY,
      },
    });

    // 獲取影片詳細統計數據
    const videoIds = response.data.items.map(item => item.id.videoId).join(',');
    const statsResponse = await axios.get(`${BASE_URL}/videos`, {
      params: {
        part: 'statistics,contentDetails',
        id: videoIds,
        key: API_KEY,
      },
    });

    // 合併影片信息和統計數據
    return response.data.items.map((item, index) => {
      const stats = statsResponse.data.items[index]?.statistics || {};
      const contentDetails = statsResponse.data.items[index]?.contentDetails || {};

      return {
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        publishedAt: item.snippet.publishedAt,
        thumbnails: item.snippet.thumbnails,
        viewCount: parseInt(stats.viewCount) || 0,
        likeCount: parseInt(stats.likeCount) || 0,
        commentCount: parseInt(stats.commentCount) || 0,
        duration: contentDetails.duration || '',
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`
      };
    });
  } catch (error) {
    console.error('Error fetching channel videos:', error.message);
    throw error;
  }
}

// 獲取頻道的儀表板數據
async function getDashboardData() {
  if (!API_KEY) {
    throw new Error('YouTube API key must be configured.');
  }

  try {
    const [channelStats, latestVideos] = await Promise.all([
      getChannelStats(),
      getChannelVideos(5)
    ]);

    return {
      channelStats,
      latestVideos,
      totalVideos: channelStats.videoCount,
      totalViews: channelStats.viewCount,
      subscriberCount: channelStats.subscriberCount,
      channelTitle: channelStats.title
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error.message);
    throw error;
  }
}

module.exports = {
  getChannelStats,
  getChannelVideos,
  getDashboardData,
};