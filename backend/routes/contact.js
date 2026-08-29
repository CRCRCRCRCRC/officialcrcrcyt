const express = require('express');
const rateLimit = require('express-rate-limit');
const database = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const CONTACT_STATUSES = new Set(['open', 'closed']);

const messageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '短時間內傳送的訊息太多，請稍後再試' }
});

const parseMessage = (value) => {
  const message = String(value || '').replace(/\u0000/g, '').trim();
  if (!message) {
    const error = new Error('請輸入訊息內容');
    error.statusCode = 400;
    throw error;
  }
  if (message.length > 2000) {
    const error = new Error('每則訊息最多 2000 個字元');
    error.statusCode = 400;
    throw error;
  }
  return message;
};

// 使用者讀取自己與管理員的站內對話。
router.get('/conversation', authenticateToken, async (req, res) => {
  try {
    const conversation = await database.getContactConversationForUser(req.user.id);
    if (!conversation) {
      return res.json({ conversation: null, messages: [] });
    }

    const messages = await database.getContactChatMessages(conversation.id, 300);
    const updated = await database.markContactConversationRead(conversation.id, 'user');
    return res.json({ conversation: updated || conversation, messages });
  } catch (error) {
    console.error('取得站內私訊失敗:', error);
    return res.status(500).json({ error: '無法取得站內私訊' });
  }
});

// 使用者傳訊息給管理員；第一次傳送時自動建立對話。
router.post('/messages', messageLimiter, authenticateToken, async (req, res) => {
  try {
    const body = parseMessage(req.body.message);
    const conversation = await database.getOrCreateContactConversation(req.user.id);
    const message = await database.addContactChatMessage({
      conversationId: conversation.id,
      senderId: req.user.id,
      senderRole: 'user',
      body
    });

    return res.status(201).json({ success: true, conversation, message });
  } catch (error) {
    console.error('傳送站內私訊失敗:', error);
    return res.status(error.statusCode || 500).json({
      error: error.statusCode ? error.message : '目前無法傳送訊息'
    });
  }
});

// 管理員取得所有使用者對話。
router.get('/admin/conversations', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const conversations = await database.listContactConversations({
      search: String(req.query.search || '').trim().slice(0, 120),
      limit: Math.max(1, Math.min(300, Number(req.query.limit) || 150))
    });
    return res.json({ conversations });
  } catch (error) {
    console.error('取得站內私訊列表失敗:', error);
    return res.status(500).json({ error: '無法取得站內私訊列表' });
  }
});

// 管理員開啟單一對話。
router.get('/admin/conversations/:conversationId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const conversation = await database.getContactConversationById(req.params.conversationId);
    if (!conversation) {
      return res.status(404).json({ error: '找不到這個對話' });
    }

    const messages = await database.getContactChatMessages(conversation.id, 500);
    const updated = await database.markContactConversationRead(conversation.id, 'admin');
    return res.json({ conversation: updated || conversation, messages });
  } catch (error) {
    console.error('取得站內私訊內容失敗:', error);
    return res.status(500).json({ error: '無法取得站內私訊內容' });
  }
});

// 管理員直接使用管理員帳號回覆使用者。
router.post('/admin/conversations/:conversationId/messages', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const conversation = await database.getContactConversationById(req.params.conversationId);
    if (!conversation) {
      return res.status(404).json({ error: '找不到這個對話' });
    }

    const body = parseMessage(req.body.message);
    const message = await database.addContactChatMessage({
      conversationId: conversation.id,
      senderId: req.user.id,
      senderRole: 'admin',
      body
    });
    return res.status(201).json({ success: true, message });
  } catch (error) {
    console.error('回覆站內私訊失敗:', error);
    return res.status(error.statusCode || 500).json({
      error: error.statusCode ? error.message : '目前無法回覆訊息'
    });
  }
});

router.patch('/admin/conversations/:conversationId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const status = String(req.body.status || '').trim().toLowerCase();
    if (!CONTACT_STATUSES.has(status)) {
      return res.status(400).json({ error: '對話狀態不正確' });
    }
    const conversation = await database.setContactConversationStatus(
      req.params.conversationId,
      status
    );
    if (!conversation) {
      return res.status(404).json({ error: '找不到這個對話' });
    }
    return res.json({ success: true, conversation });
  } catch (error) {
    console.error('更新站內私訊狀態失敗:', error);
    return res.status(500).json({ error: '無法更新對話狀態' });
  }
});

module.exports = router;
