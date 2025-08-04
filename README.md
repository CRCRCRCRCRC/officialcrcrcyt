# CRCRC 官方網站

CRCRC YouTube 頻道的官方網站，展示空耳音樂作品和頻道資訊。

## 功能特色

- 🎵 影片展示和管理
- 🎨 現代化響應式設計
- 🔐 後台管理系統
- 📱 手機端適配
- 🚀 快速載入

## 技術棧

- **前端**: React 18 + Vite + Tailwind CSS
- **後端**: Node.js + Express
- **資料庫**: SQLite
- **認證**: JWT Token

## 快速開始

### 安裝依賴
```bash
npm run install:all
```

### 開發模式
```bash
npm run dev
```

### 生產建置
```bash
npm run build
```

## 項目結構

```
├── frontend/          # React 前端應用
├── backend/           # Node.js 後端 API
├── database/          # SQLite 資料庫文件
└── docs/             # 文檔
```

## 部署

### Vercel 部署

本項目已配置為可直接部署到 Vercel：

1. Fork 此倉庫到你的 GitHub
2. 在 [Vercel](https://vercel.com) 導入項目
3. 配置環境變數（參考 `.env.example`）
4. 部署完成！

詳細部署指南請參考 [DEPLOYMENT.md](./DEPLOYMENT.md)

### 環境變數

生產環境需要配置以下環境變數：
- `JWT_SECRET`: JWT 密鑰
- `ADMIN_USERNAME`: 管理員用戶名
- `ADMIN_PASSWORD`: 管理員密碼
- `FRONTEND_URL`: 前端域名

## 聯繫方式

- 📧 Email: contact@crcrc.com
- 🌐 Website: https://crcrc.com
- 📱 Discord: CRCRC Community