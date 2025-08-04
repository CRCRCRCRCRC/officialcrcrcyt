const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const videoRoutes = require('./routes/videos');
const channelRoutes = require('./routes/channel');

const app = express();
const PORT = process.env.PORT || 3001;

// 安全中間件
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL || 'https://your-vercel-app.vercel.app'] 
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分鐘
  max: 100 // 限制每個 IP 15 分鐘內最多 100 個請求
});
app.use(limiter);

// 解析 JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 靜態文件服務
app.use('/uploads', express.static('uploads'));

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/channel', channelRoutes);

// 健康檢查
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 處理
app.use('*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// 錯誤處理中間件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message 
  });
});

// 本地開發時啟動服務器
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 CRCRC 後端服務器運行在 http://localhost:${PORT}`);
    console.log(`📊 API 文檔: http://localhost:${PORT}/api/health`);
  });
}

// 導出 app 供 Vercel 使用
module.exports = app;