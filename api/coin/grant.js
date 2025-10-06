// 專門處理 /api/coin/grant 的 Vercel 無伺服器函數
const { authenticateToken, requireAdmin } = require('../../backend/middleware/auth');
const database = require('../../backend/config/database');

// 將資料庫回傳的欄位統一成前端所需格式
function mapWallet(w) {
  if (!w) return { balance: 0, lastClaimAt: null };
  const lastRaw = w.lastClaimAt ?? w.last_claim_at ?? null;
  const toISO = (v) => {
    try {
      if (!v) return null;
      const d = new Date(v);
      if (isNaN(d.getTime())) return null;
      return d.toISOString();
    } catch {
      return null;
    }
  };
  return {
    balance: Number(w.balance) || 0,
    lastClaimAt: toISO(lastRaw)
  };
}

// 管理員發放 CRCRCoin 給指定用戶
module.exports = async (req, res) => {
  console.log('✅ /api/coin/grant 專用路由被調用');
  console.log('🔍 請求方法:', req.method);
  console.log('🔍 請求 URL:', req.url);
  
  // 只允許 POST 請求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 手動執行中���件
    await new Promise((resolve, reject) => {
      authenticateToken(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    await new Promise((resolve, reject) => {
      requireAdmin(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

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
    console.log('🔍 首次查找結果:', user);
    
    if (!user && rawEmail.toLowerCase() !== rawEmail) {
      console.log('🔍 嘗試使用小寫電子郵件查找:', rawEmail.toLowerCase());
      user = await database.getUserByUsername(rawEmail.toLowerCase());
      console.log('🔍 第二次查找結果:', user);
    }

    if (!user) {
      console.log('❌ 找不到用戶:', rawEmail);
      return res.status(404).json({ error: '找不到該用戶，請確認電子郵件是否正確' });
    }

    console.log('🔍 用戶信息:', { id: user.id, username: user.username });
    console.log('🔍 管理員信息:', { id: req.user.id, username: req.user.username });

    const result = parsedAmount > 0
      ? await database.addCoins(user.id, parsedAmount, `管理員發放 (${req.user.username || req.user.id})`)
      : await database.spendCoins(user.id, Math.abs(parsedAmount), `管理員扣除 (${req.user.username || req.user.id})`);

    console.log('🔍 數據庫操作結果:', result);

    if (!result?.success) {
      console.log('❌ 數據庫操作失敗:', result?.error);
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
};