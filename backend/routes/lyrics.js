const express = require('express');
const router = express.Router();
const database = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// 取得所有歌詞（可依分類篩選）包含演唱者資訊
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let query = `
      SELECT l.*, a.name as artist_name
      FROM lyrics l
      LEFT JOIN artists a ON l.artist_id = a.id
    `;
    const params = [];

    if (category && (category === 'soramimi' || category === 'lyrics')) {
      query += ' WHERE l.category = $1';
      params.push(category);
    }

    query += ' ORDER BY l.created_at DESC';

    const result = await database.pool.query(query, params);
    res.json({ lyrics: result.rows });
  } catch (error) {
    console.error('取得歌詞失敗:', error);
    res.status(500).json({ error: '取得歌詞失敗' });
  }
});

// 取得單一歌詞
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await database.pool.query(
      `SELECT l.*, a.name as artist_name
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

    // 驗證必填欄位
    if (!category || !title || !artist_id || !lyrics) {
      return res.status(400).json({ error: '請填寫所有必填欄位' });
    }

    // 驗證分類
    if (category !== 'soramimi' && category !== 'lyrics') {
      return res.status(400).json({ error: '分類必須是 soramimi 或 lyrics' });
    }

    // 驗證演唱者是否存在
    const artistCheck = await database.pool.query(
      'SELECT id FROM artists WHERE id = $1',
      [artist_id]
    );

    if (artistCheck.rows.length === 0) {
      return res.status(400).json({ error: '找不到該演唱者' });
    }

    const result = await database.pool.query(
      `INSERT INTO lyrics (category, title, artist_id, lyrics, youtube_url, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [category, title, artist_id, lyrics, youtube_url || null]
    );

    // 取得包含演唱者名稱的完整資料
    const fullResult = await database.pool.query(
      `SELECT l.*, a.name as artist_name
       FROM lyrics l
       LEFT JOIN artists a ON l.artist_id = a.id
       WHERE l.id = $1`,
      [result.rows[0].id]
    );

    res.status(201).json({
      success: true,
      message: '歌詞已新增',
      lyric: fullResult.rows[0]
    });
  } catch (error) {
    console.error('新增歌詞失敗:', error);
    res.status(500).json({ error: '新增歌詞失敗' });
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

    await database.pool.query(
      `UPDATE lyrics
       SET category = $1, title = $2, artist_id = $3, lyrics = $4, youtube_url = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6`,
      [category, title, artist_id, lyrics, youtube_url || null, id]
    );

    // 取得包含演唱者名稱的完整資料
    const fullResult = await database.pool.query(
      `SELECT l.*, a.name as artist_name
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
