const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const database = require('../config/database');

const router = express.Router();

// 取得全域重置版本（公開）
// 前端會在載入時取得此版本，若與本地記錄不同則清空所有 CRCRCoin localStorage
router.get('/reset-version', async (req, res) => {
  try {
    const version = await database.getSiteSetting('crcrcoin_reset_version');
    res.json({ version: version || '0' });
  } catch (error) {
    console.error('取得 CRCRCoin 重置版本失敗:', error);
    res.status(500).json({ error: '無法取得重置版本' });
  }
});

// 管理員一鍵重置（需要登入 + admin）
// 呼叫後寫入新版本字串，所有用戶下次載入頁面將自動歸零
router.post('/reset', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const version = Date.now().toString();
    await database.setSiteSetting('crcrcoin_reset_version', version);
    res.json({ success: true, version });
  } catch (error) {
    console.error('設定 CRCRCoin 重置版本失敗:', error);
    res.status(500).json({ error: '無法設定重置版本' });
  }
});

module.exports = router;