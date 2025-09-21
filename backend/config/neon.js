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
      `SELECT user_id, balance, last_claim_at FROM coin_wallets WHERE user_id = $1`,
      [userId]
    );
    const row = res.rows[0];
    return row || { user_id: userId, balance: 0, last_claim_at: null };
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

      // 檢查今天是否已經簽到過（使用用戶時區 UTC+8）
      const now = new Date();
      // 考慮用戶時區 (UTC+8)，將時間轉換為用戶當地時間
      const userTime = new Date(now.getTime() + (8 * 60 * 60 * 1000)); // UTC+8
      const today = new Date(userTime.getFullYear(), userTime.getMonth(), userTime.getDate()); // 用戶當地今天的凌晨0點
      const todayStr = today.toISOString().split('T')[0]; // 獲取今天的日期字符串 (YYYY-MM-DD)

      console.log('🔍 簽到檢查:', {
        userId,
        todayStr,
        currentTime: now.toISOString(),
        userTime: userTime.toISOString(),
        todayUserTime: today.toISOString()
      });

      const cur = await client.query(
        `SELECT balance, last_claim_at FROM coin_wallets WHERE user_id = $1 FOR UPDATE`,
        [userId]
      );
      const row = cur.rows[0] || { balance: 0, last_claim_at: null };

      console.log('🔍 錢包狀態:', {
        balance: row.balance,
        lastClaimAt: row.last_claim_at
      });

      // 檢查上次簽到是否是今天
      let canClaim = true;
      let nextClaimInMs = 0;

      if (row.last_claim_at) {
        const lastClaimDate = new Date(row.last_claim_at);
        const lastClaimDateOnly = new Date(lastClaimDate.getFullYear(), lastClaimDate.getMonth(), lastClaimDate.getDate());
        const lastClaimDateStr = lastClaimDateOnly.toISOString().split('T')[0];

        console.log('🔍 上次簽到比較:', {
          lastClaimDateStr,
          todayStr,
          isSameDay: lastClaimDateStr === todayStr
        });

        if (lastClaimDateStr === todayStr) {
          // 今天已經簽到過了
          canClaim = false;

          // 計算到明天凌晨0點的時間（用戶時區）
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          // 將明天凌晨0點轉換為UTC時間進行計算
          const tomorrowUTC = new Date(tomorrow.getTime() - (8 * 60 * 60 * 1000));
          nextClaimInMs = tomorrowUTC.getTime() - now.getTime();

          console.log('🔍 冷卻時間計算:', {
            nextClaimInMs,
            tomorrow: tomorrow.toISOString(),
            tomorrowUTC: tomorrowUTC.toISOString(),
            now: now.toISOString()
          });
        }
      }

      if (!canClaim) {
        await client.query('ROLLBACK');
        return { success: false, nextClaimInMs };
      }

      const up = await client.query(
        `UPDATE coin_wallets
         SET balance = balance + $2, last_claim_at = NOW(), updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $1
         RETURNING balance, last_claim_at`,
        [userId, reward]
      );
      await client.query(
        `INSERT INTO coin_transactions (user_id, type, amount, reason)
         VALUES ($1, 'claim', $2, '每日簽到')`,
        [userId, reward]
      );
      await client.query('COMMIT');
      return { success: true, amount: reward, wallet: { user_id: userId, balance: up.rows[0].balance, last_claim_at: up.rows[0].last_claim_at } };
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
    await this.pool.query(`UPDATE coin_wallets SET balance = 0, last_claim_at = NULL, updated_at = CURRENT_TIMESTAMP`);
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

  // 生成隨機 slug（8個字元，包含數字和字母）
  generateRandomSlug(length = 8) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    console.log('🎲 生成隨機 slug:', result);
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

    console.log('🗄️ 資料庫返回的公告數據:', result.rows[0]);
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
    console.log('📋 資料庫查詢結果:', result.rows.map(row => ({
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
    console.log('📋 按 slug 查詢結果:', result.rows[0]);
    return result.rows[0] || null;
  }

  async getAnnouncementById(id) {
    const result = await this.pool.query(
      'SELECT id, title, slug, content, published, created_at, updated_at FROM announcements WHERE id = $1',
      [id]
    );
    console.log('📋 按 ID 查詢結果:', result.rows[0]);
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
    console.log('📝 更新公告結果:', result.rows[0]);
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
    console.log('📝 按ID更新公告結果:', result.rows[0]);
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
    console.log('🗑️ 刪除公告結果:', result.rows[0]);
    return result.rows[0];
  }

  async deleteAnnouncementById(id) {
    const result = await this.pool.query(
      'DELETE FROM announcements WHERE id = $1 RETURNING id, title, slug, content, published, created_at, updated_at',
      [id]
    );
    console.log('🗑️ 按ID刪除公告結果:', result.rows[0]);
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