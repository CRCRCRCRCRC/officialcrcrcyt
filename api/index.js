const app = require('../backend/server');

module.exports = (req, res) => {
  // Vercel 會將 /api/coin/grant 轉成 req.url = /coin/grant
  // 需要補回 /api 前綴讓 Express 路由匹配
  const originalUrl = req.url || '';
  
  if (!originalUrl.startsWith('/api')) {
    req.url = '/api' + originalUrl;
  }
  
  console.log('🔍 API 入口:', req.method, originalUrl, '→', req.url);
  
  return app(req, res);
};