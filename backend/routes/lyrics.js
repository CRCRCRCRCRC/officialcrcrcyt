const express = require('express');
const router = express.Router();
const database = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// 生成 slug 的輔助函數
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

// 取得所有歌詞（可依分類篩選）包含演唱者資訊
router.get('/', async (req, res) => {
  try {
    const { category, limit } = req.query;
    let query = `
      SELECT l.*, a.name as artist_name, a.slug as artist_slug
      FROM lyrics l
      LEFT JOIN artists a ON l.artist_id = a.id
    `;
    const params = [];

    if (category && (category === 'soramimi' || category === 'lyrics')) {
      query += ' WHERE l.category = $1';
      params.push(category);
    }

    query += ' ORDER BY l.created_at DESC';

    // 如果有 limit 參數，添加限制
    if (limit && !isNaN(parseInt(limit))) {
      const paramIndex = params.length + 1;
      query += ` LIMIT $${paramIndex}`;
      params.push(parseInt(limit));
    }

    console.log('[lyrics] GET / - Query:', query);
    console.log('[lyrics] GET / - Params:', params);

    const result = await database.pool.query(query, params);
    console.log('[lyrics] GET / - Success, rows:', result.rows.length);
    res.json({ lyrics: result.rows });
  } catch (error) {
    console.error('[lyrics] GET / - 取得歌詞失敗:', error);
    console.error('[lyrics] GET / - Error details:', error.message, error.stack);
    res.status(500).json({ error: '取得歌詞失敗', details: error.message });
  }
});

// 根據分類和演唱者 slug 取得歌詞列表
router.get('/category/:category/artist/:artistSlug', async (req, res) => {
  try {
    const { category, artistSlug } = req.params;

    if (category !== 'soramimi' && category !== 'lyrics') {
      return res.status(400).json({ error: '分類必須是 soramimi 或 lyrics' });
    }

    const result = await database.pool.query(`
      SELECT l.*, a.name as artist_name, a.slug as artist_slug
      FROM lyrics l
      INNER JOIN artists a ON l.artist_id = a.id
      WHERE l.category = $1 AND a.slug = $2
      ORDER BY l.title ASC
    `, [category, artistSlug]);

    res.json({ lyrics: result.rows });
  } catch (error) {
    console.error('取得歌詞列表失敗:', error);
    res.status(500).json({ error: '取得歌詞列表失敗' });
  }
});

// 根據分類、演唱者 slug 和歌曲 slug 取得單一歌詞
router.get('/category/:category/artist/:artistSlug/song/:songSlug', async (req, res) => {
  try {
    const { category, artistSlug, songSlug } = req.params;

    if (category !== 'soramimi' && category !== 'lyrics') {
      return res.status(400).json({ error: '分類必須是 soramimi 或 lyrics' });
    }

    const result = await database.pool.query(`
      SELECT l.*, a.name as artist_name, a.slug as artist_slug
      FROM lyrics l
      INNER JOIN artists a ON l.artist_id = a.id
      WHERE l.category = $1 AND a.slug = $2 AND l.slug = $3
    `, [category, artistSlug, songSlug]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '找不到該歌詞' });
    }

    res.json({ lyric: result.rows[0] });
  } catch (error) {
    console.error('取得歌詞失敗:', error);
    res.status(500).json({ error: '取得歌詞失敗' });
  }
});

// 增加歌詞瀏覽次數
router.post('/category/:category/artist/:artistSlug/song/:songSlug/view', async (req, res) => {
  try {
    const { category, artistSlug, songSlug } = req.params;

    if (category !== 'soramimi' && category !== 'lyrics') {
      return res.status(400).json({ error: '分類必須是 soramimi 或 lyrics' });
    }

    const result = await database.pool.query(`
      UPDATE lyrics l
      SET view_count = COALESCE(view_count, 0) + 1
      FROM artists a
      WHERE l.artist_id = a.id
        AND l.category = $1
        AND a.slug = $2
        AND l.slug = $3
      RETURNING l.view_count
    `, [category, artistSlug, songSlug]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '找不到該歌詞' });
    }

    res.json({ view_count: result.rows[0].view_count });
  } catch (error) {
    console.error('增加瀏覽次數失敗:', error);
    res.status(500).json({ error: '增加瀏覽次數失敗' });
  }
});

// 按讚/取消按讚歌詞
router.post('/category/:category/artist/:artistSlug/song/:songSlug/like', async (req, res) => {
  try {
    const { category, artistSlug, songSlug } = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    const ipAddress = req.ip || req.connection.remoteAddress;

    if (category !== 'soramimi' && category !== 'lyrics') {
      return res.status(400).json({ error: '分類必須是 soramimi 或 lyrics' });
    }

    // 先取得歌詞 ID
    const lyricResult = await database.pool.query(`
      SELECT l.id
      FROM lyrics l
      INNER JOIN artists a ON l.artist_id = a.id
      WHERE l.category = $1 AND a.slug = $2 AND l.slug = $3
    `, [category, artistSlug, songSlug]);

    if (lyricResult.rows.length === 0) {
      return res.status(404).json({ error: '找不到該歌詞' });
    }

    const lyricId = lyricResult.rows[0].id;
    let userId = null;

    // 如果有 token，嘗試解析用戶 ID
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        userId = decoded.userId;
      } catch (err) {
        // Token 無效，使用 IP 地址
      }
    }

    // 檢查是否已按讚
    let checkQuery, checkParams;
    if (userId) {
      checkQuery = 'SELECT id FROM lyric_likes WHERE lyric_id = $1 AND user_id = $2';
      checkParams = [lyricId, userId];
    } else {
      checkQuery = 'SELECT id FROM lyric_likes WHERE lyric_id = $1 AND ip_address = $2';
      checkParams = [lyricId, ipAddress];
    }

    const likeCheck = await database.pool.query(checkQuery, checkParams);

    if (likeCheck.rows.length > 0) {
      // 已按讚，取消按讚
      await database.pool.query('DELETE FROM lyric_likes WHERE id = $1', [likeCheck.rows[0].id]);

      const countResult = await database.pool.query(
        'SELECT COUNT(*) as likes FROM lyric_likes WHERE lyric_id = $1',
        [lyricId]
      );

      res.json({
        success: true,
        liked: false,
        likes: parseInt(countResult.rows[0].likes)
      });
    } else {
      // 未按讚，新增按讚
      await database.pool.query(`
        INSERT INTO lyric_likes (lyric_id, user_id, ip_address, created_at)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      `, [lyricId, userId, ipAddress]);

      const countResult = await database.pool.query(
        'SELECT COUNT(*) as likes FROM lyric_likes WHERE lyric_id = $1',
        [lyricId]
      );

      res.json({
        success: true,
        liked: true,
        likes: parseInt(countResult.rows[0].likes)
      });
    }
  } catch (error) {
    console.error('按讚失敗:', error);

    // 處理重複按讚的錯誤
    if (error.code === '23505') {
      return res.status(400).json({ error: '您已經按讚過這首歌詞' });
    }

    res.status(500).json({ error: '按讚失敗' });
  }
});

// 取得歌詞按讚數和用戶是否已按讚
router.get('/category/:category/artist/:artistSlug/song/:songSlug/like-status', async (req, res) => {
  try {
    const { category, artistSlug, songSlug } = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    const ipAddress = req.ip || req.connection.remoteAddress;

    // 取得歌詞 ID
    const lyricResult = await database.pool.query(`
      SELECT l.id
      FROM lyrics l
      INNER JOIN artists a ON l.artist_id = a.id
      WHERE l.category = $1 AND a.slug = $2 AND l.slug = $3
    `, [category, artistSlug, songSlug]);

    if (lyricResult.rows.length === 0) {
      return res.status(404).json({ error: '找不到該歌詞' });
    }

    const lyricId = lyricResult.rows[0].id;
    let userId = null;

    // 如果有 token，嘗試解析用戶 ID
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        userId = decoded.userId;
      } catch (err) {
        // Token 無效
      }
    }

    // 取得總按讚數
    const countResult = await database.pool.query(
      'SELECT COUNT(*) as likes FROM lyric_likes WHERE lyric_id = $1',
      [lyricId]
    );

    // 檢查用戶是否已按讚
    let liked = false;
    if (userId) {
      const likeCheck = await database.pool.query(
        'SELECT id FROM lyric_likes WHERE lyric_id = $1 AND user_id = $2',
        [lyricId, userId]
      );
      liked = likeCheck.rows.length > 0;
    } else {
      const likeCheck = await database.pool.query(
        'SELECT id FROM lyric_likes WHERE lyric_id = $1 AND ip_address = $2',
        [lyricId, ipAddress]
      );
      liked = likeCheck.rows.length > 0;
    }

    res.json({
      likes: parseInt(countResult.rows[0].likes),
      liked
    });
  } catch (error) {
    console.error('取得按讚狀態失敗:', error);
    res.status(500).json({ error: '取得按讚狀態失敗' });
  }
});

// 取得單一歌詞 (by ID, for admin)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await database.pool.query(
      `SELECT l.*, a.name as artist_name, a.slug as artist_slug
       FROM lyrics l
       LEFT JOIN artists a ON l.artist_id = a.id
       WHERE l.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '找不到該歌詞' });
    }

    res.json({ lyric: result.rows[0] });
  } catch (error) {
    console.error('取得歌詞失敗:', error);
    res.status(500).json({ error: '取得歌詞失敗' });
  }
});

// 新增歌詞（管理員）
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { category, title, artist_id, lyrics, youtube_url } = req.body;

    console.log('[lyrics] POST / - Request body:', { category, title, artist_id, youtube_url });

    // 驗證必填欄位
    if (!category || !title || !artist_id || !lyrics) {
      console.log('[lyrics] POST / - 缺少必填欄位');
      return res.status(400).json({ error: '請填寫所有必填欄位' });
    }

    // 驗證分類
    if (category !== 'soramimi' && category !== 'lyrics') {
      console.log('[lyrics] POST / - 分類無效:', category);
      return res.status(400).json({ error: '分類必須是 soramimi 或 lyrics' });
    }

    // 驗證演唱者是否存在
    console.log('[lyrics] POST / - 檢查演唱者:', artist_id);
    const artistCheck = await database.pool.query(
      'SELECT id FROM artists WHERE id = $1',
      [artist_id]
    );

    if (artistCheck.rows.length === 0) {
      console.log('[lyrics] POST / - 找不到演唱者:', artist_id);
      return res.status(400).json({ error: '找不到該演唱者' });
    }

    const slug = generateSlug(title);

    console.log('[lyrics] POST / - 插入歌詞...');
    const result = await database.pool.query(
      `INSERT INTO lyrics (category, title, slug, artist_id, lyrics, youtube_url, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [category, title, slug, artist_id, lyrics, youtube_url || null]
    );

    console.log('[lyrics] POST / - 歌詞已插入, id:', result.rows[0].id);

    // 取得包含演唱者名稱的完整資料
    const fullResult = await database.pool.query(
      `SELECT l.*, a.name as artist_name, a.slug as artist_slug
       FROM lyrics l
       LEFT JOIN artists a ON l.artist_id = a.id
       WHERE l.id = $1`,
      [result.rows[0].id]
    );

    console.log('[lyrics] POST / - 成功, 返回完整資料');
    res.status(201).json({
      success: true,
      message: '歌詞已新增',
      lyric: fullResult.rows[0]
    });
  } catch (error) {
    console.error('[lyrics] POST / - 新增歌詞失敗:', error);
    console.error('[lyrics] POST / - Error details:', error.message, error.stack);
    res.status(500).json({ error: '新增歌詞失敗', details: error.message });
  }
});

// 更新歌詞（管理員）
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { category, title, artist_id, lyrics, youtube_url } = req.body;

    // 驗證必填欄位
    if (!category || !title || !artist_id || !lyrics) {
      return res.status(400).json({ error: '請填寫所有必填欄位' });
    }

    // 驗證分類
    if (category !== 'soramimi' && category !== 'lyrics') {
      return res.status(400).json({ error: '分類必須是 soramimi 或 lyrics' });
    }

    // 檢查歌詞是否存在
    const checkResult = await database.pool.query(
      'SELECT * FROM lyrics WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: '找不到該歌詞' });
    }

    // 驗證演唱者是否存在
    const artistCheck = await database.pool.query(
      'SELECT id FROM artists WHERE id = $1',
      [artist_id]
    );

    if (artistCheck.rows.length === 0) {
      return res.status(400).json({ error: '找不到該演唱者' });
    }

    const slug = generateSlug(title);

    await database.pool.query(
      `UPDATE lyrics
       SET category = $1, title = $2, slug = $3, artist_id = $4, lyrics = $5, youtube_url = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7`,
      [category, title, slug, artist_id, lyrics, youtube_url || null, id]
    );

    // 取得包含演唱者名稱的完整資料
    const fullResult = await database.pool.query(
      `SELECT l.*, a.name as artist_name, a.slug as artist_slug
       FROM lyrics l
       LEFT JOIN artists a ON l.artist_id = a.id
       WHERE l.id = $1`,
      [id]
    );

    res.json({
      success: true,
      message: '歌詞已更新',
      lyric: fullResult.rows[0]
    });
  } catch (error) {
    console.error('更新歌詞失敗:', error);
    res.status(500).json({ error: '更新歌詞失敗' });
  }
});

// 刪除歌詞（管理員）
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // 檢查歌詞是否存在
    const checkResult = await database.pool.query(
      'SELECT * FROM lyrics WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: '找不到該歌詞' });
    }

    await database.pool.query('DELETE FROM lyrics WHERE id = $1', [id]);

    res.json({
      success: true,
      message: '歌詞已刪除'
    });
  } catch (error) {
    console.error('刪除歌詞失敗:', error);
    res.status(500).json({ error: '刪除歌詞失敗' });
  }
});

module.exports = router;
