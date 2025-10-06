// Vercel API 入口點
const app = require('../backend/server');

// Vercel 無伺服器函數處理器
module.exports = async (req, res) => {
  // 記錄請求信息以便調試
  console.log('📥 Vercel 函數收到請求:', {
    method: req.method,
    url: req.url,
    path: req.path,
    originalUrl: req.originalUrl
  });
  
  // 將請求傳遞給 Express 應用處理
  return app(req, res);
};