// 統一的資料庫配置文件
// 自動選擇可用的資料庫：Upstash Redis > Vercel KV > SQLite

let database;

try {
  // 優先使用 Upstash Redis
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    database = require('./upstash');
    console.log('🔗 資料庫: Upstash Redis');
  } 
  // 備用 Vercel KV
  else if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    database = require('./kv');
    console.log('🔗 資料庫: Vercel KV');
  }
  // 最後備用：使用 KV 的本地模擬
  else {
    console.log('⚠️ 未找到雲端資料庫配置，使用 KV 備用模式');
    database = require('./kv');
  }
} catch (error) {
  console.error('❌ 資料庫初始化失敗:', error.message);
  // 使用 KV 作為最終備用
  try {
    database = require('./kv');
    console.log('🔄 使用 KV 備用資料庫');
  } catch (kvError) {
    console.error('❌ 所有資料庫配置都失敗:', kvError.message);
    // 創建一個空的資料庫對象以防止應用崩潰
    database = {
      initializeData: async () => { throw new Error('No database available'); },
      getUserByUsername: async () => null,
      getUserById: async () => null,
      createUser: async () => null,
      updateUser: async () => null,
      getVideos: async () => [],
      getVideoById: async () => null,
      createVideo: async () => null,
      updateVideo: async () => null,
      deleteVideo: async () => null,
      getChannelInfo: async () => ({}),
      updateChannelInfo: async () => null,
      getSiteSetting: async () => null,
      setSiteSetting: async () => null,
      getAllSiteSettings: async () => ({}),
      getStats: async () => ({ total_videos: 0, featured_videos: 0, total_views: 0, subscriber_count: 0 })
    };
  }
}

module.exports = database;