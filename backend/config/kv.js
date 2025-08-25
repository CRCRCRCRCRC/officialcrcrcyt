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
          description: '創作空耳與荒野亂鬥內容的頻道，歡迎訂閱，一起玩音樂玩遊戲！',
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
        await this.setSiteSetting('site_description', '創作空耳與荒野亂鬥內容的頻道，歡迎訂閱，一起玩音樂玩遊戲！');
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
}

module.exports = new KVDatabase();