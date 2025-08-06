# 🚀 Vercel 部署指南 - YouTube API 集成

## 📋 概述

你的 CRCRC 官網已經完全集成了 YouTube API，現在需要在 Vercel 上設置環境變數來啟用 YouTube 數據同步。

## 🔧 Vercel 環境變數設置

### 1. 進入 Vercel 儀表板

1. 前往 [Vercel Dashboard](https://vercel.com/dashboard)
2. 選擇你的 CRCRC 項目
3. 點擊 **Settings** 標籤
4. 在左側選單中點擊 **Environment Variables**

### 2. 添加 YouTube API 環境變數

添加以下環境變數（適用於 Production, Preview, Development）：

#### YouTube API 變數（必需）：
```
YOUTUBE_API_KEY = 你的YouTube API金鑰
YOUTUBE_CHANNEL_ID = 你的頻道ID
YOUTUBE_CHANNEL_HANDLE = officialcrcrcyt
```

#### 其他必需變數：
```
JWT_SECRET = your-super-secret-jwt-key-change-this-in-production
ADMIN_USERNAME = admin
ADMIN_PASSWORD = admin123
NODE_ENV = production
```

### 3. 設置步驟

1. 點擊 **Add New** 按鈕
2. 輸入變數名稱（例如：`YOUTUBE_CHANNEL_HANDLE`）
3. 輸入變數值（例如：`officialcrcrcyt`）
4. 選擇環境：**Production**, **Preview**, **Development**（全選）
5. 點擊 **Save**
6. 重複以上步驟添加所有變數

## 🎯 YouTube API 設置（可選但推薦）

如果你想要顯示真實的 YouTube 數據而不是模擬數據，請按照以下步驟：

### 步驟 1: 獲取 YouTube API 金鑰

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 創建新項目或選擇現有項目
3. 啟用 **YouTube Data API v3**
4. 創建 **API 金鑰**
5. 設置 API 金鑰限制（推薦）

### 步驟 2: 在 Vercel 中添加 API 金鑰

```
YOUTUBE_API_KEY = 你從Google Cloud獲得的API金鑰
```

### 步驟 3: 獲取頻道 ID（可選）

如果你知道頻道 ID，可以直接設置：
```
YOUTUBE_CHANNEL_ID = UC你的頻道ID
```

如果不知道，系統會自動通過 handle 獲取。

## 🔄 重新部署

設置完環境變數後：

1. 前往 Vercel 項目的 **Deployments** 標籤
2. 點擊最新部署旁的 **⋯** 按鈕
3. 選擇 **Redeploy**
4. 等待部署完成

## ✅ 驗證部署

部署完成後，你的網站將會：

### 設置了 YouTube API 金鑰和頻道 ID：
- ✅ 顯示真實的 YouTube 頻道統計數據
- ✅ 展示最新的 YouTube 影片
- ✅ 即時同步觀看數、點讚數等
- ✅ 所有數據直接來自 YouTube API

## 📊 功能驗證清單

訪問你的 Vercel 網站並檢查：

### 主頁 (`/`)
- [ ] 頻道統計數據顯示正確
- [ ] 精選影片區域有內容
- [ ] 數據格式化正確（K/M 格式）

### 儀表板 (`/admin/dashboard`)
- [ ] 登錄後能看到統計卡片
- [ ] 最新影片列表顯示
- [ ] 刷新按鈕功能正常

### 影片頁面 (`/videos`)
- [ ] 影片列表正常顯示
- [ ] 縮圖和統計數據正確

### 管理員影片頁面 (`/admin/videos`)
- [ ] 同步 YouTube 按鈕存在
- [ ] 影片管理界面正常

## 🔍 故障排除

### 如果看到模擬數據而不是真實數據：

1. **檢查環境變數**
   - 確認 `YOUTUBE_API_KEY` 已正確設置
   - 確認 `YOUTUBE_CHANNEL_HANDLE` 設置為 `officialcrcrcyt`

2. **檢查 API 金鑰**
   - 確認 YouTube Data API v3 已啟用
   - 確認 API 金鑰有效且未過期
   - 檢查 API 配額是否充足

3. **檢查部署日誌**
   - 在 Vercel 的 Functions 標籤中查看錯誤日誌
   - 查找 YouTube API 相關的錯誤信息

### 常見錯誤解決：

**API key not valid**
- 重新生成 API 金鑰
- 檢查 API 金鑰的限制設置

**Channel not found**
- 確認頻道 handle 拼寫正確
- 確認頻道為公開狀態

**Quota exceeded**
- 等待配額重置（每日重置）
- 考慮申請更高的配額

## 🎉 完成！

設置完成後，你的 CRCRC 官網將能夠：

- 🔄 自動同步 YouTube 頻道數據
- 📊 顯示即時統計信息
- 🎬 展示最新影片內容
- 📱 提供響應式用戶體驗
- ⚡ 直接從 YouTube API 獲取最新數據

你的網站現在完全依賴 YouTube API 提供真實、即時的數據！

---

⚠️ **重要**: 必須正確設置 YouTube API 金鑰和頻道 ID，否則網站將無法載入數據。
