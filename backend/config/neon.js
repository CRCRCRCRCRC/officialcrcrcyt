const { createPool } = require('@vercel/postgres');

const DAY_MS = 24 * 60 * 60 * 1000;
const TAIPEI_OFFSET_MS = 8 * 60 * 60 * 1000;

const toTimestamp = (value) => {
  if (!value) return null;
  const ts = new Date(value).getTime();
  return Number.isFinite(ts) ? ts : null;
};

const getNextTaipeiMidnightTimestamp = (timestamp) => {
  if (timestamp === null || timestamp === undefined) return null;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return null;
  const nextDay = Math.floor((ts + TAIPEI_OFFSET_MS) / DAY_MS) + 1;
  return nextDay * DAY_MS - TAIPEI_OFFSET_MS;
};

const msUntilNextTaipeiMidnight = (timestamp, now = Date.now()) => {
  const next = getNextTaipeiMidnightTimestamp(timestamp);
  if (next === null) return 0;
  return Math.max(0, next - now);
};

const getTaipeiDayKey = (value = Date.now()) => {
  const ts = typeof value === 'number' ? value : toTimestamp(value);
  if (ts === null) return null;
  const taipei = new Date(ts + TAIPEI_OFFSET_MS);
  return taipei.toISOString().slice(0, 10);
};

class NeonDatabase {
  constructor() {
    const connectionString =
      process.env.POSTGRES_PRISMA_URL ||
      process.env.POSTGRES_URL ||
      process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('Missing Postgres connection string. Did you link Vercel Postgres (Neon)?');
    }

    this.pool = createPool({ connectionString });
    this.initializeTables();
  }

  parsePassList(raw) {
    if (!raw) return [];
    if (Array.isArray(raw)) {
      return raw.map((item) => (item && item.toString ? item.toString() : String(item)));
    }
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return Array.isArray(parsed) ? parsed.map((item) => (item && item.toString ? item.toString() : String(item))) : [];
    } catch {
      return [];
    }
  }

  normalizePassState(state = {}) {
    const rawXp = Number(state?.xp ?? state?.XP ?? 0);
    return {
      hasPremium: !!state.hasPremium,
      claimedFree: this.parsePassList(state.claimedFree),
      claimedPremium: this.parsePassList(state.claimedPremium),
      xp: Number.isFinite(rawXp) ? Math.max(0, Math.floor(rawXp)) : 0
    };
  }

  async initializeTables() {
    try {
      // 創建用戶表
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'user',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await this.pool.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS display_name VARCHAR(255)
      `);
      await this.pool.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500)
      `);
      await this.pool.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS discord_id VARCHAR(100)
      `);
      await this.pool.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS discord_username VARCHAR(100)
      `);
      await this.pool.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS discord_avatar VARCHAR(255)
      `);

      // 創建影片表
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS videos (
          id SERIAL PRIMARY KEY,
          title VARCHAR(500) NOT NULL,
          description TEXT,
          youtube_id VARCHAR(255) UNIQUE NOT NULL,
          thumbnail_url VARCHAR(500),
          duration VARCHAR(20),
          view_count INTEGER DEFAULT 0,
          published_at TIMESTAMP,
          is_featured BOOLEAN DEFAULT false,
          tags TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 創建頻道資訊表
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS channel_info (
          id SERIAL PRIMARY KEY,
          channel_name VARCHAR(255),
          description TEXT,
          youtube_url VARCHAR(500),
          discord_url VARCHAR(500),
          minecraft_discord_url VARCHAR(500),
          subscriber_count INTEGER DEFAULT 0,
          total_views INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 創建網站設置表
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS site_settings (
          id SERIAL PRIMARY KEY,
          setting_key VARCHAR(255) UNIQUE NOT NULL,
          setting_value TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 創建公告表
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS announcements (
          id SERIAL PRIMARY KEY,
          title VARCHAR(500) NOT NULL,
          slug VARCHAR(255) UNIQUE NOT NULL,
          content TEXT NOT NULL,
          published BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 添加 slug 欄位（如果表已存在但沒有 slug 欄位）
      await this.pool.query(`
        ALTER TABLE announcements
        ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE
      `);

      // 為現有沒有 slug 的公告生成 slug
      const announcementsWithoutSlug = await this.pool.query(`
        SELECT id, title FROM announcements WHERE slug IS NULL
      `);

      for (const announcement of announcementsWithoutSlug.rows) {
        const baseSlug = this.generateSlug(announcement.title);
        const uniqueSlug = await this.ensureUniqueSlug(baseSlug);

        await this.pool.query(`
          UPDATE announcements SET slug = $1 WHERE id = $2
        `, [uniqueSlug, announcement.id]);

        console.log(`為公告 "${announcement.title}" 生成 slug: ${uniqueSlug}`);
      }

      // CRCRCoin 資料表
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS coin_wallets (
          user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          balance INTEGER NOT NULL DEFAULT 0,
          last_claim_at TIMESTAMP NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS coin_passes (
          user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          has_premium BOOLEAN DEFAULT false,
          claimed_free TEXT DEFAULT '[]',
          claimed_premium TEXT DEFAULT '[]',
          xp INTEGER DEFAULT 0,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await this.pool.query(`
        ALTER TABLE coin_passes
        ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0
      `);
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS coin_transactions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          type VARCHAR(20) NOT NULL,
          amount INTEGER NOT NULL,
          reason TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS coin_daily_claims (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          claim_key DATE NOT NULL,
          amount INTEGER NOT NULL DEFAULT 0,
          claimed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE (user_id, claim_key)
        )
      `);
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS coin_orders (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          product_id VARCHAR(100) NOT NULL,
          product_name VARCHAR(255) NOT NULL,
          price INTEGER NOT NULL,
          discord_id VARCHAR(100) NOT NULL,
          status VARCHAR(50) DEFAULT 'pending',
          user_email VARCHAR(255),
          promotion_content TEXT,
          resolved_at TIMESTAMP,
          resolved_by INTEGER,
          notified_at TIMESTAMP,
          dismissed_at TIMESTAMP,
          decision_note TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS coin_pass_task_logs (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          task_id VARCHAR(100) NOT NULL,
          last_completed_at TIMESTAMP,
          completed_count INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE (user_id, task_id)
        )
      `);
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS coin_shop_visits (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          last_visit_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          visit_count INTEGER NOT NULL DEFAULT 0,
          UNIQUE (user_id)
        )
      `);
      await this.pool.query(`
        ALTER TABLE coin_orders
        ADD COLUMN IF NOT EXISTS user_email VARCHAR(255)
      `);
      await this.pool.query(`
        ALTER TABLE coin_orders
        ADD COLUMN IF NOT EXISTS promotion_content TEXT
      `);
      await this.pool.query(`
        ALTER TABLE coin_orders
        ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP
      `);
      await this.pool.query(`
        ALTER TABLE coin_orders
        ADD COLUMN IF NOT EXISTS resolved_by INTEGER
      `);
      await this.pool.query(`
        ALTER TABLE coin_orders
        ADD COLUMN IF NOT EXISTS notified_at TIMESTAMP
      `);
      await this.pool.query(`
        ALTER TABLE coin_orders
        ADD COLUMN IF NOT EXISTS decision_note TEXT
      `);
      await this.pool.query(`
        ALTER TABLE coin_orders
        ADD COLUMN IF NOT EXISTS dismissed_at TIMESTAMP
      `);

      console.log('? PostgreSQL 資料表初始化完成');
    } catch (error) {
      console.error('? PostgreSQL 資料表初始化失敗:', error);
    }
  }

  // 用戶相關操作
  async createUser(userData) {
    const { username, password, role = 'user', displayName = null, avatarUrl = null } = userData;
    const result = await this.pool.query(
      'INSERT INTO users (username, password, role, display_name, avatar_url) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [username, password, role, displayName, avatarUrl]
    );
    return result.rows[0].id;
  }

  async getUserByUsername(username) {
    // 將輸入的 username 轉換為小寫進行查詢，以確保不區分大小寫的匹配
    const lowercasedUsername = username.toLowerCase();
    const result = await this.pool.query(
      'SELECT * FROM users WHERE LOWER(username) = $1',
      [lowercasedUsername]
    );
    return result.rows[0] || null;
  }

  async getUserById(userId) {
    const result = await this.pool.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );
    return result.rows[0] || null;
  }


  async updateUserProfile(userId, profileData = {}) {
    const fields = [];
    const values = [];
    let index = 1;

    if (Object.prototype.hasOwnProperty.call(profileData, 'displayName')) {
      fields.push(`display_name = $${index++}`);
      values.push(profileData.displayName || null);
    }

    if (Object.prototype.hasOwnProperty.call(profileData, 'avatarUrl')) {
      fields.push(`avatar_url = $${index++}`);
      values.push(profileData.avatarUrl || null);
    }

    if (Object.prototype.hasOwnProperty.call(profileData, 'discordId')) {
      fields.push(`discord_id = $${index++}`);
      values.push(profileData.discordId || null);
    }

    if (Object.prototype.hasOwnProperty.call(profileData, 'discordUsername')) {
      fields.push(`discord_username = $${index++}`);
      values.push(profileData.discordUsername || null);
    }

    if (Object.prototype.hasOwnProperty.call(profileData, 'discordAvatar')) {
      fields.push(`discord_avatar = $${index++}`);
      values.push(profileData.discordAvatar || null);
    }

    if (!fields.length) {
      return await this.getUserById(userId);
    }

    values.push(userId);

    await this.pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${index}`,
      values
    );

    return await this.getUserById(userId);
  }

  async updateUser(userId, userData) {
    const { username, password, role } = userData;
    await this.pool.query(
      'UPDATE users SET username = $1, password = $2, role = $3 WHERE id = $4',
      [username, password, role, userId]
    );
    return true;
  }

  // 影片相關操作
  async createVideo(videoData) {
    const {
      title, description, youtube_id, thumbnail_url, duration,
      view_count = 0, published_at, is_featured = false, tags
    } = videoData;
    
    const result = await this.pool.query(`
      INSERT INTO videos (title, description, youtube_id, thumbnail_url, duration, view_count, published_at, is_featured, tags)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id
    `, [title, description, youtube_id, thumbnail_url, duration, view_count, published_at, is_featured, tags]);
    
    return result.rows[0].id;
  }

  async getVideos(options = {}) {
    const { featured, limit, offset } = options;
    let query = 'SELECT * FROM videos';
    let params = [];
    
    if (featured) {
      query += ' WHERE is_featured = true';
    }
    
    query += ' ORDER BY created_at DESC';
    
    if (limit) {
      query += ` LIMIT $${params.length + 1}`;
      params.push(limit);
      
      if (offset) {
        query += ` OFFSET $${params.length + 1}`;
        params.push(offset);
      }
    }
    
    const result = await this.pool.query(query, params);
    return result.rows;
  }

  async getVideoById(videoId) {
    const result = await this.pool.query(
      'SELECT * FROM videos WHERE id = $1',
      [videoId]
    );
    return result.rows[0] || null;
  }

  async updateVideo(videoId, videoData) {
    const {
      title, description, youtube_id, thumbnail_url, duration,
      view_count, published_at, is_featured, tags
    } = videoData;
    
    await this.pool.query(`
      UPDATE videos SET 
        title = $1, description = $2, youtube_id = $3, thumbnail_url = $4,
        duration = $5, view_count = $6, published_at = $7, is_featured = $8,
        tags = $9, updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
    `, [title, description, youtube_id, thumbnail_url, duration, view_count, published_at, is_featured, tags, videoId]);
    
    return true;
  }

  async deleteVideo(videoId) {
    await this.pool.query('DELETE FROM videos WHERE id = $1', [videoId]);
    return true;
  }

  // 頻道資訊操作
  async getChannelInfo() {
    const result = await this.pool.query('SELECT * FROM channel_info LIMIT 1');
    return result.rows[0] || {};
  }

  async updateChannelInfo(channelData) {
    const {
      channel_name, description, youtube_url, discord_url,
      minecraft_discord_url, subscriber_count, total_views
    } = channelData;
    
    // 檢查是否已有記錄
    const existing = await this.pool.query('SELECT id FROM channel_info LIMIT 1');
    
    if (existing.rows.length > 0) {
      await this.pool.query(`
        UPDATE channel_info SET 
          channel_name = $1, description = $2, youtube_url = $3, discord_url = $4,
          minecraft_discord_url = $5, subscriber_count = $6, total_views = $7,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $8
      `, [channel_name, description, youtube_url, discord_url, minecraft_discord_url, subscriber_count, total_views, existing.rows[0].id]);
    } else {
      await this.pool.query(`
        INSERT INTO channel_info (channel_name, description, youtube_url, discord_url, minecraft_discord_url, subscriber_count, total_views)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [channel_name, description, youtube_url, discord_url, minecraft_discord_url, subscriber_count, total_views]);
    }
    
    return true;
  }

  // 網站設置操作
  async getSiteSetting(key) {
    const result = await this.pool.query(
      'SELECT setting_value FROM site_settings WHERE setting_key = $1',
      [key]
    );
    return result.rows[0]?.setting_value || null;
  }

  async setSiteSetting(key, value) {
    await this.pool.query(`
      INSERT INTO site_settings (setting_key, setting_value)
      VALUES ($1, $2)
      ON CONFLICT (setting_key)
      DO UPDATE SET setting_value = $2, updated_at = CURRENT_TIMESTAMP
    `, [key, value]);
    return true;
  }

  async getAllSiteSettings() {
    const result = await this.pool.query('SELECT setting_key, setting_value FROM site_settings');
    const settings = {};
    result.rows.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });
    return settings;
  }

  // CRCRCoin - methods
  async ensureCoinWallet(userId) {
    await this.pool.query(
      `INSERT INTO coin_wallets (user_id, balance) VALUES ($1, 0)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId]
    );
  }

  async getCoinWallet(userId) {
    await this.ensureCoinWallet(userId);
    const res = await this.pool.query(
      `SELECT user_id, balance, last_claim_at FROM coin_wallets WHERE user_id = $1`,
      [userId]
    );
    const row = res.rows[0];
    return row || { user_id: userId, balance: 0, last_claim_at: null };
  }

  async getCoinPass(userId) {
    const result = await this.pool.query(
      'SELECT has_premium, claimed_free, claimed_premium, xp FROM coin_passes WHERE user_id = $1',
      [userId]
    );
    if (!result.rows.length) {
      return { hasPremium: false, claimedFree: [], claimedPremium: [], xp: 0 };
    }
    const row = result.rows[0];
    return this.normalizePassState({
      hasPremium: !!row.has_premium,
      claimedFree: row.claimed_free,
      claimedPremium: row.claimed_premium,
      xp: row.xp,
    });
  }

  async saveCoinPass(userId, state = {}) {
    const normalized = this.normalizePassState(state);
    await this.pool.query(
      `INSERT INTO coin_passes (user_id, has_premium, claimed_free, claimed_premium, xp, updated_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id) DO UPDATE
       SET has_premium = EXCLUDED.has_premium,
           claimed_free = EXCLUDED.claimed_free,
           claimed_premium = EXCLUDED.claimed_premium,
           xp = EXCLUDED.xp,
           updated_at = CURRENT_TIMESTAMP`,
      [userId, normalized.hasPremium, JSON.stringify(normalized.claimedFree), JSON.stringify(normalized.claimedPremium), normalized.xp]
    );
    return normalized;
  }


  async addPassXp(userId, amount) {
    const value = Math.max(0, Math.floor(Number(amount) || 0));
    if (value <= 0) {
      return this.normalizePassState(await this.getCoinPass(userId));
    }
    const current = await this.getCoinPass(userId);
    const nextState = { ...current, xp: Math.max(0, (Number(current?.xp) || 0) + value) };
    return await this.saveCoinPass(userId, nextState);
  }

  async getPassTaskLogs(userId) {
    const res = await this.pool.query(
      `SELECT task_id, last_completed_at, completed_count
       FROM coin_pass_task_logs
       WHERE user_id = $1`,
      [userId]
    );
    return res.rows.map((row) => ({
      task_id: row.task_id,
      last_completed_at: row.last_completed_at,
      completed_count: Number(row.completed_count) || 0
    }));
  }

  async upsertPassTaskLog(userId, taskId, { timestamp = new Date(), increment = 1 } = {}) {
    const inc = Math.max(1, Math.floor(Number(increment) || 1));
    const completedAt = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const res = await this.pool.query(
      `INSERT INTO coin_pass_task_logs (user_id, task_id, last_completed_at, completed_count)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, task_id) DO UPDATE
       SET last_completed_at = EXCLUDED.last_completed_at,
           completed_count = coin_pass_task_logs.completed_count + EXCLUDED.completed_count,
           updated_at = CURRENT_TIMESTAMP
       RETURNING task_id, last_completed_at, completed_count`,
      [userId, taskId, completedAt.toISOString(), inc]
    );
    const row = res.rows[0];
    return row
      ? {
          task_id: row.task_id,
          last_completed_at: row.last_completed_at,
          completed_count: Number(row.completed_count) || inc
        }
      : null;
  }

  async addCoins(userId, amount, reason = '任務獎勵') {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO coin_wallets (user_id, balance) VALUES ($1, 0)
         ON CONFLICT (user_id) DO NOTHING`,
        [userId]
      );
      const up = await client.query(
        `UPDATE coin_wallets
         SET balance = balance + $2, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $1
         RETURNING balance, last_claim_at`,
        [userId, amount]
      );
      await client.query(
        `INSERT INTO coin_transactions (user_id, type, amount, reason)
         VALUES ($1, 'earn', $2, $3)`,
        [userId, amount, reason]
      );
      await client.query('COMMIT');
      return { success: true, wallet: { user_id: userId, balance: up.rows[0].balance, last_claim_at: up.rows[0].last_claim_at } };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async spendCoins(userId, amount, reason = '消費') {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const cur = await client.query(
        `SELECT balance FROM coin_wallets WHERE user_id = $1 FOR UPDATE`,
        [userId]
      );
      const balance = cur.rows[0]?.balance ?? 0;
      if (balance < amount) {
        await client.query('ROLLBACK');
        return { success: false, error: '餘額不足' };
      }
      const up = await client.query(
        `UPDATE coin_wallets
         SET balance = balance - $2, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $1
         RETURNING balance, last_claim_at`,
        [userId, amount]
      );
      await client.query(
        `INSERT INTO coin_transactions (user_id, type, amount, reason)
         VALUES ($1, 'spend', $2, $3)`,
        [userId, amount, reason]
      );
      await client.query('COMMIT');
      return { success: true, wallet: { user_id: userId, balance: up.rows[0].balance, last_claim_at: up.rows[0].last_claim_at } };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async claimDaily(userId, reward = 50) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO coin_wallets (user_id, balance) VALUES ($1, 0)
         ON CONFLICT (user_id) DO NOTHING`,
        [userId]
      );

      const now = Date.now();
      const dayKey = getTaipeiDayKey(now);
      if (!dayKey) {
        throw new Error('Unable to derive Taipei day key for claim');
      }

      const normalizedReward = Math.max(0, Number(reward) || 0);

      const claimInsert = await client.query(
        `INSERT INTO coin_daily_claims (user_id, claim_key, amount, claimed_at)
         VALUES ($1, $2, $3, TO_TIMESTAMP($4 / 1000.0))
         ON CONFLICT (user_id, claim_key) DO NOTHING
         RETURNING claimed_at`,
        [userId, dayKey, normalizedReward, now]
      );

      if (!claimInsert.rowCount) {
        const existing = await client.query(
          `SELECT claimed_at FROM coin_daily_claims
           WHERE user_id = $1 AND claim_key = $2
           LIMIT 1`,
          [userId, dayKey]
        );
        const claimedAt = existing.rows[0]?.claimed_at ?? null;
        const referenceTs = claimedAt ? toTimestamp(claimedAt) : now;
        const remaining = msUntilNextTaipeiMidnight(referenceTs, now);
        await client.query('ROLLBACK');
        return { success: false, nextClaimInMs: remaining };
      }

      const lastClaimISO = new Date(now).toISOString();

      const walletRes = await client.query(
        `UPDATE coin_wallets
         SET balance = balance + $2,
             last_claim_at = $3,
             updated_at = $3
         WHERE user_id = $1
         RETURNING balance, last_claim_at`,
        [userId, normalizedReward, lastClaimISO]
      );

      await client.query(
        `INSERT INTO coin_transactions (user_id, type, amount, reason, created_at)
         VALUES ($1, 'claim', $2, '每日簽到', $3)`,
        [userId, normalizedReward, lastClaimISO]
      );

      await client.query('COMMIT');

      return {
        success: true,
        amount: normalizedReward,
        wallet: {
          user_id: userId,
          balance: walletRes.rows[0]?.balance ?? normalizedReward,
          last_claim_at: walletRes.rows[0]?.last_claim_at ?? lastClaimISO
        }
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  async getCoinHistory(userId, limit = 50) {
    const res = await this.pool.query(
      `SELECT type, amount, reason, created_at
       FROM coin_transactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, Math.max(1, Math.min(200, parseInt(limit) || 50))]
    );
    return res.rows;
  }


  async createCoinOrder(userId, orderData) {
    const {
      product_id,
      product_name,
      price,
      discord_id,
      status = 'pending',
      user_email = null,
      promotion_content = null
    } = orderData;

    const result = await this.pool.query(
      `INSERT INTO coin_orders (user_id, product_id, product_name, price, discord_id, status, user_email, promotion_content)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, user_id, product_id, product_name, price, discord_id, status, user_email, promotion_content, created_at`,
      [userId, product_id, product_name, price, discord_id, status, user_email, promotion_content]
    );

    return result.rows[0];
  }

  async getCoinOrders(limit = 100) {
    const max = Math.max(1, Math.min(500, parseInt(limit) || 100));
    const res = await this.pool.query(
      `SELECT o.id, o.user_id, o.product_id, o.product_name, o.price, o.discord_id, o.status,
              o.user_email, o.promotion_content, o.resolved_at, o.resolved_by, o.notified_at,
              o.dismissed_at,
              o.decision_note, o.created_at, u.username AS current_username
       FROM coin_orders o
       LEFT JOIN users u ON u.id = o.user_id
       ORDER BY o.created_at DESC
       LIMIT $1`,
      [max]
    );

    return res.rows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      product_id: row.product_id,
      product_name: row.product_name,
      price: Number(row.price) || 0,
      discord_id: row.discord_id,
      status: row.status,
      user_email: row.user_email || row.current_username || null,
      promotion_content: row.promotion_content || null,
      resolved_at: row.resolved_at || null,
      resolved_by: row.resolved_by || null,
      notified_at: row.notified_at || null,
      dismissed_at: row.dismissed_at || null,
      decision_note: row.decision_note || null,
      created_at: row.created_at
    }));
  }

  async getCoinOrderById(orderId) {
    if (!orderId) return null;
    const res = await this.pool.query(
      `SELECT id, user_id, product_id, product_name, price, discord_id, status,
              user_email, promotion_content, resolved_at, resolved_by, notified_at,
              dismissed_at, decision_note, created_at
       FROM coin_orders
       WHERE id = $1`,
      [orderId]
    );
    if (!res.rows.length) {
      return null;
    }
    const row = res.rows[0];
    return {
      id: row.id,
      user_id: row.user_id,
      product_id: row.product_id,
      product_name: row.product_name,
      price: Number(row.price) || 0,
      discord_id: row.discord_id,
      status: row.status,
      user_email: row.user_email || null,
      promotion_content: row.promotion_content || null,
      resolved_at: row.resolved_at || null,
      resolved_by: row.resolved_by || null,
      notified_at: row.notified_at || null,
      dismissed_at: row.dismissed_at || null,
      decision_note: row.decision_note || null,
      created_at: row.created_at
    };
  }

  async updateCoinOrderStatus(orderId, status, { adminId = null, note = null } = {}) {
    const res = await this.pool.query(
      `UPDATE coin_orders
       SET status = $2,
           resolved_at = CURRENT_TIMESTAMP,
           resolved_by = $3,
           decision_note = $4,
           notified_at = NULL,
           dismissed_at = NULL
       WHERE id = $1
       RETURNING id`,
      [orderId, status, adminId, note || null]
    );
    if (!res.rows.length) {
      return null;
    }
    return await this.getCoinOrderById(orderId);
  }

  async getCoinOrderNotifications(userId) {
    const res = await this.pool.query(
      `SELECT id, product_id, product_name, price, status, created_at
       FROM coin_orders
       WHERE user_id = $1
         AND status IN ('accepted', 'rejected')
         AND notified_at IS NULL
         AND dismissed_at IS NULL`,
      [userId]
    );
    const ids = res.rows.map((row) => row.id);
    if (ids.length) {
      await this.pool.query(
        `UPDATE coin_orders
         SET notified_at = CURRENT_TIMESTAMP
         WHERE user_id = $1 AND id = ANY($2::int[])`,
        [userId, ids]
      );
    }
    return res.rows.map((row) => ({
      id: row.id,
      product_id: row.product_id,
      product_name: row.product_name,
      price: Number(row.price) || 0,
      status: row.status,
      created_at: row.created_at,
      notified_at: null
    }));
  }

  async listCoinOrderNotifications(userId) {
    const res = await this.pool.query(
      `SELECT id, product_id, product_name, price, status, created_at, notified_at
       FROM coin_orders
       WHERE user_id = $1
         AND status IN ('accepted', 'rejected')
         AND dismissed_at IS NULL
       ORDER BY created_at DESC`,
      [userId]
    );
    const ids = res.rows.filter((row) => !row.notified_at).map((row) => row.id);
    if (ids.length) {
      await this.pool.query(
        `UPDATE coin_orders
         SET notified_at = CURRENT_TIMESTAMP
         WHERE user_id = $1 AND id = ANY($2::int[])`,
        [userId, ids]
      );
    }
    return res.rows.map((row) => ({
      id: row.id,
      product_id: row.product_id,
      product_name: row.product_name,
      price: Number(row.price) || 0,
      status: row.status,
      created_at: row.created_at,
      notified_at: row.notified_at
    }));
  }

  async dismissCoinOrderNotification(orderId, userId) {
    if (!orderId) return null;
    const res = await this.pool.query(
      `UPDATE coin_orders
       SET dismissed_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2 AND dismissed_at IS NULL
       RETURNING id`,
      [orderId, userId]
    );
    return res.rows[0] || null;
  }

  // 生成 slug
  generateSlug(title) {
    const slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // 移除特殊字符
      .replace(/\s+/g, '-') // 空格替換為連字符
      .replace(/-+/g, '-') // 多個連字符合併為一個
      .trim('-'); // 移除首尾連字符

    console.log('?? 生成 slug:', { title, slug });
    return slug;
  }

  // 生成隨機 slug（8個字元，包含數字和字母）
  generateRandomSlug(length = 8) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    console.log('?? 生成隨機 slug:', result);
    return result;
  }

  // 確保 slug 唯一
  async ensureUniqueSlug(baseSlug) {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const result = await this.pool.query('SELECT slug FROM announcements WHERE slug = $1', [slug]);

      if (result.rows.length === 0) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  // 公告相關操作
  async createAnnouncement(announcementData) {
    const { title, content, slug: customSlug, published = true } = announcementData;

    // 生成 slug
    let baseSlug;
    if (customSlug && customSlug.trim()) {
      // 如果提供了自定義 slug，使用它
      baseSlug = customSlug.trim();
    } else {
      // 如果沒有提供 slug，生成8字元隨機 slug
      baseSlug = this.generateRandomSlug(8);
    }

    const uniqueSlug = await this.ensureUniqueSlug(baseSlug);

    const result = await this.pool.query(`
      INSERT INTO announcements (title, slug, content, published)
      VALUES ($1, $2, $3, $4)
      RETURNING id, title, slug, content, published, created_at, updated_at
    `, [title, uniqueSlug, content, published]);

    console.log('??? 資料庫返回的公告數據:', result.rows[0]);
    return result.rows[0];
  }

  async getAnnouncements(options = {}) {
    const { published, limit } = options;

    let query = 'SELECT id, title, slug, content, published, created_at, updated_at FROM announcements';
    let params = [];
    let paramCount = 0;

    if (published !== undefined) {
      paramCount++;
      query += ` WHERE published = $${paramCount}`;
      params.push(published);
    }

    query += ' ORDER BY created_at DESC';

    if (limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(parseInt(limit));
    }

    const result = await this.pool.query(query, params);
    console.log('?? 資料庫查詢結果:', result.rows.map(row => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      published: row.published
    })));
    return result.rows;
  }

  async getAnnouncementBySlug(slug) {
    const result = await this.pool.query(
      'SELECT id, title, slug, content, published, created_at, updated_at FROM announcements WHERE slug = $1',
      [slug]
    );
    console.log('?? 按 slug 查詢結果:', result.rows[0]);
    return result.rows[0] || null;
  }

  async getAnnouncementById(id) {
    const result = await this.pool.query(
      'SELECT id, title, slug, content, published, created_at, updated_at FROM announcements WHERE id = $1',
      [id]
    );
    console.log('?? 按 ID 查詢結果:', result.rows[0]);
    return result.rows[0] || null;
  }

  async updateAnnouncementBySlug(originalSlug, announcementData) {
    const { title, content, slug: customSlug, published } = announcementData;

    // 獲取現有的公告數據
    const existingAnnouncement = await this.getAnnouncementBySlug(originalSlug);
    if (!existingAnnouncement) {
      throw new Error('公告不存在');
    }

    // 決定是否需要更新 slug
    let newSlug = null;
    if (customSlug !== undefined || title !== undefined) {
      const baseSlug = customSlug || this.generateSlug(title);
      newSlug = await this.ensureUniqueSlugExcluding(baseSlug, originalSlug);
    }

    // 準備更新數據
    const updateData = {
      title: title !== undefined ? title : existingAnnouncement.title,
      content: content !== undefined ? content : existingAnnouncement.content,
      published: published !== undefined ? published : existingAnnouncement.published
    };

    let query, params;
    if (newSlug) {
      query = `
        UPDATE announcements
        SET title = $1, slug = $2, content = $3, published = $4, updated_at = CURRENT_TIMESTAMP
        WHERE slug = $5
        RETURNING id, title, slug, content, published, created_at, updated_at
      `;
      params = [updateData.title, newSlug, updateData.content, updateData.published, originalSlug];
    } else {
      query = `
        UPDATE announcements
        SET title = $1, content = $2, published = $3, updated_at = CURRENT_TIMESTAMP
        WHERE slug = $4
        RETURNING id, title, slug, content, published, created_at, updated_at
      `;
      params = [updateData.title, updateData.content, updateData.published, originalSlug];
    }

    const result = await this.pool.query(query, params);
    console.log('?? 更新公告結果:', result.rows[0]);
    return result.rows[0];
  }

  async updateAnnouncementById(id, announcementData) {
    const { title, content, slug: customSlug, published } = announcementData;

    // 獲取現有的公告數據
    const existingAnnouncement = await this.getAnnouncementById(id);
    if (!existingAnnouncement) {
      throw new Error('公告不存在');
    }

    // 決定是否需要更新 slug
    let newSlug = null;
    if (customSlug !== undefined || title !== undefined) {
      const baseSlug = customSlug || this.generateSlug(title);
      newSlug = await this.ensureUniqueSlugExcluding(baseSlug, existingAnnouncement.slug);
    }

    // 準備更新數據
    const updateData = {
      title: title !== undefined ? title : existingAnnouncement.title,
      content: content !== undefined ? content : existingAnnouncement.content,
      published: published !== undefined ? published : existingAnnouncement.published
    };

    let query, params;
    if (newSlug) {
      query = `
        UPDATE announcements
        SET title = $1, slug = $2, content = $3, published = $4, updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
        RETURNING id, title, slug, content, published, created_at, updated_at
      `;
      params = [updateData.title, newSlug, updateData.content, updateData.published, id];
    } else {
      query = `
        UPDATE announcements
        SET title = $1, content = $2, published = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING id, title, slug, content, published, created_at, updated_at
      `;
      params = [updateData.title, updateData.content, updateData.published, id];
    }

    const result = await this.pool.query(query, params);
    console.log('?? 按ID更新公告結果:', result.rows[0]);
    return result.rows[0];
  }

  // 確保 slug 唯一（排除特定 slug）
  async ensureUniqueSlugExcluding(baseSlug, excludeSlug) {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      let query = 'SELECT slug FROM announcements WHERE slug = $1 AND slug != $2';
      let params = [slug, excludeSlug];

      const result = await this.pool.query(query, params);

      if (result.rows.length === 0) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  async deleteAnnouncementBySlug(slug) {
    const result = await this.pool.query(
      'DELETE FROM announcements WHERE slug = $1 RETURNING id, title, slug, content, published, created_at, updated_at',
      [slug]
    );
    console.log('??? 刪除公告結果:', result.rows[0]);
    return result.rows[0];
  }

  async deleteAnnouncementById(id) {
    const result = await this.pool.query(
      'DELETE FROM announcements WHERE id = $1 RETURNING id, title, slug, content, published, created_at, updated_at',
      [id]
    );
    console.log('??? 按ID刪除公告結果:', result.rows[0]);
    return result.rows[0];
  }

  // 統計數據
  async getStats() {
    const videoCount = await this.pool.query('SELECT COUNT(*) FROM videos');
    const featuredCount = await this.pool.query('SELECT COUNT(*) FROM videos WHERE is_featured = true');
    const viewsSum = await this.pool.query('SELECT SUM(view_count) FROM videos');
    const channelInfo = await this.getChannelInfo();

    return {
      total_videos: parseInt(videoCount.rows[0].count),
      featured_videos: parseInt(featuredCount.rows[0].count),
      total_views: parseInt(viewsSum.rows[0].sum) || 0,
      subscriber_count: parseInt(channelInfo.subscriber_count) || 0
    };
  }

  // 初始化數據
  async initializeData() {
    try {
      // 檢查是否已有用戶
      const userCount = await this.pool.query('SELECT COUNT(*) FROM users');
      
      if (parseInt(userCount.rows[0].count) === 0) {
        console.log('?? 創建默認管理員用戶...');
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('admin', 10);
        
        await this.createUser({
          username: 'CRCRC',
          password: hashedPassword,
          role: 'admin'
        });
        
        console.log('? 默認管理員用戶創建成功 (用戶名: CRCRC, 密碼: admin)');
      }

      // 檢查是否已有頻道資訊
      const channelInfo = await this.getChannelInfo();
      
      if (!channelInfo.channel_name) {
        console.log('?? 創建默認頻道資訊...');
        await this.updateChannelInfo({
          channel_name: 'CRCRC',
          description: '創作空耳與荒野亂鬥內容的頻道，歡迎訂閱！',
          youtube_url: 'https://youtube.com/@officialcrcrcyt',
          discord_url: 'https://discord.gg/FyrNaF6Nbj',
          minecraft_discord_url: 'https://discord.gg/9jBCTheX3Y',
          subscriber_count: 0,
          total_views: 0
        });
        console.log('? 默認頻道資訊創建成功');
      }

      // 檢查是否已有示例影片
      const videoCount = await this.pool.query('SELECT COUNT(*) FROM videos');
      
      if (parseInt(videoCount.rows[0].count) === 0) {
        console.log('?? 創建示例影片數據...');
        
        // 不創建示例影片，讓管理員自己添加真實影片
        const sampleVideos = [];

        if (sampleVideos.length > 0) {
          for (const video of sampleVideos) {
            await this.createVideo(video);
          }
          console.log('? 示例影片數據創建成功');
        } else {
          console.log('??  跳過示例影片創建，請在管理後台添加真實影片');
        }
      }

      // 公告已清空，不再需要自動清理

      // 設置默認網站設置
      const siteTitle = await this.getSiteSetting('site_title');

      if (!siteTitle) {
        console.log('?? 創建默認網站設置...');
        await this.setSiteSetting('site_title', 'CRCRC 官方網站');
        await this.setSiteSetting('site_description', '創作空耳與荒野亂鬥內容的頻道，歡迎訂閱！');
        await this.setSiteSetting('contact_email', 'contact@crcrc.com');
        await this.setSiteSetting('featured_video_count', '6');
        console.log('? 默認網站設置創建成功');
      }

      console.log('?? PostgreSQL 數據庫初始化完成！');
      return true;
    } catch (error) {
      console.error('? PostgreSQL 數據庫初始化失敗:', error);
      throw error;
    }
  }

  // 獲取 CRCRCoin 排行榜
  async getLeaderboard(limit = 20) {
    try {
      const max = Math.max(1, Math.min(100, parseInt(limit) || 20));
      const result = await this.pool.query(`
        SELECT
          u.id,
          u.username,
          u.display_name,
          u.avatar_url,
          COALESCE(cw.balance, 0) as balance
        FROM users u
        LEFT JOIN coin_wallets cw ON u.id = cw.user_id
        WHERE COALESCE(cw.balance, 0) > 0
        ORDER BY COALESCE(cw.balance, 0) DESC
        LIMIT $1
      `, [max]);

      return result.rows.map(row => ({
        id: row.id,
        username: row.username,
        display_name: row.display_name,
        avatar_url: row.avatar_url,
        balance: parseInt(row.balance) || 0
      }));
    } catch (error) {
      console.error('獲取排行榜失敗:', error);
      return [];
    }
  }

  // 記錄商店訪問
  async recordShopVisit(userId) {
    try {
      await this.pool.query(`
        INSERT INTO coin_shop_visits (user_id, last_visit_at, visit_count)
        VALUES ($1, CURRENT_TIMESTAMP, 1)
        ON CONFLICT (user_id)
        DO UPDATE SET
          last_visit_at = CURRENT_TIMESTAMP,
          visit_count = coin_shop_visits.visit_count + 1
      `, [userId]);
      return true;
    } catch (error) {
      console.error('記錄商店訪問失敗:', error);
      return false;
    }
  }

  // 獲取最後商店訪問時間
  async getLastShopVisit(userId) {
    try {
      const result = await this.pool.query(
        'SELECT last_visit_at FROM coin_shop_visits WHERE user_id = $1',
        [userId]
      );
      return result.rows[0]?.last_visit_at || null;
    } catch (error) {
      console.error('獲取商店訪問記錄失敗:', error);
      return null;
    }
  }

  // 檢查用戶是否已透過 OAuth 綁定 Discord 帳號
  async hasUserDiscordRecord(userId) {
    try {
      // 只檢查用戶是否已透過 OAuth 綁定 Discord ID
      const user = await this.getUserById(userId);
      return !!(user?.discord_id && user.discord_id.trim());
    } catch (error) {
      console.error('檢查 Discord 綁定失敗:', error);
      return false;
    }
  }
}

module.exports = new NeonDatabase();







