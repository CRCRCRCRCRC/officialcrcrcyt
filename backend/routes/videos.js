const express = require('express');
const database = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// 獲取所有影片（公開）
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 12, featured } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM videos';
    let params = [];

    if (featured === 'true') {
      query += ' WHERE is_featured = 1';
    }

    query += ' ORDER BY published_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const videos = await database.query(query, params);

    // 獲取總數
    let countQuery = 'SELECT COUNT(*) as total FROM videos';
    if (featured === 'true') {
      countQuery += ' WHERE is_featured = 1';
    }
    const countResult = await database.query(countQuery);
    const total = countResult[0].total;

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
    const videos = await database.query(
      'SELECT * FROM videos WHERE id = ?',
      [req.params.id]
    );

    if (videos.length === 0) {
      return res.status(404).json({ error: '影片不存在' });
    }

    res.json(videos[0]);
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

    const videos = await database.query(
      `SELECT * FROM videos 
       WHERE title LIKE ? OR description LIKE ? OR tags LIKE ?
       ORDER BY published_at DESC 
       LIMIT ? OFFSET ?`,
      [`%${query}%`, `%${query}%`, `%${query}%`, parseInt(limit), offset]
    );

    const countResult = await database.query(
      `SELECT COUNT(*) as total FROM videos 
       WHERE title LIKE ? OR description LIKE ? OR tags LIKE ?`,
      [`%${query}%`, `%${query}%`, `%${query}%`]
    );
    const total = countResult[0].total;

    res.json({
      videos,
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
      title,
      description,
      youtube_id,
      thumbnail_url,
      duration,
      view_count = 0,
      published_at,
      is_featured = false,
      tags
    } = req.body;

    if (!title || !youtube_id) {
      return res.status(400).json({ error: '標題和 YouTube ID 為必填項' });
    }

    const result = await database.run(
      `INSERT INTO videos (
        title, description, youtube_id, thumbnail_url, duration,
        view_count, published_at, is_featured, tags
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title, description, youtube_id, thumbnail_url, duration,
        view_count, published_at, is_featured ? 1 : 0, tags
      ]
    );

    res.status(201).json({
      message: '影片新增成功',
      id: result.id
    });
  } catch (error) {
    console.error('新增影片錯誤:', error);
    if (error.message.includes('UNIQUE constraint failed')) {
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
      title,
      description,
      youtube_id,
      thumbnail_url,
      duration,
      view_count,
      published_at,
      is_featured,
      tags
    } = req.body;

    const result = await database.run(
      `UPDATE videos SET 
        title = ?, description = ?, youtube_id = ?, thumbnail_url = ?,
        duration = ?, view_count = ?, published_at = ?, is_featured = ?,
        tags = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        title, description, youtube_id, thumbnail_url, duration,
        view_count, published_at, is_featured ? 1 : 0, tags, req.params.id
      ]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: '影片不存在' });
    }

    res.json({ message: '影片更新成功' });
  } catch (error) {
    console.error('更新影片錯誤:', error);
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: '該 YouTube ID 已存在' });
    } else {
      res.status(500).json({ error: '服務器內部錯誤' });
    }
  }
});

// 刪除影片（需要管理員權限）
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await database.run(
      'DELETE FROM videos WHERE id = ?',
      [req.params.id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: '影片不存在' });
    }

    res.json({ message: '影片刪除成功' });
  } catch (error) {
    console.error('刪除影片錯誤:', error);
    res.status(500).json({ error: '服務器內部錯誤' });
  }
});

module.exports = router;