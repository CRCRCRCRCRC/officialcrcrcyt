const jwt = require('jsonwebtoken');
const database = require('../config/database');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '需要訪問令牌' });
  }

  try {
    // 支援多組密鑰驗證，避免部署或密鑰更新後舊 token 立即失效
    const secrets = [
      process.env.JWT_SECRET,
      process.env.WEBSITE_JWT_SECRET,
      'default-jwt-secret'
    ].filter(Boolean);

    let decoded = null;
    let lastErr = null;
    for (const s of secrets) {
      try {
        decoded = require('jsonwebtoken').verify(token, s);
        break;
      } catch (e) {
        lastErr = e;
        continue;
      }
    }
    if (!decoded) {
      console.error('❌ Token 驗證失敗（所有密鑰皆無效）:', lastErr?.message || 'unknown');
      return res.status(403).json({ error: '無效的訪問令牌' });
    }

    const userId = decoded.userId ?? decoded.user_id ?? decoded.id;
    console.log('🔍 JWT 解碼成功:', { userId, username: decoded.username, role: decoded.role });

    // 確保資料庫已初始化
    await database.initializeData();

    // 讀取使用者
    const user = await database.getUserById(userId);
    console.log('🔍 資料庫查詢用戶:', user ? `找到用戶 ${user.username}` : '用戶不存在');
    console.log('🔍 用戶詳細信息:', user);

    if (!user) {
      console.error('❌ 用戶不存在，userId:', userId);
      return res.status(401).json({ error: '用戶不存在' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Token 處理例外:', error.message);
    return res.status(403).json({ error: '無效的訪問令牌' });
  }
};

const requireAdmin = (req, res, next) => {
  console.log('🔍 檢查管理員權限:', {
    user: req.user,
    userId: req.user?.id,
    username: req.user?.username,
    role: req.user?.role,
    hasRole: 'role' in req.user,
    roleType: typeof req.user?.role,
    roleValue: req.user?.role,
    isRoleAdmin: req.user?.role === 'admin'
  });
  
  // 確保用戶對象存在且有 role 字段
  if (!req.user || !req.user.role) {
    console.error('❌ 用戶對象或角色字段缺失:', req.user);
    return res.status(403).json({ error: '需要管理員權限' });
  }
  
  // 檢查角色是否為 admin
  if (req.user.role !== 'admin') {
    console.error('❌ 用戶角色不是管理員:', req.user.role);
    return res.status(403).json({ error: '需要管理員權限' });
  }
  
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin
};