const jwt = require('jsonwebtoken');
const database = require('../config/database');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '需要訪問令牌' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-jwt-secret');
    console.log('🔍 JWT 解碼成功:', { userId: decoded.userId, username: decoded.username });

    // 使用 PostgreSQL 數據庫
    const user = await database.getUserById(decoded.userId);
    console.log('🔍 資料庫查詢用戶:', user ? `找到用戶 ${user.username}` : '用戶不存在');

    if (!user) {
      console.error('❌ 用戶不存在，userId:', decoded.userId);
      return res.status(401).json({ error: '用戶不存在' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Token 驗證失敗:', error.message);
    return res.status(403).json({ error: '無效的訪問令牌' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '需要管理員權限' });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin
};