const jwt = require('jsonwebtoken');
const database = require('../config/database');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '需要訪問令牌' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 驗證用戶是否仍然存在
    const users = await database.query(
      'SELECT id, username, role FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: '用戶不存在' });
    }

    req.user = users[0];
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