const jwt = require('jsonwebtoken');
const database = require('../config/database');

const isProd = process.env.NODE_ENV === 'production';

const buildJwtSecrets = () => {
  const secrets = [process.env.JWT_SECRET, process.env.WEBSITE_JWT_SECRET].filter(Boolean);

  if (!secrets.length && !isProd) {
    secrets.push('default-jwt-secret');
  }

  return secrets;
};

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '需要訪問令牌' });
  }

  try {
    // 支援多組密鑰驗證，避免部署或密鑰更新後舊 token 立即失效
    const secrets = buildJwtSecrets();
    if (!secrets.length) {
      return res.status(500).json({ error: 'JWT_SECRET/WEBSITE_JWT_SECRET 未設定' });
    }

    let decoded = null;
    let lastErr = null;
    for (const s of secrets) {
      try {
        decoded = jwt.verify(token, s);
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

    // 確保資料庫已初始化
    await database.initializeData();

    // 讀取使用者
    const user = await database.getUserById(userId);

    if (!user) {
      console.error('❌ 用戶不存在，userId:', userId);
      return res.status(401).json({ error: '用戶不存在' });
    }

    // 管理員權杖必須由新版 Google + 密碼流程核發；舊權杖與公開網站權杖一律不得取得管理員角色。
    let effectiveRole = decoded.role || user.role || 'user';
    if (effectiveRole === 'admin' && decoded.authMethod !== 'google-password') {
      effectiveRole = 'user';
    }

    // 確保用戶對象包含所有必要的屬性
    const fullUser = {
      id: user.id,
      username: user.username,
      role: effectiveRole,
      display_name: user.display_name || user.displayName,
      avatar_url: user.avatar_url || user.avatarUrl,
      email: user.email || user.username
    };


    req.user = fullUser;
    next();
  } catch (error) {
    console.error('❌ Token 處理例外:', error.message);
    return res.status(403).json({ error: '無效的訪問令牌' });
  }
};

const requireAdmin = (req, res, next) => {
  // 確保用戶對象存在
  if (!req.user) {
    console.error('❌ 用戶對象缺失');
    return res.status(403).json({ error: '需要管理員權限' });
  }
  // 確保用戶有 role 字段，如果沒有則默認為 'user'
  const userRole = req.user.role || 'user';
  
  // 檢查角色是否為 admin
  if (userRole !== 'admin') {
    console.error('❌ 用戶角色不是管理員:', userRole);
    console.error('❌ 完整用戶對象:', req.user);
    return res.status(403).json({ error: '需要管理員權限' });
  }
  
  // 確保 req.user 對象有所有必要的屬性
  req.user.role = userRole;
  
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin
};
