const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const database = require('../config/database');

// 獲取所有公告（公開API）
router.get('/', async (req, res) => {
  try {
    const { limit, published } = req.query;

    console.log('獲取公告請求:', { limit, published });

    // 構建查詢選項
    const options = {};

    if (published === 'true') {
      options.published = true;
    } else if (published === 'false') {
      // 管理員視圖，獲取所有公告
      // 不設置 published 參數
    }

    if (limit) {
      options.limit = parseInt(limit);
    }

    const announcements = await database.getAnnouncements(options);

    console.log('返回公告:', {
      count: announcements.length,
      announcements: announcements.map(a => ({
        slug: a.slug,
        title: a.title,
        published: a.published,
        created_at: a.created_at,
        updated_at: a.updated_at
      }))
    });

    // 設置緩存控制頭，防止瀏覽器緩存
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.json({
      announcements: announcements,
      total: announcements.length
    });
  } catch (error) {
    console.error('獲取公告失敗:', error);
    res.status(500).json({ error: '無法獲取公告' });
  }
});

// 獲取單個公告（公開API）- 只支援 slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const announcement = await database.getAnnouncementBySlug(slug);

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
    const { title, content, slug, published = true } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: '標題和內容不能為空' });
    }

    const announcementData = {
      title: title.trim(),
      content: content.trim(),
      slug: slug ? slug.trim() : undefined,
      published: Boolean(published)
    };

    const newAnnouncement = await database.createAnnouncement(announcementData);

    res.status(201).json(newAnnouncement);
  } catch (error) {
    console.error('創建公告失敗:', error);
    if (error.message.includes('duplicate key')) {
      res.status(400).json({ error: 'URL 路徑已存在，請使用不同的路徑' });
    } else {
      res.status(500).json({ error: '無法創建公告' });
    }
  }
});

// 更新公告（需要管理員權限）
router.put('/:slug', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { slug: originalSlug } = req.params;
    const { title, content, slug, published } = req.body;

    const existingAnnouncement = await database.getAnnouncementBySlug(originalSlug);
    if (!existingAnnouncement) {
      return res.status(404).json({ error: '公告不存在' });
    }

    const announcementData = {
      title: title !== undefined ? title.trim() : existingAnnouncement.title,
      content: content !== undefined ? content.trim() : existingAnnouncement.content,
      slug: slug !== undefined ? (slug ? slug.trim() : undefined) : undefined,
      published: published !== undefined ? Boolean(published) : existingAnnouncement.published
    };

    const updatedAnnouncement = await database.updateAnnouncementBySlug(originalSlug, announcementData);

    res.json(updatedAnnouncement);
  } catch (error) {
    console.error('更新公告失敗:', error);
    if (error.message.includes('duplicate key')) {
      res.status(400).json({ error: 'URL 路徑已存在，請使用不同的路徑' });
    } else {
      res.status(500).json({ error: '無法更新公告' });
    }
  }
});

// 刪除公告（需要管理員權限）
router.delete('/:slug', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { slug } = req.params;
    console.log('刪除公告請求:', { slug });

    const deletedAnnouncement = await database.deleteAnnouncementBySlug(slug);

    if (!deletedAnnouncement) {
      console.log('公告不存在:', slug);
      return res.status(404).json({ error: '公告不存在' });
    }

    console.log('公告已刪除:', {
      deletedSlug: slug,
      deletedTitle: deletedAnnouncement.title
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

    // 刪除所有公告
    await database.pool.query('DELETE FROM announcements');
    // 重置序列
    await database.pool.query('ALTER SEQUENCE announcements_id_seq RESTART WITH 1');

    console.log('重置完成：所有公告已清空');
    res.json({ message: '所有公告已清空', count: 0 });
  } catch (error) {
    console.error('重置公告失敗:', error);
    res.status(500).json({ error: '無法重置公告' });
  }
});

module.exports = router;
