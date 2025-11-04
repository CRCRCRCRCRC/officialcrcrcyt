const express = require('express');
const router = express.Router();
const database = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// 取得指定歌詞的所有評論
router.get('/lyrics/:lyricId/comments', async (req, res) => {
  try {
    const { lyricId } = req.params;

    const result = await database.pool.query(`
      SELECT
        c.*,
        u.username as user_username,
        (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id) as likes
      FROM lyric_comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.lyric_id = $1
      ORDER BY c.created_at DESC
    `, [lyricId]);

    res.json({ comments: result.rows });
  } catch (error) {
    console.error('取得評論失敗:', error);
    res.status(500).json({ error: '取得評論失敗' });
  }
});

// 新增評論（自動使用登入用戶名稱，或允許訪客留言）
router.post('/lyrics/:lyricId/comments', async (req, res) => {
  try {
    const { lyricId } = req.params;
    let { content, username } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    if (!content || !content.trim()) {
      return res.status(400).json({ error: '評論內容不能為空' });
    }

    // 驗證歌詞是否存在
    const lyricCheck = await database.pool.query(
      'SELECT id FROM lyrics WHERE id = $1',
      [lyricId]
    );

    if (lyricCheck.rows.length === 0) {
      return res.status(404).json({ error: '找不到該歌詞' });
    }

    let userId = null;
    let finalUsername = username;

    // 如果有 token，嘗試解析用戶 ID 並使用用戶名稱
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        userId = decoded.userId;

        // 從資料庫取得用戶名稱
        const userResult = await database.pool.query(
          'SELECT username FROM users WHERE id = $1',
          [userId]
        );

        if (userResult.rows.length > 0) {
          finalUsername = userResult.rows[0].username;
        }
      } catch (err) {
        // Token 無效，以訪客身份新增
      }
    }

    // 如果沒有登入且沒有提供暱稱
    if (!userId && (!finalUsername || !finalUsername.trim())) {
      return res.status(400).json({ error: '請輸入暱稱或登入' });
    }

    const result = await database.pool.query(`
      INSERT INTO lyric_comments (lyric_id, user_id, username, content, created_at, updated_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `, [lyricId, userId, finalUsername.trim(), content.trim()]);

    res.status(201).json({
      success: true,
      message: '評論已新增',
      comment: result.rows[0]
    });
  } catch (error) {
    console.error('新增評論失敗:', error);
    res.status(500).json({ error: '新增評論失敗' });
  }
});

// 按讚/取消按讚評論
router.post('/comments/:commentId/like', async (req, res) => {
  try {
    const { commentId } = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    const ipAddress = req.ip || req.connection.remoteAddress;

    // 驗證評論是否存在
    const commentCheck = await database.pool.query(
      'SELECT id FROM lyric_comments WHERE id = $1',
      [commentId]
    );

    if (commentCheck.rows.length === 0) {
      return res.status(404).json({ error: '找不到該評論' });
    }

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
      checkQuery = 'SELECT id FROM comment_likes WHERE comment_id = $1 AND user_id = $2';
      checkParams = [commentId, userId];
    } else {
      checkQuery = 'SELECT id FROM comment_likes WHERE comment_id = $1 AND ip_address = $2';
      checkParams = [commentId, ipAddress];
    }

    const likeCheck = await database.pool.query(checkQuery, checkParams);

    if (likeCheck.rows.length > 0) {
      // 已按讚，取消按讚
      await database.pool.query(
        'DELETE FROM comment_likes WHERE id = $1',
        [likeCheck.rows[0].id]
      );

      const countResult = await database.pool.query(
        'SELECT COUNT(*) as likes FROM comment_likes WHERE comment_id = $1',
        [commentId]
      );

      res.json({
        success: true,
        liked: false,
        likes: parseInt(countResult.rows[0].likes)
      });
    } else {
      // 未按讚，新增按讚
      await database.pool.query(`
        INSERT INTO comment_likes (comment_id, user_id, ip_address, created_at)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      `, [commentId, userId, ipAddress]);

      const countResult = await database.pool.query(
        'SELECT COUNT(*) as likes FROM comment_likes WHERE comment_id = $1',
        [commentId]
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
      return res.status(400).json({ error: '您已經按讚過這則評論' });
    }

    res.status(500).json({ error: '按讚失敗' });
  }
});

// 刪除評論（僅限評論作者或管理員）
router.delete('/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.userId;
    const isAdmin = req.user.role === 'admin';

    // 檢查評論是否存在
    const commentCheck = await database.pool.query(
      'SELECT * FROM lyric_comments WHERE id = $1',
      [commentId]
    );

    if (commentCheck.rows.length === 0) {
      return res.status(404).json({ error: '找不到該評論' });
    }

    const comment = commentCheck.rows[0];

    // 驗證權限：評論作者或管理員
    if (comment.user_id !== userId && !isAdmin) {
      return res.status(403).json({ error: '無權限刪除此評論' });
    }

    await database.pool.query('DELETE FROM lyric_comments WHERE id = $1', [commentId]);

    res.json({
      success: true,
      message: '評論已刪除'
    });
  } catch (error) {
    console.error('刪除評論失敗:', error);
    res.status(500).json({ error: '刪除評論失敗' });
  }
});

module.exports = router;
