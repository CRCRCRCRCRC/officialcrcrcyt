// 資料庫配置
// 開發環境使用 KV 數據庫，生產環境使用 Neon PostgreSQL

if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
  const database = require('./neon');
  console.log('🔗 資料庫: Neon PostgreSQL');
  module.exports = database;
} else {
  // 開發環境或沒有設置 DATABASE_URL 時使用 KV 數據庫
  console.log('🔗 資料庫: 開發模式 - 使用內存數據庫');

  // 創建一個模擬的 KV 數據庫
  const mockKV = {
    data: new Map(),
    sets: new Map(),

    async hset(key, data) {
      if (!this.data.has(key)) {
        this.data.set(key, new Map());
      }
      const hash = this.data.get(key);
      if (typeof data === 'object') {
        Object.entries(data).forEach(([k, v]) => hash.set(k, v));
      }
      return true;
    },

    async hgetall(key) {
      const hash = this.data.get(key);
      if (!hash) return {};
      const result = {};
      hash.forEach((value, key) => {
        result[key] = value;
      });
      return result;
    },

    async hget(key, field) {
      const hash = this.data.get(key);
      return hash ? hash.get(field) : null;
    },

    async sadd(key, value) {
      if (!this.sets.has(key)) {
        this.sets.set(key, new Set());
      }
      this.sets.get(key).add(value);
      return true;
    },

    async smembers(key) {
      const set = this.sets.get(key);
      return set ? Array.from(set) : [];
    },

    async srem(key, value) {
      const set = this.sets.get(key);
      if (set) {
        set.delete(value);
      }
      return true;
    },

    async del(key) {
      this.data.delete(key);
      this.sets.delete(key);
      return true;
    }
  };

  const database = require('./kv');
  // 替換 KV 實例
  database.kv = mockKV;
  module.exports = database;
}