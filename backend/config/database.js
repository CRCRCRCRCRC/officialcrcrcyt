// 資料庫配置
console.log('========================================');
console.log('🔧 資料庫配置檢查');
console.log('========================================');

// 列出所有可能的資料庫環境變數
const allEnvVars = Object.keys(process.env).filter(key =>
  key.includes('DATABASE') ||
  key.includes('POSTGRES') ||
  key.includes('SUPABASE') ||
  key.includes('DB')
);

console.log('📋 找到的資料庫相關環境變數:', allEnvVars.length > 0 ? allEnvVars : '無');
allEnvVars.forEach(key => {
  const value = process.env[key];
  const preview = value ? `${value.substring(0, 30)}...` : '[EMPTY]';
  console.log(`  ${key}: ${preview}`);
});

// 支援多種 Vercel Supabase 整合的環境變數名稱
const primaryDbKeys = [
  'DATABASE_URL',
  'POSTGRES_URL',
  'POSTGRES_PRISMA_URL',
  'POSTGRES_URL_NON_POOLING',
  'DB_CONNECTION_STRING',
  'DB_URL',
  'SUPABASE_DB_URL',
  'SUPABASE_DB_CONNECTION_STRING',
  'SUPABASE_POSTGRES_URL',
  'SUPABASE_CONNECTION_STRING',
  'SUPABASE_PG_URL',
  'SUPABASE_DB'
];

let dbUrl = null;
let dbUrlKey = null;

for (const key of primaryDbKeys) {
  const value = process.env[key];
  if (typeof value === 'string' && value.trim()) {
    dbUrl = value.trim();
    dbUrlKey = key;
    break;
  }
}

if (!dbUrl) {
  for (const key of allEnvVars) {
    const value = process.env[key];
    if (typeof value === 'string' && /^postgres(ql)?:\/\//i.test(value.trim())) {
      dbUrl = value.trim();
      dbUrlKey = key;
      break;
    }
  }
}

const connectionLogMessage = dbUrl && dbUrlKey
  ? '已找到 (' + dbUrlKey + ')'
  : '未找到';
console.log('🎯 選擇的資料庫 URL:', connectionLogMessage);

const allowKvFallback = process.env.ALLOW_KV_FALLBACK === 'true';
const isProdLike = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

if (!dbUrl && isProdLike && !allowKvFallback) {
  console.error('❌ 在 production/VERCEL 環境找不到 PostgreSQL 連線字串，拒絕改用暫存 KV。');
  throw new Error('Missing PostgreSQL connection string. Set DATABASE_URL or related env.');
}

if (dbUrl) {
  // 調整成用真正的資料庫
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = dbUrl;
  }

  const database = require('./neon');
  console.log('✅ 使用 PostgreSQL 資料庫');
  console.log('   主機:', dbUrl.split('@')[1]?.split(':')[0] || '未知');
  console.log('========================================');
  module.exports = database;
} else {
  // 開發環境才允許使用暫存 KV
  console.log('🔗 資料庫: 開發模式 - 使用內存數據庫');
  console.log('  提示: 要使用 PostgreSQL 資料庫，請設置 DATABASE_URL 環境變數');

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
      hash.forEach((value, key) => { result[key] = value; });
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
      if (set) set.delete(value);
      return true;
    },

    async del(key) {
      this.data.delete(key);
      this.sets.delete(key);
      return true;
    }
  };

  const database = require('./kv');
  database.kv = mockKV;
  module.exports = database;
}
