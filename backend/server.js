const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');

const channelRoutes = require('./routes/channel');
const settingsRoutes = require('./routes/settings');
const announcementRoutes = require('./routes/announcements');
const coinRoutes = require('./routes/coin');
const database = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;

// 設置信任代理 (Vercel 需要)
app.set('trust proxy', 1);

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
  max: 100, // 限制每個 IP 15 分鐘內最多 100 個請求
  standardHeaders: true, // 返回 rate limit 信息在 `RateLimit-*` headers
  legacyHeaders: false, // 禁用 `X-RateLimit-*` headers
  trustProxy: true // 信任代理
});
app.use(limiter);

// 解析 JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 靜態文件服務
app.use('/uploads', express.static('uploads'));

// API 路由
app.use('/api/auth', authRoutes);

app.use('/api/channel', channelRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/coin', coinRoutes);

// 測試路由
app.get('/api/test', (req, res) => {
  res.json({ message: 'API 服務器正常運行', timestamp: new Date().toISOString() });
});

// 調試：添加路由檢查
console.log('🔗 已註冊的路由:');
app._router.stack.forEach((r) => {
  if (r.route && r.route.path) {
    console.log(`  ${r.route.stack[0].method.toUpperCase()} ${r.route.path}`);
  } else if (r.name === 'router') {
    console.log(`  Router middleware`);
  }
});

// 健康檢查和初始化
app.get('/api/health', async (req, res) => {
  try {
    // 嘗試初始化資料庫
    await database.initializeData();
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: 'Neon PostgreSQL Ready',
      routes: 'API routes registered'
    });
  } catch (error) {
    console.error('資料庫初始化失敗:', error);
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: 'PostgreSQL Error',
      warning: 'Database initialization failed'
    });
  }
});

// 測試 coin 路由
app.get('/api/coin/test', (req, res) => {
  res.json({ message: 'Coin API 正常運行', timestamp: new Date().toISOString() });
});

// 調試：添加請求日誌
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

// 404 處理
app.use('*', (req, res) => {
  console.log(`❌ 404 - ${req.method} ${req.path} - 找不到路由`);
  res.status(404).json({ error: 'API endpoint not found', path: req.path, method: req.method });
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