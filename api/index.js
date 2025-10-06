// Vercel API 入口點
const app = require('../backend/server');

// 確保在 Vercel 環境中正確處理請求
module.exports = (req, res) => {
  // 記錄請求信息
  console.log('📥 Vercel 收到請求:', req.method, req.url);
  
  // 將請求傳遞給 Express 應用
  return app(req, res);
};

// 同時導出 app 以支持其他用途
module.exports.default = app;