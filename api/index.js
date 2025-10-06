// Vercel API 入口點
const app = require('../backend/server');

// 直接導出 Express 應用
// Vercel 會自動將其包裝為無伺服器函數
module.exports = app;