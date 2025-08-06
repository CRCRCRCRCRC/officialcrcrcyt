const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const youtubeService = require('../services/youtube');

// 獲取網站設定
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // 獲取 YouTube 影片列表用於熱門影片選擇
    const videos = await youtubeService.getChannelVideos(50); // 獲取更多影片供選擇
    
    // 獲取當前熱門影片設定（從環境變數或資料庫）
    const featuredVideoId = process.env.FEATURED_VIDEO_ID || null;
    
    const settings = {
      featuredVideoId,
      availableVideos: videos.map(video => ({
        id: video.id,
        title: video.title,
        thumbnail: video.thumbnails?.medium?.url || video.thumbnails?.default?.url,
        viewCount: video.viewCount,
        publishedAt: video.publishedAt
      }))
    };
    
    res.json(settings);
  } catch (error) {
    console.error('獲取設定失敗:', error);
    res.status(500).json({ error: '無法獲取設定' });
  }
});

// 更新熱門影片設定
router.post('/featured-video', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { videoId } = req.body;
    
    if (!videoId) {
      return res.status(400).json({ error: '請選擇一個影片' });
    }
    
    // 這裡應該將設定保存到資料庫
    // 暫時返回成功響應
    res.json({ 
      success: true, 
      message: '熱門影片設定已更新',
      featuredVideoId: videoId 
    });
  } catch (error) {
    console.error('更新熱門影片設定失敗:', error);
    res.status(500).json({ error: '無法更新設定' });
  }
});

module.exports = router;
