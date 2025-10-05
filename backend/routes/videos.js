const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const database = require('../config/database');

// 獲取所有影片（公開）
router.get('/', async (req, res) => {
  try {
    const { limit, offset, featured } = req.query;
    
    const options = {};
    if (limit) options.limit = parseInt(limit);
    if (offset) options.offset = parseInt(offset);
    if (featured === 'true') options.featured = true;
    
    const videos = await database.getVideos(options);
    
    res.json(videos);
  } catch (error) {
    console.error('獲取影片列表錯誤:', error);
    res.status(500).json({ error: '無法獲取影片列表' });
  }
});

// 獲取精選影片（公開）
router.get('/featured', async (req, res) => {
  try {
    const { limit } = req.query;
    
    const options = {
      featured: true
    };
    
    if (limit) options.limit = parseInt(limit);
    
    const videos = await database.getVideos(options);
    
    res.json(videos);
  } catch (error) {
    console.error('獲取精選影片錯誤:', error);
    res.status(500).json({ error: '無法獲取精選影片' });
  }
});

// 獲取單個影片（公開）
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 首先嘗試按 ID 查找
    let video = await database.getVideoById(id);
    
    // 如果沒有找到，嘗試按 YouTube ID 查找
    if (!video) {
      const videos = await database.getVideos({});
      video = videos.find(v => v.youtube_id === id);
    }
    
    if (!video) {
      return res.status(404).json({ error: '影片不存在' });
    }
    
    res.json(video);
  } catch (error) {
    console.error('獲取影片錯誤:', error);
    res.status(500).json({ error: '無法獲取影片' });
  }
});

// 創建影片（需要管理員權限）
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const videoData = req.body;
    
    // 驗證必要字段
    if (!videoData.title || !videoData.youtube_id) {
      return res.status(400).json({ error: '標題和 YouTube ID 為必填項' });
    }
    
    const videoId = await database.createVideo(videoData);
    const video = await database.getVideoById(videoId);
    
    res.status(201).json(video);
  } catch (error) {
    console.error('創建影片錯誤:', error);
    res.status(500).json({ error: '無法創建影片' });
  }
});

// 更新影片（需要管理員權限）
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const videoData = req.body;
    
    // 檢查影片是否存在
    const existingVideo = await database.getVideoById(id);
    if (!existingVideo) {
      return res.status(404).json({ error: '影片不存在' });
    }
    
    await database.updateVideo(id, videoData);
    const updatedVideo = await database.getVideoById(id);
    
    res.json(updatedVideo);
  } catch (error) {
    console.error('更新影片錯誤:', error);
    res.status(500).json({ error: '無法更新影片' });
  }
});

// 刪除影片（需要管理員權限）
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 檢查影片是否存在
    const existingVideo = await database.getVideoById(id);
    if (!existingVideo) {
      return res.status(404).json({ error: '影片不存在' });
    }
    
    await database.deleteVideo(id);
    
    res.json({ message: '影片已刪除' });
  } catch (error) {
    console.error('刪除影片錯誤:', error);
    res.status(500).json({ error: '無法刪除影片' });
  }
});

module.exports = router;