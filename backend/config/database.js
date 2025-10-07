// 資料庫配置
// 支援多種環境變數名稱（Vercel Supabase 整合可能使用不同名稱）

console.log('🔧 環境變數檢查:');
console.log('  DATABASE_URL:', process.env.DATABASE_URL ? '[SET]' : '[NOT SET]');
console.log('  POSTGRES_URL:', process.env.POSTGRES_URL ? '[SET]' : '[NOT SET]');
console.log('  POSTGRES_PRISMA_URL:', process.env.POSTGRES_PRISMA_URL ? '[SET]' : '[NOT SET]');
console.log('  NODE_ENV:', process.env.NODE_ENV || '[NOT SET]');

// 支援多種 Vercel Supabase 整合的環境變數名稱
const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;

if (dbUrl) {
  // 設定統一的環境變數供 neon.js 使用
  process.env.DATABASE_URL = dbUrl;
  
  const database = require('./neon');
  console.log('🔗 資料庫: PostgreSQL (Supabase/Neon)');
  console.log('  連接字串主機:', dbUrl.split('@')[1]?.split(':')[0] || '未知');
  module.exports = database;
} else {
  // 開發環境或沒有設置 DATABASE_URL 時使用 KV 數據庫
  console.log('🔗 資料庫: 開發模式 - 使用內存數據庫');
  console.log('  提示: 要使用 PostgreSQL 資料庫，請設置 DATABASE_URL 環境變數');

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