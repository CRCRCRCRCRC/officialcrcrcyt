# CRCRC 網站部署問題修復指南

## 🔍 問題診斷

您的網站在 Vercel 上遇到 500 內部伺服器錯誤，主要原因是：

1. **依賴項問題**：根目錄缺少後端依賴項
2. **Vercel 配置問題**：API 路由配置不正確
3. **環境變數未設置**：缺少必要的環境變數

## ✅ 已修復的問題

### 1. 更新了 `package.json`
- 將後端依賴項添加到根目錄
- 確保 Vercel 可以找到所有必要的模組

### 2. 修復了 `vercel.json`
- 更正了 API 路由配置
- 優化了建置命令順序

## 🚀 部署步驟

### 1. 設置環境變數
在 Vercel 專案設置中添加以下環境變數：

```bash
DATABASE_URL=your_neon_postgresql_url
JWT_SECRET=your_secure_jwt_secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
NODE_ENV=production
FRONTEND_URL=https://officialcrcrcyt.vercel.app
```

### 2. 重新部署
```bash
git add .
git commit -m "修復 Vercel 部署配置"
git push origin main
```

## 🔧 環境變數設置說明

### DATABASE_URL
- 從 Neon Console 獲取 PostgreSQL 連接字串
- 格式：`postgresql://username:password@hostname/database`

### JWT_SECRET
- 用於 JWT token 簽名的密鑰
- 建議使用強密碼生成器生成

### ADMIN_USERNAME / ADMIN_PASSWORD
- 管理員登入憑證
- 首次部署時會自動創建此用戶

## 📝 測試步驟

部署完成後，測試以下端點：

1. **健康檢查**：`https://officialcrcrcyt.vercel.app/api/health`
2. **登入測試**：使用設置的管理員憑證登入

## ⚠️ 注意事項

1. 確保 Neon PostgreSQL 資料庫已創建並可訪問
2. 所有環境變數都必須在 Vercel 中正確設置
3. 首次部署可能需要幾分鐘來初始化資料庫

## 🆘 如果仍有問題

檢查 Vercel 函數日誌：
1. 進入 Vercel Dashboard
2. 選擇您的專案
3. 查看 "Functions" 標籤頁的錯誤日誌