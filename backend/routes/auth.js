const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const crypto = require('crypto');
const database = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const isProd = process.env.NODE_ENV === 'production';

const getJwtSecret = (primaryEnv, fallbackEnv) => {
  const primary = (process.env[primaryEnv] || '').trim();
  const fallback = fallbackEnv ? (process.env[fallbackEnv] || '').trim() : '';
  const secret = primary || fallback || (!isProd ? 'default-jwt-secret' : '');
  if (!secret) {
    const name = fallbackEnv ? `${primaryEnv}/${fallbackEnv}` : primaryEnv;
    throw new Error(`伺服器未設定 ${name}`);
  }
  return secret;
};

const getAdminEmailAllowlist = () =>
  (process.env.ADMIN_GOOGLE_EMAILS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

const ensurePublicId = async (userId) => {
  if (!userId || !database?.ensureUserPublicId) {
    return database.getUserById(userId);
  }
  try {
    return await database.ensureUserPublicId(userId);
  } catch (error) {
    console.warn('ensureUserPublicId failed:', error.message);
    return database.getUserById(userId);
  }
};

const sanitizeUser = (user, overrides = {}) => {
  if (!user) return null;
  const merged = { ...user, ...overrides };
  const displayName = merged.display_name || merged.displayName || merged.name || merged.username || '';
  const avatarUrl = merged.avatar_url || merged.avatarUrl || merged.picture || '';
  const email = merged.email || merged.username || '';
  const discordId = merged.discord_id || merged.discordId || '';
  const discordUsername = merged.discord_username || merged.discordUsername || '';
  const discordAvatar = merged.discord_avatar || merged.discordAvatar || '';
  const publicId = merged.public_id || merged.publicId || '';
  const techEffectUnlocked =
    merged.tech_effect_unlocked === true ||
    merged.tech_effect_unlocked === 'true' ||
    merged.techEffectUnlocked === true;
  const neonEffectUnlocked =
    merged.neon_effect_unlocked === true ||
    merged.neon_effect_unlocked === 'true' ||
    merged.neonEffectUnlocked === true;

  return {
    id: merged.id,
    username: merged.username,
    email,
    role: merged.role,
    displayName,
    avatarUrl,
    discordId,
    discordUsername,
    discordAvatar,
    publicId,
    techEffectUnlocked,
    neonEffectUnlocked,
    name: displayName,
    picture: avatarUrl,
    discord_id: discordId,
    discord_username: discordUsername,
    discord_avatar: discordAvatar,
    public_id: publicId,
    tech_effect_unlocked: techEffectUnlocked,
    neon_effect_unlocked: neonEffectUnlocked
  };
};

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

    await database.initializeData();

    const user = await database.getUserByUsername(username);

    if (!user) {
      return res.status(401).json({ error: '用戶名或密碼錯誤' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: '用戶名或密碼錯誤' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ error: '管理員請使用 Google 雙重驗證登入' });
    }

    let jwtSecret;
    try {
      jwtSecret = getJwtSecret('JWT_SECRET');
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      jwtSecret,
      { expiresIn: '24h' }
    );

    const freshUser = await ensurePublicId(user.id);

    res.json({
      message: '登入成功',
      token,
      user: sanitizeUser(freshUser || user)
    });
  } catch (error) {
    console.error('登入錯誤:', error);
    res.status(500).json({ error: '服務器內部錯誤' });
  }
});

// 驗證 token
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    const freshUser = await ensurePublicId(req.user.id);
    res.json({
      valid: true,
      user: sanitizeUser(freshUser || req.user, { role: req.user.role })
    });
  } catch (error) {
    console.error('驗證使用者失敗:', error);
    res.status(500).json({ error: '驗證失敗' });
  }
});

// 取得個人資料
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const freshUser = await ensurePublicId(req.user.id);
    res.json({ user: sanitizeUser(freshUser || req.user, { role: req.user.role }) });
  } catch (error) {
    console.error('取得個人資料失敗:', error);
    res.status(500).json({ error: '取得個人資料失敗' });
  }
});

// 更新個人資料
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const rawDisplayName = typeof req.body.displayName === 'string' ? req.body.displayName.trim() : undefined;
    const rawDiscordId = typeof req.body.discordId === 'string' ? req.body.discordId.trim() : undefined;

    if (rawDisplayName !== undefined) {
      if (!rawDisplayName) {
        return res.status(400).json({ error: '暱稱不可為空白' });
      }
      if (rawDisplayName.length > 50) {
        return res.status(400).json({ error: '暱稱長度不得超過 50 個字元' });
      }
    }

    if (rawDiscordId !== undefined && rawDiscordId.length > 100) {
      return res.status(400).json({ error: 'Discord ID 長度不得超過 100 個字元' });
    }

    const existingUser = await database.getUserById(userId);
    if (!existingUser) {
      return res.status(404).json({ error: '用戶不存在' });
    }

    const updates = {};
    if (rawDisplayName !== undefined && rawDisplayName !== (existingUser.display_name || existingUser.displayName)) {
      updates.displayName = rawDisplayName;
    }
    if (rawDiscordId !== undefined && rawDiscordId !== (existingUser.discord_id || existingUser.discordId)) {
      updates.discordId = rawDiscordId;
    }

    let updatedUser = existingUser;
    if (Object.keys(updates).length) {
      updatedUser = await database.updateUserProfile(userId, updates);
    }

    const withPublicId = await ensurePublicId(updatedUser.id);

    res.json({
      message: Object.keys(updates).length ? '個人資料已更新' : '資料未變更',
      user: sanitizeUser(withPublicId || updatedUser)
    });
  } catch (error) {
    console.error('更新個人資料錯誤:', error);
    res.status(500).json({ error: '更新個人資料失敗' });
  }
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

    const user = await database.getUserById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: '用戶不存在' });
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: '當前密碼錯誤' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

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

const ensureAdminProfile = async (user, displayName, avatarUrl) => {
  await database.updateUserProfile(user.id, {
    displayName: displayName || user.username,
    avatarUrl: avatarUrl || user.avatar_url || null
  });
  return sanitizeUser(await ensurePublicId(user.id), { name: displayName, picture: avatarUrl });
};

const ensureUserProfile = async (user, displayName, avatarUrl, email) => {
  await database.updateUserProfile(user.id, {
    displayName: displayName || email,
    avatarUrl: avatarUrl || null
  });
  return sanitizeUser(await ensurePublicId(user.id), { email, name: displayName, picture: avatarUrl });
};

const createRouteError = (status, message, code) => {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
};

const getAdminChallengeSecret = () =>
  crypto
    .createHmac('sha256', getJwtSecret('JWT_SECRET'))
    .update('crcrc-admin-login-challenge-v1')
    .digest('hex');

const secureTextEquals = (left, right) => {
  const digest = (value) => crypto.createHash('sha256').update(String(value)).digest();
  return crypto.timingSafeEqual(digest(left), digest(right));
};

const exchangeGoogleCode = async (code) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw createRouteError(500, '伺服器未設定 GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET');
  }

  const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: 'postmessage',
    grant_type: 'authorization_code'
  });

  const { id_token: idToken } = tokenResponse.data || {};
  if (!idToken) {
    throw createRouteError(401, 'Google 帳號驗證失敗');
  }

  const tokenInfoResponse = await axios.get('https://oauth2.googleapis.com/tokeninfo', {
    params: { id_token: idToken }
  });
  const info = tokenInfoResponse.data || {};
  const isEmailVerified = info.email_verified === true || info.email_verified === 'true';

  if (info.aud !== clientId || !isEmailVerified || !info.email) {
    throw createRouteError(401, 'Google 帳號驗證失敗');
  }

  return {
    email: info.email.toLowerCase(),
    name: info.name || info.email.split('@')[0],
    picture: info.picture || ''
  };
};

const assertAllowedAdminEmail = (email) => {
  const adminEmails = getAdminEmailAllowlist();
  if (!adminEmails.length) {
    throw createRouteError(500, '伺服器未設定 ADMIN_GOOGLE_EMAILS');
  }
  if (!adminEmails.includes(String(email).toLowerCase())) {
    throw createRouteError(403, '此 Google 帳號沒有管理員權限');
  }
};

const provisionAdmin = async ({ email, name, picture }) => {
  await database.initializeData();

  let user = await database.getUserByUsername(email);
  const desiredRole = 'admin';
  if (!user) {
    const randomPassword = await bcrypt.hash(`oauth_google_${Date.now()}_${crypto.randomUUID()}`, 10);
    const userId = await database.createUser({ username: email, password: randomPassword, role: desiredRole });
    user = { id: userId, username: email, role: desiredRole };
  } else if (user.role !== desiredRole) {
    await database.updateUser(user.id, {
      username: user.username,
      password: user.password,
      role: desiredRole
    });
    user.role = desiredRole;
  }

  return ensureAdminProfile(user, name, picture);
};

const sendAdminLoginError = (res, error, fallbackMessage) => {
  const status = error.status || 500;
  const message = error.status ? error.message : fallbackMessage;
  return res.status(status).json({ error: message, ...(error.code ? { code: error.code } : {}) });
};

// 第一階段：先驗證 Google 帳號，只核發五分鐘內有效的登入挑戰，不核發管理員權杖。
router.post('/google-admin/start', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: '缺少 Google 授權碼' });
    }

    const profile = await exchangeGoogleCode(code);
    assertAllowedAdminEmail(profile.email);

    const challenge = jwt.sign(
      {
        type: 'admin-login-challenge',
        email: profile.email,
        name: profile.name,
        picture: profile.picture
      },
      getAdminChallengeSecret(),
      {
        expiresIn: '5m',
        audience: 'crcrc-admin-login',
        issuer: 'crcrc-api',
        jwtid: crypto.randomUUID()
      }
    );

    return res.json({ challenge, expiresIn: 300 });
  } catch (error) {
    console.error('管理員 Google 驗證錯誤:', error.response?.data || error.message);
    const routeError = error.response
      ? createRouteError(401, 'Google 帳號驗證失敗，請再試一次')
      : error;
    return sendAdminLoginError(res, routeError, 'Google 帳號驗證失敗，請再試一次');
  }
});

// 第二階段：Google 挑戰通過後，再驗證只存在伺服器端的管理員密碼。
router.post('/google-admin/complete', async (req, res) => {
  try {
    const { challenge, password } = req.body;
    if (!challenge || typeof password !== 'string' || !password) {
      return res.status(400).json({ error: '缺少登入驗證資料' });
    }

    const challengeSecret = getAdminChallengeSecret();
    let challengePayload;
    try {
      challengePayload = jwt.verify(challenge, challengeSecret, {
        audience: 'crcrc-admin-login',
        issuer: 'crcrc-api'
      });
    } catch (error) {
      return res.status(401).json({
        error: '驗證已逾時，請重新使用 Google 登入',
        code: 'ADMIN_CHALLENGE_EXPIRED'
      });
    }

    if (challengePayload.type !== 'admin-login-challenge' || !challengePayload.email) {
      return res.status(401).json({
        error: '登入驗證無效，請重新使用 Google 登入',
        code: 'ADMIN_CHALLENGE_EXPIRED'
      });
    }

    assertAllowedAdminEmail(challengePayload.email);

    const adminPassword = process.env.ADMIN_LOGIN_PASSWORD || process.env.ADMIN_SECOND_FACTOR_PHRASE;
    if (!adminPassword) {
      throw createRouteError(500, '伺服器未設定 ADMIN_LOGIN_PASSWORD');
    }
    if (!secureTextEquals(password, adminPassword)) {
      return res.status(401).json({ error: '密碼錯誤' });
    }

    const sanitizedUser = await provisionAdmin({
      email: challengePayload.email,
      name: challengePayload.name,
      picture: challengePayload.picture
    });
    const token = jwt.sign(
      {
        userId: sanitizedUser.id,
        username: sanitizedUser.username,
        role: 'admin',
        authMethod: 'google-password',
        name: sanitizedUser.displayName,
        picture: sanitizedUser.avatarUrl
      },
      getJwtSecret('JWT_SECRET'),
      { expiresIn: '24h' }
    );

    return res.json({ message: '登入成功', token, user: sanitizedUser });
  } catch (error) {
    console.error('管理員密碼驗證錯誤:', error.message);
    return sendAdminLoginError(res, error, '管理員登入失敗，請再試一次');
  }
});

const legacyAdminLoginRemoved = (req, res) =>
  res.status(410).json({ error: '管理員登入流程已更新，請重新整理頁面' });

router.post('/google', legacyAdminLoginRemoved);
router.post('/google-code', legacyAdminLoginRemoved);

// 公開網站端 Google 登入（user 角色，無白名單/密語）
router.post('/google-public', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: '缺少授權碼 code' });
    }

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
    if (!id_token) {
      return res.status(401).json({ error: '無法取得 id_token' });
    }

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
    const picture = info.picture || '';

    await database.initializeData();

    let user = await database.getUserByUsername(email);
    const desiredRole = 'user';
    if (!user) {
      const randomPassword = await bcrypt.hash(`oauth_google_${Date.now()}`, 10);
      const userId = await database.createUser({ username: email, password: randomPassword, role: desiredRole });
      user = { id: userId, username: email, role: desiredRole };
    } else if (user.role !== desiredRole) {
      try {
        await database.updateUser(user.id, { username: user.username, password: user.password, role: user.role });
      } catch (error) {
        console.warn('更新使用者角色失敗:', error.message);
      }
    }

    const sanitizedUser = await ensureUserProfile(user, name, picture, email);

    let jwtSecret;
    try {
      jwtSecret = getJwtSecret('WEBSITE_JWT_SECRET', 'JWT_SECRET');
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }

    const publicUser = { ...sanitizedUser, role: 'user' };
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: 'user', authMethod: 'google-public', name: publicUser.displayName, picture: publicUser.avatarUrl },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({ message: '登入成功', token, user: publicUser });
  } catch (error) {
    console.error('Google 公開登入錯誤:', error.response?.data || error.message);
    res.status(401).json({ error: 'Google 公開登入失敗：' + (error.response?.data?.error_description || error.message) });
  }
});

// Discord OAuth - 綁定 Discord 帳號
router.post('/discord-bind', authenticateToken, async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: '缺少授權碼' });
    }

    const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
    const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
    const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;

    if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET || !DISCORD_REDIRECT_URI) {
      console.error('Discord OAuth 環境變數未設定');
      return res.status(500).json({ error: 'Discord OAuth 未正確配置' });
    }

    // 交換授權碼取得 access token
    const tokenResponse = await axios.post(
      'https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: DISCORD_REDIRECT_URI
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const { access_token } = tokenResponse.data;

    // 使用 access token 取得用戶資訊
    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });

    const discordUser = userResponse.data;

    // 儲存 Discord 資訊到資料庫
    const updatedUser = await database.updateUserProfile(req.user.id, {
      discordId: discordUser.id,
      discordUsername: `${discordUser.username}${discordUser.discriminator !== '0' ? `#${discordUser.discriminator}` : ''}`,
      discordAvatar: discordUser.avatar
        ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
        : null
    });

    res.json({
      message: 'Discord 帳號綁定成功',
      discord: {
        id: discordUser.id,
        username: `${discordUser.username}${discordUser.discriminator !== '0' ? `#${discordUser.discriminator}` : ''}`,
        avatar: discordUser.avatar
          ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
          : null
      },
      user: sanitizeUser(updatedUser)
    });
  } catch (error) {
    console.error('Discord 綁定失敗:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Discord 綁定失敗',
      details: error.response?.data?.error_description || error.message
    });
  }
});

// Discord 解除綁定
router.post('/discord-unbind', authenticateToken, async (req, res) => {
  try {
    const updatedUser = await database.updateUserProfile(req.user.id, {
      discordId: null,
      discordUsername: null,
      discordAvatar: null
    });

    res.json({
      message: 'Discord 帳號已解除綁定',
      user: sanitizeUser(updatedUser)
    });
  } catch (error) {
    console.error('Discord 解除綁定失敗:', error);
    res.status(500).json({ error: 'Discord 解除綁定失敗' });
  }
});

// 管理員取得用戶列表（用於搜尋）
router.get('/users', authenticateToken, async (req, res) => {
  try {
    // 檢查是否為管理員
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: '需要管理員權限' });
    }

    const { search } = req.query;

    // 如果搜尋字串太短，返回空陣列
    if (!search || search.trim().length < 2) {
      return res.json({ users: [] });
    }

    const searchTerm = `%${search.trim()}%`;

    // 從資料庫搜尋用戶（依 username/email 或 display_name）
    const result = await database.pool.query(
      `SELECT id, username, email, display_name, discord_id, public_id
       FROM users
       WHERE (username ILIKE $1 OR email ILIKE $1 OR display_name ILIKE $1 OR public_id ILIKE $1)
       ORDER BY display_name, username
       LIMIT 20`,
      [searchTerm]
    );

    const users = result.rows.map(row => ({
      id: row.id,
      email: row.email || row.username,
      display_name: row.display_name,
      username: row.username,
      discord_id: row.discord_id,
      public_id: row.public_id
    }));

    res.json({ users });
  } catch (error) {
    console.error('搜尋用戶失敗:', error);
    res.status(500).json({ error: '搜尋用戶失敗' });
  }
});

module.exports = router;
