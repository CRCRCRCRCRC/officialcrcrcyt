const { Pool } = require('pg');

class NeonDatabase {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
    this.initializeTables();
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
      // 連續簽到：新增 streak_count 欄位（若不存在）
      await this.pool.query(`
        ALTER TABLE coin_wallets
        ADD COLUMN IF NOT EXISTS streak_count INTEGER DEFAULT 0
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

      console.log('✅ PostgreSQL 資料表初始化完成');
    } catch (error) {
      console.error('❌ PostgreSQL 資料表初始化失敗:', error);
    }
  }

  // 用戶相關操作
  async createUser(userData) {
    const { username, password, role = 'user' } = userData;
    const result = await this.pool.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id',
      [username, password, role]
    );
    return result.rows[0].id;
  }

  async getUserByUsername(username) {
    const result = await this.pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
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
      `SELECT user_id, balance, last_claim_at, streak_count FROM coin_wallets WHERE user_id = $1`,
      [userId]
    );
    const row = res.rows[0];
    return row || { user_id: userId, balance: 0, last_claim_at: null, streak_count: 0 };
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

  async claimDaily(userId, reward = 50, cooldownMs = 24 * 60 * 60 * 1000) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO coin_wallets (user_id, balance) VALUES ($1, 0)
         ON CONFLICT (user_id) DO NOTHING`,
        [userId]
      );
      const cur = await client.query(
        `SELECT balance, last_claim_at, streak_count FROM coin_wallets WHERE user_id = $1 FOR UPDATE`,
        [userId]
      );
      const row = cur.rows[0] || { balance: 0, last_claim_at: null, streak_count: 0 };
      const now = Date.now();
      const last = row.last_claim_at ? new Date(row.last_claim_at).getTime() : 0;
      const passed = now - last;

      if (row.last_claim_at && passed < cooldownMs) {
        const retryInMs = cooldownMs - passed;
        await client.query('ROLLBACK');
        return { success: false, nextClaimInMs: retryInMs };
      }
      // 計算連續簽到（以 UTC 日期判斷相鄰天數）
      const lastDateStr = row.last_claim_at ? new Date(row.last_claim_at).toISOString().slice(0, 10) : null;
      const nowDateStr = new Date().toISOString().slice(0, 10);
      let newStreak = 1;
      if (lastDateStr) {
        const deltaDays = Math.floor((Date.parse(nowDateStr) - Date.parse(lastDateStr)) / (24 * 60 * 60 * 1000));
        if (deltaDays === 1) newStreak = (parseInt(row.streak_count) || 0) + 1;
        else if (deltaDays > 1) newStreak = 1;
        else newStreak = parseInt(row.streak_count) || 1; // 同日，理論上已被冷卻擋下
      }
      const base = Math.max(0, parseInt(reward) || 0);
      const bonus = Math.min(50, Math.max(0, (newStreak - 1) * 10));
      const grant = base + bonus;
      const up = await client.query(
        `UPDATE coin_wallets
         SET balance = balance + $2, last_claim_at = NOW(), updated_at = CURRENT_TIMESTAMP, streak_count = $3
         WHERE user_id = $1
         RETURNING balance, last_claim_at, streak_count`,
        [userId, grant, newStreak]
      );
      await client.query(
        `INSERT INTO coin_transactions (user_id, type, amount, reason)
         VALUES ($1, 'claim', $2, $3)`,
        [userId, grant, `每日簽到(連續${newStreak}天)`]
      );
      await client.query('COMMIT');
      return { success: true, amount: grant, wallet: { user_id: userId, balance: up.rows[0].balance, last_claim_at: up.rows[0].last_claim_at, streak_count: up.rows[0].streak_count } };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
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

  async resetAllCoins() {
    await this.pool.query(`UPDATE coin_wallets SET balance = 0, last_claim_at = NULL, streak_count = 0, updated_at = CURRENT_TIMESTAMP`);
    await this.pool.query(`DELETE FROM coin_transactions`);
    return true;
  }

  // 生成 slug
  generateSlug(title) {
    const slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // 移除特殊字符
      .replace(/\s+/g, '-') // 空格替換為連字符
      .replace(/-+/g, '-') // 多個連字符合併為一個
      .trim('-'); // 移除首尾連字符

    console.log('🔗 生成 slug:', { title, slug });
    return slug;
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
    const baseSlug = customSlug || this.generateSlug(title);
    const uniqueSlug = await this.ensureUniqueSlug(baseSlug);

    const result = await this.pool.query(`
      INSERT INTO announcements (title, slug, content, published)
      VALUES ($1, $2, $3, $4)
      RETURNING title, slug, content, published, created_at, updated_at
    `, [title, uniqueSlug, content, published]);

    console.log('🗄️ 資料庫返回的公告數據:', result.rows[0]);
    return result.rows[0];
  }

  async getAnnouncements(options = {}) {
    const { published, limit } = options;

    let query = 'SELECT title, slug, content, published, created_at, updated_at FROM announcements';
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
    return result.rows;
  }

  async getAnnouncementBySlug(slug) {
    const result = await this.pool.query(
      'SELECT title, slug, content, published, created_at, updated_at FROM announcements WHERE slug = $1',
      [slug]
    );
    return result.rows[0] || null;
  }

  async updateAnnouncementBySlug(originalSlug, announcementData) {
    const { title, content, slug: customSlug, published } = announcementData;

    // 如果有自定義 slug 或標題改變，重新生成 slug
    let newSlug = null;
    if (customSlug !== undefined || title !== undefined) {
      const baseSlug = customSlug || this.generateSlug(title);
      newSlug = await this.ensureUniqueSlugExcluding(baseSlug, originalSlug);
    }

    let query, params;
    if (newSlug) {
      query = `
        UPDATE announcements
        SET title = $1, slug = $2, content = $3, published = $4, updated_at = CURRENT_TIMESTAMP
        WHERE slug = $5
        RETURNING title, slug, content, published, created_at, updated_at
      `;
      params = [title, newSlug, content, published, originalSlug];
    } else {
      query = `
        UPDATE announcements
        SET title = $1, content = $2, published = $3, updated_at = CURRENT_TIMESTAMP
        WHERE slug = $4
        RETURNING title, slug, content, published, created_at, updated_at
      `;
      params = [title, content, published, originalSlug];
    }

    const result = await this.pool.query(query, params);
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
      'DELETE FROM announcements WHERE slug = $1 RETURNING title, slug, content, published, created_at, updated_at',
      [slug]
    );
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
        console.log('📝 創建默認管理員用戶...');
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('admin', 10);
        
        await this.createUser({
          username: 'CRCRC',
          password: hashedPassword,
          role: 'admin'
        });
        
        console.log('✅ 默認管理員用戶創建成功 (用戶名: CRCRC, 密碼: admin)');
      }

      // 檢查是否已有頻道資訊
      const channelInfo = await this.getChannelInfo();
      
      if (!channelInfo.channel_name) {
        console.log('📝 創建默認頻道資訊...');
        await this.updateChannelInfo({
          channel_name: 'CRCRC',
          description: '創作空耳與荒野亂鬥內容的頻道，歡迎訂閱！',
          youtube_url: 'https://youtube.com/@officialcrcrcyt',
          discord_url: 'https://discord.gg/FyrNaF6Nbj',
          minecraft_discord_url: 'https://discord.gg/9jBCTheX3Y',
          subscriber_count: 0,
          total_views: 0
        });
        console.log('✅ 默認頻道資訊創建成功');
      }

      // 檢查是否已有示例影片
      const videoCount = await this.pool.query('SELECT COUNT(*) FROM videos');
      
      if (parseInt(videoCount.rows[0].count) === 0) {
        console.log('📝 創建示例影片數據...');
        
        // 不創建示例影片，讓管理員自己添加真實影片
        const sampleVideos = [];

        if (sampleVideos.length > 0) {
          for (const video of sampleVideos) {
            await this.createVideo(video);
          }
          console.log('✅ 示例影片數據創建成功');
        } else {
          console.log('ℹ️  跳過示例影片創建，請在管理後台添加真實影片');
        }
      }

      // 公告已清空，不再需要自動清理

      // 設置默認網站設置
      const siteTitle = await this.getSiteSetting('site_title');

      if (!siteTitle) {
        console.log('📝 創建默認網站設置...');
        await this.setSiteSetting('site_title', 'CRCRC 官方網站');
        await this.setSiteSetting('site_description', '創作空耳與荒野亂鬥內容的頻道，歡迎訂閱！');
        await this.setSiteSetting('contact_email', 'contact@crcrc.com');
        await this.setSiteSetting('featured_video_count', '6');
        console.log('✅ 默認網站設置創建成功');
      }

      console.log('🎉 PostgreSQL 數據庫初始化完成！');
      return true;
    } catch (error) {
      console.error('❌ PostgreSQL 數據庫初始化失敗:', error);
      throw error;
    }
  }
}

module.exports = new NeonDatabase();
