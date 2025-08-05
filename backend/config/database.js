// Neon PostgreSQL 資料庫配置
// 必須設置 DATABASE_URL 環境變數

if (!process.env.DATABASE_URL) {
  throw new Error('❌ 必須設置 Neon PostgreSQL 環境變數: DATABASE_URL');
}

const database = require('./neon');
console.log('🔗 資料庫: Neon PostgreSQL');

module.exports = database;