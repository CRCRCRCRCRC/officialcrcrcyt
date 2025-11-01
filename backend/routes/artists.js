const express = require('express');
const router = express.Router();
const database = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// 生成 slug 的輔助函數
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

// 取得所有演唱者
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM artists';
    const params = [];

    // 如果指定分類,只返回該分類下有歌詞的演唱者
    if (category && (category === 'soramimi' || category === 'lyrics')) {
      query = `
        SELECT DISTINCT a.*
        FROM artists a
        INNER JOIN lyrics l ON a.id = l.artist_id
        WHERE l.category = $1
        ORDER BY a.name ASC
      `;
      params.push(category);
    } else {
      query += ' ORDER BY name ASC';
    }

    const result = await database.pool.query(query, params);
    res.json({ artists: result.rows });
  } catch (error) {
    console.error('取得演唱者失敗:', error);
    res.status(500).json({ error: '取得演唱者失敗' });
  }
});

// 取得單一演唱者
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await database.pool.query(
      'SELECT * FROM artists WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '找不到該演唱者' });
    }

    res.json({ artist: result.rows[0] });
  } catch (error) {
    console.error('取得演唱者失敗:', error);
    res.status(500).json({ error: '取得演唱者失敗' });
  }
});

// 新增演唱者（管理員）
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: '請輸入演唱者名稱' });
    }

    const slug = generateSlug(name);

    const result = await database.pool.query(
      `INSERT INTO artists (name, slug, created_at, updated_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [name.trim(), slug]
    );

    res.status(201).json({
      success: true,
      message: '演唱者已新增',
      artist: result.rows[0]
    });
  } catch (error) {
    console.error('新增演唱者失敗:', error);
    res.status(500).json({ error: '新增演唱者失敗' });
  }
});

// 更新演唱者（管理員）
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: '請輸入演唱者名稱' });
    }

    // 檢查演唱者是否存在
    const checkResult = await database.pool.query(
      'SELECT * FROM artists WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: '找不到該演唱者' });
    }

    const result = await database.pool.query(
      `UPDATE artists
       SET name = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [name.trim(), id]
    );

    res.json({
      success: true,
      message: '演唱者已更新',
      artist: result.rows[0]
    });
  } catch (error) {
    console.error('更新演唱者失敗:', error);
    res.status(500).json({ error: '更新演唱者失敗' });
  }
});

// 刪除演唱者（管理員）
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // 檢查演唱者是否存在
    const checkResult = await database.pool.query(
      'SELECT * FROM artists WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: '找不到該演唱者' });
    }

    // 檢查是否有歌詞使用此演唱者
    const lyricsResult = await database.pool.query(
      'SELECT COUNT(*) as count FROM lyrics WHERE artist_id = $1',
      [id]
    );

    if (parseInt(lyricsResult.rows[0].count) > 0) {
      return res.status(400).json({
        error: '此演唱者仍有歌詞使用中，無法刪除'
      });
    }

    await database.pool.query('DELETE FROM artists WHERE id = $1', [id]);

    res.json({
      success: true,
      message: '演唱者已刪除'
    });
  } catch (error) {
    console.error('刪除演唱者失敗:', error);
    res.status(500).json({ error: '刪除演唱者失敗' });
  }
});

module.exports = router;
