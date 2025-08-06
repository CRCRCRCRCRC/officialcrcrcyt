const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const youtubeService = require('../services/youtube');

// 簡單的記憶體存儲（生產環境應該使用資料庫）
let featuredVideoId = null;
let thumbnailQuality = 'maxres'; // 預設最高解析度

// 獲取網站設定
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // 獲取 YouTube 影片列表用於熱門影片選擇
    const videos = await youtubeService.getChannelVideos(50); // 獲取更多影片供選擇
    
    // 獲取當前熱門影片設定
    
    const settings = {
      featuredVideoId,
      thumbnailQuality,
      availableVideos: videos.map(video => ({
        id: video.id,
        title: video.title,
        thumbnail: video.thumbnails?.medium?.url || video.thumbnails?.default?.url,
        viewCount: video.viewCount,
        publishedAt: video.publishedAt,
        thumbnails: video.thumbnails // 包含所有解析度的縮圖
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
    const { videoId, thumbnailQuality: newThumbnailQuality } = req.body;

    if (!videoId) {
      return res.status(400).json({ error: '請選擇一個影片' });
    }

    // 保存設定到記憶體（生產環境應該使用資料庫）
    featuredVideoId = videoId;
    if (newThumbnailQuality) {
      thumbnailQuality = newThumbnailQuality;
    }
    console.log('熱門影片設定已更新:', { videoId, thumbnailQuality });

    res.json({
      success: true,
      message: '熱門影片設定已更新',
      featuredVideoId: videoId,
      thumbnailQuality
    });
  } catch (error) {
    console.error('更新熱門影片設定失敗:', error);
    res.status(500).json({ error: '無法更新設定' });
  }
});

// 獲取設定的熱門影片（公開 API）
router.get('/featured-video', async (req, res) => {
  try {
    if (!featuredVideoId) {
      return res.json({ featuredVideo: null });
    }

    // 從 YouTube API 獲取該影片的詳細信息
    const videos = await youtubeService.getChannelVideos(50);
    const featuredVideo = videos.find(video => video.id === featuredVideoId);

    if (!featuredVideo) {
      return res.json({ featuredVideo: null });
    }

    res.json({
      featuredVideo,
      thumbnailQuality
    });
  } catch (error) {
    console.error('獲取熱門影片失敗:', error);
    res.status(500).json({ error: '無法獲取熱門影片' });
  }
});

module.exports = router;
