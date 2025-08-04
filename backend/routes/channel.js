const express = require('express');
const database = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// 獲取頻道資訊（公開）
router.get('/info', async (req, res) => {
  try {
    const channelInfo = await database.query(
      'SELECT * FROM channel_info ORDER BY id DESC LIMIT 1'
    );

    if (channelInfo.length === 0) {
      // 返回默認頻道資訊
      return res.json({
        channel_name: 'CRCRC',
        description: '專業製作空耳音樂影片的 YouTube 頻道',
        youtube_url: 'https://youtube.com/@officialcrcrcyt',
        discord_url: 'https://discord.gg/FyrNaF6Nbj',
        minecraft_discord_url: 'https://discord.gg/9jBCTheX3Y',
        subscriber_count: 0,
        total_views: 0
      });
    }

    res.json(channelInfo[0]);
  } catch (error) {
    console.error('獲取頻道資訊錯誤:', error);
    res.status(500).json({ error: '服務器內部錯誤' });
  }
});

// 獲取網站統計數據（公開）
router.get('/stats', async (req, res) => {
  try {
    // 獲取影片總數
    const videoCountResult = await database.query(
      'SELECT COUNT(*) as total FROM videos'
    );
    const videoCount = videoCountResult[0].total;

    // 獲取總觀看次數
    const viewCountResult = await database.query(
      'SELECT SUM(view_count) as total FROM videos'
    );
    const totalViews = viewCountResult[0].total || 0;

    // 獲取精選影片數量
    const featuredCountResult = await database.query(
      'SELECT COUNT(*) as total FROM videos WHERE is_featured = 1'
    );
    const featuredCount = featuredCountResult[0].total;

    // 獲取最新影片
    const latestVideos = await database.query(
      'SELECT * FROM videos ORDER BY published_at DESC LIMIT 3'
    );

    res.json({
      videoCount,
      totalViews,
      featuredCount,
      latestVideos
    });
  } catch (error) {
    console.error('獲取統計數據錯誤:', error);
    res.status(500).json({ error: '服務器內部錯誤' });
  }
});

// 更新頻道資訊（需要管理員權限）
router.put('/info', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      channel_name,
      description,
      subscriber_count,
      total_views,
      youtube_url,
      discord_url,
      minecraft_discord_url,
      banner_image,
      avatar_image
    } = req.body;

    // 檢查是否已有頻道資訊
    const existingInfo = await database.query(
      'SELECT id FROM channel_info ORDER BY id DESC LIMIT 1'
    );

    if (existingInfo.length === 0) {
      // 新增頻道資訊
      await database.run(
        `INSERT INTO channel_info (
          channel_name, description, subscriber_count, total_views,
          youtube_url, discord_url, minecraft_discord_url, banner_image, avatar_image
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          channel_name, description, subscriber_count, total_views,
          youtube_url, discord_url, minecraft_discord_url, banner_image, avatar_image
        ]
      );
    } else {
      // 更新頻道資訊
      await database.run(
        `UPDATE channel_info SET 
          channel_name = ?, description = ?, subscriber_count = ?, total_views = ?,
          youtube_url = ?, discord_url = ?, minecraft_discord_url = ?,
          banner_image = ?, avatar_image = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          channel_name, description, subscriber_count, total_views,
          youtube_url, discord_url, minecraft_discord_url, banner_image, avatar_image,
          existingInfo[0].id
        ]
      );
    }

    res.json({ message: '頻道資訊更新成功' });
  } catch (error) {
    console.error('更新頻道資訊錯誤:', error);
    res.status(500).json({ error: '服務器內部錯誤' });
  }
});

// 獲取網站設置（需要管理員權限）
router.get('/settings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const settings = await database.query('SELECT * FROM site_settings');
    
    // 轉換為鍵值對格式
    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });

    res.json(settingsObj);
  } catch (error) {
    console.error('獲取網站設置錯誤:', error);
    res.status(500).json({ error: '服務器內部錯誤' });
  }
});

// 更新網站設置（需要管理員權限）
router.put('/settings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const settings = req.body;

    for (const [key, value] of Object.entries(settings)) {
      // 檢查設置是否存在
      const existing = await database.query(
        'SELECT id FROM site_settings WHERE key = ?',
        [key]
      );

      if (existing.length === 0) {
        // 新增設置
        await database.run(
          'INSERT INTO site_settings (key, value) VALUES (?, ?)',
          [key, value]
        );
      } else {
        // 更新設置
        await database.run(
          'UPDATE site_settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?',
          [value, key]
        );
      }
    }

    res.json({ message: '網站設置更新成功' });
  } catch (error) {
    console.error('更新網站設置錯誤:', error);
    res.status(500).json({ error: '服務器內部錯誤' });
  }
});

module.exports = router;