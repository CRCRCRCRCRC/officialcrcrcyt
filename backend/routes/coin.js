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

const PASS_TOTAL_LEVELS = 50;
const PASS_XP_PER_LEVEL = 500;
const PASS_PREMIUM_PRICE = 6000;

const createPassReward = (level) => {
  const milestone = level % 5 === 0;
  const freeCoins = milestone ? 100 : 50;
  const premiumCoins = milestone ? 150 : 75;
  return {
    id: `pass-level-${level}`,
    level,
    title: `等級 ${level}`,
    description: milestone ? '重大里程碑獎勵' : '完成任務即可領取獎勵',
    requiredXp: level * PASS_XP_PER_LEVEL,
    free: {
      coins: freeCoins,
      description: `獲得 ${freeCoins} CRCRCoin`
    },
    premium: {
      coins: premiumCoins,
      description: `額外獲得 ${premiumCoins} CRCRCoin`
    }
  };
};

const PASS_REWARDS = Array.from({ length: PASS_TOTAL_LEVELS }, (_, index) => createPassReward(index + 1));


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

const toUniqueList = (value) => {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const result = [];
  value.forEach((item) => {
    const str = item != null ? String(item) : '';
    if (!seen.has(str)) {
      seen.add(str);
      result.push(str);
    }
  });
  return result;
};

const sanitizePassState = (state = {}) => {
  const rawXp = Number(state?.xp ?? state?.XP ?? 0);
  return {
    hasPremium: !!state?.hasPremium,
    claimedFree: toUniqueList(state?.claimedFree || state?.claimed_free),
    claimedPremium: toUniqueList(state?.claimedPremium || state?.claimed_premium),
    xp: Number.isFinite(rawXp) ? Math.max(0, Math.floor(rawXp)) : 0
  };
};

const buildPassPayload = async (userId, { walletOverride = null, passStateOverride = null } = {}) => {
  const walletPromise = walletOverride ? Promise.resolve(walletOverride) : database.getCoinWallet(userId);
  const passPromise = passStateOverride ? Promise.resolve(passStateOverride) : database.getCoinPass(userId);
  const [walletRaw, passRaw] = await Promise.all([walletPromise, passPromise]);
  const state = sanitizePassState(passRaw || {});
  const totalLevels = PASS_REWARDS.length;
  const xpPerLevel = PASS_XP_PER_LEVEL;
  const maxXp = totalLevels * xpPerLevel;
  const xp = Number.isFinite(state.xp) ? state.xp : 0;
  const clampedXp = Math.max(0, Math.min(xp, maxXp));
  const completedLevels = totalLevels === 0 ? 0 : Math.min(totalLevels, Math.floor(clampedXp / xpPerLevel));
  const levelProgress = completedLevels >= totalLevels ? xpPerLevel : clampedXp - completedLevels * xpPerLevel;
  const currentLevel = totalLevels === 0 ? 0 : Math.min(totalLevels, completedLevels + (completedLevels >= totalLevels ? 0 : 1));
  const nextLevelXp = Math.min(maxXp, (completedLevels + 1) * xpPerLevel);

  return {
    config: {
      premiumPrice: PASS_PREMIUM_PRICE,
      xpPerLevel,
      totalLevels,
      rewards: PASS_REWARDS
    },
    state,
    progress: {
      xp: clampedXp,
      xpPerLevel,
      totalLevels,
      completedLevels,
      currentLevel,
      levelProgress,
      levelRequiredXp: xpPerLevel,
      nextLevelXp,
      maxXp
    },
    wallet: mapWallet(walletRaw)
  };
};

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

router.get('/pass', authenticateToken, async (req, res) => {
  try {
    const payload = await buildPassPayload(req.user.id);
    res.json(payload);
  } catch (error) {
    console.error('取得通行券資訊失敗:', error);
    res.status(500).json({ error: '無法取得通行券資訊' });
  }
});

router.post('/pass/purchase', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const currentState = sanitizePassState(await database.getCoinPass(userId));
    if (currentState.hasPremium) {
      return res.status(400).json({ error: '已擁有高級通行券' });
    }

    const spendResult = await database.spendCoins(
      userId,
      PASS_PREMIUM_PRICE,
      '購買 CRCRC 通行券（高級）'
    );
    if (!spendResult?.success) {
      return res.status(400).json({ error: spendResult?.error || '餘額不足' });
    }

    const updatedState = await database.saveCoinPass(userId, {
      ...currentState,
      hasPremium: true,
      xp: currentState.xp
    });

    const payload = await buildPassPayload(userId, {
      walletOverride: spendResult.wallet,
      passStateOverride: updatedState
    });

    res.json({ success: true, ...payload });
  } catch (error) {
    console.error('購買通行券失敗:', error);
    res.status(500).json({ error: '購買通行券失敗' });
  }
});

router.post('/pass/claim', authenticateToken, async (req, res) => {
  try {
    const { rewardId, tier } = req.body || {};
    const userId = req.user.id;
    if (!rewardId || typeof rewardId !== 'string') {
      return res.status(400).json({ error: '請提供要領取的獎勵' });
    }
    const normalizedTier = (tier || 'free').toString().toLowerCase();
    if (!['free', 'premium'].includes(normalizedTier)) {
      return res.status(400).json({ error: '獎勵種類不正確' });
    }
    const reward = PASS_REWARDS.find((item) => item.id === rewardId);
    if (!reward) {
      return res.status(404).json({ error: '找不到指定的獎勵' });
    }

    const state = sanitizePassState(await database.getCoinPass(userId));
    const stageRequiredXp = reward.requiredXp || (reward.level * PASS_XP_PER_LEVEL);
    if (state.xp < stageRequiredXp) {
      return res.status(403).json({ error: '尚未達到領取條件' });
    }
    const claimedFree = new Set(state.claimedFree);
    const claimedPremium = new Set(state.claimedPremium);
    if ((normalizedTier === 'free' && claimedFree.has(rewardId)) || (normalizedTier === 'premium' && claimedPremium.has(rewardId))) {
      return res.status(400).json({ error: '此獎勵已領取' });
    }
    if (normalizedTier === 'premium' && !state.hasPremium) {
      return res.status(403).json({ error: '尚未購買高級通行券' });
    }

    const rewardInfo = normalizedTier === 'premium' ? reward.premium : reward.free;
    const coins = Number(rewardInfo?.coins) || 0;

    let wallet = null;
    if (coins > 0) {
      const add = await database.addCoins(
        userId,
        coins,
        `通行券獎勵：第 ${reward.level} 階（${normalizedTier === 'premium' ? '高級' : '普通'}）`
      );
      if (!add?.success) {
        return res.status(500).json({ error: '發放獎勵失敗' });
      }
      wallet = add.wallet;
    } else {
      wallet = await database.getCoinWallet(userId);
    }

    if (normalizedTier === 'free') {
      claimedFree.add(rewardId);
    } else {
      claimedPremium.add(rewardId);
    }

    const updatedState = await database.saveCoinPass(userId, {
      hasPremium: state.hasPremium,
      claimedFree: Array.from(claimedFree),
      claimedPremium: Array.from(claimedPremium),
      xp: state.xp
    });

    const payload = await buildPassPayload(userId, {
      walletOverride: wallet,
      passStateOverride: updatedState
    });

    res.json({
      success: true,
      reward: {
        id: rewardId,
        tier: normalizedTier,
        coins,
        description: rewardInfo?.description || ''
      },
      ...payload
    });
  } catch (error) {
    console.error('領取通行券獎勵失敗:', error);
    res.status(500).json({ error: '無法領取獎勵' });
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
router.post('/pass/earn', authenticateToken, async (req, res) => {
  try {
    const xpValue = Math.max(0, Math.floor(Number(req.body?.xp) || 0));
    if (xpValue <= 0) {
      return res.status(400).json({ error: 'XP 數值無效' });
    }

    const updatedState = await database.addPassXp(req.user.id, xpValue);
    const payload = await buildPassPayload(req.user.id, { passStateOverride: updatedState });
    res.json({ success: true, ...payload });
  } catch (error) {
    console.error('新增通行券 XP 失敗:', error);
    res.status(500).json({ error: '無法新增 XP' });
  }
});

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

// 獲取 CRCRCoin 排行榜（公開 API）
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const leaderboard = await database.getLeaderboard(limit);
    res.json({ leaderboard });
  } catch (error) {
    console.error('獲取排行榜失敗:', error);
    res.status(500).json({ error: '無法獲取排行榜' });
  }
});

module.exports = router;
