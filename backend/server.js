const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const isProd = process.env.NODE_ENV === 'production';

// 只在本地開發環境加載 .env 文件
if (!isProd) {
  require('dotenv').config();
}

const authRoutes = require('./routes/auth');

const channelRoutes = require('./routes/channel');
const settingsRoutes = require('./routes/settings');
const announcementRoutes = require('./routes/announcements');
const coinRoutes = require('./routes/coin');
const videoRoutes = require('./routes/videos');
const lyricsRoutes = require('./routes/lyrics');
const artistsRoutes = require('./routes/artists');
const lyricCommentsRoutes = require('./routes/lyricComments');
const sitemapRoutes = require('./routes/sitemap');
const database = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;

// 設置信任代理 (Vercel 需要)
app.set('trust proxy', 1);

const buildCorsOrigins = () => {
  if (!isProd) {
    return ['http://localhost:5173', 'http://localhost:3000'];
  }

  const origins = new Set();
  const frontendUrl = (process.env.FRONTEND_URL || '').trim();
  const vercelUrl = (process.env.VERCEL_URL || '').trim();

  if (frontendUrl) origins.add(frontendUrl);
  if (vercelUrl) origins.add(`https://${vercelUrl}`);

  if (!origins.size) {
    origins.add('https://officialcrcrc.vercel.app');
  }

  return Array.from(origins);
};

// 安全中間件
app.use(helmet());
app.use(cors({
  origin: buildCorsOrigins(),
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

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true
});

// 解析 JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 靜態文件服務
app.use('/uploads', express.static('uploads'));

// API 路由
console.log('🔧 註冊 API 路由...');
app.use('/api/auth', authLimiter, authRoutes);
console.log('✅ /api/auth 路由已註冊');
app.use('/api/channel', channelRoutes);
console.log('✅ /api/channel 路由已註冊');
app.use('/api/settings', settingsRoutes);
console.log('✅ /api/settings 路由已註冊');
app.use('/api/announcements', announcementRoutes);
console.log('✅ /api/announcements 路由已註冊');
app.use('/api/coin', coinRoutes);
console.log('✅ /api/coin 路由已註冊');
app.use('/api/videos', videoRoutes);
console.log('✅ /api/videos 路由已註冊');
app.use('/api/artists', artistsRoutes);
console.log('✅ /api/artists 路由已註冊');
app.use('/api/lyrics', lyricsRoutes);
console.log('✅ /api/lyrics 路由已註冊');
app.use('/api', lyricCommentsRoutes);
app.use('/api', sitemapRoutes);
console.log('✅ /api (lyric comments) 路由已註冊');
app.use('/', sitemapRoutes);
console.log('✅ sitemap 路由已註冊');

// 健康檢查和初始化
app.get('/api/health', async (req, res) => {
  try {
    // 嘗試初始化資料庫
    await database.initializeData();
  } catch (error) {
    if (!isProd) {
      console.error('資料庫初始化失敗:', error);
    }
    return res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: 'error'
    });
  }

  if (isProd) {
    return res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: 'ok'
    });
  }

  try {
    // 檢查所有可能的資料庫環境變數
    const dbEnvVars = {
      DATABASE_URL: !!process.env.DATABASE_URL,
      POSTGRES_URL: !!process.env.POSTGRES_URL,
      POSTGRES_PRISMA_URL: !!process.env.POSTGRES_PRISMA_URL,
      POSTGRES_URL_NON_POOLING: !!process.env.POSTGRES_URL_NON_POOLING,
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_DB_URL: !!process.env.SUPABASE_DB_URL
    };

    // 檢查使用的資料庫類型
    let databaseType = 'Unknown';
    const activeDbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;

    if (activeDbUrl) {
      if (activeDbUrl.includes('neon')) {
        databaseType = 'Neon PostgreSQL';
      } else if (activeDbUrl.includes('supabase')) {
        databaseType = 'Supabase PostgreSQL';
      } else {
        databaseType = 'PostgreSQL';
      }
    } else {
      databaseType = 'Development KV Database (記憶體模式 - 會重置)';
    }

    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: databaseType,
      envVars: dbEnvVars
    });
  } catch (error) {
    console.error('資料庫初始化失敗:', error);
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: 'Database Error',
      warning: 'Database initialization failed'
    });
  }
});

// 404 處理
app.use('*', (req, res) => {
  console.log('❌ 404 - 找不到路由:', req.method, req.originalUrl || req.url);
  res.status(404).json({ error: 'API endpoint not found', path: req.originalUrl || req.url });
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
if (!isProd) {
  app.listen(PORT, () => {
    console.log(`🚀 CRCRC 後端服務器運行在 http://localhost:${PORT}`);
    console.log(`📊 API 文檔: http://localhost:${PORT}/api/health`);
  });
}

// 導出 app 供 Vercel 使用
module.exports = app;
