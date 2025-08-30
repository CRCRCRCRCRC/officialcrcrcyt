const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const database = require('../config/database');

const router = express.Router();

// 取得全域重置版本（公開）
// 前端在載入時可取得此版本；此版本主要保留舊版 localStorage 錢包用
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
// 同步重置伺服器錢包（新制）並寫入一個新的 reset 版本（舊制 localStorage 對齊用）
router.post('/reset', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // 重置所有伺服器錢包
    if (typeof database.resetAllCoins === 'function') {
      await database.resetAllCoins();
    }
    // 同步寫入新的 reset 版本（保留舊版機制）
    const version = Date.now().toString();
    await database.setSiteSetting('crcrcoin_reset_version', version);
    res.json({ success: true, version });
  } catch (error) {
    console.error('設定 CRCRCoin 重置版本失敗:', error);
    res.status(500).json({ error: '無法設定重置版本' });
  }
});

// 將資料庫回傳的欄位統一成前端所需格式
function mapWallet(w) {
  if (!w) return { balance: 0, lastClaimAt: null };
  return {
    balance: Number(w.balance) || 0,
    lastClaimAt: w.lastClaimAt || w.last_claim_at || null
  };
}

// 取得目前用戶的伺服器錢包（需要登入）
router.get('/wallet', authenticateToken, async (req, res) => {
  try {
    const wallet = await database.getCoinWallet(req.user.id);
    res.json({ wallet: mapWallet(wallet) });
  } catch (error) {
    console.error('取得錢包失敗:', error);
    res.status(500).json({ error: '無法取得錢包' });
  }
});

// 取得交易紀錄（需要登入）
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(200, parseInt(req.query.limit) || 50));
    const list = await database.getCoinHistory(req.user.id, limit);
    // 統一欄位名稱
    const history = (list || []).map((r) => ({
      type: r.type,
      amount: Number(r.amount) || 0,
      reason: r.reason || '',
      at: r.created_at || r.at || null
    }));
    res.json({ history });
  } catch (error) {
    console.error('取得交易紀錄失敗:', error);
    res.status(500).json({ error: '無法取得交易紀錄' });
  }
});

// 每日簽到（需要登入）
router.post('/claim-daily', authenticateToken, async (req, res) => {
  try {
    const result = await database.claimDaily(req.user.id, 50);
    if (result && result.success) {
      return res.json({
        success: true,
        amount: result.amount,
        wallet: mapWallet(result.wallet)
      });
    }
    return res.status(400).json({
      success: false,
      error: '尚未到下次簽到時間',
      nextClaimInMs: result?.nextClaimInMs || 0
    });
  } catch (error) {
    console.error('每日簽到失敗:', error);
    res.status(500).json({ error: '簽到失敗' });
  }
});

// 消費（扣幣，需登入）
router.post('/spend', authenticateToken, async (req, res) => {
  try {
    const amount = Math.max(0, Math.floor(Number(req.body?.amount) || 0));
    const reason = req.body?.reason || '消費';
    if (amount <= 0) return res.status(400).json({ error: '金額無效' });
    const result = await database.spendCoins(req.user.id, amount, reason);
    if (!result?.success) {
      return res.status(400).json({ error: result?.error || '扣款失敗' });
    }
    return res.json({ success: true, wallet: mapWallet(result.wallet) });
  } catch (error) {
    console.error('扣款失敗:', error);
    res.status(500).json({ error: '扣款失敗' });
  }
});

// 加幣（僅管理員）
router.post('/earn', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const amount = Math.max(0, Math.floor(Number(req.body?.amount) || 0));
    const reason = req.body?.reason || '任務獎勵';
    if (amount <= 0) return res.status(400).json({ error: '金額無效' });
    const result = await database.addCoins(req.user.id, amount, reason);
    return res.json({ success: true, wallet: mapWallet(result.wallet) });
  } catch (error) {
    console.error('加幣失敗:', error);
    res.status(500).json({ error: '加幣失敗' });
  }
});

module.exports = router;