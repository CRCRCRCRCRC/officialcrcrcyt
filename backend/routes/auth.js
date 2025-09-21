const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const database = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 登入
router.post('/login', async (req, res) => {
  try {
    if (process.env.ENABLE_PASSWORD_LOGIN !== 'true') {
      return res.status(403).json({ error: '密碼登入已停用，請使用 Google 登入' });
    }

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

    // 確保資料庫已初始化
    console.log('🔄 確保資料庫已初始化...');
    await database.initializeData();

    // 從資料庫獲取用戶資訊
    const user = await database.getUserByUsername(ADMIN_USERNAME);
    console.log('🔍 資料庫查詢用戶:', user ? `找到用戶 ID: ${user.id}` : '用戶不存在');

    if (!user) {
      console.error('❌ 登入失敗：用戶不存在');
      return res.status(401).json({ error: '用戶不存在' });
    }

    // 生成 JWT token，使用真實的用戶 ID
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'default-jwt-secret',
      { expiresIn: '24h' }
    );
    console.log('✅ JWT token 生成成功，用戶 ID:', user.id);

    res.json({
      message: '登入成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
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
    const user = await database.getUserById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: '用戶不存在' });
    }

    // 驗證當前密碼
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: '當前密碼錯誤' });
    }

    // 加密新密碼
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // 更新密碼
    await database.pool.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedNewPassword, req.user.id]
    );

    res.json({ message: '密碼修改成功' });
  } catch (error) {
    console.error('修改密碼錯誤:', error);
    res.status(500).json({ error: '服務器內部錯誤' });
  }
});

// Google 登入
router.post('/google', async (req, res) => {
  try {
    const { id_token } = req.body;
    if (!id_token) {
      return res.status(400).json({ error: '缺少 id_token' });
    }

    // 透過 Google tokeninfo 端點驗證 ID Token
    const tokenInfoRes = await axios.get('https://oauth2.googleapis.com/tokeninfo', {
      params: { id_token }
    });
    const info = tokenInfoRes.data;

    // 驗證 audience 是否為我們的 Client ID（需在 Vercel 設定 GOOGLE_CLIENT_ID）
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    if (!GOOGLE_CLIENT_ID) {
      return res.status(500).json({ error: '伺服器未設定 GOOGLE_CLIENT_ID' });
    }
    if (info.aud !== GOOGLE_CLIENT_ID) {
      return res.status(401).json({ error: '無效的 Google 憑證 (aud 不匹配)' });
    }

    if (info.email_verified !== 'true') {
      return res.status(401).json({ error: 'Google 帳號尚未驗證 email' });
    }

    const email = info.email;
    const name = info.name || email.split('@')[0];

    // 確保資料庫已初始化
    await database.initializeData();

    // 允許指定 email 具有 admin 權限
    const adminEmails = (process.env.ADMIN_GOOGLE_EMAILS || '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);

    // 僅允許白名單中的帳號登入（其他帳號一律拒絕）
    if (!adminEmails.includes(email.toLowerCase())) {
      return res.status(403).json({ error: '錯誤的帳號' });
    }

    // 需要二次驗證密語
    const REQUIRED_PASSPHRASE = process.env.ADMIN_SECOND_FACTOR_PHRASE;
    if (!REQUIRED_PASSPHRASE) {
      return res.status(500).json({ error: '伺服器未設定 ADMIN_SECOND_FACTOR_PHRASE' });
    }
    if (!req.body.passphrase) {
      return res.status(401).json({ error: '需要二次驗證', code: 'NEEDS_PASSPHRASE' });
    }
    if (req.body.passphrase !== REQUIRED_PASSPHRASE) {
      return res.status(401).json({ error: '二次驗證失敗' });
    }

    const desiredRole = 'admin';

    // 以 email 當作 username
    let user = await database.getUserByUsername(email);
    if (!user) {
      // 建立隨機密碼（不會用到，只為符合資料表 NOT NULL）
      const randomPassword = await bcrypt.hash('oauth_google_' + Date.now(), 10);
      const userId = await database.createUser({ username: email, password: randomPassword, role: desiredRole, email: email });
      user = { id: userId, username: email, role: desiredRole, email: email };
    } else if (user.role !== desiredRole) {
      // 提升為 admin（若必要）
      try { await database.updateUser(user.id, { username: user.username, password: user.password, role: desiredRole, email: email }); } catch (e) {}
      user.role = desiredRole;
    }

    // 簽發我們自己的 JWT
    const adminJwtSecret = process.env.JWT_SECRET || 'default-jwt-secret';
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role, name },
      adminJwtSecret,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Google 登入成功',
      token,
      user: { id: user.id, username: user.username, role: user.role, name }
    });
  } catch (error) {
    console.error('Google 登入錯誤:', error.response?.data || error.message);
    res.status(401).json({ error: 'Google 登入失敗：' + (error.response?.data?.error_description || error.message) });
  }
});

// Google OAuth 授權碼登入（需要 client_id + client_secret）
router.post('/google-code', async (req, res) => {
  try {
    const { code, passphrase } = req.body;
    if (!code) {
      return res.status(400).json({ error: '缺少授權碼 code' });
    }

    const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
    if (!CLIENT_ID || !CLIENT_SECRET) {
      return res.status(500).json({ error: '伺服器未設定 GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET' });
    }

    // 交換授權碼取得 tokens
    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: 'postmessage', // 使用 popup 模式，可用 postmessage
      grant_type: 'authorization_code'
    });

    const { id_token } = tokenRes.data || {};
    if (!id_token) {
      return res.status(401).json({ error: '無法取得 id_token' });
    }

    // 驗證 id_token
    const tokenInfoRes = await axios.get('https://oauth2.googleapis.com/tokeninfo', { params: { id_token } });
    const info = tokenInfoRes.data;

    if (info.aud !== CLIENT_ID) {
      return res.status(401).json({ error: '無效的 Google 憑證 (aud 不匹配)' });
    }
    if (info.email_verified !== 'true') {
      return res.status(401).json({ error: 'Google 帳號尚未驗證 email' });
    }

    const email = info.email;
    const name = info.name || email.split('@')[0];

    // 僅允許白名單帳號
    const adminEmails = (process.env.ADMIN_GOOGLE_EMAILS || '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);
    if (!adminEmails.includes(email.toLowerCase())) {
      return res.status(403).json({ error: '錯誤的帳號' });
    }

    // 二次驗證密語
    const REQUIRED_PASSPHRASE = process.env.ADMIN_SECOND_FACTOR_PHRASE;
    if (!REQUIRED_PASSPHRASE) {
      return res.status(500).json({ error: '伺服器未設定 ADMIN_SECOND_FACTOR_PHRASE' });
    }
    if (!passphrase) {
      return res.status(401).json({ error: '需要二次驗證', code: 'NEEDS_PASSPHRASE' });
    }
    if (passphrase !== REQUIRED_PASSPHRASE) {
      return res.status(401).json({ error: '二次驗證失敗' });
    }

    // 初始化資料
    await database.initializeData();

    // 以 email 當 username，確保為 admin
    let user = await database.getUserByUsername(email);
    const desiredRole = 'admin';
    if (!user) {
      const randomPassword = await bcrypt.hash('oauth_google_' + Date.now(), 10);
      const userId = await database.createUser({ username: email, password: randomPassword, role: desiredRole, email: email });
      user = { id: userId, username: email, role: desiredRole, email: email };
    } else if (user.role !== desiredRole) {
      try { await database.updateUser(user.id, { username: user.username, password: user.password, role: desiredRole, email: email }); } catch (e) {}
      user.role = desiredRole;
    }

    // 簽發 JWT
    const adminJwtSecret2 = process.env.JWT_SECRET || 'default-jwt-secret';
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role, name },
      adminJwtSecret2,
      { expiresIn: '24h' }
    );

    res.json({ message: 'Google 登入成功', token, user: { id: user.id, username: user.username, role: user.role, name } });
  } catch (error) {
    console.error('Google 授權碼登入錯誤:', error.response?.data || error.message);
    res.status(401).json({ error: 'Google 授權碼登入失敗：' + (error.response?.data?.error_description || error.message) });
  }
});

// 公開網站端 Google 登入（user 角色，無白名單/密語）
router.post('/google-public', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: '缺少授權碼 code' });

    const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
    if (!CLIENT_ID || !CLIENT_SECRET) {
      return res.status(500).json({ error: '伺服器未設定 GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET' });
    }

    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: 'postmessage',
      grant_type: 'authorization_code'
    });

    const { id_token } = tokenRes.data || {};
    if (!id_token) return res.status(401).json({ error: '無法取得 id_token' });

    const tokenInfoRes = await axios.get('https://oauth2.googleapis.com/tokeninfo', { params: { id_token } });
    const info = tokenInfoRes.data;

    if (info.aud !== CLIENT_ID) return res.status(401).json({ error: '無效的 Google 憑證 (aud 不匹配)' });
    if (info.email_verified !== 'true') return res.status(401).json({ error: 'Google 帳號尚未驗證 email' });

    const email = info.email;
    const name = info.name || email.split('@')[0];
    const picture = info.picture || '';

    await database.initializeData();

    // 建立/取得 user 角色
    let user = await database.getUserByUsername(email);
    const desiredRole = 'user';
    if (!user) {
      const randomPassword = await bcrypt.hash('oauth_google_' + Date.now(), 10);
      const userId = await database.createUser({ username: email, password: randomPassword, role: desiredRole, email: email });
      user = { id: userId, username: email, role: desiredRole, email: email };
    } else if (user.role !== desiredRole) {
      try { await database.updateUser(user.id, { username: user.username, password: user.password, role: user.role, email: email }); } catch (e) {}
    }

    const websiteJwtSecret = process.env.WEBSITE_JWT_SECRET || process.env.JWT_SECRET || 'default-jwt-secret';
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: 'user', name, picture },
      websiteJwtSecret,
      { expiresIn: '7d' }
    );

    res.json({ message: '登入成功', token, user: { id: user.id, email, role: 'user', name, picture } });
  } catch (error) {
    console.error('Google 公開登入錯誤:', error.response?.data || error.message);
    res.status(401).json({ error: 'Google 公開登入失敗：' + (error.response?.data?.error_description || error.message) });
  }
});

module.exports = router;
