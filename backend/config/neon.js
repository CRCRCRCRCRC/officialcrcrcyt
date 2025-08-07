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
        const uniqueSlug = await this.ensureUniqueSlug(baseSlug, announcement.id);

        await this.pool.query(`
          UPDATE announcements SET slug = $1 WHERE id = $2
        `, [uniqueSlug, announcement.id]);

        console.log(`為公告 "${announcement.title}" 生成 slug: ${uniqueSlug}`);
      }

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

  // 生成 slug
  generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // 移除特殊字符
      .replace(/\s+/g, '-') // 空格替換為連字符
      .replace(/-+/g, '-') // 多個連字符合併為一個
      .trim('-'); // 移除首尾連字符
  }

  // 確保 slug 唯一
  async ensureUniqueSlug(baseSlug, excludeId = null) {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      let query = 'SELECT id FROM announcements WHERE slug = $1';
      let params = [slug];

      if (excludeId) {
        query += ' AND id != $2';
        params.push(excludeId);
      }

      const result = await this.pool.query(query, params);

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
      RETURNING id, title, slug, content, published, created_at::text as created_at, updated_at::text as updated_at
    `, [title, uniqueSlug, content, published]);

    return result.rows[0];
  }

  async getAnnouncements(options = {}) {
    const { published, limit } = options;

    let query = 'SELECT id, title, slug, content, published, created_at::text as created_at, updated_at::text as updated_at FROM announcements';
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

  async getAnnouncementById(id) {
    const result = await this.pool.query(
      'SELECT id, title, slug, content, published, created_at::text as created_at, updated_at::text as updated_at FROM announcements WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async getAnnouncementBySlug(slug) {
    const result = await this.pool.query(
      'SELECT id, title, slug, content, published, created_at::text as created_at, updated_at::text as updated_at FROM announcements WHERE slug = $1',
      [slug]
    );
    return result.rows[0] || null;
  }

  async updateAnnouncement(id, announcementData) {
    const { title, content, slug: customSlug, published } = announcementData;

    // 如果有自定義 slug 或標題改變，重新生成 slug
    let slug = null;
    if (customSlug !== undefined || title !== undefined) {
      const baseSlug = customSlug || this.generateSlug(title);
      slug = await this.ensureUniqueSlug(baseSlug, id);
    }

    let query, params;
    if (slug) {
      query = `
        UPDATE announcements
        SET title = $1, slug = $2, content = $3, published = $4, updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
        RETURNING id, title, slug, content, published, created_at::text as created_at, updated_at::text as updated_at
      `;
      params = [title, slug, content, published, id];
    } else {
      query = `
        UPDATE announcements
        SET title = $1, content = $2, published = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING id, title, slug, content, published, created_at::text as created_at, updated_at::text as updated_at
      `;
      params = [title, content, published, id];
    }

    const result = await this.pool.query(query, params);
    return result.rows[0];
  }

  async deleteAnnouncement(id) {
    const result = await this.pool.query(
      'DELETE FROM announcements WHERE id = $1 RETURNING id, title, slug, content, published, created_at::text as created_at, updated_at::text as updated_at',
      [id]
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
          description: '專業製作空耳音樂影片的 YouTube 頻道，將流行歌曲重新詮釋成有趣的空耳版本。',
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

      // 檢查是否已有公告
      const announcementCount = await this.pool.query('SELECT COUNT(*) FROM announcements');

      if (parseInt(announcementCount.rows[0].count) === 0) {
        console.log('📝 創建示例公告數據...');

        const sampleAnnouncements = [
          {
            title: '歡迎來到 CRCRC 官方網站！',
            slug: 'welcome-to-crcrc',
            content: '# 歡迎！\n\n感謝您訪問我們的官方網站。我們將在這裡發布最新的**空耳音樂作品**和重要公告。\n\n## 最新功能\n- 🎵 線上播放器\n- 📱 響應式設計\n- 🔔 公告系統\n\n敬請期待更多精彩內容！',
            published: true
          },
          {
            title: '新影片發布通知',
            slug: 'new-video-release',
            content: '## 🎉 新作品上線\n\n我們剛剛發布了一首全新的空耳音樂作品！\n\n### 特色\n- 高品質音效\n- 創意歌詞改編\n- 精美視覺效果\n\n快去**影片庫**查看吧！',
            published: true
          },
          {
            title: '網站功能更新',
            slug: 'website-update',
            content: '### 🔧 系統更新\n\n我們對網站進行了以下改進：\n\n1. **播放器優化** - 更流暢的播放體驗\n2. **介面美化** - 全新的視覺設計\n3. **效能提升** - 更快的載入速度\n\n感謝您的支持！',
            published: true
          }
        ];

        for (const announcement of sampleAnnouncements) {
          await this.createAnnouncement(announcement);
        }

        console.log('✅ 示例公告數據創建成功');
      }

      // 設置默認網站設置
      const siteTitle = await this.getSiteSetting('site_title');

      if (!siteTitle) {
        console.log('📝 創建默認網站設置...');
        await this.setSiteSetting('site_title', 'CRCRC 官方網站');
        await this.setSiteSetting('site_description', '專業製作空耳音樂影片的 YouTube 頻道');
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