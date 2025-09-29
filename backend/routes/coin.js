const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const database = require('../config/database');

const router = express.Router();

const DAY_MS = 24 * 60 * 60 * 1000;
const TAIPEI_OFFSET_MS = 8 * 60 * 60 * 1000;

const toTimestamp = (value) => {
  if (!value) return null;
  const ts = new Date(value).getTime();
  return Number.isFinite(ts) ? ts : null;
};

const getNextTaipeiMidnightTimestamp = (timestamp) => {
  if (timestamp === null || timestamp === undefined) return null;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return null;
  const nextDay = Math.floor((ts + TAIPEI_OFFSET_MS) / DAY_MS) + 1;
  return nextDay * DAY_MS - TAIPEI_OFFSET_MS;
};

const msUntilNextTaipeiMidnight = (value, now = Date.now()) => {
  const ts = typeof value === 'number' ? value : toTimestamp(value);
  if (ts === null) return 0;
  const next = getNextTaipeiMidnightTimestamp(ts);
  if (next === null) return 0;
  return Math.max(0, next - now);
};

const SHOP_PRODUCTS = [
  {
    id: 'discord-role-king',
    name: 'DC👑｜目前還沒有用的會員',
    price: 300,
    description: '購買後請提供 Discord ID，管理員會手動處理身分組。',
    requireDiscordId: true
  },
  {
    id: 'crcrcoin-pack-50',
    name: '50 CRCRCoin',
    price: 100,
    description: '花 100 CRCRCoin 換來 50 CRCRCoin，只是用來打發時間的惡趣味商品，可輸入購買數量。',
    allowQuantity: true,
    rewardCoins: 50
  }
];

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

router.get('/products', (req, res) => {
  const products = SHOP_PRODUCTS.map(({ id, name, price, description, requireDiscordId = false, allowQuantity = false }) => ({
    id,
    name,
    price,
    description,
    requireDiscordId,
    allowQuantity
  }));
  res.json({ products });
});

// 取得目前用戶的伺服器錢包（需要登入）
// 併回傳伺服器端計算的 nextClaimInMs，避免因客戶端時鐘誤差導致按鈕狀態判斷錯誤
router.get('/wallet', authenticateToken, async (req, res) => {
  try {
    const wallet = await database.getCoinWallet(req.user.id);
    const raw = wallet?.last_claim_at ?? wallet?.lastClaimAt ?? null;
    const iso = toISO(raw);
    const nextClaimInMs = iso ? msUntilNextTaipeiMidnight(iso) : 0;
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

// 取得商品訂單紀錄（需要管理員）
router.get('/orders', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(500, parseInt(req.query.limit) || 100));
    const orders = await database.getCoinOrders(limit);
    res.json({ orders });
  } catch (error) {
    console.error('取得商品訂單失敗:', error);
    res.status(500).json({ error: '無法取得商品訂單' });
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

// 購買商品（需要登入）
router.post('/purchase', authenticateToken, async (req, res) => {
  try {
    const { productId, discordId, quantity } = req.body || {};
    const product = SHOP_PRODUCTS.find((item) => item.id === productId);
    if (!product) {
      return res.status(404).json({ error: '找不到此商品' });
    }

    const requiresDiscord = Boolean(product.requireDiscordId);
    const allowsQuantity = Boolean(product.allowQuantity);

    const trimmedDiscord = (discordId || '').toString().trim();
    if (requiresDiscord) {
      if (!trimmedDiscord) {
        return res.status(400).json({ error: '請輸入 Discord ID' });
      }
      if (trimmedDiscord.length > 100) {
        return res.status(400).json({ error: 'Discord ID 太長，請確認是否正確' });
      }
    }

    let qty = 1;
    if (allowsQuantity) {
      const parsed = Number.parseInt(quantity, 10);
      if (!Number.isFinite(parsed) || parsed < 1) {
        return res.status(400).json({ error: '購買數量無效' });
      }
      qty = Math.min(parsed, 99);
    }

    const totalPrice = product.price * qty;
    const description = `購買商品：${product.name}${allowsQuantity ? ` x${qty}` : ''}`;
    const spendResult = await database.spendCoins(req.user.id, totalPrice, description);
    if (!spendResult?.success) {
      return res.status(400).json({ error: spendResult?.error || '餘額不足' });
    }

    let finalWallet = spendResult.wallet;
    const responsePayload = {};

    if (product.rewardCoins) {
      const rewardAmount = product.rewardCoins * qty;
      try {
        const rewardResult = await database.addCoins(req.user.id, rewardAmount, `購買商品回饋：${product.name} x${qty}`);
        if (rewardResult?.wallet) {
          finalWallet = rewardResult.wallet;
        }
        responsePayload.reward = { coins: rewardAmount };
      } catch (error) {
        console.error('發放商品回饋失敗:', error);
      }
    }

    if (requiresDiscord) {
      try {
        const order = await database.createCoinOrder(req.user.id, {
          product_id: product.id,
          product_name: product.name,
          price: product.price,
          discord_id: trimmedDiscord,
          user_email: req.user.username || req.user.email || null,
          status: 'pending'
        });
        responsePayload.order = order;
      } catch (error) {
        console.error('建立商品訂單失敗，嘗試退款:', error);
        try {
          await database.addCoins(req.user.id, totalPrice, '購買失敗自動退款');
        } catch (refundError) {
          console.error('自動退款失敗，請人工協助:', refundError);
        }
        return res.status(500).json({ error: '購買失敗，已嘗試自動退款' });
      }
    }

    responsePayload.quantity = qty;

    return res.json({
      success: true,
      wallet: mapWallet(finalWallet),
      ...responsePayload
    });
  } catch (error) {
    console.error('購買商品失敗:', error);
    res.status(500).json({ error: '購買失敗' });
  }
});
// ���O�]�����A�ݵn�J�^
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

// 管理員發放 CRCRCoin 給指定用戶
router.post('/grant', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const rawEmail = (req.body?.email || '').toString().trim();
    const parsedAmount = Math.floor(Number(req.body?.amount));
    if (!Number.isFinite(parsedAmount) || parsedAmount === 0) {
      return res.status(400).json({ error: '金額無效' });
    }

    if (!rawEmail) {
      return res.status(400).json({ error: '請輸入用戶電子郵件' });
    }

    let user = await database.getUserByUsername(rawEmail);
    if (!user && rawEmail.toLowerCase() !== rawEmail) {
      user = await database.getUserByUsername(rawEmail.toLowerCase());
    }

    if (!user) {
      return res.status(404).json({ error: '找不到該用戶，請確認電子郵件是否正確' });
    }

    const result = parsedAmount > 0
      ? await database.addCoins(user.id, parsedAmount, `管理員發放 (${req.user.username || req.user.id})`)
      : await database.spendCoins(user.id, Math.abs(parsedAmount), `管理員扣除 (${req.user.username || req.user.id})`);

    if (!result?.success) {
      return res.status(400).json({ error: result?.error || '調整失敗' });
    }

    return res.json({
      success: true,
      target: {
        id: user.id,
        email: user.username
      },
      wallet: mapWallet(result.wallet)
    });
  } catch (error) {
    console.error('管理員發放 CRCRCoin 失敗:', error);
    res.status(500).json({ error: '發放失敗' });
  }
});

module.exports = router;
