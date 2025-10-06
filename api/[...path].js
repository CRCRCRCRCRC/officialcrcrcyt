// Vercel API 通配符路由
// 這個文件會捕獲所有 /api/* 的請求
const app = require('../backend/server');

// 直接導出 Express 應用
module.exports = app;
