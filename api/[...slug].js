const app = require('../backend/server');

module.exports = (req, res) => {
  // Vercel 通配符路由：/api/coin/grant → req.url = /coin/grant
  // 需要補回 /api 前綴
  const originalUrl = req.url || '';
  
  if (!originalUrl.startsWith('/api')) {
    req.url = '/api' + originalUrl;
  }
  
  console.log('🔍 [slug] 路由:', req.method, originalUrl, '→', req.url);
  
  return app(req, res);
};
