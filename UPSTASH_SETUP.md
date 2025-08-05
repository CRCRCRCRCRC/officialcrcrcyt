# Upstash Redis 設置指南

## 🎯 為什麼選擇 Upstash Redis？

Upstash Redis 是一個無伺服器 Redis 服務，非常適合 Vercel 部署：
- ✅ 免費額度充足
- ✅ 與 Vercel 完美整合
- ✅ 自動擴展
- ✅ 低延遲
- ✅ 簡單設置

## 📋 設置步驟

### 步驟 1: 在 Vercel 中創建 Upstash Redis

1. 登入 [Vercel Dashboard](https://vercel.com/dashboard)
2. 進入你的專案 `officialcrcrcyt`
3. 點擊 **"Storage"** 標籤
4. 點擊 **"Create Database"**
5. 選擇 **"Upstash"** → **"Serverless DB (Redis, Vector, Queue)"**
6. 輸入資料庫名稱（例如：`crcrc-redis`）
7. 選擇地區（建議選擇與你的部署地區相同）
8. 點擊 **"Create"**

### 步驟 2: 獲取連接資訊

創建完成後，Vercel 會自動設置以下環境變數：
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

### 步驟 3: 設置其他環境變數

在 Vercel 專案設置的 **"Environment Variables"** 中添加：

```
JWT_SECRET=你的隨機字符串（例如：abc123xyz789）
ADMIN_USERNAME=admin
ADMIN_PASSWORD=你的安全密碼
FRONTEND_URL=https://officialcrcrcyt.vercel.app
NODE_ENV=production
```

### 步驟 4: 重新部署

設置完環境變數後，Vercel 會自動重新部署。

## 🔍 驗證設置

部署完成後，訪問以下 URL 來檢查資料庫連接：
```
https://officialcrcrcyt.vercel.app/api/health
```

如果設置正確，你應該會看到：
```json
{
  "status": "OK",
  "timestamp": "...",
  "database": "Upstash Redis Ready"
}
```

## 🎉 完成！

設置完成後，你的網站將：
- ✅ 自動初始化示例數據
- ✅ 創建默認管理員帳號
- ✅ 支援所有功能（影片管理、用戶認證等）

## 🔧 故障排除

如果遇到問題：

1. **檢查環境變數**：確保所有必要的環境變數都已設置
2. **查看部署日誌**：在 Vercel Dashboard 中檢查部署日誌
3. **測試 API**：訪問 `/api/health` 端點檢查狀態

## 💡 備用方案

如果 Upstash 不可用，系統會自動回退到 Vercel KV。你也可以按照 `VERCEL_KV_SETUP.md` 的指南設置 Vercel KV 作為備用。