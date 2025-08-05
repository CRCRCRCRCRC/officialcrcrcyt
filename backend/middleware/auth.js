const jwt = require('jsonwebtoken');
const database = require('../config/database');
const kvDatabase = require('../config/kv');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '需要訪問令牌' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 優先使用 KV 數據庫，如果失敗則回退到 SQLite
    let user = null;
    try {
      user = await kvDatabase.getUserById(decoded.userId);
    } catch (kvError) {
      console.log('KV 查詢失敗，回退到 SQLite:', kvError.message);
      const users = await database.query(
        'SELECT id, username, role FROM users WHERE id = ?',
        [decoded.userId]
      );
      user = users.length > 0 ? users[0] : null;
    }

    if (!user) {
      return res.status(401).json({ error: '用戶不存在' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Token 驗證失敗:', error);
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