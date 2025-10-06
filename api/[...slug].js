const app = require('../backend/server');

module.exports = async (req, res) => {
  try {
    // Vercel 通配符路由：/api/coin/grant → req.url = /coin/grant
    const originalUrl = req.url || '';
    
    // 補回 /api 前綴讓 Express 路由匹配
    if (!originalUrl.startsWith('/api')) {
      req.url = '/api' + originalUrl;
    }
    
    console.log('🔍 Vercel Function 收到請求:', {
      method: req.method,
      originalUrl,
      processedUrl: req.url,
      headers: req.headers
    });
    
    return app(req, res);
  } catch (error) {
    console.error('❌ Vercel Function 錯誤:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};
