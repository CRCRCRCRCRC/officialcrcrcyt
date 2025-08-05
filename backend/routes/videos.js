const express = require('express');
const database = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// 獲取所有影片（公開）
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 12, featured } = req.query;
    const offset = (page - 1) * limit;

    const videos = await database.getVideos({
      featured: featured === 'true',
      limit: parseInt(limit),
      offset: offset
    });

    // 獲取總數 - 使用資料庫類方法
    let total;
    if (featured === 'true') {
      const countResult = await database.pool.query('SELECT COUNT(*) as total FROM videos WHERE is_featured = true');
      total = parseInt(countResult.rows[0].total);
    } else {
      const countResult = await database.pool.query('SELECT COUNT(*) as total FROM videos');
      total = parseInt(countResult.rows[0].total);
    }

    res.json({
      videos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('獲取影片列表錯誤:', error);
    res.status(500).json({ error: '服務器內部錯誤' });
  }
});

// 獲取單個影片
router.get('/:id', async (req, res) => {
  try {
    const video = await database.getVideoById(req.params.id);

    if (!video) {
      return res.status(404).json({ error: '影片不存在' });
    }

    res.json(video);
  } catch (error) {
    console.error('獲取影片詳情錯誤:', error);
    res.status(500).json({ error: '服務器內部錯誤' });
  }
});

// 搜索影片
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;

    const videos = await database.pool.query(
      `SELECT * FROM videos 
       WHERE title ILIKE $1 OR description ILIKE $2 OR tags ILIKE $3
       ORDER BY published_at DESC 
       LIMIT $4 OFFSET $5`,
      [`%${query}%`, `%${query}%`, `%${query}%`, parseInt(limit), offset]
    );

    const countResult = await database.pool.query(
      `SELECT COUNT(*) as total FROM videos 
       WHERE title ILIKE $1 OR description ILIKE $2 OR tags ILIKE $3`,
      [`%${query}%`, `%${query}%`, `%${query}%`]
    );
    const total = parseInt(countResult.rows[0].total);

    res.json({
      videos: videos.rows,
      query,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('搜索影片錯誤:', error);
    res.status(500).json({ error: '服務器內部錯誤' });
  }
});

// 新增影片（需要管理員權限）
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      title, description, youtube_id, thumbnail_url, duration,
      view_count = 0, published_at, is_featured = false, tags
    } = req.body;

    if (!title || !youtube_id) {
      return res.status(400).json({ error: '標題和 YouTube ID 為必填項' });
    }

    const videoId = await database.createVideo({
      title, description, youtube_id, thumbnail_url, duration,
      view_count, published_at, is_featured, tags
    });

    res.status(201).json({
      message: '影片新增成功',
      videoId
    });
  } catch (error) {
    console.error('新增影片錯誤:', error);
    if (error.message.includes('duplicate key') || error.code === '23505') {
      res.status(400).json({ error: '該 YouTube ID 已存在' });
    } else {
      res.status(500).json({ error: '服務器內部錯誤' });
    }
  }
});

// 更新影片（需要管理員權限）
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      title, description, youtube_id, thumbnail_url, duration,
      view_count, published_at, is_featured, tags
    } = req.body;

    const success = await database.updateVideo(req.params.id, {
      title, description, youtube_id, thumbnail_url, duration,
      view_count, published_at, is_featured, tags
    });

    if (!success) {
      return res.status(404).json({ error: '影片不存在' });
    }

    res.json({ message: '影片更新成功' });
  } catch (error) {
    console.error('更新影片錯誤:', error);
    if (error.message.includes('duplicate key') || error.code === '23505') {
      res.status(400).json({ error: '該 YouTube ID 已存在' });
    } else {
      res.status(500).json({ error: '服務器內部錯誤' });
    }
  }
});

// 刪除影片（需要管理員權限）
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const success = await database.deleteVideo(req.params.id);

    if (!success) {
      return res.status(404).json({ error: '影片不存在' });
    }

    res.json({ message: '影片刪除成功' });
  } catch (error) {
    console.error('刪除影片錯誤:', error);
    res.status(500).json({ error: '服務器內部錯誤' });
  }
});

module.exports = router;