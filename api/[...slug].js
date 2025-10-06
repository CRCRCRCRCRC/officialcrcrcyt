const app = require('../backend/server');

module.exports = (req, res) => {
  // Vercel 會將 /api/coin/grant 路由到這裡
  // req.url 可能是 /coin/grant 或 /api/coin/grant
  const originalUrl = req.url || '';
  
  console.log('========================================');
  console.log('🔍 Vercel Serverless Function 被調用');
  console.log('Method:', req.method);
  console.log('Original URL:', originalUrl);
  console.log('========================================');
  
  // 確保 URL 有 /api 前綴
  if (!originalUrl.startsWith('/api')) {
    req.url = '/api' + originalUrl;
    console.log('✅ 補上前綴:', req.url);
  }
  
  // 將請求傳給 Express app
  return app(req, res);
};
