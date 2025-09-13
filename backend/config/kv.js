class KVDatabase {
  constructor() {
    // 將在 database.js 中設置 this.kv
    this.kv = null;
  }

  // 用戶相關操作
  async createUser(userData) {
    const userId = `user:${Date.now()}`;
    await this.kv.hset(userId, userData);
    await this.kv.sadd('users', userId);
    return userId;
  }

  async getUserByUsername(username) {
    const userIds = await this.kv.smembers('users');
    for (const userId of userIds) {
      const user = await this.kv.hgetall(userId);
      if (user.username === username) {
        return { id: userId, ...user };
      }
    }
    return null;
  }

  async getUserById(userId) {
    const user = await this.kv.hgetall(userId);
    return user ? { id: userId, ...user } : null;
  }

  async updateUser(userId, userData) {
    await this.kv.hset(userId, userData);
    return true;
  }

  // 影片相關操作
  async createVideo(videoData) {
    const videoId = `video:${Date.now()}`;
    const video = {
      ...videoData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    await this.kv.hset(videoId, video);
    await this.kv.sadd('videos', videoId);
    
    // 如果是精選影片，加入精選列表
    if (videoData.is_featured) {
      await this.kv.sadd('featured_videos', videoId);
    }
    
    return videoId;
  }

  async getVideos(options = {}) {
    const { featured, limit, offset } = options;
    let videoIds;
    
    if (featured) {
      videoIds = await this.kv.smembers('featured_videos');
    } else {
      videoIds = await this.kv.smembers('videos');
    }
    
    // 獲取影片詳情
    const videos = [];
    for (const videoId of videoIds) {
      const video = await this.kv.hgetall(videoId);
      if (video && Object.keys(video).length > 0) {
        videos.push({ id: videoId, ...video });
      }
    }
    
    // 按創建時間排序
    videos.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // 分頁
    if (limit) {
      const start = offset || 0;
      return videos.slice(start, start + limit);
    }
    
    return videos;
  }

  async getVideoById(videoId) {
    const video = await this.kv.hgetall(videoId);
    return video ? { id: videoId, ...video } : null;
  }

  async updateVideo(videoId, videoData) {
    const updatedData = {
      ...videoData,
      updated_at: new Date().toISOString()
    };
    
    // 更新影片數據
    await this.kv.hset(videoId, updatedData);
    
    // 更新精選狀態
    if (videoData.is_featured) {
      await this.kv.sadd('featured_videos', videoId);
    } else {
      await this.kv.srem('featured_videos', videoId);
    }
    
    return true;
  }

  async deleteVideo(videoId) {
    await this.kv.del(videoId);
    await this.kv.srem('videos', videoId);
    await this.kv.srem('featured_videos', videoId);
    return true;
  }

  // 頻道資訊操作
  async getChannelInfo() {
    const channelInfo = await this.kv.hgetall('channel_info');
    return channelInfo || {};
  }

  async updateChannelInfo(channelData) {
    const updatedData = {
      ...channelData,
      updated_at: new Date().toISOString()
    };
    await this.kv.hset('channel_info', updatedData);
    return true;
  }

  // 網站設置操作
  async getSiteSetting(key) {
    return await this.kv.hget('site_settings', key);
  }

  async setSiteSetting(key, value) {
    await this.kv.hset('site_settings', { [key]: value });
    return true;
  }

  async getAllSiteSettings() {
    return await this.kv.hgetall('site_settings') || {};
  }

  // 統計數據
  async getStats() {
    const videoIds = await this.kv.smembers('videos');
    const featuredIds = await this.kv.smembers('featured_videos');
    
    let totalViews = 0;
    for (const videoId of videoIds) {
      const video = await this.kv.hgetall(videoId);
      if (video.view_count) {
        totalViews += parseInt(video.view_count) || 0;
      }
    }
    
    const channelInfo = await this.getChannelInfo();
    
    return {
      total_videos: videoIds.length,
      featured_videos: featuredIds.length,
      total_views: totalViews,
      subscriber_count: parseInt(channelInfo.subscriber_count) || 0
    };
  }

  // 初始化數據
  async initializeData() {
    try {
      // 檢查是否已有用戶
      const users = await this.kv.smembers('users');
      
      if (users.length === 0) {
        console.log('📝 創建默認管理員用戶...');
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('admin', 10);
        
        await this.createUser({
          username: 'CRCRC',
          password: hashedPassword,
          role: 'admin',
          created_at: new Date().toISOString()
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
          total_views: 0,
          created_at: new Date().toISOString()
        });
        console.log('✅ 默認頻道資訊創建成功');
      }

      // 檢查是否已有示例影片
      const videos = await this.getVideos();
      
      if (videos.length === 0) {
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

      // 設置默認網站設置
      const siteSettings = await this.getAllSiteSettings();
      
      if (!siteSettings.site_title) {
        console.log('📝 創建默認網站設置...');
        await this.setSiteSetting('site_title', 'CRCRC 官方網站');
        await this.setSiteSetting('site_description', '創作空耳與荒野亂鬥內容的頻道，歡迎訂閱！');
        await this.setSiteSetting('contact_email', 'contact@crcrc.com');
        await this.setSiteSetting('featured_video_count', '6');
        console.log('✅ 默認網站設置創建成功');
      }

      console.log('🎉 KV 數據庫初始化完成！');
      return true;
    } catch (error) {
      console.error('❌ KV 數據庫初始化失敗:', error);
      throw error;
    }
  }
// ===== CRCRCoin - helpers =====
  walletKey(userId) {
    return `coin_wallet:${userId}`;
  }

  txKey(userId) {
    return `coin_tx:${userId}`;
  }

  // ===== CRCRCoin - methods =====
  async ensureCoinWallet(userId) {
    const key = this.walletKey(userId);
    const existing = await this.kv.hgetall(key);
    if (!existing || Object.keys(existing).length === 0) {
      await this.kv.hset(key, {
        balance: 0,
        last_claim_at: null,
        updated_at: new Date().toISOString(),
        streak: 0
      });
    }
  }

  async getCoinWallet(userId) {
    const key = this.walletKey(userId);
    await this.ensureCoinWallet(userId);
    const w = await this.kv.hgetall(key);
    if (!w || Object.keys(w).length === 0) {
      return { user_id: userId, balance: 0, last_claim_at: null, streak: 0 };
    }
    return {
      user_id: userId,
      balance: parseInt(w.balance) || 0,
      last_claim_at: w.last_claim_at || null,
      streak: parseInt(w.streak) || 0
    };
  }

  async addCoins(userId, amount, reason = '任務獎勵') {
    const key = this.walletKey(userId);
    await this.ensureCoinWallet(userId);
    const w = await this.kv.hgetall(key);
    const newBal = Math.max(0, (parseInt(w.balance) || 0) + Math.max(0, parseInt(amount) || 0));
    await this.kv.hset(key, {
      balance: newBal,
      // 保留 last_claim_at
      last_claim_at: w.last_claim_at || null,
      updated_at: new Date().toISOString()
    });
    const txKey = this.txKey(userId);
    await this.kv.sadd(txKey, JSON.stringify({
      type: 'earn',
      amount: Math.max(0, parseInt(amount) || 0),
      reason,
      created_at: new Date().toISOString()
    }));
    return { success: true, wallet: { user_id: userId, balance: newBal, last_claim_at: w.last_claim_at || null } };
  }

  async spendCoins(userId, amount, reason = '消費') {
    const key = this.walletKey(userId);
    await this.ensureCoinWallet(userId);
    const w = await this.kv.hgetall(key);
    const bal = parseInt(w.balance) || 0;
    const val = Math.max(0, parseInt(amount) || 0);
    if (bal < val) {
      return { success: false, error: '餘額不足' };
    }
    const newBal = Math.max(0, bal - val);
    await this.kv.hset(key, {
      balance: newBal,
      last_claim_at: w.last_claim_at || null,
      updated_at: new Date().toISOString(),
      streak: parseInt(w.streak) || 0
    });
    const txKey = this.txKey(userId);
    await this.kv.sadd(txKey, JSON.stringify({
      type: 'spend',
      amount: val,
      reason,
      created_at: new Date().toISOString()
    }));
    return { success: true, wallet: { user_id: userId, balance: newBal, last_claim_at: w.last_claim_at || null, streak: parseInt(w.streak) || 0 } };
  }

  async claimDaily(userId, reward = 50, cooldownMs = 24 * 60 * 60 * 1000) {
    const key = this.walletKey(userId);
    await this.ensureCoinWallet(userId);
    const w = await this.kv.hgetall(key);
    const now = Date.now();
    const last = w.last_claim_at ? new Date(w.last_claim_at).getTime() : 0;
    const passed = now - last;

    if (w.last_claim_at && passed < cooldownMs) {
      return { success: false, nextClaimInMs: cooldownMs - passed };
    }

    // 連續簽到加成（以 UTC 日期計）
    const lastDateStr = w.last_claim_at ? new Date(w.last_claim_at).toISOString().slice(0, 10) : null;
    const nowDateStr = new Date().toISOString().slice(0, 10);
    let newStreak = 1;
    if (lastDateStr) {
      const deltaDays = Math.floor((Date.parse(nowDateStr) - Date.parse(lastDateStr)) / (24 * 60 * 60 * 1000));
      if (deltaDays === 1) newStreak = (parseInt(w.streak) || 0) + 1;
      else if (deltaDays > 1) newStreak = 1;
      else newStreak = parseInt(w.streak) || 1; // 同日，理論上已被冷卻擋下
    }
    const base = Math.max(0, parseInt(reward) || 0);
    const bonus = Math.min(50, Math.max(0, (newStreak - 1) * 10));
    const grant = base + bonus;
    const newBal = (parseInt(w.balance) || 0) + grant;
    const lastClaimISO = new Date().toISOString();
    await this.kv.hset(key, {
      balance: newBal,
      last_claim_at: lastClaimISO,
      updated_at: lastClaimISO,
      streak: newStreak
    });
    const txKey = this.txKey(userId);
    await this.kv.sadd(txKey, JSON.stringify({
      type: 'claim',
      amount: grant,
      reason: `每日簽到(連續${newStreak}天)`,
      created_at: lastClaimISO
    }));
    return { success: true, amount: grant, wallet: { user_id: userId, balance: newBal, last_claim_at: lastClaimISO, streak: newStreak } };
  }

  async getCoinHistory(userId, limit = 50) {
    const txKey = this.txKey(userId);
    const items = await this.kv.smembers(txKey);
    // Set 迭代為插入順序，轉換後按 created_at 排序保險
    const list = (items || []).map(s => {
      try { return JSON.parse(s); } catch { return null; }
    }).filter(Boolean).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const n = Math.max(1, Math.min(200, parseInt(limit) || 50));
    return list.slice(0, n);
  }

  async resetAllCoins() {
    // 依據現有 users 集合清理
    const userIds = await this.kv.smembers('users');
    for (const uid of userIds) {
      await this.kv.hset(this.walletKey(uid), {
        balance: 0,
        last_claim_at: null,
        updated_at: new Date().toISOString(),
        streak: 0
      });
      // 清空交易
      await this.kv.del(this.txKey(uid));
    }
    return true;
  }
}

module.exports = new KVDatabase();
