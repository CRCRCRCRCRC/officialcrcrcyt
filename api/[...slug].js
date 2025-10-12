const path = require('path');
const app = require(path.join(__dirname, '..', 'backend', 'server'));

module.exports = (req, res) => {
  // Vercel 會把 /api 開頭的路由導到這裡，這裡只是橋接到 Express app
  const originalUrl = req.url || '';

  // 補上 /api 前綴，確保跟 Express 設定一致
  if (!originalUrl.startsWith('/api')) {
    req.url = '/api' + originalUrl;
  }

  return app(req, res);
};
