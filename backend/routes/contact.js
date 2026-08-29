const express = require('express');
const rateLimit = require('express-rate-limit');
const database = require('../config/database');
const {
  authenticateToken,
  authenticateTokenOptional,
  requireAdmin
} = require('../middleware/auth');

const router = express.Router();

const CONTACT_CATEGORIES = new Set([
  'website',
  'account',
  'shop',
  'redeem',
  'discord',
  'collaboration',
  'other'
]);
const CONTACT_STATUSES = new Set(['new', 'in_progress', 'replied', 'closed']);
const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024;

const contactSubmissionLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '短時間內送出的訊息太多，請稍後再試' }
});

const cleanText = (value, maxLength) =>
  String(value || '')
    .replace(/\u0000/g, '')
    .trim()
    .slice(0, maxLength);

const normalizeEmail = (value) => cleanText(value, 254).toLowerCase();
const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const parseAttachment = (attachment) => {
  if (!attachment) return null;

  const name = cleanText(attachment.name, 180);
  const data = String(attachment.data || '');
  const match = data.match(/^data:(image\/(?:png|jpeg));base64,([A-Za-z0-9+/=]+)$/i);

  if (!name || !match) {
    const error = new Error('截圖只支援 PNG 或 JPG 格式');
    error.statusCode = 400;
    throw error;
  }

  const fileBuffer = Buffer.from(match[2], 'base64');
  const byteLength = fileBuffer.length;
  if (!byteLength || byteLength > MAX_ATTACHMENT_BYTES) {
    const error = new Error('截圖大小不可超過 2MB');
    error.statusCode = 400;
    throw error;
  }

  const mime = match[1].toLowerCase();
  const isPng =
    fileBuffer.length >= 8 &&
    fileBuffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isJpeg =
    fileBuffer.length >= 3 &&
    fileBuffer[0] === 0xff &&
    fileBuffer[1] === 0xd8 &&
    fileBuffer[2] === 0xff;

  if ((mime === 'image/png' && !isPng) || (mime === 'image/jpeg' && !isJpeg)) {
    const error = new Error('截圖內容與圖片格式不符');
    error.statusCode = 400;
    throw error;
  }

  return {
    name,
    mime,
    data
  };
};

router.post('/', contactSubmissionLimiter, authenticateTokenOptional, async (req, res) => {
  try {
    // 隱藏欄位有內容時視為自動填寫程式，仍回傳成功以避免反覆嘗試。
    if (cleanText(req.body.website, 200)) {
      return res.status(201).json({
        success: true,
        ticket: { reference: 'CR-RECEIVED', status: 'new' }
      });
    }

    const senderName = cleanText(req.body.name, 100);
    const senderEmail = normalizeEmail(req.body.email);
    const category = cleanText(req.body.category, 40).toLowerCase();
    const subject = cleanText(req.body.subject, 150);
    const message = cleanText(req.body.message, 2000);
    const safetyConfirmed = req.body.safetyConfirmed === true;

    if (senderName.length < 2) {
      return res.status(400).json({ error: '稱呼至少需要 2 個字元', field: 'name' });
    }
    if (!isValidEmail(senderEmail)) {
      return res.status(400).json({ error: '請輸入正確的回覆信箱', field: 'email' });
    }
    if (!CONTACT_CATEGORIES.has(category)) {
      return res.status(400).json({ error: '請選擇問題類型', field: 'category' });
    }
    if (subject.length < 4) {
      return res.status(400).json({ error: '主旨至少需要 4 個字元', field: 'subject' });
    }
    if (message.length < 10) {
      return res.status(400).json({ error: '詳細內容至少需要 10 個字元', field: 'message' });
    }
    if (!safetyConfirmed) {
      return res.status(400).json({ error: '請先確認內容不包含敏感資料', field: 'safetyConfirmed' });
    }

    const attachment = parseAttachment(req.body.attachment);
    const ticket = await database.createContactMessage({
      userId: req.user?.id || null,
      senderName,
      senderEmail,
      category,
      subject,
      message,
      attachment,
      sourcePage: cleanText(req.body.sourcePage, 500),
      colorMode: cleanText(req.body.colorMode, 20),
      effectMode: cleanText(req.body.effectMode, 20)
    });

    return res.status(201).json({
      success: true,
      ticket: {
        reference: ticket.reference_code,
        status: ticket.status,
        createdAt: ticket.created_at
      }
    });
  } catch (error) {
    console.error('建立聯絡訊息失敗:', error);
    return res.status(error.statusCode || 500).json({
      error: error.statusCode ? error.message : '目前無法送出訊息，請稍後再試'
    });
  }
});

router.get('/admin', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const messages = await database.getContactMessages({
      status: cleanText(req.query.status, 30).toLowerCase(),
      category: cleanText(req.query.category, 40).toLowerCase(),
      search: cleanText(req.query.search, 120),
      limit: Math.max(1, Math.min(300, Number(req.query.limit) || 150))
    });

    res.json({ messages });
  } catch (error) {
    console.error('取得聯絡訊息失敗:', error);
    res.status(500).json({ error: '無法取得聯絡訊息' });
  }
});

router.get('/admin/:messageId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const message = await database.getContactMessageById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ error: '找不到聯絡訊息' });
    }

    const updated = await database.markContactMessageRead(message.id);
    return res.json({ message: updated || message });
  } catch (error) {
    console.error('取得聯絡訊息內容失敗:', error);
    return res.status(500).json({ error: '無法取得聯絡訊息內容' });
  }
});

router.patch('/admin/:messageId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const current = await database.getContactMessageById(req.params.messageId);
    if (!current) {
      return res.status(404).json({ error: '找不到聯絡訊息' });
    }

    const status = cleanText(req.body.status, 30).toLowerCase();
    const reply = cleanText(req.body.reply, 4000);

    if (status && !CONTACT_STATUSES.has(status)) {
      return res.status(400).json({ error: '處理狀態不正確' });
    }
    if ((status === 'replied' || reply) && reply.length < 2) {
      return res.status(400).json({ error: '回覆內容至少需要 2 個字元' });
    }

    const message = await database.updateContactMessage(req.params.messageId, {
      status: reply ? 'replied' : (status || current.status),
      reply: reply || undefined,
      adminId: req.user.id
    });

    return res.json({ success: true, message });
  } catch (error) {
    console.error('更新聯絡訊息失敗:', error);
    return res.status(500).json({ error: '無法更新聯絡訊息' });
  }
});

module.exports = router;
