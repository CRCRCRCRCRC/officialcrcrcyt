const express = require('express');

const axios = require('axios');
const crypto = require('crypto');

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

const getTaipeiDayKey = (value = Date.now()) => {

  const ts = typeof value === 'number' ? value : toTimestamp(value);

  if (ts === null) return null;

  const taipei = new Date(ts + TAIPEI_OFFSET_MS);

  return taipei.toISOString().slice(0, 10);

};

const isSameTaipeiDay = (a, b = Date.now()) => {

  const aKey = getTaipeiDayKey(a);

  const bKey = getTaipeiDayKey(b);

  return !!aKey && !!bKey && aKey === bKey;

};



const PROMOTION_PRODUCT_ID = 'promotion-service';
const DISCORD_ROLE_PRODUCT_ID = 'discord-role-king';
const TECH_EFFECT_PRODUCT_ID = 'site-tech-effect';
const PROMOTION_ACCEPTED_MESSAGE =
  '您購買的宣傳服務已經過管理員批准，請至Discord與管理員詳談您要宣傳的內容';
const formatPromotionRefundAmount = (price) => {
  const amount = Number.isFinite(price) ? price : Number.parseInt(price, 10) || 0;
  return Number.isFinite(amount)
    ? amount.toLocaleString('zh-TW')
    : String(amount);
};
const buildPromotionRejectedMessage = (price, label = '購買') => {
  const formatted = formatPromotionRefundAmount(price);
  return `您${label}的宣傳服務已被管理員回絕，可能是因為內容不洽當，已將${formatted} CRCRCoin退還給您，若還想宣傳，請嘗試修改內容再次提交`;
};
const isEnabledFlag = (value) => value === true || value === 'true' || value === 1 || value === '1';

const SHOP_PRODUCTS = [
  {
    id: DISCORD_ROLE_PRODUCT_ID,
    name: 'DC👑｜目前還沒有用的會員',
    price: 300,
    description: '購買後會自動加入 Discord 身分組（需先加入伺服器）。',
    requireDiscordId: true
  },
  {
    id: TECH_EFFECT_PRODUCT_ID,
    name: '網站特效 - 科技感',
    price: 2000,
    description: '解鎖科技感特效按鈕，切換全站酷炫視覺。',
    unlockTechEffect: true
  },
  {
    id: 'crcrcoin-pack-50',
    name: '50 CRCRCoin',
    price: 100,
    description: '花 100 CRCRCoin 換來 50 CRCRCoin，只是用來打發時間的惡趣味商品，可輸入購買數量。',
    allowQuantity: true,
    rewardCoins: 50
  },
  {
    id: PROMOTION_PRODUCT_ID,
    name: '幫你宣傳',
    price: 2000,
    description: '提交想宣傳的內容與 Discord ID，等待管理員審核並聯繫後續合作細節。',
    requireDiscordId: true,
    requirePromotionContent: true
  }
];

const REDEEM_CODE_LENGTH = 10;
const REDEEM_CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const PROMOTION_CONTENT_MIN = 10;
const PROMOTION_CONTENT_MAX = 500;

const normalizeRedeemCode = (value) => (value || '').toString().trim().toUpperCase();

const generateRedeemCode = (length = REDEEM_CODE_LENGTH) => {
  const size = Math.max(6, Math.min(32, Number(length) || REDEEM_CODE_LENGTH));
  let result = '';
  for (let i = 0; i < size; i += 1) {
    result += REDEEM_CODE_CHARS[crypto.randomInt(0, REDEEM_CODE_CHARS.length)];
  }
  return result;
};

const DISCORD_API_BASE = 'https://discord.com/api/v10';
const DISCORD_GUILD_ID = (process.env.DISCORD_GUILD_ID || '1300464762731237386').trim();
const DISCORD_ROLE_ID_MEMBER = (process.env.DISCORD_ROLE_ID_MEMBER || '1419324979618779218').trim();

const getDiscordInviteUrl = () => (process.env.DISCORD_INVITE_URL || '').trim();

const buildJoinServerMessage = () => {
  const inviteUrl = getDiscordInviteUrl();
  if (inviteUrl) {
    return `請先加入 Discord 伺服器後再購買（已退款）：${inviteUrl}`;
  }
  return '請先加入 Discord 伺服器後再購買（已退款）';
};

const assignDiscordRole = async (discordUserId) => {
  const botToken = (process.env.DISCORD_BOT_TOKEN || '').trim();
  if (!botToken) {
    return { ok: false, reason: 'missing_bot_token' };
  }
  if (!DISCORD_GUILD_ID || !DISCORD_ROLE_ID_MEMBER) {
    return { ok: false, reason: 'missing_config' };
  }

  const url = `${DISCORD_API_BASE}/guilds/${DISCORD_GUILD_ID}/members/${discordUserId}/roles/${DISCORD_ROLE_ID_MEMBER}`;

  try {
    await axios.put(url, null, {
      headers: {
        Authorization: `Bot ${botToken}`,
        'Content-Type': 'application/json'
      }
    });
    return { ok: true };
  } catch (error) {
    const status = error?.response?.status || 0;
    const message = error?.response?.data?.message || error.message || 'unknown';
    const code = error?.response?.data?.code || null;
    return {
      ok: false,
      reason: 'discord_api_error',
      status,
      message,
      code
    };
  }
};

const PASS_TASKS = [

  {

    id: 'daily-wallet-check',

    title: '每日簽到',

    description: '每天完成錢包簽到或檢視餘額就能獲得 XP。',

    xp: 120,

    frequency: 'daily',

    category: 'daily',

    icon: 'calendar'

  },

  {

    id: 'daily-shop-visit',

    title: '逛逛商城',

    description: '到 CRCRCoin 商店看看今日有什麼驚喜。每天可完成一次。',

    xp: 80,

    frequency: 'daily',

    category: 'daily',

    icon: 'shopping-bag'

  },

  {

    id: 'join-discord',

    title: '綁定 DISCORD 帳號',

    description: '至個人資料設定頁面綁定 Discord 帳號，僅需完成一次即可獲得大量 XP。',

    xp: 300,

    frequency: 'once',

    category: 'community',

    icon: 'discord'

  }

];

const PASS_TASK_MAP = new Map(PASS_TASKS.map((task) => [task.id, task]));

const serializePassTask = (task, log, now = Date.now()) => {

  const completedCount = Number(log?.completed_count) || 0;

  const lastCompletedAt = log?.last_completed_at ? toISO(log.last_completed_at) : null;

  let status = 'available';

  let nextAvailableAt = null;

  let availableInMs = 0;

  if (task.frequency === 'once' && completedCount > 0) {

    status = 'completed';

  } else if (task.frequency === 'daily' && lastCompletedAt && isSameTaipeiDay(lastCompletedAt, now)) {

    status = 'cooldown';

    const nextTs = getNextTaipeiMidnightTimestamp(now);

    nextAvailableAt = toISO(nextTs);

    availableInMs = Math.max(0, nextTs - now);

  }

  return {

    id: task.id,

    title: task.title,

    description: task.description,

    xp: task.xp,

    frequency: task.frequency,

    category: task.category,

    icon: task.icon || null,

    status,

    lastCompletedAt,

    completedCount,

    nextAvailableAt,

    availableInMs

  };

};


const PASS_TOTAL_LEVELS = 50;

const PASS_XP_PER_LEVEL = 200;

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

    requiredXp: 200, // Fixed 200 XP per level

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
  const products = SHOP_PRODUCTS.map(
    ({
      id,
      name,
      price,
      description,
      requireDiscordId = false,
      allowQuantity = false,
      requirePromotionContent = false,
      unlockTechEffect = false
    }) => ({
      id,
      name,
      price,
      description,
      requireDiscordId,
      allowQuantity,
      requirePromotionContent,
      unlockTechEffect
    })
  );
  res.json({ products });
});

// 管理員：兌換碼列表
router.get('/redeem-codes', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(500, parseInt(req.query.limit, 10) || 200));
    const codes = await database.listRedeemCodes(limit);
    res.json({ codes });
  } catch (error) {
    console.error('取得兌換碼列表失敗:', error);
    res.status(500).json({ error: '無法取得兌換碼列表' });
  }
});

// 管理員：新增兌換碼
router.post('/redeem-codes', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const rewardType = (req.body?.rewardType || '').toString().trim().toLowerCase();
    const allowRepeat = Boolean(req.body?.allowRepeat);
    const maxRedemptions = Math.floor(Number(req.body?.maxRedemptions));

    if (!Number.isFinite(maxRedemptions) || maxRedemptions < 1) {
      return res.status(400).json({ error: '可兌換人數需為 1 以上' });
    }

    let payload = null;

    if (rewardType === 'product') {
      const productId = (req.body?.productId || '').toString().trim();
      const product = SHOP_PRODUCTS.find((item) => item.id === productId);
      if (!product) {
        return res.status(400).json({ error: '商品不存在' });
      }

      payload = {
        rewardType: 'product',
        productId: product.id,
        productName: product.name,
        coinAmount: null,
        maxRedemptions,
        allowRepeat,
        createdBy: req.user.id
      };
    } else if (rewardType === 'coins') {
      const coinAmount = Math.floor(Number(req.body?.coinAmount));
      if (!Number.isFinite(coinAmount) || coinAmount <= 0) {
        return res.status(400).json({ error: '請輸入正確的 CRCRCoin 數量' });
      }

      payload = {
        rewardType: 'coins',
        productId: null,
        productName: null,
        coinAmount,
        maxRedemptions,
        allowRepeat,
        createdBy: req.user.id
      };
    } else {
      return res.status(400).json({ error: '兌換類型不正確' });
    }

    let code = null;
    for (let i = 0; i < 5; i += 1) {
      const candidate = generateRedeemCode();
      const exists = await database.getRedeemCodeByCode(candidate);
      if (!exists) {
        code = candidate;
        break;
      }
    }
    if (!code) {
      return res.status(500).json({ error: '無法產生兌換碼，請稍後再試' });
    }

    const record = await database.createRedeemCode({ code, ...payload });
    res.json({ success: true, redeemCode: record });
  } catch (error) {
    console.error('新增兌換碼失敗:', error);
    res.status(500).json({ error: '新增兌換碼失敗' });
  }
});

// 記錄商店訪問（需要登入）
router.post('/shop/visit', authenticateToken, async (req, res) => {
  try {
    await database.recordShopVisit(req.user.id);
    res.json({ success: true });
  } catch (error) {
    console.error('記錄商店訪問失敗:', error);
    res.status(500).json({ error: '記錄失敗' });
  }
});

// 檢查 Discord 綁定狀態（需要登入）
router.get('/check-discord', authenticateToken, async (req, res) => {
  try {
    const user = await database.getUserById(req.user.id);
    res.json({
      discordId: user?.discord_id || user?.discordId || '',
      isBound: !!(user?.discord_id || user?.discordId)
    });
  } catch (error) {
    console.error('檢查 Discord 綁定失敗:', error);
    res.status(500).json({ error: '檢查失敗' });
  }
});

// 兌換碼（需要登入）
router.post('/redeem', authenticateToken, async (req, res) => {
  try {
    const code = normalizeRedeemCode(req.body?.code);
    if (!code) {
      return res.status(400).json({ error: '請輸入兌換碼' });
    }

    const reserved = await database.reserveRedeemCodeUse(code, req.user.id);
    if (!reserved?.ok) {
      return res.status(400).json({ error: reserved?.error || '兌換失敗' });
    }

    const redeemCode = reserved.redeemCode;
    const useId = reserved.useId;

    const rollback = async () => {
      if (!redeemCode?.id || !useId) return;
      try {
        await database.rollbackRedeemCodeUse(redeemCode.id, req.user.id, useId);
      } catch (rollbackError) {
        console.error('兌換碼回滾失敗:', rollbackError);
      }
    };

    if (redeemCode.rewardType === 'coins') {
      const amount = Number(redeemCode.coinAmount) || 0;
      if (amount <= 0) {
        await rollback();
        return res.status(400).json({ error: '兌換碼設定錯誤' });
      }

      const addResult = await database.addCoins(req.user.id, amount, `兌換碼 ${code}`);
      if (!addResult?.success) {
        await rollback();
        return res.status(500).json({ error: addResult?.error || '兌換失敗' });
      }

      return res.json({
        success: true,
        reward: { type: 'coins', amount },
        wallet: mapWallet(addResult.wallet),
        message: `已兌換 ${amount} CRCRCoin`
      });
    }

    if (redeemCode.rewardType === 'product') {
      const product = SHOP_PRODUCTS.find((item) => item.id === redeemCode.productId);
      if (!product) {
        await rollback();
        return res.status(400).json({ error: '兌換碼商品不存在' });
      }
      const trimmedPromotion = (req.body?.promotionContent || '').toString().trim();

      let finalDiscordId = '';
      if (product.requireDiscordId) {
        const user = await database.getUserById(req.user.id);
        finalDiscordId = (user?.discord_id || user?.discordId || '').toString().trim();
        if (!finalDiscordId) {
          await rollback();
          return res.status(400).json({ error: '請先至個人資料頁面綁定 Discord 帳號' });
        }
      }

      if (product.requirePromotionContent) {
        if (!trimmedPromotion) {
          await rollback();
          return res.status(400).json({
            error: '請輸入想宣傳的內容',
            code: 'NEEDS_PROMOTION_CONTENT',
            productName: product.name
          });
        }
        if (trimmedPromotion.length < PROMOTION_CONTENT_MIN) {
          await rollback();
          return res.status(400).json({ error: `宣傳內容太短，請至少輸入 ${PROMOTION_CONTENT_MIN} 個字` });
        }
        if (trimmedPromotion.length > PROMOTION_CONTENT_MAX) {
          await rollback();
          return res.status(400).json({ error: `宣傳內容太長，請縮短在 ${PROMOTION_CONTENT_MAX} 字內` });
        }
      }

      if (product.id === DISCORD_ROLE_PRODUCT_ID) {
        const botToken = (process.env.DISCORD_BOT_TOKEN || '').trim();
        if (!botToken) {
          await rollback();
          return res.status(500).json({ error: 'Discord Bot 尚未設定，暫時無法兌換此商品' });
        }

        const assignResult = await assignDiscordRole(finalDiscordId);
        if (!assignResult.ok) {
          await rollback();
          return res.status(400).json({ error: buildJoinServerMessage() });
        }

        return res.json({
          success: true,
          reward: { type: 'product', productId: product.id, productName: product.name },
          message: '兌換成功，已嘗試加入 Discord 身分組'
        });
      }

      if (product.id === TECH_EFFECT_PRODUCT_ID) {
        const user = await database.getUserById(req.user.id);
        if (isEnabledFlag(user?.tech_effect_unlocked) || isEnabledFlag(user?.techEffectUnlocked)) {
          await rollback();
          return res.status(400).json({ error: '你已擁有此網站特效' });
        }
        try {
          const updatedUser = await database.updateUserProfile(req.user.id, { techEffectUnlocked: true });
          if (!isEnabledFlag(updatedUser?.tech_effect_unlocked) && !isEnabledFlag(updatedUser?.techEffectUnlocked)) {
            throw new Error('unlock_failed');
          }
        } catch (error) {
          console.error('兌換解鎖網站特效失敗:', error);
          await rollback();
          return res.status(500).json({ error: '網站特效解鎖失敗，請稍後再試' });
        }

        return res.json({
          success: true,
          reward: { type: 'product', productId: product.id, productName: product.name },
          message: '兌換成功，已解鎖科技感特效'
        });
      }

      if (product.rewardCoins) {
        const rewardAmount = Number(product.rewardCoins) || 0;
        if (rewardAmount <= 0) {
          await rollback();
          return res.status(400).json({ error: '兌換碼設定錯誤' });
        }

        const addResult = await database.addCoins(
          req.user.id,
          rewardAmount,
          `兌換碼商品回饋：${product.name}`
        );
        if (!addResult?.success) {
          await rollback();
          return res.status(500).json({ error: addResult?.error || '兌換失敗' });
        }

        return res.json({
          success: true,
          reward: { type: 'coins', amount: rewardAmount },
          wallet: mapWallet(addResult.wallet),
          message: `已兌換 ${rewardAmount} CRCRCoin`
        });
      }

      if (product.requireDiscordId || product.requirePromotionContent) {
        try {
          await database.createCoinOrder(req.user.id, {
            product_id: product.id,
            product_name: product.name,
            price: 0,
            discord_id: finalDiscordId,
            promotion_content: product.requirePromotionContent ? trimmedPromotion : null,
            user_email: req.user.username || req.user.email || null,
            redeem_code_id: redeemCode.id,
            redeem_code_use_id: useId,
            status: 'pending'
          });
        } catch (error) {
          console.error('建立兌換碼訂單失敗:', error);
          await rollback();
          return res.status(500).json({ error: '建立訂單失敗，請稍後再試' });
        }
      }

      return res.json({
        success: true,
        reward: { type: 'product', productId: product.id, productName: product.name },
        message: '兌換成功'
      });
    }

    await rollback();
    return res.status(400).json({ error: '兌換碼設定錯誤' });
  } catch (error) {
    console.error('兌換碼兌換失敗:', error);
    res.status(500).json({ error: '兌換失敗' });
  }
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



router.get('/pass/tasks', authenticateToken, async (req, res) => {
  try {
    const logs = await database.getPassTaskLogs(req.user.id);
    const now = Date.now();
    const logMap = new Map((logs || []).map((log) => [log.task_id, log]));
    const tasks = PASS_TASKS.map((task) => serializePassTask(task, logMap.get(task.id), now));
    res.json({ tasks });
  } catch (error) {
    console.error('取得任務列表失敗:', error);
    res.status(500).json({ error: '無法取得任務列表' });
  }
});

router.post('/pass/tasks/:taskId/complete', authenticateToken, async (req, res) => {
  try {
    const taskId = String(req.params?.taskId || '').trim();
    if (!taskId) {
      return res.status(400).json({ error: '缺少任務編號' });
    }
    const task = PASS_TASK_MAP.get(taskId);
    if (!task) {
      return res.status(404).json({ error: '找不到任務' });
    }
    const logs = await database.getPassTaskLogs(req.user.id);
    const logMap = new Map((logs || []).map((log) => [log.task_id, log]));
    const existing = logMap.get(taskId);
    const now = Date.now();

    // 檢查任務是否已完成
    if (task.frequency === 'once' && existing && (Number(existing.completed_count) || 0) > 0) {
      return res.status(400).json({ error: '此任務已完成' });
    }
    if (task.frequency === 'daily' && existing?.last_completed_at && isSameTaipeiDay(existing.last_completed_at, now)) {
      const nextTs = getNextTaipeiMidnightTimestamp(now);
      return res.status(400).json({ error: '今日已完成此任務', nextAvailableAt: toISO(nextTs) });
    }

    // === 驗證任務是否真的完成 ===

    // 每日簽到任務：檢查今天是否有簽到過
    if (taskId === 'daily-wallet-check') {
      const wallet = await database.getCoinWallet(req.user.id);
      const lastClaimAt = wallet?.last_claim_at ?? wallet?.lastClaimAt ?? null;
      if (!lastClaimAt || !isSameTaipeiDay(lastClaimAt, now)) {
        return res.status(400).json({ error: '請先完成今日錢包簽到' });
      }
    }

    // 逛逛商城任務：檢查今天是否有訪問過商店
    if (taskId === 'daily-shop-visit') {
      const lastShopVisit = await database.getLastShopVisit(req.user.id);
      if (!lastShopVisit || !isSameTaipeiDay(lastShopVisit, now)) {
        return res.status(400).json({ error: '請先訪問商店頁面' });
      }
    }

    // 加入 Discord 任務：檢查用戶是否已綁定 Discord ID
    if (taskId === 'join-discord') {
      const hasDiscordRecord = await database.hasUserDiscordRecord(req.user.id);
      if (!hasDiscordRecord) {
        return res.status(400).json({ error: '請先至個人資料設定頁面綁定 Discord 帳號' });
      }
    }

    // === 驗證通過，發放 XP ===

    const updatedLog = await database.upsertPassTaskLog(req.user.id, taskId, { timestamp: now, increment: 1 });
    const updatedPassState = await database.addPassXp(req.user.id, task.xp);
    const passPayload = await buildPassPayload(req.user.id, { passStateOverride: updatedPassState });
    logMap.set(taskId, updatedLog);
    const tasks = PASS_TASKS.map((item) => serializePassTask(item, logMap.get(item.id), now));
    res.json({
      success: true,
      reward: { xp: task.xp },
      task: serializePassTask(task, updatedLog, now),
      tasks,
      pass: passPayload
    });
  } catch (error) {
    console.error('完成任務失敗:', error);
    res.status(500).json({ error: '完成任務失敗' });
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



// 取得商品訂單通知（需要登入）

router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    const mode = (req.query.mode || 'new').toString().toLowerCase();
    const fetcher =
      mode === 'all'
        ? database.listCoinOrderNotifications(req.user.id)
        : database.getCoinOrderNotifications(req.user.id);
    const rows = await fetcher;
    const notifications = (rows || [])
      .map((order) => {
        const product = SHOP_PRODUCTS.find((item) => item.id === order.product_id);
        if (!product || !product.requirePromotionContent) {
          return null;
        }
        const isRedeemOrder = !!(order.redeem_code_id && order.redeem_code_use_id);
        const basePrice = Math.max(0, Number(order.price) || 0);
        const fallbackPrice = Math.max(0, Number(product?.price) || 0);
        const refundAmount = isRedeemOrder
          ? (basePrice > 0 ? basePrice : fallbackPrice)
          : basePrice;
        let message = null;
        let variant = 'info';
        if (order.status === 'accepted') {
          message = PROMOTION_ACCEPTED_MESSAGE;
          variant = 'success';
        } else if (order.status === 'rejected') {
          const label = isRedeemOrder ? '兌換' : '購買';
          message = buildPromotionRejectedMessage(refundAmount, label);
          variant = 'error';
        }
        if (!message) return null;
        const displayPrice = order.status === 'rejected' ? refundAmount : basePrice;
        return {
          id: order.id,
          productId: order.product_id,
          productName: order.product_name,
          status: order.status,
          message,
          variant,
          price: displayPrice,
          createdAt: order.created_at || null,
          notifiedAt: order.notified_at || null
        };
      })
      .filter(Boolean);
    res.json({ notifications });
  } catch (error) {
    console.error('取得通知失敗:', error);
    res.status(500).json({ error: '無法取得通知' });
  }
});

router.delete('/notifications/:notificationId', authenticateToken, async (req, res) => {
  try {
    const notificationId = req.params.notificationId;
    if (!notificationId) {
      return res.status(400).json({ error: '缺少通知編號' });
    }
    const result = await database.dismissCoinOrderNotification(notificationId, req.user.id);
    if (!result) {
      return res.status(404).json({ error: '找不到通知或已刪除' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('刪除通知失敗:', error);
    res.status(500).json({ error: '無法刪除通知' });
  }
});

// 取得商品訂單紀錄（需要管理員）

router.get('/orders', authenticateToken, requireAdmin, async (req, res) => {

  try {

    const limit = Math.max(1, Math.min(500, parseInt(req.query.limit) || 100));

    const orders = await database.getCoinOrders(limit);

    const filtered = orders.filter((order) => order.product_id !== DISCORD_ROLE_PRODUCT_ID);

    res.json({ orders: filtered });

  } catch (error) {

    console.error('取得商品訂單失敗:', error);

    res.status(500).json({ error: '無法取得商品訂單' });

  }

});

router.post('/orders/:orderId/decision', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const orderId = req.params.orderId;
    if (!orderId) {
      return res.status(400).json({ error: '缺少訂單編號' });
    }
    const action = (req.body?.action || '').toString().toLowerCase();
    const note = (req.body?.note || '').toString().trim() || null;
    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ error: '無效的操作' });
    }
    const order = await database.getCoinOrderById(orderId);
    if (!order) {
      return res.status(404).json({ error: '找不到此訂單' });
    }
    if (order.product_id !== PROMOTION_PRODUCT_ID) {
      return res.status(400).json({ error: '此訂單不需要審核' });
    }
    if (order.status !== 'pending') {
      return res.status(400).json({ error: '此訂單已處理' });
    }

    if (action === 'accept') {
      const updated = await database.updateCoinOrderStatus(orderId, 'accepted', {
        adminId: req.user.id,
        note
      });

      // 通知會自動通過訂單狀態系統生成（GET /coin/notifications）

      return res.json({ success: true, order: updated });
    }

    const hasRedeemCode = !!(order.redeem_code_id && order.redeem_code_use_id);
    const product = SHOP_PRODUCTS.find((item) => item.id === order.product_id);
    const basePrice = Math.max(0, Number(order.price) || 0);
    const fallbackPrice = Math.max(0, Number(product?.price) || 0);
    const refundAmount = hasRedeemCode
      ? (basePrice > 0 ? basePrice : fallbackPrice)
      : basePrice;
    let refundResult = null;
    if (refundAmount > 0) {
      try {
        const reason = hasRedeemCode
          ? `兌換宣傳服務回絕退還（訂單 ${order.id}）`
          : `宣傳服務退款（訂單 ${order.id}）`;
        refundResult = await database.addCoins(
          order.user_id,
          refundAmount,
          reason
        );
      } catch (error) {
        console.error('宣傳服務退款失敗:', error);
        return res.status(500).json({ error: '退款失敗，請稍後再試' });
      }
      if (!refundResult?.success) {
        return res.status(500).json({ error: refundResult?.error || '退款失敗' });
      }
    }

    const updated = await database.updateCoinOrderStatus(orderId, 'rejected', {
      adminId: req.user.id,
      note
    });

    // 通知會自動通過訂單狀態系統生成（GET /coin/notifications）

    return res.json({
      success: true,
      order: updated,
      refund: refundResult
        ? {
            amount: refundAmount,
            wallet: mapWallet(refundResult.wallet)
          }
        : null
    });
  } catch (error) {
    console.error('更新訂單狀態失敗:', error);
    res.status(500).json({ error: '無法更新訂單狀態' });
  }
});



// 每日簽到（需要登入）

router.post('/claim-daily', authenticateToken, async (req, res) => {

  try {

    const result = await database.claimDaily(req.user.id, 50);

    if (result && result.success) {

      const normalizedLast =

        toISO(result.wallet?.last_claim_at ?? result.wallet?.lastClaimAt ?? null) ||

        new Date().toISOString();

      const nextClaimInMs = msUntilNextTaipeiMidnight(normalizedLast);

      return res.json({

        success: true,

        amount: result.amount,

        wallet: mapWallet(result.wallet),

        nextClaimInMs

      });

    }

    return res.status(400).json({

      success: false,

      error: '尚未到簽到時間',

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

    const { productId, discordId, quantity, promotionContent } = req.body || {};

    const product = SHOP_PRODUCTS.find((item) => item.id === productId);

    if (!product) {

      return res.status(404).json({ error: '找不到此商品' });

    }



    const requiresDiscord = Boolean(product.requireDiscordId);

    const allowsQuantity = Boolean(product.allowQuantity);

    const requiresPromotionContent = Boolean(product.requirePromotionContent);
    const isDiscordRoleProduct = product.id === DISCORD_ROLE_PRODUCT_ID;
    const isTechEffectProduct = product.id === TECH_EFFECT_PRODUCT_ID;

    // 如果需要 Discord ID，優先使用用戶綁定的 Discord ID
    let finalDiscordId = (discordId || '').toString().trim();
    let user = null;
    if (requiresDiscord || isTechEffectProduct) {
      user = await database.getUserById(req.user.id);
    }
    if (isTechEffectProduct && (isEnabledFlag(user?.tech_effect_unlocked) || isEnabledFlag(user?.techEffectUnlocked))) {
      return res.status(400).json({ error: '你已擁有此網站特效' });
    }
    if (requiresDiscord) {
      const userBoundDiscordId = user?.discord_id || user?.discordId || '';

      // 如果用戶已綁定 Discord ID，優先使用綁定的
      if (userBoundDiscordId) {
        finalDiscordId = userBoundDiscordId;
      } else if (!finalDiscordId) {
        // 如果沒有綁定也沒有提供，則報錯
        return res.status(400).json({ error: '請先至個人資料頁面綁定 Discord ID' });
      }

      if (finalDiscordId.length > 100) {
        return res.status(400).json({ error: 'Discord ID 太長，請確認是否正確' });
      }
    }

    const trimmedPromotion = (promotionContent || '').toString().trim();

    if (requiresPromotionContent) {

      if (!trimmedPromotion) {

        return res.status(400).json({ error: '請輸入想宣傳的內容' });

      }

      if (trimmedPromotion.length < 10) {

        return res.status(400).json({ error: '宣傳內容太短，請至少輸入 10 個字' });

      }

      if (trimmedPromotion.length > 500) {

        return res.status(400).json({ error: '宣傳內容太長，請縮短在 500 字內' });

      }

    }

    if (isDiscordRoleProduct) {
      const botToken = (process.env.DISCORD_BOT_TOKEN || '').trim();
      if (!botToken) {
        return res.status(500).json({ error: 'Discord Bot 尚未設定，暫時無法購買此商品' });
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

    if (isTechEffectProduct) {
      try {
        const updatedUser = await database.updateUserProfile(req.user.id, { techEffectUnlocked: true });
        if (!isEnabledFlag(updatedUser?.tech_effect_unlocked) && !isEnabledFlag(updatedUser?.techEffectUnlocked)) {
          throw new Error('unlock_failed');
        }
        responsePayload.techEffectUnlocked = true;
      } catch (error) {
        console.error('解鎖網站特效失敗:', error);
        try {
          await database.addCoins(req.user.id, totalPrice, '網站特效解鎖失敗退款');
        } catch (refundError) {
          console.error('自動退款失敗，請人工協助:', refundError);
        }
        return res.status(500).json({ error: '網站特效解鎖失敗，已嘗試退款' });
      }
    }



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



    if (isDiscordRoleProduct) {

      const assignResult = await assignDiscordRole(finalDiscordId);

      if (!assignResult.ok) {

        console.error('Discord 身分組指派失敗:', assignResult);

        try {

          await database.addCoins(req.user.id, totalPrice, 'Discord 身分組指派失敗退款');

        } catch (refundError) {

          console.error('自動退款失敗，請人工協助:', refundError);

        }

        return res.status(400).json({ error: buildJoinServerMessage() });

      }

    } else if (requiresDiscord || requiresPromotionContent) {

      try {

        const order = await database.createCoinOrder(req.user.id, {

          product_id: product.id,

          product_name: product.name,

          price: totalPrice,

          discord_id: finalDiscordId,

          promotion_content: requiresPromotionContent ? trimmedPromotion : null,

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

  console.log('✅ /grant 路由被調用');

  console.log('🔍 請求方法:', req.method);

  console.log('🔍 請求路徑:', req.path);

  console.log('🔍 完整 URL:', req.originalUrl);

  try {

    console.log('🔍 /coin/grant 請求數據:', req.body);

    

    const rawEmail = (req.body?.email || '').toString().trim();

    const parsedAmount = Math.floor(Number(req.body?.amount));

    

    console.log('🔍 解析後的數據:', { email: rawEmail, amount: parsedAmount });

    

    if (!Number.isFinite(parsedAmount) || parsedAmount === 0) {

      console.log('❌ 金額無效:', parsedAmount);

      return res.status(400).json({ error: '金額無效' });

    }



    if (!rawEmail) {

      console.log('❌ 電子郵件為空');

      return res.status(400).json({ error: '請輸入用戶電子郵件' });

    }



    console.log('🔍 查找用戶:', rawEmail);

    let user = await database.getUserByUsername(rawEmail);

    console.log('🔍 查找結果:', user);

    

    // 由於 getUserByUsername 已經支援不區分大小寫匹配，不需要額外嘗試小寫版本



    if (!user) {

      console.log('❌ 找不到用戶:', rawEmail);

      console.log('💡 提示：請確認該用戶已經至少登入過一次公開網站');

      return res.status(404).json({ 

        error: '找不到該用戶，請確認電子郵件是否正確',

        hint: '該用戶需要先在公開網站登入一次才能接收 CRCRCoin'

      });

    }



    console.log('🔍 用戶信息:', { id: user.id, username: user.username });

    console.log('🔍 管理員信息:', { id: req.user.id, username: req.user.username });



    const result = parsedAmount > 0

      ? await database.addCoins(user.id, parsedAmount, '管理員發放')

      : await database.spendCoins(user.id, Math.abs(parsedAmount), '管理員扣除');



    console.log('🔍 數據庫操作結果:', result);



    if (!result?.success) {

      console.log('❌ 數據庫操作失敗:', result?.error);

      return res.status(400).json({ error: result?.error || '調整失敗' });

    }



    return res.json({

      success: true,

      message: `已${parsedAmount > 0 ? '發放' : '扣除'} ${Math.abs(parsedAmount)} CRCRCoin`,

      target: {

        id: user.id,

        email: user.username,

        role: user.role

      },

      wallet: mapWallet(result.wallet),

      amount: parsedAmount

    });

  } catch (error) {

    console.error('管理員發放 CRCRCoin 失敗:', error);

    res.status(500).json({ error: '發放失敗' });

  }

});



// 管理員發放通行券 XP（需要管理員權限）

router.post('/pass/grant-xp', authenticateToken, requireAdmin, async (req, res) => {

  console.log('✅ /pass/grant-xp 路由被調用');

  console.log('🔍 請求數據:', req.body);



  try {

    const rawEmail = (req.body?.email || '').toString().trim();

    const parsedXP = Math.floor(Number(req.body?.xp));



    console.log('🔍 解析後的數據:', { email: rawEmail, xp: parsedXP });



    if (!Number.isFinite(parsedXP) || parsedXP === 0) {

      console.log('❌ XP 數量無效:', parsedXP);

      return res.status(400).json({ error: 'XP 數量無效' });

    }



    if (!rawEmail) {

      console.log('❌ 電子郵件為空');

      return res.status(400).json({ error: '請輸入用戶電子郵件' });

    }



    console.log('🔍 查找用戶:', rawEmail);

    let user = await database.getUserByUsername(rawEmail);

    console.log('🔍 查找結果:', user);



    if (!user) {

      console.log('❌ 找不到用戶:', rawEmail);

      return res.status(404).json({

        error: '找不到該用戶，請確認電子郵件是否正確',

        hint: '該用戶需要先在公開網站登入一次'

      });

    }



    console.log('🔍 用戶信息:', { id: user.id, username: user.username });

    console.log('🔍 管理員信息:', { id: req.user.id, username: req.user.username });



    // 使用 addPassXp 來增加或減少 XP（支援正負數）

    const updatedState = await database.addPassXp(user.id, parsedXP);



    console.log('🔍 更新後的通行券狀態:', updatedState);



    return res.json({

      success: true,

      message: `已${parsedXP > 0 ? '發放' : '扣除'} ${Math.abs(parsedXP)} XP`,

      target: {

        id: user.id,

        email: user.username,

        role: user.role

      },

      xp: updatedState?.xp || 0

    });

  } catch (error) {

    console.error('管理員發放通行券 XP 失敗:', error);

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



