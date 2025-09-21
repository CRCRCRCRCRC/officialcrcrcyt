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

// 將資料庫回傳的欄位統一成前端所需格式（統一輸出 UTC ISO，避免時區誤差）
function toISO(v) {
  try {
    if (!v) return null;
    const d = new Date(v);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch {
    return null;
  }
}

function mapWallet(w) {
  if (!w) return { balance: 0, lastClaimAt: null };
  const lastRaw = w.lastClaimAt ?? w.last_claim_at ?? null;
  return {
    balance: Number(w.balance) || 0,
    lastClaimAt: toISO(lastRaw)
  };
}

// 取得目前用戶的伺服器錢包（需要登入）
// 併回傳伺服器端計算的 nextClaimInMs，避免因客戶端時鐘誤差導致按鈕狀態判斷錯誤
router.get('/wallet', authenticateToken, async (req, res) => {
  try {
    const wallet = await database.getCoinWallet(req.user.id);
    const COOLDOWN_MS = 24 * 60 * 60 * 1000;
    const raw = wallet?.last_claim_at ?? wallet?.lastClaimAt ?? null;
    const iso = toISO(raw);
    let nextClaimInMs = 0;
    if (iso) {
      const last = new Date(iso).getTime();
      const diff = (last + COOLDOWN_MS) - Date.now();
      if (diff > 0) nextClaimInMs = diff;
    }
    res.json({ wallet: mapWallet(wallet), nextClaimInMs });
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
    const history = (list || []).map((r) => {
      const atRaw = r.at ?? r.created_at ?? null;
      let at = null;
      try { at = atRaw ? new Date(atRaw).toISOString() : null; } catch { at = null; }
      return {
        type: r.type,
        amount: Number(r.amount) || 0,
        reason: r.reason || '',
        at
      };
    });
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

// 購買 Discord 身分組（需要登入）
router.post('/purchase-discord-role', authenticateToken, async (req, res) => {
  try {
    const { discordId } = req.body;
    const amount = 300;
    const reason = '購買 Discord 會員身分組';

    if (!discordId || !discordId.trim()) {
      return res.status(400).json({ error: '請提供 Discord ID' });
    }

    // 檢查餘額是否充足
    const wallet = await database.getCoinWallet(req.user.id);
    if (wallet.balance < amount) {
      return res.status(400).json({ error: '餘額不足' });
    }

    // 扣除金幣
    const spendResult = await database.spendCoins(req.user.id, amount, reason);
    if (!spendResult.success) {
      return res.status(400).json({ error: spendResult.error || '扣款失敗' });
    }

    // 記錄 Discord ID 申請
    await database.recordDiscordRoleApplication(req.user.id, discordId.trim());

    return res.json({
      success: true,
      wallet: mapWallet(spendResult.wallet),
      message: '購買成功！管理員將會處理您的身分組申請。'
    });
  } catch (error) {
    console.error('購買 Discord 身分組失敗:', error);
    res.status(500).json({ error: '購買失敗' });
  }
});

// 取得 Discord 身分組申請記錄（僅管理員）
router.get('/discord-applications', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const applications = await database.getDiscordRoleApplications();
    res.json({ applications });
  } catch (error) {
    console.error('取得 Discord 申請記錄失敗:', error);
    res.status(500).json({ error: '無法取得申請記錄' });
  }
});


// 通過電子郵件給用戶加幣（僅管理員）
router.post('/add-coins-by-email', async (req, res) => {
  try {
    const { email, amount, reason } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ error: '請提供用戶電子郵件' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: '請提供有效的金額' });
    }

    console.log('🔍 開始查找用戶:', email.trim());

    // 查找用戶
    const user = await database.getUserByEmail(email.trim());
    console.log('🔍 通過 email 查找結果:', user);

    if (!user) {
      // 如果找不到email，嘗試通過username查找
      const userByUsername = await database.getUserByUsername(email.trim());
      console.log('🔍 通過 username 查找結果:', userByUsername);

      if (!userByUsername) {
        return res.status(404).json({ error: '找不到該電子郵件或用戶名的用戶' });
      }
      return res.status(404).json({
        error: '找不到該電子郵件的用戶',
        suggestion: `建議：用戶 "${email.trim()}" 可能沒有設置電子郵件，請聯繫用戶獲取正確的電子郵件地址`
      });
    }

    console.log('✅ 找到用戶:', user);

    // 給用戶加幣
    const result = await database.addCoins(user.id, parseInt(amount), reason || '管理員手動加幣');
    console.log('✅ 加幣結果:', result);

    return res.json({
      success: true,
      message: `成功給用戶 ${user.username} (${email}) 添加 ${amount} CRCRCoin`,
      wallet: mapWallet(result.wallet)
    });
  } catch (error) {
    console.error('通過電子郵件加幣失敗:', error);
    console.error('錯誤詳情:', error.stack);
    res.status(500).json({ error: '加幣失敗', details: error.message });
  }
});


// 通過用戶ID給用戶加幣（僅管理員）
router.post('/add-coins-by-id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId, amount, reason } = req.body;

    if (!userId || userId <= 0) {
      return res.status(400).json({ error: '請提供有效的用戶ID' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: '請提供有效的金額' });
    }

    // 檢查用戶是否存在
    const user = await database.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: '找不到該用戶' });
    }

    // 給用戶加幣
    const result = await database.addCoins(userId, parseInt(amount), reason || '管理員手動加幣');

    return res.json({
      success: true,
      message: `成功給用戶 ${user.username} 添加 ${amount} CRCRCoin`,
      wallet: mapWallet(result.wallet)
    });
  } catch (error) {
    console.error('通過用戶ID加幣失敗:', error);
    res.status(500).json({ error: '加幣失敗' });
  }
});

module.exports = router;