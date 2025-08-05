const { Redis } = require('@upstash/redis');

class UpstashDatabase {
  constructor() {
    // 初始化 Upstash Redis 連接
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }

  // 用戶相關操作
  async createUser(userData) {
    const userId = `user:${Date.now()}`;
    await this.redis.hset(userId, userData);
    await this.redis.sadd('users', userId);
    return userId;
  }

  async getUserByUsername(username) {
    const userIds = await this.redis.smembers('users');
    for (const userId of userIds) {
      const user = await this.redis.hgetall(userId);
      if (user.username === username) {
        return { id: userId, ...user };
      }
    }
    return null;
  }

  async getUserById(userId) {
    const user = await this.redis.hgetall(userId);
    return user ? { id: userId, ...user } : null;
  }

  async updateUser(userId, userData) {
    await this.redis.hset(userId, userData);
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
    await this.redis.hset(videoId, video);
    await this.redis.sadd('videos', videoId);
    
    // 如果是精選影片，加入精選列表
    if (videoData.is_featured) {
      await this.redis.sadd('featured_videos', videoId);
    }
    
    return videoId;
  }

  async getVideos(options = {}) {
    const { featured, limit, offset } = options;
    let videoIds;
    
    if (featured) {
      videoIds = await this.redis.smembers('featured_videos');
    } else {
      videoIds = await this.redis.smembers('videos');
    }
    
    // 獲取影片詳情
    const videos = [];
    for (const videoId of videoIds) {
      const video = await this.redis.hgetall(videoId);
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
    const video = await this.redis.hgetall(videoId);
    return video ? { id: videoId, ...video } : null;
  }

  async updateVideo(videoId, videoData) {
    const updatedData = {
      ...videoData,
      updated_at: new Date().toISOString()
    };
    
    // 更新影片數據
    await this.redis.hset(videoId, updatedData);
    
    // 更新精選狀態
    if (videoData.is_featured) {
      await this.redis.sadd('featured_videos', videoId);
    } else {
      await this.redis.srem('featured_videos', videoId);
    }
    
    return true;
  }

  async deleteVideo(videoId) {
    await this.redis.del(videoId);
    await this.redis.srem('videos', videoId);
    await this.redis.srem('featured_videos', videoId);
    return true;
  }

  // 頻道資訊操作
  async getChannelInfo() {
    const channelInfo = await this.redis.hgetall('channel_info');
    return channelInfo || {};
  }

  async updateChannelInfo(channelData) {
    const updatedData = {
      ...channelData,
      updated_at: new Date().toISOString()
    };
    await this.redis.hset('channel_info', updatedData);
    return true;
  }

  // 網站設置操作
  async getSiteSetting(key) {
    return await this.redis.hget('site_settings', key);
  }

  async setSiteSetting(key, value) {
    await this.redis.hset('site_settings', { [key]: value });
    return true;
  }

  async getAllSiteSettings() {
    return await this.redis.hgetall('site_settings') || {};
  }

  // 統計數據
  async getStats() {
    const videoIds = await this.redis.smembers('videos');
    const featuredIds = await this.redis.smembers('featured_videos');
    
    let totalViews = 0;
    for (const videoId of videoIds) {
      const video = await this.redis.hgetall(videoId);
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
      const users = await this.redis.smembers('users');
      
      if (users.length === 0) {
        console.log('📝 創建默認管理員用戶...');
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
        
        await this.createUser({
          username: process.env.ADMIN_USERNAME || 'admin',
          password: hashedPassword,
          role: 'admin',
          created_at: new Date().toISOString()
        });
        
        console.log('✅ 默認管理員用戶創建成功');
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
          total_views: 0,
          created_at: new Date().toISOString()
        });
        console.log('✅ 默認頻道資訊創建成功');
      }

      // 檢查是否已有示例影片
      const videos = await this.getVideos();
      
      if (videos.length === 0) {
        console.log('📝 創建示例影片數據...');
        
        const sampleVideos = [
          {
            title: "ILLIT - 'Billyeoon Goyangi (Do The Dance)' 空耳版《捅隻鳥》",
            description: "ILLIT 的熱門歌曲空耳版本，歡迎大家在留言區分享空耳歌詞！",
            youtube_id: "sample_video_1",
            thumbnail_url: "https://img.youtube.com/vi/sample_video_1/maxresdefault.jpg",
            duration: "3:25",
            view_count: "88",
            published_at: new Date().toISOString(),
            is_featured: "1",
            tags: "ILLIT,空耳,K-pop,舞蹈"
          },
          {
            title: "i-dle - 'Good Thing' 空耳版《把椅子固定》",
            description: "(G)I-DLE 的經典歌曲空耳版本",
            youtube_id: "sample_video_2",
            thumbnail_url: "https://img.youtube.com/vi/sample_video_2/maxresdefault.jpg",
            duration: "3:12",
            view_count: "156",
            published_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            is_featured: "1",
            tags: "(G)I-DLE,空耳,K-pop"
          },
          {
            title: "izna - 'SIGN' 空耳版《買火雞》",
            description: "izna 的最新歌曲空耳版本",
            youtube_id: "sample_video_3",
            thumbnail_url: "https://img.youtube.com/vi/sample_video_3/maxresdefault.jpg",
            duration: "3:45",
            view_count: "203",
            published_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            is_featured: "0",
            tags: "izna,空耳,K-pop"
          }
        ];

        for (const video of sampleVideos) {
          await this.createVideo(video);
        }
        
        console.log('✅ 示例影片數據創建成功');
      }

      // 設置默認網站設置
      const siteSettings = await this.getAllSiteSettings();
      
      if (!siteSettings.site_title) {
        console.log('📝 創建默認網站設置...');
        await this.setSiteSetting('site_title', 'CRCRC 官方網站');
        await this.setSiteSetting('site_description', '專業製作空耳音樂影片的 YouTube 頻道');
        await this.setSiteSetting('contact_email', 'contact@crcrc.com');
        await this.setSiteSetting('featured_video_count', '6');
        console.log('✅ 默認網站設置創建成功');
      }

      console.log('🎉 Upstash Redis 數據庫初始化完成！');
      return true;
    } catch (error) {
      console.error('❌ Upstash Redis 數據庫初始化失敗:', error);
      throw error;
    }
  }
}

module.exports = new UpstashDatabase();