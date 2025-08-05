const axios = require('axios');

const API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

// 獲取頻道統計數據
async function getChannelStats() {
  if (!API_KEY || !CHANNEL_ID) {
    throw new Error('YouTube API key and Channel ID must be configured.');
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
  if (!API_KEY || !CHANNEL_ID) {
    throw new Error('YouTube API key and Channel ID must be configured.');
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

    return response.data.items.map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      publishedAt: item.snippet.publishedAt,
      thumbnails: item.snippet.thumbnails,
    }));
  } catch (error) {
    console.error('Error fetching channel videos:', error.message);
    throw error;
  }
}

module.exports = {
  getChannelStats,
  getChannelVideos,
};