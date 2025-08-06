# 🔧 HTML 實體編碼修復

## 🐛 問題描述

在 YouTube API 返回的數據中，影片標題和描述可能包含 HTML 實體編碼，例如：
- `&#39;` 代表單引號 `'`
- `&quot;` 代表雙引號 `"`
- `&amp;` 代表 & 符號
- `&lt;` 代表 < 符號
- `&gt;` 代表 > 符號

這會導致影片標題顯示為類似 `"我的影片&#39;s 標題"` 而不是 `"我的影片's 標題"`。

## ✅ 解決方案

### 後端修復 (`backend/services/youtube.js`)

添加了 `decodeHtmlEntities` 函數來解碼常見的 HTML 實體：

```javascript
function decodeHtmlEntities(text) {
  if (!text) return text;
  
  const entities = {
    '&#39;': "'",
    '&quot;': '"',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&nbsp;': ' ',
    '&#x27;': "'",
    '&#x2F;': '/',
    '&#x60;': '`',
    '&#x3D;': '='
  };
  
  return text.replace(/&#?\w+;/g, (entity) => {
    return entities[entity] || entity;
  });
}
```

### 前端雙重保護

在每個前端頁面也添加了解碼函數作為額外保護：

```javascript
const decodeHtmlEntities = (text) => {
  if (!text) return text;
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}
```

## 📊 修復的頁面

### ✅ 後端 API
- `getChannelStats()` - 頻道標題和描述
- `getChannelVideos()` - 影片標題和描述

### ✅ 前端頁面
- **儀表板** (`/admin/dashboard`) - 影片標題
- **首頁** (`/`) - 影片標題和描述
- **影片頁面** (`/videos`) - 影片標題和描述
- **管理員影片頁面** (`/admin/videos`) - 影片標題和描述

## 🔍 支援的 HTML 實體

| HTML 實體 | 字符 | 說明 |
|-----------|------|------|
| `&#39;` | `'` | 單引號 |
| `&#x27;` | `'` | 單引號（十六進制） |
| `&quot;` | `"` | 雙引號 |
| `&amp;` | `&` | & 符號 |
| `&lt;` | `<` | 小於號 |
| `&gt;` | `>` | 大於號 |
| `&nbsp;` | ` ` | 不間斷空格 |
| `&#x2F;` | `/` | 斜線 |
| `&#x60;` | `` ` `` | 反引號 |
| `&#x3D;` | `=` | 等號 |

## 🎯 效果

### 修復前：
```
【空耳】我的影片&#39;s 標題 &amp; 描述
```

### 修復後：
```
【空耳】我的影片's 標題 & 描述
```

## 🔄 自動處理

現在所有從 YouTube API 獲取的文字內容都會自動：
1. 在後端 API 層面進行解碼
2. 在前端顯示層面進行二次檢查
3. 確保用戶看到正確的文字內容

## 📝 注意事項

- 這個修復是向後兼容的，不會影響現有功能
- 支援最常見的 HTML 實體編碼
- 前端使用瀏覽器原生的解碼方法作為備用
- 如果遇到新的 HTML 實體，可以輕鬆添加到後端的 entities 對象中

---

🎉 **現在你的 YouTube 影片標題和描述將正確顯示，不再有奇怪的 HTML 編碼！**
