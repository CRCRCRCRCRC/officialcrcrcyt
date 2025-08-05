# Vercel KV 資料庫設置指南

## 步驟 1: 在 Vercel 中創建 KV 資料庫

1. 登入 [Vercel Dashboard](https://vercel.com/dashboard)
2. 進入你的專案頁面
3. 點擊 "Storage" 標籤
4. 點擊 "Create Database"
5. 選擇 "KV" 資料庫類型
6. 輸入資料庫名稱（例如：`crcrc-kv`）
7. 選擇地區（建議選擇與你的部署地區相同）
8. 點擊 "Create"

## 步驟 2: 獲取 KV 連接資訊

1. 在創建的 KV 資料庫頁面中，點擊 "Settings" 標籤
2. 在 "Connection" 部分，你會看到：
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
3. 複製這些值

## 步驟 3: 設置環境變數

1. 在 Vercel 專案設置中，進入 "Environment Variables" 標籤
2. 添加以下環境變數：

```
KV_REST_API_URL=你的_kv_rest_api_url
KV_REST_API_TOKEN=你的_kv_rest_api_token
JWT_SECRET=你的_jwt_密鑰（隨機字符串）
ADMIN_USERNAME=admin
ADMIN_PASSWORD=你的_安全密碼
FRONTEND_URL=https://你的專案名稱.vercel.app
NODE_ENV=production
```

## 步驟 4: 重新部署

設置完環境變數後，觸發一次重新部署：
1. 推送任何變更到 GitHub，或
2. 在 Vercel Dashboard 中手動觸發部署

## 步驟 5: 驗證設置

部署完成後，訪問 `https://你的專案名稱.vercel.app/api/health` 來檢查資料庫連接狀態。

如果設置正確，你應該會看到：
```json
{
  "status": "OK",
  "timestamp": "...",
  "database": "KV Ready"
}
```

## 注意事項

- KV 資料庫會在首次訪問時自動初始化默認數據
- 默認管理員帳號將使用你設置的 `ADMIN_USERNAME` 和 `ADMIN_PASSWORD`
- 確保 `JWT_SECRET` 是一個強隨機字符串
- 所有環境變數都必須在 Vercel 中設置，不要將敏感資訊提交到 Git