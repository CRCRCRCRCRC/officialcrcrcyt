const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// 簡單的記憶體存儲（生產環境應該使用資料庫）
let announcements = [
  {
    id: '1',
    title: '歡迎來到 CRCRC 官方網站！',
    content: '# 歡迎！\n\n感謝您訪問我們的官方網站。我們將在這裡發布最新的**空耳音樂作品**和重要公告。\n\n## 最新功能\n- 🎵 線上播放器\n- 📱 響應式設計\n- 🔔 公告系統\n\n敬請期待更多精彩內容！',
    createdAt: new Date('2024-01-15').toISOString(),
    updatedAt: new Date('2024-01-15').toISOString(),
    published: true
  },
  {
    id: '2', 
    title: '新影片發布通知',
    content: '## 🎉 新作品上線\n\n我們剛剛發布了一首全新的空耳音樂作品！\n\n### 特色\n- 高品質音效\n- 創意歌詞改編\n- 精美視覺效果\n\n快去**影片庫**查看吧！',
    createdAt: new Date('2024-01-20').toISOString(),
    updatedAt: new Date('2024-01-20').toISOString(),
    published: true
  },
  {
    id: '3',
    title: '網站功能更新',
    content: '### 🔧 系統更新\n\n我們對網站進行了以下改進：\n\n1. **播放器優化** - 更流暢的播放體驗\n2. **介面美化** - 全新的視覺設計\n3. **效能提升** - 更快的載入速度\n\n感謝您的支持！',
    createdAt: new Date('2024-01-25').toISOString(),
    updatedAt: new Date('2024-01-25').toISOString(),
    published: true
  }
];

let nextId = 4;

// 獲取所有公告（公開API）
router.get('/', async (req, res) => {
  try {
    const { limit, published } = req.query;
    
    let filteredAnnouncements = announcements.filter(announcement => {
      // 如果沒有指定 published 參數，返回所有公告（管理員視圖）
      if (published === undefined) return true;
      // 如果 published='false'，返回所有公告
      if (published === 'false') return true;
      // 如果 published='true'，只返回已發布的公告
      return announcement.published;
    });
    
    // 按創建時間倒序排列
    filteredAnnouncements.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    if (limit) {
      filteredAnnouncements = filteredAnnouncements.slice(0, parseInt(limit));
    }
    
    res.json({
      announcements: filteredAnnouncements,
      total: filteredAnnouncements.length
    });
  } catch (error) {
    console.error('獲取公告失敗:', error);
    res.status(500).json({ error: '無法獲取公告' });
  }
});

// 獲取單個公告（公開API）
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const announcement = announcements.find(a => a.id === id);
    
    if (!announcement) {
      return res.status(404).json({ error: '公告不存在' });
    }
    
    if (!announcement.published) {
      return res.status(404).json({ error: '公告不存在' });
    }
    
    res.json(announcement);
  } catch (error) {
    console.error('獲取公告失敗:', error);
    res.status(500).json({ error: '無法獲取公告' });
  }
});

// 創建公告（需要管理員權限）
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, content, published = true } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: '標題和內容不能為空' });
    }
    
    const newAnnouncement = {
      id: nextId.toString(),
      title: title.trim(),
      content: content.trim(),
      published: Boolean(published),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    announcements.push(newAnnouncement);
    nextId++;
    
    res.status(201).json(newAnnouncement);
  } catch (error) {
    console.error('創建公告失敗:', error);
    res.status(500).json({ error: '無法創建公告' });
  }
});

// 更新公告（需要管理員權限）
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, published } = req.body;
    
    const announcementIndex = announcements.findIndex(a => a.id === id);
    if (announcementIndex === -1) {
      return res.status(404).json({ error: '公告不存在' });
    }
    
    if (title !== undefined) announcements[announcementIndex].title = title.trim();
    if (content !== undefined) announcements[announcementIndex].content = content.trim();
    if (published !== undefined) announcements[announcementIndex].published = Boolean(published);
    announcements[announcementIndex].updatedAt = new Date().toISOString();
    
    res.json(announcements[announcementIndex]);
  } catch (error) {
    console.error('更新公告失敗:', error);
    res.status(500).json({ error: '無法更新公告' });
  }
});

// 刪除公告（需要管理員權限）
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const announcementIndex = announcements.findIndex(a => a.id === id);
    
    if (announcementIndex === -1) {
      return res.status(404).json({ error: '公告不存在' });
    }
    
    announcements.splice(announcementIndex, 1);
    res.json({ message: '公告已刪除' });
  } catch (error) {
    console.error('刪除公告失敗:', error);
    res.status(500).json({ error: '無法刪除公告' });
  }
});

module.exports = router;
