// Vercel KV 資料庫配置
// 必須設置 KV_REST_API_URL 和 KV_REST_API_TOKEN 環境變數

if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  throw new Error('❌ 必須設置 Vercel KV 環境變數: KV_REST_API_URL 和 KV_REST_API_TOKEN');
}

const database = require('./kv');
console.log('🔗 資料庫: Vercel KV');

module.exports = database;