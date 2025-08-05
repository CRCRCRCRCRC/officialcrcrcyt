const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const database = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 登入
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '用戶名和密碼為必填項' });
    }

    // 固定的管理員憑證
    const ADMIN_USERNAME = 'CRCRC';
    const ADMIN_PASSWORD = 'admin';

    // 驗證固定憑證
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: '用戶名或密碼錯誤' });
    }

    // 生成 JWT token
    const token = jwt.sign(
      { userId: 1, username: ADMIN_USERNAME, role: 'admin' },
      process.env.JWT_SECRET || 'default-jwt-secret',
      { expiresIn: '24h' }
    );

    res.json({
      message: '登入成功',
      token,
      user: {
        id: 1,
        username: ADMIN_USERNAME,
        role: 'admin'
      }
    });
  } catch (error) {
    console.error('登入錯誤:', error);
    res.status(500).json({ error: '服務器內部錯誤' });
  }
});

// 驗證 token
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    valid: true,
    user: req.user
  });
});

// 修改密碼
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: '當前密碼和新密碼為必填項' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: '新密碼長度至少為 6 位' });
    }

    // 獲取當前用戶
    const users = await database.query(
      'SELECT * FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: '用戶不存在' });
    }

    const user = users[0];

    // 驗證當前密碼
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: '當前密碼錯誤' });
    }

    // 加密新密碼
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // 更新密碼
    await database.run(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedNewPassword, req.user.id]
    );

    res.json({ message: '密碼修改成功' });
  } catch (error) {
    console.error('修改密碼錯誤:', error);
    res.status(500).json({ error: '服務器內部錯誤' });
  }
});

module.exports = router;