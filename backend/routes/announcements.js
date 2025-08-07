const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// 簡單的記憶體存儲（生產環境應該使用資料庫）
// 初始化為空陣列，避免每次重啟都有示例數據
let announcements = [];
let nextId = 1;

// 獲取所有公告（公開API）
router.get('/', async (req, res) => {
  try {
    const { limit, published } = req.query;

    console.log('獲取公告請求:', {
      limit,
      published,
      totalAnnouncements: announcements.length,
      announcements: announcements.map(a => ({ id: a.id, title: a.title, published: a.published }))
    });

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

    console.log('返回公告:', {
      filtered: filteredAnnouncements.length,
      announcements: filteredAnnouncements.map(a => ({ id: a.id, title: a.title }))
    });

    // 設置緩存控制頭，防止瀏覽器緩存
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

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
    console.log('刪除公告請求:', { id, 當前公告數量: announcements.length });

    const announcementIndex = announcements.findIndex(a => a.id === id);

    if (announcementIndex === -1) {
      console.log('公告不存在:', id);
      return res.status(404).json({ error: '公告不存在' });
    }

    const deletedAnnouncement = announcements[announcementIndex];
    announcements.splice(announcementIndex, 1);

    console.log('公告已刪除:', {
      deletedId: id,
      deletedTitle: deletedAnnouncement.title,
      剩餘公告數量: announcements.length
    });

    res.json({ message: '公告已刪除' });
  } catch (error) {
    console.error('刪除公告失敗:', error);
    res.status(500).json({ error: '無法刪除公告' });
  }
});

// 重置所有公告（僅用於測試，需要管理員權限）
router.post('/reset', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('重置公告：清空所有公告');
    announcements.length = 0; // 清空陣列
    nextId = 1; // 重置 ID 計數器
    console.log('重置完成：公告數量 =', announcements.length);
    res.json({ message: '所有公告已清空', count: announcements.length });
  } catch (error) {
    console.error('重置公告失敗:', error);
    res.status(500).json({ error: '無法重置公告' });
  }
});

module.exports = router;
