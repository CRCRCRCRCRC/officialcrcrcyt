# YouTube API 設置指南

## 🎯 概述

本指南將幫助你設置 YouTube API，讓 CRCRC 官網能夠自動從你的 YouTube 頻道獲取最新數據。

## 📋 前置需求

1. Google 帳號
2. YouTube 頻道 (https://youtube.com/@officialcrcrcyt)
3. Google Cloud Console 存取權限

## 🚀 設置步驟

### 步驟 1: 創建 Google Cloud 項目

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 點擊「選擇項目」→「新增項目」
3. 輸入項目名稱：`CRCRC-Website`
4. 點擊「建立」

### 步驟 2: 啟用 YouTube Data API v3

1. 在 Google Cloud Console 中，前往「API 和服務」→「程式庫」
2. 搜尋「YouTube Data API v3」
3. 點擊進入並點擊「啟用」

### 步驟 3: 創建 API 金鑰

1. 前往「API 和服務」→「憑證」
2. 點擊「+ 建立憑證」→「API 金鑰」
3. 複製生成的 API 金鑰
4. 點擊「限制金鑰」進行安全設置：
   - 應用程式限制：選擇「HTTP 參照網址」
   - 新增你的網域（例如：`*.yourdomain.com/*`）
   - API 限制：選擇「限制金鑰」，然後選擇「YouTube Data API v3」
5. 點擊「儲存」

### 步驟 4: 配置環境變數

1. 在 `backend/.env` 文件中添加：

```env
# YouTube API 設定
YOUTUBE_API_KEY=你的API金鑰
YOUTUBE_CHANNEL_ID=UCYour-Channel-ID-Here
YOUTUBE_CHANNEL_HANDLE=officialcrcrcyt
```

### 步驟 5: 測試配置

1. 在 backend 目錄中運行測試腳本：

```bash
cd backend
node test-youtube.js
```

2. 如果測試成功，你會看到：
   - ✅ 頻道信息獲取成功
   - ✅ 成功獲取影片列表
   - ✅ 影片統計數據

3. 複製測試輸出中的頻道 ID，並更新 `.env` 文件

## 🔧 功能說明

### 已集成的頁面

1. **儀表板主頁** (`/admin/dashboard`)
   - 自動顯示 YouTube 頻道統計
   - 最新影片列表
   - 即時數據刷新

2. **網站首頁** (`/`)
   - 頻道統計數據
   - 精選影片展示
   - 自動從 YouTube 獲取

3. **影片頁面** (`/videos`)
   - 顯示 YouTube 最新影片
   - 自動同步影片信息

4. **管理員影片頁面** (`/admin/videos`)
   - YouTube 影片管理
   - 一鍵同步功能

### API 端點

- `GET /api/channel/dashboard` - 獲取儀表板數據
- `GET /api/channel/youtube-data` - 獲取 YouTube 頻道數據

## 🎨 特色功能

### 自動回退機制
- 優先使用 YouTube API 數據
- API 不可用時自動回退到本地數據
- 用戶體驗無縫切換

### 即時刷新
- 儀表板和管理頁面都有「刷新數據」按鈕
- 一鍵同步最新 YouTube 數據

### 數據格式化
- 自動格式化觀看數、訂閱數
- 智能顯示發布時間
- 響應式縮圖顯示

## 🔍 故障排除

### 常見問題

1. **API 金鑰無效**
   - 檢查 API 金鑰是否正確複製
   - 確認 YouTube Data API v3 已啟用

2. **找不到頻道**
   - 確認頻道 handle 是否正確 (`officialcrcrcyt`)
   - 檢查頻道是否為公開狀態

3. **配額超限**
   - YouTube API 有每日配額限制
   - 可在 Google Cloud Console 查看使用情況

4. **CORS 錯誤**
   - 確認 API 金鑰的 HTTP 參照網址設置正確

### 測試命令

```bash
# 測試 YouTube API 連接
cd backend
node test-youtube.js

# 檢查環境變數
echo $YOUTUBE_API_KEY
echo $YOUTUBE_CHANNEL_HANDLE
```

## 📊 API 配額管理

YouTube Data API v3 的免費配額：
- 每日 10,000 單位
- 每次 API 調用消耗不同單位數
- 建議實施快取機制以節省配額

## 🔐 安全建議

1. **API 金鑰安全**
   - 不要將 API 金鑰提交到版本控制
   - 定期輪換 API 金鑰
   - 設置適當的 API 限制

2. **環境隔離**
   - 開發和生產環境使用不同的 API 金鑰
   - 設置不同的配額限制

## 📞 支援

如果遇到問題，請檢查：
1. Google Cloud Console 中的錯誤日誌
2. 瀏覽器開發者工具的網路標籤
3. 後端服務器日誌

---

設置完成後，你的 CRCRC 官網將能夠：
- 🔄 自動同步 YouTube 數據
- 📊 顯示即時統計信息
- 🎬 展示最新影片內容
- 📱 提供響應式用戶體驗
