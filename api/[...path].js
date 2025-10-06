// Vercel API 通配符路由
// 這個文件會捕獲所有 /api/* 的請求
const app = require('../backend/server');

// 為了讓 Express 內的路由能匹配到 /api/coin/...，
// 需要在 Vercel 函數中將進入的 URL 自動補上 /api 前綴
module.exports = (req, res) => {
  try {
    const originalUrl = req.url || '';
    // 在 Vercel 的通配函數下，req.url 可能是 "/coin/grant"，
    // 但 Express 內部路由註冊為 "/api/coin/..."；因此需補上前綴
    if (!originalUrl.startsWith('/api')) {
      req.url = '/api' + (originalUrl.startsWith('/') ? originalUrl : '/' + originalUrl);
    }
    return app(req, res);
  } catch (e) {
    console.error('Vercel API 入口處理錯誤:', e);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
};
