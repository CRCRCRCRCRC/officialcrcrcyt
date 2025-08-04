# Vercel 部署配置總結

## 已完成的配置更改

### 1. 核心配置文件

#### `vercel.json`
- 配置了前端靜態構建和後端 serverless 函數
- 設置了路由規則：API 請求轉發到後端，其他請求轉發到前端
- 配置了環境變數和函數超時時間

#### `.gitignore`
- 排除了 node_modules、構建文件、環境變數等不需要提交的文件
- 包含了 Vercel 特定的排除項

#### `.env.example`
- 提供了環境變數範例，方便部署時參考

### 2. 後端調整

#### `backend/server.js`
- 修改了服務器啟動邏輯，只在非生產環境啟動 HTTP 服務器
- 添加了 `module.exports = app` 供 Vercel serverless 函數使用
- 更新了 CORS 配置，支持動態前端 URL

#### 環境變數支持
- 支持 `FRONTEND_URL` 環境變數用於 CORS 配置
- 保持了所有現有的環境變數配置

### 3. 前端調整

#### `package.json` (根目錄)
- 添加了 `vercel-build` 腳本用於 Vercel 構建

#### `frontend/vite.config.js`
- 添加了 `process.env.NODE_ENV` 定義，確保環境變數正確傳遞

### 4. 自動化部署

#### `.github/workflows/deploy.yml`
- 配置了 GitHub Actions 自動部署到 Vercel
- 包含了依賴安裝、構建和部署步驟

### 5. 文檔

#### `DEPLOYMENT.md`
- 詳細的部署指南
- 環境變數配置說明
- 故障排除指南

#### `README.md`
- 更新了部署相關信息
- 添加了環境變數說明

## 部署步驟

### 1. 推送到 GitHub
```bash
git add .
git commit -m "準備 Vercel 部署"
git push origin main
```

### 2. 在 Vercel 創建項目
1. 訪問 [vercel.com](https://vercel.com)
2. 點擊 "New Project"
3. 選擇你的 GitHub 倉庫
4. 使用以下設置：
   - **Framework Preset**: Other
   - **Root Directory**: `./`
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: `frontend/dist`

### 3. 配置環境變數
在 Vercel 項目設置中添加：
```
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-here
DB_PATH=/tmp/database.sqlite
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-admin-password
FRONTEND_URL=https://your-app-name.vercel.app
```

### 4. 部署完成後
1. 更新 `FRONTEND_URL` 為實際的 Vercel 域名
2. 訪問 `/admin/login` 進行首次登入
3. 開始添加內容

## 重要注意事項

### 資料庫限制
- Vercel serverless 函數使用 `/tmp` 目錄，每次部署會重置
- 建議生產環境使用外部資料庫（PlanetScale、Supabase 等）

### 環境變數安全
- 確保 `JWT_SECRET` 使用強密碼
- 不要在代碼中硬編碼敏感信息
- 定期更換管理員密碼

### 域名配置
- 部署後記得更新 `FRONTEND_URL` 環境變數
- 如使用自定義域名，需要在 Vercel 中配置 DNS

## 故障排除

### 常見問題
1. **構建失敗**: 檢查 Node.js 版本和依賴
2. **API 請求失敗**: 檢查 CORS 和環境變數配置
3. **資料庫錯誤**: 確認 DB_PATH 和權限設置

### 檢查清單
- [ ] 所有環境變數已正確設置
- [ ] GitHub 倉庫已推送最新代碼
- [ ] Vercel 構建設置正確
- [ ] CORS 域名配置正確
- [ ] 管理員帳號可以正常登入

## 後續優化建議

1. **資料庫升級**: 遷移到外部資料庫服務
2. **CDN 優化**: 配置圖片和靜態資源 CDN
3. **監控設置**: 添加錯誤監控和性能追蹤
4. **備份策略**: 實施定期資料備份
5. **安全加固**: 添加更多安全中間件和驗證

---

配置完成！你的 CRCRC 官網現在已經準備好部署到 Vercel 了。