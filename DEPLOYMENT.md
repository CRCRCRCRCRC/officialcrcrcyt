# CRCRC 官網部署指南

## Vercel 部署步驟

### 1. 準備工作

1. 確保你的代碼已推送到 GitHub 倉庫
2. 註冊 [Vercel](https://vercel.com) 帳號
3. 連接你的 GitHub 帳號到 Vercel
4. **環境變數設定**: 在 Vercel 中設定所需的環境變數

### 2. 部署到 Vercel

1. 在 Vercel 控制台點擊 "New Project"
2. 選擇你的 GitHub 倉庫
3. 配置項目設置：
   - **Framework Preset**: Other
   - **Root Directory**: `./` (保持默認)
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: `frontend/dist`

### 3. 環境變數配置

在 Vercel 項目設置中添加以下環境變數：

```
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-here
DB_PATH=/tmp/database.sqlite
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-admin-password
FRONTEND_URL=https://your-app-name.vercel.app
```

**重要提醒**：
- `JWT_SECRET` 請使用強密碼
- `ADMIN_PASSWORD` 請設置安全的管理員密碼
- `FRONTEND_URL` 替換為你的實際 Vercel 域名

### 4. 資料庫注意事項

由於 Vercel 的 serverless 特性，SQLite 資料庫會在每次部署時重置。對於生產環境，建議：

1. **使用外部資料庫**（推薦）：
   - [PlanetScale](https://planetscale.com/) (MySQL)
   - [Supabase](https://supabase.com/) (PostgreSQL)
   - [Railway](https://railway.app/) (PostgreSQL/MySQL)

2. **或者使用 Vercel KV**：
   - 適合簡單的鍵值存儲需求

### 5. 自定義域名（可選）

1. 在 Vercel 項目設置中點擊 "Domains"
2. 添加你的自定義域名
3. 按照指示配置 DNS 記錄

### 6. 部署後設置

1. 訪問 `https://your-app.vercel.app/admin/login`
2. 使用設置的管理員帳號登入
3. 開始添加影片內容

## 本地開發

```bash
# 安裝依賴
npm run install:all

# 初始化資料庫
cd backend && node scripts/initDatabase.js

# 啟動開發服務器
npm run dev
```

## 故障排除

### 常見問題

1. **API 請求失敗**
   - 檢查 CORS 設置
   - 確認環境變數正確配置

2. **資料庫連接失敗**
   - 檢查 DB_PATH 環境變數
   - 確認資料庫文件權限

3. **構建失敗**
   - 檢查 Node.js 版本兼容性
   - 確認所有依賴已正確安裝

### 聯繫支援

如遇到部署問題，請檢查：
1. Vercel 部署日誌
2. 瀏覽器開發者工具控制台
3. 網絡請求狀態

---

**注意**：首次部署後，記得更新 `backend/server.js` 中的 CORS 配置，將 `your-vercel-app.vercel.app` 替換為你的實際域名。