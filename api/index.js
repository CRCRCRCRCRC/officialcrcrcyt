// Vercel API 入口點
const app = require('../backend/server');

// 處理所有 /api/* 請求
module.exports = (req, res) => {
  try {
    // 確保 URL 包含 /api 前綴
    const originalUrl = req.url || '';
    if (!originalUrl.startsWith('/api')) {
      req.url = '/api' + (originalUrl.startsWith('/') ? originalUrl : '/' + originalUrl);
    }
    
    console.log('🔍 Vercel API 請求:', {
      method: req.method,
      originalUrl: originalUrl,
      processedUrl: req.url
    });
    
    return app(req, res);
  } catch (e) {
    console.error('❌ Vercel API 入口處理錯誤:', e);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Internal Server Error' }));
  }
};