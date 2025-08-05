const express = require('express');
const database = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const youtubeService = require('../services/youtube');

const router = express.Router();

// 獲取頻道資訊（公開）
router.get('/info', async (req, res) => {
  try {
    // 嘗試從 YouTube API 獲取數據
    try {
      const stats = await youtubeService.getChannelStats();
      res.json(stats);
      return;
    } catch (youtubeError) {
      console.warn('YouTube API 不可用，使用資料庫數據:', youtubeError.message);
    }

    // 回退到資料庫數據
    const channelInfo = await database.getChannelInfo();
    res.json({
      subscriberCount: channelInfo.subscriber_count || 0,
      viewCount: channelInfo.total_views || 0,
      videoCount: 0,
      title: channelInfo.channel_name || 'CRCRC',
      description: channelInfo.description || '專業製作空耳音樂影片的 YouTube 頻道',
      thumbnails: {}
    });
  } catch (error) {
    console.error('獲取頻道資訊錯誤:', error);
    res.status(500).json({ error: '服務器內部錯誤' });
  }
});

// 獲取網站統計數據（公開）
router.get('/stats', async (req, res) => {
  try {
    // 嘗試從 YouTube API 獲取數據
    try {
      const stats = await youtubeService.getChannelStats();
      const videos = await youtubeService.getChannelVideos(3);

      res.json({
        videoCount: stats.videoCount,
        totalViews: stats.viewCount,
        subscriberCount: stats.subscriberCount,
        latestVideos: videos,
      });
      return;
    } catch (youtubeError) {
      console.warn('YouTube API 不可用，使用資料庫數據:', youtubeError.message);
    }

    // 回退到資料庫數據
    const dbStats = await database.getStats();
    const featuredVideos = await database.getVideos({ featured: true, limit: 3 });

    res.json({
      videoCount: dbStats.total_videos,
      totalViews: dbStats.total_views,
      subscriberCount: dbStats.subscriber_count,
      latestVideos: featuredVideos.map(video => ({
        id: video.youtube_id,
        title: video.title,
        description: video.description,
        publishedAt: video.published_at,
        thumbnails: { default: { url: video.thumbnail_url } }
      }))
    });
  } catch (error) {
    console.error('獲取統計數據錯誤:', error);
    res.status(500).json({ error: '服務器內部錯誤' });
  }
});

// 更新頻道資訊（需要管理員權限）
router.put('/info', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      channel_name,
      description,
      subscriber_count,
      total_views,
      youtube_url,
      discord_url,
      minecraft_discord_url,
      banner_image,
      avatar_image
    } = req.body;

    // 使用 PostgreSQL 語法更新頻道資訊
    await database.updateChannelInfo({
      channel_name, description, subscriber_count, total_views,
      youtube_url, discord_url, minecraft_discord_url, banner_image, avatar_image
    });

    res.json({ message: '頻道資訊更新成功' });
  } catch (error) {
    console.error('更新頻道資訊錯誤:', error);
    res.status(500).json({ error: '服務器內部錯誤' });
  }
});

// 獲取網站設置（需要管理員權限）
router.get('/settings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const settingsObj = await database.getAllSiteSettings();

    res.json(settingsObj);
  } catch (error) {
    console.error('獲取網站設置錯誤:', error);
    res.status(500).json({ error: '服務器內部錯誤' });
  }
});

// 更新網站設置（需要管理員權限）
router.put('/settings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const settings = req.body;

    for (const [key, value] of Object.entries(settings)) {
      await database.setSiteSetting(key, value);
    }

    res.json({ message: '網站設置更新成功' });
  } catch (error) {
    console.error('更新網站設置錯誤:', error);
    res.status(500).json({ error: '服務器內部錯誤' });
  }
});

module.exports = router;