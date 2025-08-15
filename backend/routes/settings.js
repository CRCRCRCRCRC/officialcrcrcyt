const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const youtubeService = require('../services/youtube');

// 使用環境變數進行持久化存儲
// 注意：在 Vercel 中，需要在環境變數設定中配置 FEATURED_VIDEO_ID 和 THUMBNAIL_QUALITY
const getFeaturedVideoId = () => process.env.FEATURED_VIDEO_ID || null;
const getThumbnailQuality = () => process.env.THUMBNAIL_QUALITY || 'maxres';

// 記憶體存儲作為運行時緩存
let runtimeFeaturedVideoId = null;
let runtimeThumbnailQuality = null;

const setFeaturedVideoId = (videoId) => {
  runtimeFeaturedVideoId = videoId;
  console.log('設定熱門影片 ID (運行時):', videoId);
  console.log('提示：要持久化此設定，請在 Vercel 環境變數中設置 FEATURED_VIDEO_ID =', videoId);
};

const setThumbnailQuality = (quality) => {
  runtimeThumbnailQuality = quality;
  console.log('設定縮圖品質 (運行時):', quality);
  console.log('提示：要持久化此設定，請在 Vercel 環境變數中設置 THUMBNAIL_QUALITY =', quality);
};

const getCurrentFeaturedVideoId = () => {
  return runtimeFeaturedVideoId || getFeaturedVideoId();
};

const getCurrentThumbnailQuality = () => {
  return runtimeThumbnailQuality || getThumbnailQuality();
};

// 獲取網站設定
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // 獲取 YouTube 影片列表用於熱門影片選擇
    const videos = await youtubeService.getChannelVideos(50); // 獲取更多影片供選擇
    
    // 獲取當前熱門影片設定
    const featuredVideoId = getCurrentFeaturedVideoId();
    const thumbnailQuality = getCurrentThumbnailQuality();

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

    // 保存設定到運行時記憶體
    setFeaturedVideoId(videoId);
    if (newThumbnailQuality) {
      setThumbnailQuality(newThumbnailQuality);
    }

    const currentThumbnailQuality = getCurrentThumbnailQuality();
    console.log('熱門影片設定已更新:', { videoId, thumbnailQuality: currentThumbnailQuality });

    res.json({
      success: true,
      message: '熱門影片設定已更新',
      featuredVideoId: videoId,
      thumbnailQuality: currentThumbnailQuality
    });
  } catch (error) {
    console.error('更新熱門影片設定失敗:', error);
    res.status(500).json({ error: '無法更新設定' });
  }
});

// 獲取設定的熱門影片（公開 API）
router.get('/featured-video', async (req, res) => {
  try {
    const featuredVideoId = getCurrentFeaturedVideoId();
    const thumbnailQuality = getCurrentThumbnailQuality();

    if (!featuredVideoId) {
      return res.json({
        featuredVideo: null,
        thumbnailQuality
      });
    }

    // 從 YouTube API 獲取該影片的詳細信息
    const videos = await youtubeService.getChannelVideos(50);
    const featuredVideo = videos.find(video => video.id === featuredVideoId);

    if (!featuredVideo) {
      return res.json({
        featuredVideo: null,
        thumbnailQuality
      });
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
