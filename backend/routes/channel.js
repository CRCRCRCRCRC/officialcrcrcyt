const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const database = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const youtubeService = require('../services/youtube');

// 設置 multer 用於文件上傳
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB 限制
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只允許上傳圖片文件'));
    }
  }
});

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
      description: channelInfo.description || '創作空耳與荒野亂鬥內容的頻道，歡迎訂閱！',
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

// 上傳圖片（需要管理員權限）
router.post('/upload-image', authenticateToken, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '沒有上傳文件' });
    }

    const { type } = req.body; // 'avatar' 或 'banner'
    const imageUrl = `/uploads/${req.file.filename}`;

    // 更新資料庫中的圖片 URL
    if (type === 'avatar') {
      await database.setSiteSetting('avatar_image', imageUrl);
    } else if (type === 'banner') {
      await database.setSiteSetting('banner_image', imageUrl);
    }

    res.json({
      message: '圖片上傳成功',
      url: imageUrl
    });
  } catch (error) {
    console.error('圖片上傳錯誤:', error);
    res.status(500).json({ error: '服務器內部錯誤' });
  }
});

// 獲取 YouTube 頻道數據（需要管理員權限）
router.get('/youtube-data', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await youtubeService.getChannelStats();
    res.json(stats);
  } catch (error) {
    console.error('獲取 YouTube 數據錯誤:', error);
    res.status(500).json({ error: '無法獲取 YouTube 數據: ' + error.message });
  }
});

// 手動更新頻道數據（需要管理員權限）
router.post('/update-stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { subscriber_count, total_views } = req.body;

    if (subscriber_count === undefined || total_views === undefined) {
      return res.status(400).json({ error: '請提供 subscriber_count 和 total_views' });
    }

    // 更新資料庫中的頻道資訊
    await database.updateChannelInfo({
      subscriber_count: parseInt(subscriber_count),
      total_views: parseInt(total_views)
    });

    res.json({ 
      message: '頻道數據更新成功',
      subscriber_count: parseInt(subscriber_count),
      total_views: parseInt(total_views)
    });
  } catch (error) {
    console.error('更新頻道數據錯誤:', error);
    res.status(500).json({ error: '服務器內部錯誤' });
  }
});

// 獲取儀表板數據（需要管理員權限）
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const dashboardData = await youtubeService.getDashboardData();
    res.json(dashboardData);
  } catch (error) {
    console.error('獲取儀表板數據錯誤:', error);
    res.status(500).json({ error: '無法獲取儀表板數據: ' + error.message });
  }
});

// 獲取公開的頻道數據（首頁使用，無需登入）
router.get('/public-data', async (req, res) => {
  try {
    console.log('🔍 開始獲取公開頻道數據...');
    console.log('API_KEY 存在:', !!process.env.YOUTUBE_API_KEY);
    console.log('CHANNEL_ID:', process.env.YOUTUBE_CHANNEL_ID);

    // 檢查是否設置了 YouTube API 金鑰和頻道 ID
    if (process.env.YOUTUBE_API_KEY && process.env.YOUTUBE_CHANNEL_ID) {
      try {
        const dashboardData = await youtubeService.getDashboardData();
        console.log('✅ 公開頻道數據獲取成功');
        res.json(dashboardData);
        return;
      } catch (youtubeError) {
        console.warn('YouTube API 不可用，使用資料庫數據:', youtubeError.message);
      }
    } else {
      console.log('ℹ️ 未設置 YouTube API 金鑰或頻道 ID，使用資料庫數據');
    }

    // 回退到資料庫數據
    const channelInfo = await database.getChannelInfo();
    const dbStats = await database.getStats();
    const featuredVideos = await database.getVideos({ featured: true, limit: 5 });

    // 獲取頻道統計數據
    const channelStats = await youtubeService.getChannelStats();

    const dashboardData = {
      channelStats,
      latestVideos: featuredVideos.map(video => ({
        id: video.youtube_id || video.id,
        title: video.title,
        description: video.description,
        publishedAt: video.published_at,
        thumbnails: {
          default: { url: video.thumbnail_url },
          medium: { url: video.thumbnail_url },
          high: { url: video.thumbnail_url }
        },
        viewCount: video.view_count || 0,
        likeCount: 0,
        commentCount: 0,
        duration: video.duration || '',
        url: `https://www.youtube.com/watch?v=${video.youtube_id || video.id}`
      })),
      totalVideos: channelStats.videoCount,
      totalViews: channelStats.viewCount,
      subscriberCount: channelStats.subscriberCount,
      videoCount: channelStats.videoCount,
      channelTitle: channelStats.title,
      channelDescription: channelStats.description,
      channelThumbnails: channelStats.thumbnails,
      customUrl: channelStats.customUrl,
      publishedAt: channelStats.publishedAt,
      country: channelStats.country
    };

    console.log('✅ 使用資料庫數據獲取成功');
    res.json(dashboardData);
  } catch (error) {
    console.error('❌ 獲取公開頻道數據錯誤:', error.message);
    console.error('錯誤堆疊:', error.stack);
    res.status(500).json({
      error: '無法獲取頻道數據',
      message: error.message,
      details: error.response?.data || null
    });
  }
});

module.exports = router;