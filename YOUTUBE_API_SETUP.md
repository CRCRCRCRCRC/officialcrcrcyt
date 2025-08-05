# YouTube API 設置指南

## 🔍 當前問題

YouTube API 沒有起作用的原因：

1. **缺少 YouTube Channel ID** - 環境變數中沒有設置
2. **缺少 YouTube API Key** - 或者 API Key 無效
3. **資料庫查詢語法錯誤** - 已修復

## 🚀 設置步驟

### 1. 獲取 YouTube API Key

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 創建新專案或選擇現有專案
3. 啟用 **YouTube Data API v3**
4. 創建 API 憑證 (API Key)
5. 限制 API Key 只能使用 YouTube Data API v3

### 2. 獲取 YouTube Channel ID

有幾種方法獲取頻道 ID：

#### 方法 1：從頻道 URL
如果您的頻道 URL 是：`https://youtube.com/@officialcrcrcyt`

使用這個工具：https://commentpicker.com/youtube-channel-id.php

#### 方法 2：從 YouTube Studio
1. 登入 YouTube Studio
2. 在左側選單點擊「設定」
3. 選擇「頻道」→「進階設定」
4. 複製「頻道 ID」

#### 方法 3：檢查頁面原始碼
1. 前往您的頻道頁面
2. 查看頁面原始碼
3. 搜尋 `"channelId"`

### 3. 在 Vercel 中設置環境變數

在 Vercel 專案設置中添加：

```bash
YOUTUBE_API_KEY=your_actual_api_key_here
YOUTUBE_CHANNEL_ID=your_actual_channel_id_here
```

## 🧪 測試 YouTube API

部署後，您可以測試以下端點：

### 1. 測試頻道資訊
```bash
GET https://officialcrcrcyt.vercel.app/api/channel/info
```

**成功響應**（使用 YouTube API）：
```json
{
  "subscriberCount": "1234",
  "viewCount": "56789",
  "videoCount": "42",
  "title": "CRCRC",
  "description": "頻道描述...",
  "thumbnails": { ... }
}
```

**回退響應**（使用資料庫）：
```json
{
  "subscriberCount": 0,
  "viewCount": 0,
  "videoCount": 0,
  "title": "CRCRC",
  "description": "專業製作空耳音樂影片的 YouTube 頻道",
  "thumbnails": {}
}
```

### 2. 測試統計數據
```bash
GET https://officialcrcrcyt.vercel.app/api/channel/stats
```

## 🔧 已修復的問題

1. ✅ **修復 channel.js 中的 SQLite 語法**
   - 改用 `database.updateChannelInfo()`
   - 改用 `database.getAllSiteSettings()`
   - 改用 `database.setSiteSetting()`

2. ✅ **添加 YouTube Channel ID 環境變數**
   - 更新 `.env.example`
   - 提供獲取方法

## ⚠️ 注意事項

1. **API 配額限制**：YouTube Data API 有每日配額限制
2. **回退機制**：如果 API 失敗，系統會使用資料庫數據
3. **即時更新**：YouTube API 數據是即時的，資料庫數據需要手動更新

## 🎯 預期效果

設置完成後：

- ✅ 首頁會顯示真實的訂閱者數量
- ✅ 頻道統計會顯示真實的觀看次數
- ✅ 可以獲取最新的影片列表
- ✅ 頻道資訊會自動同步

## 🆘 故障排除

如果 YouTube API 仍然不工作：

1. **檢查 Vercel 函數日誌**
2. **確認 API Key 有效**
3. **確認 Channel ID 正確**
4. **檢查 API 配額是否用完**

測試 API Key 是否有效：
```bash
curl "https://www.googleapis.com/youtube/v3/channels?part=snippet&id=YOUR_CHANNEL_ID&key=YOUR_API_KEY"
```