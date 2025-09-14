const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');
const database = require('../config/database');

const router = express.Router();

function keyFor(uid) {
  return `profile:${uid}`;
}

router.get('/', authenticateToken, async (req, res) => {
  try {
    const key = keyFor(req.user.id);
    const json = await database.getSiteSetting(key);
    let profile = {};
    try { profile = json ? JSON.parse(json) : {}; } catch {}
    res.json({
      id: req.user.id,
      email: req.user.username,
      name: profile.name || req.user.name || '',
      picture: profile.picture || req.user.picture || ''
    });
  } catch (e) {
    res.status(500).json({ error: '?–å??‹äººè³‡æ?å¤±æ?' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, picture } = req.body || {};
    const key = keyFor(req.user.id);
    const json = await database.getSiteSetting(key);
    let profile = {};
    try { profile = json ? JSON.parse(json) : {}; } catch {}
    const next = {
      ...profile,
      ...(name !== undefined ? { name: String(name || '').trim() } : {}),
      ...(picture !== undefined ? { picture: String(picture || '') } : {}),
    };
    const oldPic = profile.picture; await database.setSiteSetting(key, JSON.stringify(next)); try { if (oldPic && oldPic !== next.picture && typeof oldPic === 'string' && oldPic.startsWith('/uploads/avatars/')) { const file = require('path').join(require('path').join(__dirname, '../uploads/avatars'), require('path').basename(oldPic)); if (require('fs').existsSync(file)) require('fs').unlinkSync(file); } } catch {}
    res.json({ success: true, profile: next });
  } catch (e) {
    res.status(500).json({ error: '?´æ–°?‹äººè³‡æ?å¤±æ?' });
  }
});

const uploadDir = path.join(__dirname, '../uploads/avatars');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || '.png';
    const fname = `u${req.user.id}_${Date.now()}${ext}`;
    cb(null, fname);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 512 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) return cb(null, true);
    cb(new Error('?…å?è¨±å??‡æ?æ¡?));
  }
});

router.post('/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'æ²’æ?ä¸Šå‚³æª”æ?' });
    const url = `/uploads/avatars/${req.file.filename}`;
    const key = keyFor(req.user.id);
    const json = await database.getSiteSetting(key);
    let profile = {};
    try { profile = json ? JSON.parse(json) : {}; } catch {}
    const oldPic = profile.picture; profile.picture = url; await database.setSiteSetting(key, JSON.stringify(profile)); try { if (oldPic && typeof oldPic === 'string' && oldPic.startsWith('/uploads/avatars/') && oldPic !== url) { const fp = require('path').join(require('path').join(__dirname, '../uploads/avatars'), require('path').basename(oldPic)); if (require('fs').existsSync(fp)) require('fs').unlinkSync(fp); } } catch {}
    res.json({ success: true, url });
  } catch (e) {
    res.status(500).json({ error: 'ä¸Šå‚³?­å?å¤±æ?' });
  }
});

module.exports = router;



