const crypto = require('crypto');
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

class KVDatabase {
  constructor() {
    // 將在 database.js 中設置 this.kv
    this.kv = null;
    // 初始化狀態旗標，避免每次請求重複跑初始化流程
    this._initDone = false;
    this._initPromise = null;
  }

  generatePublicId(length = 10) {
    const size = Math.max(6, Math.min(20, Number(length) || 10));
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < size; i += 1) {
      result += chars[crypto.randomInt(0, chars.length)];
    }
    return result;
  }

  async generateUniquePublicId(length = 10, maxAttempts = 8) {
    const userIds = await this.kv.smembers('users');
    for (let i = 0; i < maxAttempts; i += 1) {
      const candidate = this.generatePublicId(length);
      let found = false;
      for (const userId of userIds) {
        const user = await this.kv.hgetall(userId);
        if (user && user.public_id === candidate) {
          found = true;
          break;
        }
      }
      if (!found) return candidate;
    }
    throw new Error('Unable to generate unique public id');
  }

  async ensureUserPublicId(userId) {
    if (!userId) return null;
    const user = await this.getUserById(userId);
    if (!user) return null;
    if (user.public_id && String(user.public_id).trim()) {
      return user;
    }
    const publicId = await this.generateUniquePublicId();
    await this.kv.hset(userId, { public_id: publicId });
    return await this.getUserById(userId);
  }

  async getUserByPublicId(publicId) {
    const normalized = String(publicId || '').trim().toUpperCase();
    if (!normalized) return null;
    const userIds = await this.kv.smembers('users');
    for (const userId of userIds) {
      const user = await this.kv.hgetall(userId);
      if (user && String(user.public_id || '').toUpperCase() == normalized) {
        return { id: userId, ...user };
      }
    }
    return null;
  }

  // 用戶相關操作
  async createUser(userData) {
    const userId = `user:${Date.now()}`;
    const payload = { ...userData };

    if (Object.prototype.hasOwnProperty.call(payload, 'displayName') && !Object.prototype.hasOwnProperty.call(payload, 'display_name')) {
      payload.display_name = payload.displayName;
      delete payload.displayName;
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'avatarUrl') && !Object.prototype.hasOwnProperty.call(payload, 'avatar_url')) {
      payload.avatar_url = payload.avatarUrl;
      delete payload.avatarUrl;
    }

    if (!payload.public_id) {
      payload.public_id = await this.generateUniquePublicId();
    }

    await this.kv.hset(userId, payload);
    await this.kv.sadd('users', userId);
    return userId;
  }

  async getUserByUsername(username) {
    const userIds = await this.kv.smembers('users');
    for (const userId of userIds) {
      const user = await this.kv.hgetall(userId);
      // 使用不區分大小寫的匹配，與 PostgreSQL 版本保持一致
      if (user.username && user.username.toLowerCase() === username.toLowerCase()) {
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

  async updateUserProfile(userId, profileData = {}) {
    const payload = {};

    if (Object.prototype.hasOwnProperty.call(profileData, 'displayName')) {
      payload.display_name = profileData.displayName;
    }

    if (Object.prototype.hasOwnProperty.call(profileData, 'avatarUrl')) {
      payload.avatar_url = profileData.avatarUrl;
    }

    if (Object.prototype.hasOwnProperty.call(profileData, 'techEffectUnlocked')) {
      payload.tech_effect_unlocked = profileData.techEffectUnlocked ? 'true' : 'false';
    }

    if (Object.prototype.hasOwnProperty.call(profileData, 'neonEffectUnlocked')) {
      payload.neon_effect_unlocked = profileData.neonEffectUnlocked ? 'true' : 'false';
    }

    if (!Object.keys(payload).length) {
      return await this.getUserById(userId);
    }

    await this.kv.hset(userId, payload);
    return await this.getUserById(userId);
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
    if (this._initDone) {
      return true;
    }
    if (this._initPromise) {
      return this._initPromise;
    }

    this._initPromise = (async () => {
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
          created_at: new Date().toISOString(),
          displayName: 'CRCRC'
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
        this._initDone = true;
      return true;
    } catch (error) {
      console.error('❌ KV 數據庫初始化失敗:', error);
      throw error;
      } finally {
        this._initPromise = null;
      }
    })();

    return this._initPromise;
  }
// ===== CRCRCoin - helpers =====
  walletKey(userId) {
    return `coin_wallet:${userId}`;
  }

  txKey(userId) {
    return `coin_tx:${userId}`;
  }

  passKey(userId) {
    return `coin_pass:${userId}`;
  }

  passTaskKey(userId) {
    return `coin_pass_task:${userId}`;
  }

  redeemCodeIndexKey() {
    return 'redeem_code_index';
  }

  redeemCodeSetKey() {
    return 'redeem_codes';
  }

  redeemCodeUsesKey(codeId) {
    return `redeem_code_uses:${codeId}`;
  }

  redeemCodeUseKey(useId) {
    return `redeem_code_use:${useId}`;
  }

  giftKey(giftId) {
    return `coin_gift:${giftId}`;
  }

  giftSetKey() {
    return 'coin_gifts';
  }

  backpackItemKey(itemId) {
    return `coin_backpack_item:${itemId}`;
  }

  backpackItemsKey(userId) {
    return `coin_backpack_items:${userId}`;
  }

  parsePassList(raw) {
    if (!raw) return [];
    if (Array.isArray(raw)) {
      return raw.map((item) => (item && item.toString ? item.toString() : String(item)));
    }
    try {
      const parsed = JSON.parse(raw);
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


  // ===== CRCRCoin - methods =====
  async ensureCoinWallet(userId) {
    const key = this.walletKey(userId);
    const existing = await this.kv.hgetall(key);
    if (!existing || Object.keys(existing).length === 0) {
      await this.kv.hset(key, {
        balance: 0,
        last_claim_at: null,
        updated_at: new Date().toISOString()
      });
    }
  }

  async getCoinWallet(userId) {
    const key = this.walletKey(userId);
    await this.ensureCoinWallet(userId);
    const w = await this.kv.hgetall(key);
    if (!w || Object.keys(w).length === 0) {
      return { user_id: userId, balance: 0, last_claim_at: null };
    }
    return {
      user_id: userId,
      balance: parseInt(w.balance) || 0,
      last_claim_at: w.last_claim_at || null
    };
  }

  async getCoinPass(userId) {
    const raw = await this.kv.hgetall(this.passKey(userId));
    if (!raw || Object.keys(raw).length === 0) {
      return { hasPremium: false, claimedFree: [], claimedPremium: [], xp: 0 };
    }
    const hasField = raw.has_premium;
    return this.normalizePassState({
      hasPremium: hasField === true || hasField === 'true' || hasField === 1 || hasField === '1',
      claimedFree: raw.claimed_free,
      claimedPremium: raw.claimed_premium,
      xp: raw.xp
    });
  }

  async saveCoinPass(userId, state = {}) {
    const normalized = this.normalizePassState(state);
    const payload = {
      has_premium: normalized.hasPremium ? 'true' : 'false',
      claimed_free: JSON.stringify(normalized.claimedFree),
      claimed_premium: JSON.stringify(normalized.claimedPremium),
      xp: String(normalized.xp || 0),
      updated_at: new Date().toISOString()
    };
    await this.kv.hset(this.passKey(userId), payload);
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
    const key = this.passTaskKey(userId);
    const raw = (await this.kv.hgetall(key)) || {};
    const entries = [];
    for (const [taskId, value] of Object.entries(raw)) {
      try {
        const parsed = typeof value === 'string' ? JSON.parse(value) : value || {};
        entries.push({
          task_id: taskId,
          last_completed_at: parsed.last_completed_at || null,
          completed_count: Number(parsed.completed_count) || 0
        });
      } catch {
        entries.push({ task_id: taskId, last_completed_at: null, completed_count: 0 });
      }
    }
    return entries;
  }

  async upsertPassTaskLog(userId, taskId, { timestamp = new Date(), increment = 1 } = {}) {
    const key = this.passTaskKey(userId);
    const inc = Math.max(1, Math.floor(Number(increment) || 1));
    const completedAt = timestamp instanceof Date ? timestamp : new Date(timestamp);
    let previous = null;
    try {
      const raw = await this.kv.hget(key, taskId);
      if (raw) {
        previous = typeof raw === 'string' ? JSON.parse(raw) : raw;
      }
    } catch {
      previous = null;
    }
    const completedCount = (Number(previous?.completed_count) || 0) + inc;
    const payload = {
      last_completed_at: completedAt.toISOString(),
      completed_count: completedCount
    };
    await this.kv.hset(key, { [taskId]: JSON.stringify(payload) });
    return { task_id: taskId, ...payload };
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
      updated_at: new Date().toISOString()
    });
    const txKey = this.txKey(userId);
    await this.kv.sadd(txKey, JSON.stringify({
      type: 'spend',
      amount: val,
      reason,
      created_at: new Date().toISOString()
    }));
    return { success: true, wallet: { user_id: userId, balance: newBal, last_claim_at: w.last_claim_at || null } };
  }

  async claimDaily(userId, reward = 50) {
    const key = this.walletKey(userId);
    await this.ensureCoinWallet(userId);
    const w = await this.kv.hgetall(key);
    const now = Date.now();
    const lastTs = toTimestamp(w.last_claim_at);

    if (lastTs !== null) {
      const remaining = msUntilNextTaipeiMidnight(lastTs, now);
      if (remaining > 0) {
        return { success: false, nextClaimInMs: remaining };
      }
    }

    const newBal = (parseInt(w.balance) || 0) + Math.max(0, parseInt(reward) || 0);
    const lastClaimISO = new Date(now).toISOString();
    await this.kv.hset(key, {
      balance: newBal,
      last_claim_at: lastClaimISO,
      updated_at: lastClaimISO
    });
    const txKey = this.txKey(userId);
    await this.kv.sadd(txKey, JSON.stringify({
      type: 'claim',
      amount: Math.max(0, parseInt(reward) || 0),
      reason: '每日簽到',
      created_at: lastClaimISO
    }));
    return { success: true, amount: Math.max(0, parseInt(reward) || 0), wallet: { user_id: userId, balance: newBal, last_claim_at: lastClaimISO } };
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
        updated_at: new Date().toISOString()
      });
      // 清空交易
      await this.kv.del(this.txKey(uid));
    }
    return true;
  }

  async createCoinOrder(userId, orderData) {
    const id = `coin_order:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();
    const record = {
      id,
      user_id: userId,
      product_id: orderData.product_id,
      product_name: orderData.product_name,
      price: orderData.price,
      discord_id: orderData.discord_id,
      status: orderData.status || 'pending',
      user_email: orderData.user_email || null,
      promotion_content: orderData.promotion_content || null,
      redeem_code_id: orderData.redeem_code_id || null,
      redeem_code_use_id: orderData.redeem_code_use_id || null,
      resolved_at: orderData.resolved_at || null,
      resolved_by: orderData.resolved_by || null,
      notified_at: orderData.notified_at || null,
      dismissed_at: orderData.dismissed_at || null,
      decision_note: orderData.decision_note || null,
      created_at: now
    };

    await this.kv.hset(id, record);
    await this.kv.sadd('coin_orders', id);

    return record;
  }

  async getCoinOrders(limit = 100) {
    const ids = await this.kv.smembers('coin_orders');
    const orders = [];

    for (const id of ids) {
      const order = await this.kv.hgetall(id);
      if (order && Object.keys(order).length > 0) {
        orders.push({
          id: order.id,
          user_id: order.user_id,
          product_id: order.product_id,
          product_name: order.product_name,
          price: Number(order.price) || 0,
          discord_id: order.discord_id,
          status: order.status || 'pending',
          user_email: order.user_email || null,
          promotion_content: order.promotion_content || null,
          redeem_code_id: order.redeem_code_id || null,
          redeem_code_use_id: order.redeem_code_use_id || null,
          resolved_at: order.resolved_at || null,
          resolved_by: order.resolved_by || null,
          notified_at: order.notified_at || null,
          dismissed_at: order.dismissed_at || null,
          decision_note: order.decision_note || null,
          created_at: order.created_at
        });
      }
    }

    orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const max = Math.max(1, Math.min(500, parseInt(limit) || 100));
    return orders.slice(0, max);
  }

  async getCoinOrderById(orderId) {
    if (!orderId) return null;
    const order = await this.kv.hgetall(orderId);
    if (!order || Object.keys(order).length === 0) {
      return null;
    }
    return {
      id: order.id,
      user_id: order.user_id,
      product_id: order.product_id,
      product_name: order.product_name,
      price: Number(order.price) || 0,
      discord_id: order.discord_id,
      status: order.status || 'pending',
      user_email: order.user_email || null,
      promotion_content: order.promotion_content || null,
      redeem_code_id: order.redeem_code_id || null,
      redeem_code_use_id: order.redeem_code_use_id || null,
      resolved_at: order.resolved_at || null,
      resolved_by: order.resolved_by || null,
      notified_at: order.notified_at || null,
      decision_note: order.decision_note || null,
      created_at: order.created_at
    };
  }

  async updateCoinOrderStatus(orderId, status, { adminId = null, note = null } = {}) {
    const order = await this.getCoinOrderById(orderId);
    if (!order) return null;
    const payload = {
      status,
      resolved_at: new Date().toISOString(),
      resolved_by: adminId,
      decision_note: note || null,
      notified_at: null,
      dismissed_at: null
    };
    await this.kv.hset(orderId, payload);
    return { ...order, ...payload };
  }

  async getCoinOrderNotifications(userId) {
    const ids = await this.kv.smembers('coin_orders');
    const notifications = [];
    for (const id of ids) {
      const order = await this.kv.hgetall(id);
      if (
        order &&
        order.user_id === userId &&
        order.status &&
        ['accepted', 'rejected'].includes(order.status) &&
        !order.notified_at &&
        !order.dismissed_at
      ) {
        notifications.push({
          id: order.id,
          product_id: order.product_id,
          product_name: order.product_name,
          price: Number(order.price) || 0,
          redeem_code_id: order.redeem_code_id || null,
          redeem_code_use_id: order.redeem_code_use_id || null,
          status: order.status,
          created_at: order.created_at,
          notified_at: null
        });
        await this.kv.hset(id, { notified_at: new Date().toISOString() });
      }
    }
    return notifications;
  }

  async listCoinOrderNotifications(userId) {
    const ids = await this.kv.smembers('coin_orders');
    const notifications = [];
    const nowISO = new Date().toISOString();
    for (const id of ids) {
      const order = await this.kv.hgetall(id);
      if (
        order &&
        order.user_id === userId &&
        order.status &&
        ['accepted', 'rejected'].includes(order.status) &&
        !order.dismissed_at
      ) {
        notifications.push({
          id: order.id,
          product_id: order.product_id,
          product_name: order.product_name,
          price: Number(order.price) || 0,
          redeem_code_id: order.redeem_code_id || null,
          redeem_code_use_id: order.redeem_code_use_id || null,
          status: order.status,
          created_at: order.created_at,
          notified_at: order.notified_at || null
        });
        if (!order.notified_at) {
          await this.kv.hset(id, { notified_at: nowISO });
        }
      }
    }
    notifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return notifications;
  }

  async dismissCoinOrderNotification(orderId, userId) {
    if (!orderId) return null;
    const order = await this.kv.hgetall(orderId);
    if (!order || order.user_id !== userId || order.dismissed_at) {
      return null;
    }
    const payload = { dismissed_at: new Date().toISOString() };
    await this.kv.hset(orderId, payload);
    return { id: orderId };
  }

  mapGiftRecord(raw) {
    if (!raw || Object.keys(raw).length === 0) return null;
    return {
      id: raw.id,
      sender_id: raw.sender_id,
      recipient_id: raw.recipient_id,
      product_id: raw.product_id,
      product_name: raw.product_name,
      price: Number(raw.price) || 0,
      quantity: Number(raw.quantity) || 1,
      status: raw.status,
      created_at: raw.created_at || null,
      accepted_at: raw.accepted_at || null,
      notified_at: raw.notified_at || null,
      dismissed_at: raw.dismissed_at || null
    };
  }

  mapBackpackItemRecord(raw) {
    if (!raw || Object.keys(raw).length === 0) return null;
    return {
      id: raw.id,
      user_id: raw.user_id,
      product_id: raw.product_id,
      product_name: raw.product_name,
      quantity: Number(raw.quantity) || 0,
      status: raw.status,
      source_gift_id: raw.source_gift_id || null,
      created_at: raw.created_at || null,
      used_at: raw.used_at || null
    };
  }

  async createGift(senderId, payload = {}) {
    const { recipientId, productId, productName, price = 0, quantity = 1 } = payload;
    const id = `coin_gift:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();
    const record = {
      id,
      sender_id: senderId,
      recipient_id: recipientId,
      product_id: productId,
      product_name: productName,
      price: Math.max(0, Math.floor(Number(price) || 0)),
      quantity: Math.max(1, Math.floor(Number(quantity) || 1)),
      status: 'pending',
      created_at: now,
      accepted_at: null,
      notified_at: null,
      dismissed_at: null
    };
    await this.kv.hset(this.giftKey(id), record);
    await this.kv.sadd(this.giftSetKey(), id);
    return this.mapGiftRecord(record);
  }

  async getGiftById(giftId) {
    if (!giftId) return null;
    const raw = await this.kv.hgetall(this.giftKey(giftId));
    return this.mapGiftRecord(raw);
  }

  async getGiftNotifications(userId) {
    const ids = await this.kv.smembers(this.giftSetKey());
    const notifications = [];
    const nowISO = new Date().toISOString();
    for (const id of ids) {
      const raw = await this.kv.hgetall(this.giftKey(id));
      if (
        raw &&
        raw.recipient_id === userId &&
        raw.status === 'pending' &&
        !raw.notified_at &&
        !raw.dismissed_at
      ) {
        const sender = await this.kv.hgetall(raw.sender_id);
        notifications.push({
          ...this.mapGiftRecord(raw),
          sender_display_name: sender?.display_name || null,
          sender_username: sender?.username || null,
          sender_avatar_url: sender?.avatar_url || null
        });
        await this.kv.hset(this.giftKey(id), { notified_at: nowISO });
      }
    }
    notifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return notifications;
  }

  async listGiftNotifications(userId) {
    const ids = await this.kv.smembers(this.giftSetKey());
    const notifications = [];
    const nowISO = new Date().toISOString();
    for (const id of ids) {
      const raw = await this.kv.hgetall(this.giftKey(id));
      if (
        raw &&
        raw.recipient_id === userId &&
        raw.status === 'pending' &&
        !raw.dismissed_at
      ) {
        const sender = await this.kv.hgetall(raw.sender_id);
        notifications.push({
          ...this.mapGiftRecord(raw),
          sender_display_name: sender?.display_name || null,
          sender_username: sender?.username || null,
          sender_avatar_url: sender?.avatar_url || null
        });
        if (!raw.notified_at) {
          await this.kv.hset(this.giftKey(id), { notified_at: nowISO });
        }
      }
    }
    notifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return notifications;
  }

  async createBackpackItem(userId, payload = {}) {
    const { productId, productName, quantity = 1, sourceGiftId = null } = payload;
    const id = `coin_backpack_item:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();
    const record = {
      id,
      user_id: userId,
      product_id: productId,
      product_name: productName,
      quantity: Math.max(1, Math.floor(Number(quantity) || 1)),
      status: 'available',
      source_gift_id: sourceGiftId || null,
      created_at: now,
      used_at: null
    };
    await this.kv.hset(this.backpackItemKey(id), record);
    await this.kv.sadd(this.backpackItemsKey(userId), id);
    return this.mapBackpackItemRecord(record);
  }

  async listBackpackItems(userId, { includeUsed = false } = {}) {
    const ids = await this.kv.smembers(this.backpackItemsKey(userId));
    const items = [];
    for (const id of ids) {
      const raw = await this.kv.hgetall(this.backpackItemKey(id));
      if (!raw || raw.user_id !== userId) continue;
      if (!includeUsed && raw.status !== 'available') continue;
      items.push(this.mapBackpackItemRecord(raw));
    }
    items.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return items;
  }

  async getBackpackItemById(itemId) {
    if (!itemId) return null;
    const raw = await this.kv.hgetall(this.backpackItemKey(itemId));
    return this.mapBackpackItemRecord(raw);
  }

  async acceptGift(giftId, recipientId) {
    if (!giftId || !recipientId) return null;
    const raw = await this.kv.hgetall(this.giftKey(giftId));
    if (!raw || raw.recipient_id !== recipientId || raw.status !== 'pending' || raw.dismissed_at) {
      return null;
    }
    const item = await this.createBackpackItem(recipientId, {
      productId: raw.product_id,
      productName: raw.product_name,
      quantity: Number(raw.quantity) || 1,
      sourceGiftId: raw.id
    });
    const updatePayload = {
      status: 'accepted',
      accepted_at: new Date().toISOString(),
      dismissed_at: new Date().toISOString()
    };
    await this.kv.hset(this.giftKey(giftId), updatePayload);
    const updatedGift = await this.kv.hgetall(this.giftKey(giftId));
    return { gift: this.mapGiftRecord(updatedGift), item };
  }

  async consumeBackpackItem(itemId, userId, quantity = 1) {
    if (!itemId || !userId) return null;
    const raw = await this.kv.hgetall(this.backpackItemKey(itemId));
    if (!raw || raw.user_id !== userId || raw.status !== 'available') return null;
    const qty = Math.max(1, Math.floor(Number(quantity) || 1));
    const currentQty = Math.max(0, Math.floor(Number(raw.quantity) || 0));
    if (currentQty < qty) return null;
    const nextQty = currentQty - qty;
    const payload = nextQty <= 0
      ? { quantity: 0, status: 'used', used_at: new Date().toISOString() }
      : { quantity: nextQty };
    await this.kv.hset(this.backpackItemKey(itemId), payload);
    const updated = await this.kv.hgetall(this.backpackItemKey(itemId));
    return this.mapBackpackItemRecord(updated);
  }

  mapRedeemCodeRecord(raw) {
    if (!raw || Object.keys(raw).length === 0) return null;
    return {
      id: raw.id,
      code: raw.code,
      rewardType: raw.reward_type,
      productId: raw.product_id || null,
      productName: raw.product_name || null,
      coinAmount: raw.coin_amount === null || raw.coin_amount === undefined ? null : Number(raw.coin_amount),
      maxRedemptions: Number(raw.max_redemptions) || 0,
      allowRepeat: raw.allow_repeat === true || raw.allow_repeat === 'true' || raw.allow_repeat === 1 || raw.allow_repeat === '1',
      createdBy: raw.created_by || null,
      createdAt: raw.created_at || null
    };
  }

  async createRedeemCode(payload = {}) {
    const {
      code,
      rewardType,
      productId = null,
      productName = null,
      coinAmount = null,
      maxRedemptions = 1,
      allowRepeat = false,
      createdBy = null
    } = payload;
    const id = `redeem_code:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();
    const record = {
      id,
      code,
      reward_type: rewardType,
      product_id: productId,
      product_name: productName,
      coin_amount: coinAmount,
      max_redemptions: maxRedemptions,
      allow_repeat: allowRepeat ? 'true' : 'false',
      created_by: createdBy || null,
      created_at: now
    };
    await this.kv.hset(id, record);
    await this.kv.sadd(this.redeemCodeSetKey(), id);
    await this.kv.hset(this.redeemCodeIndexKey(), { [code]: id });
    return this.mapRedeemCodeRecord(record);
  }

  async getRedeemCodeByCode(code) {
    const id = await this.kv.hget(this.redeemCodeIndexKey(), code);
    if (!id) return null;
    const raw = await this.kv.hgetall(id);
    return this.mapRedeemCodeRecord(raw);
  }

  async countRedeemCodeUses(codeId) {
    const useIds = await this.kv.smembers(this.redeemCodeUsesKey(codeId));
    return useIds.length;
  }

  async listRedeemCodes(limit = 200) {
    const ids = await this.kv.smembers(this.redeemCodeSetKey());
    const list = [];
    for (const id of ids) {
      const raw = await this.kv.hgetall(id);
      const record = this.mapRedeemCodeRecord(raw);
      if (!record) continue;
      const usedCount = await this.countRedeemCodeUses(id);
      list.push({ ...record, usedCount });
    }
    list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    const max = Math.max(1, Math.min(500, parseInt(limit, 10) || 200));
    return list.slice(0, max);
  }

  async reserveRedeemCodeUse(code, userId) {
    const redeemCode = await this.getRedeemCodeByCode(code);
    if (!redeemCode) {
      return { ok: false, error: '兌換碼不存在' };
    }

    const useIds = await this.kv.smembers(this.redeemCodeUsesKey(redeemCode.id));
    const usedCount = useIds.length;
    const maxRedemptions = Number(redeemCode.maxRedemptions) || 0;

    if (maxRedemptions > 0 && usedCount >= maxRedemptions) {
      return { ok: false, error: '兌換碼已用完' };
    }

    if (!redeemCode.allowRepeat) {
      for (const useId of useIds) {
        const rawUse = await this.kv.hgetall(this.redeemCodeUseKey(useId));
        if (rawUse && rawUse.user_id === userId) {
          return { ok: false, error: '你已兌換過此兌換碼' };
        }
      }
    }

    const useId = `redeem_use:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
    const useRecord = {
      id: useId,
      user_id: userId,
      redeemed_at: new Date().toISOString()
    };
    await this.kv.hset(this.redeemCodeUseKey(useId), useRecord);
    await this.kv.sadd(this.redeemCodeUsesKey(redeemCode.id), useId);

    return {
      ok: true,
      redeemCode,
      useId,
      usedCount: usedCount + 1
    };
  }

  async rollbackRedeemCodeUse(codeId, userId, useId) {
    if (!codeId || !useId) return false;
    const useKey = this.redeemCodeUseKey(useId);
    const rawUse = await this.kv.hgetall(useKey);
    if (!rawUse || rawUse.user_id !== userId) {
      return false;
    }
    await this.kv.del(useKey);
    await this.kv.srem(this.redeemCodeUsesKey(codeId), useId);
    return true;
  }

  // 獲取 CRCRCoin 排行榜
  async getLeaderboard(limit = 20) {
    try {
      // 獲取所有用戶
      const userIds = await this.kv.smembers('users');
      
      // 獲取所有用戶的錢包信息和用戶信息
      const usersWithBalances = [];
      
      for (const userId of userIds) {
        // 獲取用戶信息
        const user = await this.kv.hgetall(userId);
        
        // 獲取錢包信息
        const walletKey = this.walletKey(userId);
        const wallet = await this.kv.hgetall(walletKey);
        
        if (user && wallet) {
          usersWithBalances.push({
            id: userId,
            username: user.username,
            display_name: user.display_name || user.displayName,
            avatar_url: user.avatar_url || user.avatarUrl,
            balance: parseInt(wallet.balance) || 0
          });
        }
      }
      
      // 按餘額排序
      usersWithBalances.sort((a, b) => b.balance - a.balance);
      
      // 限制返回數量
      return usersWithBalances.slice(0, Math.max(1, Math.min(100, parseInt(limit) || 20)));
    } catch (error) {
      console.error('獲取排行榜失敗:', error);
      return [];
    }
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

    // 獲取所有公告
    const announcementIds = await this.kv.smembers('announcements');
    const existingSlugs = new Set();
    
    for (const announcementId of announcementIds) {
      const announcement = await this.kv.hgetall(announcementId);
      if (announcement && announcement.slug) {
        existingSlugs.add(announcement.slug);
      }
    }

    while (existingSlugs.has(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
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
    
    const announcementId = `announcement:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();
    
    const announcement = {
      id: announcementId,
      title: title.trim(),
      slug: uniqueSlug,
      content: content.trim(),
      published: Boolean(published),
      created_at: now,
      updated_at: now
    };

    await this.kv.hset(announcementId, announcement);
    await this.kv.sadd('announcements', announcementId);

    console.log('📝 創建的公告數據:', announcement);
    return announcement;
  }

  async getAnnouncements(options = {}) {
    const { published, limit } = options;

    // 獲取所有公告ID
    const announcementIds = await this.kv.smembers('announcements');
    
    // 獲取公告詳情
    const announcements = [];
    for (const announcementId of announcementIds) {
      const announcement = await this.kv.hgetall(announcementId);
      if (announcement && Object.keys(announcement).length > 0) {
        // 根據 published 參數過濾
        if (published !== undefined) {
          if (published && !announcement.published) continue;
          if (!published && announcement.published) continue;
        }
        
        announcements.push({
          id: announcement.id,
          title: announcement.title,
          slug: announcement.slug,
          content: announcement.content,
          published: announcement.published === 'true' || announcement.published === true,
          created_at: announcement.created_at,
          updated_at: announcement.updated_at
        });
      }
    }

    // 按創建時間排序（最新的在前）
    announcements.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // 限制數量
    if (limit) {
      return announcements.slice(0, parseInt(limit));
    }

    console.log('📋 資料庫查詢結果:', announcements.map(row => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      published: row.published
    })));
    
    return announcements;
  }

  async getAnnouncementBySlug(slug) {
    const announcementIds = await this.kv.smembers('announcements');
    
    for (const announcementId of announcementIds) {
      const announcement = await this.kv.hgetall(announcementId);
      if (announcement && announcement.slug === slug) {
        return {
          id: announcement.id,
          title: announcement.title,
          slug: announcement.slug,
          content: announcement.content,
          published: announcement.published === 'true' || announcement.published === true,
          created_at: announcement.created_at,
          updated_at: announcement.updated_at
        };
      }
    }
    
    console.log('📋 按 slug 查詢結果: null');
    return null;
  }

  async getAnnouncementById(id) {
    const announcement = await this.kv.hgetall(id);
    if (announcement && Object.keys(announcement).length > 0) {
      return {
        id: announcement.id,
        title: announcement.title,
        slug: announcement.slug,
        content: announcement.content,
        published: announcement.published === 'true' || announcement.published === true,
        created_at: announcement.created_at,
        updated_at: announcement.updated_at
      };
    }
    
    console.log('📋 按 ID 查詢結果: null');
    return null;
  }

  async updateAnnouncementBySlug(originalSlug, announcementData) {
    const announcementIds = await this.kv.smembers('announcements');
    let targetId = null;
    
    // 尋找匹配的公告
    for (const announcementId of announcementIds) {
      const announcement = await this.kv.hgetall(announcementId);
      if (announcement && announcement.slug === originalSlug) {
        targetId = announcementId;
        break;
      }
    }
    
    if (!targetId) {
      throw new Error('公告不存在');
    }

    const existingAnnouncement = await this.kv.hgetall(targetId);
    
    // 決定是否需要更新 slug
    let newSlug = null;
    if (announcementData.slug !== undefined || announcementData.title !== undefined) {
      const baseSlug = announcementData.slug || this.generateSlug(announcementData.title);
      newSlug = await this.ensureUniqueSlugExcluding(baseSlug, originalSlug);
    }

    // 準備更新數據
    const updateData = {
      title: announcementData.title !== undefined ? announcementData.title.trim() : existingAnnouncement.title,
      content: announcementData.content !== undefined ? announcementData.content.trim() : existingAnnouncement.content,
      published: announcementData.published !== undefined ? Boolean(announcementData.published) : existingAnnouncement.published === 'true' || existingAnnouncement.published === true,
      updated_at: new Date().toISOString()
    };
    
    if (newSlug) {
      updateData.slug = newSlug;
    }

    await this.kv.hset(targetId, updateData);
    
    const updatedAnnouncement = await this.kv.hgetall(targetId);
    
    console.log('📝 更新公告結果:', updatedAnnouncement);
    return {
      id: updatedAnnouncement.id,
      title: updatedAnnouncement.title,
      slug: updatedAnnouncement.slug,
      content: updatedAnnouncement.content,
      published: updatedAnnouncement.published === 'true' || updatedAnnouncement.published === true,
      created_at: updatedAnnouncement.created_at,
      updated_at: updatedAnnouncement.updated_at
    };
  }

  async updateAnnouncementById(id, announcementData) {
    const existingAnnouncement = await this.kv.hgetall(id);
    
    if (!existingAnnouncement || Object.keys(existingAnnouncement).length === 0) {
      throw new Error('公告不存在');
    }

    // 決定是否需要更新 slug
    let newSlug = null;
    if (announcementData.slug !== undefined || announcementData.title !== undefined) {
      const baseSlug = announcementData.slug || this.generateSlug(announcementData.title);
      newSlug = await this.ensureUniqueSlugExcluding(baseSlug, existingAnnouncement.slug);
    }

    // 準備更新數據
    const updateData = {
      title: announcementData.title !== undefined ? announcementData.title.trim() : existingAnnouncement.title,
      content: announcementData.content !== undefined ? announcementData.content.trim() : existingAnnouncement.content,
      published: announcementData.published !== undefined ? Boolean(announcementData.published) : existingAnnouncement.published === 'true' || existingAnnouncement.published === true,
      updated_at: new Date().toISOString()
    };
    
    if (newSlug) {
      updateData.slug = newSlug;
    }

    await this.kv.hset(id, updateData);
    
    const updatedAnnouncement = await this.kv.hgetall(id);
    
    console.log('📝 按ID更新公告結果:', updatedAnnouncement);
    return {
      id: updatedAnnouncement.id,
      title: updatedAnnouncement.title,
      slug: updatedAnnouncement.slug,
      content: updatedAnnouncement.content,
      published: updatedAnnouncement.published === 'true' || updatedAnnouncement.published === true,
      created_at: updatedAnnouncement.created_at,
      updated_at: updatedAnnouncement.updated_at
    };
  }

  // 確保 slug 唯一（排除特定 slug）
  async ensureUniqueSlugExcluding(baseSlug, excludeSlug) {
    let slug = baseSlug;
    let counter = 1;

    // 獲取所有公告
    const announcementIds = await this.kv.smembers('announcements');
    const existingSlugs = new Set();
    
    for (const announcementId of announcementIds) {
      const announcement = await this.kv.hgetall(announcementId);
      if (announcement && announcement.slug && announcement.slug !== excludeSlug) {
        existingSlugs.add(announcement.slug);
      }
    }

    while (existingSlugs.has(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  async deleteAnnouncementBySlug(slug) {
    const announcementIds = await this.kv.smembers('announcements');
    let targetId = null;
    
    // 尋找匹配的公告
    for (const announcementId of announcementIds) {
      const announcement = await this.kv.hgetall(announcementId);
      if (announcement && announcement.slug === slug) {
        targetId = announcementId;
        break;
      }
    }
    
    if (!targetId) {
      return null;
    }

    const deletedAnnouncement = await this.kv.hgetall(targetId);
    await this.kv.del(targetId);
    await this.kv.srem('announcements', targetId);
    
    console.log('🗑️ 刪除公告結果:', deletedAnnouncement);
    return {
      id: deletedAnnouncement.id,
      title: deletedAnnouncement.title,
      slug: deletedAnnouncement.slug,
      content: deletedAnnouncement.content,
      published: deletedAnnouncement.published === 'true' || deletedAnnouncement.published === true,
      created_at: deletedAnnouncement.created_at,
      updated_at: deletedAnnouncement.updated_at
    };
  }

  async deleteAnnouncementById(id) {
    const deletedAnnouncement = await this.kv.hgetall(id);
    
    if (!deletedAnnouncement || Object.keys(deletedAnnouncement).length === 0) {
      return null;
    }
    
    await this.kv.del(id);
    await this.kv.srem('announcements', id);
    
    console.log('🗑️ 按ID刪除公告結果:', deletedAnnouncement);
    return {
      id: deletedAnnouncement.id,
      title: deletedAnnouncement.title,
      slug: deletedAnnouncement.slug,
      content: deletedAnnouncement.content,
      published: deletedAnnouncement.published === 'true' || deletedAnnouncement.published === true,
      created_at: deletedAnnouncement.created_at,
      updated_at: deletedAnnouncement.updated_at
    };
  }
}

module.exports = new KVDatabase();
